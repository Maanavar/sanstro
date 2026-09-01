from __future__ import annotations

import hashlib
import logging
import secrets
import urllib.parse
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import bcrypt
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.auth import (
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_PASSWORD_RESET,
    create_access_token,
    decode_token,
    get_current_user,
    require_csrf_header,
)
from app.core.auth_throttle import AuthThrottleAction, get_auth_throttler
from app.core.config import Settings, get_settings
from app.core.subscription import is_premium
from app.db.session import get_db
from app.middleware import resolve_client_ip
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.auth import (
    AccountDeletionResult,
    AuthProvidersResponse,
    AuthUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    UpdateUserSettingsRequest,
)
from app.services.email_service import (
    enqueue_existing_account_registration_email,
    enqueue_password_reset_email,
)

router = APIRouter()
_COOKIE_NAME = "vinaadi_token"
_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24
_PASSWORD_RESET_TTL = timedelta(minutes=15)
_OAUTH_STATE_COOKIE = "vinaadi_oauth_state"
_OAUTH_STATE_MAX_AGE_SECONDS = 5 * 60
_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
_REGISTER_NEUTRAL_DETAIL = "If this email can be used, your account is ready. Please sign in to continue."
_RESET_NEUTRAL_DETAIL = "If an account exists for this email, you will receive a password reset link shortly."
_logger = logging.getLogger(__name__)
_throttler = get_auth_throttler()


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, respecting proxy configuration."""
    settings = get_settings()
    trusted_proxy_count = max(0, int(settings.trusted_proxy_count))
    return resolve_client_ip(request, trusted_proxy_count)


def _assert_not_suspended(user: User) -> None:
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Contact support.",
        )


def _require_user_email(user: User) -> str:
    if user.email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return user.email


def _set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=_COOKIE_MAX_AGE_SECONDS,
        path="/",
    )


def _google_oauth_configured(settings: Settings) -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def _google_redirect_uri(settings: Settings) -> str:
    if settings.google_oauth_redirect_uri:
        return settings.google_oauth_redirect_uri
    return f"{settings.frontend_url.rstrip('/')}/api/backend/api/v1/auth/oauth/google/callback"


def _google_exchange_code_for_token(code: str, redirect_uri: str, settings: Settings) -> str | None:
    """Exchanges an OAuth authorization code for a Google access token. Split out
    from the callback route so tests can patch just the network call."""
    with httpx.Client(timeout=10.0) as client:
        token_res = client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_res.raise_for_status()
        return token_res.json().get("access_token")


def _google_fetch_userinfo(access_token: str) -> dict:
    """Fetches the Google userinfo payload for an access token. Split out from
    the callback route so tests can patch just the network call."""
    with httpx.Client(timeout=10.0) as client:
        userinfo_res = client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo_res.raise_for_status()
        return userinfo_res.json()


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def _hash_jti(jti: str) -> str:
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _tier_for(user_id: UUID, session: Session) -> str:
    """The tier name clients gate on, derived live from the subscription table.

    Never a stored flag on the user — premium is a fact about an active
    subscription row, and duplicating it onto the user is how the two drift
    apart (GROWTH_FEATURES.md decision #8).
    """
    return "premium" if is_premium(user_id, session) else "registered"


def _build_auth_user_response(
    user: User, fallback_email: str | None = None, *, session: Session | None = None
) -> AuthUserResponse:
    return AuthUserResponse(
        userId=str(user.user_id),
        email=user.email or fallback_email or "",
        userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
        goalTrack=getattr(user, "goal_track", None),
        tier=_tier_for(user.user_id, session) if session is not None else "registered",
    )


def _issue_access_token_for_user(user: User) -> str:
    return create_access_token(
        subject=str(user.user_id),
        token_version=int(getattr(user, "token_version", 0) or 0),
    )


def _issue_password_reset_token(session: Session, user: User) -> str:
    jti = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + _PASSWORD_RESET_TTL
    session.add(
        PasswordResetToken(
            user_id=user.user_id,
            jti_hash=_hash_jti(jti),
            expires_at=expires_at,
        )
    )
    return create_access_token(
        subject=str(user.user_id),
        expires_delta=_PASSWORD_RESET_TTL,
        token_type=TOKEN_TYPE_PASSWORD_RESET,
        jti=jti,
    )


def _advance_token_version(user: User) -> None:
    user.token_version = int(getattr(user, "token_version", 0) or 0) + 1


def _revoke_refresh_tokens(session: Session, user: User, now: datetime) -> None:
    session.query(RefreshToken).filter(
        RefreshToken.user_id == user.user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({"revoked_at": now}, synchronize_session=False)


def _request_token(request: Request) -> str | None:
    authorization = request.headers.get("authorization")
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return request.cookies.get(_COOKIE_NAME)


def _resolve_user_from_sub(session: Session, sub: str) -> User | None:
    try:
        uid = UUID(sub)
    except ValueError:
        return session.query(User).filter(User.email == sub).first() if "@" in sub else None
    return session.get(User, uid)


def _revoke_presented_access_token(request: Request, session: Session) -> None:
    token = _request_token(request)
    if token is None:
        return
    try:
        payload = decode_token(token)
    except HTTPException:
        return
    if payload.get("typ", TOKEN_TYPE_ACCESS) != TOKEN_TYPE_ACCESS:
        return
    sub = payload.get("sub")
    if not sub:
        return
    user = _resolve_user_from_sub(session, str(sub))
    if user is None:
        return
    if int(payload.get("ver", 0) or 0) != int(getattr(user, "token_version", 0) or 0):
        return
    _advance_token_version(user)


def _invalid_reset_token() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired reset token.")


@router.post("/register", response_model=RegisterResponse)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    session: Session = Depends(get_db),
) -> RegisterResponse:
    client_ip = _get_client_ip(request)

    allowed, retry_after = _throttler.check(
        AuthThrottleAction.REGISTER,
        ip=client_ip,
        account_identifier=payload.email.lower(),
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    existing = session.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        # Match the bcrypt work done for new registrations so duplicate attempts are
        # not an obvious timing oracle, then notify the account owner out-of-band.
        _hash_password(payload.password)
        if existing.email:
            enqueue_existing_account_registration_email(background_tasks, existing.email)
        return RegisterResponse(detail=_REGISTER_NEUTRAL_DETAIL)

    user = User(
        user_id=uuid4(),
        email=payload.email,
        hashed_password=_hash_password(payload.password),
    )
    session.add(user)
    session.flush()
    return RegisterResponse(detail=_REGISTER_NEUTRAL_DETAIL)


@router.post("/login", response_model=AuthUserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    session: Session = Depends(get_db),
) -> AuthUserResponse:
    client_ip = _get_client_ip(request)

    allowed, retry_after = _throttler.check(
        AuthThrottleAction.LOGIN,
        ip=client_ip,
        account_identifier=payload.email.lower(),
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    user = session.query(User).filter(User.email == payload.email).first()
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    if user is None or not user.hashed_password:
        raise invalid_credentials
    if not _verify_password(payload.password, user.hashed_password):
        raise invalid_credentials
    _assert_not_suspended(user)

    token = _issue_access_token_for_user(user)
    _set_auth_cookie(response, token)
    return _build_auth_user_response(user, payload.email, session=session)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_csrf_header)])
def logout(
    response: Response,
    request: Request,
    session: Session = Depends(get_db),
) -> Response:
    _revoke_presented_access_token(request, session)
    response.delete_cookie(key=_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=AuthUserResponse)
def me(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> AuthUserResponse:
    email = _require_user_email(user)
    pref = session.query(UserPreference).filter_by(owner_user_id=user.user_id).first()
    lang = getattr(pref, "dashboard_lang", "en") if pref else "en"

    return AuthUserResponse(
        userId=str(user.user_id),
        email=email,
        userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
        goalTrack=getattr(user, "goal_track", None),
        lang=lang,
        tier=_tier_for(user.user_id, session),
    )


@router.patch("/me", response_model=AuthUserResponse, dependencies=[Depends(require_csrf_header)])
def patch_me(
    payload: UpdateUserSettingsRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AuthUserResponse:
    email = _require_user_email(user)

    if payload.user_mode is not None:
        user.user_mode = payload.user_mode
    if payload.goal_track is not None:
        user.goal_track = payload.goal_track
    session.flush()

    return AuthUserResponse(
        userId=str(user.user_id),
        email=email,
        userMode=user.user_mode or "BALANCED",
        goalTrack=user.goal_track,
        tier=_tier_for(user.user_id, session),
    )


@router.delete(
    "/me",
    response_model=AccountDeletionResult,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_csrf_header)],
)
def delete_my_account(
    response: Response,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AccountDeletionResult:
    """Permanently erase all user data and delete the account."""
    uid = str(user.user_id)

    session.execute(text("""
        DELETE FROM interpretation_outputs
        WHERE chart_id IN (
            SELECT c.chart_id
            FROM charts c
            JOIN birth_profiles bp ON c.birth_profile_id = bp.birth_profile_id
            WHERE bp.owner_user_id = :uid
        )
        OR family_vault_id IN (
            SELECT family_vault_id FROM family_vaults WHERE owner_user_id = :uid
        )
    """), {"uid": uid})

    session.delete(user)
    session.flush()

    _logger.info("account_erasure_complete user_id=%s", uid)
    response.delete_cookie(key=_COOKIE_NAME, path="/")
    return AccountDeletionResult(detail="Account permanently deleted.")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@router.post("/reset-password/request", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    session: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    client_ip = _get_client_ip(request)

    allowed, retry_after = _throttler.check(
        AuthThrottleAction.FORGOT_PASSWORD,
        ip=client_ip,
        account_identifier=payload.email.lower(),
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    user = session.query(User).filter(User.email == payload.email).first()
    if user and user.email:
        reset_token = _issue_password_reset_token(session, user)
        enqueue_password_reset_email(background_tasks, user.email, reset_token)
    return ForgotPasswordResponse(detail=_RESET_NEUTRAL_DETAIL)


@router.post("/reset-password", response_model=ForgotPasswordResponse)
@router.post("/reset-password/confirm", response_model=ForgotPasswordResponse)
def reset_password(
    payload: ResetPasswordRequest,
    response: Response,
    session: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    try:
        token_payload = decode_token(payload.token)
    except HTTPException as exc:
        raise _invalid_reset_token() from exc

    if token_payload.get("typ") != TOKEN_TYPE_PASSWORD_RESET:
        raise _invalid_reset_token()

    sub = token_payload.get("sub")
    jti = token_payload.get("jti")
    if not sub or not jti:
        raise _invalid_reset_token()

    try:
        user_id = UUID(str(sub))
    except ValueError as exc:
        raise _invalid_reset_token() from exc

    row = session.query(PasswordResetToken).filter(PasswordResetToken.jti_hash == _hash_jti(str(jti))).first()
    now = datetime.now(UTC)
    if row is None or row.user_id != user_id or row.used_at is not None or _as_utc(row.expires_at) <= now:
        raise _invalid_reset_token()

    user = session.get(User, row.user_id)
    if user is None:
        raise _invalid_reset_token()

    user.hashed_password = _hash_password(payload.password)
    _advance_token_version(user)
    _revoke_refresh_tokens(session, user, now)
    session.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now}, synchronize_session=False)
    response.delete_cookie(key=_COOKIE_NAME, path="/")
    return ForgotPasswordResponse(detail="Password updated. Please sign in again.")


# ── Google SSO (#55) ──────────────────────────────────────────────────────
# Scaffolded ahead of real credentials: every route below degrades to a clear
# error until JOTHIDAM_GOOGLE_CLIENT_ID / JOTHIDAM_GOOGLE_CLIENT_SECRET are set
# (see app/core/config.py). The frontend calls GET /oauth/providers first and
# only renders the "Continue with Google" button when it reports enabled.


@router.get("/oauth/providers", response_model=AuthProvidersResponse)
def oauth_providers() -> AuthProvidersResponse:
    settings = get_settings()
    return AuthProvidersResponse(google=_google_oauth_configured(settings))


@router.get("/oauth/google/start")
def oauth_google_start(request: Request, response: Response) -> RedirectResponse:
    settings = get_settings()
    if not _google_oauth_configured(settings):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in isn't configured yet.",
        )

    client_ip = _get_client_ip(request)
    allowed, retry_after = _throttler.check(AuthThrottleAction.OAUTH, ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many sign-in attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _google_redirect_uri(settings),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    redirect = RedirectResponse(url=f"{_GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}")
    redirect.set_cookie(
        key=_OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=_OAUTH_STATE_MAX_AGE_SECONDS,
        path="/",
    )
    return redirect


@router.get("/oauth/google/callback")
def oauth_google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: Session = Depends(get_db),
) -> RedirectResponse:
    settings = get_settings()
    login_error_redirect = RedirectResponse(url=f"{settings.frontend_url.rstrip('/')}/login?error=oauth_failed")
    login_error_redirect.delete_cookie(key=_OAUTH_STATE_COOKIE, path="/")

    if not _google_oauth_configured(settings) or error:
        return login_error_redirect

    client_ip = _get_client_ip(request)
    allowed, retry_after = _throttler.check(AuthThrottleAction.OAUTH, ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many sign-in attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    cookie_state = request.cookies.get(_OAUTH_STATE_COOKIE)
    if not code or not state or not cookie_state or state != cookie_state:
        return login_error_redirect

    try:
        access_token = _google_exchange_code_for_token(code, _google_redirect_uri(settings), settings)
        if not access_token:
            return login_error_redirect
        userinfo = _google_fetch_userinfo(access_token)
    except httpx.HTTPError:
        _logger.warning("Google OAuth token/userinfo exchange failed", exc_info=True)
        return login_error_redirect

    google_sub = userinfo.get("sub")
    email = userinfo.get("email")
    email_verified = bool(userinfo.get("email_verified"))
    if not google_sub or not email or not email_verified:
        return login_error_redirect
    email = email.strip().lower()

    user = session.query(User).filter(User.google_sub == google_sub).first()
    if user is None:
        # Link to an existing password account with the same (Google-verified)
        # email, rather than creating a duplicate — matches the register flow's
        # existing-account handling.
        user = session.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_sub = google_sub
        else:
            user = User(user_id=uuid4(), email=email, google_sub=google_sub)
            session.add(user)
        session.flush()

    if user.is_suspended:
        return login_error_redirect

    token = _issue_access_token_for_user(user)
    success_redirect = RedirectResponse(url=f"{settings.frontend_url.rstrip('/')}/dashboard")
    success_redirect.delete_cookie(key=_OAUTH_STATE_COOKIE, path="/")
    _set_auth_cookie(success_redirect, token)
    return success_redirect

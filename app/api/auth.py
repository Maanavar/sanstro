from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import bcrypt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
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
from app.core.config import get_settings
from app.db.session import get_db
from app.middleware import resolve_client_ip
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.auth import (
    AccountDeletionResult,
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


def _build_auth_user_response(user: User, fallback_email: str | None = None) -> AuthUserResponse:
    return AuthUserResponse(
        userId=str(user.user_id),
        email=user.email or fallback_email or "",
        userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
        goalTrack=getattr(user, "goal_track", None),
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
    return _build_auth_user_response(user, payload.email)


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
    lang = getattr(pref, "dashboard_lang", "ta") if pref else "ta"

    return AuthUserResponse(
        userId=str(user.user_id),
        email=email,
        userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
        goalTrack=getattr(user, "goal_track", None),
        lang=lang,
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
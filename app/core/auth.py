"""JWT authentication layer for Vinaadi AI.

Design:
- Stateless HS256 JWTs. The secret lives in JOTHIDAM_JWT_SECRET, or in
  JOTHIDAM_JWT_SECRETS (newest first) while a rotation is in flight; signing and
  verification both go through app/core/jwt_keys.py, which is the only place in
  the app that calls jwt.decode.
- `get_current_user` extracts and validates the Bearer token, then resolves
  (or auto-creates) the User row so every downstream handler gets a real UUID.
- `get_admin_user` additionally checks X-Admin-Key header against
  JOTHIDAM_ADMIN_API_KEY for the /admin/* endpoints.
- Token creation helper `create_access_token` is provided for tests and for
  a future /auth/token endpoint.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from hmac import compare_digest
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.jwt_keys import decode_jwt_payload, signing_secret
from app.core.presence import touch_last_seen
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
_MUTATING_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
_CSRF_HEADER_VALUE = "1"
TOKEN_TYPE_ACCESS = "access"  # noqa: S105 — a JWT `typ` discriminator, not a credential
TOKEN_TYPE_PASSWORD_RESET = "pwreset"  # noqa: S105 — a JWT `typ` discriminator, not a credential
TOKEN_TYPE_ADMIN_ELEVATION = "admin_elev"  # noqa: S105 — a JWT `typ` discriminator, not a credential
TOKEN_TYPE_EMAIL_VERIFY = "email_verify"  # noqa: S105 — a JWT `typ` discriminator, not a credential

# Header carrying the elevation token. Deliberately NOT Authorization: the
# elevation token never replaces the session, it accompanies it, and both are
# checked. A caller holding only this proves nothing.
ADMIN_ELEVATION_HEADER = "X-Admin-Elevation"  # noqa: S105 — a header name, not a credential

# Sent as the `detail` when elevation is missing or spent, so the console can
# tell "you may not do this at all" (plain 403) apart from "you may, but you must
# re-authenticate first" and prompt for a password rather than showing a dead end.
ADMIN_ELEVATION_REQUIRED_DETAIL = "Admin elevation required for this operation."


# ── Token helpers ─────────────────────────────────────────────────────────────


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    *,
    token_type: str = TOKEN_TYPE_ACCESS,
    token_version: int = 0,
    jti: str | None = None,
) -> str:
    """Create a signed JWT for the given subject (user_id or email)."""
    settings = get_settings()
    secret = signing_secret()
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    payload: dict[str, object] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "typ": token_type,
        "ver": token_version,
    }
    if jti is not None:
        payload["jti"] = jti
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on any failure."""
    try:
        return decode_jwt_payload(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

def _require_access_token(payload: dict) -> None:
    token_type = payload.get("typ", TOKEN_TYPE_ACCESS)
    if token_type != TOKEN_TYPE_ACCESS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not valid for API access.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _payload_token_version(payload: dict) -> int:
    try:
        return int(payload.get("ver", 0))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token version.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

# ── FastAPI dependencies ───────────────────────────────────────────────────────


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    vinaadi_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
    x_vinaadi_client: Annotated[str | None, Header()] = None,
    x_client_language: Annotated[str | None, Header()] = None,
) -> User:
    """Validate JWT and return the corresponding User row.

    Supports either:
    - Authorization header Bearer token
    - `vinaadi_token` httpOnly cookie

    The JWT `sub` claim may be:
    - A UUID string  → looked up directly as user_id.
    - An email string → looked up by email.

    Also stamps `users.last_seen_on` (spec §8 "active user"), which is why the
    two client headers are read here: this is the one dependency every
    authenticated request passes through, so it is the only place the stamp
    cannot be forgotten by a new route. See `app.core.presence` —
    it writes at most once per account per IST day, in its own transaction, and
    never raises.

    `X-Vinaadi-Client` is the header the consent ledger already uses for "which
    client is this" (`app.privacy.consent.CLIENT_HEADER`); reusing it keeps one
    answer per request instead of two headers that can disagree.
    """
    token: str | None = credentials.credentials if credentials is not None else None
    if token is None:
        token = vinaadi_token
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    _require_access_token(payload)
    sub: str | None = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject.")

    # Determine uid and email from sub
    try:
        uid = UUID(sub)
        email: str | None = None
    except ValueError:
        uid = None
        email = sub if "@" in sub else None

    user: User | None = None

    if uid is not None:
        user = db.get(User, uid)
    elif email:
        user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not resolve user.")
    if _payload_token_version(payload) != int(getattr(user, "token_version", 0) or 0):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Contact support.",
        )

    # After the suspension check on purpose: a suspended account is not an
    # active user, and counting it would inflate DAU with people who cannot
    # reach the product.
    touch_last_seen(user.user_id, platform=x_vinaadi_client, language=x_client_language)

    return user


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    vinaadi_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None instead of raising for missing/invalid credentials.

    Use this for endpoints that work for both guests and authenticated users.
    """
    token: str | None = credentials.credentials if credentials is not None else None
    if token is None:
        token = vinaadi_token
    if token is None:
        return None
    try:
        payload = decode_token(token)
    except HTTPException:
        return None
    if payload.get("typ", TOKEN_TYPE_ACCESS) != TOKEN_TYPE_ACCESS:
        return None
    sub: str | None = payload.get("sub")
    if not sub:
        return None
    try:
        uid = UUID(sub)
        user: User | None = db.get(User, uid)
    except ValueError:
        email = sub if "@" in sub else None
        user = db.query(User).filter(User.email == email).first() if email else None
    if user is None or user.is_suspended:
        return None
    try:
        ver = int(payload.get("ver", 0))
    except (TypeError, ValueError):
        return None
    if ver != int(getattr(user, "token_version", 0) or 0):
        return None
    return user


#: Every admin role (admin spec L3). Permissions live in app/core/permissions.py;
#: the names live here because this module decides who is an admin at all.
ADMIN_ROLES: tuple[str, ...] = ("owner", "support", "ops", "privacy", "viewer", "astrologer")

#: An admin session older than this must sign in again (spec L3), whatever the
#: session token's own lifetime. A day-long consumer session is fine for reading
#: a jadhagam; it is too long to hold erase and refund buttons.
ADMIN_SESSION_MAX_AGE = timedelta(hours=8)

#: `detail` for an admin who has not finished TOTP enrolment. The console reads
#: it to show the enrolment screen instead of a dead end.
ADMIN_MFA_REQUIRED_DETAIL = "mfa_required"
ADMIN_SESSION_EXPIRED_DETAIL = "Admin session expired. Please sign in again."


def admin_role_of(user: User) -> str | None:
    """The user's admin role, or None.

    `is_admin` is the pre-roles column. The migration backfilled every such row
    to 'owner', and the role service keeps the two in step, so reading it as
    owner here only covers a row written by older code mid-rollout.
    """
    role = getattr(user, "admin_role", None)
    if role in ADMIN_ROLES:
        return role
    if getattr(user, "is_admin", False):
        return "owner"
    return None


def is_admin_user(user: User) -> bool:
    """True when the account holds an admin role.

    JOTHIDAM_ADMIN_EMAILS no longer grants anything here. It used to make any
    account registered with a listed address an admin on every request — so
    whoever registered that address first, verified or not, held the console.
    It now seeds the first owner once at startup, for an existing verified
    account only (`app/services/admin_roles_service.seed_owner_from_env`).
    """
    return admin_role_of(user) is not None


def _looks_browser_originated(request: Request) -> bool:
    """True when this request was made by a page in a browser.

    `Origin` and `Referer` are set by the browser itself and cannot be forged by
    page JavaScript — `fetch` refuses to set either — so their presence is a
    reliable signal in the direction that matters here. A server-to-server
    caller has no reason to send them.
    """
    return bool(request.headers.get("origin") or request.headers.get("referer"))


def _admin_key_matches(x_admin_key: str | None) -> bool:
    """True when the header carries the configured server-to-server admin key."""
    settings = get_settings()
    return (
        settings.admin_api_key is not None
        and x_admin_key is not None
        and compare_digest(x_admin_key, settings.admin_api_key)
    )


def _request_session_token(request: Request) -> str | None:
    header = request.headers.get("authorization") or ""
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return request.cookies.get("vinaadi_token")


def _enforce_admin_session_age(request: Request) -> None:
    """401 when the session token was issued more than ADMIN_SESSION_MAX_AGE ago."""
    token = _request_session_token(request)
    if token is None:
        return  # dependency overrides in tests; get_current_user already required one
    try:
        issued = decode_token(token).get("iat")
    except HTTPException:
        return  # get_current_user already validated this token; nothing new to say
    if issued is None:
        return
    issued_at = datetime.fromtimestamp(int(issued), tz=UTC)
    if datetime.now(UTC) - issued_at > ADMIN_SESSION_MAX_AGE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ADMIN_SESSION_EXPIRED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )


def _has_confirmed_mfa(db: Session, user: User) -> bool:
    from app.models.admin_mfa import AdminMfaCredential

    credential = db.get(AdminMfaCredential, user.user_id)
    return credential is not None and credential.confirmed_at is not None


def _resolve_admin(
    request: Request,
    current_user: User,
    x_admin_key: str | None,
    db: Session,
    *,
    require_mfa: bool,
) -> User:
    request.state.admin_via_key = False
    if is_admin_user(current_user):
        _enforce_admin_session_age(request)
        if require_mfa and not _has_confirmed_mfa(db, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ADMIN_MFA_REQUIRED_DETAIL)
        return current_user

    if _admin_key_matches(x_admin_key):
        if _looks_browser_originated(request):
            logger.warning(
                "admin_key_rejected_from_browser_origin origin=%s user_id=%s",
                request.headers.get("origin"),
                getattr(current_user, "user_id", None),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required.",
            )
        request.state.admin_via_key = True
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required.",
    )


def get_admin_user(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    """Authorize admin endpoints.

    Primary path: the account holds an admin role (`admin_role`), its session is
    under ADMIN_SESSION_MAX_AGE old, and it has a confirmed TOTP second factor
    (spec L3, D-15) — otherwise 403 `mfa_required`. No browser-held secret.

    Fallback: the legacy ``X-Admin-Key`` header, retained for genuine
    server-to-server callers only. It is a single long-lived shared secret that
    names nobody, so an action taken with it cannot be attributed to a person —
    which is exactly why it must not be reachable from a browser, where an XSS,
    an extension or a shared machine can read it out of storage and where every
    use of it is anonymous by construction. A machine has no phone, so this
    path carries no TOTP requirement.

    Which permission a route needs is a separate dependency
    (`app.core.permissions.require_permission`).
    """
    return _resolve_admin(request, current_user, x_admin_key, db, require_mfa=True)


def get_admin_user_without_mfa(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    """`get_admin_user` minus the TOTP requirement — for enrolling TOTP only.

    Without this an admin could never reach the route that satisfies the
    requirement. Used by `/admin/me` and `/admin/mfa/*` and nothing else;
    tests/test_admin_permissions.py pins that list.
    """
    return _resolve_admin(request, current_user, x_admin_key, db, require_mfa=False)


def create_admin_elevation_token(user: User) -> tuple[str, datetime]:
    """Mint a short-lived token authorising destructive admin operations.

    Returns the token and its expiry, so the caller can tell the operator how
    long they have rather than making them discover it by being refused.

    Bound to three things on purpose, because an elevation that outlives any of
    them is worse than none:

    - `sub`, the user id — so one admin's elevation cannot authorise another's
      action. Being admin is not a shared capability here.
    - `ver`, the user's token_version — so the existing "log everyone out"
      lever (bumping token_version on password change, suspension or forced
      logout) revokes live elevations too. Without this, revoking a compromised
      session would leave its elevation usable for the rest of the window.
    - `exp`, minutes not hours — see `admin_elevation_minutes`.
    """
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.admin_elevation_minutes)
    token = create_access_token(
        str(user.user_id),
        expires_delta=expires_delta,
        token_type=TOKEN_TYPE_ADMIN_ELEVATION,
        token_version=int(getattr(user, "token_version", 0) or 0),
    )
    return token, datetime.now(UTC) + expires_delta


def get_elevated_admin_user(
    request: Request,
    current_user: Annotated[User, Depends(get_admin_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
) -> User:
    """Admin **and** freshly re-authenticated. For destructive operations only.

    `get_admin_user` answers "may this person act as an admin at all". This adds
    "did they prove, in the last few minutes, that they are still the person
    holding that account" — which is the question a stolen session cannot answer.

    Depending on `get_admin_user` rather than re-implementing it means the
    X-Admin-Key browser-origin refusal and the audit trail keep applying here;
    this is strictly a second gate, never an alternative route in.

    The elevation token is read from a header rather than a cookie so it is not
    attached automatically: it has to be passed deliberately, per call, which is
    also what stops a CSRF-shaped request from carrying it for free.
    """
    # A genuine server-to-server caller is already past this bar and cannot clear
    # it any other way: it has no password to re-enter, so `/admin/elevate` would
    # refuse it and these routes would be permanently closed to automation.
    #
    # This is a deliberate scoping of the control, not a hole. Elevation exists
    # for one threat — a *browser session* being used by someone who is not the
    # account holder (XSS, an extension, an unlocked laptop). A process holding a
    # deployment secret is not that actor, and `get_admin_user` has already
    # refused this key if the request came from a browser origin
    # (`_looks_browser_originated`), so this branch is unreachable from a page.
    #
    # The residual risk is unchanged from before elevation existed: whoever holds
    # JOTHIDAM_ADMIN_API_KEY can still run destructive operations without naming a
    # person. That is P1-4 step 3's known trade-off, recorded there. If the key is
    # ever retired, delete this branch with it.
    if _admin_key_matches(x_admin_key) and not _looks_browser_originated(request):
        return current_user

    raw = request.headers.get(ADMIN_ELEVATION_HEADER)
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        )

    try:
        payload = decode_token(raw)
    except HTTPException as exc:
        # decode_token answers 401 for an expired or malformed token. Re-shape it
        # to the elevation 403 so the console sees one prompt-for-password signal
        # instead of two, and does not mistake a stale elevation for a dead session
        # and log the operator out.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        ) from exc

    if payload.get("typ") != TOKEN_TYPE_ADMIN_ELEVATION:
        # An ordinary access token must never be accepted here, or "elevation"
        # would be satisfied by the session it is supposed to be independent of.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        )

    if str(payload.get("sub")) != str(current_user.user_id):
        logger.warning(
            "admin_elevation_subject_mismatch actor=%s token_sub=%s",
            current_user.user_id,
            payload.get("sub"),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        )

    # _payload_token_version raises 401 on a malformed `ver`, which is right for a
    # session token and wrong here: the console reads 401 as "your session died"
    # and signs the operator out, when the truth is only that this elevation is no
    # good. Every rejection on this path has to look the same from outside — a 403
    # asking for the password again.
    try:
        token_version = _payload_token_version(payload)
    except HTTPException as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        ) from exc

    if token_version != int(getattr(current_user, "token_version", 0) or 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ADMIN_ELEVATION_REQUIRED_DETAIL,
        )

    return current_user


def require_csrf_header(
    request: Request,
    vinaadi_token: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
    x_vinaadi_csrf: Annotated[str | None, Header()] = None,
) -> None:
    """Require a simple custom header for mutating cookie-authenticated requests."""
    if request.method.upper() not in _MUTATING_METHODS:
        return
    if vinaadi_token is None:
        return
    if authorization and authorization.lower().startswith("bearer "):
        return
    if x_vinaadi_csrf == _CSRF_HEADER_VALUE:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="CSRF header required.",
    )

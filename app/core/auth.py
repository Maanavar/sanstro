"""JWT authentication layer for Vinaadi AI.

Design:
- Stateless HS256 JWTs; secret lives in JOTHIDAM_JWT_SECRET env var.
- `get_current_user` extracts and validates the Bearer token, then resolves
  (or auto-creates) the User row so every downstream handler gets a real UUID.
- `get_admin_user` additionally checks X-Admin-Key header against
  JOTHIDAM_ADMIN_API_KEY for the /admin/* endpoints.
- Token creation helper `create_access_token` is provided for tests and for
  a future /auth/token endpoint.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hmac import compare_digest
from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)
_MUTATING_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
_CSRF_HEADER_VALUE = "1"
TOKEN_TYPE_ACCESS = "access"  # noqa: S105 — a JWT `typ` discriminator, not a credential
TOKEN_TYPE_PASSWORD_RESET = "pwreset"  # noqa: S105 — a JWT `typ` discriminator, not a credential


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
    if settings.jwt_secret is None:
        raise RuntimeError("JWT secret is not configured.")
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
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on any failure."""
    settings = get_settings()
    if settings.jwt_secret is None:
        raise RuntimeError("JWT secret is not configured.")
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
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
) -> User:
    """Validate JWT and return the corresponding User row.

    Supports either:
    - Authorization header Bearer token
    - `vinaadi_token` httpOnly cookie

    The JWT `sub` claim may be:
    - A UUID string  → looked up directly as user_id.
    - An email string → looked up by email.
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


def is_admin_user(user: User) -> bool:
    """True when the session itself grants admin — DB role or bootstrap email.

    This keeps admin authority server-side so the browser never has to store a
    long-lived admin secret.
    """
    if getattr(user, "is_admin", False):
        return True
    if user.email is not None:
        return user.email.strip().lower() in get_settings().admin_email_set
    return False


def get_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
) -> User:
    """Authorize admin endpoints.

    Primary path: the authenticated session is itself admin (``is_admin`` column
    or a bootstrap ``JOTHIDAM_ADMIN_EMAILS`` entry) — no browser-held secret.

    Fallback: the legacy ``X-Admin-Key`` header, retained for server-to-server
    callers and the existing admin console until it moves to session-only auth.
    """
    if is_admin_user(current_user):
        return current_user

    settings = get_settings()
    if settings.admin_api_key is not None and x_admin_key is not None and compare_digest(x_admin_key, settings.admin_api_key):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required.",
    )


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

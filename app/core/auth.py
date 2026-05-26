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

from fastapi import Cookie, Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


# ── Token helpers ─────────────────────────────────────────────────────────────


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT for the given subject (user_id or email)."""
    settings = get_settings()
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
    payload = {"sub": subject, "iat": now, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on any failure."""
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
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

    return user


def get_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
) -> User:
    """Require a valid JWT **and** the X-Admin-Key header for admin endpoints."""
    settings = get_settings()
    if x_admin_key is None or not compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin key required.",
        )
    return current_user

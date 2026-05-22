"""JWT authentication layer for Jothidam.AI.

Design:
- Stateless HS256 JWTs; secret lives in JOTHIDAM_JWT_SECRET env var.
- `get_current_user` extracts and validates the Bearer token, then resolves
  (or auto-creates) the User row so every downstream handler gets a real UUID.
- `get_admin_user` additionally checks X-Admin-Key header against
  JOTHIDAM_ADMIN_API_KEY for the /admin/* endpoints.
- Supabase compatibility: Supabase issues HS256 JWTs signed with the project
  JWT secret. Set JOTHIDAM_JWT_SECRET to the Supabase JWT secret and tokens
  issued by Supabase will pass validation unchanged.
- Token creation helper `create_access_token` is provided for tests and for
  a future /auth/token endpoint.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal, get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=True)


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
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> User:
    """Validate Bearer JWT and return the corresponding User row.

    The JWT `sub` claim may be:
    - A UUID string  → looked up directly as user_id.
    - An email string → looked up by email; row created on first login.

    This allows Supabase tokens (sub = UUID) and simple test tokens (sub = email)
    to both work without code changes.

    Uses its own short-lived session so it never contaminates the endpoint's
    transaction (which uses the `get_db`-provided session).
    """
    payload = decode_token(credentials.credentials)
    sub: str | None = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject.")

    # Determine uid and email from sub
    try:
        uid = UUID(sub)
        email: str | None = None
    except ValueError:
        uid = uuid4()
        email = sub if "@" in sub else None

    with SessionLocal() as session:
        with session.begin():
            # Look up by UUID
            user: User | None = session.get(User, uid)
            if user is None and email:
                user = session.query(User).filter(User.email == email).first()
                if user is not None:
                    uid = user.user_id  # use the existing row's UUID
            if user is None:
                # Auto-provision on first login
                user = User(user_id=uid, email=email)
                session.add(user)
            # Expunge so the object can be used outside this session
            session.expunge(user)

    return user


def get_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
    x_admin_key: Annotated[str | None, Header()] = None,
) -> User:
    """Require a valid JWT **and** the X-Admin-Key header for admin endpoints."""
    settings = get_settings()
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin key required.",
        )
    return current_user

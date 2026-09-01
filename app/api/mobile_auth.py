"""Mobile-specific auth endpoints.

Cookie-free: credentials verified → access token (30 min) + refresh token (60 days)
returned in the response body. Clients store tokens in expo-secure-store (Keychain /
Keystore), never AsyncStorage.

Refresh token rotation: every /refresh call revokes the presented token and issues a
fresh pair. Reuse of a revoked token is treated as a theft signal — all tokens for
that user are immediately revoked.
"""
from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import bcrypt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.auth import create_access_token
from app.core.auth_throttle import AuthThrottleAction, get_auth_throttler
from app.core.config import get_settings
from app.core.subscription import is_premium
from app.db.session import get_db
from app.middleware import resolve_client_ip
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthUserResponse, RegisterResponse
from app.services.email_service import enqueue_existing_account_registration_email

router = APIRouter(prefix="/mobile", tags=["mobile-auth"])

_REFRESH_TTL_DAYS = 60
_ACCESS_TTL_MINUTES = 30
_logger = logging.getLogger(__name__)
_throttler = get_auth_throttler()


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, respecting proxy configuration."""
    settings = get_settings()
    trusted_proxy_count = max(0, int(settings.trusted_proxy_count))
    return resolve_client_ip(request, trusted_proxy_count)


# ── Request / response schemas ─────────────────────────────────────────────────


class MobileAuthResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    expires_in: int = Field(alias="expiresIn")  # seconds until access token expires
    user: AuthUserResponse

    model_config = ConfigDict(populate_by_name=True)


class MobileLoginRequest(BaseModel):
    email: str
    password: str
    device_id: str | None = Field(alias="deviceId", default=None)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()

    model_config = ConfigDict(populate_by_name=True)


class MobileRegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=255)
    device_id: str | None = Field(alias="deviceId", default=None)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()

    model_config = ConfigDict(populate_by_name=True)


class MobileRefreshRequest(BaseModel):
    refresh_token: str = Field(alias="refreshToken")
    device_id: str | None = Field(alias="deviceId", default=None)

    model_config = ConfigDict(populate_by_name=True)


class MobileLogoutRequest(BaseModel):
    refresh_token: str = Field(alias="refreshToken")

    model_config = ConfigDict(populate_by_name=True)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _hash_token(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode()).hexdigest()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _issue_refresh_token(db: Session, user_id: UUID, device_id: str | None) -> str:
    plaintext = secrets.token_hex(32)
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(plaintext),
        device_id=device_id,
        expires_at=datetime.now(UTC) + timedelta(days=_REFRESH_TTL_DAYS),
    ))
    return plaintext


def _build_response(db: Session, user: User, device_id: str | None) -> MobileAuthResponse:
    access = create_access_token(
        subject=str(user.user_id),
        expires_delta=timedelta(minutes=_ACCESS_TTL_MINUTES),
        token_version=int(getattr(user, "token_version", 0) or 0),
    )
    refresh = _issue_refresh_token(db, user.user_id, device_id)
    return MobileAuthResponse(
        accessToken=access,
        refreshToken=refresh,
        expiresIn=_ACCESS_TTL_MINUTES * 60,
        user=AuthUserResponse(
            userId=str(user.user_id),
            email=user.email or "",
            userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
            goalTrack=getattr(user, "goal_track", None),
            tier="premium" if is_premium(user.user_id, db) else "registered",
        ),
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.post("/login", response_model=MobileAuthResponse)
def mobile_login(
    payload: MobileLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MobileAuthResponse:
    client_ip = _get_client_ip(request)

    # Check throttles: per-IP and per-email
    allowed, retry_after = _throttler.check(
        AuthThrottleAction.LOGIN,
        ip=client_ip,
        account_identifier=payload.email,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    user = db.query(User).filter(User.email == payload.email).first()
    _invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if user is None or not user.hashed_password:
        raise _invalid
    if not _verify_password(payload.password, user.hashed_password):
        raise _invalid
    if user.is_suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended. Contact support.")
    return _build_response(db, user, payload.device_id)


@router.post("/register", response_model=RegisterResponse)
def mobile_register(
    payload: MobileRegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    client_ip = _get_client_ip(request)

    # Check throttles: per-IP and per-email
    allowed, retry_after = _throttler.check(
        AuthThrottleAction.REGISTER,
        ip=client_ip,
        account_identifier=payload.email,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        _hash_password(payload.password)
        if existing.email:
            enqueue_existing_account_registration_email(background_tasks, existing.email)
        return RegisterResponse(detail="If this email can be used, your account is ready. Please sign in to continue.")

    user = User(user_id=uuid4(), email=payload.email, hashed_password=_hash_password(payload.password))
    db.add(user)
    db.flush()
    return RegisterResponse(detail="If this email can be used, your account is ready. Please sign in to continue.")


@router.post("/refresh", response_model=MobileAuthResponse)
def mobile_refresh(
    payload: MobileRefreshRequest,
    db: Session = Depends(get_db),
) -> MobileAuthResponse:
    token_hash = _hash_token(payload.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if row is not None and row.revoked_at is not None:
        # Revoked token reused → theft signal: burn all active tokens for this user
        db.query(RefreshToken).filter(
            RefreshToken.user_id == row.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": datetime.now(UTC)})
        _logger.warning("refresh_token_theft_signal user_id=%s", row.user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked.")

    if row is None or datetime.now(UTC) >= row.expires_at.replace(tzinfo=UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    user = db.get(User, row.user_id)
    if user is None or user.is_suspended:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not resolve user.")

    # Rotate: mark old token used and revoked
    now = datetime.now(UTC)
    row.revoked_at = now
    row.last_used_at = now

    return _build_response(db, user, payload.device_id or row.device_id)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def mobile_logout(
    payload: MobileLogoutRequest,
    db: Session = Depends(get_db),
) -> None:
    token_hash = _hash_token(payload.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(UTC)

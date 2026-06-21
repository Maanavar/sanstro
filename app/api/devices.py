"""Device push-token registration.

Works for both authenticated (registered) users and anonymous guests.
Guest requests omit the Authorization header and supply `anonymousId` instead.
One row per device_id — upserted on every app launch / token refresh.

Fan-out: notification_dispatch_service reads DeviceToken rows by user_id to
send to all of a user's devices. The legacy `fcm_device_token` on User is kept
during the transition and will be deprecated in Phase B.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.auth import decode_token
from app.db.session import get_db
from app.models.device_token import DeviceToken
from app.models.user import User

router = APIRouter(prefix="/devices", tags=["devices"])
_logger = logging.getLogger(__name__)
_optional_bearer = HTTPBearer(auto_error=False)


def _resolve_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_optional_bearer)],
    db: Session = Depends(get_db),
) -> User | None:
    """Return the User if a valid Bearer token is present, otherwise None (guest)."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        sub: str | None = payload.get("sub")
        if not sub:
            return None
        try:
            uid = UUID(sub)
            return db.get(User, uid)
        except ValueError:
            if "@" in sub:
                return db.query(User).filter(User.email == sub).first()
            return None
    except HTTPException:
        return None


# ── Schemas ────────────────────────────────────────────────────────────────────


class PushTokenUpsertRequest(BaseModel):
    device_id: str = Field(alias="deviceId")
    fcm_token: str = Field(alias="fcmToken")
    platform: Literal["ios", "android"]
    app_version: str | None = Field(alias="appVersion", default=None)
    anonymous_id: str | None = Field(alias="anonymousId", default=None)

    model_config = ConfigDict(populate_by_name=True)


class PushTokenDeleteRequest(BaseModel):
    device_id: str = Field(alias="deviceId")

    model_config = ConfigDict(populate_by_name=True)


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.post("/push-token", status_code=status.HTTP_204_NO_CONTENT)
def upsert_push_token(
    payload: PushTokenUpsertRequest,
    user: User | None = Depends(_resolve_optional_user),
    db: Session = Depends(get_db),
) -> None:
    row = db.query(DeviceToken).filter(DeviceToken.device_id == payload.device_id).first()
    now = datetime.now(UTC)

    if row is None:
        row = DeviceToken(
            device_id=payload.device_id,
            fcm_token=payload.fcm_token,
            platform=payload.platform,
            app_version=payload.app_version,
            user_id=user.user_id if user else None,
            anonymous_id=payload.anonymous_id if not user else None,
        )
        db.add(row)
    else:
        row.fcm_token = payload.fcm_token
        row.platform = payload.platform
        row.app_version = payload.app_version
        row.updated_at = now
        if user:
            row.user_id = user.user_id
            row.anonymous_id = None
        else:
            row.anonymous_id = payload.anonymous_id

    _logger.info(
        "push_token_upsert device_id=%s user_id=%s",
        payload.device_id,
        user.user_id if user else "guest",
    )


@router.delete("/push-token", status_code=status.HTTP_204_NO_CONTENT)
def delete_push_token(
    payload: PushTokenDeleteRequest,
    db: Session = Depends(get_db),
) -> None:
    row = db.query(DeviceToken).filter(DeviceToken.device_id == payload.device_id).first()
    if row is not None:
        db.delete(row)

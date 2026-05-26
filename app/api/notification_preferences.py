from __future__ import annotations

from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification_preferences import (
    FcmTokenUpdateRequest,
    NotificationPreferenceData,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
)
from app.services.notification_dispatch_service import get_or_create_preferences

router = APIRouter()

_VALID_CHANNELS = {"none", "email", "push", "both"}


def _to_response(pref) -> NotificationPreferenceResponse:
    return NotificationPreferenceResponse(
        data=NotificationPreferenceData(
            notification_channel=pref.notification_channel,
            morningAlertEnabled=pref.morning_alert_enabled,
            morningAlertTime=pref.morning_alert_time.strftime("%H:%M"),
            dashaAlertEnabled=pref.dasha_alert_enabled,
            piranthaNaalAlertEnabled=pref.pirantha_naal_alert_enabled,
            smartSilenceEnabled=pref.smart_silence_enabled,
            fcmTokenRegistered=bool(pref.fcm_device_token),
        )
    )


@router.get(
    "/settings/notifications",
    response_model=NotificationPreferenceResponse,
    tags=["settings"],
    summary="Get notification preferences for the current user",
)
def get_notification_preferences(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferenceResponse:
    pref = get_or_create_preferences(session, current_user.user_id)
    session.commit()
    return _to_response(pref)


@router.patch(
    "/settings/notifications",
    response_model=NotificationPreferenceResponse,
    tags=["settings"],
    summary="Update notification preferences (opt-in — all fields optional)",
)
def update_notification_preferences(
    payload: NotificationPreferenceUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferenceResponse:
    pref = get_or_create_preferences(session, current_user.user_id)

    if payload.notification_channel is not None:
        if payload.notification_channel not in _VALID_CHANNELS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"notification_channel must be one of: {sorted(_VALID_CHANNELS)}",
            )
        pref.notification_channel = payload.notification_channel

    if payload.morning_alert_enabled is not None:
        pref.morning_alert_enabled = payload.morning_alert_enabled

    if payload.morning_alert_time is not None:
        try:
            parsed = time.fromisoformat(payload.morning_alert_time)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="morning_alert_time must be HH:MM",
            )
        pref.morning_alert_time = parsed

    if payload.dasha_alert_enabled is not None:
        pref.dasha_alert_enabled = payload.dasha_alert_enabled

    if payload.pirantha_naal_alert_enabled is not None:
        pref.pirantha_naal_alert_enabled = payload.pirantha_naal_alert_enabled

    if payload.smart_silence_enabled is not None:
        pref.smart_silence_enabled = payload.smart_silence_enabled

    session.commit()
    return _to_response(pref)


@router.put(
    "/settings/notifications/fcm-token",
    response_model=NotificationPreferenceResponse,
    tags=["settings"],
    summary="Register or update FCM device token for push delivery",
)
def update_fcm_token(
    payload: FcmTokenUpdateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferenceResponse:
    pref = get_or_create_preferences(session, current_user.user_id)
    pref.fcm_device_token = payload.fcm_device_token
    session.commit()
    return _to_response(pref)


@router.delete(
    "/settings/notifications/fcm-token",
    response_model=NotificationPreferenceResponse,
    tags=["settings"],
    summary="Remove FCM device token (deregister push for this device)",
)
def delete_fcm_token(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferenceResponse:
    pref = get_or_create_preferences(session, current_user.user_id)
    pref.fcm_device_token = None
    session.commit()
    return _to_response(pref)

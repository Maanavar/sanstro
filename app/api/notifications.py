"""Notification inbox: list recent due notifications for the current user."""
from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.models.user_preference import UserPreference

router = APIRouter()


class NotificationItem(BaseModel):
    notification_id: UUID
    type: str
    title: str
    body: str
    status: str
    send_at: datetime
    read_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    success: bool = True
    data: list[NotificationItem]
    unread_count: int


def _due_status_filter(now: datetime):
    return or_(
        Notification.status == "sent",
        and_(Notification.status == "queued", Notification.send_at <= now),
    )


def _active_language(session: Session, user_id: UUID) -> str:
    """Resolve the account language used to render the inbox."""
    language = session.execute(
        select(UserPreference.dashboard_lang).where(UserPreference.owner_user_id == user_id)
    ).scalar_one_or_none()
    return "ta" if language == "ta" else "en"


def _localized_notification_text(notification: Notification, field: str, language: str) -> str:
    """Pick the active-language text, including a safe fallback for older rows."""
    payload_value = (notification.payload or {}).get(field)
    if isinstance(payload_value, dict):
        translated = payload_value.get(language)
        if isinstance(translated, str) and translated.strip():
            return translated

    stored = str(getattr(notification, field))
    # Before notifications retained their translations in payload, they were
    # stored as `Tamil / English` titles and `Tamil\nEnglish` bodies. Preserve
    # a usable active-language inbox for those already-sent rows too.
    if notification.language == "ta-en":
        separator = " / " if field == "title" else "\n"
        tamil, found, english = stored.partition(separator)
        if found:
            return tamil if language == "ta" else english
    return stored


def _notification_item(notification: Notification, language: str) -> NotificationItem:
    return NotificationItem(
        notification_id=notification.notification_id,
        type=notification.type,
        title=_localized_notification_text(notification, "title", language),
        body=_localized_notification_text(notification, "body", language),
        status=notification.status,
        send_at=notification.send_at,
        read_at=notification.read_at,
    )


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    tags=["notifications"],
    summary="List recent notifications for the current user (inbox / bell feed)",
)
def list_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    now = datetime.now(UTC)
    rows = session.execute(
        select(Notification)
        .where(
            Notification.user_id == current_user.user_id,
            _due_status_filter(now),
        )
        .order_by(Notification.send_at.desc())
        .limit(limit)
    ).scalars().all()

    language = _active_language(session, current_user.user_id)
    items = [_notification_item(row, language) for row in rows]
    unread = sum(1 for i in items if i.read_at is None)
    return NotificationListResponse(data=items, unread_count=unread)


@router.post(
    "/notifications/{notification_id}/read",
    response_model=NotificationListResponse,
    tags=["notifications"],
    summary="Mark a notification as read",
)
def mark_read(
    notification_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    notif = session.execute(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
            _due_status_filter(datetime.now(UTC)),
        )
    ).scalar_one_or_none()

    if notif and notif.read_at is None:
        notif.read_at = datetime.now(UTC)
        # flush stages the write; get_db() commits the transaction on request exit
        session.flush()

    return list_notifications(limit=30, session=session, current_user=current_user)


@router.post(
    "/notifications/read-all",
    response_model=NotificationListResponse,
    tags=["notifications"],
    summary="Mark all notifications as read",
)
def mark_all_read(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    now = datetime.now(UTC)
    rows = session.execute(
        select(Notification).where(
            Notification.user_id == current_user.user_id,
            Notification.read_at.is_(None),
            _due_status_filter(now),
        )
    ).scalars().all()

    for r in rows:
        r.read_at = now
    # flush stages the write; get_db() commits the transaction on request exit
    session.flush()

    return list_notifications(limit=30, session=session, current_user=current_user)

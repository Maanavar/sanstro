"""Notification inbox — list recent notifications for the current user."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User

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
    data: List[NotificationItem]
    unread_count: int


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
    rows = session.execute(
        select(Notification)
        .where(
            Notification.user_id == current_user.user_id,
            Notification.status.in_(["sent", "queued"]),
        )
        .order_by(Notification.send_at.desc())
        .limit(limit)
    ).scalars().all()

    items = [NotificationItem.model_validate(r) for r in rows]
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
        )
    ).scalar_one_or_none()

    if notif and notif.read_at is None:
        notif.read_at = datetime.now(timezone.utc)
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
    rows = session.execute(
        select(Notification).where(
            Notification.user_id == current_user.user_id,
            Notification.read_at.is_(None),
            Notification.status.in_(["sent", "queued"]),
        )
    ).scalars().all()

    now = datetime.now(timezone.utc)
    for r in rows:
        r.read_at = now
    session.flush()

    return list_notifications(limit=30, session=session, current_user=current_user)

"""
Notification dispatch orchestrator.

Responsibilities:
  1. Load the user's UserNotificationPreference row (create default if absent).
  2. Apply the smart silence rule: if the user is in a heavy Sani period
     (JANMA_SANI, ASHTAMA_SANI, EZHARAI_SANI) and has already received a push
     today, suppress additional pushes for the day (product spec Module 18).
  3. Route to email, FCM push, or both based on notification_channel.
  4. Persist a Notification row (status=sent|suppressed|failed) for the audit log.

All notifications are opt-in — if channel == 'none' the call is a no-op.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone
from app.models.birth_profile import BirthProfile
from app.models.notification import Notification
from app.models.user_notification_preference import UserNotificationPreference
from app.services.email_service import EmailMessage, build_notification_email, send_email
from app.services.fcm_service import send_push
from app.services.location_service import resolve_effective_daily_timezone

logger = logging.getLogger(__name__)

# Heavy Sani cycle tags that trigger the smart silence rule
_HEAVY_SANI_CYCLES = {"JANMA_SANI", "ASHTAMA_SANI", "EZHARAI_SANI_PHASE_1", "EZHARAI_SANI_PHASE_3"}

NotificationType = Literal[
    "MORNING_NALLA_NERAM",
    "DASHA_TRANSITION",
    "PIRANTHA_NAAL",
    "PEYARCHI",
    "GENERAL",
]


def get_or_create_preferences(session: Session, user_id: UUID) -> UserNotificationPreference:
    """Return existing preference row or create a default (all-off) one."""
    pref = session.execute(
        select(UserNotificationPreference).where(UserNotificationPreference.owner_user_id == user_id)
    ).scalar_one_or_none()

    if pref is None:
        pref = UserNotificationPreference(owner_user_id=user_id)
        session.add(pref)
        session.flush()

    return pref


def _resolve_user_timezone(session: Session, user_id: UUID) -> str:
    profile = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.owner_user_id == user_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if profile:
        return resolve_effective_daily_timezone(profile)
    return "UTC"


def _push_count_today(session: Session, user_id: UUID, user_tz_str: str = "UTC") -> int:
    try:
        user_tz = resolve_timezone(user_tz_str)
    except Exception:
        user_tz = timezone.utc
    now_local = datetime.now(user_tz)
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start = today_start_local.astimezone(timezone.utc)
    return session.execute(
        select(func.count(Notification.notification_id)).where(
            Notification.user_id == user_id,
            Notification.status == "sent",
            Notification.send_at >= today_start,
        )
    ).scalar_one()


def _persist_notification(
    session: Session,
    user_id: UUID,
    chart_id: UUID | None,
    notification_type: str,
    title: str,
    body: str,
    status: str,
    suppression_reason: str | None,
    priority: int = 50,
) -> None:
    notif = Notification(
        user_id=user_id,
        chart_id=chart_id,
        type=notification_type,
        priority=priority,
        title=title,
        body=body,
        send_at=datetime.now(timezone.utc),
        status=status,
        suppression_reason=suppression_reason,
        payload={},
    )
    session.add(notif)
    session.flush()


def dispatch_notification(
    session: Session,
    user_id: UUID,
    notification_type: NotificationType,
    title_ta: str,
    title_en: str,
    body_ta: str,
    body_en: str,
    user_email: str | None = None,
    chart_id: UUID | None = None,
    sani_cycle: str | None = None,
    priority: int = 50,
) -> str:
    """
    Dispatch a notification for a user, respecting their channel preference and
    the smart silence rule.

    Returns one of: 'sent_push', 'sent_email', 'sent_both', 'suppressed', 'opted_out', 'failed'.
    """
    pref = get_or_create_preferences(session, user_id)

    channel = pref.notification_channel
    if channel == "none":
        # The in-app bell/inbox is decoupled from push/email: even when the user
        # has not opted into a delivery channel, still persist the notification
        # so it appears in the in-app inbox (status="sent"). Channel preference
        # only governs push/email *delivery*, not whether the bell receives it.
        logger.debug("dispatch_in_app_only user=%s type=%s — channel=none", user_id, notification_type)
        _persist_notification(
            session, user_id, chart_id, notification_type,
            f"{title_ta} / {title_en}", f"{body_ta}\n{body_en}",
            "sent", None, priority,
        )
        return "in_app_only"

    # Smart silence: max 1 push/day during heavy Sani periods
    wants_push = channel in ("push", "both")
    if wants_push and pref.smart_silence_enabled and sani_cycle in _HEAVY_SANI_CYCLES:
        user_tz = _resolve_user_timezone(session, user_id)
        if _push_count_today(session, user_id, user_tz) >= 1:
            logger.info("smart_silence user=%s sani=%s — push suppressed", user_id, sani_cycle)
            _persist_notification(
                session, user_id, chart_id, notification_type,
                title_en, body_en, "suppressed",
                f"smart_silence:{sani_cycle}", priority,
            )
            return "suppressed"

    # Build language-merged strings: Tamil first, English below
    combined_title = f"{title_ta} / {title_en}"
    combined_body = f"{body_ta}\n{body_en}"

    push_ok = email_ok = False

    if wants_push and pref.fcm_device_token:
        push_ok = send_push(pref.fcm_device_token, combined_title, combined_body)

    wants_email = channel in ("email", "both")
    if wants_email and user_email:
        msg = build_notification_email(user_email, combined_title, combined_body)
        email_ok = send_email(msg)

    # Determine outcome
    if wants_push and wants_email:
        sent = push_ok or email_ok
        result = "sent_both" if (push_ok and email_ok) else ("sent_push" if push_ok else ("sent_email" if email_ok else "failed"))
    elif wants_push:
        sent = push_ok
        result = "sent_push" if push_ok else "failed"
    else:
        sent = email_ok
        result = "sent_email" if email_ok else "failed"

    _persist_notification(
        session, user_id, chart_id, notification_type,
        combined_title, combined_body,
        "sent" if sent else "failed",
        None if sent else "delivery_error",
        priority,
    )
    return result

"""
Durable notification-intent and per-channel outbox orchestrator.

Responsibilities:
  1. Load the user's UserNotificationPreference row (create default if absent).
  2. Apply the smart silence rule: if the user is in a heavy Sani period
     (JANMA_SANI, ASHTAMA_SANI, EZHARAI_SANI) and has already received a push
     today, suppress additional pushes for the day (product spec Module 18).
  3. Persist push/email channel work with a bounded expiry.
  4. Claim, deliver, retry, and record each channel independently.

External delivery is opt-in. Every intent remains visible in the in-app inbox.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID, uuid4

from sqlalchemy import and_, func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone
from app.models.birth_profile import BirthProfile
from app.models.notification import Notification
from app.models.notification_delivery import NotificationDelivery
from app.models.user import User
from app.models.user_notification_preference import UserNotificationPreference
from app.models.user_preference import UserPreference
from app.services.email_service import build_notification_email, send_email
from app.services.fcm_service import send_push
from app.services.feature_flags import get_flag
from app.services.location_service import resolve_effective_daily_timezone

logger = logging.getLogger(__name__)

_FCM_BODY_MAX_CHARS = 240
_DELIVERY_MAX_ATTEMPTS = 5
_CLAIM_TTL = timedelta(minutes=5)


def _truncate_body(body: str) -> str:
    """Truncate notification body to FCM Android display limit (≤240 chars)."""
    if len(body) <= _FCM_BODY_MAX_CHARS:
        return body
    truncated = body[: _FCM_BODY_MAX_CHARS - 1]
    # Try to cut at the last sentence boundary
    for sep in ("\n", "।", ".", "!", "?"):
        pos = truncated.rfind(sep)
        if pos > _FCM_BODY_MAX_CHARS // 2:
            return truncated[: pos + 1] + "…"
    return truncated + "…"


# Heavy Sani cycle tags that trigger the smart silence rule.
# JANMA_SANI is the code-level name for Ezhurai Sani Phase 2 (Saturn over natal Moon).
# EZHARAI_SANI_PHASE_2 is kept as a forward-compatible alias.
_HEAVY_SANI_CYCLES = {
    "JANMA_SANI",           # Ezhurai Sani Phase 2 — peak
    "ASHTAMA_SANI",
    "EZHARAI_SANI_PHASE_1",
    "EZHARAI_SANI_PHASE_2", # alias for JANMA_SANI naming convention
    "EZHARAI_SANI_PHASE_3",
}

NotificationType = Literal[
    "MORNING_NALLA_NERAM",
    "DASHA_TRANSITION",
    "JADHAGAM_D1_NUDGE",
    "PIRANTHA_NAAL",
    "PEYARCHI",
    "GENERAL",
]

NotificationLanguage = Literal["ta", "en"]


def _notification_language(session: Session, user_id: UUID) -> NotificationLanguage:
    """Return the account language used for push, email, and inbox copy.

    The dashboard language is the account-level setting that already syncs
    across devices.  A notification must use that setting rather than merge
    two translations: Android and iOS previews give the first line prominence,
    which made every merged notification appear Tamil-first in English mode.
    """
    language = session.execute(
        select(UserPreference.dashboard_lang).where(UserPreference.owner_user_id == user_id)
    ).scalar_one_or_none()
    return "ta" if language == "ta" else "en"


def _localized_text(language: NotificationLanguage, tamil: str, english: str) -> str:
    return tamil if language == "ta" else english


def _bilingual_payload(title_ta: str, title_en: str, body_ta: str, body_en: str) -> dict[str, dict[str, str]]:
    """Keep both translations so the in-app inbox can follow later language changes."""
    return {
        "title": {"ta": title_ta, "en": title_en},
        "body": {"ta": body_ta, "en": body_en},
    }


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
        user_tz = UTC
    now_local = datetime.now(user_tz)
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start = today_start_local.astimezone(UTC)
    return session.execute(
        select(func.count(NotificationDelivery.delivery_id))
        .join(Notification, Notification.notification_id == NotificationDelivery.notification_id)
        .where(
            Notification.user_id == user_id,
            NotificationDelivery.channel == "push",
            NotificationDelivery.status == "delivered",
            NotificationDelivery.delivered_at >= today_start,
        )
    ).scalar_one()


# ---------------------------------------------------------------------------
# A10 durable notification intent + per-channel outbox
# ---------------------------------------------------------------------------


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
    logical_key: str | None = None,
    send_at: datetime | None = None,
    expires_at: datetime | None = None,
    payload_extra: dict | None = None,
) -> str:
    """Persist intent and channel work without calling an external provider.

    The caller owns the transaction. Delivery begins only after this row and
    its channel rows have committed and a worker claims them.
    """
    del user_email  # The worker reads the current verified address from User.
    now = datetime.now(UTC)
    due_at = send_at or now
    expiry = expires_at or (due_at + timedelta(days=1))
    if expiry <= due_at:
        raise ValueError("notification expiry must be later than send_at")

    preference = get_or_create_preferences(session, user_id)
    language = _notification_language(session, user_id)
    title = _localized_text(language, title_ta, title_en)
    body = _localized_text(language, body_ta, body_en)
    payload: dict = _bilingual_payload(title_ta, title_en, body_ta, body_en)
    if payload_extra:
        payload.update(payload_extra)
    if sani_cycle:
        payload["deliveryPolicy"] = {"saniCycle": sani_cycle}

    channels: list[str] = []
    if preference.notification_channel in ("push", "both") and bool(
        get_flag("enable_push_notifications")
    ):
        channels.append("push")
    if preference.notification_channel in ("email", "both"):
        channels.append("email")

    intent_key = logical_key or f"adhoc:{user_id}:{notification_type}:{uuid4()}"
    notification_id = uuid4()
    initial_status = "queued" if channels or due_at > now else "sent"
    values = {
        "notification_id": notification_id,
        "user_id": user_id,
        "chart_id": chart_id,
        "type": notification_type,
        "priority": priority,
        "title": title,
        "body": body,
        "language": language,
        "send_at": due_at,
        "expires_at": expiry,
        "logical_key": intent_key,
        "status": initial_status,
        "payload": payload,
        "sent_at": now if initial_status == "sent" else None,
    }

    if session.bind is not None and session.bind.dialect.name == "postgresql":
        statement = (
            pg_insert(Notification)
            .values(**values)
            .on_conflict_do_nothing(index_elements=[Notification.logical_key])
            .returning(Notification.notification_id)
        )
        inserted_id = session.execute(statement).scalar_one_or_none()
        if inserted_id is None:
            return "duplicate"
        notification_id = inserted_id
    else:
        session.add(Notification(**values))
        session.flush()

    for channel in channels:
        session.add(
            NotificationDelivery(
                notification_id=notification_id,
                channel=channel,
                status="pending",
                next_attempt_at=due_at,
            )
        )
    session.flush()
    return "queued" if channels else "in_app_only"


@dataclass(frozen=True, slots=True)
class _Claim:
    delivery_id: UUID
    token: str


@dataclass(frozen=True, slots=True)
class _DeliverySnapshot:
    delivery_id: UUID
    notification_id: UUID
    user_id: UUID
    channel: str
    title: str
    body: str
    expires_at: datetime
    user_email: str | None
    fcm_device_token: str | None


def _refresh_notification_status(session: Session, notification_id: UUID, now: datetime) -> None:
    notification = session.get(Notification, notification_id)
    if notification is None:
        return
    states = list(
        session.execute(
            select(NotificationDelivery.status).where(
                NotificationDelivery.notification_id == notification_id,
                NotificationDelivery.deleted_at.is_(None),
            )
        ).scalars()
    )
    if not states:
        return
    if any(state in {"pending", "claimed", "retry"} for state in states):
        notification.status = "queued"
    elif any(state == "delivered" for state in states):
        notification.status = "sent"
        notification.sent_at = notification.sent_at or now
    elif all(state == "expired" for state in states):
        notification.status = "expired"
        notification.suppression_reason = "expired"
    elif all(state == "suppressed" for state in states):
        notification.status = "sent"
        notification.suppression_reason = "delivery_suppressed"
    else:
        notification.status = "failed"
        notification.suppression_reason = "delivery_exhausted"


def _expire_and_claim_due_deliveries(
    session: Session,
    *,
    now: datetime,
    batch_size: int,
    worker_id: str,
) -> tuple[list[_Claim], int]:
    active_states = ("pending", "retry", "claimed")
    expired_rows = session.execute(
        select(NotificationDelivery)
        .join(Notification, Notification.notification_id == NotificationDelivery.notification_id)
        .where(
            NotificationDelivery.status.in_(active_states),
            Notification.expires_at.is_not(None),
            Notification.expires_at <= now,
        )
        .with_for_update(skip_locked=True)
    ).scalars().all()
    expired_intents: set[UUID] = set()
    for delivery in expired_rows:
        delivery.status = "expired"
        delivery.claimed_by = None
        delivery.claim_expires_at = None
        delivery.last_error_code = "expired"
        expired_intents.add(delivery.notification_id)
    if expired_intents:
        # SessionLocal disables autoflush. Persist the terminal deliveries
        # before deriving the parent intent's aggregate status.
        session.flush()
    for notification_id in expired_intents:
        _refresh_notification_status(session, notification_id, now)

    # Inbox-only intents have no delivery rows to drive their lifecycle. Make
    # them visible when due, and retain them as expired after their usefulness
    # window instead of leaving them queued forever.
    delivery_exists = select(NotificationDelivery.delivery_id).where(
        NotificationDelivery.notification_id == Notification.notification_id,
        NotificationDelivery.deleted_at.is_(None),
    ).exists()
    inbox_only_expired = session.execute(
        select(Notification)
        .where(
            Notification.status == "queued",
            Notification.expires_at.is_not(None),
            Notification.expires_at <= now,
            ~delivery_exists,
        )
        .with_for_update(skip_locked=True)
    ).scalars().all()
    for notification in inbox_only_expired:
        notification.status = "expired"
        notification.suppression_reason = "expired"

    inbox_only_due = session.execute(
        select(Notification)
        .where(
            Notification.status == "queued",
            Notification.send_at <= now,
            Notification.expires_at > now,
            ~delivery_exists,
        )
        .with_for_update(skip_locked=True)
    ).scalars().all()
    for notification in inbox_only_due:
        notification.status = "sent"
        notification.sent_at = now

    eligible = or_(
        and_(
            NotificationDelivery.status.in_(("pending", "retry")),
            NotificationDelivery.next_attempt_at <= now,
        ),
        and_(
            NotificationDelivery.status == "claimed",
            NotificationDelivery.claim_expires_at <= now,
        ),
    )
    rows = session.execute(
        select(NotificationDelivery)
        .join(Notification, Notification.notification_id == NotificationDelivery.notification_id)
        .where(
            eligible,
            Notification.send_at <= now,
            Notification.expires_at > now,
            NotificationDelivery.deleted_at.is_(None),
        )
        .order_by(Notification.priority.desc(), Notification.send_at.asc())
        .with_for_update(skip_locked=True)
        .limit(batch_size)
    ).scalars().all()

    claims: list[_Claim] = []
    for delivery in rows:
        token = f"{worker_id}:{uuid4()}"
        delivery.status = "claimed"
        delivery.claimed_by = token
        delivery.claim_expires_at = now + _CLAIM_TTL
        delivery.last_attempt_at = now
        delivery.attempt_count += 1
        claims.append(_Claim(delivery.delivery_id, token))
    return claims, len(expired_rows) + len(inbox_only_expired)


def _load_delivery_snapshot(
    session: Session,
    claim: _Claim,
    now: datetime,
) -> tuple[_DeliverySnapshot | None, str | None]:
    row = session.execute(
        select(NotificationDelivery, Notification, User, UserNotificationPreference)
        .join(Notification, Notification.notification_id == NotificationDelivery.notification_id)
        .join(User, User.user_id == Notification.user_id)
        .outerjoin(
            UserNotificationPreference,
            UserNotificationPreference.owner_user_id == Notification.user_id,
        )
        .where(
            NotificationDelivery.delivery_id == claim.delivery_id,
            NotificationDelivery.status == "claimed",
            NotificationDelivery.claimed_by == claim.token,
        )
    ).one_or_none()
    if row is None:
        return None, "stale_claim"

    delivery, notification, user, preference = row
    if notification.expires_at is None or notification.expires_at <= now:
        return None, "expired"
    if preference is None or preference.notification_channel == "none":
        return None, "opted_out"

    if delivery.channel == "push":
        if preference.notification_channel not in ("push", "both"):
            return None, "opted_out"
        if not bool(get_flag("enable_push_notifications")):
            return None, "push_disabled"
        policy = (notification.payload or {}).get("deliveryPolicy") or {}
        sani_cycle = policy.get("saniCycle") if isinstance(policy, dict) else None
        if preference.smart_silence_enabled and sani_cycle in _HEAVY_SANI_CYCLES:
            user_tz = _resolve_user_timezone(session, notification.user_id)
            if _push_count_today(session, notification.user_id, user_tz) >= 1:
                return None, f"smart_silence:{sani_cycle}"
        if not preference.fcm_device_token:
            return None, "missing_device_token"
    elif preference.notification_channel not in ("email", "both"):
        return None, "opted_out"
    elif not user.email:
        return None, "missing_email"

    return (
        _DeliverySnapshot(
            delivery_id=delivery.delivery_id,
            notification_id=notification.notification_id,
            user_id=notification.user_id,
            channel=delivery.channel,
            title=notification.title,
            body=notification.body,
            expires_at=notification.expires_at,
            user_email=user.email,
            fcm_device_token=preference.fcm_device_token,
        ),
        None,
    )


def _complete_claim(
    claim: _Claim,
    *,
    outcome: str,
    error_code: str | None,
    now: datetime,
    invalid_token: str | None = None,
    user_id: UUID | None = None,
) -> str:
    from app.db.session import SessionLocal

    with SessionLocal.begin() as session:
        delivery = session.execute(
            select(NotificationDelivery)
            .where(
                NotificationDelivery.delivery_id == claim.delivery_id,
                NotificationDelivery.status == "claimed",
                NotificationDelivery.claimed_by == claim.token,
            )
            .with_for_update()
        ).scalar_one_or_none()
        if delivery is None:
            logger.warning("notification_delivery_stale_claim delivery=%s", claim.delivery_id)
            return "stale"

        if outcome == "delivered":
            delivery.status = "delivered"
            delivery.delivered_at = now
        elif outcome == "expired":
            delivery.status = "expired"
        elif outcome == "suppressed":
            delivery.status = "suppressed"
        elif outcome == "permanent":
            delivery.status = "failed_permanent"
        elif delivery.attempt_count >= _DELIVERY_MAX_ATTEMPTS:
            delivery.status = "exhausted"
        else:
            delivery.status = "retry"
            base_seconds = min(30 * (2 ** max(0, delivery.attempt_count - 1)), 15 * 60)
            delivery.next_attempt_at = now + timedelta(
                seconds=base_seconds + (delivery.delivery_id.int % 31)
            )

        delivery.last_error_code = error_code
        delivery.claimed_by = None
        delivery.claim_expires_at = None
        # SessionLocal disables autoflush.  The aggregate status query must
        # observe this delivery's new state, rather than the claimed row.
        session.flush()
        _refresh_notification_status(session, delivery.notification_id, now)

        if invalid_token and user_id:
            preference = session.execute(
                select(UserNotificationPreference).where(
                    UserNotificationPreference.owner_user_id == user_id,
                    UserNotificationPreference.fcm_device_token == invalid_token,
                )
            ).scalar_one_or_none()
            if preference is not None:
                preference.fcm_device_token = None
        return delivery.status


def _deliver_claim(claim: _Claim, now: datetime) -> str:
    from app.db.session import SessionLocal

    with SessionLocal() as session:
        snapshot, reason = _load_delivery_snapshot(session, claim, now)
    if snapshot is None:
        permanent = reason in {"missing_device_token", "missing_email"}
        outcome = "expired" if reason == "expired" else ("permanent" if permanent else "suppressed")
        return _complete_claim(claim, outcome=outcome, error_code=reason, now=now)

    # Expiry is checked again immediately before the external call. A provider
    # accepted before this point may still be ambiguous if the process dies
    # before the outcome commit; that is the documented at-least-once limit.
    provider_started_at = datetime.now(UTC)
    if provider_started_at >= snapshot.expires_at:
        return _complete_claim(
            claim,
            outcome="expired",
            error_code="expired",
            now=provider_started_at,
        )

    outcome = "retry"
    error_code: str | None = "provider_failed"
    invalid_token: str | None = None
    try:
        if snapshot.channel == "push":
            result = send_push(
                snapshot.fcm_device_token or "",
                snapshot.title,
                _truncate_body(snapshot.body),
                data={"notificationId": str(snapshot.notification_id)},
            )
            if result == "sent":
                outcome, error_code = "delivered", None
            elif result == "invalid_token":
                outcome, error_code = "permanent", "invalid_device_token"
                invalid_token = snapshot.fcm_device_token
        else:
            message = build_notification_email(snapshot.user_email or "", snapshot.title, snapshot.body)
            if send_email(message):
                outcome, error_code = "delivered", None
    except Exception:
        logger.exception("notification_provider_exception delivery=%s", snapshot.delivery_id)
        error_code = "provider_exception"

    return _complete_claim(
        claim,
        outcome=outcome,
        error_code=error_code,
        now=datetime.now(UTC),
        invalid_token=invalid_token,
        user_id=snapshot.user_id,
    )


def process_notification_outbox(
    run_at_utc: datetime | None = None,
    *,
    batch_size: int = 100,
    worker_id: str | None = None,
) -> dict[str, int]:
    """Claim and deliver a bounded batch with at-least-once live semantics."""
    from app.db.session import SessionLocal

    now = run_at_utc or datetime.now(UTC)
    owner = worker_id or f"notification-worker-{uuid4()}"
    with SessionLocal.begin() as session:
        claims, expired = _expire_and_claim_due_deliveries(
            session,
            now=now,
            batch_size=batch_size,
            worker_id=owner,
        )

    summary = {
        "claimed": len(claims),
        "delivered": 0,
        "retried": 0,
        "expired": expired,
        "suppressed": 0,
        "failed": 0,
        "errors": 0,
    }
    for claim in claims:
        try:
            status = _deliver_claim(claim, now)
        except Exception:
            # Leave the committed claim in place. Claim expiry makes it
            # recoverable after a crash or an outcome-write failure.
            logger.exception("notification_delivery_error delivery=%s", claim.delivery_id)
            summary["errors"] += 1
            continue
        if status == "delivered":
            summary["delivered"] += 1
        elif status == "retry":
            summary["retried"] += 1
        elif status == "expired":
            summary["expired"] += 1
        elif status == "suppressed":
            summary["suppressed"] += 1
        elif status in {"failed_permanent", "exhausted"}:
            summary["failed"] += 1
    logger.info("notification_outbox_summary %s", summary)
    return summary


def run_notification_outbox() -> dict[str, int]:
    return process_notification_outbox()

"""Messaging safety at launch (admin spec L8, D-17, ADM-02 interim)."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.db.session import SessionLocal
from app.models.admin_audit_log import AdminAuditLog
from app.models.notification import Notification
from app.models.notification_delivery import NotificationDelivery
from app.models.user_notification_preference import UserNotificationPreference
from app.services.notification_dispatch_service import (
    _URGENT_PRIORITY,
    dispatch_notification,
    quiet_hours_release,
)
from tests.conftest import TEST_USER_ID

IST = "Asia/Kolkata"


def _utc(y, mo, d, h, mi=0) -> datetime:
    return datetime(y, mo, d, h, mi, tzinfo=UTC)


# ── Broadcast is gone until the consent-aware version ────────────────────────


def test_broadcast_returns_410_and_sends_nothing(client, monkeypatch):
    sent: list[str] = []
    monkeypatch.setattr("app.services.fcm_service.send_push", lambda *a, **k: sent.append("x") or "sent")
    response = client.post("/api/v1/admin/notify/broadcast", json={"title": "Hi", "body": "There"})
    assert response.status_code == 410
    assert sent == []
    with SessionLocal() as session:
        refused = session.query(AdminAuditLog).filter(AdminAuditLog.action == "broadcast_notification_refused").all()
    assert len(refused) == 1, "the attempt is still audited"


# ── Quiet hours: the pure rule ───────────────────────────────────────────────


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("due", "expected"),
    [
        # IST = UTC+5:30. 10:00 IST is outside quiet hours: unchanged.
        (_utc(2026, 12, 1, 4, 30), _utc(2026, 12, 1, 4, 30)),
        # 20:59 IST: still allowed.
        (_utc(2026, 12, 1, 15, 29), _utc(2026, 12, 1, 15, 29)),
        # 21:00 IST: held to 08:00 IST next day (02:30 UTC).
        (_utc(2026, 12, 1, 15, 30), _utc(2026, 12, 2, 2, 30)),
        # 02:00 IST: held to 08:00 IST the same day.
        (_utc(2026, 11, 30, 20, 30), _utc(2026, 12, 1, 2, 30)),
        # 08:00 IST exactly: allowed.
        (_utc(2026, 12, 1, 2, 30), _utc(2026, 12, 1, 2, 30)),
    ],
)
def test_quiet_hours_release_in_ist(due, expected):
    assert quiet_hours_release(due, IST) == expected


@pytest.mark.no_db
def test_quiet_hours_follow_the_users_own_timezone():
    # 22:00 in New York (UTC-5 in December) is quiet there, though it is 08:30 in Chennai.
    due = _utc(2026, 12, 2, 3, 0)
    released = quiet_hours_release(due, "America/New_York")
    assert released == _utc(2026, 12, 2, 13, 0)  # 08:00 New York


@pytest.mark.no_db
def test_unknown_timezone_falls_back_to_ist():
    due = _utc(2026, 12, 1, 15, 30)  # 21:00 IST
    assert quiet_hours_release(due, "Not/AZone") == quiet_hours_release(due, IST)
    assert quiet_hours_release(due, None) == quiet_hours_release(due, IST)


# ── Quiet hours: wired into the outbox ───────────────────────────────────────


class _FixedClock:
    """Satisfies app.core.clock.Clock."""

    def __init__(self, at: datetime):
        self._at = at

    def now_utc(self) -> datetime:
        return self._at


def _push_only_user(session) -> UUID:
    uid = UUID(TEST_USER_ID)
    session.add(UserNotificationPreference(owner_user_id=uid, notification_channel="push", fcm_device_token="tok-synthetic"))
    session.flush()
    return uid


def _dispatch(session, uid, *, at: datetime, priority: int = 50, expires_at: datetime | None = None) -> str:
    return dispatch_notification(
        session,
        uid,
        "GENERAL",
        "தலைப்பு",
        "Title",
        "உடல்",
        "Body",
        priority=priority,
        expires_at=expires_at,
        clock=_FixedClock(at),
    )


def test_a_late_evening_push_waits_until_morning(client):
    at = _utc(2026, 12, 1, 16, 0)  # 21:30 IST
    with SessionLocal() as session, session.begin():
        uid = _push_only_user(session)
        _dispatch(session, uid, at=at)
    with SessionLocal() as session:
        delivery = session.query(NotificationDelivery).one()
    assert delivery.channel == "push"
    assert delivery.next_attempt_at == _utc(2026, 12, 2, 2, 30)


def test_an_urgent_push_ignores_quiet_hours(client):
    at = _utc(2026, 12, 1, 16, 0)
    with SessionLocal() as session, session.begin():
        uid = _push_only_user(session)
        _dispatch(session, uid, at=at, priority=_URGENT_PRIORITY)
    with SessionLocal() as session:
        assert session.query(NotificationDelivery).one().next_attempt_at == at


def test_a_push_that_would_expire_while_held_stays_in_the_inbox_only(client):
    at = _utc(2026, 12, 1, 16, 0)  # 21:30 IST; morning release is 10.5 h away
    with SessionLocal() as session, session.begin():
        uid = _push_only_user(session)
        result = _dispatch(session, uid, at=at, expires_at=at + timedelta(hours=2))
    assert result == "in_app_only"
    with SessionLocal() as session:
        assert session.query(NotificationDelivery).count() == 0
        notification = session.query(Notification).one()
    assert notification.status == "sent", "an intent with nothing to deliver must not sit queued forever"

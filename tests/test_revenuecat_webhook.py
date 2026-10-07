"""RevenueCat webhook → subscription row → premium (R-2, capability reference §21).

Turning off auto-renew sends CANCELLATION. The paid period keeps running, so
the webhook must not end premium on that event; it records when access ends
and `current_subscription_filter` stops granting premium at that moment —
even if the EXPIRATION webhook is lost. A refund also arrives as CANCELLATION,
with an expiration at the refund time, so the same rule ends access at once.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.core.config import get_settings
from app.core.subscription import is_premium
from app.models.subscription import Subscription
from tests.conftest import TEST_USER_ID, SessionLocal

_SECRET = "test-revenuecat-secret"
_HEADERS = {"Authorization": f"Bearer {_SECRET}"}
_USER = UUID(TEST_USER_ID)


@pytest.fixture(autouse=True)
def _webhook_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "revenuecat_webhook_secret", _SECRET)


def _ms(when: datetime) -> int:
    return int(when.timestamp() * 1000)


def _send(client, event_type: str, expires: datetime | None = None) -> dict:
    event: dict = {"type": event_type, "app_user_id": TEST_USER_ID, "product_id": "vinaadi.premium.monthly"}
    if expires is not None:
        event["expiration_at_ms"] = _ms(expires)
    response = client.post("/api/v1/webhooks/revenuecat", json={"event": event}, headers=_HEADERS)
    assert response.status_code == 200, response.text
    return response.json()


def _row() -> Subscription:
    with SessionLocal() as session:
        sub = session.query(Subscription).filter(Subscription.user_id == _USER).one()
        session.expunge(sub)
        return sub


def _premium() -> bool:
    with SessionLocal() as session:
        return is_premium(_USER, session)


def test_cancellation_keeps_premium_until_the_paid_period_ends(client) -> None:
    ends = datetime.now(UTC) + timedelta(days=12)
    assert _send(client, "CANCELLATION", ends) == {"status": "ok"}
    row = _row()
    assert row.status == "active"
    assert row.current_period_end is not None
    assert abs((row.current_period_end - ends).total_seconds()) < 1
    assert _premium() is True


def test_refund_cancellation_ends_premium_at_once(client) -> None:
    """A refund's CANCELLATION carries an expiration at the refund time."""
    _send(client, "CANCELLATION", datetime.now(UTC) - timedelta(seconds=5))
    assert _premium() is False


def test_billing_issue_keeps_the_grace_period(client) -> None:
    _send(client, "BILLING_ISSUE", datetime.now(UTC) + timedelta(days=3))
    assert _row().status == "active"
    assert _premium() is True


def test_cancellation_without_an_expiry_changes_nothing(client) -> None:
    _send(client, "CANCELLATION")
    row = _row()
    assert row.status == "active"
    assert row.current_period_end is None
    assert _premium() is True


def test_expiration_ends_premium(client) -> None:
    _send(client, "EXPIRATION", datetime.now(UTC))
    assert _row().status == "inactive"
    assert _premium() is False


def test_a_lost_expiration_webhook_cannot_leave_a_lapsed_user_on_premium(client) -> None:
    """The period end alone ends access; no EXPIRATION event is needed."""
    _send(client, "RENEWAL", datetime.now(UTC) - timedelta(minutes=1))
    assert _row().status == "active"
    assert _premium() is False


def test_uncancellation_restores_the_period(client) -> None:
    _send(client, "CANCELLATION", datetime.now(UTC) - timedelta(seconds=5))
    assert _premium() is False
    _send(client, "UNCANCELLATION", datetime.now(UTC) + timedelta(days=30))
    assert _premium() is True


def test_subscription_endpoint_agrees_with_the_gate(client) -> None:
    """/users/me/subscription and is_premium read one rule."""
    _send(client, "RENEWAL", datetime.now(UTC) - timedelta(minutes=1))
    assert client.get("/api/v1/users/me/subscription").json()["data"] is None
    _send(client, "RENEWAL", datetime.now(UTC) + timedelta(days=30))
    assert client.get("/api/v1/users/me/subscription").json()["data"]["status"] == "active"


@pytest.mark.parametrize("event_type", ["SUBSCRIBER_ALIAS", "NON_RENEWING_PURCHASE", "TRANSFER"])
def test_unhandled_events_are_ignored(client, event_type: str) -> None:
    assert _send(client, event_type, datetime.now(UTC) - timedelta(days=1)) == {"status": "ignored"}
    assert _premium() is True

"""A10 durable notification delivery regression tests (real PostgreSQL)."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.notification_delivery import NotificationDelivery
from app.services import notification_dispatch_service as dispatch

TEST_USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _configure(channel: str, token: str | None = None) -> None:
    with SessionLocal.begin() as session:
        preference = dispatch.get_or_create_preferences(session, TEST_USER_ID)
        preference.notification_channel = channel
        preference.fcm_device_token = token


def _enqueue(
    *,
    logical_key: str,
    send_at: datetime,
    expires_at: datetime,
    channel: str = "push",
) -> UUID:
    _configure(channel, "synthetic-device-token-123456" if channel in {"push", "both"} else None)
    with SessionLocal.begin() as session:
        result = dispatch.dispatch_notification(
            session=session,
            user_id=TEST_USER_ID,
            notification_type="GENERAL",
            title_ta="சோதனை தலைப்பு",
            title_en="Synthetic title",
            body_ta="சோதனை செய்தி",
            body_en="Synthetic message",
            logical_key=logical_key,
            send_at=send_at,
            expires_at=expires_at,
        )
        assert result == "queued"
    with SessionLocal() as session:
        return session.execute(
            select(Notification.notification_id).where(Notification.logical_key == logical_key)
        ).scalar_one()


def test_committed_intent_is_claimed_then_delivered(client, monkeypatch) -> None:
    now = datetime.now(UTC)
    notification_id = _enqueue(
        logical_key=f"test:outbox:committed:{uuid4()}",
        send_at=now - timedelta(seconds=1),
        expires_at=now + timedelta(hours=1),
    )
    calls: list[str] = []
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)
    monkeypatch.setattr(
        dispatch,
        "send_push",
        lambda _token, _title, _body, data=None: calls.append(str(data)) or "sent",
    )

    summary = dispatch.process_notification_outbox(now, worker_id="test-worker")

    assert summary["delivered"] == 1
    assert len(calls) == 1
    with SessionLocal() as session:
        intent = session.get(Notification, notification_id)
        delivery = session.execute(
            select(NotificationDelivery).where(
                NotificationDelivery.notification_id == notification_id
            )
        ).scalar_one()
        assert intent is not None and intent.status == "sent"
        assert delivery.status == "delivered"
        assert delivery.attempt_count == 1


def test_expired_daily_intent_is_never_sent_but_remains_in_inbox(client, monkeypatch) -> None:
    now = datetime.now(UTC)
    notification_id = _enqueue(
        logical_key=f"test:outbox:expired:{uuid4()}",
        send_at=now - timedelta(hours=2),
        expires_at=now - timedelta(hours=1),
    )
    calls: list[str] = []
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)
    monkeypatch.setattr(
        dispatch,
        "send_push",
        lambda *_args, **_kwargs: calls.append("sent") or "sent",
    )

    summary = dispatch.process_notification_outbox(now, worker_id="test-worker")

    assert calls == []
    assert summary["expired"] == 1
    with SessionLocal() as session:
        intent = session.get(Notification, notification_id)
        assert intent is not None and intent.status == "expired"
    inbox = client.get("/api/v1/notifications")
    assert inbox.status_code == 200
    assert str(notification_id) in {row["notification_id"] for row in inbox.json()["data"]}


def test_future_inbox_only_intent_expires_without_staying_queued(client) -> None:
    now = datetime.now(UTC)
    logical_key = f"test:outbox:inbox-only-expired:{uuid4()}"
    _configure("none")
    with SessionLocal.begin() as session:
        result = dispatch.dispatch_notification(
            session=session,
            user_id=TEST_USER_ID,
            notification_type="GENERAL",
            title_ta="சோதனை தலைப்பு",
            title_en="Synthetic title",
            body_ta="சோதனை செய்தி",
            body_en="Synthetic message",
            logical_key=logical_key,
            send_at=now + timedelta(hours=1),
            expires_at=now + timedelta(hours=2),
        )
        assert result == "in_app_only"

    summary = dispatch.process_notification_outbox(
        now + timedelta(hours=3), worker_id="test-worker"
    )

    assert summary["expired"] == 1
    with SessionLocal() as session:
        intent = session.execute(
            select(Notification).where(Notification.logical_key == logical_key)
        ).scalar_one()
        assert intent.status == "expired"
        assert intent.suppression_reason == "expired"


def test_partial_channel_success_retries_only_failed_channel(client, monkeypatch) -> None:
    now = datetime.now(UTC)
    notification_id = _enqueue(
        logical_key=f"test:outbox:partial:{uuid4()}",
        send_at=now - timedelta(seconds=1),
        expires_at=now + timedelta(hours=1),
        channel="both",
    )
    push_calls: list[str] = []
    email_results = iter((False, True))
    email_calls: list[str] = []
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)
    monkeypatch.setattr(
        dispatch,
        "send_push",
        lambda *_args, **_kwargs: push_calls.append("push") or "sent",
    )

    def send_email(_message) -> bool:
        email_calls.append("email")
        return next(email_results)

    monkeypatch.setattr(dispatch, "send_email", send_email)

    first = dispatch.process_notification_outbox(now, worker_id="test-worker-1")
    assert first["delivered"] == 1
    assert first["retried"] == 1

    with SessionLocal() as session:
        email_delivery = session.execute(
            select(NotificationDelivery).where(
                NotificationDelivery.notification_id == notification_id,
                NotificationDelivery.channel == "email",
            )
        ).scalar_one()
        retry_at = email_delivery.next_attempt_at
        assert email_delivery.status == "retry"

    second = dispatch.process_notification_outbox(
        retry_at + timedelta(seconds=1),
        worker_id="test-worker-2",
    )
    assert second["delivered"] == 1
    assert push_calls == ["push"]
    assert email_calls == ["email", "email"]


def test_two_workers_cannot_claim_the_same_delivery(client, monkeypatch) -> None:
    """Two overlapping, uncommitted claims must not both see the same row.

    Running the two claims one after another (first commits, then second
    starts) would also pass this assertion from the WHERE clause alone,
    without ``FOR UPDATE SKIP LOCKED`` doing any work -- the already-"claimed"
    row is simply no longer eligible by the time the second query runs. That
    proves nothing about concurrent workers. This keeps worker-a's
    transaction open (uncommitted) while worker-b claims, so the only thing
    that can keep worker-b from seeing the row is the row lock itself.
    """
    now = datetime.now(UTC)
    _enqueue(
        logical_key=f"test:outbox:claim:{uuid4()}",
        send_at=now - timedelta(seconds=1),
        expires_at=now + timedelta(hours=1),
    )
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)

    first_session = SessionLocal()
    try:
        first, _ = dispatch._expire_and_claim_due_deliveries(
            first_session,
            now=now,
            batch_size=1,
            worker_id="worker-a",
        )
        assert len(first) == 1
        # worker-a's UPDATE is not yet committed; the row lock it took is the
        # only thing standing between worker-b and the same row.
        with SessionLocal.begin() as second_session:
            second, _ = dispatch._expire_and_claim_due_deliveries(
                second_session,
                now=now,
                batch_size=1,
                worker_id="worker-b",
            )
        assert second == []
        first_session.commit()
    finally:
        first_session.close()


def test_expired_claim_is_recovered_and_old_owner_is_fenced(client, monkeypatch) -> None:
    now = datetime.now(UTC)
    _enqueue(
        logical_key=f"test:outbox:fencing:{uuid4()}",
        send_at=now - timedelta(seconds=1),
        expires_at=now + timedelta(hours=1),
    )
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)
    with SessionLocal.begin() as session:
        first, _ = dispatch._expire_and_claim_due_deliveries(
            session,
            now=now,
            batch_size=1,
            worker_id="worker-a",
        )
    with SessionLocal.begin() as session:
        second, _ = dispatch._expire_and_claim_due_deliveries(
            session,
            now=now + dispatch._CLAIM_TTL + timedelta(seconds=1),
            batch_size=1,
            worker_id="worker-b",
        )

    assert len(first) == len(second) == 1
    stale = dispatch._complete_claim(
        first[0],
        outcome="delivered",
        error_code=None,
        now=now,
    )
    current = dispatch._complete_claim(
        second[0],
        outcome="delivered",
        error_code=None,
        now=now,
    )
    assert stale == "stale"
    assert current == "delivered"


def test_provider_acceptance_before_outcome_failure_is_retried_at_least_once(
    client,
    monkeypatch,
) -> None:
    now = datetime.now(UTC)
    _enqueue(
        logical_key=f"test:outbox:ambiguous:{uuid4()}",
        send_at=now - timedelta(seconds=1),
        expires_at=now + timedelta(days=1),
    )
    calls: list[str] = []
    monkeypatch.setattr(dispatch, "get_flag", lambda _: True)
    monkeypatch.setattr(
        dispatch,
        "send_push",
        lambda *_args, **_kwargs: calls.append("accepted") or "sent",
    )
    real_complete = dispatch._complete_claim
    monkeypatch.setattr(dispatch, "_complete_claim", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("commit gap")))

    first = dispatch.process_notification_outbox(now, worker_id="worker-a")
    assert first["errors"] == 1
    assert calls == ["accepted"]

    monkeypatch.setattr(dispatch, "_complete_claim", real_complete)
    second = dispatch.process_notification_outbox(
        now + dispatch._CLAIM_TTL + timedelta(seconds=1),
        worker_id="worker-b",
    )
    assert second["delivered"] == 1
    assert calls == ["accepted", "accepted"]

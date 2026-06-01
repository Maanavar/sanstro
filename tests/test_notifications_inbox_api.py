from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from app.db.session import SessionLocal
from app.models.notification import Notification

TEST_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def _seed_notifications() -> tuple[UUID, UUID]:
    user_id = UUID(TEST_USER_ID)
    unread_id = uuid4()
    read_id = uuid4()
    now = datetime.now(UTC)
    with SessionLocal() as session:
        session.add(
            Notification(
                notification_id=unread_id,
                user_id=user_id,
                chart_id=None,
                type="GENERAL",
                priority=50,
                title="Unread",
                body="Unread body",
                send_at=now,
                status="sent",
                payload={},
                read_at=None,
            )
        )
        session.add(
            Notification(
                notification_id=read_id,
                user_id=user_id,
                chart_id=None,
                type="GENERAL",
                priority=40,
                title="Read",
                body="Read body",
                send_at=now - timedelta(minutes=5),
                status="sent",
                payload={},
                read_at=now,
            )
        )
        session.commit()
    return unread_id, read_id


def test_notifications_inbox_happy_path(client):
    unread_id, _ = _seed_notifications()
    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["unread_count"] >= 1
    assert any(item["notification_id"] == str(unread_id) for item in body["data"])


def test_notifications_inbox_requires_auth(raw_client):
    response = raw_client.get("/api/v1/notifications")
    assert response.status_code == 401


def test_notifications_mark_read_updates_unread_count(client):
    unread_id, _ = _seed_notifications()
    mark = client.post(f"/api/v1/notifications/{unread_id}/read")
    assert mark.status_code == 200
    after = client.get("/api/v1/notifications")
    assert after.status_code == 200
    assert after.json()["unread_count"] == 0

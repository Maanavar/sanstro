from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.user_preference import UserPreference

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

def test_notifications_inbox_hides_future_queued_until_due(client):
    user_id = UUID(TEST_USER_ID)
    future_id = uuid4()
    due_id = uuid4()
    now = datetime.now(UTC)
    with SessionLocal() as session:
        session.add(
            Notification(
                notification_id=future_id,
                user_id=user_id,
                chart_id=None,
                type="JADHAGAM_D1_NUDGE",
                priority=45,
                title="Future",
                body="Future body",
                send_at=now + timedelta(hours=1),
                status="queued",
                payload={},
                read_at=None,
            )
        )
        session.add(
            Notification(
                notification_id=due_id,
                user_id=user_id,
                chart_id=None,
                type="JADHAGAM_D1_NUDGE",
                priority=45,
                title="Due",
                body="Due body",
                send_at=now - timedelta(minutes=1),
                status="queued",
                payload={},
                read_at=None,
            )
        )
        session.commit()

    response = client.get("/api/v1/notifications")

    assert response.status_code == 200
    ids = {item["notification_id"] for item in response.json()["data"]}
    assert str(due_id) in ids
    assert str(future_id) not in ids


def test_notifications_inbox_follows_the_current_account_language(client):
    """Bilingual notification payloads should follow a later language switch."""
    user_id = UUID(TEST_USER_ID)
    notification_id = uuid4()
    with SessionLocal() as session:
        preference = session.query(UserPreference).filter_by(owner_user_id=user_id).first()
        if preference is None:
            preference = UserPreference(owner_user_id=user_id, dashboard_lang="en")
            session.add(preference)
        else:
            preference.dashboard_lang = "en"
        session.add(
            Notification(
                notification_id=notification_id,
                user_id=user_id,
                chart_id=None,
                type="GENERAL",
                priority=50,
                title="Tamil title",
                body="Tamil body",
                language="ta",
                send_at=datetime.now(UTC),
                status="sent",
                payload={
                    "title": {"ta": "Tamil title", "en": "English title"},
                    "body": {"ta": "Tamil body", "en": "English body"},
                },
            )
        )
        session.commit()

    english = client.get("/api/v1/notifications").json()["data"]
    english_item = next(item for item in english if item["notification_id"] == str(notification_id))
    assert english_item["title"] == "English title"
    assert english_item["body"] == "English body"

    with SessionLocal() as session:
        session.query(UserPreference).filter_by(owner_user_id=user_id).update({"dashboard_lang": "ta"})
        session.commit()

    tamil = client.get("/api/v1/notifications").json()["data"]
    tamil_item = next(item for item in tamil if item["notification_id"] == str(notification_id))
    assert tamil_item["title"] == "Tamil title"
    assert tamil_item["body"] == "Tamil body"

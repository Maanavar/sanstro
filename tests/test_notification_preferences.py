"""Tests for ARCH-02: notification preference endpoints + dispatch service."""
from __future__ import annotations

from unittest.mock import patch
from uuid import UUID

TEST_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


# ── Preference API tests ──────────────────────────────────────────────────────

def test_get_notification_preferences_defaults(client):
    """GET /settings/notifications creates a default row (all off) on first call."""
    resp = client.get("/api/v1/settings/notifications")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["notification_channel"] == "none"
    assert data["morningAlertEnabled"] is False
    assert data["dashaAlertEnabled"] is False
    assert data["piranthaNaalAlertEnabled"] is False
    assert data["smartSilenceEnabled"] is True
    assert data["fcmTokenRegistered"] is False


def test_patch_notification_channel(client):
    """PATCH updates the channel."""
    resp = client.patch(
        "/api/v1/settings/notifications",
        json={"notificationChannel": "email"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["notification_channel"] == "email"


def test_patch_invalid_channel_rejected(client):
    """PATCH with unknown channel returns 422."""
    resp = client.patch(
        "/api/v1/settings/notifications",
        json={"notificationChannel": "sms"},
    )
    assert resp.status_code == 422


def test_patch_morning_alert_time(client):
    resp = client.patch(
        "/api/v1/settings/notifications",
        json={"morningAlertEnabled": True, "morningAlertTime": "07:30"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["morningAlertEnabled"] is True
    assert data["morningAlertTime"] == "07:30"


def test_patch_invalid_time_rejected(client):
    resp = client.patch(
        "/api/v1/settings/notifications",
        json={"morningAlertTime": "25:99"},
    )
    assert resp.status_code == 422


def test_put_fcm_token(client):
    """PUT /settings/notifications/fcm-token registers a token."""
    resp = client.put(
        "/api/v1/settings/notifications/fcm-token",
        json={"fcmDeviceToken": "a" * 20},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["fcmTokenRegistered"] is True


def test_delete_fcm_token(client):
    """DELETE removes the token."""
    client.put(
        "/api/v1/settings/notifications/fcm-token",
        json={"fcmDeviceToken": "a" * 20},
    )
    resp = client.delete("/api/v1/settings/notifications/fcm-token")
    assert resp.status_code == 200
    assert resp.json()["data"]["fcmTokenRegistered"] is False


def test_all_channels_accepted(client):
    for channel in ("none", "email", "push", "both"):
        resp = client.patch(
            "/api/v1/settings/notifications",
            json={"notificationChannel": channel},
        )
        assert resp.status_code == 200, f"channel={channel} failed"
        assert resp.json()["data"]["notification_channel"] == channel


def test_patch_is_idempotent(client):
    """Multiple PATCHes with same value leave the row stable."""
    for _ in range(3):
        resp = client.patch("/api/v1/settings/notifications", json={"dashaAlertEnabled": True})
        assert resp.status_code == 200
    assert resp.json()["data"]["dashaAlertEnabled"] is True


# ── email_service stub-mode test ──────────────────────────────────────────────

def test_send_email_stub_mode_returns_true(client):
    """send_email returns True in stub mode (no SMTP config)."""
    from app.services.email_service import EmailMessage, send_email

    with patch("app.services.email_service._smtp_configured", return_value=False):
        result = send_email(EmailMessage(
            to_address="test@example.com",
            subject="Test",
            body_text="Hello",
        ))
    assert result is True


def test_build_notification_email_structure(client):
    from app.services.email_service import build_notification_email

    msg = build_notification_email("test@example.com", "Title", "Body")
    assert msg.to_address == "test@example.com"
    assert msg.subject == "Title"
    assert "Title" in msg.body_text
    assert msg.body_html is not None
    assert "<h2>" in msg.body_html


# ── fcm_service stub-mode test ────────────────────────────────────────────────

def test_send_push_stub_mode_returns_true(client):
    """send_push returns True in stub mode (no FCM config)."""
    from app.services.fcm_service import send_push

    with patch("app.services.fcm_service._fcm_configured", return_value=False):
        result = send_push("fake_token_abc123", "Title", "Body")
    assert result is True


# ── dispatch service tests ────────────────────────────────────────────────────

def test_dispatch_in_app_only_when_channel_none(client):
    """channel=none persists to the in-app inbox and returns 'in_app_only' (push/email opted out)."""
    from app.db.session import SessionLocal
    from app.services.notification_dispatch_service import dispatch_notification

    with SessionLocal() as session:
        with session.begin():
            result = dispatch_notification(
                session=session,
                user_id=UUID(TEST_USER_ID),
                notification_type="MORNING_NALLA_NERAM",
                title_ta="தலைப்பு",
                title_en="Title",
                body_ta="உடல்",
                body_en="Body",
            )

    assert result == "in_app_only"


def test_dispatch_smart_silence_suppresses_during_heavy_sani(client):
    """Smart silence suppresses second push on same day during JANMA_SANI."""
    from app.db.session import SessionLocal
    from app.services.notification_dispatch_service import dispatch_notification, get_or_create_preferences

    with SessionLocal() as session:
        with session.begin():
            pref = get_or_create_preferences(session, UUID(TEST_USER_ID))
            pref.notification_channel = "push"
            pref.fcm_device_token = "fake_device_token_123456"
            pref.smart_silence_enabled = True

    with patch("app.services.fcm_service._fcm_configured", return_value=False), \
         patch("app.services.notification_dispatch_service._push_count_today", return_value=1):
        with SessionLocal() as session:
            with session.begin():
                result = dispatch_notification(
                    session=session,
                    user_id=UUID(TEST_USER_ID),
                    notification_type="MORNING_NALLA_NERAM",
                    title_ta="தலைப்பு",
                    title_en="Title",
                    body_ta="உடல்",
                    body_en="Body",
                    sani_cycle="JANMA_SANI",
                )

    assert result == "suppressed"


def test_dispatch_no_smart_silence_outside_heavy_sani(client):
    """Smart silence does not fire for non-Sani-heavy cycles."""
    from app.db.session import SessionLocal
    from app.services.notification_dispatch_service import dispatch_notification, get_or_create_preferences

    with SessionLocal() as session:
        with session.begin():
            pref = get_or_create_preferences(session, UUID(TEST_USER_ID))
            pref.notification_channel = "push"
            pref.fcm_device_token = "fake_device_token_789012"
            pref.smart_silence_enabled = True

    with patch("app.services.fcm_service._fcm_configured", return_value=False), \
         patch("app.services.notification_dispatch_service._push_count_today", return_value=5):
        with SessionLocal() as session:
            with session.begin():
                result = dispatch_notification(
                    session=session,
                    user_id=UUID(TEST_USER_ID),
                    notification_type="MORNING_NALLA_NERAM",
                    title_ta="தலைப்பு",
                    title_en="Title",
                    body_ta="உடல்",
                    body_en="Body",
                    sani_cycle="ARDHASHTAMA_SANI",  # not in HEAVY set
                )

    # FCM not configured → stub returns True → sent_push
    assert result == "sent_push"

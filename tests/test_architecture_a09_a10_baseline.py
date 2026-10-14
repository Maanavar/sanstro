"""Behavioural regression gates for architecture findings A09 and A10.

These tests deliberately use the pre-existing public seams so the unfixed
baseline fails because of behaviour, not because a proposed outbox module is
missing.
"""
from __future__ import annotations

import asyncio
from uuid import UUID

import pytest

from app.core.config import Settings

TEST_USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _production_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "database_url": "postgresql://synthetic.invalid/vinaadi",
        "environment": "production",
        "process_role": "api",
        "jwt_secret": "synthetic-jwt-secret",
        "admin_api_key": "synthetic-admin-secret",
        "encryption_key": "synthetic-encryption-key",
        "cookie_secure": True,
    }
    values.update(overrides)
    return Settings(**values)


def test_production_api_refuses_scheduler_ownership(monkeypatch: pytest.MonkeyPatch) -> None:
    """Production scheduling belongs to the dedicated worker, never the API."""
    monkeypatch.setenv("TRUSTED_PROXY_HOPS_BEFORE_WEB", "0")

    with pytest.raises(RuntimeError, match="dedicated worker"):
        _production_settings(run_scheduler_in_web=True)


def test_worker_does_not_idle_without_scheduler_leadership(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A supervised worker must fail when it cannot establish leadership."""
    import app.core.leader_lock as leader_lock
    import app.worker as worker

    class UnavailableLease:
        def __init__(self, _engine: object) -> None:
            pass

        def acquire(self) -> bool:
            return False

        def release(self) -> None:
            pass

    async def unexpected_idle() -> None:
        pytest.fail("worker idled without leadership instead of failing")

    monkeypatch.setattr(leader_lock, "SchedulerLease", UnavailableLease)
    monkeypatch.setattr(worker, "_wait_forever", unexpected_idle)

    with pytest.raises(RuntimeError, match="leadership"):
        asyncio.run(worker._run())


def test_notification_provider_is_not_called_before_intent_commit(
    client,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Rolling back an intent must not leave an already-accepted push outside DB state."""
    from app.db.session import SessionLocal
    from app.services.notification_dispatch_service import (
        dispatch_notification,
        get_or_create_preferences,
    )

    provider_calls: list[str] = []

    def accept_push(_token: str, _title: str, _body: str) -> str:
        provider_calls.append("accepted")
        return "sent"

    monkeypatch.setattr("app.services.notification_dispatch_service.get_flag", lambda _: True)
    monkeypatch.setattr("app.services.notification_dispatch_service.send_push", accept_push)

    with SessionLocal() as session:
        preference = get_or_create_preferences(session, TEST_USER_ID)
        preference.notification_channel = "push"
        preference.fcm_device_token = "synthetic-device-token-123456"
        session.commit()

    with SessionLocal() as session:
        dispatch_notification(
            session=session,
            user_id=TEST_USER_ID,
            notification_type="GENERAL",
            title_ta="சோதனை தலைப்பு",
            title_en="Synthetic title",
            body_ta="சோதனை செய்தி",
            body_en="Synthetic message",
        )
        session.rollback()

    assert provider_calls == []

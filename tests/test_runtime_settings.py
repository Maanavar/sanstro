"""Persisted flags, kill switches and site status (admin spec L10, ADM-09).

The defect: flags lived in one worker's memory. These tests pin the three
properties that fix it — a change is visible to a process that did not make it,
survives a restart, and records who/why — plus the guard rails around it.
"""
from __future__ import annotations

from unittest.mock import patch
from uuid import UUID

import pytest

from app.core.kill_switch import KILL_SWITCHES
from app.db.session import SessionLocal
from app.models.runtime_setting import RuntimeSetting, RuntimeSettingChange
from app.services import feature_flags
from tests.conftest import TEST_USER_ID

ACTOR = UUID(TEST_USER_ID)


@pytest.fixture(autouse=True)
def _clean_process_state():
    feature_flags._overrides.clear()
    feature_flags.invalidate_cache()
    yield
    feature_flags._overrides.clear()
    feature_flags.invalidate_cache()


def _simulate_another_process() -> None:
    """Forget everything this process holds, as a second worker or a restart would."""
    feature_flags._overrides.clear()
    feature_flags.invalidate_cache()


# ── Persistence: the ADM-09 defect itself ────────────────────────────────────


def test_a_persisted_change_reaches_a_process_that_did_not_make_it(client):
    feature_flags.persist_flag("enable_ask_vinaadi", False, reason="incident drill", actor_user_id=ACTOR)
    _simulate_another_process()
    assert feature_flags.get_flag("enable_ask_vinaadi") is False


def test_a_row_written_elsewhere_is_picked_up_after_the_cache_window(client):
    """Another worker's write lands in the table; this process never called persist_flag."""
    assert feature_flags.get_flag("maintenance_mode") is False
    with SessionLocal() as session, session.begin():
        session.add(RuntimeSetting(name="maintenance_mode", value=True, reason="other worker"))
    feature_flags.invalidate_cache()  # stands in for the TTL elapsing
    assert feature_flags.get_flag("maintenance_mode") is True


def test_the_cache_is_bounded_by_its_ttl(client, monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr(feature_flags.time, "monotonic", lambda: clock[0])
    assert feature_flags.get_flag("enable_signups") is True
    with SessionLocal() as session, session.begin():
        session.add(RuntimeSetting(name="enable_signups", value=False, reason="other worker"))
    clock[0] += feature_flags._PERSISTED_TTL_SECONDS / 2
    assert feature_flags.get_flag("enable_signups") is True, "inside the window the snapshot holds"
    clock[0] += feature_flags._PERSISTED_TTL_SECONDS
    assert feature_flags.get_flag("enable_signups") is False, "after the window the change is seen"


def test_an_unreadable_store_keeps_the_last_good_snapshot(client, monkeypatch):
    """A database blip must not flip a kill switch back on."""
    feature_flags.persist_flag("enable_payments_checkout", False, reason="incident", actor_user_id=ACTOR)
    assert feature_flags.get_flag("enable_payments_checkout") is False

    def _down() -> dict:
        raise RuntimeError("database down")

    monkeypatch.setattr(feature_flags, "_load_persisted", _down)
    feature_flags._persisted_loaded_at = None  # force a reload attempt, keep the snapshot
    assert feature_flags.get_flag("enable_payments_checkout") is False


def test_a_process_override_still_wins_for_tests_and_trials(client):
    feature_flags.persist_flag("maintenance_mode", True, reason="x" * 5, actor_user_id=ACTOR)
    feature_flags.set_flag("maintenance_mode", False)
    assert feature_flags.get_flag("maintenance_mode") is False


# ── Validation ───────────────────────────────────────────────────────────────


def test_every_change_needs_a_reason(client):
    with pytest.raises(feature_flags.FlagValueError):
        feature_flags.persist_flag("maintenance_mode", True, reason="  ", actor_user_id=ACTOR)
    response = client.patch("/api/v1/admin/flags/maintenance_mode", json={"value": True})
    assert response.status_code == 422
    assert "reason" in response.json()["detail"].lower()


def test_a_string_cannot_switch_a_boolean_flag(client):
    """Before: only doctrine flags were type-checked, so "false" (truthy) was accepted."""
    response = client.patch(
        "/api/v1/admin/flags/maintenance_mode", json={"value": "false", "reason": "typo test"}
    )
    assert response.status_code == 422
    assert feature_flags.get_flag("maintenance_mode") is False


def test_doctrine_flags_are_never_persisted(client, monkeypatch):
    monkeypatch.delenv("WEB_CONCURRENCY", raising=False)
    with pytest.raises(feature_flags.DoctrineFlagNotPersistable):
        feature_flags.persist_flag("doctrine_o3_cross_samyam", True, reason="trial", actor_user_id=ACTOR)
    response = client.patch(
        "/api/v1/admin/flags/doctrine_o3_cross_samyam", json={"value": True, "reason": "trial"}
    )
    assert response.status_code == 200
    assert response.json()["source"] == "process"
    with SessionLocal() as session:
        assert session.get(RuntimeSetting, "doctrine_o3_cross_samyam") is None
    # And a doctrine row planted in the table is ignored on read.
    with SessionLocal() as session, session.begin():
        session.add(RuntimeSetting(name="doctrine_o7_nb_navamsa", value=True, reason="planted"))
    _simulate_another_process()
    assert feature_flags.get_flag("doctrine_o7_nb_navamsa") is False


# ── History and rollback ─────────────────────────────────────────────────────


def test_history_records_old_new_actor_and_reason_and_rollback_restores(client):
    first = client.patch(
        "/api/v1/admin/flags/maintenance_banner_en",
        json={"value": "Back at 10pm", "reason": "planned upgrade"},
    )
    assert first.status_code == 200, first.text
    second = client.patch(
        "/api/v1/admin/flags/maintenance_banner_en",
        json={"value": "Back at 11pm", "reason": "running late"},
    )
    assert second.status_code == 200

    history = client.get("/api/v1/admin/flags/history", params={"name": "maintenance_banner_en"}).json()
    assert [row["new_value"] for row in history] == ["Back at 11pm", "Back at 10pm"]
    latest = history[0]
    assert latest["old_value"] == "Back at 10pm"
    assert latest["reason"] == "running late"
    assert latest["actor_user_id"] == TEST_USER_ID

    rolled = client.post(
        f"/api/v1/admin/flags/changes/{latest['id']}/rollback", json={"reason": "wrong time"}
    )
    assert rolled.status_code == 200, rolled.text
    assert rolled.json()["value"] == "Back at 10pm"

    # Rolling back the very first change returns to the code default.
    client.post(f"/api/v1/admin/flags/changes/{history[1]['id']}/rollback", json={"reason": "clear it"})
    _simulate_another_process()
    assert feature_flags.get_flag("maintenance_banner_en") == ""
    with SessionLocal() as session:
        assert session.query(RuntimeSettingChange).count() == 4, "rollbacks are new rows, not edits"


def test_reset_clears_the_persisted_row_for_every_worker(client):
    client.patch("/api/v1/admin/flags/enable_signups", json={"value": False, "reason": "spam wave"})
    reset = client.delete("/api/v1/admin/flags/enable_signups/reset", params={"reason": "wave over"})
    assert reset.status_code == 200
    _simulate_another_process()
    assert feature_flags.get_flag("enable_signups") is True


# ── Kill switches ────────────────────────────────────────────────────────────


def test_every_kill_switch_is_a_registered_boolean_flag():
    defaults = feature_flags._defaults()
    for switch in KILL_SWITCHES:
        assert defaults.get(switch) is True, f"{switch} must exist and default to live"


def test_ask_vinaadi_switch_answers_without_calling_the_provider(client):
    from tests.test_ask_vinaadi import _create_test_chart

    _, chart_id = _create_test_chart(client)
    feature_flags.persist_flag("enable_ask_vinaadi", False, reason="provider outage", actor_user_id=ACTOR)
    with patch(
        "app.services.ask_vinaadi_service._call_claude",
        side_effect=AssertionError("provider must not be called while Ask is paused"),
    ):
        response = client.post(
            f"/api/v1/charts/{chart_id}/ask", json={"question": "Is this a good week?", "lang": "en"}
        )
    assert response.status_code == 503
    error = response.json()["error"]
    assert error["code"] == "SERVICE_UNAVAILABLE"
    assert error["message"]["ta"], "paused message must render in Tamil"


def test_guest_chart_switch_pauses_the_public_chart_tools(raw_client):
    feature_flags.persist_flag("enable_guest_charts", False, reason="load shedding", actor_user_id=None)
    payload = {
        "birth": {
            "birthDateLocal": "1990-01-01",
            "birthTimeLocal": "06:00:00",
            "birthLatitude": 13.08,
            "birthLongitude": 80.27,
            "birthTimezone": "Asia/Kolkata",
        }
    }
    for path in ("/api/v1/public/chart", "/api/v1/public/chart-preview"):
        response = raw_client.post(path, json=payload)
        assert response.status_code == 503, (path, response.text)


def test_signup_switch_blocks_new_accounts_on_web_and_mobile(raw_client):
    feature_flags.persist_flag("enable_signups", False, reason="spam wave", actor_user_id=None)
    body = {"email": "new.person@example.invalid", "password": "synthetic-pass-123", "consentGiven": True}
    web = raw_client.post("/api/v1/auth/register", json=body)
    mobile = raw_client.post("/api/v1/auth/mobile/register", json=body)
    assert web.status_code == 503, web.text
    assert mobile.status_code == 503, mobile.text
    from app.models.user import User

    with SessionLocal() as session:
        assert session.query(User).filter(User.email == body["email"]).first() is None


# ── Site status ──────────────────────────────────────────────────────────────


def test_site_status_reports_banner_and_paused_features(raw_client):
    quiet = raw_client.get("/api/v1/site-status").json()
    assert quiet == {"maintenance": False, "banner": None, "paused": []}

    feature_flags.persist_flag("maintenance_banner_ta", "இரவு 10 மணிக்கு பராமரிப்பு", reason="notice", actor_user_id=None)
    feature_flags.persist_flag("enable_ask_vinaadi", False, reason="outage", actor_user_id=None)
    status = raw_client.get("/api/v1/site-status").json()
    assert status["banner"] == {"en": "இரவு 10 மணிக்கு பராமரிப்பு", "ta": "இரவு 10 மணிக்கு பராமரிப்பு"}
    assert status["paused"] == ["enable_ask_vinaadi"]


def test_site_status_answers_during_maintenance(raw_client):
    feature_flags.persist_flag("maintenance_mode", True, reason="upgrade", actor_user_id=None)
    response = raw_client.get("/api/v1/site-status")
    assert response.status_code == 200
    assert response.json()["maintenance"] is True

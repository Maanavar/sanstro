"""Unit tests for the daily push notification cron."""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.services.daily_push_cron import (
    _dispatch_for_user,
    _morning_alert_due,
    _score_label,
    run_daily_push_cron,
)


# ---------------------------------------------------------------------------
# _score_label
# ---------------------------------------------------------------------------

def test_score_label_strong_support():
    assert _score_label(80) == "STRONG_SUPPORT"


def test_score_label_good():
    assert _score_label(65) == "GOOD"


def test_score_label_balanced():
    assert _score_label(50) == "BALANCED"


def test_score_label_caution():
    assert _score_label(35) == "CAUTION"


def test_score_label_restorative():
    assert _score_label(34) == "RESTORATIVE"


# ---------------------------------------------------------------------------
# _morning_alert_due
# ---------------------------------------------------------------------------

def _make_pref(alert_time: time) -> MagicMock:
    pref = MagicMock()
    pref.morning_alert_time = alert_time
    return pref


def test_morning_alert_due_within_window():
    # User alert time 06:00 IST = 00:30 UTC
    pref = _make_pref(time(6, 0))
    # now_utc = 00:30 UTC → 06:00 IST — exactly on time
    now_utc = datetime(2026, 5, 26, 0, 30, tzinfo=UTC)
    assert _morning_alert_due(pref, now_utc, "Asia/Kolkata") is True


def test_morning_alert_due_too_early():
    pref = _make_pref(time(6, 0))
    # 3 hours before alert time → outside ±30 min window
    now_utc = datetime(2026, 5, 25, 21, 30, tzinfo=UTC)
    assert _morning_alert_due(pref, now_utc, "Asia/Kolkata") is False


def test_morning_alert_due_invalid_timezone():
    pref = _make_pref(time(6, 0))
    now_utc = datetime(2026, 5, 26, 0, 30, tzinfo=UTC)
    assert _morning_alert_due(pref, now_utc, "Invalid/Zone") is False


# ---------------------------------------------------------------------------
# run_daily_push_cron — integration smoke test with full mocking
# ---------------------------------------------------------------------------

def _make_mock_chain():
    """Build a minimal mock DB chain for run_daily_push_cron."""
    session = MagicMock()

    # pref with all three alerts enabled
    pref = MagicMock()
    pref.owner_user_id = uuid4()
    pref.notification_channel = "push"
    pref.morning_alert_enabled = True
    pref.dasha_alert_enabled = False
    pref.pirantha_naal_alert_enabled = False

    # Execution chain: SELECT prefs returns [pref]
    prefs_result = MagicMock()
    prefs_result.scalars.return_value.all.return_value = [pref]

    session.execute.return_value = prefs_result

    user = MagicMock()
    user.user_id = pref.owner_user_id
    user.email = "test@example.com"
    session.get.return_value = user

    return session, pref, user


def test_run_daily_push_cron_no_prefs(monkeypatch):
    """When no users have notification preferences, cron exits cleanly."""
    def fake_session_local():
        session = MagicMock()
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        session.execute.return_value = result
        session.__enter__ = lambda s: session
        session.__exit__ = MagicMock(return_value=False)
        return session

    monkeypatch.setattr("app.services.daily_push_cron.SessionLocal", fake_session_local)

    summary = run_daily_push_cron(run_at_utc=datetime(2026, 5, 26, 6, 0, tzinfo=UTC))
    assert summary["dispatched"] == 0
    assert summary["errors"] == 0


def test_run_daily_push_cron_opted_out_skipped(monkeypatch):
    """Users with channel=none but morning alert enabled are still skipped at the outer filter."""
    def fake_session_local():
        session = MagicMock()
        pref = MagicMock()
        pref.notification_channel = "none"
        pref.morning_alert_enabled = False
        pref.dasha_alert_enabled = False
        pref.pirantha_naal_alert_enabled = False
        result = MagicMock()
        result.scalars.return_value.all.return_value = [pref]
        session.execute.return_value = result
        session.__enter__ = lambda s: session
        session.__exit__ = MagicMock(return_value=False)
        return session

    monkeypatch.setattr("app.services.daily_push_cron.SessionLocal", fake_session_local)

    summary = run_daily_push_cron(run_at_utc=datetime(2026, 5, 26, 6, 0, tzinfo=UTC))
    assert summary["skipped"] >= 1


def test_score_label_boundaries():
    assert _score_label(79) == "GOOD"
    assert _score_label(64) == "BALANCED"
    assert _score_label(49) == "CAUTION"
    assert _score_label(0) == "RESTORATIVE"
    assert _score_label(100) == "STRONG_SUPPORT"


def test_dispatch_for_user_uses_current_location_for_daily_panchangam(monkeypatch):
    session = MagicMock()
    user = MagicMock()
    user.user_id = uuid4()
    user.email = "user@example.com"
    pref = MagicMock()
    pref.morning_alert_enabled = True
    pref.dasha_alert_enabled = False
    pref.pirantha_naal_alert_enabled = False

    profile = MagicMock()
    profile.birth_profile_id = uuid4()
    profile.birth_timezone = "Asia/Kolkata"
    profile.current_latitude = 40.7128
    profile.current_longitude = -74.0060
    profile.current_timezone = "America/New_York"

    chart = MagicMock()
    chart.chart_id = uuid4()

    captured: dict[str, object] = {}

    def fake_calculate_daily_panchangam(on_date, latitude, longitude, timezone_name):
        captured["args"] = (on_date, latitude, longitude, timezone_name)
        slot = MagicMock()
        slot.start = datetime(2026, 5, 26, 9, 0, tzinfo=UTC)
        slot.end = datetime(2026, 5, 26, 10, 0, tzinfo=UTC)
        rahu = MagicMock()
        rahu.start = datetime(2026, 5, 26, 13, 30, tzinfo=UTC)
        rahu.end = datetime(2026, 5, 26, 15, 0, tzinfo=UTC)
        return MagicMock(
            nakshatra_number=1,
            nalla_neram=[slot],
            rahu_kalam=rahu,
        )

    monkeypatch.setattr("app.services.daily_push_cron._latest_active_profile", lambda *_: profile)
    monkeypatch.setattr("app.services.daily_push_cron._latest_completed_chart", lambda *_: chart)
    monkeypatch.setattr("app.services.daily_push_cron._morning_alert_due", lambda *_: True)
    monkeypatch.setattr("app.services.daily_push_cron._already_sent_today", lambda *_: False)
    monkeypatch.setattr("app.services.daily_push_cron.calculate_daily_panchangam", fake_calculate_daily_panchangam)
    monkeypatch.setattr("app.services.daily_push_cron.build_nakshatra_perspective", lambda *_: None)
    monkeypatch.setattr(
        "app.services.daily_push_cron.build_morning_notification",
        lambda **_: {"title": {"ta": "ta", "en": "en"}, "body": {"ta": "ta", "en": "en"}},
    )
    monkeypatch.setattr("app.services.daily_push_cron.dispatch_notification", lambda **_: "sent_push")

    _dispatch_for_user(
        session=session,
        user=user,
        pref=pref,
        run_date=date(2026, 5, 26),
        now_utc=datetime(2026, 5, 26, 12, 0, tzinfo=UTC),
    )

    assert "args" in captured
    _, latitude, longitude, timezone_name = captured["args"]
    assert latitude == 40.7128
    assert longitude == -74.006
    assert timezone_name == "America/New_York"

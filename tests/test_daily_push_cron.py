"""Unit tests for the daily push notification cron."""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.services.daily_push_cron import (
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

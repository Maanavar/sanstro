"""Unit tests for the daily push notification cron."""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.services.daily_push_cron import (
    _dispatch_for_user,
    _morning_alert_due,
    _score_label,
    run_daily_push_cron,
)

pytestmark = pytest.mark.no_db


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
    assert summary["enqueued"] == 0
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
        slot.name = "LABHAM"
        rahu = MagicMock()
        rahu.start = datetime(2026, 5, 26, 13, 30, tzinfo=UTC)
        rahu.end = datetime(2026, 5, 26, 15, 0, tzinfo=UTC)
        # `day_quality_for` (AAU-07) reads the star spans, sunrise, sunset,
        # tithi and date, so those are real values, not mocks.
        return MagicMock(
            nakshatra_number=1,
            nakshatra_spans=(),
            sunrise=datetime(2026, 5, 26, 10, 0, tzinfo=UTC),
            sunset=datetime(2026, 5, 27, 0, 30, tzinfo=UTC),
            tithi_number=5,
            date_local=date(2026, 5, 26),
            nalla_neram=[slot],
            rahu_kalam=rahu,
        )

    monkeypatch.setattr("app.services.daily_push_cron._own_profile", lambda *_: profile)
    monkeypatch.setattr("app.services.daily_push_cron._latest_completed_chart", lambda *_: chart)
    monkeypatch.setattr("app.services.daily_push_cron._chandrashtama_fallback", lambda *_: False)
    monkeypatch.setattr("app.services.daily_push_cron._morning_alert_due", lambda *_: True)
    monkeypatch.setattr("app.services.daily_push_cron._already_sent_today", lambda *_: False)
    monkeypatch.setattr("app.services.daily_push_cron.calculate_daily_panchangam", fake_calculate_daily_panchangam)
    monkeypatch.setattr("app.services.daily_push_cron.build_nakshatra_perspective", lambda *_: None)
    def fake_build_morning_notification(**kwargs):
        captured["notification_kwargs"] = kwargs
        return {"title": {"ta": "ta", "en": "en"}, "body": {"ta": "ta", "en": "en"}}

    monkeypatch.setattr("app.services.daily_push_cron.build_morning_notification", fake_build_morning_notification)
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
    notification_kwargs = captured["notification_kwargs"]
    assert notification_kwargs["nalla_neram_category_en"] == "Labham"
    assert "profit" in notification_kwargs["nalla_neram_purpose_en"]


# ---------------------------------------------------------------------------
# F6 — a guidance failure must not silently clear Chandrashtamam
# ---------------------------------------------------------------------------

def _morning_push_with_failed_guidance(monkeypatch, *, fallback_answer: bool) -> dict:
    """One morning push where `get_daily_guidance` raises; returns the dispatched kwargs."""
    import app.services.daily_push_cron as cron

    user = MagicMock(user_id=uuid4(), email="user@example.com")
    pref = MagicMock(morning_alert_enabled=True, dasha_alert_enabled=False, pirantha_naal_alert_enabled=False)
    profile = MagicMock(current_latitude=13.08, current_longitude=80.27, current_timezone="Asia/Kolkata")
    chart = MagicMock(chart_id=uuid4())

    slot = MagicMock(start=datetime(2026, 10, 9, 4, 0, tzinfo=UTC), end=datetime(2026, 10, 9, 5, 0, tzinfo=UTC))
    slot.name = "LABHAM"
    rahu = MagicMock(start=datetime(2026, 10, 9, 7, 30, tzinfo=UTC), end=datetime(2026, 10, 9, 9, 0, tzinfo=UTC))
    panchang = MagicMock(
        nakshatra_number=1,
        nakshatra_spans=(),
        sunrise=datetime(2026, 10, 9, 0, 30, tzinfo=UTC),
        sunset=datetime(2026, 10, 9, 12, 30, tzinfo=UTC),
        tithi_number=5,
        date_local=date(2026, 10, 9),
        nalla_neram=[slot],
        rahu_kalam=rahu,
    )

    def failing_guidance(*_):
        raise RuntimeError("guidance unavailable")

    sent: dict = {}
    monkeypatch.setattr(cron, "_own_profile", lambda *_: profile)
    monkeypatch.setattr(cron, "_latest_completed_chart", lambda *_: chart)
    monkeypatch.setattr(cron, "_morning_alert_due", lambda *_: True)
    monkeypatch.setattr(cron, "_already_sent_today", lambda *_: False)
    monkeypatch.setattr(cron, "calculate_daily_panchangam", lambda *_: panchang)
    monkeypatch.setattr(cron, "build_nakshatra_perspective", lambda *_: None)
    monkeypatch.setattr(cron, "get_daily_guidance", failing_guidance)
    monkeypatch.setattr(cron, "_chandrashtama_fallback", lambda *_: fallback_answer)
    monkeypatch.setattr(cron, "focus_push_line", lambda *_: None)
    monkeypatch.setattr(cron, "dispatch_notification", lambda **kw: sent.update(kw) or "sent_push")

    cron._dispatch_for_user(MagicMock(), user, pref, date(2026, 10, 9), datetime(2026, 10, 9, 0, 30, tzinfo=UTC))
    return sent


def test_failed_guidance_still_warns_on_a_chandrashtama_day(monkeypatch):
    """With the old flat ``False`` fallback this body carries no warning."""
    sent = _morning_push_with_failed_guidance(monkeypatch, fallback_answer=True)
    assert "Chandrashtama" in sent["body_en"]
    assert "சந்திராஷ்டமம்" in sent["body_ta"]


def test_failed_guidance_adds_no_warning_on_an_ordinary_day(monkeypatch):
    sent = _morning_push_with_failed_guidance(monkeypatch, fallback_answer=False)
    assert "Chandrashtama" not in sent["body_en"]


def test_chandrashtama_fallback_reads_the_charts_own_moon(monkeypatch):
    """The fallback asks the shared almanac test with the stored Moon's rasi and star."""
    import app.services.daily_push_cron as cron

    captured: dict = {}

    def fake_is_chandrashtama_day(day, tz, lat, lon, *, natal_moon_rasi, janma_nakshatra):
        captured.update(day=day, tz=tz, rasi=natal_moon_rasi, star=janma_nakshatra)
        return True

    monkeypatch.setattr(cron, "is_chandrashtama_day", fake_is_chandrashtama_day)
    session = MagicMock()
    # 45.0° sidereal: Rishabam (rasi 2), Rohini (star 4).
    session.execute.return_value.scalar_one_or_none.return_value = MagicMock(absolute_longitude=45.0)
    location = MagicMock(timezone="Asia/Kolkata", latitude=13.08, longitude=80.27)

    assert cron._chandrashtama_fallback(session, MagicMock(), date(2026, 10, 9), location) is True
    assert captured == {"day": date(2026, 10, 9), "tz": "Asia/Kolkata", "rasi": 2, "star": 4}


def test_chandrashtama_fallback_answers_false_without_a_moon_row():
    session = MagicMock()
    session.execute.return_value.scalar_one_or_none.return_value = None
    import app.services.daily_push_cron as cron

    location = MagicMock(timezone="Asia/Kolkata", latitude=13.08, longitude=80.27)
    assert cron._chandrashtama_fallback(session, MagicMock(), date(2026, 10, 9), location) is False

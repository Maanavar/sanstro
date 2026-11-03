"""The evening-before Chandrashtamam alert (audit F4, 2026-11-03).

Synthetic chart only: a natal Moon in Magaram (rasi 10), janma star Uthiradam
(21), at Chennai. That is the D11 reference case in
docs/CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md: the window opens
2026-09-09 15:14 and runs to 08:20 on the 10th, and the day it names is the 10th.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

import app.services.daily_push_cron as cron
from app.calculations.panchangam import PanchangamChandrashtamamNakshatraWindow, chandrashtama_window_for_day

pytestmark = pytest.mark.no_db

CHENNAI = ("Asia/Kolkata", 13.0827, 80.2707)
MAGARAM_UTHIRADAM = {"natal_moon_rasi": 10, "janma_nakshatra": 21}


def test_window_carries_its_true_start_not_the_named_days_sunrise():
    """With the day's clipped window returned instead, start is the 10th's sunrise."""
    window = chandrashtama_window_for_day(date(2026, 9, 10), *CHENNAI, **MAGARAM_UTHIRADAM)
    assert window is not None
    assert (window.start.date(), window.start.hour, window.start.minute) == (date(2026, 9, 9), 15, 14)
    assert (window.end.date(), window.end.hour, window.end.minute) == (date(2026, 9, 10), 8, 20)


def test_window_is_none_on_the_day_the_almanac_does_not_name():
    """The 9th belongs to Pooradam/Dhanusu, though the window opens that afternoon."""
    assert chandrashtama_window_for_day(date(2026, 9, 9), *CHENNAI, **MAGARAM_UTHIRADAM) is None


def test_copy_names_both_days_and_keeps_am_pm_out_of_tamil():
    window = chandrashtama_window_for_day(date(2026, 9, 10), *CHENNAI, **MAGARAM_UTHIRADAM)
    copy = cron.chandrashtama_alert_copy(window, date(2026, 9, 9), "Asia/Kolkata")
    assert "இன்று மதியம் 3:14 முதல் நாளை காலை 8:20 வரை" in copy["body"]["ta"]
    assert "From today 3:14 pm to tomorrow 8:20 am" in copy["body"]["en"]
    tamil = copy["title"]["ta"] + copy["body"]["ta"]
    assert "am" not in tamil and "pm" not in tamil
    assert "தவிர்க்கவும்" not in tamil  # advisory voice, not the imperative
    assert "—" not in tamil


@pytest.mark.parametrize(
    ("utc_hm", "due"),
    [
        ((12, 59), False),  # 18:29 IST
        ((13, 0), True),    # 18:30 IST
        ((13, 30), True),   # 19:00 IST
        ((15, 30), True),   # 21:00 IST, restart catch-up
        ((15, 31), False),
    ],
)
def test_alert_is_due_in_the_evening_window_only(utc_hm, due):
    now = datetime(2026, 9, 9, *utc_hm, tzinfo=UTC)
    assert cron._chandrashtama_alert_due(now, "Asia/Kolkata") is due


def _evening_run(monkeypatch, *, enabled: bool, window) -> tuple[dict, dict]:
    user = MagicMock(user_id=uuid4(), email="user@example.com")
    pref = MagicMock(
        morning_alert_enabled=False,
        morning_alert_time=time(6, 0),
        dasha_alert_enabled=False,
        pirantha_naal_alert_enabled=False,
        chandrashtama_alert_enabled=enabled,
    )
    profile = MagicMock(current_latitude=13.0827, current_longitude=80.2707, current_timezone="Asia/Kolkata")
    asked: dict = {}
    sent: dict = {}

    def fake_window(day, tz, lat, lon, *, natal_moon_rasi, janma_nakshatra):
        asked.update(day=day, rasi=natal_moon_rasi, star=janma_nakshatra)
        return window

    monkeypatch.setattr(cron, "_own_profile", lambda *_: profile)
    monkeypatch.setattr(cron, "_latest_completed_chart", lambda *_: MagicMock(chart_id=uuid4()))
    monkeypatch.setattr(cron, "_already_sent_today", lambda *_: False)
    monkeypatch.setattr(cron, "_natal_moon", lambda *_: (10, 21))
    monkeypatch.setattr(cron, "chandrashtama_window_for_day", fake_window)
    monkeypatch.setattr(cron, "dispatch_notification", lambda **kw: sent.update(kw) or "queued")

    # 19:00 IST on the 9th.
    cron._dispatch_for_user(MagicMock(), user, pref, date(2026, 9, 9), datetime(2026, 9, 9, 13, 30, tzinfo=UTC))
    return asked, sent


def _window() -> PanchangamChandrashtamamNakshatraWindow:
    return PanchangamChandrashtamamNakshatraWindow(
        name="UTHIRADAM",
        start=datetime(2026, 9, 9, 9, 44, tzinfo=UTC),
        end=datetime(2026, 9, 10, 2, 50, tzinfo=UTC),
        rasi_number=10,
        rasi_name="Magaram",
    )


def test_evening_run_asks_about_tomorrow_and_sends_one_alert(monkeypatch):
    asked, sent = _evening_run(monkeypatch, enabled=True, window=_window())
    assert asked == {"day": date(2026, 9, 10), "rasi": 10, "star": 21}
    assert sent["notification_type"] == "CHANDRASHTAMA"
    assert sent["expires_at"] == datetime(2026, 9, 10, 2, 50, tzinfo=UTC)
    # Keyed on the window's start, so two named days cannot warn twice.
    assert sent["logical_key"].endswith(":CHANDRASHTAMA:20260909T0944")


def test_evening_run_sends_nothing_when_tomorrow_is_not_named(monkeypatch):
    _, sent = _evening_run(monkeypatch, enabled=True, window=None)
    assert sent == {}


def test_evening_run_respects_the_toggle(monkeypatch):
    asked, sent = _evening_run(monkeypatch, enabled=False, window=_window())
    assert asked == {} and sent == {}

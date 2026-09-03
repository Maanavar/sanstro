"""A3: actual selected-window lagna, calculated only for shortlisted days."""
from __future__ import annotations

from datetime import date

import pytest

from app.calculations.astro import rasi_from_degree, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_lagna_degree
from app.calculations.muhurta_engine import Verdict, lagna_sign_factor_at_window
from app.calculations.panchangam import build_daylight_lagna_schedule, calculate_daily_panchangam

pytestmark = pytest.mark.no_db


def test_daylight_lagna_schedule_covers_the_full_day_and_matches_midpoint_ephemeris():
    snapshot = calculate_daily_panchangam(date(2026, 8, 17), 13.0827, 80.2707, "Asia/Kolkata")
    schedule = build_daylight_lagna_schedule(snapshot)

    assert schedule[0].start == snapshot.sunrise
    assert schedule[-1].end == snapshot.sunset
    assert len(schedule) >= 4
    for window in schedule:
        midpoint = window.start + (window.end - window.start) / 2
        jd = utc_datetime_to_julian_day(midpoint)
        actual = rasi_from_degree(calculate_lagna_degree(jd, snapshot.latitude, snapshot.longitude))
        assert actual == window.rasi_number


def test_sourced_treasure_lagna_rule_is_evaluated_at_window_not_sunrise():
    factor = lagna_sign_factor_at_window("GOLD", 2)  # Taurus is a cited best sign.

    assert factor is not None
    assert factor.factor == "LAGNA_SIGN_AT_WINDOW"
    assert factor.verdict is Verdict.BONUS
    assert factor.contribution > 0
    assert factor.rule_id == "KP_CH21_TREASURE_LAGNA_001"
    assert "selected window" in factor.reason_en

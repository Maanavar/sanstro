"""Golden cases for Mandhi/Gulika — the chart-point upagraha added in
docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.2.

Per the plan's guiding principle #2, a new chart point isn't done until it
has hand-checked cases cross-checked against a second source. This suite
cross-checks the Mandhi longitude computation against two independent
anchors already trusted by this codebase:

  1. panchangam.py's KULIGAI_SLOT table, which computes the *same* classical
     eighth-of-the-day slot for muhurtham purposes and was already verified
     in the 2026-07 audit (see tests/test_panchangam.py's documented QA
     reference cases). MANDHI_DAY_SLOT in _chart_planets.py must always
     agree with it — this exact disagreement was a real bug found while
     writing this suite (see the comment above MANDHI_DAY_SLOT).
  2. drikpanchang.com's published Gulika Kaal windows for three independent
     weekdays (cited inline in _chart_planets.py), used to determine which
     of the two tables (ascending vs descending Mon..Sat) was correct.
"""
from __future__ import annotations

from datetime import UTC, date, time

import pytest

from app.calculations.astro import house_from_reference, utc_datetime_to_julian_day
from app.calculations.chart_strength import _BHAVA_BALA_MALEFICS, detect_planetary_wars
from app.calculations.ephemeris import calculate_lagna_degree
from app.calculations.panchangam import KULIGAI_SLOT, calculate_daily_panchangam
from app.calculations._yoga_helpers import NATURAL_MALEFICS
from app.services._chart_planets import (
    MANDHI_DAY_SLOT,
    MANDHI_NIGHT_SLOT,
    _mandhi_longitude,
    _mandhi_planet_position,
)

pytestmark = pytest.mark.no_db


def _angular_diff(a: float, b: float) -> float:
    """Smallest absolute angular difference between two longitudes, in degrees."""
    return abs(((a - b + 180) % 360) - 180)


# ---------------------------------------------------------------------------
# Table regression: MANDHI_DAY_SLOT must never silently drift from
# panchangam.py's already-audited KULIGAI_SLOT — they encode the same rule.
# ---------------------------------------------------------------------------

def test_mandhi_day_slot_matches_panchangam_kuligai_slot_table():
    assert MANDHI_DAY_SLOT == KULIGAI_SLOT


def test_mandhi_night_slot_is_day_slot_plus_four_wrapped():
    for weekday, day_slot in MANDHI_DAY_SLOT.items():
        expected_night_slot = ((day_slot + 4 - 1) % 8) + 1
        assert MANDHI_NIGHT_SLOT[weekday] == expected_night_slot


# ---------------------------------------------------------------------------
# Golden cases: cross-check against calculate_daily_panchangam's own
# documented QA reference cases (tests/test_panchangam.py), converting the
# published Kuligai Kalam start time into a Lagna degree and comparing it
# against _mandhi_longitude's independently-computed value for a daytime
# birth on the same date/place.
# ---------------------------------------------------------------------------

def test_mandhi_longitude_matches_kuligai_start_thursday_2026_05_21():
    d = date(2026, 5, 21)
    lat, lng, tz = 9.9252, 78.1198, "Asia/Kolkata"

    snapshot = calculate_daily_panchangam(d, lat, lng, tz)
    assert snapshot.weekday == "THURSDAY"
    assert snapshot.kuligai.slot == 3  # documented QA reference case

    expected_jd = utc_datetime_to_julian_day(snapshot.kuligai.start.astimezone(UTC))
    expected_lagna = calculate_lagna_degree(expected_jd, lat, lng)

    mandhi_lng = _mandhi_longitude(d, time(10, 0), lat, lng, tz)
    assert mandhi_lng is not None
    assert _angular_diff(mandhi_lng, expected_lagna) < 0.5


def test_mandhi_longitude_matches_kuligai_start_tuesday_2025_05_20():
    d = date(2025, 5, 20)
    lat, lng, tz = 11.0168, 76.9558, "Asia/Kolkata"

    snapshot = calculate_daily_panchangam(d, lat, lng, tz)
    assert snapshot.weekday == "TUESDAY"
    assert snapshot.kuligai.slot == 5  # documented QA reference case

    expected_jd = utc_datetime_to_julian_day(snapshot.kuligai.start.astimezone(UTC))
    expected_lagna = calculate_lagna_degree(expected_jd, lat, lng)

    mandhi_lng = _mandhi_longitude(d, time(14, 0), lat, lng, tz)
    assert mandhi_lng is not None
    assert _angular_diff(mandhi_lng, expected_lagna) < 0.5


# ---------------------------------------------------------------------------
# Basic behavior
# ---------------------------------------------------------------------------

def test_mandhi_longitude_none_without_birth_time():
    assert _mandhi_longitude(date(2026, 5, 21), None, 9.9252, 78.1198, "Asia/Kolkata") is None


def test_mandhi_longitude_handles_night_birth_without_error():
    # 22:00 is well after sunset — exercises the night-slot branch.
    lng = _mandhi_longitude(date(2026, 5, 21), time(22, 0), 9.9252, 78.1198, "Asia/Kolkata")
    assert lng is not None
    assert 0.0 <= lng < 360.0


def test_mandhi_longitude_handles_pre_sunrise_birth_without_error():
    # 02:00 is before sunrise — uses the previous night's sunset anchor.
    lng = _mandhi_longitude(date(2026, 5, 21), time(2, 0), 9.9252, 78.1198, "Asia/Kolkata")
    assert lng is not None
    assert 0.0 <= lng < 360.0


def test_mandhi_planet_position_fields():
    pos = _mandhi_planet_position(200.0, lagna_rasi=1)  # 200 deg = Libra (rasi 7)
    assert pos.graha == "MANDHI"
    assert pos.rasi == 7
    assert pos.house_from_lagna == house_from_reference(1, 7)
    assert pos.strength_score == 0
    assert pos.is_retrograde is False
    assert pos.is_combust is False


# ---------------------------------------------------------------------------
# Integration with the rest of the engine (Phase 1.2 malefic-set wiring).
# ---------------------------------------------------------------------------

def test_mandhi_counts_as_malefic_across_modules():
    assert "MANDHI" in NATURAL_MALEFICS
    assert "MANDHI" in _BHAVA_BALA_MALEFICS


def test_mandhi_excluded_from_planetary_wars():
    wars = detect_planetary_wars({"MARS": 100.0, "MANDHI": 100.05, "VENUS": 100.02})
    assert "MANDHI" not in wars
    assert "MANDHI" not in wars.values()

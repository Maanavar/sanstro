"""Structural regression tests for the verified Durmuhurtham rule table."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from types import SimpleNamespace

import pytest

from app.calculations.panchangam import PanchangamSlot, _durmuhurtham_windows
from app.data.durmuhurtham_rules import DURMUHURTHAM_DAYLIGHT_INDICES
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import _daylight_fragments

pytestmark = pytest.mark.no_db


def test_verified_chennai_weekday_indices_are_stored_without_clock_offsets():
    assert DURMUHURTHAM_DAYLIGHT_INDICES == {
        "SUNDAY": (14,),
        "MONDAY": (9, 12),
        "TUESDAY": (4,),
        "WEDNESDAY": (8,),
        "THURSDAY": (6, 12),
        "FRIDAY": (4, 9),
        "SATURDAY": (1, 2),
    }


def test_durmuhurtham_clock_windows_derive_from_actual_daylight(monkeypatch):
    """Indices are converted from a 15-part daylight grid, never fixed minutes."""
    monkeypatch.setitem(DURMUHURTHAM_DAYLIGHT_INDICES, "TUESDAY", (4, 15))
    sunrise = datetime(2026, 6, 1, 6, 0)
    sunset = sunrise + timedelta(hours=12)

    windows = _durmuhurtham_windows(sunrise, sunset, "TUESDAY")

    assert [(window.slot, window.start, window.end) for window in windows] == [
        (4, datetime(2026, 6, 1, 8, 24), datetime(2026, 6, 1, 9, 12)),
        (15, datetime(2026, 6, 1, 17, 12), datetime(2026, 6, 1, 18, 0)),
    ]


def test_durmuhurtham_rejects_invalid_weekday_indices(monkeypatch):
    monkeypatch.setitem(DURMUHURTHAM_DAYLIGHT_INDICES, "TUESDAY", (0, 16))
    with pytest.raises(ValueError, match="1..15"):
        _durmuhurtham_windows(datetime(2026, 6, 1, 6, 0), datetime(2026, 6, 1, 18, 0), "TUESDAY")


def test_window_exclusion_splits_a_candidate_without_losing_the_other_safe_piece():
    sunrise = datetime(2026, 6, 1, 6, 0)
    snapshot = SimpleNamespace(
        date_local=date(2026, 6, 1),
        sunrise=sunrise,
        sunset=sunrise + timedelta(hours=12),
        durmuhurtham=[PanchangamSlot(sunrise + timedelta(hours=2), sunrise + timedelta(hours=3), 3)],
    )

    assert _daylight_fragments(snapshot, sunrise, snapshot.sunset) == [
        (sunrise + timedelta(minutes=24), sunrise + timedelta(hours=2)),
        (sunrise + timedelta(hours=3), snapshot.sunset - timedelta(minutes=24)),
    ]


def test_all_activities_default_to_day_only_until_the_owner_signs_an_exception():
    assert {rules.evening_policy for rules in ACTIVITY_RULES.values()} == {"DAY_ONLY"}


def test_late_window_invariant_clips_or_rejects_even_if_night_candidates_return():
    snapshot = SimpleNamespace(
        date_local=date(2026, 6, 1),
        sunrise=datetime(2026, 6, 1, 6, 0),
        sunset=datetime(2026, 6, 1, 23, 50),
        durmuhurtham=[],
    )
    assert _daylight_fragments(snapshot, datetime(2026, 6, 1, 20, 45), datetime(2026, 6, 1, 22, 0)) == [
        (datetime(2026, 6, 1, 20, 45), datetime(2026, 6, 1, 21, 30)),
    ]
    assert _daylight_fragments(snapshot, datetime(2026, 6, 1, 21, 1), datetime(2026, 6, 1, 21, 30)) == []

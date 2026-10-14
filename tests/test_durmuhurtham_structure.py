"""Structural regression tests for the verified Durmuhurtham rule table."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from types import SimpleNamespace

import pytest

from app.calculations.panchangam import PanchangamSlot, _durmuhurtham_windows
from app.data.durmuhurtham_rules import DURMUHURTHAM_DAYLIGHT_INDICES
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import _daylight_fragments
from app.services.panchangam_service import _build_kalam

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


def test_durmuhurtham_reaches_the_daily_panchangam_response():
    """The rule has been computed and cached since 2026-08-16, but every client
    surface was blind to it because `_build_kalam` dropped it on the floor."""
    base = datetime(2026, 6, 1, 6, 0)
    empty = PanchangamSlot(base, base + timedelta(minutes=90), 1)
    snapshot = SimpleNamespace(
        rahu_kalam=empty,
        yamagandam=empty,
        kuligai=empty,
        gowri_panchangam=[],
        nalla_neram=[],
        gowri_nalla_neram=[],
        durmuhurtham=[
            PanchangamSlot(
                base + timedelta(hours=2),
                base + timedelta(hours=2, minutes=48),
                4,
                name="DURMUHURTHAM",
                period="DAY",
                is_good=False,
            ),
        ],
    )

    kalam = _build_kalam(snapshot)

    assert [(s.start, s.end, s.slot) for s in kalam.durmuhurtham] == [("08:00", "08:48", 4)]
    assert kalam.durmuhurtham[0].is_good is False
    # camelCase is the wire contract for every other list on this model; a
    # single-word field has no alias, so this asserts the key clients read.
    assert "durmuhurtham" in kalam.model_dump(by_alias=True)


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

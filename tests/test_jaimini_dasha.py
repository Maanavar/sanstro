from __future__ import annotations

from datetime import date

import pytest

from app.calculations.jaimini_dasha import (
    _chara_period_years,
    _dasha_sequence_order,
    _resolve_rasi_lord,
    calculate_chara_antardasha,
    calculate_chara_dasha,
    current_chara_dasha,
)

pytestmark = pytest.mark.no_db


# --- Period length (savya/apasavya forward/backward counting) ---


def test_savya_rasi_forward_count() -> None:
    # Aries (Savya) -> Mars 6 signs forward -> 7-1=6 years.
    planet_map = {"MARS": 7}
    assert _chara_period_years(1, planet_map) == 6


def test_savya_rasi_taurus_forward_count() -> None:
    # Taurus is Savya despite being an even sign — this is exactly the WI-10
    # bug fix (previous code used a movable/fixed/dual axis here and got 3).
    planet_map = {"VENUS": 4}
    assert _chara_period_years(2, planet_map) == 2


def test_apasavya_rasi_backward_count() -> None:
    # Cancer (Apasavya) -> Moon in Taurus, 3 signs backward -> 3-1=2 years.
    planet_map = {"MOON": 2}
    assert _chara_period_years(4, planet_map) == 2


def test_own_sign_lord_gives_twelve_years_regardless_of_group() -> None:
    # Leo's lord (Sun) in Leo itself -> 12 years. Previously broken for this
    # sign (old movable/fixed/dual axis gave 1 year here, not 12).
    planet_map = {"SUN": 5}
    assert _chara_period_years(5, planet_map) == 12


def test_missing_lord_falls_back_to_eight_years() -> None:
    assert _chara_period_years(1, {}) == 8


# --- Scorpio/Aquarius co-lord resolution ---


def test_scorpio_uses_ketu_when_mars_absent() -> None:
    assert _resolve_rasi_lord(8, {"KETU": 5}) == "KETU"


def test_scorpio_occupant_wins_over_absent_placement() -> None:
    planet_map = {"MARS": 3, "KETU": 8}
    assert _resolve_rasi_lord(8, planet_map) == "KETU"


def test_scorpio_occupant_wins_the_other_way() -> None:
    planet_map = {"MARS": 8, "KETU": 3}
    assert _resolve_rasi_lord(8, planet_map) == "MARS"


def test_scorpio_conjunct_co_lords_use_primary() -> None:
    planet_map = {"MARS": 6, "KETU": 6}
    assert _resolve_rasi_lord(8, planet_map) == "MARS"


def test_scorpio_companion_count_tiebreak() -> None:
    # Neither Mars nor Ketu occupies Scorpio itself; Mars's rasi has more company.
    planet_map = {"MARS": 2, "KETU": 5, "VENUS": 2, "SUN": 2, "MOON": 5}
    assert _resolve_rasi_lord(8, planet_map) == "MARS"


def test_aquarius_degree_in_sign_tiebreak() -> None:
    # Neither Saturn nor Rahu occupies Aquarius; equal companion counts (0
    # each); Rahu sits at a higher degree-in-sign than Saturn -> Rahu wins.
    planet_map = {"SATURN": 4, "RAHU": 9}
    longitudes = {"SATURN": 3 * 30 + 5.0, "RAHU": 8 * 30 + 20.0}
    assert _resolve_rasi_lord(11, planet_map, longitudes) == "RAHU"


def test_aquarius_tie_without_longitudes_falls_back_to_saturn() -> None:
    planet_map = {"SATURN": 4, "RAHU": 9}
    assert _resolve_rasi_lord(11, planet_map) == "SATURN"


def test_scorpio_period_years_uses_resolved_co_lord() -> None:
    # Ketu occupies Scorpio itself -> 12 years, even though Mars (the
    # classical single lord this repo used pre-WI-10) sits elsewhere.
    planet_map = {"MARS": 3, "KETU": 8}
    assert _chara_period_years(8, planet_map) == 12


# --- Mahadasha sequence direction (savya/apasavya, not odd/even) ---


def test_mesham_lagna_forward_order() -> None:
    order = _dasha_sequence_order(1)
    assert order[0] == 1
    assert order[1] == 2


def test_rishabam_lagna_reverse_order() -> None:
    order = _dasha_sequence_order(2)
    assert order[0] == 2
    assert order[1] == 1


def test_mithuna_lagna_reverse_order_dual_sign_bug_fix() -> None:
    # Gemini is an odd sign, so the old (wrong) lagna-odd/even rule called
    # this DIRECT. The correct BPHS rule looks at the 9th from Gemini
    # (Aquarius, Apasavya) -> REVERSE. This is the exact bug WI-10 fixes.
    order = _dasha_sequence_order(3)
    assert order[0] == 3
    assert order[1] == 2


def test_kanni_lagna_direct_order_dual_sign_bug_fix() -> None:
    # Virgo is an even sign, so the old rule called this REVERSE. The 9th
    # from Virgo is Taurus (Savya) -> DIRECT.
    order = _dasha_sequence_order(6)
    assert order[0] == 6
    assert order[1] == 7


def test_full_sequence_length() -> None:
    """L-8: the full sequence spans 3 repeated 12-sign cycles (36 periods),
    not just one — a single pass can total fewer years than a native's age."""
    planet_map = {
        "MARS": 5,
        "VENUS": 3,
        "MERCURY": 8,
        "MOON": 2,
        "SUN": 10,
        "JUPITER": 1,
        "SATURN": 6,
    }
    periods = calculate_chara_dasha(1, planet_map, date(1990, 1, 1))
    assert len(periods) == 36
    # Each cycle repeats the same natal-derived rasi order and per-rasi years.
    first_cycle = periods[:12]
    second_cycle = periods[12:24]
    assert [p["rasi"] for p in first_cycle] == [p["rasi"] for p in second_cycle]
    assert [p["years"] for p in first_cycle] == [p["years"] for p in second_cycle]
    assert second_cycle[0]["start_date"] == first_cycle[-1]["end_date"]


def test_current_period_within_range() -> None:
    planet_map = {
        "MARS": 5,
        "VENUS": 3,
        "MERCURY": 8,
        "MOON": 2,
        "SUN": 10,
        "JUPITER": 1,
        "SATURN": 6,
    }
    birth = date(1990, 1, 1)
    today = date(2026, 1, 1)
    current = current_chara_dasha(1, planet_map, birth, as_of=today)
    assert current is not None
    assert current["start_date"] <= today < current["end_date"]


def test_l8_older_native_past_one_cycle_still_gets_a_running_period() -> None:
    """L-8: this chart's first 12-sign cycle totals 70 years (born 1990 ->
    cycle ends 2060-01-01). Before the fix, an 80-year-old native (as_of
    2070) fell past the end of the single-pass sequence and got None."""
    planet_map = {
        "MARS": 5,
        "VENUS": 3,
        "MERCURY": 8,
        "MOON": 2,
        "SUN": 10,
        "JUPITER": 1,
        "SATURN": 6,
    }
    birth = date(1990, 1, 1)
    past_first_cycle = date(2070, 1, 1)
    current = current_chara_dasha(1, planet_map, birth, as_of=past_first_cycle)
    assert current is not None
    assert current["start_date"] <= past_first_cycle < current["end_date"]


# --- Antardasha direction (pivots on the running mahadasha rasi, not Lagna) ---


def test_antardasha_direction_follows_mahadasha_rasi_not_lagna() -> None:
    # Scorpio mahadasha: 9th-from-Scorpio is Cancer (Apasavya) -> the
    # sub-period sequence runs in reverse regardless of the natal Lagna
    # (the previous, unused implementation pivoted on Lagna parity instead).
    main_period = {
        "rasi": 8,
        "years": 2,
        "start_date": date(2000, 1, 1),
        "end_date": date(2002, 1, 1),
    }
    sub_periods = calculate_chara_antardasha(main_period)
    assert sub_periods[0]["rasi"] == 8
    assert sub_periods[1]["rasi"] == 7
    assert len(sub_periods) == 12

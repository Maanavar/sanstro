from __future__ import annotations

from datetime import date

from app.calculations.jaimini_dasha import (
    _chara_period_years,
    _dasha_sequence_order,
    calculate_chara_dasha,
    current_chara_dasha,
)


def test_movable_rasi_period() -> None:
    planet_map = {"MARS": 7}
    assert _chara_period_years(1, planet_map) == 6


def test_fixed_rasi_period() -> None:
    planet_map = {"VENUS": 4}
    assert _chara_period_years(2, planet_map) == 3


def test_dual_rasi_lord_in_7th() -> None:
    planet_map = {"MERCURY": 9}
    assert _chara_period_years(3, planet_map) == 9


def test_mesham_lagna_forward_order() -> None:
    order = _dasha_sequence_order(1)
    assert order[0] == 1
    assert order[1] == 2


def test_rishabam_lagna_reverse_order() -> None:
    order = _dasha_sequence_order(2)
    assert order[0] == 2
    assert order[1] == 1


def test_full_sequence_length() -> None:
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
    assert len(periods) == 12


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


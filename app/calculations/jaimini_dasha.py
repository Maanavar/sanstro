from __future__ import annotations

from datetime import date
from typing import Mapping

from app.calculations.astro import RASI_NAMES

_SIGN_LORD: dict[int, str] = {
    1: "MARS",
    2: "VENUS",
    3: "MERCURY",
    4: "MOON",
    5: "SUN",
    6: "MERCURY",
    7: "VENUS",
    8: "MARS",
    9: "JUPITER",
    10: "SATURN",
    11: "SATURN",
    12: "JUPITER",
}

_MOVABLE = {1, 4, 7, 10}
_FIXED = {2, 5, 8, 11}
_DUAL = {3, 6, 9, 12}


def _add_years(value: date, years: int) -> date:
    """Add whole years while handling leap-day safely."""
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        # Feb 29 -> Feb 28 on non-leap target year
        return value.replace(month=2, day=28, year=value.year + years)


def _distance_from_rasi(from_rasi: int, to_rasi: int) -> int:
    """Inclusive zodiac distance from from_rasi -> to_rasi (1..12)."""
    return ((to_rasi - from_rasi) % 12) + 1


def _chara_period_years(rasi: int, planet_rasi_map: Mapping[str, int]) -> int:
    """Return Chara Dasha period length (years) for a rasi."""
    lord = _SIGN_LORD[rasi]
    lord_rasi = planet_rasi_map.get(lord)
    if lord_rasi is None:
        return 8

    dist = _distance_from_rasi(rasi, lord_rasi)

    if rasi in _MOVABLE:
        years = 13 - dist
    elif rasi in _FIXED:
        years = dist
    elif rasi in _DUAL:
        years = 9 if dist == 7 else dist
    else:
        years = 8

    return max(1, min(12, years))


def _dasha_sequence_order(lagna_rasi: int) -> list[int]:
    """
    Return 12-sign dasha sequence starting from Lagna.
    Odd lagna -> forward zodiac order.
    Even lagna -> reverse zodiac order.
    """
    if lagna_rasi % 2 == 1:
        full_order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    else:
        full_order = [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

    start_idx = full_order.index(lagna_rasi)
    return full_order[start_idx:] + full_order[:start_idx]


def calculate_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
) -> list[dict]:
    """
    Calculate the complete Jaimini Chara Dasha sequence.
    """
    rasi_order = _dasha_sequence_order(lagna_rasi)
    periods: list[dict] = []
    current = birth_date

    for rasi in rasi_order:
        years = _chara_period_years(rasi, planet_rasi_map)
        end = _add_years(current, years)
        periods.append(
            {
                "rasi": rasi,
                "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
                "years": years,
                "start_date": current,
                "end_date": end,
            }
        )
        current = end

    return periods


def current_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
    as_of: date | None = None,
) -> dict | None:
    """Return the currently running Chara Dasha period."""
    today = as_of or date.today()
    for period in calculate_chara_dasha(lagna_rasi, planet_rasi_map, birth_date):
        if period["start_date"] <= today < period["end_date"]:
            return period
    return None


def calculate_chara_antardasha(
    lagna_rasi: int,
    main_period: dict,
) -> list[dict]:
    """
    Sub-periods (Antardasha) within a Jaimini Chara Dasha main period.
    Each of the 12 sub-periods has equal duration = main_period_years / 12.
    Sub-period sequence starts from the main period's rasi, same odd/even direction as lagna.
    """
    from datetime import timedelta

    main_rasi = main_period["rasi"]
    main_years = main_period["years"]
    sub_duration_days = (main_years * 365.25) / 12

    if lagna_rasi % 2 == 1:
        full_order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    else:
        full_order = [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

    start_idx = full_order.index(main_rasi)
    rasi_order = full_order[start_idx:] + full_order[:start_idx]

    periods: list[dict] = []
    current = main_period["start_date"]
    for rasi in rasi_order:
        end_dt = current + timedelta(days=sub_duration_days)
        periods.append({
            "rasi": rasi,
            "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
            "start_date": current,
            "end_date": end_dt,
        })
        current = end_dt
    return periods

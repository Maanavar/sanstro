"""Shared Tara Bala and Chandra Bala calculations."""
from __future__ import annotations


def _validate_range(value: int, lower: int, upper: int, label: str) -> None:
    if not isinstance(value, int) or isinstance(value, bool) or not lower <= value <= upper:
        raise ValueError(f"{label} must be an integer in {lower}..{upper}; got {value!r}")


def tara_number(janma_nakshatra: int, day_nakshatra: int) -> int:
    """Return the 1..9 Tara Bala number for a day's nakshatra."""
    _validate_range(janma_nakshatra, 1, 27, "janma_nakshatra")
    _validate_range(day_nakshatra, 1, 27, "day_nakshatra")
    count = ((day_nakshatra - janma_nakshatra) % 27) + 1
    return ((count - 1) % 9) + 1


def chandra_bala(janma_rasi: int, transit_rasi: int) -> int:
    """Return Moon's house position (1..12) from the Janma Rasi."""
    _validate_range(janma_rasi, 1, 12, "janma_rasi")
    _validate_range(transit_rasi, 1, 12, "transit_rasi")
    return ((transit_rasi - janma_rasi) % 12) + 1

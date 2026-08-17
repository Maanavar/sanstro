"""Shared Tara Bala and Chandra Bala calculations."""
from __future__ import annotations

# Product-calibrated 9-fold Tara Bala contribution shared by the daily
# muhurtham-naal list and the picker.  The ordering is traditional; the numeric
# scale is the single approved product calibration, not a primary-text rule.
TARA_SCORE: dict[int, int] = {
    1: 8,
    2: 30,
    3: -30,
    4: 22,
    5: -25,
    6: 24,
    7: -35,
    8: 26,
    9: 28,
}

# Display names shared by the personal muhurta picker and the activity-timing
# ranker.  Keeping the names beside the calculation prevents a second 1..9
# table from quietly drifting.  These are established labels, not new doctrine.
TARA_NAMES: dict[int, tuple[str, str]] = {
    1: ("ஜென்மம்", "Janma"),
    2: ("சம்பத்", "Sampat"),
    3: ("விபத்", "Vipat"),
    4: ("க்ஷேமம்", "Kshema"),
    5: ("பிரத்யரி", "Pratyari"),
    6: ("சாதனை", "Sadhana"),
    7: ("நைதனம்", "Naidhana"),
    8: ("மித்திரம்", "Mitra"),
    9: ("பரம மித்திரம்", "Parama Mitra"),
}


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

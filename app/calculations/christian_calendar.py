"""Christian feast days for any year: Easter by the Gregorian computus, the
Holy Week days from it, and the fixed feasts by date.

The 2026 category list (`app/data/calendar_categories_2026.py`) was curated by
hand; these are the same ten days computed, so the Christian category and the
dashboard keep working after 2026. `tests/test_calendar_categories.py` checks
the computed 2026 against the curated rows.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache


@dataclass(frozen=True, slots=True)
class ChristianFeast:
    date: date
    name_en: str
    name_ta: str


def easter_sunday(year: int) -> date:
    """Western (Gregorian) Easter: the anonymous Gregorian algorithm (Meeus)."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    el = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * el) // 451
    month, day = divmod(h + el - 7 * m + 114, 31)
    return date(year, month, day + 1)


# (offset from Easter, English, Tamil). The Tamil is the curated 2026 rows'.
_MOVABLE: tuple[tuple[int, str, str], ...] = (
    (-46, "Ash Wednesday", "ஆஷ் வெனஸ்டே"),
    (-7, "Palm Sunday", "பாம் சண்டே"),
    (-3, "Maundy Thursday", "பெரிய வியாழன்"),
    (-2, "Good Friday", "புனித வெள்ளி"),
    (0, "Easter Sunday", "ஈஸ்டர் சண்டே"),
)

_FIXED: tuple[tuple[int, int, str, str], ...] = (
    (1, 1, "New Year's Day", "ஆங்கிலப் புத்தாண்டு"),
    (2, 2, "Presentation of Our Lady", "தேவமாதா பரிசுத்தரான திருநாள்"),
    (7, 2, "Visitation of Our Lady", "தேவமாதா காட்சியருளிய நாள்"),
    (9, 8, "Nativity of Our Lady", "தேவமாதா பிறந்த நாள்"),
    (12, 25, "Christmas", "கிறிஸ்துமஸ் பண்டிகை"),
)


@lru_cache(maxsize=64)
def christian_feasts(year: int) -> tuple[ChristianFeast, ...]:
    """The year's feasts in date order. Cached: the festival lookup asks once
    per day."""
    easter = easter_sunday(year)
    feasts = [ChristianFeast(easter + timedelta(days=offset), en, ta) for offset, en, ta in _MOVABLE]
    feasts += [ChristianFeast(date(year, month, day), en, ta) for month, day, en, ta in _FIXED]
    return tuple(sorted(feasts, key=lambda feast: feast.date))

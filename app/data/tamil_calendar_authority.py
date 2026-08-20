"""Published Tamil solar-calendar boundary data approved for Vinaadi.

Authority: Sri Gnanananda Panchangam, 2026–27 edition
Source: https://gnanananda.org/wp-content/uploads/2026/03/panchangam26_27.pdf

This is a source layer, not an ephemeris correction. It records only the
published first day of each Tamil solar month, allowing the application to
reproduce the selected Tamil calendar exactly while retaining the existing
Lahiri calculations for panchangam limbs.

New editions must be imported as a complete April–March boundary set and
validated before release. Do not add isolated date patches here.
"""
from __future__ import annotations

from datetime import date


CALENDAR_AUTHORITY_NAME = "Sri Gnanananda Panchangam"
CALENDAR_AUTHORITY_EDITION = "2026–27"
CALENDAR_AUTHORITY_SOURCE_URL = "https://gnanananda.org/wp-content/uploads/2026/03/panchangam26_27.pdf"

# (Gregorian year, Tamil solar-month index) -> first civil date of that month.
# Index 0 is Chithirai through index 11 (Panguni), matching
# ``app.calculations.tamil_calendar.TAMIL_MONTHS``.
GNANANANDA_MONTH_STARTS_2026_27: dict[tuple[int, int], date] = {
    (2026, 0): date(2026, 4, 14),
    (2026, 1): date(2026, 5, 15),
    (2026, 2): date(2026, 6, 15),
    (2026, 3): date(2026, 7, 17),
    (2026, 4): date(2026, 8, 18),
    (2026, 5): date(2026, 9, 18),
    (2026, 6): date(2026, 10, 18),
    (2026, 7): date(2026, 11, 17),
    (2026, 8): date(2026, 12, 16),
    (2027, 9): date(2027, 1, 15),
    (2027, 10): date(2027, 2, 13),
    (2027, 11): date(2027, 3, 15),
}


def published_month_start_date(*, gregorian_year: int, rasi: int) -> date | None:
    """Return the selected authority's published month start, if covered."""
    return GNANANANDA_MONTH_STARTS_2026_27.get((gregorian_year, rasi))

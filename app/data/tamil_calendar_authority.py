"""Published Tamil solar-calendar boundary data approved for Vinaadi.

This is a source layer, not an ephemeris correction. It records only the
published first day of each Tamil solar month, allowing the application to
reproduce the selected Tamil calendar exactly while retaining the existing
Lahiri calculations for panchangam limbs.

Each source is imported as a **complete twelve-boundary set** and validated
before release — never as isolated date patches. The one exception is a
boundary the owner has ruled on by name (``complete=False``, with the ruling
cited). Where two sources cover the same boundary they must agree;
``tests/test_tamil_calendar.py`` asserts it.

The published civil dates apply in **every timezone** (owner ruling
2026-10-22): a Tamil reader in Singapore or Toronto gets the almanac's Thai 1,
not a date recomputed for their sunset.

Outside the union of the sources below, every Tamil date falls back to the
sunset rule in ``app.calculations.tamil_calendar``, which is *known* to miss
published boundaries (FCA-02: Thai, Aavani, Purattasi 2026; Aani 2027). That
fallback is disclosed per date as ``tamilDateSource: "computed"``, and
``tests/test_tamil_calendar.py`` fails once today + 120 days runs past the last
published boundary, so the next edition is imported before the cliff rather
than after it.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class PublishedTamilCalendar:
    name: str
    edition: str
    source: str
    # (Gregorian year of the sankranti, Tamil solar-month index) -> first civil
    # date of that month. Index 0 is Chithirai through 11 (Panguni), matching
    # ``app.calculations.tamil_calendar.TAMIL_MONTHS``.
    month_starts: dict[tuple[int, int], date]
    # False only for an owner-ruled boundary outside any imported edition.
    complete: bool = True


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

GNANANANDA_2026_27 = PublishedTamilCalendar(
    name="Sri Gnanananda Panchangam",
    edition="2026–27",
    source="https://gnanananda.org/wp-content/uploads/2026/03/panchangam26_27.pdf",
    month_starts=GNANANANDA_MONTH_STARTS_2026_27,
)

# Calendar year 2027 (Thai 2027 → Margazhi 2027), read from the almanac "Tamil
# Dates 2027" published by tamildailycalendar.com (supplied by the owner
# 2026-10-22). Two independent readings agree for
# every boundary — the muhurtham table's Tamil day numbers (e.g. "14 June
# வைகாசி 31", "23 June ஆனி 09") and the Karinaal list, whose days are fixed Tamil
# dates (Aani 1 = 15 Jun) — except Purattasi and Margazhi, which have no
# muhurtham rows and are read from Karinaal alone (Purattasi 16/29 = 2/15 Oct;
# Margazhi 6/9 = 21/24 Dec). Its Thai, Maasi and Panguni 2027 equal Gnanananda's.
# Evidence: docs/TAMIL_CALENDAR_2027_IMPORT.md.
OWNER_ALMANAC_MONTH_STARTS_2027: dict[tuple[int, int], date] = {
    (2027, 9): date(2027, 1, 15),
    (2027, 10): date(2027, 2, 13),
    (2027, 11): date(2027, 3, 15),
    (2027, 0): date(2027, 4, 14),
    (2027, 1): date(2027, 5, 15),
    # The one 2027 boundary the sunset rule misses: sankranti 18:55 IST on
    # 15 Jun, after Chennai sunset, so the rule says 16 Jun.
    (2027, 2): date(2027, 6, 15),
    (2027, 3): date(2027, 7, 17),
    (2027, 4): date(2027, 8, 17),
    (2027, 5): date(2027, 9, 17),
    (2027, 6): date(2027, 10, 18),
    (2027, 7): date(2027, 11, 17),
    (2027, 8): date(2027, 12, 16),
}

OWNER_ALMANAC_2027 = PublishedTamilCalendar(
    name="tamildailycalendar.com — Tamil Dates 2027",
    edition="2027",
    source="https://www.tamildailycalendar.com/ (extract: docs/TAMIL_CALENDAR_2027_IMPORT.md)",
    month_starts=OWNER_ALMANAC_MONTH_STARTS_2027,
)

# Thai 1, 2026 = 15 Jan 2026, the Tamil Nadu Pongal holiday. Owner ruling
# 2026-10-22 (FCA-08). No imported edition covers Thai 2026, and the sunset rule
# gives 14 Jan (Makara sankranti 15:07 IST on the 14th), which put Pongal week
# a day early and contradicted the gazetted holidays.
OWNER_RULING_THAI_2026 = PublishedTamilCalendar(
    name="Owner ruling 2026-10-22: Thai 1 = 15 Jan 2026 (Tamil Nadu Pongal holiday)",
    edition="2025–26, Thai only",
    source="docs/FULL_CODEBASE_AUDIT_2026-10-22.md FCA-08",
    month_starts={(2026, 9): date(2026, 1, 15)},
    complete=False,
)

PUBLISHED_TAMIL_CALENDARS: tuple[PublishedTamilCalendar, ...] = (
    OWNER_RULING_THAI_2026,
    GNANANANDA_2026_27,
    OWNER_ALMANAC_2027,
)

# Kept for callers that name the original authority.
CALENDAR_AUTHORITY_NAME = GNANANANDA_2026_27.name
CALENDAR_AUTHORITY_EDITION = GNANANANDA_2026_27.edition
CALENDAR_AUTHORITY_SOURCE_URL = GNANANANDA_2026_27.source


def published_month_start_date(*, gregorian_year: int, rasi: int) -> date | None:
    """Return the published month start, if any source covers it."""
    for calendar in PUBLISHED_TAMIL_CALENDARS:
        start = calendar.month_starts.get((gregorian_year, rasi))
        if start is not None:
            return start
    return None


def last_published_month_start() -> date:
    """The latest published boundary across every source.

    Days 1-28 of the month it opens are still fully published (no Tamil month
    is shorter than 29 days); past that, the *end* of the month is computed.
    """
    return max(start for calendar in PUBLISHED_TAMIL_CALENDARS for start in calendar.month_starts.values())

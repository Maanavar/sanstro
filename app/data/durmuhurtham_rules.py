"""Verified inputs for Durmuhurtham calculation.

Durmuhurtham is calculated on the fifteen equal daylight muhurtas, numbered
from sunrise.  This module contains only the weekday-to-index rule; clock
times are always derived from the actual local sunrise and sunset.

The values below were derived from seven consecutive owner-supplied Chennai
almanac entries (17–23 August 2026), one for each weekday.  Both the printed
start and end were checked against the calculated daylight-muhurta boundaries.
See ``docs/MUHURTA_DOCTRINE_ANSWERS_2026-08-16.md`` section 1.2a for the
evidence table.  Do not replace these values with recalled clock-time tables.
"""
# weekday (uppercase, matching PanchangamSnapshot.weekday) -> 1-based daylight
# muhurta indices.
DURMUHURTHAM_DAYLIGHT_INDICES: dict[str, tuple[int, ...]] = {
    "SUNDAY": (14,),
    "MONDAY": (9, 12),
    "TUESDAY": (4,),
    "WEDNESDAY": (8,),
    "THURSDAY": (6, 12),
    "FRIDAY": (4, 9),
    "SATURDAY": (1, 2),
}

"""Karinaal (கரிநாள்) — derived from the Tamil solar calendar, not typed in.

F-MUH-02 (ground-truth audit 2026-10-13). Karinaal were a hand-entered list of
2026 civil dates in `app/data/panchangam_events_2026.py`, looked up by
`panchangam_events_service.is_karinaal`. That had two consequences:

1. **A cliff on 1 Jan 2027.** For any year with no published list the lookup
   returned ``False`` with no warning, so from that date every calendar page,
   the daily panchangam and the mobile app would quietly show *no* Karinaal —
   not an error, not an empty state, just a wrong answer.
2. **Drift.** Several stored `tamilDay` labels disagreed with what
   `tamil_solar_date` computes for the same civil date, so the two halves of
   the app described the same day differently.

Karinaal are **fixed Tamil solar dates** — Chithirai 6 is Karinaal every year,
whatever civil date that falls on. So the right representation is the rule,
and the civil dates come from the one calendar engine the rest of the system
already uses. That removes the cliff (every year works) and the drift (one
source for "what Tamil date is this?").

**What this changes for 2026.** Deriving does not reproduce the old list
exactly, and the differences are the point:

* `Margazhi 11` (2026-12-26) was **missing** from the hand list — it is on the
  standard rule and is now shown.
* `Karthigai 7` (2026-11-23) was **in** the hand list and is **not** on the
  standard rule. It was removed here, and the 2026-10-13 astrologer ruling
  **reverted that**: published Karthigai lists disagree on day 7, so it must not
  be dropped on the strength of this table alone. It is present, and it is the
  one cell still disputed.
* The five Thai rows briefly moved one civil day earlier, because the engine's
  computed Thai 1 was 14 Jan. The owner ruled Thai 1, 2026 = 15 Jan (the
  Tamil Nadu Pongal holiday, 2026-10-22, FCA-08), which put them back on
  15, 16, 17, 25 and 31 Jan — where the hand list had them. The same day the
  astrologer ruled Thai's list is 1, 2, 3, 10, 16 (the 2027 almanac's), so
  2026 now reads 15, 16, 17, 24 and 30 Jan.

Checked against a printed source (the tamildailycalendar.com 2027 almanac,
2026-10-22): every month agrees except Thai (now adopted) and the two cells
the astrologer keeps against it, Karthigai 7 and Margazhi 11. If a source
disagrees, change `KARINAAL_TAMIL_DAYS` below, not the civil dates.
"""

from __future__ import annotations

from datetime import date, timedelta
from functools import lru_cache

from app.calculations.tamil_calendar import TAMIL_MONTHS, tamil_month_spans

# Reference location for the civil-date derivation. Karinaal are solar-date
# rules, so the only way the place matters is the sunset that decides which
# civil day a month starts on — a sub-day effect that moves a boundary date by
# at most one day across Tamil Nadu. Chennai is the published-almanac
# reference the rest of the app already uses for calendar-wide (non-personal)
# panchangam, so it is used here for the same reason.
KARINAAL_REFERENCE_TZ = "Asia/Kolkata"
KARINAAL_REFERENCE_LAT = 13.0827
KARINAAL_REFERENCE_LON = 80.2707

# month index (0 == Chithirai, matching TAMIL_MONTHS) -> Karinaal days of that
# Tamil solar month. 35 days across the year (34 before Karthigai 7 was
# restored by the 2026-10-13 ruling — see the note on that row).
KARINAAL_TAMIL_DAYS: dict[int, frozenset[int]] = {
    0:  frozenset({6, 15}),          # Chithirai
    1:  frozenset({7, 16, 17}),      # Vaikasi
    2:  frozenset({1, 6}),           # Aani
    3:  frozenset({2, 10, 20}),      # Aadi
    4:  frozenset({2, 9, 28}),       # Aavani
    5:  frozenset({16, 29}),         # Purattasi
    6:  frozenset({6, 20}),          # Aippasi
    # Karthigai 7 is RESTORED (ruled 2026-10-13). Deriving from the standard rule
    # dropped it and this module removed it; the astrologer's answer is that
    # published Karthigai lists disagree — some carry day 7, others do not — so it
    # must not be removed on the strength of this table alone. Karinaal is an
    # avoid-day, so the fail-safe direction is to keep showing it and let the
    # printed almanac remove it, not the reverse. The 2026-10-22 ruling keeps
    # both Karthigai 7 and Margazhi 11, which the 2027 almanac omits: an
    # aggregator's omission is not a doctrinal exclusion.
    7:  frozenset({1, 7, 10, 17}),   # Karthigai (7 disputed - see above)
    8:  frozenset({6, 9, 11}),       # Margazhi
    # Thai 10 and 16, not 11 and 17 (ruling 2026-10-22 Q7). Checked first, as
    # the ruling required: the 2027 almanac agrees with this table on every
    # other month's days, so the shift is Thai's own list, not an off-by-one
    # in day numbering (scripts/audit/almanac_2027_vs_engine.py, Karinaal by
    # Tamil month). The 2026 rows, source unrecorded, had 11 and 17.
    9:  frozenset({1, 2, 3, 10, 16}),  # Thai
    10: frozenset({15, 16, 17}),     # Maasi
    11: frozenset({6, 15, 19}),      # Panguni
}


@lru_cache(maxsize=16)
def karinaal_days_for_year(year: int) -> frozenset[date]:
    """Every Karinaal civil date in `year`, derived from the solar calendar.

    Cached per year: the walk costs ~14 month-boundary solves, and the answer
    for a past or future year never changes.

    Tamil months straddle the civil year, so the walk starts from the month
    containing 1 January and runs 14 months — enough to cover 31 December in
    every year, including one where a published-authority month start shifts a
    boundary.
    """
    spans = tamil_month_spans(
        date(year, 1, 1),
        14,
        KARINAAL_REFERENCE_TZ,
        KARINAAL_REFERENCE_LAT,
        KARINAAL_REFERENCE_LON,
    )
    days: set[date] = set()
    for span in spans:
        for day_of_month in KARINAAL_TAMIL_DAYS[span.rasi]:
            civil = span.start + timedelta(days=day_of_month - 1)
            # A Tamil month is 29-32 days; every rule day above is <= 29, so
            # this only guards against a pathological span, and against the
            # straddling months at either end of the civil year.
            if civil <= span.end and civil.year == year:
                days.add(civil)
    return frozenset(days)


def is_karinaal(d: date) -> bool:
    """True when `d` is a Karinaal. Works for every year, not just 2026."""
    return d in karinaal_days_for_year(d.year)


def karinaal_rows_for_year(year: int) -> list[dict]:
    """Karinaal as the calendar-events payload shape, sorted by date.

    Matches the rows `panchangam_events_service` used to read from the
    hand-entered table, so the SEO pages and the calendar keep their contract.
    `tamilDay` is derived here rather than stored, so it can no longer drift
    from the civil date beside it.
    """
    # A 14-month walk visits two Margazhis and two Thais, so these stay a
    # LIST. Keying them by rasi drops the earlier of each pair, which silently
    # lost all five January Karinaal.
    spans = tamil_month_spans(
        date(year, 1, 1), 14,
        KARINAAL_REFERENCE_TZ, KARINAAL_REFERENCE_LAT, KARINAAL_REFERENCE_LON,
    )
    rows: list[dict] = []
    for d in sorted(karinaal_days_for_year(year)):
        # Re-derive the label from the same span walk, so the row's Tamil date
        # and its civil date can never disagree.
        for span in spans:
            if span.start <= d <= span.end:
                rows.append({
                    "date": d.isoformat(),
                    "weekday": d.strftime("%A").upper(),
                    "tamilMonthIndex": span.rasi,
                    "tamilMonth": TAMIL_MONTHS[span.rasi][1],
                    "tamilDay": (d - span.start).days + 1,
                })
                break
    return rows

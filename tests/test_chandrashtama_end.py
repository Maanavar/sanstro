"""`chandrashtamaEnds` — the card line that had never rendered.

`GuidanceEnvelope.data.chandrashtamaEnds` was declared in TypeScript and sent by
nothing, so `ChandrashtamaCard`'s "Ends: <time>" line always fell through to its
untimed fallback — on web, on the hybrid charts page, and in mobile, whose
defensive `chandrashtamaEnds ?? chandrashtama_ends` was dead on both branches.
The wrapper-field-parity guard recorded it as KNOWN_DRIFT on 2026-08-31 and
deliberately did not fix it, because *which* instant counts as "ends" is a
doctrine question.

Ruled 2026-09-01: **report a time only when Chandrashtama actually lifts that
day.** The trap it avoids: `moon_rasi_spans` is built by
`limb_spans_between(..., sunrise_jd, next_sunrise_jd, ...)`, so every span is
clipped to the solar day. The Moon spends about 2.25 days per rasi, so a
Chandrashtama stretch normally covers two or three badged days — and taking the
last span's end unconditionally would report the next sunrise as the end on every
day but the last. That is a precise-looking time that is simply false, and it is
the common case rather than an edge one.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.calculations.panchangam import PanchangamLimbSpan
from app.services._dg_scoring import chandrashtama_end, chandrashtama_rasi_for

pytestmark = pytest.mark.no_db

SUNRISE = datetime(2026, 9, 1, 6, 0, tzinfo=UTC)
NEXT_SUNRISE = SUNRISE + timedelta(hours=24)


class _Panchangam:
    """Only the attributes `chandrashtama_end` reads."""

    def __init__(self, spans):
        self.sunrise = SUNRISE
        self.moon_rasi_spans = spans
        # The scalar fallback pair, used when a snapshot predates span lists.
        self.chandrashtamam_moon_rasi_number = 8
        self.chandrashtamam_moon_rasi_name = "Viruchigam"


def _span(number: int, start: datetime, end: datetime) -> PanchangamLimbSpan:
    return PanchangamLimbSpan(
        number=number,
        name=f"rasi-{number}",
        start=start,
        end=end,
        fraction=(end - start).total_seconds() / 86400.0,
    )


# --------------------------------------------------------------------------- #
# The 8th-from-natal rule, shared with weighted_moon_score                     #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize(
    ("natal", "expected"),
    [(1, 8), (2, 9), (5, 12), (6, 1), (7, 2), (12, 7)],
)
def test_chandrashtama_rasi_is_the_eighth_from_the_natal_moon(natal, expected):
    """Wraps past 12 rather than running off the end — 6 -> 1, not 13."""
    assert chandrashtama_rasi_for(natal) == expected


def test_every_rasi_maps_into_range():
    assert {chandrashtama_rasi_for(n) for n in range(1, 13)} == set(range(1, 13))


# --------------------------------------------------------------------------- #
# The ruling                                                                   #
# --------------------------------------------------------------------------- #

def test_reports_the_time_when_chandrashtama_lifts_during_the_day():
    lifts_at = SUNRISE + timedelta(hours=14)
    panchangam = _Panchangam((
        _span(8, SUNRISE, lifts_at),
        _span(9, lifts_at, NEXT_SUNRISE),
    ))

    assert chandrashtama_end(panchangam, natal_moon_rasi=1) == lifts_at


def test_reports_nothing_when_the_moon_is_still_in_the_eighth_at_day_end():
    """The first and middle days of a 2-3 day stretch.

    The span is clipped at the next sunrise, so its end is NOT when
    Chandrashtama ends. Saying "ends 6:12 AM" here would be false, and the
    card's untimed line is true on every day of the stretch.
    """
    panchangam = _Panchangam((_span(8, SUNRISE, NEXT_SUNRISE),))

    assert chandrashtama_end(panchangam, natal_moon_rasi=1) is None


def test_reports_nothing_when_the_moon_never_enters_the_eighth():
    panchangam = _Panchangam((
        _span(3, SUNRISE, SUNRISE + timedelta(hours=10)),
        _span(4, SUNRISE + timedelta(hours=10), NEXT_SUNRISE),
    ))

    assert chandrashtama_end(panchangam, natal_moon_rasi=1) is None


def test_a_stretch_entering_late_in_the_day_does_not_report_an_end():
    """Chandrashtama starting at 4pm runs into tomorrow; it does not end at
    the next sunrise just because the span list stops there."""
    enters_at = SUNRISE + timedelta(hours=10)
    panchangam = _Panchangam((
        _span(7, SUNRISE, enters_at),
        _span(8, enters_at, NEXT_SUNRISE),
    ))

    assert chandrashtama_end(panchangam, natal_moon_rasi=1) is None


def test_a_snapshot_with_no_span_list_reports_nothing():
    """Cache rows older than the span lists fall back to one flat span covering
    the whole day. That span cannot say when anything lifts, so it must not
    pretend to — and the scalar fallback rasi is the Moon's, which makes the
    flat span match for exactly one natal rasi."""
    panchangam = _Panchangam(())

    # natal 1 -> chandrashtama rasi 8, which is the scalar fallback number.
    assert chandrashtama_end(panchangam, natal_moon_rasi=1) is None
    assert chandrashtama_end(panchangam, natal_moon_rasi=4) is None


def test_the_end_is_derived_from_the_same_spans_that_set_the_badge():
    """Not a second computation. `weighted_moon_score` decides the badge from
    `moon_rasi_spans` and the 8th-from-natal rule; this reads the same two, so a
    badge and a time cannot come from different arithmetic."""
    from app.services._dg_scoring import weighted_moon_score

    lifts_at = SUNRISE + timedelta(hours=20)
    spans = (
        _span(8, SUNRISE, lifts_at),
        _span(9, lifts_at, NEXT_SUNRISE),
    )

    class Full(_Panchangam):
        def __init__(self):
            super().__init__(spans)
            self.nakshatra_spans = ()
            self.nakshatra_number = 1
            self.nakshatra_name = "Aswini"

    panchangam = Full()
    _score, share = weighted_moon_score(
        panchangam, janma_nakshatra=1, natal_moon_rasi=1
    )

    # Mostly Chandrashtama, and it lifts during the day — so both agree.
    assert share > 0.5
    assert chandrashtama_end(panchangam, natal_moon_rasi=1) == lifts_at

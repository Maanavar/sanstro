"""`chandrashtamaEnds` — the time printed beside the Chandrashtama badge.

History, because the field has been ruled on twice and the second ruling
supersedes the first without discarding its reasoning.

`GuidanceEnvelope.data.chandrashtamaEnds` was declared in TypeScript and sent by
nothing, so `ChandrashtamaCard`'s "Ends: <time>" line always fell through to its
untimed fallback. Ruled 2026-09-01: **report a time only when Chandrashtama
actually lifts that day** — because the span list is clipped to the day, and
taking the last span's end unconditionally prints a precise-looking time that is
simply false.

Ruled again 2026-09-09 (docs/CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md):
Chandrashtama is the reader's janma STAR's window, not the Moon's whole transit
of the 8th rasi. The badge moved; this field did not, so for eight days the card
could badge a Pooradam native and print the rasi's end time hours later — at
Chennai on 2026-09-09, 15:14 against a true 09:34. Mobile renders this field
directly as *the* end time with nothing to fall back on.

So the field now reads the star window. The 2026-09-01 clipping guard is kept
verbatim in shape — `chandrashtamam_janma_nakshatra_windows` is bounded by the
civil day, so the last window ends at midnight whether or not the star hands
over then. What changed is which case is common: a star window is about a day
and usually closes within the day it is badged on, so a real time is now the
normal answer and None the exception.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.calculations.panchangam import PanchangamChandrashtamamNakshatraWindow
from app.services._dg_scoring import chandrashtama_end, chandrashtama_rasi_for

pytestmark = pytest.mark.no_db

DAY_START = datetime(2026, 9, 9, 0, 0, tzinfo=UTC)
DAY_END = DAY_START + timedelta(hours=24)

# Nakshatra numbers, so the test says what it means: 19 Moolam, 20 Pooradam,
# 21 Uthiradam — the three stars of Dhanusu/Makaram that the reported case walks.
MOOLAM, POORADAM, UTHIRADAM = 19, 20, 21

# Rasi numbers. Uthiradam is the straddling star of this stretch: pada 1 sits in
# Dhanusu, padas 2-4 in Magaram, so its natives have two Chandrashtamas about a
# fortnight apart. Moolam and Pooradam are wholly Dhanusu.
DHANUSU, MAGARAM = 9, 10


class _Panchangam:
    """Only the attribute `chandrashtama_end` reads."""

    def __init__(self, windows):
        self.chandrashtamam_janma_nakshatra_windows = windows


def _window(name: str, start: datetime, end: datetime, rasi: int = DHANUSU):
    return PanchangamChandrashtamamNakshatraWindow(
        name=name, start=start, end=end, rasi_number=rasi, rasi_name=str(rasi),
    )


# --------------------------------------------------------------------------- #
# The 8th-from-natal rasi rule, still shared with weighted_moon_score           #
# --------------------------------------------------------------------------- #
# The 2026-09-09 ruling moved the BADGE to the star window and deliberately left
# the SCORE on the rasi share, so this rule is still live and still tested.

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
# The 2026-09-09 ruling: the reader's own star window                          #
# --------------------------------------------------------------------------- #

def test_reports_the_time_the_readers_own_star_hands_over():
    """The reported case, to the minute.

    2026-09-09 at Chennai: the day belongs to Pooradam, whose window closes at
    09:34 when Uthiradam takes over. A Pooradam native must be told 09:34 — the
    rasi reading said 15:14, when the Moon left Kadagam.
    """
    hands_over = DAY_START + timedelta(hours=9, minutes=34)
    panchangam = _Panchangam((
        _window("POORADAM", DAY_START, hands_over),
        _window("UTHIRADAM", hands_over, DAY_END),
    ))

    assert chandrashtama_end(panchangam, janma_nakshatra=POORADAM, natal_moon_rasi=DHANUSU) == hands_over


def test_reads_the_readers_star_not_the_days_first_window():
    """The half of the day that is not the reader's must not set their time.

    A Uthiradam native on the same day owns the LATER window, which is still
    running at midnight — so they get None, while the Pooradam native above gets
    a time from the same payload.
    """
    hands_over = DAY_START + timedelta(hours=9, minutes=34)
    panchangam = _Panchangam((
        _window("POORADAM", DAY_START, hands_over),
        _window("UTHIRADAM", hands_over, DAY_END),
    ))

    assert chandrashtama_end(panchangam, janma_nakshatra=UTHIRADAM, natal_moon_rasi=DHANUSU) is None


def test_reports_nothing_when_the_window_is_still_running_at_midnight():
    """The clipping guard the 2026-09-01 ruling established, carried over.

    The window list is bounded by the civil day, so the last window's end is
    midnight whether or not the star hands over then. Saying "ends 00:00" would
    be false; the card's untimed line is true.
    """
    panchangam = _Panchangam((_window("MOOLAM", DAY_START, DAY_END),))

    assert chandrashtama_end(panchangam, janma_nakshatra=MOOLAM, natal_moon_rasi=DHANUSU) is None


def test_reports_nothing_when_the_day_is_not_the_readers():
    hands_over = DAY_START + timedelta(hours=9, minutes=34)
    panchangam = _Panchangam((
        _window("POORADAM", DAY_START, hands_over),
        _window("UTHIRADAM", hands_over, DAY_END),
    ))

    assert chandrashtama_end(panchangam, janma_nakshatra=MOOLAM, natal_moon_rasi=DHANUSU) is None


def test_a_snapshot_without_windows_reports_nothing():
    """A panchangam cached before v44 carries no windows. It cannot say when
    anything lifts, so it must not pretend to."""
    assert chandrashtama_end(_Panchangam(()), janma_nakshatra=MOOLAM, natal_moon_rasi=DHANUSU) is None
    assert chandrashtama_end(_Panchangam(None), janma_nakshatra=MOOLAM, natal_moon_rasi=DHANUSU) is None


def test_the_end_agrees_with_the_badge_beside_it():
    """The property the whole 2026-09-09 ruling exists to protect.

    The badge asks "is the star at sunrise mine?"; this asks "when does my star
    hand over?". Both read `chandrashtamam_janma_nakshatra_windows`, so a badged
    day always has a window belonging to the reader — and the answer, when there
    is one, falls inside that day rather than hours past it.
    """
    hands_over = DAY_START + timedelta(hours=9, minutes=34)
    windows = (
        _window("POORADAM", DAY_START, hands_over),
        _window("UTHIRADAM", hands_over, DAY_END),
    )
    sunrise = DAY_START + timedelta(hours=6)
    badged_star = next(w.name for w in windows if w.start <= sunrise < w.end)
    assert badged_star == "POORADAM"

    end = chandrashtama_end(_Panchangam(windows), janma_nakshatra=POORADAM, natal_moon_rasi=DHANUSU)
    assert end is not None
    assert sunrise < end < DAY_END


# --------------------------------------------------------------------------- #
# The nine straddling stars: the star name alone does not identify a window     #
# --------------------------------------------------------------------------- #

def test_a_straddling_stars_two_halves_get_their_own_end_times():
    """Reported 2026-09-09 (D9): an Uthiradam/Magaram native shown the Dhanusu
    half's window.

    30° is 2.25 nakshatras, so nine of the 27 stars cross a rasi boundary and
    their natives fall in two different signs. On 2026-09-09 at Chennai the
    affected point crosses 270° at 15:14, splitting Uthiradam's day in two:
    Dhanusu natives 09:34-15:14, Magaram natives 15:14 onward. Matching on the
    name alone hands whichever window comes first to both.
    """
    opens = DAY_START + timedelta(hours=9, minutes=34)
    crosses = DAY_START + timedelta(hours=15, minutes=14)
    panchangam = _Panchangam((
        _window("POORADAM", DAY_START, opens, DHANUSU),
        _window("UTHIRADAM", opens, crosses, DHANUSU),
        _window("UTHIRADAM", crosses, DAY_END, MAGARAM),
    ))

    # The Dhanusu half hands over mid-afternoon...
    assert chandrashtama_end(
        panchangam, janma_nakshatra=UTHIRADAM, natal_moon_rasi=DHANUSU,
    ) == crosses
    # ...while the Magaram half's window is still running at midnight, so under
    # the civil-day clipping guard they get no time rather than a false 00:00.
    assert chandrashtama_end(
        panchangam, janma_nakshatra=UTHIRADAM, natal_moon_rasi=MAGARAM,
    ) is None


def test_a_pre_v45_window_falls_back_to_the_name_alone():
    """`rasi_number` is 0 on a snapshot cached before panchangam v45.

    That is "unknown", not "no rasi". The fail-safe direction for an avoidance
    rule is toward the doctrine, so an unreadable rasi must not silently clear a
    reader's day — it reverts to exactly the pre-v45 behaviour.
    """
    hands_over = DAY_START + timedelta(hours=9, minutes=34)
    panchangam = _Panchangam((
        PanchangamChandrashtamamNakshatraWindow(
            name="POORADAM", start=DAY_START, end=hands_over,
        ),
        # A later window, so `hands_over` is a real handover rather than the end
        # of the civil day — otherwise the clipping guard answers first and the
        # fallback under test is never reached.
        PanchangamChandrashtamamNakshatraWindow(
            name="UTHIRADAM", start=hands_over, end=DAY_END,
        ),
    ))

    assert chandrashtama_end(
        panchangam, janma_nakshatra=POORADAM, natal_moon_rasi=MAGARAM,
    ) == hands_over

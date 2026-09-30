"""Maandhi and Gulika are two different points. These tests hold them apart.

Owner ruling 2026-09-29: the eighth-part table this suite used to verify is the
GULIKA calculation, not the Maandhi the Tamil birth chart wants. Maandhi is a
proportional nazhigai measure with its own day/night constants, and Maandhi's
longitude is the nirayana ascendant at that exact instant — never snapped to an
eighth-part boundary.

What changed here, and why the old suite could not have caught any of it:

  * `test_mandhi_night_slot_is_day_slot_plus_four_wrapped` asserted the
    implementation's own arithmetic back at itself. It passed for a night table
    that was one part late on four of seven weekdays and that put Wednesday on
    the 8th part, which has no lord and so can never be Saturn's.
  * The two night-birth tests asserted only `0.0 <= lng < 360.0` — true of every
    longitude ever returned, including a wrong one.
  * Both day golden cases compared Maandhi against the Kuligai slot start, which
    was the same code path under two names, so they measured nothing
    independent. They now cover GULIKA, which is what that table computes.

Maandhi's own golden cases recompute the ruled formula here, from sunrise/sunset
and the published constants, rather than calling the function under test.
"""
from __future__ import annotations

import math
from datetime import UTC, date, datetime, time, timedelta

import pytest

from app.calculations._yoga_helpers import NATURAL_MALEFICS
from app.calculations.astro import (
    house_from_reference,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import (
    _BHAVA_BALA_MALEFICS,
    _kala_bala_score,
    detect_planetary_wars,
)
from app.calculations.ephemeris import (
    SunriseConvention,
    calculate_lagna_degree,
    calculate_rise_transit_jd,
)
from app.calculations.panchangam import (
    KULIGAI_NIGHT_SLOT,
    KULIGAI_SLOT,
    calculate_daily_panchangam,
)
from app.services._chart_planets import (
    DAY,
    MAANDHI_DAY_NAZHIGAI,
    MAANDHI_NIGHT_NAZHIGAI,
    MAANDHI_REFERENCE_NAZHIGAI,
    NIGHT,
    PREVIOUS_NIGHT,
    _mandhi_longitude,
    _mandhi_planet_position,
    _sunrise_sunset_jd,
    classify_vaara_portion,
    maandhi_span,
    resolve_daytime_birth,
)

#: Nazhigai in one eighth-part of a span: 30 / 8. Gulika's grid.
EIGHTH_PART_NAZHIGAI = MAANDHI_REFERENCE_NAZHIGAI / 8

pytestmark = pytest.mark.no_db

MADURAI = (9.9252, 78.1198, "Asia/Kolkata")


def _angular_diff(a: float, b: float) -> float:
    """Smallest absolute angular difference between two longitudes, in degrees."""
    return abs(((a - b + 180) % 360) - 180)


def _rise_set(d: date, lat: float, lng: float, tzname: str) -> tuple[float, float]:
    tz = resolve_timezone(tzname)
    jd0 = utc_datetime_to_julian_day(
        datetime.combine(d, datetime.min.time(), tzinfo=tz).astimezone(UTC)
    )
    return (
        calculate_rise_transit_jd(jd0, lat, lng, rise=True),
        calculate_rise_transit_jd(jd0, lat, lng, rise=False),
    )


def _expected_maandhi(d: date, t: time, lat: float, lng: float, tzname: str) -> float:
    """The ruled formula, recomputed independently of the function under test."""
    tz = resolve_timezone(tzname)
    sunrise, sunset = _rise_set(d, lat, lng, tzname)
    birth = utc_datetime_to_julian_day(datetime.combine(d, t, tzinfo=tz).astimezone(UTC))

    if sunrise <= birth < sunset:
        anchor, span = sunrise, sunset - sunrise
        nazhigai = MAANDHI_DAY_NAZHIGAI[d.weekday()]
    elif birth < sunrise:
        prev_sunset = _rise_set(d - timedelta(days=1), lat, lng, tzname)[1]
        anchor, span = prev_sunset, sunrise - prev_sunset
        # Yesterday's vaaram: the night belongs to the day whose sunset began it.
        nazhigai = MAANDHI_NIGHT_NAZHIGAI[(d - timedelta(days=1)).weekday()]
    else:
        next_sunrise = _rise_set(d + timedelta(days=1), lat, lng, tzname)[0]
        anchor, span = sunset, next_sunrise - sunset
        nazhigai = MAANDHI_NIGHT_NAZHIGAI[d.weekday()]

    return calculate_lagna_degree(
        anchor + span * nazhigai / MAANDHI_REFERENCE_NAZHIGAI, lat, lng
    )


# ---------------------------------------------------------------------------
# The constants themselves.
# ---------------------------------------------------------------------------

def test_maandhi_constants_are_the_ruled_tables():
    """Sunday -> Saturday, as ruled. Pinned as data, not re-derived by formula."""
    day_sun_to_sat = [26, 22, 18, 14, 10, 6, 2]
    night_sun_to_sat = [10, 6, 2, 26, 22, 18, 14]
    # Python weekday: Mon=0 .. Sun=6, so Sunday first means index 6 then 0..5.
    order = [6, 0, 1, 2, 3, 4, 5]
    assert [MAANDHI_DAY_NAZHIGAI[w] for w in order] == day_sun_to_sat
    assert [MAANDHI_NIGHT_NAZHIGAI[w] for w in order] == night_sun_to_sat


def test_no_maandhi_constant_sits_on_an_eighth_part_boundary():
    """A DATA invariant about the tables, not a guarantee about the algorithm.

    No published Maandhi constant is a multiple of 3.75, so no constant can be
    restated as "the Nth eighth-part". That is worth pinning, because the old
    implementation's constants were slot numbers by construction.

    What this test CANNOT see, and must not be read as covering: someone could
    leave these constants untouched and rewrite `maandhi_span.maandhi_jd` to
    snap its result onto the eighth-part grid. This test would still pass. The
    formula golden cases in
    `test_maandhi_longitude_matches_the_ruled_proportional_formula` are what
    would fail, because they recompute the proportional instant independently.
    """
    for table in (MAANDHI_DAY_NAZHIGAI, MAANDHI_NIGHT_NAZHIGAI):
        for weekday, nazhigai in table.items():
            assert nazhigai % EIGHTH_PART_NAZHIGAI != 0, (
                f"weekday {weekday}'s constant {nazhigai} is a multiple of "
                f"{EIGHTH_PART_NAZHIGAI} and so restatable as an eighth-part"
            )


def test_maandhi_and_gulika_diverge_by_a_quarter_nazhigai_per_weekday():
    """The arithmetic relationship between the two points, pinned as doctrine.

    Under the Uttara-Kalamrita convention Vinaadi adopts, the Gulika **sphuta**
    is the ascendant at the END of Saturn's eighth-part, not its start. That
    text's own worked example is Saturday: Maandhi 2 nazhigai after sunrise,
    Gulika 3-3/4. Saturday is `KULIGAI_SLOT[5] == 1`, whose END is exactly
    1 x 3.75 = 3.75 nazhigai — so the example fixes the convention as the end,
    and it is also an independent cross-check of BOTH our tables at once, since
    no other reading of either produces that pair. (The START would be 0.0,
    i.e. sunrise itself, which is not a Gulika anyone computes.)

    Across the week, |Maandhi - Gulika_end| is a clean arithmetic progression:
    0.25 nazhigai on Sunday rising by 0.25 a day to 1.75 on Saturday. The two
    points therefore never coincide and never drift far apart. This is the
    invariant that makes "Maandhi is not Gulika" checkable in arithmetic rather
    than only in prose.
    """
    # Sunday -> Saturday in Python weekday order.
    order = [6, 0, 1, 2, 3, 4, 5]
    expected = [0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75]
    for weekday, want in zip(order, expected, strict=True):
        gulika_end = KULIGAI_SLOT[weekday] * EIGHTH_PART_NAZHIGAI
        gap = abs(MAANDHI_DAY_NAZHIGAI[weekday] - gulika_end)
        assert gap == pytest.approx(want), (
            f"weekday {weekday}: Maandhi {MAANDHI_DAY_NAZHIGAI[weekday]} vs "
            f"Gulika end {gulika_end}"
        )
        assert gap > 0.0, "Maandhi and Gulika must never coincide"


def test_gulika_night_slot_is_saturns_portion_from_the_fifth_weekday_lord():
    """Derived from the rule, not from the day table.

    Weekday lords in week order; the night's parts begin at the lord of the 5th
    weekday hence (inclusive); Gulika is Saturn's part. Saturn is index 6.
    """
    # Python weekday -> position in the Sun..Sat lord cycle.
    lord_index = {6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
    for weekday, start in lord_index.items():
        expected = ((6 - (start + 4)) % 7) + 1
        assert KULIGAI_NIGHT_SLOT[weekday] == expected


def test_gulika_night_slot_never_lands_on_the_unruled_eighth_part():
    """Only 7 of the 8 night parts have a lord, so Saturn's can only be 1..7."""
    assert all(1 <= slot <= 7 for slot in KULIGAI_NIGHT_SLOT.values())
    assert all(1 <= slot <= 7 for slot in KULIGAI_SLOT.values())


# ---------------------------------------------------------------------------
# Maandhi golden cases — the formula recomputed here, not the function's own.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    ("d", "t", "label"),
    [
        (date(2026, 5, 21), time(10, 0), "Thursday, day birth"),
        (date(2025, 5, 20), time(14, 0), "Tuesday, day birth"),
        (date(2026, 5, 20), time(22, 0), "Wednesday, after sunset"),
        (date(2026, 5, 23), time(23, 30), "Saturday, after sunset"),
        (date(2026, 5, 21), time(2, 0), "Thursday 02:00 — Wednesday's night"),
        (date(2026, 5, 24), time(3, 0), "Sunday 03:00 — Saturday's night"),
    ],
)
def test_maandhi_longitude_matches_the_ruled_proportional_formula(d: date, t: time, label: str):
    lat, lng, tz = MADURAI
    got = _mandhi_longitude(d, t, lat, lng, tz)
    assert got is not None, label
    assert _angular_diff(got, _expected_maandhi(d, t, lat, lng, tz)) < 1e-6, label


def test_maandhi_is_distinct_from_the_gulika_sphuta_on_a_real_chart():
    """Distinct LONGITUDES, and the separation is the ruled fraction exactly.

    A day-birth Monday: Maandhi is at 22/30 of the day, the Gulika sphuta at the
    END of Saturn's 6th eighth-part, 22.5/30 (see
    `test_maandhi_and_gulika_diverge_by_a_quarter_nazhigai_per_weekday` for why
    the end and not the start). Half a nazhigai apart.

    Two things this test deliberately does NOT assert:

      * **Not different rasis.** On this very chart both land in rasi 4. Half a
        nazhigai is ~12 minutes and the ascendant covers ~3 deg in that time, so
        the two points share a rasi far more often than not — and on a Sunday
        the gap is 0.25 nazhigai, ~1.5 deg. The previous version of this test
        required different rasis and passed only because it built Gulika at the
        START of Saturn's part, 3.25 nazhigai away, which is the Kuligai Kalam
        window's opening and not a sphuta at all. It was green for the wrong
        reason and would have stayed green through a real regression.
      * **Not a loose degree threshold.** The separation in TIME is exact
        arithmetic and is asserted as such; only the much weaker "the ascendant
        did move" claim is left to the ephemeris.
    """
    lat, lng, tz = 11.1085, 77.3411, "Asia/Kolkata"
    d, t = date(1993, 3, 15), time(8, 15)
    assert d.weekday() == 0, "this case is a Monday day-birth"

    maandhi = _mandhi_longitude(d, t, lat, lng, tz)
    assert maandhi is not None

    sunrise, sunset = _rise_set(d, lat, lng, tz)
    day = sunset - sunrise
    # Gulika sphuta: the ascendant at the END of Saturn's eighth-part.
    gulika_offset = day / 8 * KULIGAI_SLOT[d.weekday()]
    gulika = calculate_lagna_degree(sunrise + gulika_offset, lat, lng)

    maandhi_offset = day * MAANDHI_DAY_NAZHIGAI[d.weekday()] / MAANDHI_REFERENCE_NAZHIGAI
    # 0.5 nazhigai of a proportional day, in days. Exact, not ephemeris-dependent.
    # Compared as offsets FROM sunrise, not as absolute JDs: a JD is ~2.45e6, so
    # differencing two of them leaves only ~0.05 ms of resolution and no tight
    # tolerance on the gap itself is meaningful.
    expected_gap = day * 0.5 / MAANDHI_REFERENCE_NAZHIGAI
    assert (gulika_offset - maandhi_offset) == pytest.approx(expected_gap, rel=1e-12)

    assert _angular_diff(maandhi, gulika) > 0.5, "distinct points, distinct ascendants"
    assert maandhi != gulika


# ---------------------------------------------------------------------------
# The sunrise-bounded vaara. Vinaadi doctrine, ruled and confirmed 2026-09-29:
# the vaara runs sunrise -> next sunrise, so the civil midnight rollover must
# not move Maandhi's governing weekday and crossing local sunrise must.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    ("d", "t", "expect_vara_weekday", "expect_day", "expect_nazhigai"),
    [
        # Mon 22:00 -> Monday night.
        (date(2026, 5, 18), time(22, 0), 0, False, 6),
        # Tue 03:00, before sunrise -> still MONDAY night.
        (date(2026, 5, 19), time(3, 0), 0, False, 6),
        # Tue 07:00, after sunrise -> Tuesday day.
        (date(2026, 5, 19), time(7, 0), 1, True, 18),
        # Tue 22:00 -> Tuesday night.
        (date(2026, 5, 19), time(22, 0), 1, False, 2),
        # Wed 03:00, before sunrise -> still TUESDAY night.
        (date(2026, 5, 20), time(3, 0), 1, False, 2),
        # Thu 03:00, before sunrise -> still WEDNESDAY night (26, not 22).
        (date(2026, 5, 21), time(3, 0), 2, False, 26),
    ],
)
def test_governing_vaara_is_sunrise_bounded(
    d: date, t: time, expect_vara_weekday: int, expect_day: bool, expect_nazhigai: int
):
    lat, lng, tz = MADURAI
    span = maandhi_span(d, t, lat, lng, tz)
    assert span is not None
    assert span.vara_date.weekday() == expect_vara_weekday
    assert span.is_day is expect_day
    assert span.nazhigai == expect_nazhigai


def test_civil_midnight_does_not_move_the_vaara_but_sunrise_does():
    """The architectural invariant, stated as one assertion pair.

    23:00 Tuesday and 03:00 Wednesday straddle civil midnight and must share a
    vaara. 03:00 Wednesday and 07:00 Wednesday straddle sunrise and must not.
    This is the bug that `date.weekday()` indexing produced, pinned so it cannot
    come back.
    """
    lat, lng, tz = MADURAI
    before_midnight = maandhi_span(date(2026, 5, 19), time(23, 0), lat, lng, tz)
    after_midnight = maandhi_span(date(2026, 5, 20), time(3, 0), lat, lng, tz)
    after_sunrise = maandhi_span(date(2026, 5, 20), time(7, 0), lat, lng, tz)
    assert before_midnight is not None and after_midnight is not None and after_sunrise is not None

    assert before_midnight.vara_date == after_midnight.vara_date, "civil midnight moved the vaara"
    assert before_midnight.nazhigai == after_midnight.nazhigai
    assert after_midnight.vara_date != after_sunrise.vara_date, "sunrise did not move the vaara"


def test_vaara_portion_boundaries_at_exact_equality():
    """The half-open boundary tested at EXACT float equality. Pure arithmetic.

    This is the test the date/time-based one below cannot be: a birth moment
    built from a `datetime` is truncated to whole seconds, so "sunrise exactly"
    via that route is really some fraction of a second off and an implementation
    that had `<=` where it needs `<` would sail through it. `classify_vaara_
    portion` exists so this can be asserted on the floats themselves.
    """
    sunrise, sunset = 2460000.75, 2460001.25

    # Exactly at sunrise the NEW vaara begins, and it begins in its day portion.
    assert classify_vaara_portion(sunrise, sunrise, sunset) == DAY
    # Exactly at sunset the night portion of the SAME vaara begins.
    assert classify_vaara_portion(sunset, sunrise, sunset) == NIGHT
    # The smallest representable step below each boundary falls the other way.
    assert classify_vaara_portion(math.nextafter(sunrise, 0.0), sunrise, sunset) == PREVIOUS_NIGHT
    assert classify_vaara_portion(math.nextafter(sunset, 0.0), sunrise, sunset) == DAY
    # Interior and beyond, for completeness.
    assert classify_vaara_portion(sunrise + 0.1, sunrise, sunset) == DAY
    assert classify_vaara_portion(sunset + 0.1, sunrise, sunset) == NIGHT


def test_day_and_night_boundaries_are_half_open():
    """`[sunrise, sunset)` is day; `[sunset, next_sunrise)` is night.

    The same doctrine as `test_vaara_portion_boundaries_at_exact_equality`, but
    end-to-end through real ephemeris rise/set and a real local date and time,
    which is what production calls.

    **Blind spot, recorded rather than implied:** every case here is one second
    off the boundary, not on it, because a `datetime` cannot carry the boundary
    instant — `.time()` is truncated to whole seconds below. So this proves the
    classification is correct NEAR each boundary; the boundary instant itself is
    only covered by the pure-float test above. The comments below say "minus a
    second" and "plus a second" for that reason and must not be reworded to
    "exactly".
    """
    lat, lng, tz = MADURAI
    d = date(2026, 5, 20)
    zone = resolve_timezone(tz)
    sunrise_jd, sunset_jd = _rise_set(d, lat, lng, tz)

    def local_time(jd: float, offset_seconds: int = 0) -> tuple[date, time]:
        moment = (
            datetime(2000, 1, 1, 12, tzinfo=UTC)
            + timedelta(days=jd - 2451545.0, seconds=offset_seconds)
        ).astimezone(zone)
        return moment.date(), moment.time().replace(microsecond=0)

    # Sunrise minus a second: previous vaara, night.
    bd, bt = local_time(sunrise_jd, -1)
    span = maandhi_span(bd, bt, lat, lng, tz)
    assert span is not None and span.is_day is False
    assert span.vara_date == d - timedelta(days=1)

    # Sunrise plus a second: this vaara, day.
    bd, bt = local_time(sunrise_jd, +1)
    span = maandhi_span(bd, bt, lat, lng, tz)
    assert span is not None and span.is_day is True
    assert span.vara_date == d

    # Sunset minus a second: still day.
    bd, bt = local_time(sunset_jd, -1)
    span = maandhi_span(bd, bt, lat, lng, tz)
    assert span is not None and span.is_day is True
    assert span.vara_date == d

    # Sunset plus a second: night of the SAME vaara.
    bd, bt = local_time(sunset_jd, +1)
    span = maandhi_span(bd, bt, lat, lng, tz)
    assert span is not None and span.is_day is False
    assert span.vara_date == d


def test_vaara_boundary_uses_the_same_sunrise_as_the_panchangam():
    """One canonical sunrise, or a birth sits in two vaaras at once.

    Calls the CHART's own `_sunrise_sunset_jd` — the function production uses —
    not the `_rise_set` helper in this file. The earlier version of this test
    called the helper, so it compared `calculate_rise_transit_jd` against the
    panchangam and never touched the chart side at all: `_sunrise_sunset_jd`
    could have been rewritten onto the wrong convention with this test still
    green.

    The two conventions are ~3.5 min apart, so a mismatch would put any birth
    inside that gap in Wednesday's vaara for one engine and Thursday's for the
    other.

    **What this test cannot see:** it is a two-way agreement check. If the chart
    and the panchangam were moved onto the wrong convention *together*, they
    would still agree and this would still pass. That is what
    `test_canonical_sunrise_is_the_apparent_upper_limb_event` is for.
    """
    lat, lng, tz = MADURAI
    d = date(2026, 5, 20)
    snapshot = calculate_daily_panchangam(d, lat, lng, tz)

    bounds = _sunrise_sunset_jd(d, tz, lat, lng)
    assert bounds is not None
    chart_sunrise, chart_sunset = bounds

    panchangam_sunrise = utc_datetime_to_julian_day(snapshot.sunrise.astimezone(UTC))
    panchangam_sunset = utc_datetime_to_julian_day(snapshot.sunset.astimezone(UTC))
    # One second of tolerance: the panchangam's own value round-trips through a
    # datetime, so it is not bit-identical to the raw JD.
    assert abs(chart_sunrise - panchangam_sunrise) * 86400 < 1.0
    assert abs(chart_sunset - panchangam_sunset) * 86400 < 1.0


def test_canonical_sunrise_is_the_apparent_upper_limb_event():
    """Which convention, not merely "the same one on both sides".

    The chart's canonical sunrise must equal `calculate_rise_transit_jd` at
    APPARENT_UPPER_LIMB and must NOT equal it at GEOMETRIC_DISC_CENTER. That
    second half is the one with teeth: the disc-centre event is the convention
    this engine was on until the 2026-09-29 ruling, and it sits a few minutes
    inside the apparent event at both ends. Asserting the gap has the expected
    SIGN and MAGNITUDE means a silent revert cannot pass.

    **This is a convention lock, not external truth.** It pins which of two
    library conventions we call, measured against the library itself. Parity
    with a printed Tamil publisher's sunrise is a separate, still-open item
    (AR-5) and nothing here establishes it — do not read a pass as publisher
    agreement.
    """
    lat, lng, tz = MADURAI
    d = date(2026, 5, 20)
    bounds = _sunrise_sunset_jd(d, tz, lat, lng)
    assert bounds is not None
    chart_sunrise, chart_sunset = bounds

    zone = resolve_timezone(tz)
    jd0 = utc_datetime_to_julian_day(
        datetime.combine(d, datetime.min.time(), tzinfo=zone).astimezone(UTC)
    )

    def at(convention: SunriseConvention, *, rise: bool) -> float:
        return calculate_rise_transit_jd(jd0, lat, lng, rise=rise, convention=convention)

    upper_rise = at(SunriseConvention.APPARENT_UPPER_LIMB, rise=True)
    upper_set = at(SunriseConvention.APPARENT_UPPER_LIMB, rise=False)
    centre_rise = at(SunriseConvention.GEOMETRIC_DISC_CENTER, rise=True)
    centre_set = at(SunriseConvention.GEOMETRIC_DISC_CENTER, rise=False)

    assert chart_sunrise == pytest.approx(upper_rise, abs=1e-9)
    assert chart_sunset == pytest.approx(upper_set, abs=1e-9)

    # Disc centre rises LATER and sets EARLIER — a shorter day, by minutes.
    rise_gap_minutes = (centre_rise - chart_sunrise) * 1440
    set_gap_minutes = (chart_sunset - centre_set) * 1440
    assert 2.0 < rise_gap_minutes < 8.0, f"sunrise gap {rise_gap_minutes:.2f} min"
    assert 2.0 < set_gap_minutes < 8.0, f"sunset gap {set_gap_minutes:.2f} min"


def test_kuligai_kalam_is_the_whole_interval_and_the_sphuta_is_its_end():
    """Two concepts that must not be allowed to merge again.

    Kuligai Kalam (the avoid-window the panchangam publishes) is the COMPLETE
    Saturn eighth-part, `[start, end)`. The Gulika sphuta — the chart point, if
    Vinaadi ever exposes one — is the ascendant at that interval's END under the
    Uttara-Kalamrita convention. Same table, two different things, and the
    published window is the one with a duration.

    Maandhi belongs to neither: it falls strictly INSIDE the window on a Monday
    (22 nazhigai, window 18.75 to 22.5) and that is a coincidence of that
    weekday, not a rule — on Saturday it is inside too, on Thursday it is not.
    """
    d = date(2026, 5, 20)  # Wednesday
    lat, lng, tz = MADURAI
    snapshot = calculate_daily_panchangam(d, lat, lng, tz)
    slot = KULIGAI_SLOT[d.weekday()]
    assert snapshot.kuligai.slot == slot

    bounds = _sunrise_sunset_jd(d, tz, lat, lng)
    assert bounds is not None
    sunrise, sunset = bounds
    part = (sunset - sunrise) / 8

    window_start = utc_datetime_to_julian_day(snapshot.kuligai.start.astimezone(UTC))
    window_end = utc_datetime_to_julian_day(snapshot.kuligai.end.astimezone(UTC))

    assert window_start == pytest.approx(sunrise + part * (slot - 1), abs=1.0 / 86400)
    assert window_end == pytest.approx(sunrise + part * slot, abs=1.0 / 86400)
    # The window has a real duration — one eighth of the day, not an instant.
    assert (window_end - window_start) == pytest.approx(part, abs=1.0 / 86400)


def test_pre_sunrise_birth_uses_the_previous_vaarams_night_constant():
    """03:00 Sunday is inside Saturday's vaaram, so the constant is Saturday's.

    Taking yesterday's night span with today's lord — what the old code did —
    is not a rounding-scale slip: Wednesday's night constant is 26 and
    Tuesday's is 2, twenty-four nazhigai apart.
    """
    lat, lng, tz = MADURAI
    d, t = date(2026, 5, 24), time(3, 0)  # Sunday 03:00

    sunrise, _ = _rise_set(d, lat, lng, tz)
    prev_sunset = _rise_set(d - timedelta(days=1), lat, lng, tz)[1]
    span = sunrise - prev_sunset

    saturday = calculate_lagna_degree(
        prev_sunset + span * MAANDHI_NIGHT_NAZHIGAI[5] / MAANDHI_REFERENCE_NAZHIGAI, lat, lng
    )
    sunday = calculate_lagna_degree(
        prev_sunset + span * MAANDHI_NIGHT_NAZHIGAI[6] / MAANDHI_REFERENCE_NAZHIGAI, lat, lng
    )
    assert _angular_diff(saturday, sunday) > 1.0, "the two candidates must be distinguishable"

    got = _mandhi_longitude(d, t, lat, lng, tz)
    assert got is not None
    assert _angular_diff(got, saturday) < 1e-6
    assert _angular_diff(got, sunday) > 1.0


# ---------------------------------------------------------------------------
# Gulika golden cases — the eighth-part table, against the panchangam's own
# documented QA reference cases. This is what the old Maandhi cases were
# really testing.
# ---------------------------------------------------------------------------

def test_gulika_day_slot_thursday_2026_05_21():
    d = date(2026, 5, 21)
    lat, lng, tz = MADURAI
    snapshot = calculate_daily_panchangam(d, lat, lng, tz)
    assert snapshot.weekday == "THURSDAY"
    assert snapshot.kuligai.slot == 3  # documented QA reference case
    assert snapshot.kuligai.slot == KULIGAI_SLOT[d.weekday()]


def test_gulika_day_slot_tuesday_2025_05_20():
    d = date(2025, 5, 20)
    lat, lng, tz = 11.0168, 76.9558, "Asia/Kolkata"
    snapshot = calculate_daily_panchangam(d, lat, lng, tz)
    assert snapshot.weekday == "TUESDAY"
    assert snapshot.kuligai.slot == 5  # documented QA reference case
    assert snapshot.kuligai.slot == KULIGAI_SLOT[d.weekday()]


# ---------------------------------------------------------------------------
# Basic behavior
# ---------------------------------------------------------------------------

def test_mandhi_longitude_none_without_birth_time():
    assert _mandhi_longitude(date(2026, 5, 21), None, *MADURAI[:2], MADURAI[2]) is None


def test_mandhi_planet_position_fields():
    pos = _mandhi_planet_position(200.0, lagna_rasi=1)  # 200 deg = Libra (rasi 7)
    assert pos.graha == "MANDHI"
    assert pos.rasi == 7
    assert pos.house_from_lagna == house_from_reference(1, 7)
    assert pos.strength_score == 0
    assert pos.is_retrograde is False
    assert pos.is_combust is False


# ---------------------------------------------------------------------------
# Integration with the rest of the engine (Phase 1.2 malefic-set wiring).
# ---------------------------------------------------------------------------

def test_mandhi_counts_as_malefic_across_modules():
    """Maandhi afflicts as a malefic where affliction is INTERPRETIVE.

    `NATURAL_MALEFICS` drives yoga detection and `_BHAVA_BALA_MALEFICS` drives
    `compute_bhava_bala`'s occupancy and drishti terms — a simplified house
    metric, explicitly not classical per-planet Shadbala. Maandhi belongs in
    both: the bhava it occupies and the bhavas it aspects suffering for it is
    standard Tamil practice.
    """
    assert "MANDHI" in NATURAL_MALEFICS
    assert "MANDHI" in _BHAVA_BALA_MALEFICS


def test_mandhi_does_not_enter_calculations_reserved_for_real_grahas():
    """The other half of the boundary. "Malefic" is not a licence to join in.

    Maandhi is a shadow upagraha. It has no Shadbala of its own, so it must not
    pick up classical graha-only terms just because it is classified malefic.
    Pinned as exclusions, because nothing else gates this direction and the
    membership test above reads as blanket permission without it.
    """
    # Graha yuddha is for the five true planets — verified in its own test below,
    # asserted here so the pair reads as one boundary.
    assert "MANDHI" not in detect_planetary_wars({"MARS": 100.0, "MANDHI": 100.05})

    # Kala Bala's nathonnatha is the BPHS six. Maandhi is neither day- nor
    # night-strong and must score identically whichever way the birth falls.
    kala_day = _kala_bala_score("MANDHI", True, True, False, None)
    kala_night = _kala_bala_score("MANDHI", False, True, False, None)
    assert kala_day == kala_night

    # And every Shadbala-shaped term on its PlanetPosition stays neutral.
    pos = _mandhi_planet_position(200.0, lagna_rasi=1)
    assert set(pos.strength_breakdown.values()) == {"NEUTRAL"}
    assert pos.strength_score == 0


def test_mandhi_excluded_from_planetary_wars():
    wars = detect_planetary_wars({"MARS": 100.0, "MANDHI": 100.05, "VENUS": 100.02})
    assert "MANDHI" not in wars
    assert "MANDHI" not in wars.values()


# ---------------------------------------------------------------------------
# Day/night resolution. Maandhi and Kala Bala read the same answer, and
# "unknown" is an answer.
# ---------------------------------------------------------------------------

def test_unknown_birth_time_does_not_become_a_daylight_birth():
    """No birth time means UNRESOLVED, not day.

    It used to return True, which fed Kala Bala a fabricated diurnal birth:
    Sun/Jupiter/Venus took the full 1.0 nathonnatha term and Moon/Mars/Saturn
    were docked to 0.4, on the strength of nothing. No doctrine assumes daylight
    for an unknown time — classical practice rectifies the time first — so the
    fail-safe abstains. `_mandhi_longitude` already returned None here; the two
    now agree instead of one guessing.
    """
    lat, lng, tz = MADURAI
    d = date(2026, 5, 21)
    assert resolve_daytime_birth(None, birth_date=d, birth_latitude=lat,
                                 birth_longitude=lng, birth_timezone=tz) is None
    assert _mandhi_longitude(d, None, lat, lng, tz) is None


def test_unresolved_day_night_scores_nathonnatha_at_the_midpoint():
    """None must be neutral, and demonstrably between the two known answers."""
    for planet in ("SUN", "JUPITER", "VENUS", "MOON", "MARS", "SATURN"):
        day = _kala_bala_score(planet, True, True, False, None)
        night = _kala_bala_score(planet, False, True, False, None)
        unknown = _kala_bala_score(planet, None, True, False, None)
        assert day != night, f"{planet} should be day/night sensitive"
        assert min(day, night) < unknown < max(day, night), (
            f"{planet}: unknown {unknown} must sit between {day} and {night}"
        )
    # Mercury has no nathonnatha preference, so nothing moves for it.
    assert (
        _kala_bala_score("MERCURY", None, True, False, None)
        == _kala_bala_score("MERCURY", True, True, False, None)
    )


def test_known_time_at_a_known_place_resolves_against_true_sunrise():
    """The resolved path, and that it disagrees with the clock where it should."""
    lat, lng, tz = MADURAI
    d = date(2026, 5, 21)
    assert resolve_daytime_birth(time(10, 0), birth_date=d, birth_latitude=lat,
                                 birth_longitude=lng, birth_timezone=tz) is True
    assert resolve_daytime_birth(time(22, 0), birth_date=d, birth_latitude=lat,
                                 birth_longitude=lng, birth_timezone=tz) is False
    # No place on file: the 06:00-18:00 clock, kept deliberately as an estimate
    # for this product's 8-13 deg N population. Not an invention — a known time
    # of 22:00 really is night almost everywhere.
    assert resolve_daytime_birth(time(22, 0)) is False
    assert resolve_daytime_birth(time(10, 0)) is True

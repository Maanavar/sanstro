"""WI-07 (Thirukanitham sunrise, Doctrine §1) validation harness.

Status: **convention RULED and externally cross-checked; printed-publisher
parity still OPEN** (owner ruling 2026-09-29).

What changed on 2026-09-29
--------------------------
The default sunrise/sunset convention moved from Swiss Ephemeris's
``SE_BIT_HINDU_RISING`` (disc centre, no refraction) to the **apparent
upper-limb event including atmospheric refraction** — the modern Drik
convention of India's Rashtriya Panchang and DrikPanchang's default.

The disc-centre choice had been adopted on the premise that it "matches every
printed Tamil panchangam". That premise was never checked against a printed
edition; the library's flag name is a claim about Hindu practice, not a
ratified standard, and treating the two as equivalent is exactly the error
that put every Vinaadi sunrise ~3.5 min later and every sunset ~3.5 min
earlier than every mainstream published source for two months. The 12
reference slots in this file sat at ``None`` the whole time, so nothing failed.

What each tier proves — and what it cannot
-------------------------------------------
This file is deliberately four tiers, strongest claim last, because a single
green tick here previously stood in for a validation nobody had performed.

1. ``EXTERNAL_APPARENT_CASES`` — exact-match against sunrise values fetched
   live from drikpanchang.com (a different team, a different codebase). Under
   the old disc-centre default these 12 values could only support a
   directional band check, because the two sides asserted *different*
   conventions. Now that Vinaadi has adopted the same convention, they are an
   exact-value gate. **Proves:** our apparent-convention implementation agrees
   with an independent production calculator to well under a minute.
   **Cannot prove:** that a printed Tamil edition prints these times — it is
   still a calculator, not a digitised print edition.

2. ``COMPUTATIONAL_CROSSCHECK_CASES`` — sunrise and Rahu Kalam start computed
   by ``scripts/sunrise_reference_crosscheck.py``, a direct NOAA/Meeus
   implementation sharing no code with Swiss Ephemeris or with
   ``app/calculations/ephemeris.py``. **Proves:** the geometry and the
   eighth-of-the-day arithmetic are coded correctly, independently of the
   ephemeris library. **Cannot prove:** anything about which convention is
   doctrinally right — it was told which zenith angle to use.

3. Convention-wiring tests — that the default really is the apparent event and
   that the geometric variant is still reachable and still sits inside it.
   **Proves:** a future edit cannot silently restore the disc-centre default.
   This is the check whose absence let the original mistake persist.

4. ``PRINTED_PANCHANGAM_CASES`` — **still all ``None``, still skipped.** This
   is the one tier that would establish publisher parity, and per the owner's
   ruling it remains a separate open task. Do not read tiers 1-3 as closing
   it. It needs a human with a real Vasan / Manimekalai / Arcot edition.

Blind spots of this file as a whole
-----------------------------------
- Every tier is Chennai/Tiruppur/Toronto. Nothing here exercises equatorial or
  near-polar latitudes, where the refraction term behaves differently and
  where ``RiseTransitUndefinedError`` is reachable.
- Atmospheric parameters are the pinned 0.0/0.0 (see
  ``calculate_rise_transit_jd``). Nothing asserts what happens at another
  temperature; a 15 °C run moves the event ~13 s, which every band here
  absorbs silently.
- The display rounding policy is tested in ``tests/test_clock_rounding.py``,
  not here. These assertions compare exact instants, so they would pass even
  if the presentation layer went back to truncating.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

import pytest

from app.calculations import ephemeris
from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import SunriseConvention, calculate_rise_transit_jd
from app.calculations.panchangam import (
    _nakshatra_number_at_jd,
    _tithi_number_at_jd,
    calculate_daily_panchangam,
)
from app.calculations.tamil_calendar import (
    _sun_rasi_index_at_jd,
    find_sankranti_jd,
    month_start_date_for_sankranti,
)


@dataclass(frozen=True)
class ReferenceCase:
    label: str
    day: date
    lat: float
    lon: float
    tz: str
    #: "HH:MM" local time, or None to keep the case skipped rather than
    #: asserting a value nobody sourced.
    expected_sunrise: str | None
    expected_rahu_kalam_start: str | None
    source: str | None


def _local_midnight_jd(case: ReferenceCase) -> float:
    tz = ZoneInfo(case.tz)
    midnight = datetime(case.day.year, case.day.month, case.day.day, tzinfo=tz)
    return utc_datetime_to_julian_day(midnight.astimezone(UTC))


def _assert_within(actual: datetime, expected_hhmm: str, case: ReferenceCase, what: str, tolerance_s: float = 120.0) -> None:
    expected = datetime.strptime(f"{case.day} {expected_hhmm}", "%Y-%m-%d %H:%M")
    delta = abs((actual.replace(tzinfo=None) - expected).total_seconds())
    assert delta < tolerance_s, (
        f"{case.label}: {what} {actual.replace(tzinfo=None)} vs reference {expected} "
        f"({delta:.0f}s off, tolerance {tolerance_s:.0f}s) — {case.source}"
    )


# ---------------------------------------------------------------------------
# Tier 1 — external independent calculator, same convention, exact match.
# ---------------------------------------------------------------------------
# Values fetched from drikpanchang.com/panchang/day-panchang.html on
# 2026-07-16 (Chennai geoname-id=1264527, Toronto geoname-id=6167865). They
# were recorded then as a *rejected* exact-match source, because Vinaadi's
# default was disc-centre and Drik's is apparent upper-limb. The 2026-09-29
# ruling adopted Drik's convention, which promotes these same 12 numbers from
# a directional hint to a real gate. Drik publishes to the minute, so the
# 120 s band covers its rounding plus any small difference in the coordinates
# behind its geoname ids; measured worst case is 40 s.
_DRIKPANCHANG_SOURCE = "drikpanchang.com day-panchang, fetched 2026-07-16 (apparent upper-limb convention)"

EXTERNAL_APPARENT_CASES: tuple[ReferenceCase, ...] = (
    ReferenceCase("Chennai — Jan", date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata", "06:35", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Chennai — Mar equinox", date(2026, 3, 20), 13.0827, 80.2707, "Asia/Kolkata", "06:13", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Chennai — Jun solstice", date(2026, 6, 21), 13.0827, 80.2707, "Asia/Kolkata", "05:44", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Chennai — Sep equinox", date(2026, 9, 22), 13.0827, 80.2707, "Asia/Kolkata", "05:58", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Chennai — Oct", date(2026, 10, 10), 13.0827, 80.2707, "Asia/Kolkata", "05:59", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Chennai — Dec solstice", date(2026, 12, 21), 13.0827, 80.2707, "Asia/Kolkata", "06:26", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Jan", date(2026, 1, 15), 43.6532, -79.3832, "America/Toronto", "07:48", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Mar equinox", date(2026, 3, 20), 43.6532, -79.3832, "America/Toronto", "07:21", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Jun solstice", date(2026, 6, 21), 43.6532, -79.3832, "America/Toronto", "05:36", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Sep equinox", date(2026, 9, 22), 43.6532, -79.3832, "America/Toronto", "07:05", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Oct", date(2026, 10, 10), 43.6532, -79.3832, "America/Toronto", "07:26", None, _DRIKPANCHANG_SOURCE),
    ReferenceCase("Toronto — Dec solstice", date(2026, 12, 21), 43.6532, -79.3832, "America/Toronto", "07:48", None, _DRIKPANCHANG_SOURCE),
)


@pytest.mark.parametrize("case", EXTERNAL_APPARENT_CASES, ids=[c.label for c in EXTERNAL_APPARENT_CASES])
def test_sunrise_matches_external_apparent_calculator(case: ReferenceCase) -> None:
    """Exact-value gate against an independent production calculator using the
    convention Vinaadi now shares. This is what the 12 permanently-skipped
    slots were replaced with — NOT printed-publisher parity, which is
    PRINTED_PANCHANGAM_CASES below and is still open."""
    snapshot = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    assert case.expected_sunrise is not None
    _assert_within(snapshot.sunrise, case.expected_sunrise, case, "sunrise")


# ---------------------------------------------------------------------------
# Tier 2 — independent NOAA/Meeus computation, regenerable.
# ---------------------------------------------------------------------------
# Regenerate with: .venv/Scripts/python.exe scripts/sunrise_reference_crosscheck.py
# The generator is committed this time; the original one was not, which is why
# these values had to be rebuilt from scratch for the 2026-09-29 ruling.
_CROSSCHECK_SOURCE = (
    "Computed: NOAA/Meeus apparent (zenith 90.833 deg) via "
    "scripts/sunrise_reference_crosscheck.py, agrees with SwissEph <=20s, 2026-09-29"
)

COMPUTATIONAL_CROSSCHECK_CASES: tuple[ReferenceCase, ...] = (
    ReferenceCase("Chennai — Jan", date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata", "06:35", "13:44", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Mar equinox", date(2026, 3, 20), 13.0827, 80.2707, "Asia/Kolkata", "06:13", "10:45", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Jun solstice", date(2026, 6, 21), 13.0827, 80.2707, "Asia/Kolkata", "05:43", "17:00", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Sep equinox", date(2026, 9, 22), 13.0827, 80.2707, "Asia/Kolkata", "05:58", "15:03", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Oct", date(2026, 10, 10), 13.0827, 80.2707, "Asia/Kolkata", "05:58", "08:57", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Dec solstice", date(2026, 12, 21), 13.0827, 80.2707, "Asia/Kolkata", "06:26", "07:51", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Jan", date(2026, 1, 15), 43.6532, -79.3832, "America/Toronto", "07:47", "13:37", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Mar equinox", date(2026, 3, 20), 43.6532, -79.3832, "America/Toronto", "07:20", "11:54", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Jun solstice", date(2026, 6, 21), 43.6532, -79.3832, "America/Toronto", "05:36", "19:06", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Sep equinox", date(2026, 9, 22), 43.6532, -79.3832, "America/Toronto", "07:04", "16:12", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Oct", date(2026, 10, 10), 43.6532, -79.3832, "America/Toronto", "07:25", "10:14", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Dec solstice", date(2026, 12, 21), 43.6532, -79.3832, "America/Toronto", "07:47", "08:54", _CROSSCHECK_SOURCE),
)


@pytest.mark.parametrize("case", COMPUTATIONAL_CROSSCHECK_CASES, ids=[c.label for c in COMPUTATIONAL_CROSSCHECK_CASES])
def test_sunrise_matches_computational_crosscheck(case: ReferenceCase) -> None:
    snapshot = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    assert case.expected_sunrise is not None
    _assert_within(snapshot.sunrise, case.expected_sunrise, case, "sunrise")


@pytest.mark.parametrize("case", COMPUTATIONAL_CROSSCHECK_CASES, ids=[c.label for c in COMPUTATIONAL_CROSSCHECK_CASES])
def test_rahu_kalam_matches_computational_crosscheck(case: ReferenceCase) -> None:
    snapshot = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    assert case.expected_rahu_kalam_start is not None
    _assert_within(snapshot.rahu_kalam.start, case.expected_rahu_kalam_start, case, "Rahu Kalam start")


# ---------------------------------------------------------------------------
# Tier 3 — convention wiring. The check whose absence let the old default sit
# unnoticed for two months.
# ---------------------------------------------------------------------------
#: The case the owner's ruling pinned by hand (Tiruppur, 2026-09-29), which is
#: also the report that triggered the re-ruling: Vinaadi showed 6:12 am / 6:08 pm
#: against 06:09 / 18:12 everywhere else.
_TIRUPPUR = ReferenceCase(
    "Tiruppur — ruling case", date(2026, 9, 29), 11.1085, 77.3411, "Asia/Kolkata",
    "06:09", None, "Owner ruling 2026-09-29 (expected apparent sunrise 06:09:22, sunset 18:12:30 IST)",
)


def test_thirukanitham_default_is_the_apparent_convention() -> None:
    """If someone reintroduces SE_BIT_HINDU_RISING as the default, this fails."""
    assert ephemeris.THIRUKANITHAM_SUNRISE_CONVENTION is SunriseConvention.APPARENT_UPPER_LIMB


def test_ruling_case_matches_the_pinned_apparent_instants() -> None:
    """Exact-second assertion on the two values the ruling wrote down. Every
    other reference here carries a band; this one does not, because it is the
    owner's own recorded expectation."""
    snapshot = calculate_daily_panchangam(_TIRUPPUR.day, _TIRUPPUR.lat, _TIRUPPUR.lon, _TIRUPPUR.tz)
    assert snapshot.sunrise.strftime("%H:%M:%S") == "06:09:22"
    assert snapshot.sunset.strftime("%H:%M:%S") == "18:12:30"


@pytest.mark.parametrize(
    "case",
    (_TIRUPPUR,) + EXTERNAL_APPARENT_CASES,
    ids=[c.label for c in (_TIRUPPUR,) + EXTERNAL_APPARENT_CASES],
)
def test_geometric_variant_sits_strictly_inside_the_apparent_event(case: ReferenceCase) -> None:
    """The traditional variant must stay reachable AND stay distinguishable.

    Two failure modes this catches that a simple "default is apparent" assert
    does not: the enum member silently mapping to the same rsmi bits as the
    default (making the variant a no-op), and the default drifting toward the
    geometric value. Both ends are checked because refraction is symmetric
    about solar noon and a one-ended check would miss a sunset-only slip.
    """
    jd = _local_midnight_jd(case)
    apparent_rise = calculate_rise_transit_jd(jd, case.lat, case.lon, rise=True)
    apparent_set = calculate_rise_transit_jd(jd, case.lat, case.lon, rise=False)
    geometric_rise = calculate_rise_transit_jd(
        jd, case.lat, case.lon, rise=True, convention=SunriseConvention.GEOMETRIC_DISC_CENTER
    )
    geometric_set = calculate_rise_transit_jd(
        jd, case.lat, case.lon, rise=False, convention=SunriseConvention.GEOMETRIC_DISC_CENTER
    )

    rise_gap_min = (geometric_rise - apparent_rise) * 1440.0
    set_gap_min = (apparent_set - geometric_set) * 1440.0

    assert 1.0 < rise_gap_min < 15.0, (
        f"{case.label}: geometric sunrise is {rise_gap_min:.2f} min after apparent — "
        "outside the plausible refraction+semidiameter band"
    )
    assert 1.0 < set_gap_min < 15.0, (
        f"{case.label}: geometric sunset is {set_gap_min:.2f} min before apparent — "
        "outside the plausible refraction+semidiameter band"
    )


# ---------------------------------------------------------------------------
# Tier 3b — boundary regressions (owner ruling requirement 7).
# ---------------------------------------------------------------------------
# Found by sweeping every day of 2026 across three locations for cases where
# the ~3.5 min convention band lands on a limb boundary and changes the udaya
# value. These are the days on which the ruling actually moves a reader's
# answer, not just their clock. Nine exist in 2026; all nine are pinned.
#
# Each row: (label, date, lat, lon, tz, limb, value_under_apparent,
#            value_under_geometric). The apparent event is EARLIER, so its
# value is the lower/preceding one — except across a cycle rollover.
UDAYA_LIMB_FLIP_CASES: tuple[tuple[str, date, float, float, str, str, int, int], ...] = (
    ("Chennai 2026-01-08 tithi", date(2026, 1, 8), 13.0827, 80.2707, "Asia/Kolkata", "tithi", 20, 21),
    ("Chennai 2026-11-19 nakshatra", date(2026, 11, 19), 13.0827, 80.2707, "Asia/Kolkata", "nakshatra", 24, 25),
    # Tithi 30 -> 1 is a cycle rollover, not a decrement: the earlier apparent
    # sunrise still falls in the closing tithi of the previous lunar month.
    ("Chennai 2026-12-09 tithi", date(2026, 12, 9), 13.0827, 80.2707, "Asia/Kolkata", "tithi", 30, 1),
    ("Tiruppur 2026-03-13 tithi", date(2026, 3, 13), 11.1085, 77.3411, "Asia/Kolkata", "tithi", 24, 25),
    ("Tiruppur 2026-05-27 nakshatra", date(2026, 5, 27), 11.1085, 77.3411, "Asia/Kolkata", "nakshatra", 13, 14),
    ("Tiruppur 2026-09-02 tithi", date(2026, 9, 2), 11.1085, 77.3411, "Asia/Kolkata", "tithi", 20, 21),
    ("Toronto 2026-04-14 nakshatra", date(2026, 4, 14), 43.6532, -79.3832, "America/Toronto", "nakshatra", 24, 25),
    ("Toronto 2026-07-05 nakshatra", date(2026, 7, 5), 43.6532, -79.3832, "America/Toronto", "nakshatra", 24, 25),
    ("Toronto 2026-07-29 nakshatra", date(2026, 7, 29), 43.6532, -79.3832, "America/Toronto", "nakshatra", 21, 22),
)


@pytest.mark.parametrize(
    "label,day,lat,lon,tz,limb,apparent_value,geometric_value",
    UDAYA_LIMB_FLIP_CASES,
    ids=[row[0] for row in UDAYA_LIMB_FLIP_CASES],
)
def test_udaya_limb_boundary_within_the_convention_band(
    label: str, day: date, lat: float, lon: float, tz: str, limb: str, apparent_value: int, geometric_value: int
) -> None:
    """A limb boundary inside the ~3.5 min band gives a DIFFERENT udaya value
    under each convention. Pinning both sides does two things: it proves the
    convention change is load-bearing (not cosmetic), and it makes any future
    drift in the sunrise instant fail loudly on the days where a reader would
    actually see a different tithi or nakshatra named for their day.
    """
    jd_midnight = utc_datetime_to_julian_day(
        datetime(day.year, day.month, day.day, tzinfo=ZoneInfo(tz)).astimezone(UTC)
    )
    apparent_rise = calculate_rise_transit_jd(jd_midnight, lat, lon, rise=True)
    geometric_rise = calculate_rise_transit_jd(
        jd_midnight, lat, lon, rise=True, convention=SunriseConvention.GEOMETRIC_DISC_CENTER
    )
    at_jd = _tithi_number_at_jd if limb == "tithi" else _nakshatra_number_at_jd

    assert at_jd(apparent_rise) == apparent_value, f"{label}: udaya {limb} under the ruled convention"
    assert at_jd(geometric_rise) == geometric_value, (
        f"{label}: udaya {limb} under the retired variant — if this changed, the "
        "boundary moved and this case may no longer straddle it"
    )

    # The whole point: the two disagree. A refactor that made the conventions
    # identical would pass both asserts above only if it also broke this one.
    assert apparent_value != geometric_value


#: Sankranti instants within ±5 min of sunset, found by sweeping 2020-2040 for
#: Chennai and Tiruppur. Only these two land that close in 21 years, so they
#: are the entire population of the edge the ruling asked to cover — the Tamil
#: month start is decided by a strict sankranti < sunset comparison
#: (tamil_calendar.month_start_date_for_sankranti), so a 3.5 min shift in
#: sunset can move a month boundary by a full day.
#:
#: (label, sankranti date, lat, lon, tz, expected month start under the ruled
#:  convention, expected month start under the retired variant)
SANKRANTI_NEAR_SUNSET_CASES: tuple[tuple[str, date, float, float, str, date, date], ...] = (
    # Sankranti 18:11:03, apparent sunset 18:14:06, geometric sunset 18:10:23.
    # The convention change FLIPS the month start by a day: 3 min before
    # sunset under the ruled convention, 40 s after it under the retired one.
    ("Chennai 2040-02-13 (flips)", date(2040, 2, 13), 13.0827, 80.2707, "Asia/Kolkata", date(2040, 2, 13), date(2040, 2, 14)),
    # Sankranti 18:36:44 vs apparent sunset 18:36:06 — 38 seconds apart, the
    # tightest sankranti/sunset coincidence in the 21-year sweep. Lands after
    # sunset under BOTH conventions, so the month start agrees; pinned because
    # a sub-minute margin is where a future ephemeris or atmospheric-parameter
    # change would first show up.
    ("Tiruppur 2028-05-14 (38s margin)", date(2028, 5, 14), 11.1085, 77.3411, "Asia/Kolkata", date(2028, 5, 15), date(2028, 5, 15)),
)


@pytest.mark.parametrize(
    "label,day,lat,lon,tz,expected_start,geometric_start",
    SANKRANTI_NEAR_SUNSET_CASES,
    ids=[row[0] for row in SANKRANTI_NEAR_SUNSET_CASES],
)
def test_sankranti_within_five_minutes_of_sunset(
    label: str, day: date, lat: float, lon: float, tz: str, expected_start: date, geometric_start: date
) -> None:
    """The sunset cutoff decides which civil day a Tamil month opens on, so the
    convention change can move a month boundary — and with it Puthandu and
    every month-relative label — by a whole day."""
    zone = ZoneInfo(tz)
    probe = utc_datetime_to_julian_day(
        datetime(day.year, day.month, day.day, 23, tzinfo=zone).astimezone(UTC)
    )
    rasi = _sun_rasi_index_at_jd(probe)
    sankranti_jd = find_sankranti_jd(rasi, probe)

    jd_midnight = utc_datetime_to_julian_day(
        datetime(day.year, day.month, day.day, tzinfo=zone).astimezone(UTC)
    )
    apparent_sunset = calculate_rise_transit_jd(jd_midnight, lat, lon, rise=False)
    geometric_sunset = calculate_rise_transit_jd(
        jd_midnight, lat, lon, rise=False, convention=SunriseConvention.GEOMETRIC_DISC_CENTER
    )

    # The case only tests what it claims to if the sankranti really is inside
    # the ±5 min window. Assert the premise, so a shifted boundary reports
    # "this case stopped being an edge case" rather than passing vacuously.
    offset_min = abs((sankranti_jd - apparent_sunset) * 1440.0)
    assert offset_min <= 5.0, f"{label}: sankranti is {offset_min:.1f} min from sunset — no longer a boundary case"

    assert month_start_date_for_sankranti(sankranti_jd, zone, lat, lon) == expected_start, (
        f"{label}: month start under the ruled convention"
    )

    # Recompute the same comparison against the retired variant's sunset to
    # document whether this date is one the ruling actually moved.
    would_be = day if sankranti_jd < geometric_sunset else date.fromordinal(day.toordinal() + 1)
    assert would_be == geometric_start, f"{label}: month start under the retired variant"


# ---------------------------------------------------------------------------
# Tier 4 — printed-publisher parity. STILL OPEN, by the owner's ruling.
# ---------------------------------------------------------------------------
# "Printed Tamil Thirukanitha Panchangam parity remains a separate validation
# task. Validate representative dates against actual Vasan/Manimekalai/Arcot
# or other selected printed editions before claiming publisher parity."
# — owner ruling, 2026-09-29.
#
# Do NOT fill these from a website, from this repo's own output, or from
# another calculator; tiers 1 and 2 already cover those and are labelled as
# such. Only a printed edition closes this, with a page citation in `source`.
PRINTED_PANCHANGAM_CASES: tuple[ReferenceCase, ...] = (
    ReferenceCase("Chennai — Jan", date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Mar equinox", date(2026, 3, 20), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Jun solstice", date(2026, 6, 21), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Sep equinox", date(2026, 9, 22), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Oct", date(2026, 10, 10), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Dec solstice", date(2026, 12, 21), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
)


@pytest.mark.parametrize("case", PRINTED_PANCHANGAM_CASES, ids=[c.label for c in PRINTED_PANCHANGAM_CASES])
def test_sunrise_matches_printed_panchangam_reference(case: ReferenceCase) -> None:
    if case.expected_sunrise is None:
        pytest.skip(
            f"{case.label}: printed-publisher parity is a separate open task per the "
            "2026-09-29 ruling — needs a Vasan/Manimekalai/Arcot edition with a page citation. "
            "Tiers 1-3 in this file do NOT close it."
        )
    snapshot = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    _assert_within(snapshot.sunrise, case.expected_sunrise, case, "sunrise")

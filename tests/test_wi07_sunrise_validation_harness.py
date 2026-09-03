"""WI-07 (Hindu sunrise, Doctrine §1) validation harness.

Status: **code-complete, validation pending** — do not mark WI-07 or
Doctrine §1's launch-gate checklist item as closed until the TODO reference
slots below are filled with real printed-panchangam values and this file's
skips turn into real assertions. Fabricating reference numbers here would be
worse than leaving them open; see docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md
WI-07 and the project's own golden-validation rule (domain calc bugs are
silent — every fix needs a concrete-input assertion, not an invented one).

What this file DOES assert now, without external data: the structural
invariants of the Hindu-sunrise switch (SE_BIT_HINDU_RISING) — sunrise moved
later and sunset moved earlier versus the pre-WI-07 refracted/upper-limb
values, by a plausible few-minute band, symmetric in direction around solar
noon. Those numbers are independently reproducible from this repo's own
ephemeris, so they're safe to lock.

What it does NOT assert: agreement with a printed panchangam. That needs a
human to supply reference values from >=2 sources (e.g. Thirukanitham +
Manimekalai or Arcot) across >=6 dates x 2 locations (Chennai + a
northern-latitude diaspora city), per Doctrine §1's verification note.

Second tier (2026-07-16): COMPUTATIONAL_CROSSCHECK_CASES below asserts
against sunrise/Rahu-Kalam values computed independently of this repo's
runtime path (Swiss Ephemeris disc-center/no-refraction cross-checked
against NOAA/Meeus analytic solar equations, geometric zenith=90 deg,
agreeing to <=2s). This is a stronger regression net than the structural
band checks above, but it is explicitly NOT the printed-panchangam gate:
both legs compute pure geometry from the same "Hindu sunrise" definition
this repo uses, so agreement confirms the geometry is coded correctly, not
that it matches what a published Tamil panchangam prints (which can carry
regional/traditional corrections a formula won't reproduce). Doctrine §1's
launch gate stays open until REFERENCE_CASES above is filled from printed
sources.

Third tier (2026-07-16): DRIKPANCHANG_REFRACTED_CASES below is sunrise data
pulled live from drikpanchang.com for the same 12 date/location cases. This
is NOT a printed source either — it's another live calculator, same
category problem as the tier above, just a different codebase/team. It was
checked and rejected as a stand-in for the printed-panchangam gate: every
one of the 12 cases shows DrikPanchang's sunrise 3-6 minutes earlier than
this repo's, a consistent one-directional offset (not scatter), which is
the signature of DrikPanchang using standard refracted-upper-limb sunrise
rather than the Hindu disc-center/no-refraction convention this repo
deliberately switched to (WI-07's whole point). Because the two sides
assert different sunrise definitions, the only thing safe to check is the
same directional/band relationship as the pre-existing structural tests
above (test_hindu_sunrise_moves_later_than_old_refracted_definition), not
an exact-value match — an exact-match assertion would fail on a correct
implementation and pass on a subtly broken one that happened to drift
toward the refracted value.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime

import pytest

from app.calculations.panchangam import calculate_daily_panchangam


@dataclass(frozen=True)
class ReferenceCase:
    label: str
    day: date
    lat: float
    lon: float
    tz: str
    # TODO (OQ / WI-07 follow-up): fill in from a printed panchangam. Format
    # "HH:MM" local time. Leave None to keep this case skipped rather than
    # asserting a guessed value.
    expected_sunrise: str | None
    expected_rahu_kalam_start: str | None
    source: str | None  # e.g. "Thirukanitham Panchangam 2026, p.NN"


# >=6 dates spread across the year x 2 locations (Chennai + a
# northern-latitude diaspora city) per Doctrine §1's verification note.
# Dates chosen to spread across solstices/equinoxes where day-length effects
# are most visible. All reference fields are TODO — see class docstring.
REFERENCE_CASES: tuple[ReferenceCase, ...] = (
    ReferenceCase("Chennai — Jan", date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Mar equinox", date(2026, 3, 20), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Jun solstice", date(2026, 6, 21), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Sep equinox", date(2026, 9, 22), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Dec solstice", date(2026, 12, 21), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    ReferenceCase("Chennai — Oct", date(2026, 10, 10), 13.0827, 80.2707, "Asia/Kolkata", None, None, None),
    # Northern-latitude diaspora city — Toronto (43.65N, 79.38W). Day-length
    # swing is much larger here, a good stress test for the Hindu-rising fix.
    ReferenceCase("Toronto — Jan", date(2026, 1, 15), 43.6532, -79.3832, "America/Toronto", None, None, None),
    ReferenceCase("Toronto — Mar equinox", date(2026, 3, 20), 43.6532, -79.3832, "America/Toronto", None, None, None),
    ReferenceCase("Toronto — Jun solstice", date(2026, 6, 21), 43.6532, -79.3832, "America/Toronto", None, None, None),
    ReferenceCase("Toronto — Sep equinox", date(2026, 9, 22), 43.6532, -79.3832, "America/Toronto", None, None, None),
    ReferenceCase("Toronto — Dec solstice", date(2026, 12, 21), 43.6532, -79.3832, "America/Toronto", None, None, None),
    ReferenceCase("Toronto — Oct", date(2026, 10, 10), 43.6532, -79.3832, "America/Toronto", None, None, None),
)


@pytest.mark.parametrize("case", REFERENCE_CASES, ids=[c.label for c in REFERENCE_CASES])
def test_sunrise_matches_printed_panchangam_reference(case: ReferenceCase) -> None:
    if case.expected_sunrise is None:
        pytest.skip(
            f"{case.label}: no printed-panchangam reference value on file yet "
            "(WI-07 validation pending — see docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md)"
        )
    snap = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    expected = datetime.strptime(f"{case.day} {case.expected_sunrise}", "%Y-%m-%d %H:%M")
    actual_naive = snap.sunrise.replace(tzinfo=None)
    assert abs((actual_naive - expected).total_seconds()) < 120, (
        f"{case.label}: sunrise {actual_naive} vs printed reference {expected} ({case.source})"
    )


# Computational cross-check tier (2026-07-16) — see module docstring "Second
# tier" note. NOT the printed-panchangam gate; a regression net only.
_CROSSCHECK_SOURCE = "Computed: SwissEph(disc-center,no-refr) x NOAA-Meeus cross-check, agree <=2s, 2026-07-16"

COMPUTATIONAL_CROSSCHECK_CASES: tuple[ReferenceCase, ...] = (
    ReferenceCase("Chennai — Jan", date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata", "06:39", "13:43", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Mar equinox", date(2026, 3, 20), 13.0827, 80.2707, "Asia/Kolkata", "06:17", "10:47", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Jun solstice", date(2026, 6, 21), 13.0827, 80.2707, "Asia/Kolkata", "05:48", "16:58", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Sep equinox", date(2026, 9, 22), 13.0827, 80.2707, "Asia/Kolkata", "06:01", "15:02", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Oct", date(2026, 10, 10), 13.0827, 80.2707, "Asia/Kolkata", "06:02", "08:59", _CROSSCHECK_SOURCE),
    ReferenceCase("Chennai — Dec solstice", date(2026, 12, 21), 13.0827, 80.2707, "Asia/Kolkata", "06:30", "07:54", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Jan", date(2026, 1, 15), 43.6532, -79.3832, "America/Toronto", "07:53", "13:36", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Mar equinox", date(2026, 3, 20), 43.6532, -79.3832, "America/Toronto", "07:25", "11:55", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Jun solstice", date(2026, 6, 21), 43.6532, -79.3832, "America/Toronto", "05:42", "19:03", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Sep equinox", date(2026, 9, 22), 43.6532, -79.3832, "America/Toronto", "07:09", "16:10", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Oct", date(2026, 10, 10), 43.6532, -79.3832, "America/Toronto", "07:30", "10:17", _CROSSCHECK_SOURCE),
    ReferenceCase("Toronto — Dec solstice", date(2026, 12, 21), 43.6532, -79.3832, "America/Toronto", "07:53", "08:59", _CROSSCHECK_SOURCE),
)


@pytest.mark.parametrize("case", COMPUTATIONAL_CROSSCHECK_CASES, ids=[c.label for c in COMPUTATIONAL_CROSSCHECK_CASES])
def test_sunrise_matches_computational_crosscheck(case: ReferenceCase) -> None:
    snap = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    expected = datetime.strptime(f"{case.day} {case.expected_sunrise}", "%Y-%m-%d %H:%M")
    actual_naive = snap.sunrise.replace(tzinfo=None)
    assert abs((actual_naive - expected).total_seconds()) < 120, (
        f"{case.label}: sunrise {actual_naive} vs computed cross-check {expected} ({case.source})"
    )


@pytest.mark.parametrize("case", COMPUTATIONAL_CROSSCHECK_CASES, ids=[c.label for c in COMPUTATIONAL_CROSSCHECK_CASES])
def test_rahu_kalam_matches_computational_crosscheck(case: ReferenceCase) -> None:
    snap = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    expected = datetime.strptime(f"{case.day} {case.expected_rahu_kalam_start}", "%Y-%m-%d %H:%M")
    actual_naive = snap.rahu_kalam.start.replace(tzinfo=None)
    assert abs((actual_naive - expected).total_seconds()) < 120, (
        f"{case.label}: Rahu Kalam start {actual_naive} vs computed cross-check {expected} ({case.source})"
    )


def test_hindu_sunrise_moves_later_than_old_refracted_definition() -> None:
    """Structural check, no external reference needed: disc-center + no
    refraction must push sunrise later (the geometric center crosses the
    horizon after the refracted upper limb already appeared to)."""
    snap = calculate_daily_panchangam(date(2026, 5, 21), 9.9252, 78.1198, "Asia/Kolkata")
    # Pre-WI-07 pinned value for this exact case (tests/test_panchangam.py) was
    # 05:53 local; Hindu sunrise must land measurably later, in a plausible
    # single-digit-minutes band (not tens of minutes — that would indicate a
    # bug, e.g. a duplicated flag or wrong rsmi value).
    old_refracted_sunrise = datetime(2026, 5, 21, 5, 53)
    actual = snap.sunrise.replace(tzinfo=None)
    delta_minutes = (actual - old_refracted_sunrise).total_seconds() / 60.0
    assert 1.0 < delta_minutes < 15.0, f"sunrise shift {delta_minutes:.1f} min outside the plausible band"


def test_hindu_sunset_moves_earlier_than_old_refracted_definition() -> None:
    """Symmetric counterpart: sunset should move earlier by a similar
    magnitude (day length shrinks toward the true geometric event)."""
    snap = calculate_daily_panchangam(date(2026, 5, 21), 9.9252, 78.1198, "Asia/Kolkata")
    old_refracted_sunset = datetime(2026, 5, 21, 18, 33)
    actual = snap.sunset.replace(tzinfo=None)
    delta_minutes = (old_refracted_sunset - actual).total_seconds() / 60.0
    assert 1.0 < delta_minutes < 15.0, f"sunset shift {delta_minutes:.1f} min outside the plausible band"


# DrikPanchang directional cross-check tier (2026-07-16) — see module
# docstring "Third tier" note. NOT the printed-panchangam gate, and NOT an
# exact-value check (different sunrise convention). Values pulled live from
# drikpanchang.com/panchang/day-panchang.html on 2026-07-16 (Chennai
# geoname-id=1264527, Toronto geoname-id=6167865) — standard refracted
# upper-limb sunrise, not Hindu disc-center/no-refraction.
_DRIKPANCHANG_SOURCE = "drikpanchang.com day-panchang, fetched 2026-07-16 (refracted upper-limb convention)"

DRIKPANCHANG_REFRACTED_CASES: tuple[ReferenceCase, ...] = (
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


@pytest.mark.parametrize("case", DRIKPANCHANG_REFRACTED_CASES, ids=[c.label for c in DRIKPANCHANG_REFRACTED_CASES])
def test_sunrise_later_than_drikpanchang_refracted_reference(case: ReferenceCase) -> None:
    """Directional band check only (see module docstring "Third tier"):
    DrikPanchang's refracted-upper-limb sunrise must fall measurably before
    this repo's Hindu disc-center sunrise, in the same plausible few-minute
    band as the pinned structural tests above — not an exact match, since
    the two sides use different sunrise conventions by design."""
    snap = calculate_daily_panchangam(case.day, case.lat, case.lon, case.tz)
    drikpanchang_refracted = datetime.strptime(f"{case.day} {case.expected_sunrise}", "%Y-%m-%d %H:%M")
    actual = snap.sunrise.replace(tzinfo=None)
    delta_minutes = (actual - drikpanchang_refracted).total_seconds() / 60.0
    assert 1.0 < delta_minutes < 15.0, (
        f"{case.label}: sunrise shift {delta_minutes:.1f} min vs DrikPanchang outside the plausible band "
        f"({case.source})"
    )

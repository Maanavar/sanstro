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

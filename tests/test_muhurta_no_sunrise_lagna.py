"""FSA-01: a muhurta day is never scored on the sign rising at sunrise.

At sunrise the rising point is the Sun's own longitude, so the "sunrise lagna"
is the Sun's rasi — the Tamil solar month. Measured: equal on 350 of 365 days of
2026 in Chennai. Scored as a marriage lagna it docked every Thai and Chithirai
date 10 points and credited Purattasi as "among the best marriage lagnas" —
Tamil custom upside down. The signed-in picker had switched it off; the public
`/muhurta` tool had not, so the two ranked the same date differently.

Removed by owner ruling 2026-10-21 (docs/FULL_SYSTEM_AUDIT_2026-10-21.md). The
lagna is judged at the elected moment by `lagna_sign_factor_at_window`.

The property tested is the definition, not a symptom: a day's score must not
move when only its sunrise lagna moves.

BLIND SPOT: this pins the day engine, which both routes call. It does not prove
the public route judges the lagna at its returned slot — it does not (FSA-10).
"""
from __future__ import annotations

from dataclasses import replace
from datetime import date

import pytest

from app.calculations.muhurta_engine import SOURCED_ACTIVITIES, score_day
from app.calculations.panchangam import compute_daily_panchangam

pytestmark = pytest.mark.no_db

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"

# Mid-month in each Tamil solar month of 2026-27, so every sunrise lagna occurs.
_DAYS = [date(2026 if m >= 4 else 2027, m, 28) for m in range(1, 13)]
_ACTIVITIES = sorted(set(SOURCED_ACTIVITIES) | {"MARRIAGE"})


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [compute_daily_panchangam(d, LATITUDE, LONGITUDE, TIMEZONE) for d in _DAYS]


def test_the_sweep_covers_every_sunrise_lagna(snapshots) -> None:
    """Guard the guard: the invariance below means nothing over one sign."""
    assert {s.lagna_rasi_number for s in snapshots} == set(range(1, 13))


@pytest.mark.parametrize("activity", _ACTIVITIES)
def test_no_day_factor_is_a_sunrise_lagna(snapshots, activity: str) -> None:
    for snap in snapshots:
        names = {f.factor for f in score_day(snap, activity).factors}
        assert "LAGNA_SIGN_AT_SUNRISE" not in names


@pytest.mark.parametrize("activity", _ACTIVITIES)
def test_day_score_ignores_the_sunrise_lagna(snapshots, activity: str) -> None:
    for snap in snapshots:
        base = score_day(snap, activity)
        for other in range(1, 13):
            moved = score_day(replace(snap, lagna_rasi_number=other), activity)
            assert moved.score == base.score, (
                f"{activity} {snap.date_local}: sunrise lagna {snap.lagna_rasi_number} -> {other} "
                f"moved the day score {base.score} -> {moved.score}"
            )

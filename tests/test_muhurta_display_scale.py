"""The 0-100 display mapping for muhurta day-scores.

`score_day` is unclamped on purpose — callers add dasha and hora layers on top
of it — so every surface that shows a human a number has to map it first. The
mapping used to be a bare `min(100, raw)`, and that was a real defect rather
than a cosmetic one: measured over a 90-day Chennai sweep of all sourced
activities, 29.3% of usable day-scores were at or above 100 raw, and for all 22
activities the entire top five clamped to an identical `100`. A ranked list
that shows one number for its whole podium has stopped ranking.

These tests pin the properties that fix depends on:

* the mapping is order-preserving, so it can never change which day wins;
* below the knee it is the identity, so no unrelated colour threshold moves;
* the ceiling is a fixed constant, not a value read off the observed maximum,
  because a data-derived ceiling would drift every time a weight changed;
* and, end to end over a real sweep, two days that display the same number are
  days that genuinely scored the same.

The last one is the regression: it fails on a bare clamp.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import (
    _DISPLAY_CEIL,
    _DISPLAY_KNEE,
    SOURCED_ACTIVITIES,
    Subject,
    display_score,
    score_day,
)
from app.calculations.panchangam import calculate_daily_panchangam

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 45

# A clearly-synthetic subject — no real birth data, per repo policy.
SYNTHETIC = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5, label="Test Subject")

# What the surfaces round to. The picker shows one decimal deliberately: at
# integer precision the compressed band recovers only 66 of 110 distinct
# top-five values across the sourced activities, against 93 of 110 at 1dp.
DISPLAY_PRECISION = 1

# Two raw scores closer together than this cannot be told apart at
# `DISPLAY_PRECISION` once the curve has compressed them, so a tie between them
# is a rounding artifact rather than a claim that the days scored alike. Every
# weight in the engine is currently an integer, so in practice no such pair
# occurs; this tolerance only stops the honest-ties test below from turning into
# a tripwire on the day someone introduces a fractional weight.
_UNRESOLVABLE_RAW_GAP = (
    0.5 * 10**-DISPLAY_PRECISION * (_DISPLAY_CEIL - _DISPLAY_KNEE) / (100.0 - _DISPLAY_KNEE)
)

pytestmark = pytest.mark.no_db


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


@pytest.fixture(scope="module")
def top_fives(snapshots) -> dict[str, list[float]]:
    """The five best raw scores per sourced activity, for one subject."""
    out: dict[str, list[float]] = {}
    for activity in sorted(SOURCED_ACTIVITIES):
        usable = sorted(
            (
                day.score
                for day in (score_day(snap, activity, SYNTHETIC) for snap in snapshots)
                if not day.vetoed
            ),
            reverse=True,
        )
        assert len(usable) >= 5, f"{activity} yielded only {len(usable)} usable days in the sweep"
        out[activity] = usable[:5]
    return out


# ── the curve itself ────────────────────────────────────────────────────────


def test_below_the_knee_the_mapping_is_the_identity() -> None:
    """Every value the old code already displayed correctly must not move.

    This is what lets `SCORE_COLOR` (75/55) and the shared `scoreTone` (65/45)
    keep their exact current meaning without being touched.
    """
    for raw in (0.0, 1.0, 44.9, 45.0, 55.0, 64.9, 65.0, 75.0, _DISPLAY_KNEE):
        assert display_score(raw) == pytest.approx(raw)


def test_a_negative_score_displays_as_zero_not_as_a_negative_number() -> None:
    # Vetoed and near-vetoed days really do go below zero — the sweep bottoms
    # out around -9 — and no surface should print a negative score.
    assert display_score(-9.0) == 0.0
    assert display_score(-0.1) == 0.0


def test_the_ceiling_saturates_and_is_reached_only_by_the_fixed_constant() -> None:
    assert display_score(_DISPLAY_CEIL) == 100.0
    assert display_score(_DISPLAY_CEIL + 500.0) == 100.0
    # The highest score observed in a real sweep is 161. It must land *below*
    # 100, or the ceiling has been pulled down onto the data and will drift.
    assert display_score(161.0) < 100.0


def test_the_mapping_is_monotonic_across_the_whole_observed_range() -> None:
    """Order-preserving at display precision — the fix must never reorder days."""
    previous = -1.0
    raw = -20.0
    while raw <= 220.0:
        shown = round(display_score(raw), DISPLAY_PRECISION)
        assert shown >= previous, f"display_score dipped at raw={raw}"
        previous = shown
        raw = round(raw + 0.1, 1)


def test_the_mapping_separates_scores_a_bare_clamp_would_fuse() -> None:
    """The defect, stated as an inequality.

    These are TONSURE's five best raw scores from a real Chennai sweep.
    """
    tonsure_top_five = [161.0, 156.0, 151.0, 150.0, 148.0]
    clamped = [min(100.0, raw) for raw in tonsure_top_five]
    shown = [round(display_score(raw), DISPLAY_PRECISION) for raw in tonsure_top_five]

    assert len(set(clamped)) == 1, "the old behaviour was one value for the whole podium"
    assert len(set(shown)) == len(tonsure_top_five)
    assert shown == sorted(shown, reverse=True)


# ── end to end, over a real sweep ───────────────────────────────────────────


def test_no_activitys_podium_collapses_into_a_single_number(top_fives) -> None:
    """Fails on the old bare clamp, for every one of the sourced activities."""
    collapsed = [
        activity
        for activity, raws in top_fives.items()
        if len({round(display_score(raw), DISPLAY_PRECISION) for raw in raws}) == 1
    ]
    assert not collapsed, f"top five shows one identical score for: {collapsed}"


def test_every_displayed_tie_is_a_tie_in_the_raw_score(top_fives) -> None:
    """A repeated number must mean the days really scored alike.

    Under the old clamp this failed for all 22 activities: days 13 raw points
    apart were shown as equally good.
    """
    dishonest: list[str] = []
    for activity, raws in top_fives.items():
        shown = [round(display_score(raw), DISPLAY_PRECISION) for raw in raws]
        for i in range(len(raws)):
            for j in range(i + 1, len(raws)):
                if shown[i] == shown[j] and abs(raws[i] - raws[j]) >= _UNRESOLVABLE_RAW_GAP:
                    dishonest.append(f"{activity}: raw {raws[i]} and {raws[j]} both show {shown[i]}")
    assert not dishonest, "displayed ties that are not real ties: " + "; ".join(dishonest)


def test_at_least_one_activity_ranks_its_top_five_strictly(top_fives) -> None:
    """The positive form: somewhere in the picker, five days rank five ways."""
    strict = [
        activity
        for activity, raws in top_fives.items()
        if all(
            round(display_score(a), DISPLAY_PRECISION) > round(display_score(b), DISPLAY_PRECISION)
            for a, b in zip(raws, raws[1:], strict=False)  # deliberately offset by one
        )
    ]
    assert strict, "no activity produced five distinct, strictly ordered display scores"


def test_the_display_mapping_never_changes_which_day_wins(snapshots) -> None:
    """A presentation fix that reordered anything would be a scoring change."""
    for activity in sorted(SOURCED_ACTIVITIES):
        scored = [
            (snap.date_local, day.score)
            for snap, day in ((s, score_day(s, activity, SYNTHETIC)) for s in snapshots)
            if not day.vetoed
        ]
        by_raw = [d for d, _ in sorted(scored, key=lambda x: (-x[1], x[0]))]
        by_shown = [d for d, _ in sorted(scored, key=lambda x: (-display_score(x[1]), x[0]))]
        assert by_raw == by_shown, f"{activity} was reordered by the display mapping"

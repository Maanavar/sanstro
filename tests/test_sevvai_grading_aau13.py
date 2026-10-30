"""AAU-13 (ruled 2026-10-29): Sevvai is declared from the Lagna and graded by
the Moon and Venus.

The 1st house stays in the set (it is the first word of the base verse). What
made 91% of charts "have" Sevvai was OR-ing three reference points; the grading
table is Vinaadi product policy, since no verse gives a combination rule:

    Lagna only               mild       WEAK
    Lagna + Moon or Venus    confirmed  PARTIAL
    Lagna + Moon + Venus     severe     STRONG
    Moon/Venus, no Lagna     noted, not declared

Synthetic only: real ephemeris positions at seeded random instants, random
lagna. No person, no birth data.
"""
from __future__ import annotations

import random
from collections import Counter

import pytest

from app.calculations._yoga_dosham import detect_sevvai_dosham
from app.calculations._yoga_helpers import TAMIL_SEVVAI_HOUSES
from app.calculations.ephemeris import calculate_sidereal_planets

pytestmark = pytest.mark.no_db

_REFS = ("from_lagna", "from_moon", "from_venus")


def _population(n: int = 600, seed: int = 1013) -> list[tuple[dict[str, int], int]]:
    rng = random.Random(seed)
    out = []
    for _ in range(n):
        snap = calculate_sidereal_planets(rng.uniform(2_436_934.5, 2_455_197.5))  # 1960..2010
        out.append(({g: b.rasi for g, b in snap.bodies.items()}, rng.randint(1, 12)))
    return out


_POP = _population()


def test_the_first_house_stays_in_the_set() -> None:
    """लग्ने व्यये च पाताले जामित्रे चाष्टमे कुजे — the 1st is the verse's first word."""
    assert TAMIL_SEVVAI_HOUSES == {1, 2, 4, 7, 8, 12}


def test_no_sevvai_is_declared_without_a_lagna_placement() -> None:
    noted = 0
    for planets, lagna in _POP:
        result = detect_sevvai_dosham(planets, lagna)
        refs = {r for r in _REFS if r in result.conditions_met}
        if result.is_present:
            assert "from_lagna" in refs, refs
        elif refs and "from_lagna" not in refs:
            noted += 1
            assert result.context_notes[:1] == ("sevvai_not_declared_without_lagna",)
            assert result.cancellation_factors == []
    assert noted, "the population never reached a Moon/Venus-only placement"


def test_the_formation_grade_follows_the_reference_count() -> None:
    """Before aggravations, the formation grade is the tier. Aggravations
    (combust Mars, Mars with Saturn or Rahu) may only lift it."""
    tiers = {1: "WEAK", 2: "PARTIAL", 3: "STRONG"}
    order = ("WEAK", "PARTIAL", "STRONG")
    seen = Counter()
    for planets, lagna in _POP:
        result = detect_sevvai_dosham(planets, lagna)
        if not result.is_present:
            continue
        count = sum(r in result.conditions_met for r in _REFS)
        seen[count] += 1
        aggravated = {"mars_combust", "mars_joined_saturn_or_rahu"} & set(result.conditions_met)
        if not aggravated:
            assert result.formation_strength == tiers[count], (count, result.formation_strength)
        else:
            assert order.index(result.formation_strength) >= order.index(tiers[count])
    assert set(seen) == {1, 2, 3}, seen


def test_prevalence_print_and_ceiling() -> None:
    """A smoke test against practitioner experience, never a tuning target.
    The Lagna alone hits six houses of twelve, so declared Sevvai should sit
    near half the population; the old three-way OR gave ~91%. Run with -s to
    see the shares."""
    states = Counter()
    for planets, lagna in _POP:
        result = detect_sevvai_dosham(planets, lagna)
        states["present" if result.is_present else "absent"] += 1
        if result.is_present:
            states[f"formation_{result.formation_strength}"] += 1
            states[f"shown_{result.strength}"] += 1
    n = len(_POP)
    print({k: f"{100 * v / n:.1f}%" for k, v in sorted(states.items())})
    assert states["present"] / n < 0.65

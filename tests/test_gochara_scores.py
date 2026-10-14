"""F-SCO-01 / F-SCO-02 — one transit table, and it agrees with the grade.

From the ground-truth audit of 2026-10-13. Three hand-typed copies of the
per-planet transit house score disagreed with each other and with classical
gochara, so the Today score could rise while the Transits card said the same
planet needed care.
"""
from __future__ import annotations

import pytest

from app.calculations.gochara_grade import (
    GURU_SUPPORTIVE_FROM_MOON,
    SANI_SUPPORTIVE_FROM_MOON,
    gochara_grade,
)
from app.calculations.gochara_scores import (
    GOCHARA_FAVOURABLE_FROM_MOON,
    GOCHARA_HOUSE_SCORE,
    NEUTRAL,
    gochara_house_score,
    is_favourable_gochara,
)

pytestmark = pytest.mark.no_db


# ── F-SCO-02: the three copies are now one object ──────────────────────────

def test_all_three_surfaces_read_the_same_table() -> None:
    """Identity, not equality. Equal tables drift apart one cell at a time —
    which is exactly what happened (Jupiter 7th 68 vs 74, Moon 4th 48 vs 65,
    Rahu 6th 44 vs 58, Ketu 12th 38 vs 62). The same object cannot."""
    from app.services._dg_scoring import TRANSIT_BASE_SCORE
    from app.services.life_areas_service import _HOUSE_SCORE_TABLE
    from app.services.whatif_service import _PLANET_HOUSE_SCORE

    assert TRANSIT_BASE_SCORE is GOCHARA_HOUSE_SCORE
    assert _HOUSE_SCORE_TABLE is GOCHARA_HOUSE_SCORE
    assert _PLANET_HOUSE_SCORE is GOCHARA_HOUSE_SCORE


def test_the_table_is_immutable() -> None:
    """One shared object means a stray write from any surface would reach all
    three; the mapping is read-only so it cannot."""
    with pytest.raises(TypeError):
        GOCHARA_HOUSE_SCORE["JUPITER"][5] = 99  # type: ignore[index]


# ── F-SCO-01: the scores follow the classical sets ─────────────────────────

@pytest.mark.parametrize("planet", sorted(GOCHARA_FAVOURABLE_FROM_MOON))
def test_every_favourable_house_outscores_every_adverse_one(planet: str) -> None:
    table = GOCHARA_HOUSE_SCORE[planet]
    favourable = [table[h] for h in range(1, 13) if is_favourable_gochara(planet, h)]
    adverse = [table[h] for h in range(1, 13) if not is_favourable_gochara(planet, h)]
    assert favourable, f"{planet} has no favourable house"
    assert adverse, f"{planet} has no adverse house"
    assert min(favourable) > max(adverse)


@pytest.mark.parametrize("planet", sorted(GOCHARA_FAVOURABLE_FROM_MOON))
def test_favourable_is_above_neutral_and_adverse_below(planet: str) -> None:
    """50 is neutral on every consuming surface (`life_areas_service`
    subtracts it to get a delta), so the sign of the delta must match the
    doctrine."""
    for house in range(1, 13):
        score = gochara_house_score(planet, house)
        if is_favourable_gochara(planet, house):
            assert score > NEUTRAL
        else:
            assert score < NEUTRAL


def test_the_specific_inversions_the_audit_named() -> None:
    """Each of these was wrong in the old table, in the direction named."""
    # Saturn 10th is Kandaka — adverse — and scored the same as Saturn 3rd.
    assert gochara_house_score("SATURN", 10) < gochara_house_score("SATURN", 3)
    # Rahu and Ketu are at their best in 3/6/11; all six cells were at or
    # below neutral.
    for node in ("RAHU", "KETU"):
        for house in (3, 6, 11):
            assert gochara_house_score(node, house) > NEUTRAL
    # The Moon is good in the 6th and 10th, not favourable in the 5th or 9th.
    assert gochara_house_score("MOON", 6) > gochara_house_score("MOON", 5)
    assert gochara_house_score("MOON", 10) > gochara_house_score("MOON", 9)


def test_mercury_and_venus_keep_their_favourable_eighth() -> None:
    """The 8th is the heaviest house for most grahas, which is why the old
    tables scored it worst for all of them. Classically Mercury and Venus are
    favourable there, and flattening that is the error this module removes."""
    assert gochara_house_score("MERCURY", 8) > NEUTRAL
    assert gochara_house_score("VENUS", 8) > NEUTRAL
    assert gochara_house_score("JUPITER", 8) < NEUTRAL
    assert gochara_house_score("SATURN", 8) < NEUTRAL


def test_the_eleventh_is_the_best_house_for_every_graha() -> None:
    for planet, table in GOCHARA_HOUSE_SCORE.items():
        assert table[11] == max(table.values()), planet


# ── The two modules that both encode gochara must agree ────────────────────

@pytest.mark.parametrize("planet", ["JUPITER", "SATURN"])
def test_the_score_and_the_displayed_grade_cannot_contradict(planet: str) -> None:
    """The reader-visible failure: a score that rose while the Transits card
    for the same planet said "needs care". `gochara_grade` drives that card,
    so a SUPPORTIVE grade must never carry a below-neutral score, and vice
    versa. Jupiter's MIXED band is its own thing and is skipped."""
    for house in range(1, 13):
        grade = gochara_grade(planet, house)
        score = gochara_house_score(planet, house)
        if grade == "SUPPORTIVE":
            assert score > NEUTRAL, f"{planet} h{house}: SUPPORTIVE but scored {score}"
        elif grade == "NEEDS_CARE":
            assert score < NEUTRAL, f"{planet} h{house}: NEEDS_CARE but scored {score}"


def test_the_two_modules_list_the_same_favourable_houses() -> None:
    """Same doctrine, written twice — `gochara_grade` for the card and
    `gochara_scores` for the number. Asserted directly rather than trusted."""
    assert GOCHARA_FAVOURABLE_FROM_MOON["JUPITER"] == GURU_SUPPORTIVE_FROM_MOON
    assert GOCHARA_FAVOURABLE_FROM_MOON["SATURN"] == SANI_SUPPORTIVE_FROM_MOON


def test_an_ungraded_planet_moves_nothing() -> None:
    """A planet with no gochara table must return neutral, not a guess —
    neutral is the only value that cannot move a score in either direction."""
    assert gochara_house_score("URANUS", 5) == NEUTRAL
    assert gochara_house_score("JUPITER", 13) == NEUTRAL

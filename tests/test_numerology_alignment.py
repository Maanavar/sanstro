"""Fortune Alignment tests (NUM-30..33) — the numerology/jyotisha bridge.

The doctrine tests here are the point of the whole module. If
``test_saturn_as_yogakaraka_is_never_a_reason_to_change_a_name`` ever fails, the
product has become the thing it was built not to be.
"""
from __future__ import annotations

import pytest

from app.calculations.functional_nature import FunctionalNature
from app.calculations.numerology import build_profile
from app.calculations.numerology_alignment import (
    BENEFIC_NATURES,
    AlignmentVerdict,
    align_number,
    align_profile,
    favourable_numbers_for,
    should_advise_name_change,
    verdict_from_score,
)
from app.services.numerology_content import BANNED_FEAR_TERMS

pytestmark = pytest.mark.no_db

TAMIL_RANGE = range(0x0B80, 0x0BFF + 1)

#: Lagnas where Saturn owns a kendra AND a trikona. Vrishabha: 9th+10th.
#: Thula: 4th+5th. Both make Saturn the most benefic graha in the chart.
SATURN_YOGAKARAKA_LAGNAS = (2, 7)


# ---------------------------------------------------------------------------
# Doctrine §9.1 / §9.2 — the guards that make this engine honest
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("lagna", SATURN_YOGAKARAKA_LAGNAS)
def test_saturn_as_yogakaraka_is_never_a_reason_to_change_a_name(lagna: int) -> None:
    """"8 is unlucky" is the most sold, least defensible claim in this trade.

    For Vrishabha and Thula lagna, Saturn is yogakaraka — the single most
    benefic graha in the chart. A chart-aware engine must refuse the sale.
    """
    alignment = align_number(8, lagna)
    assert alignment.functional_nature is FunctionalNature.YOGAKARAKA
    assert alignment.verdict is AlignmentVerdict.STRONGLY_ALIGNED
    assert should_advise_name_change(alignment) is False


def test_the_popular_claim_about_8_is_wrong_for_most_charts() -> None:
    """Saturn is functionally benefic in half the lagnas, and the engine
    refuses to advise a name change away from 8 in two thirds of them."""
    benefic = [lg for lg in range(1, 13) if align_number(8, lg).is_benefic_lordship]
    assert benefic == [2, 3, 6, 7, 10, 11]
    assert set(SATURN_YOGAKARAKA_LAGNAS).issubset(benefic)

    refused = [lg for lg in range(1, 13) if not should_advise_name_change(align_number(8, lg))]
    assert len(refused) == 8, "blanket '8 is unlucky' advice would be wrong here"


def test_benefic_lordship_short_circuits_before_verdict_thresholds() -> None:
    """The guard is unconditional, not a threshold effect."""
    for lagna in range(1, 13):
        for number in range(1, 10):
            alignment = align_number(number, lagna)
            if alignment.functional_nature in BENEFIC_NATURES:
                assert should_advise_name_change(alignment) is False


def test_no_change_needed_is_reachable_and_actually_fires() -> None:
    """§9.2 — an engine that can never say no is a slot machine."""
    profile = build_profile(year=1990, month=5, day=17, document_name="Zoro")
    # "Zoro" -> 23 -> root 5 (Mercury). Pick a lagna where Mercury is benefic.
    benefic_lagnas = [
        lg for lg in range(1, 13) if align_number(5, lg).is_benefic_lordship
    ]
    assert benefic_lagnas, "expected at least one lagna with Mercury benefic"
    result = align_profile(profile, benefic_lagnas[0])
    assert result.name_change_advised is False
    assert "no change is called for" in result.recommendation_en


def test_a_change_can_still_be_advised_so_the_guard_is_not_a_no_op() -> None:
    """The inverse of the above — the engine must not simply always say no."""
    advised = [
        lagna
        for lagna in range(1, 13)
        if should_advise_name_change(align_number(8, lagna))
    ]
    assert advised, "engine never advises a change — the guard has become vacuous"
    assert set(advised).isdisjoint(SATURN_YOGAKARAKA_LAGNAS)


def test_nodes_stay_neutral_without_chart_context_so_4_cannot_be_fear_sold() -> None:
    """Rahu/Ketu have no lordship. Without a node rasi map they cannot be
    scored as malefic, which structurally blocks the 4-and-7 fear trade."""
    for lagna in range(1, 13):
        for number in (4, 7):
            alignment = align_number(number, lagna)
            assert alignment.functional_nature is FunctionalNature.NEUTRAL
            assert should_advise_name_change(alignment) is False


def test_advice_to_change_carries_the_legal_consequence_warning() -> None:
    """§9.4 — name correction ships with this warning or it does not ship.

    "Zoro" scores 23 -> root 5 -> Mercury, which is a dusthana lord for Mesha
    lagna. That is a chart where the engine does advise reconsidering.
    """
    profile = build_profile(year=1990, month=5, day=17, document_name="Zoro")
    result = align_profile(profile, 1)
    assert result.name_change_advised is True
    assert "Aadhaar" in result.recommendation_en
    assert "ஆதார்" in result.recommendation_ta
    assert "astrologer" in result.recommendation_en.lower()


def test_no_recommendation_ever_omits_the_warning_when_advising() -> None:
    """Swept across every lagna, not just the one case above."""
    profile = build_profile(year=1990, month=5, day=17, document_name="Zoro")
    for lagna in range(1, 13):
        result = align_profile(profile, lagna)
        if result.name_change_advised:
            assert "Aadhaar" in result.recommendation_en, lagna


# ---------------------------------------------------------------------------
# Scoring mechanics
# ---------------------------------------------------------------------------
def test_strength_refines_but_never_dominates_lordship() -> None:
    """Bounded ±12 — the same discipline as the holistic strength synthesis."""
    for lagna in (2, 5, 7):
        base = align_number(8, lagna).score
        weakest = align_number(8, lagna, natal_strength=0).score
        strongest = align_number(8, lagna, natal_strength=100).score
        assert abs(weakest - base) <= 12
        assert abs(strongest - base) <= 12


def test_a_strong_benefic_scores_higher_and_a_strong_malefic_scores_lower() -> None:
    """Strength scales expression, not nature."""
    # Lagna 7: Saturn yogakaraka (benefic)
    assert align_number(8, 7, natal_strength=90).score > align_number(8, 7, natal_strength=10).score
    # Lagna 5: Saturn dusthana (malefic) — strength makes it harder, not easier
    assert align_number(8, 5, natal_strength=90).score < align_number(8, 5, natal_strength=10).score


def test_scores_stay_inside_0_to_100() -> None:
    for lagna in range(1, 13):
        for number in range(1, 10):
            for strength in (None, 0.0, 50.0, 100.0):
                score = align_number(number, lagna, natal_strength=strength).score
                assert 0 <= score <= 100


def test_verdict_thresholds_are_ordered() -> None:
    assert verdict_from_score(100) is AlignmentVerdict.STRONGLY_ALIGNED
    assert verdict_from_score(78) is AlignmentVerdict.STRONGLY_ALIGNED
    assert verdict_from_score(70) is AlignmentVerdict.ALIGNED
    assert verdict_from_score(50) is AlignmentVerdict.NEUTRAL
    assert verdict_from_score(35) is AlignmentVerdict.MISALIGNED
    assert verdict_from_score(0) is AlignmentVerdict.STRONGLY_MISALIGNED


@pytest.mark.parametrize(("number", "lagna"), [(0, 1), (10, 1), (5, 0), (5, 13)])
def test_out_of_range_input_raises(number: int, lagna: int) -> None:
    with pytest.raises(ValueError):
        align_number(number, lagna)


# ---------------------------------------------------------------------------
# Favourable numbers (NUM-33)
# ---------------------------------------------------------------------------
def test_favourable_numbers_rank_all_nine_chart_first() -> None:
    for lagna in range(1, 13):
        ranked = favourable_numbers_for(lagna)
        assert sorted(ranked) == list(range(1, 10))
        scores = [align_number(n, lagna).score for n in ranked]
        assert scores == sorted(scores, reverse=True)


def test_favourable_numbers_differ_by_chart() -> None:
    """If the ranking were chart-independent it would be numerology, not this."""
    assert favourable_numbers_for(2) != favourable_numbers_for(5)


def test_saturn_ranks_top_for_a_saturn_yogakaraka_chart() -> None:
    for lagna in SATURN_YOGAKARAKA_LAGNAS:
        assert favourable_numbers_for(lagna)[0] == 8


# ---------------------------------------------------------------------------
# Profile-level
# ---------------------------------------------------------------------------
def test_profile_alignment_covers_every_supplied_number() -> None:
    profile = build_profile(
        year=1990, month=5, day=17, document_name="Zoro", called_name="Test"
    )
    result = align_profile(profile, 7)
    assert result.psychic.number == profile.psychic.root
    assert result.destiny.number == profile.destiny.root
    assert result.name is not None and result.namesake is not None
    assert 0 <= result.overall_score <= 100
    assert len(result.favourable_numbers) == 9


def test_weights_renormalise_when_no_name_was_scored() -> None:
    profile = build_profile(year=1990, month=5, day=17)
    result = align_profile(profile, 7)
    assert result.name is None and result.namesake is None
    assert result.name_change_advised is False
    assert "No name was scored" in result.recommendation_en
    # Overall must be a clean weighted blend of the two present numbers.
    expected = round(
        (0.20 * result.psychic.score + 0.35 * result.destiny.score) / 0.55
    )
    assert result.overall_score == expected


def test_strengths_are_looked_up_by_graha_not_by_number() -> None:
    profile = build_profile(year=1990, month=5, day=17, document_name="Zoro")
    plain = align_profile(profile, 7)
    boosted = align_profile(profile, 7, strengths={profile.destiny.graha: 100.0})
    assert boosted.destiny.score != plain.destiny.score
    assert boosted.destiny.natal_strength == 100.0


# ---------------------------------------------------------------------------
# Safety + bilingual
# ---------------------------------------------------------------------------
def test_no_recommendation_uses_fear_framing() -> None:
    for lagna in range(1, 13):
        result = align_profile(
            build_profile(year=1990, month=5, day=17, document_name="Zoro"), lagna
        )
        blob = f"{result.recommendation_en} {result.recommendation_ta}".lower()
        for term in BANNED_FEAR_TERMS:
            assert term not in blob, f"lagna {lagna} recommendation contains {term!r}"


def test_reasons_and_recommendations_are_script_pure() -> None:
    for lagna in range(1, 13):
        result = align_profile(
            build_profile(year=1990, month=5, day=17, document_name="Zoro"), lagna
        )
        assert not any(ord(c) in TAMIL_RANGE for c in result.recommendation_en)
        assert any(ord(c) in TAMIL_RANGE for c in result.recommendation_ta)
        for alignment in (result.psychic, result.destiny, result.name):
            if alignment is None:
                continue
            assert not any(ord(c) in TAMIL_RANGE for c in alignment.reason_en)
            assert any(ord(c) in TAMIL_RANGE for c in alignment.reason_ta)

"""Fortune Alignment tests (NUM-30..33) — the numerology/jyotisha bridge.

The doctrine tests here are the point of the whole module. If
``test_saturn_as_yogakaraka_is_never_a_reason_to_change_a_name`` ever fails, the
product has become the thing it was built not to be.
"""
from __future__ import annotations

import pytest

from app.calculations.functional_nature import (
    PLANET_OWNED_RASIS,
    FunctionalNature,
    derive_functional_nature,
    get_functional_nature,
    owned_houses,
)
from app.calculations.numerology import NUMBER_TO_GRAHA, build_profile
from app.calculations.numerology_alignment import (
    BENEFIC_NATURES,
    MALEFIC_NATURES,
    VERDICT_BANDS,
    AlignmentVerdict,
    NodeBasisKind,
    StrengthRule,
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


# ---------------------------------------------------------------------------
# The verdict's own working (`AlignmentBasis`)
#
# A rating nobody can check is a rating nobody should trust, and until this
# existed the panel showed "Out of step - 38 / 100" with no way to get from one
# to the other. These pin the arithmetic the explanation is built out of. Every
# one guards a failure that is *silent* on screen — a sum that does not add up,
# a legend that disagrees with the scoring, a sentence naming the wrong houses
# — none of which raises anything.
# ---------------------------------------------------------------------------
def test_the_parts_of_the_score_always_add_up_to_the_score() -> None:
    """``base + delta == score`` for every lagna, number and strength.

    The invariant the UI depends on: it prints the base, then the adjustment,
    then the total. ``strength_delta`` is deliberately the *realised* difference
    rather than the pre-clamp float, so the 0/100 rails cannot produce a screen
    whose own arithmetic visibly fails.
    """
    for lagna in range(1, 13):
        for number in range(1, 10):
            for strength in (None, 0.0, 12.5, 50.0, 87.5, 100.0):
                a = align_number(number, lagna, natal_strength=strength)
                assert a.basis.base_score + a.basis.strength_delta == a.score, (
                    f"lagna {lagna} number {number} strength {strength}"
                )
                assert 0 <= a.score <= 100


def test_strength_rule_names_what_actually_happened_to_the_score() -> None:
    """The rule token must match the direction the score really moved.

    ``INVERTED`` is the one that matters: for a malefic lordship a *stronger*
    graha scores lower. If token and arithmetic ever disagree the UI prints an
    explanation of the opposite of what it did — which reads as correct, and is
    worse than printing nothing.
    """
    for lagna in range(1, 13):
        for number in range(1, 10):
            weak = align_number(number, lagna, natal_strength=10.0)
            strong = align_number(number, lagna, natal_strength=90.0)
            nature = weak.functional_nature
            assert weak.basis.strength_rule is strong.basis.strength_rule

            if nature in MALEFIC_NATURES:
                assert strong.basis.strength_rule is StrengthRule.INVERTED
                assert strong.score < weak.score
            elif nature in BENEFIC_NATURES:
                assert strong.basis.strength_rule is StrengthRule.AMPLIFIES
                assert strong.score > weak.score
            else:
                assert strong.basis.strength_rule is StrengthRule.DAMPED
                assert strong.score > weak.score


def test_no_strength_on_the_chart_leaves_the_office_alone_to_speak() -> None:
    a = align_number(8, 1)
    assert a.basis.strength_rule is StrengthRule.NONE
    assert a.basis.strength_delta == 0
    assert a.score == a.basis.base_score


def test_owned_houses_match_the_mechanical_derivation() -> None:
    """The houses the UI names must be the houses the nature was derived from.

    ``derive_functional_nature`` is the repo's own validation oracle for the
    hand-authored table, and it branches on exactly this house set. Rebuilding
    the set from ``owned_houses`` proves the sentence on screen and the
    classification behind it are reading one fact rather than two.
    """
    for lagna in range(1, 13):
        for planet, rasis in PLANET_OWNED_RASIS.items():
            houses = owned_houses(lagna, planet)
            assert len(houses) == len(rasis)
            assert list(houses) == sorted(houses), "houses come back ascending"
            assert all(1 <= h <= 12 for h in houses)
            assert {((r - lagna) % 12) + 1 for r in rasis} == set(houses)
            assert derive_functional_nature(lagna, planet) is not None


def test_the_seven_always_own_houses_and_the_nodes_never_do() -> None:
    """Numbers 4 and 7 are Rahu and Ketu — the node path is two of nine.

    Which makes "Ketu rules no house of its own" an ordinary sentence on this
    panel rather than a corner case, and worth pinning.
    """
    for lagna in range(1, 13):
        for number in range(1, 10):
            a = align_number(number, lagna)
            is_node = NUMBER_TO_GRAHA[number] in ("RAHU", "KETU")
            assert bool(a.basis.node_basis) is is_node
            assert bool(a.basis.owned_houses) is not is_node


def test_node_basis_agrees_with_the_nature_it_claims_to_explain() -> None:
    """``_node_basis`` mirrors ``_node_functional_nature`` branch for branch.

    Two functions walking one classical rule, so they can drift. If they do the
    panel explains a node's rating by a reason that did not produce it — fluent
    and wrong, the worst combination available.
    """
    for lagna in range(1, 13):
        for node_rasi in range(1, 13):
            node_map = {"RAHU": node_rasi, "KETU": ((node_rasi + 5) % 12) + 1}
            a = align_number(4, lagna, node_rasi_map=node_map)
            basis = a.basis.node_basis
            assert basis is not None
            if basis.kind is NodeBasisKind.OCCUPIED_HOUSE:
                assert basis.occupied_house in (6, 8, 12)
                assert a.functional_nature is FunctionalNature.DUSTHANA
                assert basis.dispositor is None
            else:
                assert basis.kind is NodeBasisKind.DISPOSITOR
                assert basis.occupied_house not in (6, 8, 12)
                assert basis.dispositor is not None
                # It borrows its host's office outright — the claim the sentence
                # on screen makes, so it has to hold.
                assert a.functional_nature is get_functional_nature(lagna, basis.dispositor)
                assert basis.dispositor_houses == owned_houses(lagna, basis.dispositor)


def test_a_node_with_no_recorded_position_says_so_rather_than_guessing() -> None:
    a = align_number(7, 5)
    assert a.basis.node_basis is not None
    assert a.basis.node_basis.kind is NodeBasisKind.NO_POSITION
    assert a.basis.node_basis.occupied_house is None
    assert a.functional_nature is FunctionalNature.NEUTRAL


# ---------------------------------------------------------------------------
# The ladder the client draws its legend from
# ---------------------------------------------------------------------------
def test_verdict_bands_cover_every_score_exactly_once() -> None:
    covered = sorted(
        score for band in VERDICT_BANDS for score in range(band.min_score, band.max_score + 1)
    )
    assert covered == list(range(101)), "the bands must tile 0-100 with no gap or overlap"


def test_every_band_boundary_agrees_with_verdict_from_score() -> None:
    """Legend and scoring must never be able to disagree.

    ``VERDICT_BANDS`` is derived from ``_VERDICT_CUTOFFS`` rather than written
    out a second time, and this walks all 101 scores to keep it that way. A
    hand-copied ladder — in Python or, worse, in TypeScript — is how a client
    ends up drawing a boundary the server does not score by.
    """
    for score in range(101):
        band = next(b for b in VERDICT_BANDS if b.min_score <= score <= b.max_score)
        assert band.verdict is verdict_from_score(score), f"score {score}"


def test_bands_are_ordered_best_first() -> None:
    mins = [band.min_score for band in VERDICT_BANDS]
    assert mins == sorted(mins, reverse=True)
    assert VERDICT_BANDS[0].max_score == 100
    assert VERDICT_BANDS[-1].min_score == 0

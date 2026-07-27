"""Name correction engine (NUM-53, NUM-54, NUM-57, Phase 5).

The engine's job is as much to *refuse* as to recommend. Most of these tests
are about the refusals — a name-correction product that always has something to
sell is a slot machine, and the guards that stop it being one are the part worth
pinning down.
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.calculations.numerology import ScriptMismatchError, score_text
from app.calculations.numerology_alignment import align_number
from app.calculations.numerology_correction import (
    LEGAL_WARNING_EN,
    LEGAL_WARNING_TA,
    MAX_ALTERNATIVES,
    SpellingOperation,
    correct_name,
    generate_variants,
    legal_warning,
    rank_variants,
)
from app.schemas.numerology import (
    NameCorrectionResponse,
    NameVariantOut,
    NumberAlignmentOut,
    NumberReadingOut,
)

pytestmark = pytest.mark.no_db

#: Synthetic. "Rajesh" scores 17 -> root 8 (Sani), which is the canonical case:
#: benefic for six of the twelve lagnas and misaligned for four, so the same
#: name exercises both the recommend and the refuse path.
NAME = "Rajesh"
NAME_TOTAL = 17

#: Lagnas where Sani is functionally benefic for the native — verified against
#: functional_nature, not assumed.
BENEFIC_LAGNAS = (2, 3, 6, 7, 10, 11)
#: Lagnas where Sani is a maraka or dusthana lord.
MISALIGNED_LAGNAS = (4, 5, 9, 12)


# ── Variant generation ───────────────────────────────────────────────────────
def test_base_name_scores_as_expected() -> None:
    """Anchor the fixture: R=2 A=1 J=1 E=5 S=3 H=5 -> 17 -> root 8."""
    reading = score_text(NAME)
    assert reading.total == NAME_TOTAL
    assert reading.root == 8
    assert reading.graha == "SATURN"


def test_every_variant_names_the_operations_that_produced_it() -> None:
    """The audit trail is the product. A spelling with no derivation is a guess."""
    variants = generate_variants(NAME, max_edits=1)
    assert variants
    for variant in variants:
        assert variant.operations, f"{variant.spelling} has no derivation"
        assert all(isinstance(op, SpellingOperation) for op in variant.operations)
        assert len(variant.operations) == 1


def test_single_edit_variants_are_the_expected_orthographic_moves() -> None:
    """Pinned by hand so a change to the operation set is a visible diff.

    Adding a member to ``SpellingOperation`` is a doctrine change that needs the
    astrologer — this test makes it impossible to slip one in as a refactor.
    """
    produced = {v.spelling: v.operations[0] for v in generate_variants(NAME, max_edits=1)}
    assert produced == {
        "Raajesh": SpellingOperation.LENGTHEN_VOWEL,
        "Rajeesh": SpellingOperation.LENGTHEN_VOWEL,
        "Rajessh": SpellingOperation.DOUBLE_CONSONANT,
        "Rajhesh": SpellingOperation.ADD_ASPIRATE,
        "Rajesha": SpellingOperation.APPEND_VOWEL,
    }


def test_delta_is_measured_against_the_original_total() -> None:
    for variant in generate_variants(NAME, max_edits=2):
        assert variant.delta == variant.reading.total - NAME_TOTAL


def test_the_original_spelling_is_never_returned_as_a_variant() -> None:
    spellings = {v.spelling.lower() for v in generate_variants(NAME, max_edits=2)}
    assert NAME.lower() not in spellings


def test_two_edits_strictly_widen_the_search() -> None:
    one = generate_variants(NAME, max_edits=1)
    two = generate_variants(NAME, max_edits=2)
    assert len(two) > len(one)
    assert {v.spelling for v in one} <= {v.spelling for v in two}


def test_more_than_two_edits_is_refused() -> None:
    """Past two edits a 'correction' is a different name, and the premise of
    correction is that the name survives it."""
    with pytest.raises(ValueError, match="max_edits"):
        generate_variants(NAME, max_edits=3)


def test_non_latin_name_is_refused_not_silently_skipped() -> None:
    """Doctrine D3, inherited from score_text rather than re-implemented."""
    with pytest.raises(ScriptMismatchError):
        generate_variants("தீபா")


def test_generation_is_deterministic() -> None:
    assert generate_variants(NAME, max_edits=2) == generate_variants(NAME, max_edits=2)


# ── The refusals ─────────────────────────────────────────────────────────────
@pytest.mark.parametrize("lagna", BENEFIC_LAGNAS)
def test_a_benefic_name_number_yields_no_alternatives_at_all(lagna: int) -> None:
    """Doctrine §9.1/§9.2 — the guard that makes this engine honest.

    Not "alternatives with a note saying you're fine". An empty tuple. Sani is
    the canonical case: "8 is unlucky" is the most sold and least defensible
    claim in this trade, and for a Thula or Makara native Sani is the single
    most benefic graha in the chart.
    """
    result = correct_name(NAME, lagna)
    assert result.alternatives == ()
    assert result.change_advised is False
    assert result.no_change_reason == "benefic_lordship"
    # The search never ran — this is a refusal, not an empty result set.
    assert result.variants_considered == 0


def test_a_neutral_name_number_yields_no_alternatives() -> None:
    """Nothing wrong is not the same as something to fix."""
    result = correct_name(NAME, 1)
    assert result.alternatives == ()
    assert result.no_change_reason == "not_misaligned"
    assert result.variants_considered == 0


def test_no_change_reasons_are_distinguishable() -> None:
    """'Your name is benefic' and 'nothing scored better' are opposite findings."""
    assert correct_name(NAME, 7).no_change_reason == "benefic_lordship"
    assert correct_name(NAME, 1).no_change_reason == "not_misaligned"


# ── The recommendations ──────────────────────────────────────────────────────
@pytest.mark.parametrize("lagna", MISALIGNED_LAGNAS)
def test_a_misaligned_name_gets_ranked_alternatives(lagna: int) -> None:
    result = correct_name(NAME, lagna)
    assert result.alternatives
    assert result.change_advised is True
    assert result.no_change_reason is None
    assert result.variants_considered > 0
    assert len(result.alternatives) <= MAX_ALTERNATIVES


@pytest.mark.parametrize("lagna", MISALIGNED_LAGNAS)
def test_only_improvements_are_offered(lagna: int) -> None:
    """A spelling that scores worse is not a correction, and showing it greyed
    out is how a user talks themselves into one."""
    result = correct_name(NAME, lagna)
    for row in result.alternatives:
        assert row.improvement > 0
        assert row.alignment.score > result.original_alignment.score


@pytest.mark.parametrize("lagna", MISALIGNED_LAGNAS)
def test_alternatives_are_sorted_best_first(lagna: int) -> None:
    improvements = [row.improvement for row in correct_name(NAME, lagna).alternatives]
    assert improvements == sorted(improvements, reverse=True)


@pytest.mark.parametrize("lagna", MISALIGNED_LAGNAS)
def test_one_spelling_per_number(lagna: int) -> None:
    """All spellings reaching the same root score identically. Showing six ways
    to reach one number pads the list without adding a choice."""
    roots = [row.variant.root for row in correct_name(NAME, lagna).alternatives]
    assert len(roots) == len(set(roots))


@pytest.mark.parametrize("lagna", MISALIGNED_LAGNAS)
def test_ties_break_toward_the_smallest_change(lagna: int) -> None:
    """Equally aligned corrections sort fewest-edits-first.

    Two spellings that improve the chart by the same amount are not equally
    good: the one that changes the name less is. Asserted per improvement-group
    rather than over the whole list, because across groups a bigger improvement
    rightly outranks a smaller edit.
    """
    alternatives = correct_name(NAME, lagna).alternatives
    groups: dict[int, list[int]] = {}
    for row in alternatives:
        groups.setdefault(row.improvement, []).append(len(row.variant.operations))
    for improvement, edit_counts in groups.items():
        assert edit_counts == sorted(edit_counts), (
            f"improvement {improvement}: edit counts {edit_counts} are not "
            "smallest-change-first"
        )
    assert alternatives, "guard the guard — an empty list would pass vacuously"


def test_the_simplest_spelling_wins_for_a_given_number() -> None:
    """All spellings reaching root N score identically, so the one shown must be
    the one that changes the name least — never an arbitrary pick."""
    result = correct_name(NAME, 12)
    all_variants = generate_variants(NAME, max_edits=2)
    for row in result.alternatives:
        rivals = [v for v in all_variants if v.root == row.variant.root]
        fewest = min(len(v.operations) for v in rivals)
        assert len(row.variant.operations) == fewest, (
            f"{row.variant.spelling} took {len(row.variant.operations)} edits to "
            f"reach root {row.variant.root}; {fewest} was available"
        )


def test_ranking_is_chart_first_not_reputation() -> None:
    """The same variant set ranks differently for two different lagnas.

    If this ever returns the same order for every chart, the ranking has
    stopped consulting the jadhagam and become a generic numerology table.
    """
    variants = generate_variants(NAME, max_edits=2)
    original = score_text(NAME)
    orders = []
    for lagna in MISALIGNED_LAGNAS:
        ranked = rank_variants(variants, lagna, align_number(original.root, lagna))
        orders.append(tuple(row.variant.spelling for row in ranked))
    assert len(set(orders)) > 1


# ── The legal warning (NUM-57, plan §9.4) ────────────────────────────────────
def test_legal_warning_is_bilingual_and_names_the_actual_documents() -> None:
    warning = legal_warning()
    assert warning["legal_warning_en"] == LEGAL_WARNING_EN
    assert warning["legal_warning_ta"] == LEGAL_WARNING_TA
    for token in ("Aadhaar", "KYC", "passport"):
        assert token in LEGAL_WARNING_EN
    assert "ஆதார்" in LEGAL_WARNING_TA


def test_result_flags_that_it_requires_the_warning() -> None:
    assert correct_name(NAME, 12).requires_legal_warning is True
    assert correct_name(NAME, 7).requires_legal_warning is False


def _variant_out(lagna: int) -> NameVariantOut:
    ranked = correct_name(NAME, lagna).alternatives[0]
    return NameVariantOut.from_ranked(ranked)


def _response_kwargs(lagna: int) -> dict:
    result = correct_name(NAME, lagna)
    return {
        "original": NAME,
        "originalReading": NumberReadingOut.from_reading(result.original_reading),
        "originalAlignment": NumberAlignmentOut.from_alignment(result.original_alignment),
        "changeAdvised": True,
        "variantsConsidered": result.variants_considered,
        "lagnaRasi": lagna,
        "calculationVersion": "test",
    }


def test_alternatives_cannot_be_serialised_without_the_warning() -> None:
    """Plan §9.4 made structural rather than recited.

    This is the one place in the numerology feature where the harm is
    administrative and real — users change a legal name and then Aadhaar, KYC,
    passport and certificates disagree for years. A future edit that drops the
    warning from the route breaks the response, loudly, here.
    """
    with pytest.raises(ValidationError, match="legal-consequence warning"):
        NameCorrectionResponse(
            alternatives=[_variant_out(12)],
            legalWarningEn=None,
            legalWarningTa=None,
            **_response_kwargs(12),
        )


def test_a_warning_in_one_language_only_is_also_refused() -> None:
    """Half a warning is not a warning — the Tamil-reading user is the one this
    protects."""
    with pytest.raises(ValidationError, match="legal-consequence warning"):
        NameCorrectionResponse(
            alternatives=[_variant_out(12)],
            legalWarningEn=LEGAL_WARNING_EN,
            legalWarningTa=None,
            **_response_kwargs(12),
        )


def test_an_empty_alternatives_list_needs_no_warning() -> None:
    """The 'your name is fine' response must not be blocked by the guard."""
    result = correct_name(NAME, 7)
    response = NameCorrectionResponse(
        original=NAME,
        originalReading=NumberReadingOut.from_reading(result.original_reading),
        originalAlignment=NumberAlignmentOut.from_alignment(result.original_alignment),
        alternatives=[],
        changeAdvised=False,
        noChangeReason=result.no_change_reason,
        variantsConsidered=0,
        lagnaRasi=7,
        calculationVersion="test",
    )
    assert response.alternatives == []
    assert response.no_change_reason == "benefic_lordship"

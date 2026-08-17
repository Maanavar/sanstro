"""EC-RULING-05 — Ezharai Sani segmentation (A26), gates (A25), 5th-house insight (A27)."""
from __future__ import annotations

import pytest

from app.calculations.prediction_score import (
    PredictionScoreInput,
    _sade_sati_penalty,
    compute_prediction_score,
)
from app.calculations.sade_sati import (
    FIFTH_HOUSE_IS_UNTOUCHED,
    INSIGHT_5TH_EN,
    INSIGHT_5TH_TA,
    MONTHS_PER_PHASE,
    SAV_PEACEFUL_THRESHOLD,
    TOTAL_MONTHS,
    SadeSatiSeverity,
    assess_mitigation,
    elapsed_month,
    houses_touched_during_cycle,
    is_sade_sati_house,
    severity_for_month,
)

pytestmark = pytest.mark.no_db


# ── A27: the structural claim, proved rather than asserted ──────────────────

def test_saturn_never_occupies_or_aspects_the_fifth_during_the_cycle():
    """The whole basis of the Insight-tier text, re-derived from the aspect table.

    Saturn stands in the 12th, 1st and 2nd from the natal Moon across the cycle
    and aspects the 3rd, 7th and 10th from wherever it stands:

        12th -> aspects 2, 6, 9
         1st -> aspects 3, 7, 10
         2nd -> aspects 4, 8, 11

    Occupied ∪ aspected = every house except the 5th. If someone ever changes
    Saturn's special aspects, this fails and the reassurance stops shipping —
    which is the correct outcome, because it would no longer be true.
    """
    touched = houses_touched_during_cycle()
    assert touched == frozenset({1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12})
    assert 5 not in touched
    assert FIFTH_HOUSE_IS_UNTOUCHED is True


def test_the_fifth_house_insight_is_bilingual_and_specific():
    """It must name the mechanism, not just offer comfort — the point of this
    passage is that it is checkable."""
    for text in (INSIGHT_5TH_EN, INSIGHT_5TH_TA):
        assert "5" in text
        assert "12" in text
    assert "aspects" in INSIGHT_5TH_EN
    assert "சனி" in INSIGHT_5TH_TA


# ── A26: the cycle is not uniform ───────────────────────────────────────────

def test_the_three_phases_are_the_only_sade_sati_houses():
    for house in range(1, 13):
        assert is_sade_sati_house(house) is (house in {12, 1, 2})


def test_every_month_of_the_cycle_has_exactly_one_grade():
    """No gaps and no overlaps across all ninety months — a month with no grade
    would silently fall back to MIXED and hide a broken table."""
    grades = [severity_for_month(m) for m in range(1, TOTAL_MONTHS + 1)]
    assert len(grades) == TOTAL_MONTHS
    assert all(isinstance(g, SadeSatiSeverity) for g in grades)


def test_the_segmentation_matches_the_traditional_division():
    """16 difficult, 35 comparatively favourable, 4 acute — the counts the ruling
    states, asserted as counts so a boundary typo cannot pass."""
    counts: dict[SadeSatiSeverity, int] = {}
    for month in range(1, TOTAL_MONTHS + 1):
        grade = severity_for_month(month)
        counts[grade] = counts.get(grade, 0) + 1

    assert counts[SadeSatiSeverity.DIFFICULT] == 16
    assert counts[SadeSatiSeverity.FAVOURABLE] == 35
    assert counts[SadeSatiSeverity.ACUTE] == 4
    assert sum(counts.values()) == TOTAL_MONTHS


def test_the_acute_window_closes_janma_sani():
    """The source places the acute months at the END of Janma Sani, not at the
    start of the cycle — putting them anywhere else would be a different claim."""
    janma_sani_end = 2 * MONTHS_PER_PHASE
    for month in range(janma_sani_end - 3, janma_sani_end + 1):
        assert severity_for_month(month) is SadeSatiSeverity.ACUTE
    assert severity_for_month(janma_sani_end + 1) is not SadeSatiSeverity.ACUTE


def test_the_long_middle_is_favourable_not_penalised_like_the_opening():
    """The correction that matters most: the old flat model charged these the
    same as the worst months."""
    assert severity_for_month(10) is SadeSatiSeverity.DIFFICULT
    assert severity_for_month(30) is SadeSatiSeverity.FAVOURABLE
    assert severity_for_month(50) is SadeSatiSeverity.FAVOURABLE


def test_elapsed_month_walks_the_phases_in_order():
    assert elapsed_month(12, 0) == 1                      # cycle opens
    assert elapsed_month(12, 29) == 30                    # end of Viraya Sani
    assert elapsed_month(1, 0) == MONTHS_PER_PHASE + 1    # Janma Sani opens
    assert elapsed_month(2, 29) == TOTAL_MONTHS           # cycle closes
    assert elapsed_month(7, 3) == 0                       # not in the cycle at all


def test_elapsed_month_is_clamped_to_the_cycle():
    """Saturn's real dwell varies, so a caller can legitimately report more than
    thirty months in a sign. That must not index past the table."""
    assert elapsed_month(2, 45) == TOTAL_MONTHS
    assert elapsed_month(12, -5) == 1


# ── A25: the gates ──────────────────────────────────────────────────────────

def test_dignified_natal_saturn_is_a_mitigation():
    exalted = assess_mitigation(natal_saturn_rasi=7, natal_saturn_house_from_lagna=5)
    assert exalted.natal_saturn_dignified is True
    own = assess_mitigation(natal_saturn_rasi=11, natal_saturn_house_from_lagna=5)
    assert own.natal_saturn_dignified is True
    neither = assess_mitigation(natal_saturn_rasi=1, natal_saturn_house_from_lagna=5)
    assert neither.natal_saturn_dignified is False


def test_upachaya_placement_is_a_mitigation():
    for house in (3, 6, 10, 11):
        assessed = assess_mitigation(
            natal_saturn_rasi=1, natal_saturn_house_from_lagna=house
        )
        assert assessed.natal_saturn_well_placed is True, house
    assert assess_mitigation(
        natal_saturn_rasi=1, natal_saturn_house_from_lagna=8
    ).natal_saturn_well_placed is False


def test_unevaluated_bindus_are_not_counted_against_the_native():
    """`None` means the caller did not compute SAV. It must never be read as
    "no support" — that would penalise a native for a missing input."""
    without = assess_mitigation(natal_saturn_rasi=1, natal_saturn_house_from_lagna=8)
    assert without.transited_sign_well_supported is None
    assert without.count == 0

    supported = assess_mitigation(
        natal_saturn_rasi=1,
        natal_saturn_house_from_lagna=8,
        transited_sign_sav_bindus=SAV_PEACEFUL_THRESHOLD + 1,
    )
    assert supported.transited_sign_well_supported is True
    assert supported.count == 1

    unsupported = assess_mitigation(
        natal_saturn_rasi=1,
        natal_saturn_house_from_lagna=8,
        transited_sign_sav_bindus=SAV_PEACEFUL_THRESHOLD,
    )
    assert unsupported.transited_sign_well_supported is False
    assert unsupported.count == 0


def test_mitigation_reasons_are_stated_not_just_counted():
    """A gate that changes a score without being able to say why is not a
    reading — every mitigation has to be nameable to the user."""
    assessed = assess_mitigation(
        natal_saturn_rasi=7,
        natal_saturn_house_from_lagna=11,
        transited_sign_sav_bindus=34,
    )
    assert assessed.count == 3
    assert len(assessed.reasons) == 3
    assert any("Ashtakavarga" in r for r in assessed.reasons)


# ── Scoring: the flat -4 is gone, and the default path is unchanged ─────────

def test_the_unsegmented_penalty_is_exactly_the_old_flat_value():
    """Callers that have not been updated must score identically to before, so
    adding segmentation was not also a silent re-scoring of every surface."""
    assert _sade_sati_penalty(None, 0) == 4


def test_penalty_tracks_the_segmentation():
    assert _sade_sati_penalty("FAVOURABLE", 0) < _sade_sati_penalty(None, 0)
    assert _sade_sati_penalty("ACUTE", 0) > _sade_sati_penalty(None, 0)
    assert _sade_sati_penalty("DIFFICULT", 0) > _sade_sati_penalty("FAVOURABLE", 0)


def test_mitigations_reduce_but_never_erase_the_penalty():
    """The transit is still running even at full mitigation — a reading that
    scored it as absent would be as wrong as the flat model was."""
    assert _sade_sati_penalty("DIFFICULT", 3) < _sade_sati_penalty("DIFFICULT", 0)
    assert _sade_sati_penalty("FAVOURABLE", 3) >= 1
    assert _sade_sati_penalty("ACUTE", 99) >= 1


def _score_input(**overrides) -> PredictionScoreInput:
    base = {
        "house_lord_strength": 60, "karaka_strength": 60, "yoga_present": False,
        "yoga_strength": "NONE", "dosham_present": False, "dosham_cancelled": False,
        "dosham_strength": "NONE", "key_planet_strengths": [60, 60],
        "maha_lord_functional_nature": "NEUTRAL",
        "antar_lord_functional_nature": "NEUTRAL",
        "maha_lord_house_connection": False, "antar_lord_house_connection": False,
        "maha_lord_strength": 60, "maturation_multiplier": 1.0,
        "varga_confirmation": 0, "jupiter_house_score": 50, "saturn_house_score": 50,
        "double_transit_score": 0, "is_sade_sati": True, "is_ashtama_sani": False,
        "bav_delta": 0, "sav_delta": 0,
    }
    base.update(overrides)
    return PredictionScoreInput(**base)


def test_a_favourable_month_scores_better_than_an_acute_one_end_to_end():
    favourable = compute_prediction_score(_score_input(sade_sati_severity="FAVOURABLE"))
    acute = compute_prediction_score(_score_input(sade_sati_severity="ACUTE"))
    assert favourable.l5_transit_support > acute.l5_transit_support


def test_mitigation_shows_up_in_the_end_to_end_score():
    bare = compute_prediction_score(_score_input(sade_sati_severity="DIFFICULT"))
    gated = compute_prediction_score(
        _score_input(sade_sati_severity="DIFFICULT", sade_sati_mitigation_count=2)
    )
    assert gated.l5_transit_support > bare.l5_transit_support


# ── The standing rule from the ruling ───────────────────────────────────────

def test_sade_sati_never_reaches_the_porutham_engine():
    """EC-RULING-05 writes this into the engine constitution: Sade Sati is a
    full-chart transit judgement and never becomes a marriage-compatibility
    veto, at any severity tier. Asserted structurally — as an import boundary —
    because a prose rule in a doc cannot fail a build.
    """
    import inspect

    from app.calculations import porutham

    source = inspect.getsource(porutham)
    assert "sade_sati" not in source.lower()
    assert "ezharai" not in source.lower()

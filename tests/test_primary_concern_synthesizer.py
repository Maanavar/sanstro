"""Tests for the primary-concern synthesizer (Veteran Protocol audit, Phase A2).

Lagna rasi 1 (Mesham/Aries) is used throughout so SIGN_LORD ownership is easy to
reason about: VENUS owns houses 2 & 7, MERCURY owns 3 & 6, MOON owns 4, SUN owns 5,
JUPITER owns 9 & 12, SATURN owns 10 & 11, MARS owns 1 & 8 (from lagna 1).
"""
from __future__ import annotations

import pytest

from app.calculations.transits import CycleAssessment
from app.services.primary_concern_service import infer_primary_concerns

_JANMA_SANI = CycleAssessment(
    type="JANMA_SANI", is_active=True, supportive_label="Sade Sati peak: major life restructuring"
)
_NO_SANI = CycleAssessment(type=None, is_active=False)


@pytest.mark.no_db
def test_swabhukti_venus_ranks_marriage_high_with_high_confidence() -> None:
    """Venus mahadasha + Venus antardasha (swabhukti) activates houses 2 & 7 for
    lagna 1 — house 7 is marriage's significator, so both the antardasha and
    mahadasha signals should agree and push marriage to the top with high
    confidence, even though career leads the raw age-phase order at age 25."""
    results = infer_primary_concerns(
        current_age=25,
        gender=None,
        mahadasha_lord="VENUS",
        antardasha_lord="VENUS",
        lagna_rasi=1,
        sani_cycle=_NO_SANI,
    )
    assert results[0].concern == "marriage"
    assert results[0].confidence == "high"
    assert results[0].rationale_en
    assert results[0].rationale_ta


@pytest.mark.no_db
def test_active_sani_cycle_boosts_health_concern() -> None:
    """Jupiter/Saturn dasha-bhukti at lagna 1 activates houses 9,12,10,11 — none
    of which are health significators — so an active Sani cycle should be the
    sole reason health outranks education/family in the under-12 band."""
    results = infer_primary_concerns(
        current_age=10,
        gender=None,
        mahadasha_lord="JUPITER",
        antardasha_lord="SATURN",
        lagna_rasi=1,
        sani_cycle=_JANMA_SANI,
    )
    assert results[0].concern == "health"
    assert results[0].confidence == "medium"  # exactly one signal (sani)


@pytest.mark.no_db
def test_no_signals_falls_back_to_age_phase_order_with_low_confidence() -> None:
    results = infer_primary_concerns(
        current_age=10,
        gender=None,
        mahadasha_lord="JUPITER",
        antardasha_lord="SATURN",
        lagna_rasi=1,
        sani_cycle=_NO_SANI,
    )
    assert [c.concern for c in results] == ["health", "education", "family"]
    assert all(c.confidence == "low" for c in results)


@pytest.mark.no_db
def test_returns_at_most_top_n_candidates() -> None:
    results = infer_primary_concerns(
        current_age=40,
        gender="female",
        mahadasha_lord="MARS",
        antardasha_lord="MOON",
        lagna_rasi=1,
        sani_cycle=_NO_SANI,
        top_n=2,
    )
    assert len(results) == 2


@pytest.mark.no_db
def test_never_emits_percentage_or_longevity_language() -> None:
    results = infer_primary_concerns(
        current_age=45,
        gender="male",
        mahadasha_lord="SATURN",
        antardasha_lord="MARS",
        lagna_rasi=1,
        sani_cycle=_JANMA_SANI,
    )
    for candidate in results:
        assert "%" not in candidate.rationale_en
        assert "death" not in candidate.rationale_en.lower()
        assert "denial" not in candidate.rationale_en.lower()

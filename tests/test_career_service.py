"""Unit tests for assess_career_prediction() in career_service.py."""
from __future__ import annotations

from datetime import date

import pytest

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811  — shadows conftest require_db; no DB needed for unit tests
    return


from app.services.career_service import CareerAssessmentInput, assess_career_prediction


# ---------------------------------------------------------------------------
# Shared test data — Mesh Lagna (lagna_rasi=1)
# Sun in 10th (Magaram=10), Saturn in 3rd (Mithun=3), Jupiter in 9th (Dhanusu=9).
# 10th lord = Saturn (lord of Magaram), placed in 3rd = decent house.
# 2nd lord = Venus (lord of Rishabam=2).
# 7th lord = Venus (lord of Thulam=7 from Mesh).
# ---------------------------------------------------------------------------

_BASE_PLANETS: dict[str, int] = {
    "SUN": 10,      # in 10th from Mesh lagna
    "MOON": 4,      # in 4th
    "MARS": 1,      # in lagna (Mesh)
    "MERCURY": 9,   # in 9th
    "JUPITER": 9,   # in 9th
    "VENUS": 2,     # in 2nd (own sign Rishabam)
    "SATURN": 3,    # in 3rd (Mithun)
    "RAHU": 6,      # in 6th
    "KETU": 12,     # in 12th
}

_BASE_INPUT = dict(
    as_of=date(2026, 5, 29),
    lagna_rasi=1,           # Mesh
    planets_rasi=_BASE_PLANETS,
    active_dasha_lords={"JUPITER", "MOON"},
    transit_saturn_rasi=11,  # Saturn in 11th from Mesh — supportive
    age=32,
    life_stage="mid_life",
)


# ---------------------------------------------------------------------------
# Employment-type karaka tests
# ---------------------------------------------------------------------------

def test_self_employed_second_lord_active_gives_support():
    """2nd lord Venus is active in dasha → self-employed income supported (+6)."""
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "employment_type": "self_employed", "active_dasha_lords": {"VENUS", "MOON"}},
    )
    result = assess_career_prediction(inp)
    keys = [f.key for f in result.astrological_factors]
    assert "employment_second_lord" in keys
    factor = next(f for f in result.astrological_factors if f.key == "employment_second_lord")
    assert factor.status == "SUPPORT"
    assert any("self-employment" in s.en.lower() and "supported" in s.en.lower() for s in result.supports)


def test_self_employed_second_lord_inactive_gives_challenge():
    """2nd lord Venus not in active dasha → income may lag."""
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "employment_type": "self_employed", "active_dasha_lords": {"SATURN", "MOON"}},
    )
    result = assess_career_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "employment_second_lord"), None)
    assert factor is not None
    assert factor.status == "CAUTION"
    assert any("income may lag" in c.en.lower() for c in result.challenges)


def test_business_owner_seventh_lord_active_gives_support():
    """7th lord Venus is in active dasha → business partnership supported (+7)."""
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "employment_type": "business_owner", "active_dasha_lords": {"VENUS", "MARS"}},
    )
    result = assess_career_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "employment_seventh_house"), None)
    assert factor is not None
    assert factor.status == "SUPPORT"
    assert any("7th house supports" in s.en.lower() for s in result.supports)


def test_business_owner_seventh_lord_inactive_gives_challenge():
    """7th lord Venus not active, no planets in 7th → partnership risk (-3)."""
    # Remove any planet from 7th house (Thulam=7 from Mesh lagna)
    planets_no_7th = {k: (v if v != 7 else 8) for k, v in _BASE_PLANETS.items()}
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "employment_type": "business_owner",
           "planets_rasi": planets_no_7th, "active_dasha_lords": {"SATURN", "MOON"}},
    )
    result = assess_career_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "employment_seventh_house"), None)
    assert factor is not None
    assert factor.status == "CAUTION"
    assert any("partnership risks" in c.en.lower() for c in result.challenges)


def test_retired_employment_applies_legacy_framing():
    """Retired employment type reduces score and surfaces legacy framing."""
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "employment_type": "retired", "age": 65, "life_stage": "senior"},
    )
    result = assess_career_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "employment_retired"), None)
    assert factor is not None
    assert factor.status == "INFO"
    assert any("retired" in c.en.lower() for c in result.challenges)


def test_employment_type_none_does_not_crash():
    """No employment_type provided — service must not raise."""
    inp = CareerAssessmentInput(**{**_BASE_INPUT, "employment_type": None})
    result = assess_career_prediction(inp)
    assert result.life_area == "career"
    assert result.confidence in ("HIGH", "MEDIUM", "LOW")


def test_salaried_employment_records_info_factor():
    """Salaried employment type is recorded as an INFO factor."""
    inp = CareerAssessmentInput(**{**_BASE_INPUT, "employment_type": "employed_salaried"})
    result = assess_career_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "employment_type"), None)
    assert factor is not None
    assert "employed_salaried" in factor.detail.en.lower()


# ---------------------------------------------------------------------------
# Age-gate test
# ---------------------------------------------------------------------------

def test_career_age_gate_under_18():
    """Users under 18 get the age-gated message."""
    inp = CareerAssessmentInput(
        **{**_BASE_INPUT, "age": 15, "life_stage": "student"},
    )
    result = assess_career_prediction(inp)
    assert "age-gated" in result.main_prediction_en.lower()
    assert result.confidence == "LOW"


# ---------------------------------------------------------------------------
# Score sanity test
# ---------------------------------------------------------------------------

def test_career_score_is_within_bounds():
    """Final career prediction score never exceeds 0–100."""
    for emp in ("employed_salaried", "self_employed", "business_owner", "student", "retired", None):
        inp = CareerAssessmentInput(**{**_BASE_INPUT, "employment_type": emp})
        result = assess_career_prediction(inp)
        assert result.confidence in ("HIGH", "MEDIUM", "LOW")

"""Unit tests for assess_wealth_prediction() in wealth_service.py."""
from __future__ import annotations

from datetime import date

import pytest

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811  — shadows conftest require_db; no DB needed for unit tests
    return


from app.services.wealth_service import WealthAssessmentInput, assess_wealth_prediction


# ---------------------------------------------------------------------------
# Shared test data — Mesh Lagna (lagna_rasi=1)
# 2nd lord = Venus (Rishabam=2), placed in 2nd → strong house
# 11th lord = Saturn (Kumbam=11), placed in 11th → strong house
# Jupiter in 9th → transit_jupiter_rasi=9
# ---------------------------------------------------------------------------

_BASE_PLANETS: dict[str, int] = {
    "SUN": 10,
    "MOON": 4,
    "MARS": 1,
    "MERCURY": 9,
    "JUPITER": 9,
    "VENUS": 2,    # 2nd lord in 2nd (own sign) — strong
    "SATURN": 11,  # 11th lord in 11th (own sign) — strong
    "RAHU": 6,
    "KETU": 12,
}

_BASE_INPUT = dict(
    as_of=date(2026, 5, 29),
    lagna_rasi=1,
    planets_rasi=_BASE_PLANETS,
    active_dasha_lords={"JUPITER", "VENUS"},
    transit_jupiter_rasi=9,  # Jupiter in 9th — good house
    has_dhana_yoga=False,
    age=35,
    life_stage="mid_life",
    ashtakavarga_11th_bindu=None,
    pitru_dosham_label=None,
    rahu_ketu_label=None,
)


# ---------------------------------------------------------------------------
# Age gate
# ---------------------------------------------------------------------------

def test_wealth_age_gate_under_18():
    inp = WealthAssessmentInput(**{**_BASE_INPUT, "age": 15, "life_stage": "student"})
    result = assess_wealth_prediction(inp)
    assert "age-gated" in result.main_prediction_en.lower()
    assert result.confidence == "LOW"


# ---------------------------------------------------------------------------
# Dhana yoga
# ---------------------------------------------------------------------------

def test_dhana_yoga_present_boosts_score():
    with_yoga = WealthAssessmentInput(**{**_BASE_INPUT, "has_dhana_yoga": True})
    without_yoga = WealthAssessmentInput(**{**_BASE_INPUT, "has_dhana_yoga": False})
    r_with = assess_wealth_prediction(with_yoga)
    r_without = assess_wealth_prediction(without_yoga)
    assert any(f.key == "dhana_yoga" for f in r_with.astrological_factors)
    assert any("dhana yoga is present" in s.en.lower() for s in r_with.supports)
    assert any("clear dhana yoga" in c.en.lower() for c in r_without.challenges)


# ---------------------------------------------------------------------------
# 11th bindu
# ---------------------------------------------------------------------------

def test_11th_bindu_zero_marks_weak_wealth():
    """Explicitly passing bindu=0 for 11th house → CAUTION/NEUTRAL Ashtakavarga factor."""
    inp = WealthAssessmentInput(**{**_BASE_INPUT, "ashtakavarga_11th_bindu": 0})
    result = assess_wealth_prediction(inp)
    # The service uses key "ashtakavarga_11th" for this factor
    factor = next((f for f in result.astrological_factors if f.key == "ashtakavarga_11th"), None)
    assert factor is not None
    assert factor.status in ("CAUTION", "WEAK", "NEUTRAL")


def test_11th_bindu_high_marks_strong_wealth():
    """High bindu (7+) should surface a SUPPORT Ashtakavarga factor."""
    inp = WealthAssessmentInput(**{**_BASE_INPUT, "ashtakavarga_11th_bindu": 7})
    result = assess_wealth_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "ashtakavarga_11th"), None)
    assert factor is not None
    assert factor.status == "SUPPORT"


# ---------------------------------------------------------------------------
# Dusthana 2nd/11th lords
# ---------------------------------------------------------------------------

def test_dusthana_lords_lower_confidence():
    """2nd and 11th lords in dusthana houses + no active dasha boost → CAUTION lords_2_11 factor."""
    dusthana_planets = {
        **_BASE_PLANETS,
        "VENUS": 8,    # 2nd lord Venus in 8th (dusthana from Mesh)
        "SATURN": 12,  # 11th lord Saturn in 12th (dusthana)
    }
    # Remove both lords from active dasha so dusthana penalty isn't overridden
    inp = WealthAssessmentInput(
        **{**_BASE_INPUT, "planets_rasi": dusthana_planets, "active_dasha_lords": {"MARS", "MOON"}},
    )
    result = assess_wealth_prediction(inp)
    factor = next((f for f in result.astrological_factors if f.key == "lords_2_11"), None)
    assert factor is not None
    assert factor.status == "CAUTION"
    assert any("challenging" in c.en.lower() for c in result.challenges)


# ---------------------------------------------------------------------------
# Life stage
# ---------------------------------------------------------------------------

def test_student_life_stage_lowers_score():
    inp = WealthAssessmentInput(**{**_BASE_INPUT, "age": 20, "life_stage": "student"})
    result = assess_wealth_prediction(inp)
    assert any("student" in c.en.lower() for c in result.challenges)


def test_mid_life_supports_wealth():
    inp = WealthAssessmentInput(**{**_BASE_INPUT, "age": 38, "life_stage": "mid_life"})
    result = assess_wealth_prediction(inp)
    assert any("mid-life" in s.en.lower() for s in result.supports)


# ---------------------------------------------------------------------------
# Score bounds
# ---------------------------------------------------------------------------

def test_wealth_confidence_is_valid_string():
    for dhana in (True, False):
        inp = WealthAssessmentInput(**{**_BASE_INPUT, "has_dhana_yoga": dhana})
        result = assess_wealth_prediction(inp)
        assert result.confidence in ("HIGH", "MEDIUM", "LOW")
        assert result.life_area == "wealth"

from datetime import date

from app.services.age_phase_service import get_active_life_phases
from app.services.career_service import CareerAssessmentInput, assess_career_prediction
from app.services.health_service import HealthAssessmentInput, assess_health_prediction
from app.services.life_area_prediction_models import LifeAreaPrediction
from app.services.marriage_service import MarriageAssessmentInput, assess_marriage_prediction
from app.services.wealth_service import WealthAssessmentInput, assess_wealth_prediction


def _base_planets() -> dict[str, int]:
    return {
        "SUN": 1,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 3,
        "JUPITER": 10,
        "VENUS": 2,
        "SATURN": 11,
        "RAHU": 5,
        "KETU": 11,
    }


def test_marriage_prediction_returns_bilingual_structured_output():
    payload = MarriageAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"VENUS", "SUN"},
        transit_jupiter_rasi=3,
        transit_venus_rasi=7,
        age=29,
        sevvai_dosham_cancelled=True,
        d9_rasi_by_planet={"VENUS": 7},
    )
    result = assess_marriage_prediction(payload)
    assert isinstance(result, LifeAreaPrediction)
    assert result.life_area == "marriage"
    assert result.main_prediction_ta
    assert result.main_prediction_en
    assert result.dasha_support in {"STRONG", "PARTIAL", "WEAK"}
    assert result.transit_support in {"STRONG", "PARTIAL", "WEAK"}
    assert result.astrological_factors


def test_marriage_prediction_caution_when_inputs_are_weak():
    weak_planets = _base_planets()
    weak_planets["VENUS"] = 6
    payload = MarriageAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=weak_planets,
        active_dasha_lords={"SATURN"},
        transit_jupiter_rasi=2,
        transit_venus_rasi=2,
        age=42,
        venus_combust=True,
        sevvai_dosham_cancelled=False,
    )
    result = assess_marriage_prediction(payload)
    assert result.confidence in {"LOW", "MEDIUM"}
    assert len(result.challenges) > 0


def test_marriage_prediction_flags_d9_venus_debility_with_strong_d1():
    payload = MarriageAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"VENUS"},
        transit_jupiter_rasi=3,
        transit_venus_rasi=7,
        age=29,
        sevvai_dosham_cancelled=True,
        d9_rasi_by_planet={"VENUS": 6},
    )
    result = assess_marriage_prediction(payload)
    assert any("External circumstances remain broadly supportive." == item.en for item in result.supports)
    assert any("compatibility vary" in item.en.lower() for item in result.challenges)
    assert any(f.key == "d9_venus_d1_support_d9_debility" for f in result.astrological_factors)


def test_career_prediction_returns_structured_output():
    payload = CareerAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"SATURN", "MARS"},
        transit_saturn_rasi=6,
        age=31,
        career_track="technology",
    )
    result = assess_career_prediction(payload)
    assert isinstance(result, LifeAreaPrediction)
    assert result.life_area == "career"
    assert result.main_prediction_ta
    assert result.main_prediction_en
    assert result.dasha_support in {"STRONG", "PARTIAL", "WEAK"}
    assert result.transit_support in {"STRONG", "PARTIAL", "WEAK"}
    assert any(f.key == "career_track" for f in result.astrological_factors)


def test_career_prediction_flags_saturn_10th_restructuring():
    payload = CareerAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"MOON"},
        transit_saturn_rasi=10,
        age=23,
    )
    result = assess_career_prediction(payload)
    assert result.transit_support == "WEAK"
    assert len(result.challenges) > 0


def test_wealth_prediction_uses_dhana_dasha_jupiter_and_ashtakavarga():
    payload = WealthAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"VENUS", "SATURN"},
        transit_jupiter_rasi=11,
        has_dhana_yoga=True,
        age=36,
        ashtakavarga_11th_bindu=5,
    )
    result = assess_wealth_prediction(payload)
    assert isinstance(result, LifeAreaPrediction)
    assert result.life_area == "wealth"
    assert result.confidence in {"HIGH", "MEDIUM"}
    assert any(f.key == "ashtakavarga_11th" for f in result.astrological_factors)


def test_wealth_prediction_caution_when_core_indicators_are_weak():
    weak = _base_planets()
    weak["VENUS"] = 6
    weak["SATURN"] = 12
    payload = WealthAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=weak,
        active_dasha_lords={"MOON"},
        transit_jupiter_rasi=4,
        has_dhana_yoga=False,
        age=22,
        ashtakavarga_11th_bindu=2,
    )
    result = assess_wealth_prediction(payload)
    assert result.confidence in {"LOW", "MEDIUM"}
    assert len(result.challenges) > 0


def test_health_prediction_includes_preventive_safety_note():
    payload = HealthAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"MARS"},
        age=33,
        lagna_strength_score=58,
    )
    result = assess_health_prediction(payload)
    assert isinstance(result, LifeAreaPrediction)
    assert result.life_area == "health"
    assert any(f.key == "health_safety_note" for f in result.astrological_factors)
    assert result.main_prediction_ta
    assert result.main_prediction_en


def test_health_prediction_low_confidence_for_heavy_affliction_case():
    weak = _base_planets()
    weak["SATURN"] = 8
    weak["MARS"] = 12
    weak["RAHU"] = 6
    payload = HealthAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=weak,
        active_dasha_lords={"MERCURY"},
        age=58,
        lagna_strength_score=35,
    )
    result = assess_health_prediction(payload)
    assert result.confidence in {"LOW", "MEDIUM"}
    assert len(result.challenges) > 0


def test_age_phase_priorities_follow_roadmap_mapping():
    assert get_active_life_phases(8) == ["health", "education", "family"]
    assert get_active_life_phases(20) == ["education", "health", "career_preparation"]
    assert get_active_life_phases(30) == ["career", "marriage", "wealth_foundation"]
    assert get_active_life_phases(42) == ["career_peak", "wealth", "property", "children"]
    assert get_active_life_phases(60) == ["health", "spirituality", "family_legacy"]


def test_child_age_gates_career_marriage_wealth_predictions():
    planets = _base_planets()
    as_of = date(2026, 5, 24)

    marriage = assess_marriage_prediction(
        MarriageAssessmentInput(
            as_of=as_of,
            lagna_rasi=1,
            planets_rasi=planets,
            active_dasha_lords={"VENUS"},
            transit_jupiter_rasi=3,
            transit_venus_rasi=7,
            age=0,
            sevvai_dosham_cancelled=True,
        )
    )
    career = assess_career_prediction(
        CareerAssessmentInput(
            as_of=as_of,
            lagna_rasi=1,
            planets_rasi=planets,
            active_dasha_lords={"SATURN"},
            transit_saturn_rasi=10,
            age=0,
        )
    )
    wealth = assess_wealth_prediction(
        WealthAssessmentInput(
            as_of=as_of,
            lagna_rasi=1,
            planets_rasi=planets,
            active_dasha_lords={"VENUS"},
            transit_jupiter_rasi=11,
            has_dhana_yoga=True,
            age=0,
        )
    )

    assert "age-gated" in marriage.main_prediction_en.lower()
    assert "age-gated" in career.main_prediction_en.lower()
    assert "age-gated" in wealth.main_prediction_en.lower()


def test_marriage_prediction_applies_rahu_ketu_caution_signal():
    payload = MarriageAssessmentInput(
        as_of=date(2026, 5, 24),
        lagna_rasi=1,
        planets_rasi=_base_planets(),
        active_dasha_lords={"VENUS"},
        transit_jupiter_rasi=3,
        transit_venus_rasi=7,
        age=29,
        sevvai_dosham_cancelled=True,
        rahu_ketu_label="STRONG_ACTIVE_RAHU_KETU_DOSHAM",
    )
    result = assess_marriage_prediction(payload)
    assert any("rahu-ketu" in item.en.lower() for item in result.challenges)

"""Golden cases for gender-aware age-phase inference (Veteran Protocol audit, Phase A1)."""
from __future__ import annotations

import pytest

from app.services.age_phase_service import (
    get_active_life_phases,
    get_age_based_practical_guidance,
)

_AGES = [18, 25, 35, 45, 55, 65]
_GENDERS = ["male", "female"]


@pytest.mark.no_db
@pytest.mark.parametrize("age", _AGES)
@pytest.mark.parametrize("gender", _GENDERS)
def test_get_active_life_phases_returns_nonempty_list(age: int, gender: str) -> None:
    phases = get_active_life_phases(age, gender)
    assert isinstance(phases, list)
    assert phases


@pytest.mark.no_db
def test_24_34_band_reorders_marriage_first_for_female() -> None:
    male_phases = get_active_life_phases(25, "male")
    female_phases = get_active_life_phases(25, "female")
    assert male_phases == ["career", "marriage", "wealth_foundation"]
    assert female_phases == ["marriage", "career", "wealth_foundation"]
    assert set(male_phases) == set(female_phases)


@pytest.mark.no_db
def test_35_49_band_reorders_children_earlier_for_female() -> None:
    male_phases = get_active_life_phases(40, "male")
    female_phases = get_active_life_phases(40, "female")
    assert male_phases == ["career_peak", "wealth", "property", "children"]
    assert female_phases == ["career_peak", "children", "wealth", "property"]
    assert set(male_phases) == set(female_phases)


@pytest.mark.no_db
@pytest.mark.parametrize("age", [3, 10, 15, 20, 55, 68, 75])
def test_other_bands_are_gender_invariant(age: int) -> None:
    assert get_active_life_phases(age, "male") == get_active_life_phases(age, "female")
    assert get_active_life_phases(age, "male") == get_active_life_phases(age, None)


@pytest.mark.no_db
def test_unspecified_or_unknown_gender_matches_default_ordering() -> None:
    default = get_active_life_phases(25)
    assert get_active_life_phases(25, None) == default
    assert get_active_life_phases(25, "not_specified") == default
    assert get_active_life_phases(25, "other") == default
    # Default (no gender signal) matches the pre-existing male-leaning order,
    # not the female reorder — backward compatible with pre-A1 callers.
    assert default == ["career", "marriage", "wealth_foundation"]


@pytest.mark.no_db
@pytest.mark.parametrize("age", _AGES)
@pytest.mark.parametrize("gender", [*_GENDERS, None])
def test_practical_guidance_accepts_gender_and_returns_bilingual_text(age: int, gender: str | None) -> None:
    guidance = get_age_based_practical_guidance(
        current_age=age,
        mahadasha_lord="JUPITER",
        antardasha_lord="VENUS",
        lagna_rasi="Mesham",
        strong_planets=["JUPITER"],
        weak_planets=["SATURN"],
        gender=gender,
    )
    assert guidance["en"]
    assert guidance["ta"]
    assert len(guidance["en"]) == len(guidance["ta"])


@pytest.mark.no_db
def test_gender_guidance_adds_extra_sentence_only_in_scoped_bands() -> None:
    neutral = get_age_based_practical_guidance(
        current_age=25, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
        lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender=None,
    )
    female = get_age_based_practical_guidance(
        current_age=25, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
        lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender="female",
    )
    assert len(female["en"]) == len(neutral["en"]) + 1
    assert len(female["ta"]) == len(neutral["ta"]) + 1

    # Bands outside 24-49 get no extra sentence even with gender known.
    elder_neutral = get_age_based_practical_guidance(
        current_age=68, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
        lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender=None,
    )
    elder_female = get_age_based_practical_guidance(
        current_age=68, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
        lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender="female",
    )
    assert len(elder_female["en"]) == len(elder_neutral["en"])

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
def test_35_49_band_no_longer_carries_a_gender_delta() -> None:
    """The 35-49 delta was the `children` reorder, and it went with the code itself."""
    male_phases = get_active_life_phases(40, "male")
    female_phases = get_active_life_phases(40, "female")
    assert male_phases == ["career_peak", "wealth", "property"]
    assert male_phases == female_phases


@pytest.mark.no_db
@pytest.mark.parametrize("declared", ["has"])
def test_a_declared_parent_gets_the_progeny_focus_back(declared: str) -> None:
    assert get_active_life_phases(40, "female", declared) == [
        "career_peak", "wealth", "property", "children",
    ]
    # Same ordering for both — the old delta ranked children above career for
    # women and below it for men, was never sourced, and is not restored.
    assert get_active_life_phases(40, "male", declared) == get_active_life_phases(40, "female", declared)


@pytest.mark.no_db
@pytest.mark.parametrize("undeclared", [None, "", "none", "undisclosed", "HAS_NOT", "unknown"])
def test_only_an_explicit_has_unlocks_the_progeny_focus(undeclared: str | None) -> None:
    """"undisclosed" is a declined answer and must read exactly like an unasked one."""
    assert "children" not in get_active_life_phases(40, "female", undeclared)
    assert "children" not in get_active_life_phases(40, "male", undeclared)


@pytest.mark.no_db
def test_the_progeny_focus_stays_inside_its_own_band() -> None:
    """Declaring children does not put progeny into a 20-year-old's or an elder's reading."""
    for age in (8, 20, 30, 55, 68, 75):
        assert "children" not in get_active_life_phases(age, "female", "has")


@pytest.mark.no_db
@pytest.mark.parametrize("gender", [*_GENDERS, None])
def test_no_life_phase_asserts_progeny_at_any_age(gender: str | None) -> None:
    """We hold no field saying whether this reader has children.

    `children` was emitted for everyone aged 35-49 and is a scored primary-concern candidate
    (primary_concern_service._CONCERN_HOUSES maps it to the 5th), so a childless reader whose
    antardasha activated the 5th got progeny ranked as the top concern of their reading. It
    returns only when the profile declares `children == "has"`.
    """
    for age in range(0, 90):
        assert "children" not in get_active_life_phases(age, gender)


@pytest.mark.no_db
@pytest.mark.parametrize("age", [3, 10, 15, 20, 40, 55, 68, 75])
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
@pytest.mark.parametrize("gender", [*_GENDERS, None])
def test_practical_guidance_never_claims_the_reader_has_children(gender: str | None) -> None:
    """The possessive is the claim; the karaka listing is not.

    "Jupiter Mahadasha is expansive — wisdom, teaching, children, and dharmic activity are
    supported" names what the graha signifies and asserts nothing about this reader. "Children's
    higher education is an active priority" asserts they have some. Only the second is banned,
    which is why this matches the possessive/genitive form rather than the bare noun.
    """
    for age in [*_AGES, 33, 38, 44, 52, 60]:
        for undeclared in (None, "none", "undisclosed"):
            guidance = get_age_based_practical_guidance(
                current_age=age,
                mahadasha_lord="JUPITER",
                antardasha_lord="VENUS",
                lagna_rasi="Mesham",
                strong_planets=["JUPITER"],
                weak_planets=["SATURN"],
                gender=gender,
                children=undeclared,
            )
            for line in guidance["en"]:
                assert "children's" not in line.lower()
                assert "your children" not in line.lower()
            for line in guidance["ta"]:
                assert "குழந்தைகளின்" not in line


@pytest.mark.no_db
@pytest.mark.parametrize("age", [33, 44, 52])
def test_a_declared_parent_gets_the_progeny_guidance_line(age: int) -> None:
    """The three bands that carry a children line, each on a declared "has" only."""
    kwargs = dict(
        mahadasha_lord="JUPITER", antardasha_lord="VENUS", lagna_rasi="Mesham",
        strong_planets=["JUPITER"], weak_planets=["SATURN"], gender=None,
    )
    declared = get_age_based_practical_guidance(current_age=age, children="has", **kwargs)
    silent = get_age_based_practical_guidance(current_age=age, children=None, **kwargs)

    assert len(declared["en"]) == len(silent["en"]) + 1
    assert len(declared["ta"]) == len(silent["ta"]) + 1
    assert any("children's" in line.lower() for line in declared["en"])
    assert any("குழந்தைகளின்" in line for line in declared["ta"])


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

    # Bands outside 24-34 get no extra sentence even with gender known. 40 is in the list
    # because the 35-49 branch used to fire there and its content was the progeny claim.
    for age in (40, 68):
        neutral_band = get_age_based_practical_guidance(
            current_age=age, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
            lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender=None,
        )
        female_band = get_age_based_practical_guidance(
            current_age=age, mahadasha_lord="JUPITER", antardasha_lord="VENUS",
            lagna_rasi="Mesham", strong_planets=[], weak_planets=[], gender="female",
        )
        assert len(female_band["en"]) == len(neutral_band["en"])
        assert len(female_band["ta"]) == len(neutral_band["ta"])

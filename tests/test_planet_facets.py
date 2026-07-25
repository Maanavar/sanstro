"""Planet reading facets: the split of one dense paragraph into labelled lines,
plus the practical translation of retrograde / combustion / Navamsa dignity.
"""
from __future__ import annotations

import pytest

from app.calculations.planet_conditions import COMBUST_MEANING, RETROGRADE_MEANING
from app.schemas.charts import PlanetPosition
from app.services.chart_explanation_service import (
    _functional_context_en,
    _functional_context_ta,
    _planet_condition_states,
    _planet_facets,
)


def _planet(
    graha: str,
    house: int,
    rasi: int,
    d9_rasi: int,
    *,
    combust: bool = False,
    retro: bool = False,
    cazimi: bool = False,
    vargottama: bool = False,
) -> PlanetPosition:
    return PlanetPosition(
        graha=graha,
        rasiName="Kadagam",
        absoluteLongitude=rasi * 30 + 5.0,
        rasi=rasi,
        degreeInRasi=5.0,
        nakshatra=8,
        nakshatraName="Pusam",
        pada=2,
        houseFromLagna=house,
        speedDegPerDay=1.0,
        isRetrograde=retro,
        isCombust=combust,
        isCazimi=cazimi,
        d9Rasi=d9_rasi,
        isVargottama=vargottama,
        showRetrogradeBadge=retro,
        strengthScore=55,
    )


def _facets(
    planet: PlanetPosition,
    fn: str = "KENDRA",
    *,
    current_role: str | None = None,
    dignity: str = "OWN_SIGN",
    minor: bool = False,
    war_opponent: str | None = None,
    war_lost: bool = False,
    co_tenants: list[str] | None = None,
    owned_houses: list[int] | None = None,
    stage: str = "ADULT",
):
    states = _planet_condition_states(
        planet,
        minor=minor,
        war_opponent=war_opponent,
        war_lost=war_lost,
        war_separation=0.4,
    )
    return _planet_facets(
        planet,
        dignity,
        fn,
        current_role=current_role,
        dasha_chain_ta="சுக்கிரன் மகாதசை",
        dasha_chain_en="Venus Mahadasha",
        fn_context_ta=_functional_context_ta(fn),
        fn_context_en=_functional_context_en(fn),
        transit_contact_text=None,
        condition_states=states,
        co_tenants=co_tenants or [],
        owned_houses=owned_houses or [],
        stage=stage,
    )


def _by_key(facets, key: str):
    return next((f for f in facets if f.key == key), None)


@pytest.mark.no_db
def test_core_facets_are_always_present() -> None:
    facets = _facets(_planet("MERCURY", 3, 3, 5))
    keys = [f.key for f in facets]
    for required in ("placement", "role", "strength", "activation"):
        assert required in keys, f"{required} facet missing"


@pytest.mark.no_db
def test_every_facet_is_bilingual_and_non_empty() -> None:
    facets = _facets(_planet("MERCURY", 3, 3, 5, combust=True))
    for facet in facets:
        assert facet.label.ta.strip() and facet.label.en.strip(), f"{facet.key} label incomplete"
        assert facet.value.ta.strip() and facet.value.en.strip(), f"{facet.key} value incomplete"
        assert facet.tone in {"NEUTRAL", "BOOST", "CAUTION"}, f"{facet.key} has tone {facet.tone!r}"


@pytest.mark.no_db
def test_combust_mercury_explains_the_communication_effect() -> None:
    """A badge reading "Combust" is not an explanation. The facet must say what
    it means for the person — and say something Mercury-specific."""
    facets = _facets(_planet("MERCURY", 3, 3, 5, combust=True))
    condition = _by_key(facets, "condition")
    assert condition is not None, "combust planet produced no condition facet"
    assert condition.tone == "CAUTION"
    assert COMBUST_MEANING["MERCURY"][1] in condition.value.en
    # Mercury's combustion reads on communication, not on some generic weakness.
    assert "mean" in condition.value.en.lower() or "message" in condition.value.en.lower()


@pytest.mark.no_db
def test_combustion_meaning_is_planet_specific() -> None:
    mercury = _by_key(_facets(_planet("MERCURY", 3, 3, 5, combust=True)), "condition")
    venus = _by_key(_facets(_planet("VENUS", 7, 2, 5, combust=True)), "condition")
    assert mercury is not None and venus is not None
    assert mercury.value.en != venus.value.en, (
        "combustion rendered the same sentence for Mercury and Venus — the "
        "per-planet split is what makes this line useful"
    )


@pytest.mark.no_db
def test_d9_debilitation_surfaces_as_a_caution() -> None:
    """Jupiter exalted in Cancer (4) but debilitated in Capricorn (10) in D9 —
    the gap the strength scorer now penalises must also be stated in words."""
    facets = _facets(_planet("JUPITER", 9, 4, 10), fn="TRIKONA")
    condition = _by_key(facets, "condition")
    assert condition is not None
    assert condition.tone == "CAUTION"
    assert "Navamsa" in condition.value.en


@pytest.mark.no_db
def test_vargottama_outranks_d9_debilitation_and_reads_as_a_boost() -> None:
    """Vargottama is exempt from the D9 debilitation penalty in the scorer, so
    the prose must not contradict the number by calling it a caution."""
    facets = _facets(_planet("JUPITER", 9, 10, 10, vargottama=True), fn="TRIKONA")
    condition = _by_key(facets, "condition")
    assert condition is not None
    assert condition.tone == "BOOST"
    assert "vargottama" in condition.value.en.lower()


@pytest.mark.no_db
def test_cazimi_outranks_combustion() -> None:
    """Cazimi inverts combustion, so a planet flagged both ways must read as a
    boost rather than reporting the penalty it is exempt from."""
    facets = _facets(_planet("MERCURY", 3, 3, 5, combust=True, cazimi=True))
    condition = _by_key(facets, "condition")
    assert condition is not None
    assert condition.tone == "BOOST"
    assert "cazimi" in condition.value.en.lower()


@pytest.mark.no_db
def test_retrograde_is_not_framed_as_a_problem() -> None:
    """Retrograde planets are awarded chesta bala by the scorer. The prose must
    not call a strength a weakness.

    This Saturn is ALSO dignified in the Navamsa (exalted in Thulam), so the
    composed condition line carries both and the net tone is a boost. The
    invariant that matters is unchanged: retrogression never reads as a caution.
    """
    facets = _facets(_planet("SATURN", 10, 10, 7, retro=True))
    condition = _by_key(facets, "condition")
    assert condition is not None
    assert condition.tone != "CAUTION", "retrograde should not be flagged as a caution"
    assert RETROGRADE_MEANING["SATURN"][1] in condition.value.en


@pytest.mark.no_db
def test_nodes_have_no_retrograde_facet() -> None:
    """Rahu and Ketu are always retrograde, so the flag distinguishes nothing
    and must not produce a line implying it does."""
    for node in ("RAHU", "KETU"):
        facets = _facets(_planet(node, 5, 5, 5, retro=True))
        condition = _by_key(facets, "condition")
        if condition is not None:
            assert "retrograde" not in condition.value.en.lower(), (
                f"{node} produced a retrograde note despite being perpetually retrograde"
            )


@pytest.mark.no_db
def test_running_dasha_lord_is_marked_as_active() -> None:
    facets = _facets(_planet("MERCURY", 3, 3, 5), current_role="MAHADASHA")
    activation = _by_key(facets, "activation")
    assert activation is not None
    assert activation.tone == "BOOST"
    assert "Mahadasha" in activation.value.en

"""F-KAR-01 — the two karaka tables must not drift apart again.

Ground-truth audit 2026-10-13. `karaka_chains.LIFE_AREA_KARAKA` and
`life_areas_service._AREA_KARAKA` both say which grahas signify a life area,
and they disagreed on three of the eight areas they share: Property
(Moon/Mars vs Mars/Venus), Career (Sun/Mercury/Saturn vs Saturn/Sun) and
Health (Sun/Moon vs Sun/Mars).

`karaka_chains` is the single source; this pins the agreement.
"""
from __future__ import annotations

import pytest

from app.calculations.karaka_chains import LIFE_AREA_KARAKA
from app.services.life_areas_service import _AREA_KARAKA

pytestmark = pytest.mark.no_db

#: The two modules name the same areas differently. Spelled out rather than
#: fuzzy-matched so adding an area forces a deliberate decision about whether
#: it has a twin.
_ALIASES: dict[str, str] = {
    "MARRIAGE": "RELATIONSHIPS",
    "FINANCE": "MONEY",
    "FOREIGN_TRAVEL": "FOREIGN",
}


def _twin(area: str) -> str:
    return _ALIASES.get(area, area)


SHARED_AREAS = sorted(a for a in LIFE_AREA_KARAKA if _twin(a) in _AREA_KARAKA)


def test_the_two_tables_actually_share_areas() -> None:
    """Guards the guard: if the alias map rots, every test below would pass
    vacuously by comparing nothing."""
    assert len(SHARED_AREAS) >= 8


@pytest.mark.parametrize("area", SHARED_AREAS)
def test_primary_and_secondary_karaka_agree(area: str) -> None:
    """The first two are compared, not the whole list: `karaka_chains` may
    carry a third karaka for depth (Career has Mercury), but the primary and
    secondary — the two that drive the strength average — must match."""
    chains = LIFE_AREA_KARAKA[area]["karaka_planets"]
    service = _AREA_KARAKA[_twin(area)]
    assert chains[:2] == service[:2], (
        f"{area}: karaka_chains says {chains[:2]}, "
        f"life_areas_service[{_twin(area)}] says {service[:2]}"
    )


@pytest.mark.parametrize("area", SHARED_AREAS)
def test_the_service_list_is_a_prefix_of_the_classical_chain(area: str) -> None:
    """Where the service names fewer karakas it must name the *first* ones,
    not a different subset — dropping the primary and keeping the secondary
    is the failure mode this catches."""
    chains = LIFE_AREA_KARAKA[area]["karaka_planets"]
    service = _AREA_KARAKA[_twin(area)]
    shorter = min(len(chains), len(service))
    assert chains[:shorter] == service[:shorter]


def test_property_is_not_signified_by_venus() -> None:
    """The specific correction the audit named. Venus signifies vehicles and
    luxury, not immovable property.

    Mars stays primary (bhumi karaka) with the Moon second (4th bhava
    karaka). Leading with the Moon is equally defensible doctrine but moved a
    measured chart's Property score 22 -> 63, so the order is left where it
    does not move live readings until a ruling says otherwise.
    """
    assert LIFE_AREA_KARAKA["PROPERTY"]["karaka_planets"][:2] == ["MARS", "MOON"]
    assert "VENUS" not in _AREA_KARAKA["PROPERTY"]
    assert "VENUS" not in LIFE_AREA_KARAKA["PROPERTY"]["karaka_planets"]


def test_career_leads_with_the_karma_karaka() -> None:
    assert LIFE_AREA_KARAKA["CAREER"]["karaka_planets"][0] == "SATURN"

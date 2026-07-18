"""Unit tests for the family-harmony remedy synthesizer.

Pure-function tests — no DB. Uses clearly-synthetic identities (Test Father /
Test Mother / Test Child), never real birth data.
"""
from __future__ import annotations

import pytest

from app.calculations.family_harmony_remedies import (
    MemberChartInput,
    MemberPlanet,
    synthesize_family_harmony_remedies,
)

# Pure synthesizer tests — no DB, no I/O.
pytestmark = pytest.mark.no_db


def _mp(
    graha: str,
    house: int,
    *,
    rasi: int = 1,
    combust: bool = False,
    retro: bool = False,
    strength: int = 60,
) -> MemberPlanet:
    return MemberPlanet(
        graha=graha,
        house_from_lagna=house,
        rasi=rasi,
        is_combust=combust,
        is_retrograde=retro,
        strength_score=strength,
    )


def _base_planets() -> list[MemberPlanet]:
    """A neutral 9-graha set; individual tests override specific planets."""
    return [
        _mp("SUN", 1),
        _mp("MOON", 4),
        _mp("MARS", 3),
        _mp("MERCURY", 2),
        _mp("JUPITER", 9),
        _mp("VENUS", 7),
        _mp("SATURN", 10),
        _mp("RAHU", 6),
        _mp("KETU", 12),
    ]


def _with(planets: list[MemberPlanet], *overrides: MemberPlanet) -> tuple[MemberPlanet, ...]:
    by_graha = {p.graha: p for p in planets}
    for o in overrides:
        by_graha[o.graha] = o
    return tuple(by_graha.values())


def _household() -> list[MemberChartInput]:
    """Mirrors the shared example: Mercury combust in father + child, Venus
    combust in mother, Ketu in the 7th (mother) and 2nd (father), a
    retrograde-heavy household, and a weak Mercury in the child."""
    mother = MemberChartInput(
        display_name="Test Mother",
        relationship="self",
        is_minor=False,
        lagna_rasi=1,
        planets=_with(
            _base_planets(),
            _mp("VENUS", 7, combust=True),
            _mp("KETU", 7),
            _mp("SATURN", 10, retro=True),
            _mp("JUPITER", 9, retro=True),
        ),
    )
    father = MemberChartInput(
        display_name="Test Father",
        relationship="spouse",
        is_minor=False,
        lagna_rasi=5,
        planets=_with(
            _base_planets(),
            _mp("MERCURY", 11, combust=True),
            _mp("KETU", 2),
            _mp("MARS", 3, retro=True),
            _mp("VENUS", 10, retro=True),
        ),
    )
    child = MemberChartInput(
        display_name="Test Child",
        relationship="child",
        is_minor=True,
        lagna_rasi=9,
        planets=_with(
            _base_planets(),
            _mp("MERCURY", 7, combust=True, strength=30),
            _mp("JUPITER", 1, strength=88),
            _mp("SATURN", 6, retro=True),
        ),
    )
    return [mother, father, child]


def test_shared_mercury_combustion_names_both_charts() -> None:
    items = synthesize_family_harmony_remedies(_household())
    mercury = [i for i in items if i.signal == "COMBUST_SHARED" and i.planet == "MERCURY"]
    assert len(mercury) == 1
    item = mercury[0]
    # Grounded: it names exactly the two charts Mercury is combust in.
    assert set(item.members) == {"Test Father", "Test Child"}
    assert "SHARED_ACROSS_FAMILY" in item.tags
    # Warm, but never a guarantee.
    assert "நீக்கும்" not in item.remedy_ta
    assert "guarantee" not in item.remedy_en.lower()


def test_single_chart_venus_combustion() -> None:
    items = synthesize_family_harmony_remedies(_household())
    venus = [i for i in items if i.signal == "COMBUST_SHARED" and i.planet == "VENUS"]
    assert len(venus) == 1
    assert venus[0].members == ["Test Mother"]
    assert "SHARED_ACROSS_FAMILY" not in venus[0].tags


def test_node_friction_only_for_relational_charts() -> None:
    items = synthesize_family_harmony_remedies(_household())
    nodes = [i for i in items if i.signal == "NODE_FRICTION"]
    # Ketu in 7th (mother, self) and 2nd (father, spouse) — both relational.
    member_names = {m for i in nodes for m in i.members}
    assert member_names == {"Test Mother", "Test Father"}
    # The child's nodes must NOT produce a friction remedy (child is not a
    # relational-field role, even though the child has Ketu in the 12th).
    assert "Test Child" not in member_names
    assert all(i.planet in {"RAHU", "KETU"} for i in nodes)


def test_child_weak_planet_attributed_to_the_child() -> None:
    items = synthesize_family_harmony_remedies(_household())
    weak = [i for i in items if i.signal == "CHILD_WEAK_PLANET"]
    assert len(weak) == 1
    assert weak[0].members == ["Test Child"]
    assert weak[0].planet == "MERCURY"
    assert "FOR_CHILD" in weak[0].tags


def test_retrograde_load_triggers_and_lists_affected_members() -> None:
    items = synthesize_family_harmony_remedies(_household())
    retro = [i for i in items if i.signal == "RETROGRADE_LOAD"]
    assert len(retro) == 1
    # Every member here carries at least one vakra planet.
    assert set(retro[0].members) == {"Test Mother", "Test Father", "Test Child"}


def test_items_sorted_by_priority() -> None:
    items = synthesize_family_harmony_remedies(_household())
    priorities = [i.priority for i in items]
    assert priorities == sorted(priorities)


def test_no_signals_returns_empty_list() -> None:
    # Base set has nothing combust/retrograde and both nodes in non-relational
    # houses (Rahu 6th, Ketu 12th), so no signal should fire.
    calm = MemberChartInput(
        display_name="Test Solo",
        relationship="self",
        is_minor=False,
        lagna_rasi=1,
        planets=tuple(_base_planets()),
    )
    assert synthesize_family_harmony_remedies([calm]) == []


def test_empty_household() -> None:
    assert synthesize_family_harmony_remedies([]) == []

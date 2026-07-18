"""Dasha-lord bhava activation — connection-match, not identity-match.

Classical rule (Parashara dasha-phala, standard Tamil Thirukanitham
practice): a dasha lord delivers a bhava's results not only when it *is*
that bhava's lord or the area karaka, but whenever it is *connected* to
the bhava —

  - it owns the primary bhava or a related house (e.g. 2/7/11 for marriage),
  - it occupies the primary bhava in the natal chart,
  - it aspects the primary bhava (shared special-aspect table, aspects.py),
  - it is the dispositor of the bhava lord (the lord stands in its sign),
  - Rahu/Ketu, owning nothing, act as *agents*: they deliver the results
    of their dispositor and of planets conjoined with them.

The pre-existing engines only identity-matched (dasha lord == bhava lord
or karaka), which misses most classically event-giving dashas. This
module is the single shared upgrade consumed by marriage_service,
career_service, life_areas_service, and event_windows.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass

from app.calculations.aspects import aspects_house
from app.calculations.chart_strength import SIGN_LORD

_NODES: frozenset[str] = frozenset({"RAHU", "KETU"})

# Connections that on their own mark a mahadasha as a STRONG activator.
_PRIMARY_CONNECTIONS: frozenset[str] = frozenset(
    {"lords_bhava", "lords_related_house", "is_karaka", "occupies_bhava"}
)


@dataclass(frozen=True, slots=True)
class DashaActivation:
    activated: bool
    strength: str  # "STRONG" | "MODERATE" | "NONE"
    # e.g. ("maha:VENUS:lords_bhava", "antar:RAHU:node_agent_of_VENUS")
    connections: tuple[str, ...]


def _bhava_rasi(lagna_rasi: int, house: int) -> int:
    return ((lagna_rasi + house - 2) % 12) + 1


def _direct_connections(
    planet: str,
    planet_rasi: int | None,
    *,
    bhava_rasi: int,
    bhava_lord: str,
    bhava_lord_rasi: int | None,
    related_lords: frozenset[str],
    karakas: frozenset[str],
) -> list[str]:
    kinds: list[str] = []
    if planet == bhava_lord:
        kinds.append("lords_bhava")
    elif planet in related_lords:
        kinds.append("lords_related_house")
    if planet in karakas:
        kinds.append("is_karaka")
    if planet_rasi is not None:
        if planet_rasi == bhava_rasi:
            kinds.append("occupies_bhava")
        elif aspects_house(planet, planet_rasi, bhava_rasi):
            kinds.append("aspects_bhava")
        if bhava_lord_rasi is not None and SIGN_LORD.get(bhava_lord_rasi) == planet:
            kinds.append("dispositor_of_bhava_lord")
    return kinds


def assess_dasha_activation(
    *,
    lagna_rasi: int,
    bhava_house: int,
    dasha_lords: Sequence[str],
    natal_planet_rasis: dict[str, int],
    karakas: Iterable[str] = (),
    related_houses: Iterable[int] = (),
) -> DashaActivation:
    """Assess whether the running dasha activates a bhava.

    ``dasha_lords`` is ordered — mahadasha lord first, antardasha lord
    second (extra levels are treated like antardasha). ``related_houses``
    are supporting houses for the event (marriage: 2 and 11 alongside the
    7th) whose lordship also counts as a connection.
    """
    bhava_rasi = _bhava_rasi(lagna_rasi, bhava_house)
    bhava_lord = SIGN_LORD.get(bhava_rasi, "SUN")
    bhava_lord_rasi = natal_planet_rasis.get(bhava_lord)
    karaka_set = frozenset(karakas)
    related_lords = frozenset(
        SIGN_LORD[_bhava_rasi(lagna_rasi, house)]
        for house in related_houses
        if house != bhava_house
    )

    connections: list[str] = []
    per_lord_kinds: list[tuple[str, list[str]]] = []
    for index, lord in enumerate(dasha_lords):
        level = "maha" if index == 0 else "antar"
        kinds = _direct_connections(
            lord,
            natal_planet_rasis.get(lord),
            bhava_rasi=bhava_rasi,
            bhava_lord=bhava_lord,
            bhava_lord_rasi=bhava_lord_rasi,
            related_lords=related_lords,
            karakas=karaka_set,
        )
        # Node agency: Rahu/Ketu deliver their dispositor's and their
        # co-tenants' results — but only primary connections transfer
        # (an agent of an aspecting planet is too indirect to count).
        if lord in _NODES:
            node_rasi = natal_planet_rasis.get(lord)
            agents: set[str] = set()
            if node_rasi is not None:
                agents.add(SIGN_LORD.get(node_rasi, ""))
                agents.update(
                    p for p, r in natal_planet_rasis.items()
                    if r == node_rasi and p not in _NODES
                )
            for agent in sorted(agents - {""}):
                agent_kinds = _direct_connections(
                    agent,
                    natal_planet_rasis.get(agent),
                    bhava_rasi=bhava_rasi,
                    bhava_lord=bhava_lord,
                    bhava_lord_rasi=bhava_lord_rasi,
                    related_lords=related_lords,
                    karakas=karaka_set,
                )
                if any(kind in _PRIMARY_CONNECTIONS for kind in agent_kinds):
                    kinds.append(f"node_agent_of_{agent}")
        per_lord_kinds.append((level, kinds))
        connections.extend(f"{level}:{lord}:{kind}" for kind in kinds)

    if not connections:
        return DashaActivation(activated=False, strength="NONE", connections=())

    maha_kinds = per_lord_kinds[0][1] if per_lord_kinds else []
    maha_primary = any(
        kind in _PRIMARY_CONNECTIONS or kind.startswith("node_agent_of_")
        for kind in maha_kinds
    )
    levels_connected = {level for level, kinds in per_lord_kinds if kinds}
    if maha_primary or {"maha", "antar"} <= levels_connected:
        strength = "STRONG"
    else:
        strength = "MODERATE"
    return DashaActivation(activated=True, strength=strength, connections=tuple(connections))

"""One transit house-score table, derived from the classical gochara sets.

F-SCO-01 / F-SCO-02 (ground-truth audit 2026-10-13). There were **three**
hand-typed copies of "how good is this planet in this house from the Janma
Rasi":

* `app/services/_dg_scoring.py` ``TRANSIT_BASE_SCORE`` — the Today score
* `app/services/life_areas_service.py` ``_*_HOUSE_SCORE``
* `app/services/whatif_service.py` ``_*_HOUSE_SCORE``

They disagreed with each other — Jupiter 7th 68 vs 74, Moon 4th 48 vs 65, Rahu
6th 44 vs 58, Ketu 12th 38 vs 62 — so the same transit was graded differently
on Today, Life Areas and What-if. And all three disagreed with classical
gochara, which `gochara_grade.py` already encodes correctly for the surfaces
that show a *grade*: Saturn in the 10th (Kandaka, adverse) scored the same 62
as Saturn in the 3rd (favourable); Rahu and Ketu scored **below neutral** in
3/6/11, their three best houses; the Moon's highest score of all, 64, was the
9th, which is not one of its favourable houses.

The result a reader saw: the Today score could rise while the Transits card
beside it said the same planet "needs care".

**The fix is not a fourth hand-typed table.** The numbers below are *derived*
from `GOCHARA_FAVOURABLE_FROM_MOON` by `_derive`, so a house either is or is
not favourable for a graha and the score follows. There is nowhere left to
type a number that contradicts the doctrine, and `gochara_grade.py` and this
module are checked against each other in
`tests/test_gochara_scores.py`.
"""

from __future__ import annotations

from collections.abc import Mapping
from types import MappingProxyType

#: Classical gochara — the houses **from the Janma Rasi** in which each graha
#: transits favourably (Phaladeepika; the same sets every Tamil almanac's
#: rasi-palan column uses). Everything not listed is adverse for that graha.
#:
#: Note what is *not* uniform here, because the old hand-typed tables flattened
#: exactly this: Mercury and Venus are favourable in the 8th, which no other
#: graha is; Venus is favourable in nine of the twelve; the three malefics and
#: both nodes share the upachaya set 3/6/11.
GOCHARA_FAVOURABLE_FROM_MOON: Mapping[str, frozenset[int]] = MappingProxyType({
    "SUN":     frozenset({3, 6, 10, 11}),
    "MOON":    frozenset({1, 3, 6, 7, 10, 11}),
    "MARS":    frozenset({3, 6, 11}),
    "MERCURY": frozenset({2, 4, 6, 8, 10, 11}),
    "JUPITER": frozenset({2, 5, 7, 9, 11}),
    "VENUS":   frozenset({1, 2, 3, 4, 5, 8, 9, 11, 12}),
    "SATURN":  frozenset({3, 6, 11}),
    "RAHU":    frozenset({3, 6, 11}),
    "KETU":    frozenset({3, 6, 11}),
})

#: **On the flatness.** Every favourable house scores the same 68 and every
#: adverse one the same 38, which is coarser than the tables this replaced
#: (Jupiter 9th was 82, Jupiter 5th 78). That is deliberate: classical gochara
#: *is* binary per house. The resolution between two favourable transits comes
#: from the two classical modifiers, and both are already wired —
#: **Ashtakavarga bindus** of the transited sign (`_dg_scoring` applies +/-8)
#: and **gochara vedha** (`transits.VEDHA_TABLE`). Those are per-chart and
#: per-day; the 82-vs-78 gradation was neither, and had no rule behind it.
#:
#: 50 is neutral on every surface that consumes this (`life_areas_service`
#: subtracts 50 to get a delta; `_dg_scoring` clamps to 10..90 after an
#: Ashtakavarga adjustment of +/-8). Keep that meaning.
NEUTRAL = 50

_FAVOURABLE_BASE = 68
_ADVERSE_BASE = 38

# Two named accents on top of the two bands, and deliberately only two. Every
# further gradation the old tables carried was a hand-typed opinion with no
# rule behind it, which is how they drifted apart in the first place.
#
#   * The 11th (லாபம்) is the strongest transit house for every graha without
#     exception, and it is favourable for every graha in the table above.
#   * The 8th (அஷ்டமம்) is the heaviest — but only where it is *already*
#     adverse. Mercury and Venus are classically favourable in the 8th, and
#     overriding that here would re-introduce the flattening this module
#     exists to remove.
_LABHA_BONUS = 8
_ASHTAMA_PENALTY = 10


def _derive(planet: str, house: int) -> int:
    favourable = house in GOCHARA_FAVOURABLE_FROM_MOON[planet]
    score = _FAVOURABLE_BASE if favourable else _ADVERSE_BASE
    if house == 11 and favourable:
        score += _LABHA_BONUS
    if house == 8 and not favourable:
        score -= _ASHTAMA_PENALTY
    return score


#: planet -> house-from-Moon (1-12) -> score 0-100, 50 neutral.
GOCHARA_HOUSE_SCORE: Mapping[str, Mapping[int, int]] = MappingProxyType({
    planet: MappingProxyType({house: _derive(planet, house) for house in range(1, 13)})
    for planet in GOCHARA_FAVOURABLE_FROM_MOON
})


def gochara_house_score(planet: str, house_from_moon: int) -> int:
    """This graha's transit score in this house from the Janma Rasi.

    `NEUTRAL` for a graha with no gochara table (the outer planets, and any
    name a caller invents) rather than a guess — a planet we do not grade must
    not move a score in either direction.
    """
    table = GOCHARA_HOUSE_SCORE.get(planet.upper())
    if table is None:
        return NEUTRAL
    return table.get(house_from_moon, NEUTRAL)


def is_favourable_gochara(planet: str, house_from_moon: int) -> bool:
    """Whether this transit is in one of the graha's favourable houses."""
    return house_from_moon in GOCHARA_FAVOURABLE_FROM_MOON.get(planet.upper(), frozenset())

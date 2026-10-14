"""Is the lagna lord *balāḍhya*? (DOCTRINE_DECISIONS v1.3, DD-02)

BPHS asks only that the lagna lord be balāḍhya — endowed with strength — and
gives no list of conditions. Everything in this module is therefore Vinaadi's
translation of that one word (Tier C). None of the terms below is a classical
prohibition, and the threshold is open item O-8.

The model starts from the composite natal score, which already carries most of
what DD-02 lists — dignity, the six-bala components, house strength, aspect
support and affliction, the combustion gradient and the graha-yuddham loss. It
then adds only what that score does not hold:

* a 6/8/12 placement penalty, waived in own or exaltation sign;
* a penalty for serious malefic company (Sani, Sevvai, Rahu or Ketu in the sign);
* a cap for debility without a valid neecha bhanga, so an unrelated high
  component cannot carry a debilitated lord over the line.

The 6/8/12 term overlaps the composite's own house weighting. DD-02 asks for it
explicitly, with its own-sign waiver, so it stays; calibrate it under O-8.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    OWN_SIGN_RASI,
    SIGN_LORD,
    neecha_bhanga_cancelled,
)
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions

DUSTHANA_PLACEMENT_PENALTY = 8
MALEFIC_COMPANY_PENALTY = 6
#: A debilitated lord without a valid bhanga can never score above this. It sits
#: below the default threshold (60) on purpose; raising the threshold under O-8
#: keeps it below.
DEBILITY_CAP = 45
_SERIOUS_MALEFICS = ("SATURN", "MARS", "RAHU", "KETU")


@dataclass(frozen=True, slots=True)
class LagnaLordStrength:
    lord: str
    score: int
    #: (term, points), in the order applied. The composite score comes first.
    components: tuple[tuple[str, int], ...]
    debility_capped: bool

    def is_baladhya(self, options: DoctrineOptions = DEFAULT_DOCTRINE) -> bool:
        return self.score >= options.o8_lagna_lord_threshold


def lagna_lord_strength(
    lagna_rasi: int,
    planets_rasi: Mapping[str, int],
    planet_scores: Mapping[str, int],
    *,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    options: DoctrineOptions = DEFAULT_DOCTRINE,
) -> LagnaLordStrength:
    lord = SIGN_LORD[lagna_rasi]
    base = int(planet_scores.get(lord, 50))
    components: list[tuple[str, int]] = [("composite", base)]
    rasi = planets_rasi.get(lord)
    if rasi is None:
        return LagnaLordStrength(lord, base, tuple(components), False)

    dignified = rasi in OWN_SIGN_RASI.get(lord, frozenset()) or rasi == EXALTATION_RASI.get(lord)
    if house_from_reference(lagna_rasi, rasi) in {6, 8, 12} and not dignified:
        components.append(("dusthana_placement", -DUSTHANA_PLACEMENT_PENALTY))
    if any(planets_rasi.get(m) == rasi for m in _SERIOUS_MALEFICS if m != lord):
        components.append(("malefic_company", -MALEFIC_COMPANY_PENALTY))

    score = sum(points for _term, points in components)
    capped = False
    if rasi == DEBILITATION_RASI.get(lord):
        bhanga, _ = neecha_bhanga_cancelled(
            lord,
            planet_rasi=planets_rasi,
            lagna_rasi=lagna_rasi,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
            options=options,
        )
        if not bhanga and score > DEBILITY_CAP:
            components.append(("debility_cap", DEBILITY_CAP - score))
            score = DEBILITY_CAP
            capped = True
    return LagnaLordStrength(lord, max(0, min(100, score)), tuple(components), capped)

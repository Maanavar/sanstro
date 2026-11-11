"""FAA-30 joint-line prevalence (OWNER-Q-D4), on a synthetic population.

No people and no birth data: random instants in 1994-2000 (the real sky) and a
random lagna sign per chart. Combustion follows the chart build (the orb from
``transits.is_combust``, cazimi excluded) and the paksha comes from the Sun and
Moon longitudes, so the conditional Moon is classed as production classes it.
The 11-12 scratch run left combustion out, which undercounted every variant
that reads the 8th lord's condition.

    python -I scripts/audit/faa30_joint_measurements.py [N] [SEED]

A prevalence of the rule as coded, not a ratification of it.
"""
from __future__ import annotations

import random
import sys
from collections import Counter
from collections.abc import Callable
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.calculations.aspects import moon_is_natural_benefic  # noqa: E402
from app.calculations.ephemeris import calculate_sidereal_planets  # noqa: E402
from app.calculations.mangalya_sthana import EighthHouseChart, EighthHouseReading, one_chart  # noqa: E402
from app.calculations.transits import is_cazimi, is_combust  # noqa: E402

_GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
LO, HI = 2_449_353.5, 2_451_544.5  # 1994-01-01 .. 2000-01-01 (JD)


def chart(rng: random.Random, *, with_combustion: bool = True) -> EighthHouseChart:
    snap = calculate_sidereal_planets(rng.uniform(LO, HI))
    bodies = {g: b for g, b in snap.bodies.items() if g in _GRAHAS}
    sun = bodies["SUN"].absolute_longitude
    combust = frozenset(
        g for g, b in bodies.items()
        if is_combust(g, b.absolute_longitude, sun, b.is_retrograde) and not is_cazimi(g, b.absolute_longitude, sun)
    ) if with_combustion else frozenset()
    return EighthHouseChart(
        lagna_rasi=rng.randint(1, 12),
        planet_rasi={g: b.rasi for g, b in bodies.items()},
        combust=combust,
        paksha_is_shukla=moon_is_natural_benefic((bodies["MOON"].absolute_longitude - sun) % 360.0),
    )


def occupant(r: EighthHouseReading, ref: str) -> bool:
    return any(f.kind == "OCCUPANT" and f.reference == ref and f.nature == "MALEFIC" and not f.own_house for f in r.factors)


def joined(r: EighthHouseReading, ref: str) -> bool:
    return any(f.kind == "INFLUENCE" and f.via == "CONJUNCT" and f.reference == ref for f in r.factors)


def lord_condition(r: EighthHouseReading, ref: str) -> bool:
    return any(f.kind == "LORD" and f.reference == ref and (f.dignity == "DEBILITATED" or f.combust) for f in r.factors)


def aspected(r: EighthHouseReading, ref: str) -> bool:
    return any(f.kind == "INFLUENCE" and f.via == "ASPECT" and f.reference == ref and not f.own_house for f in r.factors)


REFS = ("LAGNA", "MOON")
VARIANTS: dict[str, Callable[[EighthHouseReading], bool]] = {
    "pre-D4 live (aspects included, both 8ths)": lambda r: any(
        occupant(r, x) or joined(r, x) or lord_condition(r, x) or aspected(r, x) for x in REFS),
    "A  both 8ths: occupant | joined | lord's condition": lambda r: any(
        occupant(r, x) or joined(r, x) or lord_condition(r, x) for x in REFS),
    "D  lagna 8th: occupant | lord's condition": lambda r: occupant(r, "LAGNA") or lord_condition(r, "LAGNA"),
    "E1 lagna 8th: a malefic in it": lambda r: occupant(r, "LAGNA"),
    "E2 lagna 8th lord: debilitated or combust": lambda r: lord_condition(r, "LAGNA"),
    "E2 lagna 8th lord: debilitated only": lambda r: any(
        f.kind == "LORD" and f.reference == "LAGNA" and f.dignity == "DEBILITATED" for f in r.factors),
    # As built (OWNER-Q-D4 = E): the engine's own facts. Must equal E1 / E2.
    "as built: MALEFIC_IN_EIGHTH": lambda r: r.malefic_in_lagna_eighth,
    "as built: EIGHTH_LORD_DEBILITATED_OR_COMBUST": lambda r: r.lagna_eighth_lord_debilitated_or_combust,
}


def main(n: int = 2000, seed: int = 30) -> None:
    rng = random.Random(seed)  # noqa: S311 - a reproducible synthetic population, not a secret
    both: Counter[str] = Counter()
    single: Counter[str] = Counter()
    for _ in range(n):
        a = one_chart(chart(rng), "female")
        b = one_chart(chart(rng), "male")
        for name, fn in VARIANTS.items():
            x, y = fn(a), fn(b)
            both[name] += x and y
            single[name] += x
    print(f"FAA-30 joint variants, {n} couples, seed {seed} (combustion and paksha as the chart build)")
    for name in VARIANTS:
        print(f"  {both[name] / n:6.1%} BOTH  {single[name] / n:6.1%} per chart  {name}")


if __name__ == "__main__":
    main(*(int(x) for x in sys.argv[1:3]))

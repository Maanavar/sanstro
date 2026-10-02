"""Measure how often a debilitated house lord still scores as 'strongly placed'.

`bhava_palan.render_why` calls the house lord strongly placed whenever its composite
`strength_score` clears 50. A reader takes that as a claim about DIGNITY, because the
chart drawn on the same screen is the only thing they can check it against. This sweep
measures how far apart those two claims actually sit, and it is the source of the
figures quoted in `bhava_palan_copy` and in
docs/BHAVA_PALAN_SECTION_PLAN_2026-09-28.md §3.1a.

Run:
    py -3 scripts/bhava_dignity_sweep.py

Sampling caveat, which the quoted figures carry with them: placements are uniform
random, so kendras are over-represented relative to real charts and the neecha bhanga
rate here is far above the natural one. These numbers bound the SHAPE of the problem
(a debilitated lord routinely scores >= 50), not its frequency in a real user base.
"""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.calculations.astro import navamsa_rasi_from_degree  # noqa: E402
from app.calculations.chart_strength import (  # noqa: E402
    DEBILITATION_RASI,
    EXALTATION_RASI,
    apply_holistic_synthesis,
    explain_natal_planet_score,
    neecha_bhanga_cancelled,
)
from app.calculations.functional_nature import get_functional_nature  # noqa: E402

GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")


def _chart(rng):
    """One chart with a named graha forced into its own debilitation sign."""
    lagna = rng.randint(1, 12)
    target = rng.choice(sorted(DEBILITATION_RASI))
    rasi, lon = {}, {}
    for graha in GRAHAS:
        r = DEBILITATION_RASI[target] if graha == target else rng.randint(1, 12)
        rasi[graha] = r
        lon[graha] = (r - 1) * 30 + rng.uniform(0, 30)
    # Nodes stay exactly opposed, as in a real chart.
    rasi["KETU"] = (rasi["RAHU"] + 5) % 12 + 1
    lon["KETU"] = (rasi["KETU"] - 1) * 30 + (lon["RAHU"] % 30)
    return lagna, target, rasi, lon


def _score(lagna, rasi, lon, rng):
    """Both passes of the real scorer: base balas, then the holistic synthesis."""
    d9 = {g: navamsa_rasi_from_degree(lon[g]) for g in GRAHAS}
    d9_lagna = navamsa_rasi_from_degree((lagna - 1) * 30 + rng.uniform(0, 30))
    base = {}
    for graha in GRAHAS:
        base[graha], _ = explain_natal_planet_score(
            graha, rasi[graha], lon[graha], lagna, lon["SUN"], False,
            is_vargottama=(rasi[graha] == d9[graha]), d9_rasi=d9[graha],
            planet_rasi_map=rasi,
        )
    synth = apply_holistic_synthesis(
        base,
        planet_rasi=rasi,
        lagna_rasi=lagna,
        functional_nature={
            g: get_functional_nature(lagna, g, node_rasi_map=rasi).value for g in GRAHAS
        },
        benefic_planets=frozenset({"JUPITER", "VENUS", "MERCURY", "MOON"}),
        d9_rasi_map=d9,
        d9_lagna_rasi=d9_lagna,
        planet_longitude=lon,
    )
    return synth, d9, d9_lagna


def sweep(n=4000, seed=7):
    rng = random.Random(seed)  # noqa: S311 — fixture data, not cryptography
    stat = dict(charts=0, reads_strong=0, bhanga=0, bhanga_reads_strong=0,
                via_d9=0, hollow_exaltation=0)
    for _ in range(n):
        lagna, target, rasi, lon = _chart(rng)
        synth, d9, d9_lagna = _score(lagna, rasi, lon, rng)
        cancelled, conditions = neecha_bhanga_cancelled(
            target, planet_rasi=rasi, lagna_rasi=lagna,
            d9_rasi_map=d9, d9_lagna_rasi=d9_lagna,
        )
        strong = int(synth[target]["score"]) >= 50
        stat["charts"] += 1
        stat["reads_strong"] += strong
        stat["bhanga"] += cancelled
        stat["bhanga_reads_strong"] += cancelled and strong
        stat["via_d9"] += "debilitated_planet_strong_d9" in conditions
        # The mirror case: exalted in the Rasi, neecha in the Navamsa.
        stat["hollow_exaltation"] += sum(
            EXALTATION_RASI.get(g) == rasi[g] and DEBILITATION_RASI.get(g) == d9[g]
            for g in GRAHAS
        )
    return stat


if __name__ == "__main__":
    s = sweep()
    n = s["charts"]
    print(f"charts (one forced debilitation each) : {n}")
    print(f"  debilitated graha still scores >= 50: {s['reads_strong']}"
          f"  ({s['reads_strong'] / n:.1%})")
    print(f"  debilitation cancelled (bhanga)     : {s['bhanga']}")
    print(f"    ...of those, scoring >= 50        : {s['bhanga_reads_strong']}"
          f"  ({s['bhanga_reads_strong'] / max(s['bhanga'], 1):.1%})")
    print(f"  bhanga route included D9 strength   : {s['via_d9']}")
    print(f"hollow exaltations seen (any graha)   : {s['hollow_exaltation']}")

"""Read-only scan: dosham prevalence under the 30 Oct rulings, before building them.

Synthetic population only (seeded random instants 1960-2010, random lagna): no
person, no birth data. Compares, side by side:

- Sevvai under the three house sets (union_six = today, tamil_five, manglik_five),
  with today's Lagna-declared grading, and how many declared charts also carry
  Ruchaka (the Q6b dosham-vs-mahapurusha conflict).
- Putra Sarpa today vs the Q9 rule (only a node IN the 5th declares).
- Guru Chandala (a node in Jupiter's sign) and the share linked to the 5th.
- Every other marriage/children dosham as it stands, against Q11's 25% budget.

Run:  Get-Content scripts/audit/dosham_prevalence_scan.py | docker exec -i vinaadi-dev-api python -
"""
from __future__ import annotations

import random
from collections import Counter

from app.calculations import _yoga_dosham as yd
from app.calculations._yoga_detect import detect_pancha_mahapurusha
from app.calculations._yoga_helpers import _house_lord
from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.doctrine_options import DoctrineOptions
from app.calculations.ephemeris import calculate_sidereal_planets

N = 2000
SETS = {
    "union_six": {1, 2, 4, 7, 8, 12},
    "tamil_five": {2, 4, 7, 8, 12},
    "manglik_five": {1, 4, 7, 8, 12},
}


def population(n: int = N, seed: int = 1030):
    rng = random.Random(seed)
    for _ in range(n):
        snap = calculate_sidereal_planets(rng.uniform(2_436_934.5, 2_455_197.5))
        yield {g: b.rasi for g, b in snap.bodies.items()}, rng.randint(1, 12)


def pct(c: int) -> str:
    return f"{100 * c / N:5.1f}%"


def main() -> None:
    pop = list(population())
    print(f"Sevvai, Lagna-declared, n={N}")
    for name in SETS:
        doctrine = DoctrineOptions(sevvai_house_set=name)
        c = Counter()
        for planets, lagna in pop:
            r = yd.detect_sevvai_dosham(planets, lagna, doctrine=doctrine)
            if not r.is_present:
                continue
            c["present"] += 1
            c[f"shown_{r.strength}"] += 1
            if "house_sign_nivarthi" in r.cancellation_factors:
                c["nivarthi_sign"] += 1
            ruchaka = any(y.is_present and y.name == "RUCHAKA_YOGA" for y in detect_pancha_mahapurusha(planets, lagna))
            if ruchaka:
                c["also_ruchaka"] += 1
                c[f"ruchaka_from_house_{house_from_reference(lagna, planets['MARS'])}"] += 1
        print(f"  {name:13s}", {k: pct(v) for k, v in sorted(c.items())})

    print("\nPutra Sarpa / Guru Chandala / Santhana Thadai")
    c = Counter()
    for planets, lagna in pop:
        fifth = ((lagna + 3) % 12) + 1
        lord = _house_lord(lagna, 5)
        nodes = ("RAHU", "KETU")
        in5 = any(planets[p] == fifth for p in nodes)
        beside_lord = any(planets[p] == planets[lord] and lord not in nodes for p in nodes) and not in5
        gc = any(planets[p] == planets["JUPITER"] for p in nodes)
        jup_linked = (
            planets["JUPITER"] == fifth or lord == "JUPITER"
            or aspects_house("JUPITER", planets["JUPITER"], fifth)
        )
        legs = int(beside_lord) + int(gc and jup_linked)
        today = yd.detect_putra_sarpa_dosham(planets, lagna, {})
        c["today_present"] += today.is_present
        c["q9_declared"] += in5
        c["q9_declared_mild"] += in5 and legs == 0
        c["q9_declared_confirmed"] += in5 and legs == 1
        c["q9_declared_severe"] += in5 and legs >= 2
        c["q9_watch_note_only"] += (not in5) and legs > 0
        live = yd.detect_putra_sarpa_dosham(planets, lagna, {})
        c["live_declared"] += live.is_present
        c[f"live_{live.strength}"] += live.is_present
        c["live_watch_only"] += "putra_sarpa_watch_only" in live.context_notes
        c["live_guru_ketu_noted"] += "putra_sarpa_guru_ketu_noted" in live.context_notes
        c["guru_chandala"] += gc
        c["guru_chandala_linked_5th"] += gc and jup_linked
        c["santhana_thadai"] += yd.detect_santhana_thadai(planets, lagna, {}).is_present
        c["rahu_ketu_marriage"] += yd.detect_rahu_ketu_dosham(planets, lagna).is_present
        c["kalathra"] += yd.detect_kalathra_dosham(planets, lagna).is_present
    for k, v in c.items():
        print(f"  {k:26s} {pct(v)}")
    print("  (Q9 legs measured: node beside 5th lord; node with Jupiter linked to 5th. D7 not measured.)")


main()

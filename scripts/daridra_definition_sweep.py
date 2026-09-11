"""Measure fire-rate of candidate Daridra definitions over random charts.

The 2026-09-11 ruling says the brief's 'dusthana lords connecting with houses of
wealth' formulation produces *far fewer* false positives than the shipped
'11th lord in a dusthana'. This checks that claim before the detector changes.
"""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.calculations._yoga_helpers import _house_lord  # noqa: E402

GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
DUSTHANA = (6, 8, 12)
DHANA = (2, 11)


def house_of(lagna, rasi):
    return ((rasi - lagna) % 12) + 1


def rule_a(lagna, planets):
    """SHIPPED: 11th lord occupies a dusthana."""
    lord = _house_lord(lagna, 11)
    return house_of(lagna, planets[lord]) in DUSTHANA


def _lords(lagna, houses):
    return {h: _house_lord(lagna, h) for h in houses}


def rule_b(lagna, planets):
    """LOOSE: any dusthana lord occupies a dhana house."""
    for _h, lord in _lords(lagna, DUSTHANA).items():
        if house_of(lagna, planets[lord]) in DHANA:
            return True
    return False


def rule_c(lagna, planets):
    """CONJUNCTION: a dusthana lord shares a rasi with a dhana lord (distinct grahas)."""
    dl = _lords(lagna, DUSTHANA)
    wl = _lords(lagna, DHANA)
    for a in dl.values():
        for b in wl.values():
            if a != b and planets[a] == planets[b]:
                return True
    return False


def rule_d(lagna, planets):
    """PARIVARTANA: dusthana lord in a dhana house AND that dhana lord in that dusthana."""
    dl = _lords(lagna, DUSTHANA)
    wl = _lords(lagna, DHANA)
    for dh, a in dl.items():
        for wh, b in wl.items():
            if a == b:
                continue
            if house_of(lagna, planets[a]) == wh and house_of(lagna, planets[b]) == dh:
                return True
    return False


def rule_same_lord(lagna, _planets):
    """LAGNA CONSTANT: one graha owns both a dusthana and a dhana house."""
    return bool(set(_lords(lagna, DUSTHANA).values()) & set(_lords(lagna, DHANA).values()))


def rule_e(lagna, planets):
    """UNION of occupation + conjunction (the plain reading of 'connecting')."""
    return rule_b(lagna, planets) or rule_c(lagna, planets)


def rule_f(lagna, planets):
    """TIGHT: mutual link only — conjunction of lords, or a true exchange."""
    return rule_c(lagna, planets) or rule_d(lagna, planets)


RULES = [
    ("A  shipped: 11th lord in dusthana", rule_a),
    ("B  loose:   dusthana lord in 2nd/11th", rule_b),
    ("C  conj:    dusthana lord conjunct dhana lord", rule_c),
    ("D  exchange: dusthana<->dhana parivartana", rule_d),
    ("E  B or C  (plain 'connecting')", rule_e),
    ("F  C or D  (mutual link only)", rule_f),
    ("*  lagna constant: one graha owns both", rule_same_lord),
]

N = 200_000
# Statistical sweep, not a security context — a fixed seed is the point, so the
# run is reproducible from the number quoted in the audit.
rng = random.Random(20260911)  # noqa: S311
counts = {name: 0 for name, _ in RULES}
per_lagna = {name: [0] * 13 for name, _ in RULES}
lagna_n = [0] * 13

for _ in range(N):
    lagna = rng.randint(1, 12)
    lagna_n[lagna] += 1
    planets = {g: rng.randint(1, 12) for g in GRAHAS}
    for name, fn in RULES:
        if fn(lagna, planets):
            counts[name] += 1
            per_lagna[name][lagna] += 1

print(f"random charts: {N:,}\n")
print(f"{'rule':<46} {'fires':>8}  {'rate':>7}")
print("-" * 64)
for name, _ in RULES:
    print(f"{name:<46} {counts[name]:>8,}  {counts[name] / N:>6.1%}")

print("\nper-lagna rate (rule F, the tight one) vs A:")
for lagna in range(1, 13):
    a = per_lagna["A  shipped: 11th lord in dusthana"][lagna] / lagna_n[lagna]
    f = per_lagna["F  C or D  (mutual link only)"][lagna] / lagna_n[lagna]
    const = per_lagna["*  lagna constant: one graha owns both"][lagna] / lagna_n[lagna]
    print(f"  lagna {lagna:>2}:  A={a:>6.1%}   F={f:>6.1%}   same-lord-constant={const:>6.0%}")

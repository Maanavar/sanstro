"""Read-only measurements for docs/DEFERRED_ASTROLOGY_CHECKS_BUILD_PLAN_2026-11-09.md.

Synthetic population only (seeded random instants and places): no person, no
birth data. Nothing here is a ratification. A prevalence is a property of the
rule as coded, recorded so the astrologer sees it before ruling; no percentage
below validates a rule astrologically.

    item 0  D7 birth-time guard from the ephemeris, by latitude, and how often
            the old 4 min/deg average disagreed with it; D7 verdict shares on
            declared Putra Sarpa / Santhana Thadai charts
    item 1  Putra Sarpa grades with Guru + Ketu as a watch-note vs a leg
    item 3  Papa samyam: share of random couples balanced
    item 7  Dasa Sandhi: share of couples flagged, per rule, tolerance, horizon

Run (test image, repo mounted read-only; no database is touched):

    docker run --rm -v "D:\\sanstro:/src:ro" -w /src -e PYTHONPATH=/src `
      -e PYTHONDONTWRITEBYTECODE=1 vinaadi-test:312 `
      python scripts/audit/deferred_checks_measurements.py
"""
from __future__ import annotations

import random
from collections import Counter

from app.calculations._yoga_dosham import detect_putra_sarpa_dosham, detect_santhana_thadai
from app.calculations.dasa_sandhi import (
    SANDHI_OPTIONS,
    couple_transitions_within,
    couple_window_overlaps,
    months_to_days,
)
from app.calculations.dasha import JULIAN_YEAR_DAYS, calculate_vimshottari_timeline
from app.calculations.doctrine_options import DoctrineOptions
from app.calculations.dosha_samyam import papa_samyam
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets
from app.calculations.progeny_checks import (
    _d7_margin_minutes,
    _d7_sign,
    afflictors_in,
    check_d7,
)

JD_1950, JD_2010 = 2433282.5, 2455197.5
TOL_MIN = 2.0


def pct(n: int, d: int) -> str:
    return f"{100 * n / d:5.1f}%" if d else "  n/a"


def guard(n: int = 20_000, seed: int = 3) -> None:
    print("\n== Item 0: D7 birth-time guard (ephemeris, +/-2 min) ==")
    rng = random.Random(seed)
    step = TOL_MIN / 1440.0
    bands = {"0-20N": Counter(), "20-40N": Counter(), "40-56N": Counter()}
    for _ in range(n):
        jd = rng.uniform(JD_1950, JD_2010)
        lat, lon = rng.uniform(0, 56), rng.uniform(-10, 140)
        lag = calculate_lagna_degree(jd, lat, lon)
        before = calculate_lagna_degree(jd - step, lat, lon)
        after = calculate_lagna_degree(jd + step, lat, lon)
        new_unc = len({_d7_sign(before), _d7_sign(lag), _d7_sign(after)}) > 1
        old_unc = _d7_margin_minutes(lag) < TOL_MIN
        band = "0-20N" if lat < 20 else "20-40N" if lat < 40 else "40-56N"
        c = bands[band]
        c["n"] += 1
        c["new"] += new_unc
        c["old"] += old_unc
        c["old_trusts_new_withholds"] += new_unc and not old_unc
        c["old_withholds_new_trusts"] += old_unc and not new_unc
    tot = sum(bands.values(), Counter())
    print("band      n      UNCERTAIN(new)  UNCERTAIN(old avg)  old trusted, real moves  old withheld, real stable")
    for name, c in [*bands.items(), ("all", tot)]:
        print(f"{name:7} {c['n']:6}   {pct(c['new'], c['n'])}          {pct(c['old'], c['n'])}             "
              f"{pct(c['old_trusts_new_withholds'], c['n'])}                 {pct(c['old_withholds_new_trusts'], c['n'])}")
    print("expected from 84 D7 boundaries per sidereal day: 84 x 4 / 1436 = 23.4%")


def population(n: int, seed: int):
    """Random instant and place; real planets and a real lagna."""
    rng = random.Random(seed)
    for _ in range(n):
        jd = rng.uniform(JD_1950, JD_2010)
        lat, lon = rng.uniform(8, 35), rng.uniform(68, 92)
        snap = calculate_sidereal_planets(jd)
        lag = calculate_lagna_degree(jd, lat, lon)
        yield jd, lat, lon, snap, lag


def children(n: int = 10_000, seed: int = 1109) -> None:
    print("\n== Items 0 and 1: children's doshams (10 000 synthetic charts, India latitudes) ==")
    grades = {mode: Counter() for mode in ("watch_note", "leg")}
    verdicts = {name: Counter() for name in ("PUTRA_SARPA_DOSHAM", "SANTHANA_THADAI")}
    changed = 0
    step = TOL_MIN / 1440.0
    for jd, lat, lon, snap, lag in population(n, seed):
        rasi = {g: b.rasi for g, b in snap.bodies.items() if g != "MANDHI"}
        lagna_rasi = int(lag // 30) + 1
        scores = dict.fromkeys(rasi, 50)  # strength-neutral: the protections' score test never fires
        by_mode = {}
        for mode in grades:
            ps = detect_putra_sarpa_dosham(rasi, lagna_rasi, scores, doctrine=DoctrineOptions(d6b_guru_ketu=mode))
            g = ps.strength if ps.is_present else "NONE"
            grades[mode][g] += 1
            by_mode[mode] = (g, ps)
        changed += by_mode["watch_note"][0] != by_mode["leg"][0]
        longs = {g: b.absolute_longitude for g, b in snap.bodies.items()}
        bracket = (calculate_lagna_degree(jd - step, lat, lon), calculate_lagna_degree(jd + step, lat, lon))
        for name, result in (
            ("PUTRA_SARPA_DOSHAM", by_mode["watch_note"][1]),
            ("SANTHANA_THADAI", detect_santhana_thadai(rasi, lagna_rasi, scores)),
        ):
            if not result.is_present:
                continue
            aff = afflictors_in(name, result.conditions_met)
            if aff:
                verdicts[name][check_d7(longs, lag, aff, lagna_bracket=bracket).verdict] += 1
    print("Putra Sarpa grade   watch_note(default)   leg")
    for g in ("NONE", "WEAK", "PARTIAL", "STRONG"):
        print(f"  {g:8}          {pct(grades['watch_note'][g], n)}              {pct(grades['leg'][g], n)}")
    for mode in grades:
        sev = grades[mode]["STRONG"]
        conf = grades[mode]["PARTIAL"] + sev
        print(f"  Q16 gate [{mode}]: severe {pct(sev, n)} (cap 5%), confirmed+severe {pct(conf, n)} (cap 25%)")
    print(f"  charts whose grade changes under leg: {changed} of {n} ({pct(changed, n).strip()})")
    print("D7 verdicts on declared charts (ephemeris guard):")
    for name, c in verdicts.items():
        total = sum(c.values())
        row = ", ".join(f"{k} {pct(c[k], total).strip()}" for k in ("REPEATS", "STRAINED", "SUPPORTS", "MIXED", "UNCERTAIN"))
        print(f"  {name} (n={total}): {row}")
        if total and c["REPEATS"] / total > 0.30:
            print("  ! REPEATS above 30%: review the rule before ratification (plan item 0)")


def papa(n: int = 10_000, seed: int = 11) -> None:
    print("\n== Item 3: papa samyam on random couples (real charts) ==")
    charts = [(({g: b.rasi for g, b in s.bodies.items()}), int(lag // 30) + 1)
              for _, _, _, s, lag in population(2 * n, seed)]
    balanced = ties = 0
    for i in range(n):
        (bp, bl), (gp, gl) = charts[2 * i], charts[2 * i + 1]
        r = papa_samyam(bp, bl, gp, gl)
        balanced += r.balanced
        ties += r.boy.total == r.girl.total
    print(f"  balanced {pct(balanced, n)}  (ties {pct(ties, n)}; strict >= with ties balanced expects (1 + ties) / 2)")


def sandhi(n: int = 10_000, seed: int = 7) -> None:
    print("\n== Item 7: Dasa Sandhi (engine only; no rule is preferred) ==")
    rng = random.Random(seed)
    couples = []
    for _ in range(n):
        ja, jb = rng.uniform(2436934.5, 2451544.5), rng.uniform(2436934.5, 2451544.5)
        a = calculate_vimshottari_timeline(ja, rng.uniform(0, 360)).mahadashas
        b = calculate_vimshottari_timeline(jb, rng.uniform(0, 360)).mahadashas
        wedding = max(ja, jb) + rng.uniform(24, 32) * JULIAN_YEAR_DAYS
        couples.append((a, b, wedding))
    print("  Transition rule: both mahadasas change within the tolerance, inside the horizon")
    print("  horizon   tol 6 mo   tol 12 mo")
    for horizon in (5, 7):
        cells = []
        for months in (6, 12):
            tol = months_to_days(months)
            hit = sum(couple_transitions_within(a, b, from_jd=w, horizon_years=horizon, tolerance_days=tol).flagged
                      for a, b, w in couples)
            cells.append(pct(hit, n))
        print(f"  {horizon} y       {cells[0]}     {cells[1]}")
    print("  Window rule: the two partners' sandhi windows overlap inside the horizon")
    print("  horizon   " + "   ".join(f"{o:13}" for o in SANDHI_OPTIONS))
    for horizon in (5, 7):
        cells = []
        for option in SANDHI_OPTIONS:
            hit = sum(bool(couple_window_overlaps(a, b, option, fixed_months=6, from_jd=w, horizon_years=horizon))
                      for a, b, w in couples)
            cells.append(f"{pct(hit, n):13}")
        print(f"  {horizon} y       " + "   ".join(cells))
    print("  (A_FIXED uses 6 months each side here; that span is itself a parameter, not a ruling.)")


if __name__ == "__main__":
    guard()
    children()
    papa()
    sandhi()

"""Fire rates of the yogas and doshams DOCTRINE_DECISIONS v1.3/v1.4 changes.

The decision file (§17) asks for a frequency report — how many charts trigger
each yoga/dosham before vs after — for DD-02 (Lakshmi), DD-03 (Rahu–Ketu) and
DD-09 (Neecha Bhanga). This script measures whichever engine it is run against,
so the same command with the same seed gives "before" (run inside a worktree
checked out at the pre-change commit) and "after" (run here):

    python scripts/doctrine_v13_frequency_sweep.py --charts 3000 --seed 20261001

Charts are real ephemeris charts, not random rasi maps: Budhan and Sukran stay
near Suriyan and the composite strength scores are the production ones, both of
which the Lakshmi and benefic tests depend on. Birth instants are drawn
uniformly from 1950–2010 at a handful of Tamil Nadu town coordinates. No person
is behind any chart.

Output is one JSON object: counts and percentages per measured row.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services._chart_build import _chart_response_from_profile  # noqa: E402

#: Town coordinates only (public geography), so no fixture is a real birth.
_PLACES = (
    (13.0827, 80.2707),  # Chennai
    (9.9252, 78.1198),   # Madurai
    (11.0168, 76.9558),  # Coimbatore
    (10.7905, 78.7047),  # Tiruchirappalli
    (8.7139, 77.7567),   # Tirunelveli
)
_START = datetime(1950, 1, 1, tzinfo=UTC)
_SPAN_SECONDS = int((datetime(2010, 12, 31, tzinfo=UTC) - _START).total_seconds())


def _profile(rng: random.Random) -> SimpleNamespace:
    lat, lon = rng.choice(_PLACES)
    instant = _START + timedelta(seconds=rng.randrange(_SPAN_SECONDS))
    return SimpleNamespace(
        birth_datetime_utc=instant,
        birth_latitude=lat,
        birth_longitude=lon,
        birth_timezone="Asia/Kolkata",
        birth_date_local=instant.date(),
        birth_time_local=instant.time(),
        gender_for_traditional_rules=rng.choice(("female", "male")),
        display_name="Sweep chart",
        birth_place="Sweep place",
    )


def sweep(charts: int, seed: int) -> dict[str, object]:
    rng = random.Random(seed)  # noqa: S311 — a reproducible sample, not a secret
    counts: Counter[str] = Counter()
    for _ in range(charts):
        data = _chart_response_from_profile(_profile(rng), "sweep").data
        yogas = {y.name: y for y in data.yogas}
        doshams = {d.name: d for d in data.doshams}

        lk = yogas.get("LAKSHMI_YOGA")
        counts["lakshmi_present"] += bool(lk and lk.is_present)
        counts["bhagya_support_present"] += "BHAGYA_SUPPORT" in yogas and yogas["BHAGYA_SUPPORT"].is_present

        # The fallback keys make the same script usable on the pre-P2 engine:
        # GAJA_KESARI_YOGA and ADHI_YOGA are the stable/legacy flat cards there.
        gk_base = yogas.get("GAJA_KESARI_BASE") or yogas.get("GAJA_KESARI_YOGA")
        gk_strict = yogas.get("GAJA_KESARI_PARASHARA")
        counts["gk_base_present"] += bool(gk_base and gk_base.is_present)
        counts["gk_parashara_present"] += bool(gk_strict and gk_strict.is_present)

        adhi_base = yogas.get("ADHI_BASE") or yogas.get("ADHI_YOGA")
        adhi_raja = yogas.get("ADHI_RAJA_GRADE")
        counts["adhi_base_present"] += bool(adhi_base and adhi_base.is_present)
        counts["adhi_raja_grade_present"] += bool(adhi_raja and adhi_raja.is_present)

        nb = yogas.get("NEECHA_BHANGA_RAJA_YOGA")
        # v1.7: a single-condition cancellation is its own card, NEECHA_NIVARTHI.
        nivarthi = yogas.get("NEECHA_NIVARTHI")
        debilitated = any(
            card is not None and "planet_debilitated" in card.conditions_met for card in (nb, nivarthi)
        )
        counts["any_graha_debilitated"] += debilitated
        if nb and nb.is_present:
            counts["nbry_present"] += 1
            counts[f"nbry_strength_{nb.strength}"] += 1
        counts["neecha_nivarthi_present"] += bool(nivarthi and nivarthi.is_present)
        counts["nb_self_reference"] += any(
            card is not None and "nb_self_reference" in card.conditions_met for card in (nb, nivarthi)
        )

        rk = doshams.get("RAHU_KETU_DOSHAM")
        if rk and rk.is_present:
            counts["rk_present"] += 1
            if rk.is_cancelled:
                counts["rk_mitigated"] += 1
            else:
                counts[f"rk_uncancelled_{rk.strength}"] += 1

        kala = doshams.get("KALASARPA")
        counts["kalasarpa_present"] += bool(kala and kala.is_present)
        if kala and any(marker.startswith("graha_on_node_") for marker in kala.conditions_met):
            counts["kalasarpa_node_boundary_disclosed"] += 1

        sv = doshams.get("SEVVAI_DOSHAM")
        if sv and sv.is_present:
            counts["sevvai_present"] += 1
            counts["sevvai_cancelled"] += sv.is_cancelled
        raja = yogas.get("RAJA_YOGA")
        counts["raja_present"] += bool(raja and raja.is_present)
        if raja and raja.is_present:
            # v1.7 three-way outcome, read from the merged card's grades.
            grades = set(raja.conditions_met)
            if grades & {"raja_grade_full", "raja_grade_qualified"}:
                counts["raja_has_confirmed_instance"] += 1
            else:
                counts["raja_mixed_only"] += 1
        if raja and any(f.startswith("raja_pair_source_vetoed_") for f in raja.cancellation_factors):
            counts["raja_source_vetoed_pair_recorded"] += 1

    return {
        "charts": charts,
        "seed": seed,
        "counts": dict(sorted(counts.items())),
        "percent": {k: round(100.0 * v / charts, 2) for k, v in sorted(counts.items())},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--charts", type=int, default=3000)
    parser.add_argument("--seed", type=int, default=20261001)
    parser.add_argument(
        "--flag", action="append", default=[], metavar="NAME=VALUE",
        help="Override an admin flag for this run, e.g. doctrine_o19_nb_moon_self_reference=false. "
             "Repeatable. Values: true/false, an integer, or a string.",
    )
    args = parser.parse_args()
    if args.flag:
        from app.services.feature_flags import set_flag

        for item in args.flag:
            name, _, raw = item.partition("=")
            value: object = {"true": True, "false": False}.get(raw.lower(), raw)
            if isinstance(value, str) and value.lstrip("-").isdigit():
                value = int(value)
            set_flag(name, value)
    result = sweep(args.charts, args.seed)
    result["flags"] = args.flag
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

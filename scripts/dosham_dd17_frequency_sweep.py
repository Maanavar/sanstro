"""Before/after fire rates for DD-17 (2026-10-06): O-26..O-29 and the residual.

Each chart is built twice from the same birth instant — once under the v2.0
doctrine (dispositor rule on, kendra-only 7th lord, 8th-side only, Guru counted
twice) and once under the DD-17 defaults — so every difference is the ruling
and nothing else:

    python scripts/dosham_dd17_frequency_sweep.py --charts 1500 --seed 20261006

Charts are real ephemeris charts at Tamil Nadu town coordinates with birth
instants drawn uniformly from 1950–2010 (the v1.3 sweep's sampler). No person
is behind any chart. Output is one JSON object.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from collections import Counter
from dataclasses import replace
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions  # noqa: E402
from app.services import _chart_build  # noqa: E402
from scripts.doctrine_v13_frequency_sweep import _profile  # noqa: E402

V20 = DoctrineOptions(
    o26_sevvai_dispositor_mitigation="from_mars",
    o27_sevvai_seventh_lord_strength="kendra_functional_benefic",
    o28_rk_second_house_support="off",
    o29_rk_guru_counted_once=False,
)
#: O-28's three readings, all with O-29 on, so the 2nd-house test is measured alone.
O28_VARIANTS = {
    value: replace(DEFAULT_DOCTRINE, o28_rk_second_house_support=value)
    for value in ("off", "dignity", "strong_or_benefic")
}


def _doshams(profile, options: DoctrineOptions) -> dict[str, object]:
    _chart_build.current_doctrine_options = lambda: options  # type: ignore[assignment]
    data = _chart_build._chart_response_from_profile(profile, "sweep").data
    return {d.name: d for d in data.doshams}


def sweep(charts: int, seed: int) -> dict[str, object]:
    rng = random.Random(seed)  # noqa: S311 — a reproducible sample, not a secret
    counts: Counter[str] = Counter()
    for _ in range(charts):
        profile = _profile(rng)
        before, after = _doshams(profile, V20), _doshams(profile, DEFAULT_DOCTRINE)
        for name, key in (("SEVVAI_DOSHAM", "sevvai"), ("RAHU_KETU_DOSHAM", "rk")):
            b, a = before[name], after[name]
            if not a.is_present:
                continue
            counts[f"{key}_present"] += 1
            counts[f"{key}_mitigated_v20"] += b.is_cancelled
            counts[f"{key}_mitigated_dd17"] += a.is_cancelled
            counts[f"{key}_newly_mitigated"] += a.is_cancelled and not b.is_cancelled
            counts[f"{key}_no_longer_mitigated"] += b.is_cancelled and not a.is_cancelled
            counts[f"{key}_residual_{a.residual}"] += 1
            if a.is_cancelled:
                counts[f"{key}_mitigated_residual_{a.residual}"] += 1
            for note in a.context_notes:
                counts[f"{key}_context_{note}"] += 1
        sv_b = before["SEVVAI_DOSHAM"]
        counts["sevvai_dispositor_fired_v20"] += "mars_dispositor_kendra_trikona" in sv_b.cancellation_factors
        counts["sevvai_dispositor_decided_verdict"] += (
            sv_b.is_cancelled and not after["SEVVAI_DOSHAM"].is_cancelled
            and "mars_dispositor_kendra_trikona" in sv_b.cancellation_factors
        )
        for d in after.values():
            if d.is_present and d.is_cancelled:
                counts["any_mitigated_dosham"] += 1
                counts[f"any_mitigated_residual_{d.residual}"] += 1
        if after["RAHU_KETU_DOSHAM"].is_present:
            for value, options in O28_VARIANTS.items():
                rk = after["RAHU_KETU_DOSHAM"] if options == DEFAULT_DOCTRINE else _doshams(profile, options)["RAHU_KETU_DOSHAM"]
                counts[f"rk_mitigated_o28_{value}"] += rk.is_cancelled

    def pct(n: int, of: int) -> float:
        return round(100.0 * n / of, 1) if of else 0.0

    report: dict[str, object] = {"charts": charts, "seed": seed, "counts": dict(sorted(counts.items()))}
    for key in ("sevvai", "rk"):
        present = counts[f"{key}_present"]
        report[f"{key}_mitigated_pct_of_present"] = {
            "v2.0": pct(counts[f"{key}_mitigated_v20"], present),
            "dd17": pct(counts[f"{key}_mitigated_dd17"], present),
        }
    report["rk_mitigated_pct_by_o28"] = {
        value: pct(counts[f"rk_mitigated_o28_{value}"], counts["rk_present"]) for value in O28_VARIANTS
    }
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--charts", type=int, default=1500)
    parser.add_argument("--seed", type=int, default=20261006)
    args = parser.parse_args()
    print(json.dumps(sweep(args.charts, args.seed), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

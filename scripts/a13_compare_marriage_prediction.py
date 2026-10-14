"""Exact same-process comparator for the A13 marriage-service extraction.

Both sides are loaded as separate module objects: the baseline from Git, the
candidate from Git (``--candidate REV``) or from the working tree (default).
Registering each alias before ``exec_module`` is required for the slotted
dataclasses.

Two oracles, compared per case:

* the full result, serialised as sorted JSON (or the exception's type and
  message, so a branch that raises must raise identically);
* a probe of the hidden score.  The prediction exposes no raw score, so an
  internal weight change shows only where it crosses a returned boundary
  (10 -> 9 on the STRONG-dasha bonus moved 5 of 450 golden-derived cases).
  Each loaded module gets its own recording ``min``/``max`` as module
  globals, which shadow the builtins for that module only: every affliction
  penalty cap and the final ``max(0, min(100, score))`` clamp are recorded
  with their arguments, so the raw score of every scored case is compared.

Two matrices:

* golden-derived: the marriage golden's 6 synthetic profiles x 15 dates
  (2026-2040) x {as built, married, parent, gate off, maha/antar absent} x
  the 4 combinations of ``reasoning_bands`` / ``reasoning_chart_signature``;
* synthetic: seeded random ``MarriageAssessmentInput`` values over every
  field, biased so the promise gate's BLOCKED and SILENT grades, scored LOW
  readings, student / divorced / widowed / breakup contexts, Rahu-Ketu labels
  and missing data are all reached, x gate None/True/False x both flags.

    python scripts/a13_compare_marriage_prediction.py [--baseline REV]
        [--candidate REV] [--date-shift-control] [--expect-differences]
"""
from __future__ import annotations

import argparse
import builtins
import dataclasses
import importlib.util
import json
import random
import subprocess
import sys
import tempfile
from collections import Counter
from collections.abc import Callable, Iterator
from datetime import date, timedelta
from pathlib import Path
from types import ModuleType
from typing import Any

REPO = Path(__file__).resolve().parents[1]
MODULE_PATH = "app/services/marriage_service.py"
sys.path.insert(0, str(REPO))

DATES = (
    date(2026, 1, 14),
    date(2027, 4, 15),
    date(2028, 7, 18),
    date(2029, 10, 21),
    date(2030, 2, 23),
    date(2031, 5, 26),
    date(2032, 8, 29),
    date(2033, 11, 3),
    date(2034, 3, 6),
    date(2035, 6, 9),
    date(2036, 9, 12),
    date(2037, 12, 15),
    date(2038, 1, 18),
    date(2039, 4, 21),
    date(2040, 7, 24),
)
VARIANTS = ("as-built", "married", "parent", "gate-off", "lords-absent")
FLAG_COMBOS = tuple((bands, signature) for bands in (False, True) for signature in (False, True))
SYNTHETIC_CASES = 6000
SEED = 20261009

GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
LIFE_STAGES = ("child", "student", "young_adult", "mid_life", "senior", "late_career")
MARITAL = (None, None, "single", "married", "Married ", "divorced", "widowed", "breakup", "separated", "engaged")
RELATIONSHIPS = ("self", "self", "self", "spouse", "child", "sibling", "parent", "grandparent")
RAHU_KETU = (
    None,
    "STRONG_ACTIVE_RAHU_KETU_DOSHAM",
    "ACTIVE_RAHU_KETU_DOSHAM",
    "active_rahu_ketu_dosham",
    "RAHU_KETU_DOSHAM_CANDIDATE",
    "RAHU_KETU_DOSHAM_WITH_NIVARTHI",
    "NO_RAHU_KETU_DOSHAM",
)

# Verdict paths a refactor of this function can disturb.  "SCORED" paths are
# keyed by mode, final confidence and band presence.
VERDICT_PATHS = {
    "RELATIONSHIP_GATE",
    "AGE_GATE",
    "UPPER_AGE_GATE",
    "PROMISE_BLOCKED",
    "PROMISE_SILENT",
    "MARRIED_HIGH",
    "MARRIED_MEDIUM",
    "MARRIED_LOW",
    "TIMING_HIGH",
    "TIMING_MEDIUM",
    "TIMING_LOW",
    "TIMING_HIGH+band",
    "TIMING_MEDIUM+band",
    "TIMING_LOW+band",
    "RAISES",
}


def _load(revision: str | None, alias: str) -> ModuleType:
    """Load ``MODULE_PATH`` at ``revision`` (or the working tree) as ``alias``."""
    with tempfile.TemporaryDirectory(prefix="vinaadi-a13-marriage-") as tmp:
        if revision is None:
            module_file = REPO / MODULE_PATH
        else:
            source = subprocess.run(  # noqa: S603 — fixed argv; the revision is the caller's own
                ["git", "show", f"{revision}:{MODULE_PATH}"],  # noqa: S607 — git from PATH, as every repo script
                cwd=REPO,
                check=True,
                capture_output=True,
            ).stdout
            module_file = Path(tmp) / "marriage_service.py"
            module_file.write_bytes(source)
        spec = importlib.util.spec_from_file_location(alias, module_file)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"could not build {alias}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[alias] = module
        spec.loader.exec_module(module)
    return module


class _Probe:
    """Records every ``min``/``max`` call made from one module."""

    def __init__(self, module: ModuleType) -> None:
        self.calls: list[tuple[str, tuple[Any, ...]]] = []
        module.min = self._recorder("min", builtins.min)  # type: ignore[attr-defined]
        module.max = self._recorder("max", builtins.max)  # type: ignore[attr-defined]

    def _recorder(self, name: str, real: Callable[..., Any]) -> Callable[..., Any]:
        def record(*args: Any, **kwargs: Any) -> Any:
            self.calls.append((name, args))
            return real(*args, **kwargs)

        return record

    def take(self) -> list[tuple[str, tuple[Any, ...]]]:
        calls, self.calls = self.calls, []
        return calls


def _run(module: ModuleType, probe: _Probe, payload: Any, gate: bool | None) -> tuple[str, list, Any]:
    probe.take()
    try:
        result = module.assess_marriage_prediction(payload, use_reasoning_gate=gate)
    except Exception as exc:  # noqa: BLE001 — a raising branch must raise identically
        return f"RAISES {type(exc).__name__}: {exc}", probe.take(), None
    body = json.dumps(
        dataclasses.asdict(result),
        default=str,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return body, probe.take(), result


def _verdict_path(result: Any, married: bool) -> str:
    if result is None:
        return "RAISES"
    factor_keys = {factor.key for factor in result.astrological_factors}
    for key, path in (
        ("relationship_gate", "RELATIONSHIP_GATE"),
        ("age_phase_gate", "AGE_GATE"),
        ("life_stage_gate", "UPPER_AGE_GATE"),
        ("promise_gate_blocked", "PROMISE_BLOCKED"),
        ("promise_gate_silent", "PROMISE_SILENT"),
    ):
        if key in factor_keys:
            return path
    prefix = "MARRIED" if married else "TIMING"
    suffix = "+band" if result.band is not None else ""
    return f"{prefix}_{result.confidence}{suffix}"


def _golden_cases(date_shift_control: bool) -> Iterator[tuple[str, Any, Any, bool | None, bool]]:
    from uuid import UUID

    from app.services._chart_build import _chart_response_from_profile
    from tests import test_marriage_prediction_golden as golden

    for profile_index, row in enumerate(golden.PROFILES):
        key = row[0]
        profile = golden._profile(*row)
        chart = _chart_response_from_profile(
            profile,
            "thirukanitham-2026-v1",
            chart_id=UUID(int=sum(map(ord, key)) + 1),
        )
        birth = chart.data.birth_profile
        for day in DATES:
            new_day = day + timedelta(days=31) if date_shift_control and profile_index == 0 else day
            for variant in VARIANTS:
                old_payload = golden._payload(chart, birth, day, variant)
                new_payload = golden._payload(chart, birth, new_day, variant)
                if variant == "lords-absent":
                    old_payload = dataclasses.replace(old_payload, maha_lord=None, antar_lord=None)
                    new_payload = dataclasses.replace(new_payload, maha_lord=None, antar_lord=None)
                gate = False if variant == "gate-off" else None
                yield f"{key}@{day.isoformat()}#{variant}", old_payload, new_payload, gate, variant == "married"


def _synthetic_payload(rng: random.Random, input_cls: type) -> Any:
    lagna = rng.randint(1, 12)
    planets = {graha: rng.randint(1, 12) for graha in GRAHAS}
    if rng.random() < 0.3:
        planets["VENUS"] = 6  # debilitated — feeds the promise gate's BLOCKED rule
    if rng.random() < 0.15:
        # The 7th lord placed in its own debilitation sign (BLOCKED's lord test).
        from app.calculations.chart_strength import DEBILITATION_RASI
        from app.calculations.life_area_prediction_models import house_lord_for_lagna

        lord = house_lord_for_lagna(lagna, 7)
        if lord in DEBILITATION_RASI:
            planets[lord] = DEBILITATION_RASI[lord]
    if rng.random() < 0.03:
        del planets["VENUS"]  # missing karaka — SILENT, or a raise with the gate off
    d9: dict[str, int] | None = None
    if rng.random() < 0.8:
        d9 = {graha: rng.randint(1, 12) for graha in GRAHAS}
        if rng.random() < 0.35:
            d9["VENUS"] = 6
        if rng.random() < 0.15:
            d9["VENUS"] = rng.choice((7, 2, 12))  # own / exalted in D9
    age = rng.choice((rng.randint(5, 17), rng.randint(18, 24), rng.randint(25, 35), rng.randint(36, 49), rng.randint(50, 85)))
    lords = rng.sample(GRAHAS, rng.choice((1, 2)))
    maha, antar = (lords[0], lords[-1]) if rng.random() < 0.7 else (None, None)
    longitudes = (
        {graha: rng.uniform(0, 360) for graha in GRAHAS if graha != "KETU"}
        if rng.random() < 0.5
        else None
    )
    return input_cls(
        as_of=date(2026, 1, 1) + timedelta(days=rng.randint(0, 5478)),
        lagna_rasi=lagna,
        planets_rasi=planets,
        active_dasha_lords=set(lords),
        transit_jupiter_rasi=rng.randint(1, 12),
        transit_venus_rasi=rng.randint(1, 12),
        age=age,
        life_stage=rng.choice(LIFE_STAGES),
        marital_status=rng.choice(MARITAL),
        venus_combust=rng.random() < 0.2,
        sevvai_dosham_cancelled=rng.random() < 0.5,
        rahu_ketu_label=rng.choice(RAHU_KETU),
        d9_rasi_by_planet=d9,
        relationship_to_owner=rng.choice(RELATIONSHIPS),
        planet_longitudes=longitudes,
        maha_lord=maha,
        antar_lord=antar,
    )


def compare(baseline_rev: str, candidate_rev: str | None, *, date_shift_control: bool) -> int:
    from app.core.age_gate import is_married_settled
    from app.services import feature_flags

    baseline = _load(baseline_rev, "app.services._a13_marriage_baseline")
    candidate = _load(candidate_rev, "app.services._a13_marriage_candidate")
    old_probe, new_probe = _Probe(baseline), _Probe(candidate)
    defaults = feature_flags._defaults()

    def set_flags(bands: bool, signature: bool) -> None:
        values = {**defaults, "reasoning_bands": bands, "reasoning_chart_signature": signature}
        flag = values.get
        baseline.get_flag = flag  # type: ignore[attr-defined]
        candidate.get_flag = flag  # type: ignore[attr-defined]

    differences: list[str] = []
    probe_only: list[str] = []
    cases = 0
    scored_with_probe = 0
    verdicts: Counter[str] = Counter()
    confidences: Counter[str] = Counter()
    bands: Counter[str] = Counter()
    factors: Counter[str] = Counter()
    chains = Counter[str]()

    def check(case: str, old_payload: Any, new_payload: Any, gate: bool | None, married: bool) -> None:
        nonlocal cases, scored_with_probe
        cases += 1
        old_body, old_calls, _ = _run(baseline, old_probe, old_payload, gate)
        new_body, new_calls, result = _run(candidate, new_probe, new_payload, gate)
        if old_body != new_body:
            differences.append(case)
        elif old_calls != new_calls:
            differences.append(case)
            probe_only.append(case)
        if any(name == "max" for name, _ in new_calls):
            scored_with_probe += 1
        verdicts[_verdict_path(result, married)] += 1
        if result is not None:
            confidences[result.confidence] += 1
            bands[str(result.band)] += 1
            chains["causal_chain" if result.causal_chain else "no_chain"] += 1
            factors.update(factor.key for factor in result.astrological_factors)

    golden_payloads = list(_golden_cases(date_shift_control))
    for bands_on, signature_on in FLAG_COMBOS:
        set_flags(bands_on, signature_on)
        for case, old_payload, new_payload, gate, married in golden_payloads:
            check(f"golden:{case}:bands={bands_on}:sig={signature_on}", old_payload, new_payload, gate, married)
    golden_cases = cases

    rng = random.Random(SEED)  # noqa: S311 — a reproducible test matrix, not a secret
    for index in range(SYNTHETIC_CASES):
        payload = _synthetic_payload(rng, candidate.MarriageAssessmentInput)
        old_payload = baseline.MarriageAssessmentInput(
            **{field.name: getattr(payload, field.name) for field in dataclasses.fields(payload)}
        )
        gate = rng.choice((None, True, False))
        bands_on, signature_on = rng.choice(FLAG_COMBOS)
        set_flags(bands_on, signature_on)
        check(
            f"synthetic:{index}:gate={gate}:bands={bands_on}:sig={signature_on}",
            old_payload,
            payload,
            gate,
            is_married_settled(payload.marital_status),
        )

    missing = sorted(VERDICT_PATHS - set(verdicts))
    print(
        f"baseline={baseline_rev} candidate={candidate_rev or 'worktree'} "
        f"cases={cases} (golden-derived {golden_cases}, synthetic {cases - golden_cases}) "
        f"differences={len(differences)} (probe-only {len(probe_only)})"
    )
    print(f"scored cases carrying the raw-score probe={scored_with_probe}")
    print(f"verdicts={dict(sorted(verdicts.items()))}")
    print(f"confidences={dict(sorted(confidences.items()))}")
    print(f"bands={dict(sorted(bands.items()))}")
    print(f"causal_chain={dict(sorted(chains.items()))}")
    print(f"unreached_verdict_paths={missing}")
    print(f"factor_keys={sorted(factors)}")
    if differences:
        print(f"first_differences={differences[:10]}")
    return len(differences)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", default="HEAD")
    parser.add_argument("--candidate", default=None, help="a Git revision; default is the working tree")
    parser.add_argument("--date-shift-control", action="store_true")
    parser.add_argument("--expect-differences", action="store_true")
    args = parser.parse_args()
    differences = compare(args.baseline, args.candidate, date_shift_control=args.date_shift_control)
    if args.expect_differences:
        return 0 if differences else 1
    return 0 if not differences else 1


if __name__ == "__main__":
    raise SystemExit(main())

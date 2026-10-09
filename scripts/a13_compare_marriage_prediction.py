"""Exact same-process comparator for the A13 marriage-service extraction.

The baseline module is loaded from Git under a second module name.  Registering
that name before ``exec_module`` is required for its slotted dataclasses.
"""
from __future__ import annotations

import argparse
import dataclasses
import importlib.util
import json
import subprocess
import sys
import tempfile
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from types import ModuleType

import pytest

REPO = Path(__file__).resolve().parents[1]
MODULE_PATH = "app/services/marriage_service.py"
BASELINE_ALIAS = "app.services._a13_marriage_baseline"
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
}


def _load_baseline(revision: str) -> ModuleType:
    source = subprocess.run(
        ["git", "show", f"{revision}:{MODULE_PATH}"],
        cwd=REPO,
        check=True,
        capture_output=True,
    ).stdout
    with tempfile.TemporaryDirectory(prefix="vinaadi-a13-marriage-") as tmp:
        module_file = Path(tmp) / "marriage_service.py"
        module_file.write_bytes(source)
        spec = importlib.util.spec_from_file_location(BASELINE_ALIAS, module_file)
        if spec is None or spec.loader is None:
            raise RuntimeError("could not build the baseline marriage-service module")
        module = importlib.util.module_from_spec(spec)
        sys.modules[BASELINE_ALIAS] = module
        spec.loader.exec_module(module)
    return module


def _serialise(result: object) -> str:
    return json.dumps(
        dataclasses.asdict(result),
        default=str,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _verdict_path(result: object, variant: str) -> str:
    factor_keys = {factor.key for factor in result.astrological_factors}
    if "relationship_gate" in factor_keys:
        return "RELATIONSHIP_GATE"
    if "age_phase_gate" in factor_keys:
        return "AGE_GATE"
    if "life_stage_gate" in factor_keys:
        return "UPPER_AGE_GATE"
    if "promise_gate_blocked" in factor_keys:
        return "PROMISE_BLOCKED"
    if "promise_gate_silent" in factor_keys:
        return "PROMISE_SILENT"
    prefix = "MARRIED" if variant == "married" else "TIMING"
    return f"{prefix}_{result.confidence}"


def compare(revision: str, *, date_shift_control: bool) -> int:
    from app.services import feature_flags
    from app.services import marriage_service as current
    from app.services._chart_build import _chart_response_from_profile
    from tests import test_marriage_prediction_golden as golden
    from uuid import UUID

    baseline = _load_baseline(revision)
    flag = lambda name: feature_flags._defaults().get(name)
    baseline.get_flag = flag
    current.get_flag = flag

    differences: list[str] = []
    confidences: Counter[str] = Counter()
    bands: Counter[str] = Counter()
    verdicts: Counter[str] = Counter()
    factors: Counter[str] = Counter()

    with pytest.MonkeyPatch.context():
        for profile_index, row in enumerate(golden.PROFILES):
            key = row[0]
            profile = golden._profile(*row)
            chart = _chart_response_from_profile(
                profile,
                "thirukanitham-2026-v1",
                chart_id=UUID(int=sum(map(ord, key)) + 1),
            )
            for day in DATES:
                for variant in VARIANTS:
                    old_payload = golden._payload(chart, chart.data.birth_profile, day, variant)
                    new_day = day
                    if date_shift_control and profile_index == 0:
                        new_day += timedelta(days=31)
                    new_payload = golden._payload(chart, chart.data.birth_profile, new_day, variant)
                    if variant == "lords-absent":
                        old_payload = dataclasses.replace(old_payload, maha_lord=None, antar_lord=None)
                        new_payload = dataclasses.replace(new_payload, maha_lord=None, antar_lord=None)
                    gate = False if variant == "gate-off" else None
                    old_result = baseline.assess_marriage_prediction(
                        old_payload,
                        use_reasoning_gate=gate,
                    )
                    new_result = current.assess_marriage_prediction(
                        new_payload,
                        use_reasoning_gate=gate,
                    )
                    case = f"{key}@{day.isoformat()}#{variant}"
                    if _serialise(old_result) != _serialise(new_result):
                        differences.append(case)
                    confidences[new_result.confidence] += 1
                    bands[str(new_result.band)] += 1
                    verdicts[_verdict_path(new_result, variant)] += 1
                    factors.update(factor.key for factor in new_result.astrological_factors)

    total = len(golden.PROFILES) * len(DATES) * len(VARIANTS)
    missing = sorted(VERDICT_PATHS - set(verdicts))
    print(f"baseline={revision} cases={total} differences={len(differences)}")
    print(f"verdicts={dict(sorted(verdicts.items()))}")
    print(f"confidences={dict(sorted(confidences.items()))}")
    print(f"bands={dict(sorted(bands.items()))}")
    print(f"unreached_verdict_paths={missing}")
    print(f"factor_keys={sorted(factors)}")
    if differences:
        print(f"first_differences={differences[:10]}")
    return len(differences)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", default="HEAD")
    parser.add_argument("--date-shift-control", action="store_true")
    parser.add_argument("--expect-differences", action="store_true")
    args = parser.parse_args()
    differences = compare(args.baseline, date_shift_control=args.date_shift_control)
    if args.expect_differences:
        return 0 if differences else 1
    return 0 if not differences else 1


if __name__ == "__main__":
    raise SystemExit(main())

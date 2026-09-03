"""Reasoning kernel — the "how a master decides" layer.

Doctrine (see docs/REASONING_LAYER_UPGRADE_PLAN.md §2):
  D1 — Gate before vote: birth promise is a veto, not a weight.
  D2 — Ordinal honesty: bands, never percentages, in user copy.
  D3 — SILENT (chart is quiet) is not BLOCKED (chart denies).
  D4 — Contradictions are investigated, not averaged.
  D5 — The prediction→outcome loop must close (calibration).
  D6 — Non-fatalistic, bilingual, always.

The knowledge layer (app/calculations) computes; domain services
(app/services) own their karakas/houses/vargas; this kernel owns the
decision procedure so the doctrine is enforced in exactly one place.
"""
from app.reasoning.calibration import (
    CalibrationBucket,
    CalibrationReport,
    GradedPrediction,
    build_calibration_report,
)
from app.reasoning.contradiction import Reading, classify
from app.reasoning.promise_gate import (
    GateGrade,
    GateResult,
    assess_promise,
    gate_from_l1,
)
from app.reasoning.timing_vote import (
    combine_gate_and_timing,
    timing_band_from_score,
    weighted_timing_vote,
)
from app.reasoning.verdict import (
    Band,
    BiText,
    Verdict,
    band_rank,
    band_to_legacy_confidence,
    cap_band,
    legacy_confidence_to_band,
)

__all__ = [
    "Band",
    "BiText",
    "CalibrationBucket",
    "CalibrationReport",
    "GateGrade",
    "GateResult",
    "GradedPrediction",
    "Reading",
    "Verdict",
    "assess_promise",
    "classify",
    "band_rank",
    "band_to_legacy_confidence",
    "build_calibration_report",
    "cap_band",
    "legacy_confidence_to_band",
    "combine_gate_and_timing",
    "gate_from_l1",
    "timing_band_from_score",
    "weighted_timing_vote",
]

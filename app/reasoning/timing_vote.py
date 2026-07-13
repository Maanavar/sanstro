"""Timing vote — D1 second stage: WHEN / how strongly, never WHETHER.

Only charts that pass the promise gate (PASS or WEAK) receive a timing
vote. The vote is a weighted combination of timing pillars (dasha,
gochar/transit, varga confirmation, ashtakavarga, panchangam) normalised
to 0–100, then mapped to an ordinal Band. Promise is NOT a vote member —
the gate already consumed it (re-adding it is the banned averaging error).
"""
from __future__ import annotations

from collections.abc import Sequence

from app.reasoning.promise_gate import GateGrade, GateResult
from app.reasoning.verdict import Band, cap_band
from app.services.feature_flags import get_flag


def weighted_timing_vote(components: Sequence[tuple[float, float]]) -> int:
    """Weighted vote over timing pillars.

    *components* is a sequence of ``(score_0_to_100, weight)`` pairs.
    Weights are renormalised so callers can simply drop a missing pillar.
    Returns an integer 0–100 (internal only — never rendered to users, D2).
    """
    total_weight = sum(w for _, w in components if w > 0)
    if total_weight <= 0:
        return 50
    vote = sum(score * w for score, w in components if w > 0) / total_weight
    return max(0, min(100, round(vote)))


def timing_band_from_score(timing_score: int) -> Band:
    """Map an internal 0–100 timing vote to an ordinal band (D2).

    Cutoffs are admin-tunable flags (P3-2/P3-3 recalibration mechanism) —
    see feature_flags.py for defaults and rollout rationale.
    """
    if timing_score >= get_flag("timing_band_strong_cutoff"):
        return Band.STRONG
    if timing_score >= get_flag("timing_band_likely_cutoff"):
        return Band.LIKELY
    if timing_score >= get_flag("timing_band_mixed_cutoff"):
        return Band.MIXED
    return Band.WEAK


def combine_gate_and_timing(gate: GateResult, timing_score: int) -> Band:
    """The doctrine-D1 combinator: GATE(promise) THEN VOTE(timing).

    BLOCKED/SILENT gates return their band directly — no timing vote can
    lift them. A WEAK gate proceeds but caps the final band at LIKELY
    (plan §Phase 1 grades).
    """
    if gate.grade is GateGrade.BLOCKED:
        return Band.BLOCKED
    if gate.grade is GateGrade.SILENT:
        return Band.SILENT
    band = timing_band_from_score(timing_score)
    if gate.grade is GateGrade.WEAK:
        band = cap_band(band, Band.LIKELY)
    return band

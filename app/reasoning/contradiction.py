"""Contradiction engine — D4: disagreement is investigated, never averaged (Phase 3).

When the promise gate and the timing vote disagree, a master does not
split the difference — they name the disagreement:

  - promise present + timing absent  → PROMISED_NOT_NOW      (wait)
  - promise absent  + timing present → ACTIVE_BUT_UNPROMISED (redirect)
  - both aligned                     → PROMISED_AND_TIMED
  - the chart denies                 → NOT_PROMISED (BLOCKED voice, D3)
  - quiet on both                    → SILENT (D4: "all silent → SILENT")

The classifier is pure and owns no copy; the bilingual templates live in
``narrative_engine`` (READING_VOICE) and each surface attaches the Reading
additively to its response (plan §Phase 3).
"""
from __future__ import annotations

from enum import Enum

from app.reasoning.promise_gate import GateGrade
from app.reasoning.verdict import Band, band_rank


class Reading(str, Enum):
    PROMISED_AND_TIMED = "PROMISED_AND_TIMED"        # aligned → act
    PROMISED_NOT_NOW = "PROMISED_NOT_NOW"            # wait — the window opens later
    ACTIVE_BUT_UNPROMISED = "ACTIVE_BUT_UNPROMISED"  # redirect the period's energy
    PARTIALLY_PROMISED = "PARTIALLY_PROMISED"        # WEAK gate + active timing — partial support, not a full promise (§15.2 Option B)
    NOT_PROMISED = "NOT_PROMISED"                    # gate BLOCKED (non-fatalistic voice)
    MIXED = "MIXED"                                  # genuine middle — no story to force
    SILENT = "SILENT"                                # quiet on promise and timing (D3/D4)


_LIKELY = band_rank(Band.LIKELY)
_WEAK = band_rank(Band.WEAK)


def classify(promise_grade: GateGrade, timing_band: Band | None) -> Reading:
    """Classify why (or whether) the promise gate and the timing vote disagree.

    ``timing_band`` must be the *pre-cap* band of the timing vote (a WEAK
    gate caps the published band at LIKELY, but the reading is about what
    the timing itself says), or ``None`` when the vote was never run —
    BLOCKED and SILENT gates skip it under D1.
    """
    if promise_grade is GateGrade.BLOCKED:
        # No timing can manufacture an unpromised event (D1) — timing is
        # irrelevant to the reading too.
        return Reading.NOT_PROMISED

    if promise_grade is GateGrade.SILENT:
        if timing_band is None or band_rank(timing_band) <= _WEAK:
            return Reading.SILENT
        if band_rank(timing_band) >= _LIKELY:
            return Reading.ACTIVE_BUT_UNPROMISED
        return Reading.MIXED

    if timing_band is None:
        # PASS/WEAK gates always vote on timing; a missing band here means
        # the caller has no timing signal — an honest middle, not a story.
        return Reading.MIXED

    rank = band_rank(timing_band)
    if promise_grade is GateGrade.PASS:
        if rank >= _LIKELY:
            return Reading.PROMISED_AND_TIMED
        if rank <= _WEAK:
            return Reading.PROMISED_NOT_NOW
        return Reading.MIXED

    # WEAK gate: the promise is partial (one of the two promise conditions
    # held, unlike SILENT where neither did — D3). Specialist review §15.2
    # (2026-07-13): folding this into the same redirect voice as a genuinely
    # silent chart overstates how little the chart supports the question —
    # WEAK + active timing gets its own "partial support" reading instead of
    # ACTIVE_BUT_UNPROMISED's full redirect. Anything less is a genuine middle.
    if rank >= _LIKELY:
        return Reading.PARTIALLY_PROMISED
    return Reading.MIXED

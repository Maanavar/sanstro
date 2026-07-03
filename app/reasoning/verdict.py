"""Reasoning kernel primitives — Band, BiText, Verdict (Phase 0).

D2 — Ordinal honesty: public confidence is an ordinal band, never a
percentage. Internal integer scores may exist for computation but must
not surface in user copy.

D3 — Distinguish silence from denial: BLOCKED means the chart actively
denies; SILENT means the chart is quiet (insufficient signal). They are
not the same "low".
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from enum import Enum


class Band(str, Enum):
    STRONG = "STRONG"    # promised + timing aligned
    LIKELY = "LIKELY"
    MIXED = "MIXED"
    WEAK = "WEAK"
    BLOCKED = "BLOCKED"  # chart denies it (D3)
    SILENT = "SILENT"    # chart is quiet — insufficient signal (D3)


# Ordinal rank for comparisons; never expose the int to users (D2).
_RANK: dict[Band, int] = {
    Band.BLOCKED: 0,
    Band.SILENT: 1,
    Band.WEAK: 2,
    Band.MIXED: 3,
    Band.LIKELY: 4,
    Band.STRONG: 5,
}


def band_rank(band: Band) -> int:
    """Ordinal rank of a band, for internal comparisons only (D2)."""
    return _RANK[band]


def cap_band(band: Band, ceiling: Band) -> Band:
    """Clamp *band* so it never exceeds *ceiling* on the ordinal scale.

    BLOCKED and SILENT are epistemic states, not intensities — they are
    never produced by capping and pass through unchanged.
    """
    if band in (Band.BLOCKED, Band.SILENT):
        return band
    if _RANK[band] > _RANK[ceiling]:
        return ceiling
    return band


# Legacy HIGH/MEDIUM/LOW mapping so existing schemas keep working during
# migration (plan §Phase 0 step 2).
_LEGACY: dict[Band, str] = {
    Band.STRONG: "HIGH",
    Band.LIKELY: "HIGH",
    Band.MIXED: "MEDIUM",
    Band.WEAK: "LOW",
    Band.BLOCKED: "LOW",
    Band.SILENT: "LOW",
}


def band_to_legacy_confidence(band: Band) -> str:
    """Map a Band to the legacy HIGH/MEDIUM/LOW confidence vocabulary."""
    return _LEGACY[band]


# Lossy reverse map for the calibration log's silent-launch (plan Phase 4):
# legacy-path predictions carry no Band yet, but must still be logged so
# hit-rates accrue before the gate flags on. Conservative on purpose —
# legacy HIGH claims LIKELY, never STRONG.
_LEGACY_TO_BAND: dict[str, Band] = {
    "HIGH": Band.LIKELY,
    "MEDIUM": Band.MIXED,
    "LOW": Band.WEAK,
}


def legacy_confidence_to_band(confidence: str) -> Band:
    """Approximate a Band from legacy HIGH/MEDIUM/LOW (calibration log only).

    This must never drive user copy — it exists so the D5 accountability
    table can record legacy-path predictions on a comparable ordinal scale.
    """
    return _LEGACY_TO_BAND.get(confidence.upper(), Band.MIXED)


@dataclass(frozen=True, slots=True)
class BiText:
    ta: str
    en: str


@dataclass(frozen=True, slots=True)
class Verdict:
    band: Band
    promise_passed: bool           # did the gate pass?
    reason: BiText                 # why this band (D2 requires a reason)
    timing_window_start: date | None = None
    timing_window_end: date | None = None
    # internal only — MUST NOT be rendered in user copy (D2)
    _debug_score: int | None = None

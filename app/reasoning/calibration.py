"""D5 calibration — hit/near/miss aggregation over the prediction log.

Pure functions only: the kernel never touches the database. The admin API
fetches ``PredictionLog`` rows and hands them here; this module reduces
them to per-bucket hit-rates the owner + specialist can review before any
weight is recalibrated (plan Phase 4 step 3-4 — recalibration itself stays
a manual, reviewed act, never auto-tuning).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class GradedPrediction:
    """The projection of one PredictionLog row that calibration needs."""

    life_area: str
    band: str
    outcome_grade: str | None          # HIT / NEAR / MISS, or None while open
    active_maha: str | None = None


@dataclass(slots=True)
class CalibrationBucket:
    key: str                            # e.g. "MARRIAGE/STRONG" or "VENUS"
    hit: int = 0
    near: int = 0
    miss: int = 0

    @property
    def n(self) -> int:
        return self.hit + self.near + self.miss

    @property
    def hit_rate(self) -> float | None:
        """hit / (hit+near+miss), or None when the bucket is empty."""
        return round(self.hit / self.n, 3) if self.n else None


@dataclass(slots=True)
class CalibrationReport:
    total_logged: int = 0
    total_open: int = 0
    total_graded: int = 0
    # "Marriage STRONG predictions: 71% hit, 12% near, 17% miss (n=41)"
    by_area_band: list[CalibrationBucket] = field(default_factory=list)
    by_dasha_lord: list[CalibrationBucket] = field(default_factory=list)


def _tally(bucket: CalibrationBucket, grade: str) -> None:
    if grade == "HIT":
        bucket.hit += 1
    elif grade == "NEAR":
        bucket.near += 1
    elif grade == "MISS":
        bucket.miss += 1


def build_calibration_report(rows: list[GradedPrediction]) -> CalibrationReport:
    """Aggregate graded predictions into per-area-band and per-lord buckets.

    Open (ungraded) rows are counted in the totals but excluded from the
    buckets — a hit-rate over unresolved claims would be meaningless.
    """
    report = CalibrationReport(total_logged=len(rows))
    area_band: dict[str, CalibrationBucket] = {}
    lords: dict[str, CalibrationBucket] = {}

    for row in rows:
        if row.outcome_grade is None:
            report.total_open += 1
            continue
        report.total_graded += 1

        ab_key = f"{row.life_area}/{row.band}"
        if ab_key not in area_band:
            area_band[ab_key] = CalibrationBucket(key=ab_key)
        _tally(area_band[ab_key], row.outcome_grade)

        if row.active_maha:
            if row.active_maha not in lords:
                lords[row.active_maha] = CalibrationBucket(key=row.active_maha)
            _tally(lords[row.active_maha], row.outcome_grade)

    report.by_area_band = sorted(area_band.values(), key=lambda b: (-b.n, b.key))
    report.by_dasha_lord = sorted(lords.values(), key=lambda b: (-b.n, b.key))
    return report

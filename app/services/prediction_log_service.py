"""Prediction accountability log — D5 calibration data spine (plan Phase 4).

Two responsibilities, both best-effort and never allowed to break the
serving path (mirrors the try/except posture in ``life_event_log_service``):

1. **Write on serve** — when whatif / marriage / life-areas emit a material
   prediction, persist a ``PredictionLog`` row (band, window, active dasha).
2. **Join on outcome** — when a user logs a ``UserLifeEvent``, match it to
   open rows for the same chart + mapped life area and grade HIT/NEAR/MISS.

Both sides are gated by the ``reasoning_calibration_log`` flag (silent
launch: collect for weeks before trusting hit-rates, plan §8).
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.prediction_log import PredictionLog
from app.services.feature_flags import get_flag

logger = logging.getLogger(__name__)

# Grading tolerances (plan Phase 4 step 2).
# NEAR: event lands within ±N days of the claimed window ("±N months").
NEAR_MARGIN_DAYS = 92
# A BLOCKED claim has no window; it is falsified (MISS) by a matching event
# within this horizon after the claim was logged.
BLOCKED_MISS_HORIZON_DAYS = 365

# Whatif scenario → canonical life area (uppercase, matches life-areas keys).
_SCENARIO_TO_AREA: dict[str, str] = {
    "job_change": "CAREER",
    "business_start": "CAREER",
    "marriage": "MARRIAGE",
    "education": "EDUCATION",
    "property": "PROPERTY",
    "health": "HEALTH",
    "travel_abroad": "FOREIGN",
    "spiritual": "SPIRITUAL",
    "family_harmony": "FAMILY_HARMONY",
    "money": "MONEY",
    "child_birth": "CHILDREN",
    "other": "OTHER",
}

# UserLifeEvent.event_type → life areas whose open predictions it can grade.
# RELATIONSHIP_* grades both the marriage surface and the RELATIONSHIPS
# life area; OTHER grades nothing (no typed claim to hold accountable).
_EVENT_TO_AREAS: dict[str, frozenset[str]] = {
    "JOB_CHANGE": frozenset({"CAREER"}),
    "PROMOTION": frozenset({"CAREER"}),
    "RELATIONSHIP_START": frozenset({"MARRIAGE", "RELATIONSHIPS"}),
    "RELATIONSHIP_END": frozenset({"MARRIAGE", "RELATIONSHIPS"}),
    "RELOCATION": frozenset({"FOREIGN", "PROPERTY"}),
    "HEALTH_EVENT": frozenset({"HEALTH"}),
    "EXAM_RESULT": frozenset({"EDUCATION"}),
    "FINANCIAL_MILESTONE": frozenset({"MONEY"}),
    "FAMILY_LOSS": frozenset({"FAMILY_HARMONY"}),
    "OTHER": frozenset(),
}


def scenario_to_area(scenario: str) -> str:
    """Canonical life area for a whatif scenario key."""
    return _SCENARIO_TO_AREA.get(scenario.lower(), "OTHER")


def log_prediction(
    session: Session,
    *,
    chart_id: UUID,
    source: str,
    life_area: str,
    band: str,
    calc_version: str,
    window_start: date | None = None,
    window_end: date | None = None,
    active_maha: str | None = None,
    active_antar: str | None = None,
    reading: str | None = None,
) -> None:
    """Persist one served prediction, best-effort.

    Never raises and never commits — the row rides the request's own
    transaction (``get_db`` commits on success). Skips exact repeats: an
    open row for the same chart/source/area/band with an overlapping window
    means the user simply re-viewed the same claim, not that we made a new
    one — logging it again would inflate n in the calibration report.
    """
    if not get_flag("reasoning_calibration_log"):
        return
    try:
        life_area = life_area.upper()
        conditions = [
            PredictionLog.chart_id == chart_id,
            PredictionLog.source == source,
            PredictionLog.life_area == life_area,
            PredictionLog.band == band,
            PredictionLog.outcome_grade.is_(None),
            PredictionLog.deleted_at.is_(None),
        ]
        if window_start is None:
            conditions.append(PredictionLog.window_start.is_(None))
        else:
            conditions.append(PredictionLog.window_start <= (window_end or window_start))
            conditions.append(PredictionLog.window_end >= window_start)
        duplicate = session.execute(
            select(PredictionLog.id).where(*conditions).limit(1)
        ).first()
        if duplicate is not None:
            return

        session.add(
            PredictionLog(
                chart_id=chart_id,
                source=source,
                life_area=life_area,
                reading=reading,
                band=band,
                window_start=window_start,
                window_end=window_end,
                active_maha=active_maha,
                active_antar=active_antar,
                calc_version=calc_version,
            )
        )
        session.flush()
    except Exception as exc:  # noqa: BLE001 — accountability must never break serving
        logger.debug("prediction_log write skipped: %s", exc)


def _grade_row(row: PredictionLog, event_date: date) -> str | None:
    """HIT / NEAR / MISS for one open row against a matching event, else None.

    - BLOCKED: the chart denied it, yet it happened within the horizon after
      the claim → MISS. (Events predating the claim don't falsify a forward
      claim.)
    - SILENT: "the chart is quiet" claims nothing — never graded (D3).
    - Windowed positive claims: inside the window → HIT; within
      ``NEAR_MARGIN_DAYS`` of either edge → NEAR; otherwise left open (a
      later event may still land in the window).
    """
    if row.band == "BLOCKED":
        claimed_on = row.created_at.date()
        if claimed_on <= event_date <= claimed_on + timedelta(days=BLOCKED_MISS_HORIZON_DAYS):
            return "MISS"
        return None
    if row.band == "SILENT":
        return None
    if row.window_start is None or row.window_end is None:
        return None
    if row.window_start <= event_date <= row.window_end:
        return "HIT"
    margin = timedelta(days=NEAR_MARGIN_DAYS)
    if row.window_start - margin <= event_date <= row.window_end + margin:
        return "NEAR"
    return None


def join_outcome(
    session: Session,
    *,
    chart_id: UUID,
    event_id: UUID,
    event_type: str,
    event_date: date,
) -> int:
    """Grade open predictions against a newly logged life event.

    Returns the number of rows graded. Best-effort: never raises, never
    commits (rides the caller's transaction).
    """
    if not get_flag("reasoning_calibration_log"):
        return 0
    try:
        areas = _EVENT_TO_AREAS.get(event_type.upper())
        if not areas:
            return 0
        open_rows = session.execute(
            select(PredictionLog).where(
                PredictionLog.chart_id == chart_id,
                PredictionLog.life_area.in_(sorted(areas)),
                PredictionLog.outcome_grade.is_(None),
                PredictionLog.deleted_at.is_(None),
            )
        ).scalars().all()

        graded = 0
        for row in open_rows:
            grade = _grade_row(row, event_date)
            if grade is None:
                continue
            row.outcome_grade = grade
            row.outcome_event_id = event_id
            graded += 1
        if graded:
            session.flush()
        return graded
    except Exception as exc:  # noqa: BLE001 — accountability must never break event logging
        logger.debug("prediction_log outcome join skipped: %s", exc)
        return 0

from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class PredictionLog(TimestampMixin, Base):
    """D5 accountability table (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 4).

    Every material prediction served with a band is logged here; when a real
    ``UserLifeEvent`` arrives it is joined back and graded HIT / NEAR / MISS.
    The calibration report (``app/reasoning/calibration.py``) aggregates these
    grades so the engine is accountable to its own hit-rate.

    Privacy posture: this table stores only derived astrological claims — the
    typed life area, band, window, and dasha lords. It never stores event
    descriptions or any birth PII; the event link is a nullable FK with
    ``ondelete="SET NULL"`` (same pattern as ``feedback.py``) so deleting a
    life event severs the join without losing the graded row.
    """

    __tablename__ = "prediction_log"
    __table_args__ = (
        Index("idx_prediction_log_chart", "chart_id"),
        # The outcome join scans open (ungraded) rows per chart + area.
        Index("idx_prediction_log_open", "chart_id", "life_area", "outcome_grade"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(
        ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False
    )

    # Which surface served the prediction: whatif | marriage | life_areas
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    # Canonical life area (CAREER, MARRIAGE, MONEY, ...), uppercased.
    life_area: Mapped[str] = mapped_column(String(32), nullable=False)
    # D4 Reading (PROMISED_AND_TIMED, ...) — filled once Phase 3 ships.
    reading: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Ordinal band claimed (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT).
    band: Mapped[str] = mapped_column(String(16), nullable=False)

    window_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    window_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    active_maha: Mapped[str | None] = mapped_column(String(16), nullable=True)
    active_antar: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Filled later by the outcome join:
    outcome_event_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("user_life_events.id", ondelete="SET NULL"), nullable=True
    )
    outcome_grade: Mapped[str | None] = mapped_column(String(8), nullable=True)  # HIT / NEAR / MISS

    calc_version: Mapped[str] = mapped_column(String(64), nullable=False)

    chart = relationship("Chart", foreign_keys=[chart_id])
    outcome_event = relationship("UserLifeEvent", foreign_keys=[outcome_event_id])

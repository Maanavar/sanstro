from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DashaPeriod(TimestampMixin, Base):
    __tablename__ = "dasha_periods"
    __table_args__ = (
        CheckConstraint(
            "level IN ('maha', 'antar', 'pratyantar', 'sookshma', 'prana')",
            name="ck_dasha_periods_level_valid",
        ),
        Index("idx_dasha_chart_level", "chart_id", "level"),
        Index("idx_dasha_date_lookup", "chart_id", "start_date", "end_date"),
    )

    dasha_period_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False)
    lord: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_dasha_period_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("dasha_periods.dasha_period_id", ondelete="CASCADE"), nullable=True
    )
    start_jd: Mapped[float] = mapped_column(Numeric(16, 8), nullable=False)
    end_jd: Mapped[float] = mapped_column(Numeric(16, 8), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    sequence_index: Mapped[int] = mapped_column(nullable=False)
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

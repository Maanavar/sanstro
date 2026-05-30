from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserLifeEvent(TimestampMixin, Base):
    __tablename__ = "user_life_events"
    __table_args__ = (
        Index("idx_user_life_events_chart", "chart_id"),
        Index("idx_user_life_events_date", "event_date"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(
        ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    chart = relationship("Chart", foreign_keys=[chart_id])

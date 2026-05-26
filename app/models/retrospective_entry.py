from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class RetrospectiveEntry(TimestampMixin, Base):
    __tablename__ = "retrospective_entries"
    __table_args__ = (
        Index("idx_retrospective_owner", "owner_user_id"),
        Index("idx_retrospective_chart", "chart_id"),
        Index("idx_retrospective_event_date", "event_date"),
    )

    retrospective_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id"), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    event_description: Mapped[str] = mapped_column(String(500), nullable=False)
    analysis_payload: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)

    owner_user = relationship("User", back_populates="retrospectives")
    chart = relationship("Chart", back_populates="retrospectives")

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, String, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PeyarchiAlert(Base):
    __tablename__ = "peyarchi_alerts"
    __table_args__ = (
        UniqueConstraint("chart_id", "planet", "peyarchi_date", name="uq_peyarchi_alerts_chart_planet_date"),
        Index("idx_peyarchi_alerts_chart", "chart_id"),
        Index("idx_peyarchi_alerts_date", "peyarchi_date"),
    )

    alert_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False)
    planet: Mapped[str] = mapped_column(String(16), nullable=False)
    from_rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    to_rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    peyarchi_date: Mapped[date] = mapped_column(Date, nullable=False)
    peyarchi_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    impact_from_moon: Mapped[int] = mapped_column(nullable=False, default=0)
    sani_cycle_after: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    notified_30d: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    notified_7d: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    notified_1d: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    notified_day_of: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

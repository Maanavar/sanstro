from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, JSON, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ChartPlanet(TimestampMixin, Base):
    __tablename__ = "chart_planets"
    __table_args__ = (
        CheckConstraint("pada BETWEEN 1 AND 4", name="chart_planet_pada_range"),
        CheckConstraint("house_from_lagna BETWEEN 1 AND 12", name="ck_chart_planets_house_from_lagna_range"),
        CheckConstraint("bhava_house IS NULL OR (bhava_house BETWEEN 1 AND 12)", name="ck_chart_planets_bhava_house_range"),
        Index("idx_chart_planets_chart", "chart_id"),
        Index("idx_chart_planets_graha", "graha"),
    )

    chart_planet_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False)
    graha: Mapped[str] = mapped_column(String(32), nullable=False)
    absolute_longitude: Mapped[float] = mapped_column(Numeric(12, 8), nullable=False)
    degree_in_rasi: Mapped[float] = mapped_column(Numeric(12, 8), nullable=False)
    rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    nakshatra: Mapped[str] = mapped_column(String(32), nullable=False)
    pada: Mapped[int] = mapped_column(Integer, nullable=False)
    house_from_lagna: Mapped[int] = mapped_column(Integer, nullable=False)
    bhava_house: Mapped[int | None] = mapped_column(Integer, nullable=True)
    speed_deg_per_day: Mapped[float | None] = mapped_column(Numeric(12, 8), nullable=True)
    is_retrograde: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    is_combust: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    is_sandhi: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    dignity: Mapped[str | None] = mapped_column(String(32), nullable=True)
    d9_rasi: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_vargottama: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    raw_payload: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict, server_default=text("'{}'"))

    chart = relationship("Chart", back_populates="planets")

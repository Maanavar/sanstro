from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, CheckConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Chart(TimestampMixin, Base):
    __tablename__ = "charts"
    __table_args__ = (
        CheckConstraint("janma_pada BETWEEN 1 AND 4", name="janma_pada_range"),
        CheckConstraint("status IN ('pending', 'completed', 'failed')", name="status_valid"),
        Index("idx_charts_birth_profile", "birth_profile_id"),
        Index("idx_charts_calc_version", "calculation_version"),
    )

    chart_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    birth_profile_id: Mapped[UUID] = mapped_column(ForeignKey("birth_profiles.birth_profile_id"), nullable=False)
    calculation_version: Mapped[str] = mapped_column(Text, nullable=False)
    ephemeris_provider: Mapped[str] = mapped_column(
        String(64), nullable=False, default="SWISS_EPHEMERIS", server_default=text("'SWISS_EPHEMERIS'")
    )
    ephemeris_version: Mapped[str | None] = mapped_column(Text, nullable=True)
    ayanamsa_type: Mapped[str] = mapped_column(String(32), nullable=False, default="LAHIRI", server_default=text("'LAHIRI'"))
    ayanamsa_value_degrees: Mapped[float | None] = mapped_column(Numeric(12, 8), nullable=True)
    node_type: Mapped[str] = mapped_column(String(32), nullable=False, default="MEAN_NODE", server_default=text("'MEAN_NODE'"))
    house_system_primary: Mapped[str] = mapped_column(
        String(32), nullable=False, default="WHOLE_SIGN", server_default=text("'WHOLE_SIGN'")
    )
    julian_day: Mapped[float] = mapped_column(Numeric(16, 8), nullable=False)
    lagna_rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    lagna_longitude: Mapped[float] = mapped_column(Numeric(12, 8), nullable=False)
    moon_rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    janma_nakshatra: Mapped[str] = mapped_column(String(32), nullable=False)
    janma_pada: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="completed", server_default=text("'completed'"))
    warnings: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list, server_default=text("'[]'"))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    birth_profile = relationship("BirthProfile", back_populates="charts")
    planets = relationship("ChartPlanet", back_populates="chart", cascade="all, delete-orphan", lazy="selectin")
    contexts = relationship("UserContext")
    journal_entries = relationship("JournalEntry", back_populates="chart")
    retrospectives = relationship("RetrospectiveEntry", back_populates="chart")

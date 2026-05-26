from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Index, Numeric, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PanchangamCache(Base):
    __tablename__ = "panchangam_cache"
    __table_args__ = (
        UniqueConstraint("cache_date", "latitude", "longitude", "ayanamsa_type", name="uq_panchangam_cache_key"),
        Index("idx_panchangam_cache_date", "cache_date"),
    )

    cache_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    cache_date: Mapped[date] = mapped_column(Date, nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    ayanamsa_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="LAHIRI", server_default=text("'LAHIRI'")
    )
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

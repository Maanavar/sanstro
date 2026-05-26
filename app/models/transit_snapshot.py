from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TransitSnapshot(Base):
    __tablename__ = "transit_snapshots"
    __table_args__ = (
        UniqueConstraint("as_of_utc", "calculation_version", name="uq_transit_snapshots_as_of_calc"),
    )

    transit_snapshot_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    as_of_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    calculation_version: Mapped[str] = mapped_column(String(64), nullable=False)
    planets: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

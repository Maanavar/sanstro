from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class VargaPosition(TimestampMixin, Base):
    __tablename__ = "varga_positions"
    __table_args__ = (
        UniqueConstraint("chart_id", "varga_code", "graha", name="uq_varga_positions_chart_code_graha"),
        CheckConstraint(
            "house_from_varga_lagna BETWEEN 1 AND 12",
            name="ck_varga_positions_house_from_varga_lagna_range",
        ),
        Index("idx_varga_positions_chart", "chart_id"),
    )

    varga_position_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False)
    varga_code: Mapped[str] = mapped_column(String(16), nullable=False)
    graha: Mapped[str] = mapped_column(String(32), nullable=False)
    rasi: Mapped[str] = mapped_column(String(32), nullable=False)
    house_from_varga_lagna: Mapped[int | None] = mapped_column(nullable=True)
    calculation_method: Mapped[str] = mapped_column(String(64), nullable=False)
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

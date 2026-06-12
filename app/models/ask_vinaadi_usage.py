from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, Integer, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AskVinaadiUsage(TimestampMixin, Base):
    """Per-user, per-day Ask Vinaadi chip usage — Feature 3 (Ask Vinaadi Lite)."""

    __tablename__ = "ask_vinaadi_usage"
    __table_args__ = (
        UniqueConstraint("user_id", "usage_date", name="uq_ask_vinaadi_usage_user_date"),
        Index("idx_ask_vinaadi_usage_user_date", "user_id", "usage_date"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    chip_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))

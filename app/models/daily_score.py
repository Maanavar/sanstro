from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DailyScore(TimestampMixin, Base):
    __tablename__ = "daily_scores"
    __table_args__ = (
        UniqueConstraint("birth_profile_id", "score_date", name="uq_daily_scores_profile_date"),
        Index("idx_daily_scores_profile_date", "birth_profile_id", "score_date"),
    )

    score_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    birth_profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("birth_profiles.birth_profile_id", ondelete="CASCADE"), nullable=False
    )
    score_date: Mapped[date] = mapped_column(Date, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)

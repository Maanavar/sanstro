from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, Integer, JSON, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class FamilyDailyScore(TimestampMixin, Base):
    __tablename__ = "family_daily_scores"
    __table_args__ = (
        UniqueConstraint("family_vault_id", "date_local", "timezone", name="uq_family_daily_scores_vault_date_tz"),
        Index("idx_family_daily_scores_vault_date", "family_vault_id", "date_local"),
    )

    family_daily_score_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    family_vault_id: Mapped[UUID] = mapped_column(
        ForeignKey("family_vaults.family_vault_id", ondelete="CASCADE"), nullable=False
    )
    date_local: Mapped[date] = mapped_column(Date, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    family_score: Mapped[int] = mapped_column(Integer, nullable=False)
    family_label: Mapped[str] = mapped_column(String(32), nullable=False)
    aggregate_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False)
    member_scores: Mapped[list] = mapped_column(JSON, nullable=False)
    best_family_windows: Mapped[list] = mapped_column(JSON, nullable=False, default=list, server_default=text("'[]'"))
    avoid_for_family_decisions: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list, server_default=text("'[]'")
    )
    support_need_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    decision_readiness_index: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    family_vault = relationship("FamilyVault", back_populates="family_daily_scores")

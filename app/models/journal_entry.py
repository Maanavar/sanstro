from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class JournalEntry(TimestampMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (
        Index("idx_journal_owner", "owner_user_id"),
        Index("idx_journal_chart", "chart_id"),
        Index("idx_journal_entry_date", "entry_date"),
    )

    journal_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id"), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    life_area: Mapped[str] = mapped_column(String(32), nullable=False, default="general")
    note_text: Mapped[str] = mapped_column(String(2000), nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    anchor_payload: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)

    owner_user = relationship("User", back_populates="journal_entries")
    chart = relationship("Chart", back_populates="journal_entries")

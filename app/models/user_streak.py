from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserStreak(TimestampMixin, Base):
    """One row per user — consecutive-day activity streak.

    Day boundaries are computed in Asia/Kolkata by the streak service;
    the single-row-per-user shape makes same-day pings idempotent.
    """

    __tablename__ = "user_streaks"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    current_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    longest_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    last_active_date: Mapped[date] = mapped_column(Date, nullable=False)

    owner_user = relationship("User")

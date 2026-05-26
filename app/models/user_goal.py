from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

VALID_GOAL_TYPES = {
    "job_change",
    "business_start",
    "marriage",
    "education",
    "property",
    "health",
    "travel_abroad",
    "spiritual",
    "family_harmony",
    "money",
    "child_birth",
    "other",
}


class UserGoal(TimestampMixin, Base):
    __tablename__ = "user_goals"
    __table_args__ = (
        Index("idx_user_goals_owner", "owner_user_id"),
        Index("idx_user_goals_chart", "chart_id"),
    )

    goal_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id"), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    language_preference: Mapped[str] = mapped_column(
        String(16), nullable=False, default="ta-en", server_default=text("'ta-en'")
    )

    owner_user = relationship("User")
    chart = relationship("Chart")

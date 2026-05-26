from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserPreference(TimestampMixin, Base):
    __tablename__ = "user_preferences"
    __table_args__ = (
        UniqueConstraint("owner_user_id", name="uq_user_preferences_owner"),
        Index("idx_user_preferences_owner", "owner_user_id"),
    )

    preference_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    journal_retention_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=365,
        server_default=text("365"),
    )
    last_retention_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner_user = relationship("User", back_populates="preferences")

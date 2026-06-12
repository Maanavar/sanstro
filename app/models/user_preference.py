from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, text
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
    dashboard_lang: Mapped[str] = mapped_column(
        String(8), nullable=False, default="ta", server_default=text("'ta'")
    )
    # Feature 2 — Life Mode (focus intent). Distinct from users.user_mode (dashboard
    # complexity mode). Allowed values live in app/core/life_mode.py.
    life_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="BALANCED", server_default=text("'BALANCED'")
    )
    life_mode_set_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    show_life_mode_picker: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    owner_user = relationship("User", back_populates="preferences")

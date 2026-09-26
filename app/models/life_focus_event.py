from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LifeFocusEvent(Base):
    """Minimal, PII-free history behind Life Focus adoption metrics.

    The row deliberately contains no chart, birth, profile, question, or
    rendered label. The opaque user id is needed only to deduplicate active
    readers for the monthly rate and is removed by the user FK cascade.
    """

    __tablename__ = "life_focus_events"
    __table_args__ = (
        CheckConstraint(
            "intent IN ('SELECT', 'SKIP', 'KEEP')",
            name="intent",
        ),
        CheckConstraint(
            "surface IS NULL OR surface IN ('FIRST_RUN_PICKER', 'WEB', 'MOBILE')",
            name="surface",
        ),
        Index("idx_life_focus_events_created_at", "created_at"),
        Index("idx_life_focus_events_user_created", "user_id", "created_at"),
    )

    event_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    intent: Mapped[str] = mapped_column(String(12), nullable=False)
    previous_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    new_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    is_first_run: Mapped[bool] = mapped_column(Boolean, nullable=False)
    # Entry point of the write; NULL for clients that predate the field. Only
    # FIRST_RUN_PICKER rows can be a Skip, so only they form the Skip-rate base.
    surface: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

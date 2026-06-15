from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Feedback(TimestampMixin, Base):
    """Beta feedback and reviews submitted by users.

    Replaces the previous in-process ``_feedback_log`` list so submissions
    survive server restarts — essential while the open beta's whole purpose is
    collecting reviews and bug reports.

    ``user_id`` uses ``ondelete="SET NULL"`` so that if a user deletes their
    account, an honest review or bug report they left is preserved (with the PII
    link severed) rather than vanishing.
    """

    __tablename__ = "feedback"
    __table_args__ = (
        Index("idx_feedback_created_at", "created_at"),
        Index("idx_feedback_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )

    # bug | calculation | suggestion | review | other
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="other")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    page_context: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # The user explicitly marked this as a review we may quote/feature.
    is_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # The user is open to being contacted about their feedback / the reviewer perk.
    allow_contact: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Admin-toggled, discretionary: this reviewer qualifies for extended free access.
    reward_qualified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

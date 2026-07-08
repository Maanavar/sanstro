from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PoruthamShare(Base):
    """A read-only, unauthenticated share link for a single porutham result.

    The snapshot is captured once at creation time and never recomputed from
    live chart/birth-profile data on view — this keeps the public surface
    fully decoupled from the owner's PII after the link is created.
    """

    __tablename__ = "porutham_shares"
    __table_args__ = (
        Index("idx_porutham_shares_owner_user_id", "owner_user_id"),
        Index("idx_porutham_shares_token_hash", "token_hash", unique=True),
    )

    porutham_share_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    # SHA-256 hex digest — never store the plaintext token
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    label_a: Mapped[str | None] = mapped_column(String(120), nullable=True)
    label_b: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Minimized DirectPoruthamData dump — no names/birth details, ever
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

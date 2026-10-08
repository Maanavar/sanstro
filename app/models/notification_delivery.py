from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class NotificationDelivery(TimestampMixin, Base):
    """One durable external-channel delivery for a notification intent."""

    __tablename__ = "notification_deliveries"
    __table_args__ = (
        CheckConstraint("channel IN ('push', 'email')", name="channel_supported"),
        CheckConstraint(
            "status IN ('pending', 'claimed', 'retry', 'delivered', 'expired', "
            "'suppressed', 'failed_permanent', 'exhausted')",
            name="status_supported",
        ),
        CheckConstraint("attempt_count >= 0", name="attempt_count_nonnegative"),
        UniqueConstraint("notification_id", "channel", name="uq_notification_deliveries_intent_channel"),
        Index("ix_notification_deliveries_eligible", "status", "next_attempt_at"),
        Index("ix_notification_deliveries_claim_expiry", "status", "claim_expires_at"),
    )

    delivery_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    notification_id: Mapped[UUID] = mapped_column(
        ForeignKey("notifications.notification_id", ondelete="CASCADE"),
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        server_default=text("'pending'"),
    )
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    claimed_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    claim_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

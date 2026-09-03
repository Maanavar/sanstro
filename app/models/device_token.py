from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DeviceToken(Base):
    """One row per installed app instance. Upserted by device_id on every launch."""

    __tablename__ = "device_tokens"
    __table_args__ = (
        Index("idx_device_tokens_user_id", "user_id"),
        Index("idx_device_tokens_anonymous_id", "anonymous_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # Stable per-install UUID generated client-side (expo-device or crypto.randomUUID)
    device_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    # Set after login; cleared on logout. Nullable so guests are accepted.
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    # Guest identity: stable per-install ID stored in AsyncStorage
    anonymous_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fcm_token: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)  # "ios" | "android"
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

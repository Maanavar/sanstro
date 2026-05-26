from __future__ import annotations

from datetime import time
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, Time, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserNotificationPreference(TimestampMixin, Base):
    """
    Opt-in notification preferences per user.

    All channels default to False (opt-in, not opt-out) per Tamil cultural
    privacy expectation described in product spec Module 18.
    """

    __tablename__ = "user_notification_preferences"
    __table_args__ = (
        UniqueConstraint("owner_user_id", name="uq_user_notification_preferences_owner"),
        Index("idx_user_notif_pref_owner", "owner_user_id"),
        CheckConstraint(
            "notification_channel IN ('none','email','push','both')",
            name="ck_user_notification_preferences_channel_valid",
        ),
    )

    preference_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    # Channel selection: none / email / push / both
    notification_channel: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="none",
        server_default=text("'none'"),
    )

    # Morning Nalla Neram alert (FEATURE-02) — local time of day
    morning_alert_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    morning_alert_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(6, 0), server_default=text("'06:00:00'"))

    # Dasha transition alert (FEATURE-03)
    dasha_alert_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))

    # Pirantha Naal (Nakshatra birthday) alert (FEATURE-06)
    pirantha_naal_alert_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))

    # FCM device token for push delivery (nullable — only set when push channel active)
    fcm_device_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Smart silence: max 1 push/day during heavy Sani periods (product spec Module 18)
    smart_silence_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))

    owner_user = relationship("User", back_populates="notification_preferences")

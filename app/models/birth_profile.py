from __future__ import annotations

from datetime import date, datetime, time
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, LargeBinary, Numeric, String, Time, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class BirthProfile(TimestampMixin, Base):
    __tablename__ = "birth_profiles"
    __table_args__ = (
        Index("idx_birth_profiles_owner", "owner_user_id"),
        Index("idx_birth_profiles_member", "family_member_id"),
    )

    birth_profile_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    family_member_id: Mapped[UUID | None] = mapped_column(ForeignKey("family_members.family_member_id"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    birth_date_local: Mapped[date] = mapped_column(Date, nullable=False)
    birth_time_local: Mapped[time | None] = mapped_column(Time, nullable=True)
    birth_datetime_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    birth_place: Mapped[str] = mapped_column(String(255), nullable=False)
    birth_latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    birth_longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    birth_timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    current_place: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    current_timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    current_location_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    birth_time_source: Mapped[str] = mapped_column(
        String(32), nullable=False, default="unknown", server_default=text("'unknown'")
    )
    birth_time_confidence_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    calendar_input_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="gregorian", server_default=text("'gregorian'")
    )
    privacy_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="cloud", server_default=text("'cloud'"))
    encrypted_birth_payload: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(32), nullable=True)

    owner_user = relationship("User", back_populates="birth_profiles")
    family_member = relationship("FamilyMember", back_populates="birth_profiles")
    charts = relationship("Chart", back_populates="birth_profile", cascade="all, delete-orphan")

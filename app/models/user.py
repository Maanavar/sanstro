from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_mode: Mapped[str] = mapped_column(String(20), nullable=False, server_default="BALANCED")
    goal_track: Mapped[str | None] = mapped_column(String(20), nullable=True)

    birth_profiles = relationship("BirthProfile", back_populates="owner_user")
    family_members = relationship("FamilyMember", back_populates="owner_user", foreign_keys="FamilyMember.owner_user_id")
    family_vaults = relationship("FamilyVault", back_populates="owner_user")
    preferences = relationship("UserPreference", back_populates="owner_user")
    contexts = relationship("UserContext")
    journal_entries = relationship("JournalEntry", back_populates="owner_user")
    retrospectives = relationship("RetrospectiveEntry", back_populates="owner_user")
    notification_preferences = relationship("UserNotificationPreference", back_populates="owner_user", uselist=False)

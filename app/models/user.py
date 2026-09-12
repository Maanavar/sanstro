from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Google's stable per-user subject id, once linked via SSO. Nullable — most
    # accounts are still password-only. See app/api/auth.py oauth/google routes.
    google_sub: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_mode: Mapped[str] = mapped_column(String(20), nullable=False, server_default="BALANCED")
    goal_track: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Server-side admin role. Authoritative source of admin access so the browser
    # never needs to hold a long-lived admin secret (see app/core/auth.get_admin_user).
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    # DPDP Act 2023 §6 consent. Both columns or neither: the timestamp says a
    # consent action happened, the version says what text it was given for, and
    # "informed consent" is a claim about the text. See app/core/privacy_policy.py.
    #
    # Nullable, and null on every account that registered before this existed.
    # That is not a gap being papered over — `consent_is_current` treats null as
    # "not consented", so those users are asked on their next authenticated
    # request rather than being silently counted as having agreed.
    consent_given_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_policy_version: Mapped[str | None] = mapped_column(String(32), nullable=True)

    birth_profiles = relationship(
        "BirthProfile", back_populates="owner_user", cascade="all, delete-orphan", passive_deletes=True
    )
    family_members = relationship(
        "FamilyMember",
        back_populates="owner_user",
        foreign_keys="FamilyMember.owner_user_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    family_vaults = relationship(
        "FamilyVault", back_populates="owner_user", cascade="all, delete-orphan", passive_deletes=True
    )
    preferences = relationship(
        "UserPreference", back_populates="owner_user", cascade="all, delete-orphan", passive_deletes=True
    )
    contexts = relationship("UserContext", cascade="all, delete-orphan", passive_deletes=True)
    journal_entries = relationship(
        "JournalEntry", back_populates="owner_user", cascade="all, delete-orphan", passive_deletes=True
    )
    retrospectives = relationship(
        "RetrospectiveEntry", back_populates="owner_user", cascade="all, delete-orphan", passive_deletes=True
    )
    notification_preferences = relationship(
        "UserNotificationPreference",
        back_populates="owner_user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

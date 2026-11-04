from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Google's stable per-user subject id, once linked via SSO. Nullable — most
    # accounts are still password-only. See app/api/auth.py oauth/google routes.
    # Unique: one Google identity can never sign in to two accounts.
    google_sub: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    user_mode: Mapped[str] = mapped_column(String(20), nullable=False, server_default="BALANCED")
    goal_track: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Server-side admin role. Authoritative source of admin access so the browser
    # never needs to hold a long-lived admin secret (see app/core/auth.get_admin_user).
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    # Admin role (admin spec L3, D-14): owner | support | ops | privacy | viewer
    # | astrologer; NULL = not an admin. Supersedes `is_admin`, which the
    # migration backfilled to 'owner' and `app.core.permissions.admin_role_of`
    # still reads as owner so nothing loses access mid-rollout. Granted only
    # through the audited, elevated owner route or the one-time env seed.
    admin_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # When the address was proven to reach this person: a verification link
    # (password accounts) or Google's verified flag (SSO). NULL = unproven.
    # Gates the trial (decision 4) and admin seeding (spec L3).
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
    # When the account holder declared they are 18 or over (spec L2, D-12).
    # Null on accounts from before the declaration existed; the consent panel
    # asks them (`consent_required_for`). The per-purpose answers live in
    # `consent_records`; the two columns above are the service (P1) stamp.
    adult_declared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # First touch — where the visitor who became this account first arrived from
    # (GRW-03). Written once, at account creation, from the web's `vinaadi_ft`
    # cookie (app/services/acquisition_service.py). Campaign tags, a referrer
    # *host* and a landing *path* only: no full URL, no query string, nothing a
    # person typed. Null for every account that predates it and for mobile
    # sign-ups, which carry no cookie.
    acquisition_source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    acquisition_medium: Mapped[str | None] = mapped_column(String(64), nullable=True)
    acquisition_campaign: Mapped[str | None] = mapped_column(String(128), nullable=True)
    acquisition_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)
    acquisition_referrer_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    acquisition_landing_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Last activity, for the business metrics in spec §8 (L6, D-11): an active
    # user is a signed-in account whose `last_seen_on` is that IST day, and
    # DAU/WAU/MAU and the retention cohorts are all counted off this column.
    #
    # A *date*, not a timestamp, and that is the privacy point as much as the
    # metric one: the day someone used the app answers every question in §8,
    # while a per-request timestamp would be a usage trail — when they wake up,
    # when they cannot sleep — on an app people consult about illness and
    # marriage. `touch_last_seen` writes at most one row per account per day.
    last_seen_on: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    # Which client and language that day's last session used: "web" | "ios" |
    # "android", and "ta" | "en". Overwritten, never accumulated.
    last_platform: Mapped[str | None] = mapped_column(String(16), nullable=True)
    last_language: Mapped[str | None] = mapped_column(String(2), nullable=True)
    # This account's own referral code (GRW-13), minted on first request, so
    # accounts that never share never get one. Random, not derived from the
    # user id: a share link must not leak an identifier.
    referral_code: Mapped[str | None] = mapped_column(String(16), nullable=True, unique=True)

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

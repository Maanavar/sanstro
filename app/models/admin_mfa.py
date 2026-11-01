from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.encrypted_types import EncryptedString


class AdminMfaCredential(Base):
    """One admin's TOTP secret (admin spec L3, D-15).

    `confirmed_at` is NULL between enrolment and the first correct code: an
    unconfirmed secret proves nothing (the person may never have saved it), so
    it does not satisfy the MFA requirement.
    """

    __tablename__ = "admin_mfa_credentials"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    #: Encrypted at rest: with the secret, anyone can mint codes.
    totp_secret: Mapped[str] = mapped_column(EncryptedString, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    #: Last TOTP step accepted. A code for this step or earlier is refused (replay).
    last_used_step: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class AdminRecoveryCode(Base):
    """A single-use recovery code, stored as a hash only.

    Codes are 50 random bits shown once, so an unsalted SHA-256 is enough: there
    is no dictionary to try, and bcrypt would only slow the lookup.
    """

    __tablename__ = "admin_recovery_codes"
    __table_args__ = (Index("ix_admin_recovery_codes_user_id", "user_id"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

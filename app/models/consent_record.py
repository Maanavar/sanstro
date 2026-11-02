from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DDL, Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, event, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# Kept byte-for-byte with migration cd2e3f4a5b6c, which installs the same guard
# on databases built by Alembic. This copy is for `create_all` (the test DB).
# DELETE stays allowed: erasure removes the person's rows with the account.
# No "%" anywhere: DDL() treats it as a format character.
APPEND_ONLY_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION consent_records_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION USING
        MESSAGE = 'consent_records is append-only: ' || TG_OP || ' refused',
        ERRCODE = 'insufficient_privilege';
END
$$;
"""

APPEND_ONLY_TRIGGERS_SQL = """
CREATE TRIGGER consent_records_append_only
    BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION consent_records_append_only();
CREATE TRIGGER consent_records_no_truncate
    BEFORE TRUNCATE ON consent_records
    FOR EACH STATEMENT EXECUTE FUNCTION consent_records_append_only();
"""


class ConsentRecord(Base):
    """One consent answer for one purpose (spec L2, D-10). Never updated.

    The person's current state for a purpose is their latest row for it
    (`app.privacy.consent`). A purpose with no row reads as not granted.
    """

    __tablename__ = "consent_records"
    __table_args__ = (
        CheckConstraint("purpose IN ('service', 'updates', 'analytics', 'ask_improve')", name="purpose"),
        CheckConstraint("language IN ('ta', 'en')", name="language"),
        #: legacy = carried over from the `users.consent_*` stamp by migration.
        CheckConstraint("channel IN ('web', 'android', 'ios', 'legacy')", name="channel"),
        Index("idx_consent_records_user_purpose", "user_id", "purpose", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    purpose: Mapped[str] = mapped_column(String(16), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    #: `CURRENT_POLICY_VERSION` when the answer was given.
    notice_version: Mapped[str] = mapped_column(String(32), nullable=False)
    language: Mapped[str] = mapped_column(String(2), nullable=False)
    channel: Mapped[str] = mapped_column(String(8), nullable=False)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


event.listen(
    ConsentRecord.__table__,
    "after_create",
    DDL(APPEND_ONLY_FUNCTION_SQL + APPEND_ONLY_TRIGGERS_SQL).execute_if(dialect="postgresql"),
)

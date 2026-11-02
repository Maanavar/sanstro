from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DDL, DateTime, ForeignKey, Index, String, Text, event, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

#: What the append-only guard lets an UPDATE change, and to what (spec L4, L5).
#: Deleting an admin's account nulls `actor_user_id` (the FK is ON DELETE SET
#: NULL); erasure may null `actor_email` and pseudonymise `target_id` to
#: "erased:<keyed hash>". Every other column is fixed once written.
ERASED_TARGET_PREFIX = "erased:"

# Kept byte-for-byte with migration ab0f1a2b3c4d, which installs the same guard
# on databases built by Alembic. This copy is for `create_all` (the test DB).
# No "%" anywhere: DDL() treats it as a format character.
APPEND_ONLY_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION admin_audit_log_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
        RAISE EXCEPTION USING
            MESSAGE = 'admin_audit_log is append-only: ' || TG_OP || ' refused',
            ERRCODE = 'insufficient_privilege';
    END IF;
    IF (to_jsonb(NEW) - 'actor_user_id' - 'actor_email' - 'target_id')
            IS DISTINCT FROM (to_jsonb(OLD) - 'actor_user_id' - 'actor_email' - 'target_id')
        OR (NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id AND NEW.actor_user_id IS NOT NULL)
        OR (NEW.actor_email IS DISTINCT FROM OLD.actor_email AND NEW.actor_email IS NOT NULL)
        OR (NEW.target_id IS DISTINCT FROM OLD.target_id
            AND NOT coalesce(starts_with(NEW.target_id, 'erased:'), false))
    THEN
        RAISE EXCEPTION 'admin_audit_log is append-only: only erasure may change a row'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END
$$;
"""

APPEND_ONLY_TRIGGERS_SQL = """
CREATE TRIGGER admin_audit_log_append_only
    BEFORE UPDATE OR DELETE ON admin_audit_log
    FOR EACH ROW EXECUTE FUNCTION admin_audit_log_append_only();
CREATE TRIGGER admin_audit_log_no_truncate
    BEFORE TRUNCATE ON admin_audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION admin_audit_log_append_only();
"""


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"
    __table_args__ = (
        Index("idx_audit_created_at", "created_at"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_actor", "actor_user_id"),
        Index("idx_audit_target", "target_type", "target_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # Who did it. Without this the log records that a user was deleted and not
    # by whom, which is the question an incident review opens with.
    #
    # Nullable, and ON DELETE SET NULL rather than CASCADE: rows written before
    # this column existed have no actor, a server-to-server caller has no user,
    # and — the important one — deleting a user must never erase the record of
    # what that user did. CASCADE would let an admin delete their own account
    # and take their audit trail with it.
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    # Copied at write time, so the row still names the person after their
    # account changes email or is deleted (spec L4 "actor id + email").
    actor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    #: The role acted under: owner, support, ... or "service_key" for the
    #: retained X-Admin-Key path, which names no person.
    actor_role: Mapped[str | None] = mapped_column(String(30), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    #: Why. Required for destructive actions (app.services.audit_service).
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: success | refused (4xx) | error (5xx or a crash).
    outcome: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'success'"))
    #: Structured facts about the action: old/new values, per-table counts.
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    # Free text from before `details` existed. Still written by the few callers
    # outside a route (the env owner seed); routes write `details`.
    payload_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


event.listen(
    AdminAuditLog.__table__,
    "after_create",
    DDL(APPEND_ONLY_FUNCTION_SQL + APPEND_ONLY_TRIGGERS_SQL).execute_if(dialect="postgresql"),
)

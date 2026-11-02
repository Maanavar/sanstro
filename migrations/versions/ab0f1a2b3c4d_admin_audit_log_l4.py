"""admin_audit_log: who, under which role, why, from where, with what outcome (spec L4).

Adds the columns spec L4 asks for — actor email and role, reason, user agent,
outcome and a structured `details` — plus an index on the target, and makes the
table append-only with a trigger (ARC-19):

- DELETE and TRUNCATE are refused.
- UPDATE is refused unless it only nulls `actor_user_id` (deleting an admin's
  account, ON DELETE SET NULL), nulls `actor_email`, or rewrites `target_id`
  to "erased:..." (erasure pseudonymisation, spec L5).

Existing rows keep their values. `outcome` is filled with 'success' for them by
its server default: every row written before today was written after the action
succeeded, because the old call sites only logged on the success path.

Reversible: downgrade drops the triggers, the function, the index and the new
columns. The rows themselves are untouched both ways.

Revision ID: ab0f1a2b3c4d
Revises: zz9d0e1f2a3b
Create Date: 2026-11-01 23:30:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "ab0f1a2b3c4d"
down_revision = "zz9d0e1f2a3b"
branch_labels = None
depends_on = None

# Frozen copy of app/models/admin_audit_log.py APPEND_ONLY_*_SQL as of this revision.
_FUNCTION_SQL = """
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

_TRIGGERS_SQL = """
CREATE TRIGGER admin_audit_log_append_only
    BEFORE UPDATE OR DELETE ON admin_audit_log
    FOR EACH ROW EXECUTE FUNCTION admin_audit_log_append_only();
CREATE TRIGGER admin_audit_log_no_truncate
    BEFORE TRUNCATE ON admin_audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION admin_audit_log_append_only();
"""


def upgrade() -> None:
    op.add_column("admin_audit_log", sa.Column("actor_email", sa.String(length=320), nullable=True))
    op.add_column("admin_audit_log", sa.Column("actor_role", sa.String(length=30), nullable=True))
    op.add_column("admin_audit_log", sa.Column("reason", sa.Text(), nullable=True))
    op.add_column(
        "admin_audit_log",
        sa.Column("outcome", sa.String(length=20), nullable=False, server_default=sa.text("'success'")),
    )
    op.add_column("admin_audit_log", sa.Column("details", postgresql.JSONB(), nullable=True))
    op.add_column("admin_audit_log", sa.Column("user_agent", sa.String(length=512), nullable=True))
    op.create_index("idx_audit_target", "admin_audit_log", ["target_type", "target_id"])
    # After the columns: the guard must not refuse this migration's own changes.
    op.execute(_FUNCTION_SQL)
    op.execute(_TRIGGERS_SQL)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS admin_audit_log_no_truncate ON admin_audit_log")
    op.execute("DROP TRIGGER IF EXISTS admin_audit_log_append_only ON admin_audit_log")
    op.execute("DROP FUNCTION IF EXISTS admin_audit_log_append_only()")
    op.drop_index("idx_audit_target", table_name="admin_audit_log")
    for column in ("user_agent", "details", "outcome", "reason", "actor_role", "actor_email"):
        op.drop_column("admin_audit_log", column)

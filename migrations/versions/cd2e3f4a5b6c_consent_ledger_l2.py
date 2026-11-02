"""Consent ledger (spec L2): one row per answer, per purpose.

- `consent_records`: append-only (UPDATE and TRUNCATE refused by trigger;
  DELETE allowed, for erasure). Current state = the latest row per purpose.
- `users.adult_declared_at`: the 18+ self-declaration (D-12).
- Backfill: every account with a `users.consent_given_at` stamp gets one
  `service` row carrying that stamp's time and policy version, channel
  `legacy`. That is the consent the account actually gave; no optional purpose
  is backfilled, because nobody was asked about one.

Reversible: the downgrade drops the table, its guard and the column.

Revision ID: cd2e3f4a5b6c
Revises: bc1d2e3f4a5b
Create Date: 2026-11-02 18:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "cd2e3f4a5b6c"
down_revision = "bc1d2e3f4a5b"
branch_labels = None
depends_on = None

# Frozen copy of app/models/consent_record.py APPEND_ONLY_*_SQL as of this revision.
_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION consent_records_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION USING
        MESSAGE = 'consent_records is append-only: ' || TG_OP || ' refused',
        ERRCODE = 'insufficient_privilege';
END
$$;
"""

_TRIGGERS_SQL = """
CREATE TRIGGER consent_records_append_only
    BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION consent_records_append_only();
CREATE TRIGGER consent_records_no_truncate
    BEFORE TRUNCATE ON consent_records
    FOR EACH STATEMENT EXECUTE FUNCTION consent_records_append_only();
"""

_BACKFILL_SQL = """
INSERT INTO consent_records (id, user_id, purpose, granted, notice_version, language, channel, ip, created_at)
SELECT gen_random_uuid(), u.user_id, 'service', true, u.consent_policy_version,
       CASE WHEN p.dashboard_lang = 'ta' THEN 'ta' ELSE 'en' END, 'legacy', NULL, u.consent_given_at
FROM users u
LEFT JOIN user_preferences p ON p.owner_user_id = u.user_id
WHERE u.consent_given_at IS NOT NULL AND u.consent_policy_version IS NOT NULL
"""


def upgrade() -> None:
    op.create_table(
        "consent_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("purpose", sa.String(length=16), nullable=False),
        sa.Column("granted", sa.Boolean(), nullable=False),
        sa.Column("notice_version", sa.String(length=32), nullable=False),
        sa.Column("language", sa.String(length=2), nullable=False),
        sa.Column("channel", sa.String(length=8), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "purpose IN ('service', 'updates', 'analytics', 'ask_improve')", name=op.f("ck_consent_records_purpose")
        ),
        sa.CheckConstraint("language IN ('ta', 'en')", name=op.f("ck_consent_records_language")),
        sa.CheckConstraint(
            "channel IN ('web', 'android', 'ios', 'legacy')", name=op.f("ck_consent_records_channel")
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name=op.f("fk_consent_records_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_consent_records")),
    )
    op.create_index(
        "idx_consent_records_user_purpose", "consent_records", ["user_id", "purpose", "created_at"], unique=False
    )
    op.execute(_FUNCTION_SQL)
    op.execute(_TRIGGERS_SQL)
    op.add_column("users", sa.Column("adult_declared_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(_BACKFILL_SQL)


def downgrade() -> None:
    op.drop_column("users", "adult_declared_at")
    op.execute("DROP TRIGGER IF EXISTS consent_records_no_truncate ON consent_records")
    op.execute("DROP TRIGGER IF EXISTS consent_records_append_only ON consent_records")
    op.execute("DROP FUNCTION IF EXISTS consent_records_append_only()")
    op.drop_index("idx_consent_records_user_purpose", table_name="consent_records")
    op.drop_table("consent_records")

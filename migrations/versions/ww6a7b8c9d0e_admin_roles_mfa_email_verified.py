"""Admin roles, admin TOTP, and email verification (admin spec L3).

Additive and reversible.

* ``users.admin_role`` — backfilled to 'owner' for every ``is_admin`` row, so no
  current admin loses access at upgrade. (They must enrol TOTP before any admin
  route answers them again; that is the point of the release.)
* ``users.email_verified_at`` — backfilled from ``created_at`` for accounts
  linked to Google, because the Google callback only ever accepted
  ``email_verified`` addresses. Password accounts stay NULL: nothing has
  proven their address yet.
* ``admin_mfa_credentials`` / ``admin_recovery_codes`` — new, empty.

Downgrade drops the four objects. The backfills are not undone separately:
dropping the columns removes them.

Revision ID: ww6a7b8c9d0e
Revises: vv5f6a7b8c9d
Create Date: 2026-11-01 15:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "ww6a7b8c9d0e"
down_revision = "vv5f6a7b8c9d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("admin_role", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE users SET admin_role = 'owner' WHERE is_admin IS TRUE AND admin_role IS NULL")
    op.execute(
        "UPDATE users SET email_verified_at = created_at "
        "WHERE google_sub IS NOT NULL AND email_verified_at IS NULL"
    )

    op.create_table(
        "admin_mfa_credentials",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("totp_secret", sa.LargeBinary(), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_step", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_admin_mfa_credentials_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_admin_mfa_credentials"),
    )
    op.create_table(
        "admin_recovery_codes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_admin_recovery_codes_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_admin_recovery_codes"),
        sa.UniqueConstraint("code_hash", name="uq_admin_recovery_codes_code_hash"),
    )
    op.create_index("ix_admin_recovery_codes_user_id", "admin_recovery_codes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_admin_recovery_codes_user_id", table_name="admin_recovery_codes")
    op.drop_table("admin_recovery_codes")
    op.drop_table("admin_mfa_credentials")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "admin_role")

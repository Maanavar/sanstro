"""add admin audit log

Revision ID: x9e0f1a2b3c4
Revises: w8d9e0f1a2b3
Create Date: 2026-06-16 11:35:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "x9e0f1a2b3c4"
down_revision: str | Sequence[str] | None = "w8d9e0f1a2b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if "admin_audit_log" in sa.inspect(bind).get_table_names():
        return

    op.create_table(
        "admin_audit_log",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("target_type", sa.String(length=60), nullable=True),
        sa.Column("target_id", sa.String(length=120), nullable=True),
        sa.Column("payload_summary", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_audit_created_at", "admin_audit_log", ["created_at"])
    op.create_index("idx_audit_action", "admin_audit_log", ["action"])


def downgrade() -> None:
    op.drop_index("idx_audit_action", table_name="admin_audit_log")
    op.drop_index("idx_audit_created_at", table_name="admin_audit_log")
    op.drop_table("admin_audit_log")

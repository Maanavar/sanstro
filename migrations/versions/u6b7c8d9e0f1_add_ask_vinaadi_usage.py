"""add ask_vinaadi_usage table

Revision ID: u6b7c8d9e0f1
Revises: t5a6b7c8d9e0
Create Date: 2026-06-11 10:10:00.000000

Feature 3 — Ask Vinaadi Lite. Tracks per-user per-day chip usage for the free-tier
3-questions-a-day limit.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "u6b7c8d9e0f1"
down_revision: str | Sequence[str] | None = "t5a6b7c8d9e0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if "ask_vinaadi_usage" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "ask_vinaadi_usage",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("chip_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "usage_date", name="uq_ask_vinaadi_usage_user_date"),
    )
    op.create_index("idx_ask_vinaadi_usage_user_date", "ask_vinaadi_usage", ["user_id", "usage_date"])


def downgrade() -> None:
    op.drop_index("idx_ask_vinaadi_usage_user_date", table_name="ask_vinaadi_usage")
    op.drop_table("ask_vinaadi_usage")

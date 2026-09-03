"""add user_streaks table (server-side streak persistence)

Revision ID: ff6b7c8d9e0a
Revises: ee4f5a6b7c8d
Create Date: 2026-07-03 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "ff6b7c8d9e0a"
down_revision: str | Sequence[str] | None = "ee4f5a6b7c8d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_streaks",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("current_days", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("longest_days", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_active_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_streaks")

"""add user suspension fields

Revision ID: w8d9e0f1a2b3
Revises: v7c8d9e0f1a2
Create Date: 2026-06-16 11:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "w8d9e0f1a2b3"
down_revision: str | Sequence[str] | None = "v7c8d9e0f1a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in sa.inspect(bind).get_columns("users")}
    if "is_suspended" not in columns:
        op.add_column(
            "users",
            sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )
    if "suspension_reason" not in columns:
        op.add_column(
            "users",
            sa.Column("suspension_reason", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "is_suspended")

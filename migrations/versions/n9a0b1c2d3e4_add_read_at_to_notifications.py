"""add read_at column to notifications

Revision ID: n9a0b1c2d3e4
Revises: m8a9b0c1d2e3
Create Date: 2026-06-01 21:10:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "n9a0b1c2d3e4"
down_revision: str | Sequence[str] | None = "m8a9b0c1d2e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE notifications "
        "ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS read_at")

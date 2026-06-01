"""add deleted_at to user_life_events

Revision ID: m8a9b0c1d2e3
Revises: l7f8a9b0c1d2
Create Date: 2026-05-31 17:10:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "m8a9b0c1d2e3"
down_revision: str | Sequence[str] | None = "l7f8a9b0c1d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE user_life_events "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE user_life_events DROP COLUMN IF EXISTS deleted_at")

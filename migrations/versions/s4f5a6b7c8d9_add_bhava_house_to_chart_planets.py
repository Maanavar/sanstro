"""add bhava_house to chart_planets

Revision ID: s4f5a6b7c8d9
Revises: r3e4f5a6b7c8
Create Date: 2026-06-02 09:40:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "s4f5a6b7c8d9"
down_revision: str | Sequence[str] | None = "r3e4f5a6b7c8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE chart_planets ADD COLUMN IF NOT EXISTS bhava_house INTEGER")
    op.execute(
        "ALTER TABLE chart_planets "
        "ADD CONSTRAINT ck_chart_planets_bhava_house_range "
        "CHECK (bhava_house IS NULL OR (bhava_house BETWEEN 1 AND 12))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE chart_planets DROP CONSTRAINT IF EXISTS ck_chart_planets_bhava_house_range")
    op.execute("ALTER TABLE chart_planets DROP COLUMN IF EXISTS bhava_house")

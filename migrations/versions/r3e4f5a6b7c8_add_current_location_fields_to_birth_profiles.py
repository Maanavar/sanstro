"""add current location fields to birth_profiles

Revision ID: r3e4f5a6b7c8
Revises: q2d3e4f5a6b7
Create Date: 2026-06-02 00:25:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "r3e4f5a6b7c8"
down_revision: str | Sequence[str] | None = "q2d3e4f5a6b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE birth_profiles ADD COLUMN IF NOT EXISTS current_place VARCHAR(255)")
    op.execute("ALTER TABLE birth_profiles ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(9, 6)")
    op.execute("ALTER TABLE birth_profiles ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(9, 6)")
    op.execute("ALTER TABLE birth_profiles ADD COLUMN IF NOT EXISTS current_timezone VARCHAR(64)")
    op.execute("ALTER TABLE birth_profiles ADD COLUMN IF NOT EXISTS current_location_updated_at TIMESTAMP WITH TIME ZONE")


def downgrade() -> None:
    op.execute("ALTER TABLE birth_profiles DROP COLUMN IF EXISTS current_location_updated_at")
    op.execute("ALTER TABLE birth_profiles DROP COLUMN IF EXISTS current_timezone")
    op.execute("ALTER TABLE birth_profiles DROP COLUMN IF EXISTS current_longitude")
    op.execute("ALTER TABLE birth_profiles DROP COLUMN IF EXISTS current_latitude")
    op.execute("ALTER TABLE birth_profiles DROP COLUMN IF EXISTS current_place")

"""add missing timestamp columns for audit item M4

Revision ID: q2d3e4f5a6b7
Revises: p1c2d3e4f5a6
Create Date: 2026-06-01 23:40:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "q2d3e4f5a6b7"
down_revision: str | Sequence[str] | None = "p1c2d3e4f5a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE subscriptions "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE notifications "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE notifications "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE varga_positions "
        "ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE varga_positions "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE varga_positions "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE dasha_periods "
        "ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE dasha_periods "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE dasha_periods "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE daily_scores "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE daily_scores "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE transit_snapshots "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE transit_snapshots "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE interpretation_outputs "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE interpretation_outputs "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE peyarchi_alerts "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE qa_golden_cases "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"
    )
    op.execute(
        "ALTER TABLE qa_golden_cases "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE qa_golden_cases DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE qa_golden_cases DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE peyarchi_alerts DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE interpretation_outputs DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE interpretation_outputs DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE transit_snapshots DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE transit_snapshots DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE daily_scores DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE daily_scores DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE dasha_periods DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE dasha_periods DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE dasha_periods DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE varga_positions DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE varga_positions DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE varga_positions DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS deleted_at")
    op.execute("ALTER TABLE notifications DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE subscriptions DROP COLUMN IF EXISTS deleted_at")

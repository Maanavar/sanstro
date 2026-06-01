"""add cascade delete to dasha_periods parent fk

Revision ID: o0b1c2d3e4f5
Revises: n9a0b1c2d3e4
Create Date: 2026-06-01 21:15:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "o0b1c2d3e4f5"
down_revision: str | Sequence[str] | None = "n9a0b1c2d3e4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE dasha_periods "
        "DROP CONSTRAINT IF EXISTS fk_dasha_periods_parent_dasha_period_id_dasha_periods"
    )
    op.execute(
        "ALTER TABLE dasha_periods "
        "ADD CONSTRAINT fk_dasha_periods_parent_dasha_period_id_dasha_periods "
        "FOREIGN KEY (parent_dasha_period_id) REFERENCES dasha_periods(dasha_period_id) ON DELETE CASCADE"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE dasha_periods "
        "DROP CONSTRAINT IF EXISTS fk_dasha_periods_parent_dasha_period_id_dasha_periods"
    )
    op.execute(
        "ALTER TABLE dasha_periods "
        "ADD CONSTRAINT fk_dasha_periods_parent_dasha_period_id_dasha_periods "
        "FOREIGN KEY (parent_dasha_period_id) REFERENCES dasha_periods(dasha_period_id)"
    )

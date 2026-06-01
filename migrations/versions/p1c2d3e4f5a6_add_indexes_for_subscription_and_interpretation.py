"""add indexes for subscription.user_id and interpretation_output.family_vault_id

Revision ID: p1c2d3e4f5a6
Revises: o0b1c2d3e4f5
Create Date: 2026-06-01 22:20:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "p1c2d3e4f5a6"
down_revision: str | Sequence[str] | None = "o0b1c2d3e4f5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions (user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_interpretation_outputs_family_vault_id "
        "ON interpretation_outputs (family_vault_id)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_interpretation_outputs_family_vault_id")
    op.execute("DROP INDEX IF EXISTS ix_subscriptions_user_id")

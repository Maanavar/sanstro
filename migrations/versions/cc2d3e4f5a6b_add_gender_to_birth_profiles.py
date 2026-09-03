"""add gender_for_traditional_rules to birth_profiles

Revision ID: cc2d3e4f5a6b
Revises: bb1c2d3e4f5
Create Date: 2026-06-29 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "cc2d3e4f5a6b"
down_revision: str | Sequence[str] | None = "bb1c2d3e4f5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {col["name"] for col in sa.inspect(bind).get_columns("birth_profiles")}
    if "gender_for_traditional_rules" not in columns:
        op.add_column(
            "birth_profiles",
            sa.Column(
                "gender_for_traditional_rules",
                sa.String(length=32),
                nullable=False,
                server_default=sa.text("'not_specified'"),
            ),
        )


def downgrade() -> None:
    op.drop_column("birth_profiles", "gender_for_traditional_rules")

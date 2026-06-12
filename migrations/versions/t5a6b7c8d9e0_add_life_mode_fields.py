"""add life mode fields to user_preferences

Revision ID: t5a6b7c8d9e0
Revises: s4f5a6b7c8d9
Create Date: 2026-06-11 10:00:00.000000

Feature 2 — Life Mode Intent Picker. Life Mode is stored separately from
``users.user_mode`` (which is the dashboard complexity mode BEGINNER/BALANCED/
TRADITIONAL) to avoid overloading two unrelated concepts on one column.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "t5a6b7c8d9e0"
down_revision: str | Sequence[str] | None = "s4f5a6b7c8d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in sa.inspect(bind).get_columns("user_preferences")}
    if "life_mode" not in cols:
        op.add_column(
            "user_preferences",
            sa.Column("life_mode", sa.String(20), nullable=False, server_default="BALANCED"),
        )
    if "life_mode_set_at" not in cols:
        op.add_column(
            "user_preferences",
            sa.Column("life_mode_set_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "show_life_mode_picker" not in cols:
        op.add_column(
            "user_preferences",
            sa.Column("show_life_mode_picker", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        )


def downgrade() -> None:
    op.drop_column("user_preferences", "show_life_mode_picker")
    op.drop_column("user_preferences", "life_mode_set_at")
    op.drop_column("user_preferences", "life_mode")

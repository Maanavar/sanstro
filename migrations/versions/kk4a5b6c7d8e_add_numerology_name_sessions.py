"""add numerology_name_sessions table (NUM-58, saved name sessions)

Purely additive: one new table, no column added to or removed from an existing
one, so the downgrade is a clean drop and loses only rows this migration's own
table introduced.

Revision ID: kk4a5b6c7d8e
Revises: jj3f4a5b6c7d
Create Date: 2026-07-27 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "kk4a5b6c7d8e"
down_revision: str | Sequence[str] | None = "jj3f4a5b6c7d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "numerology_name_sessions",
        sa.Column("numerology_name_session_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("candidate_name", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=True),
        sa.Column("max_edits", sa.Integer(), nullable=False, server_default=sa.text("2")),
        sa.Column("saved_calculation_version", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["owner_user_id"],
            ["users.user_id"],
            name="fk_numerology_name_sessions_owner_user_id_users",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["chart_id"],
            ["charts.chart_id"],
            name="fk_numerology_name_sessions_chart_id_charts",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "numerology_name_session_id", name="pk_numerology_name_sessions"
        ),
    )
    op.create_index(
        "idx_numerology_name_sessions_owner", "numerology_name_sessions", ["owner_user_id"]
    )
    op.create_index(
        "idx_numerology_name_sessions_chart", "numerology_name_sessions", ["chart_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_numerology_name_sessions_chart", table_name="numerology_name_sessions")
    op.drop_index("idx_numerology_name_sessions_owner", table_name="numerology_name_sessions")
    op.drop_table("numerology_name_sessions")

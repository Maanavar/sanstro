"""add prediction_log table (D5 calibration data spine, reasoning plan Phase 4)

Revision ID: gg7c8d9e0f1b
Revises: ff6b7c8d9e0a
Create Date: 2026-07-03 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "gg7c8d9e0f1b"
down_revision: str | Sequence[str] | None = "ff6b7c8d9e0a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "prediction_log",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chart_id", sa.UUID(), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("life_area", sa.String(length=32), nullable=False),
        sa.Column("reading", sa.String(length=32), nullable=True),
        sa.Column("band", sa.String(length=16), nullable=False),
        sa.Column("window_start", sa.Date(), nullable=True),
        sa.Column("window_end", sa.Date(), nullable=True),
        sa.Column("active_maha", sa.String(length=16), nullable=True),
        sa.Column("active_antar", sa.String(length=16), nullable=True),
        sa.Column("outcome_event_id", sa.UUID(), nullable=True),
        sa.Column("outcome_grade", sa.String(length=8), nullable=True),
        sa.Column("calc_version", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["outcome_event_id"], ["user_life_events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_prediction_log_chart", "prediction_log", ["chart_id"])
    op.create_index(
        "idx_prediction_log_open", "prediction_log", ["chart_id", "life_area", "outcome_grade"]
    )


def downgrade() -> None:
    op.drop_index("idx_prediction_log_open", table_name="prediction_log")
    op.drop_index("idx_prediction_log_chart", table_name="prediction_log")
    # Plain-typed columns only (String, not Enum/composite) — dropping the
    # table leaves no orphaned Postgres types behind (CLAUDE.md DB rule 8).
    op.drop_table("prediction_log")

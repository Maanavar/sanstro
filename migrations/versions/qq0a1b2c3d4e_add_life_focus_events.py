"""Add the PII-free Life Focus measurement event table.

Revision ID: qq0a1b2c3d4e
Revises: pp9f0a1b2c3d
Create Date: 2026-09-22 15:00:00.000000

Only the opaque user FK, interaction intent, before/after modes, first-run bit
and timestamp are stored. No birth/profile/chart data or question text enters
this table. The user FK cascades so account deletion removes the history.
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "qq0a1b2c3d4e"
down_revision: str | Sequence[str] | None = "pp9f0a1b2c3d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "life_focus_events",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("intent", sa.String(length=12), nullable=False),
        sa.Column("previous_mode", sa.String(length=20), nullable=False),
        sa.Column("new_mode", sa.String(length=20), nullable=False),
        sa.Column("is_first_run", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "intent IN ('SELECT', 'SKIP', 'KEEP')",
            name=op.f("ck_life_focus_events_intent"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.create_index(
        "idx_life_focus_events_created_at",
        "life_focus_events",
        ["created_at"],
    )
    op.create_index(
        "idx_life_focus_events_user_created",
        "life_focus_events",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_life_focus_events_user_created", table_name="life_focus_events")
    op.drop_index("idx_life_focus_events_created_at", table_name="life_focus_events")
    # Plain String columns only: dropping leaves no enum/composite type behind.
    op.drop_table("life_focus_events")

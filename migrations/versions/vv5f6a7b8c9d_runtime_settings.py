"""Persisted runtime settings and their change history (ADM-09, spec L10).

Feature flags and kill switches were held in each worker's memory, so a change
reached one worker and vanished on restart. These two tables are what every
worker reads instead. Additive and reversible: no existing table changes, and
an empty `runtime_settings` means "every flag at its code default", which is
exactly today's behaviour after a restart.

Revision ID: vv5f6a7b8c9d
Revises: uu4e5f6a7b8c
Create Date: 2026-11-01 12:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "vv5f6a7b8c9d"
down_revision = "uu4e5f6a7b8c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "runtime_settings",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("updated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["updated_by_user_id"],
            ["users.user_id"],
            name="fk_runtime_settings_updated_by_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("name", name="pk_runtime_settings"),
    )
    op.create_table(
        "runtime_setting_changes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.user_id"],
            name="fk_runtime_setting_changes_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_runtime_setting_changes"),
    )
    op.create_index(
        "ix_runtime_setting_changes_name_created",
        "runtime_setting_changes",
        ["name", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_runtime_setting_changes_name_created", table_name="runtime_setting_changes")
    op.drop_table("runtime_setting_changes")
    op.drop_table("runtime_settings")

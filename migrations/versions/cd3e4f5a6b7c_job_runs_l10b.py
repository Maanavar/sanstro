"""One row per background job execution (spec L10, `job_runs`).

Additive and reversible: a new table only. An empty `job_runs` reads as "nothing
has run since this table existed", which is exactly the state the day it ships,
and the admin Health tab says so rather than passing silently.

Revision ID: cd3e4f5a6b7c
Revises: bc2d3e4f5a6b
Create Date: 2026-11-04 09:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "cd3e4f5a6b7c"
down_revision = "bc2d3e4f5a6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.String(length=120), nullable=False),
        sa.Column("trigger", sa.String(length=16), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("actor_email", sa.String(length=320), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("outcome", sa.String(length=16), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.user_id"],
            name="fk_job_runs_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_job_runs"),
    )
    op.create_index("ix_job_runs_job_id_started_at", "job_runs", ["job_id", "started_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_job_runs_job_id_started_at", table_name="job_runs")
    op.drop_table("job_runs")

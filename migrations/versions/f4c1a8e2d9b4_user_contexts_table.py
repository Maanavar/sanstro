"""add user_contexts table

Revision ID: f4c1a8e2d9b4
Revises: e3f2a1b8c5d7
Create Date: 2026-05-23 00:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "f4c1a8e2d9b4"
down_revision: Union[str, Sequence[str], None] = "e3f2a1b8c5d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_contexts",
        sa.Column("context_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("life_situation", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("active_events", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("reaction_history", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_user_contexts_chart_id_charts")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_user_contexts_owner_user_id_users")),
        sa.PrimaryKeyConstraint("context_id", name=op.f("pk_user_contexts")),
        sa.UniqueConstraint("owner_user_id", "chart_id", name="uq_user_contexts_owner_chart"),
    )
    op.create_index("idx_user_contexts_owner", "user_contexts", ["owner_user_id"], unique=False)
    op.create_index("idx_user_contexts_chart", "user_contexts", ["chart_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_user_contexts_chart", table_name="user_contexts")
    op.drop_index("idx_user_contexts_owner", table_name="user_contexts")
    op.drop_table("user_contexts")


"""user goals table for astro memory

Revision ID: 5e1d3f7a9c02
Revises: 3c9b2a4f8d11
Create Date: 2026-05-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e1d3f7a9c02"
down_revision: Union[str, Sequence[str], None] = "3c9b2a4f8d11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_goals",
        sa.Column("goal_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("goal_type", sa.String(length=32), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("language_preference", sa.String(length=16), server_default=sa.text("'ta-en'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_user_goals_chart_id_charts")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_user_goals_owner_user_id_users")),
        sa.PrimaryKeyConstraint("goal_id", name=op.f("pk_user_goals")),
    )
    op.create_index("idx_user_goals_owner", "user_goals", ["owner_user_id"], unique=False)
    op.create_index("idx_user_goals_chart", "user_goals", ["chart_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_user_goals_chart", table_name="user_goals")
    op.drop_index("idx_user_goals_owner", table_name="user_goals")
    op.drop_table("user_goals")

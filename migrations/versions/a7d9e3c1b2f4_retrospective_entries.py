"""add retrospective_entries table

Revision ID: a7d9e3c1b2f4
Revises: f4c1a8e2d9b4
Create Date: 2026-05-23 01:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7d9e3c1b2f4"
down_revision: Union[str, Sequence[str], None] = "f4c1a8e2d9b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "retrospective_entries",
        sa.Column("retrospective_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("event_description", sa.String(length=500), nullable=False),
        sa.Column("analysis_payload", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_retrospective_entries_chart_id_charts")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_retrospective_entries_owner_user_id_users")),
        sa.PrimaryKeyConstraint("retrospective_id", name=op.f("pk_retrospective_entries")),
    )
    op.create_index("idx_retrospective_owner", "retrospective_entries", ["owner_user_id"], unique=False)
    op.create_index("idx_retrospective_chart", "retrospective_entries", ["chart_id"], unique=False)
    op.create_index("idx_retrospective_event_date", "retrospective_entries", ["event_date"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_retrospective_event_date", table_name="retrospective_entries")
    op.drop_index("idx_retrospective_chart", table_name="retrospective_entries")
    op.drop_index("idx_retrospective_owner", table_name="retrospective_entries")
    op.drop_table("retrospective_entries")


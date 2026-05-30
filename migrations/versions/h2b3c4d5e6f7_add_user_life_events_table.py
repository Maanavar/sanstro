"""add_user_life_events_table

Revision ID: h2b3c4d5e6f7
Revises: e19f02c4bfc9
Create Date: 2026-05-27 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PGUUID

revision: str = "h2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "e19f02c4bfc9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_life_events",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column(
            "chart_id",
            sa.Uuid(),
            sa.ForeignKey("charts.chart_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_user_life_events_chart", "user_life_events", ["chart_id"])
    op.create_index("idx_user_life_events_date", "user_life_events", ["event_date"])


def downgrade() -> None:
    op.drop_index("idx_user_life_events_date", table_name="user_life_events")
    op.drop_index("idx_user_life_events_chart", table_name="user_life_events")
    op.drop_table("user_life_events")

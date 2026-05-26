"""add peyarchi alerts table

Revision ID: d7a8f1b3c9e2
Revises: 5e1d3f7a9c02
Create Date: 2026-05-22 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7a8f1b3c9e2"
down_revision: Union[str, Sequence[str], None] = "5e1d3f7a9c02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "peyarchi_alerts",
        sa.Column("alert_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("planet", sa.String(length=16), nullable=False),
        sa.Column("from_rasi", sa.String(length=32), nullable=False),
        sa.Column("to_rasi", sa.String(length=32), nullable=False),
        sa.Column("peyarchi_date", sa.Date(), nullable=False),
        sa.Column("peyarchi_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notified_30d", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("notified_7d", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("notified_1d", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("notified_day_of", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_peyarchi_alerts_chart_id_charts"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("alert_id", name=op.f("pk_peyarchi_alerts")),
        sa.UniqueConstraint("chart_id", "planet", "peyarchi_date", name="uq_peyarchi_alerts_chart_planet_date"),
    )
    op.create_index("idx_peyarchi_alerts_chart", "peyarchi_alerts", ["chart_id"], unique=False)
    op.create_index("idx_peyarchi_alerts_date", "peyarchi_alerts", ["peyarchi_date"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_peyarchi_alerts_date", table_name="peyarchi_alerts")
    op.drop_index("idx_peyarchi_alerts_chart", table_name="peyarchi_alerts")
    op.drop_table("peyarchi_alerts")

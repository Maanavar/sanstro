"""chart planets persistence

Revision ID: 3c9b2a4f8d11
Revises: a2f7c9b4d3e1
Create Date: 2026-05-22 14:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3c9b2a4f8d11"
down_revision: Union[str, Sequence[str], None] = "a2f7c9b4d3e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "chart_planets",
        sa.Column("chart_planet_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("graha", sa.String(length=32), nullable=False),
        sa.Column("absolute_longitude", sa.Numeric(precision=12, scale=8), nullable=False),
        sa.Column("degree_in_rasi", sa.Numeric(precision=12, scale=8), nullable=False),
        sa.Column("rasi", sa.String(length=32), nullable=False),
        sa.Column("nakshatra", sa.String(length=32), nullable=False),
        sa.Column("pada", sa.Integer(), nullable=False),
        sa.Column("house_from_lagna", sa.Integer(), nullable=False),
        sa.Column("speed_deg_per_day", sa.Numeric(precision=12, scale=8), nullable=True),
        sa.Column("is_retrograde", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_combust", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_sandhi", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("dignity", sa.String(length=32), nullable=True),
        sa.Column("d9_rasi", sa.String(length=32), nullable=True),
        sa.Column("is_vargottama", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("raw_payload", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("pada BETWEEN 1 AND 4", name=op.f("ck_chart_planets_pada_range")),
        sa.CheckConstraint("house_from_lagna BETWEEN 1 AND 12", name=op.f("ck_chart_planets_house_from_lagna_range")),
        sa.ForeignKeyConstraint(
            ["chart_id"],
            ["charts.chart_id"],
            name=op.f("fk_chart_planets_chart_id_charts"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("chart_planet_id", name=op.f("pk_chart_planets")),
    )
    op.create_index("idx_chart_planets_chart", "chart_planets", ["chart_id"], unique=False)
    op.create_index("idx_chart_planets_graha", "chart_planets", ["graha"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_chart_planets_graha", table_name="chart_planets")
    op.drop_index("idx_chart_planets_chart", table_name="chart_planets")
    op.drop_table("chart_planets")

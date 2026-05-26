"""add panchangam and daily score caches

Revision ID: 91e2c6a7b1d0
Revises: 5150e66f07d9
Create Date: 2026-05-23 23:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "91e2c6a7b1d0"
down_revision: Union[str, Sequence[str], None] = "5150e66f07d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "panchangam_cache",
        sa.Column("cache_id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("cache_date", sa.Date(), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("ayanamsa_type", sa.String(length=32), server_default=sa.text("'LAHIRI'"), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("cache_id", name=op.f("pk_panchangam_cache")),
        sa.UniqueConstraint("cache_date", "latitude", "longitude", "ayanamsa_type", name="uq_panchangam_cache_key"),
    )
    op.create_index("idx_panchangam_cache_date", "panchangam_cache", ["cache_date"], unique=False)

    op.create_table(
        "daily_scores",
        sa.Column("score_id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("birth_profile_id", sa.Uuid(), nullable=False),
        sa.Column("score_date", sa.Date(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=32), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(
            ["birth_profile_id"],
            ["birth_profiles.birth_profile_id"],
            name=op.f("fk_daily_scores_birth_profile_id_birth_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("score_id", name=op.f("pk_daily_scores")),
        sa.UniqueConstraint("birth_profile_id", "score_date", name="uq_daily_scores_profile_date"),
    )
    op.create_index("idx_daily_scores_profile_date", "daily_scores", ["birth_profile_id", "score_date"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_daily_scores_profile_date", table_name="daily_scores")
    op.drop_table("daily_scores")
    op.drop_index("idx_panchangam_cache_date", table_name="panchangam_cache")
    op.drop_table("panchangam_cache")

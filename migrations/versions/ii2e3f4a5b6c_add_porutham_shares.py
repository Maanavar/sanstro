"""add porutham_shares table (read-only share links for porutham results)

Revision ID: ii2e3f4a5b6c
Revises: hh1d2e3f4a5b
Create Date: 2026-07-08 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "ii2e3f4a5b6c"
down_revision: str | Sequence[str] | None = "hh1d2e3f4a5b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "porutham_shares",
        sa.Column("porutham_share_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("label_a", sa.String(length=120), nullable=True),
        sa.Column("label_b", sa.String(length=120), nullable=True),
        sa.Column("snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["owner_user_id"], ["users.user_id"],
            name="fk_porutham_shares_owner_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("porutham_share_id", name="pk_porutham_shares"),
        sa.UniqueConstraint("token_hash", name="uq_porutham_shares_token_hash"),
    )
    op.create_index("idx_porutham_shares_owner_user_id", "porutham_shares", ["owner_user_id"])
    op.create_index("idx_porutham_shares_token_hash", "porutham_shares", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_porutham_shares_token_hash", table_name="porutham_shares")
    op.drop_index("idx_porutham_shares_owner_user_id", table_name="porutham_shares")
    op.drop_table("porutham_shares")

"""create user_preferences table

Revision ID: c3d7e1a9b4f2
Revises: b2f4d8c1a9e7
Create Date: 2026-05-23 18:10:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d7e1a9b4f2"
down_revision: Union[str, Sequence[str], None] = "b2f4d8c1a9e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_preferences",
        sa.Column("preference_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("journal_retention_days", sa.Integer(), server_default=sa.text("365"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_user_preferences_owner_user_id_users")),
        sa.PrimaryKeyConstraint("preference_id", name=op.f("pk_user_preferences")),
        sa.UniqueConstraint("owner_user_id", name="uq_user_preferences_owner"),
    )
    op.create_index(op.f("idx_user_preferences_owner"), "user_preferences", ["owner_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("idx_user_preferences_owner"), table_name="user_preferences")
    op.drop_table("user_preferences")

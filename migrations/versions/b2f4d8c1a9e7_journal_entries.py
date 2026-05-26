"""create journal_entries table

Revision ID: b2f4d8c1a9e7
Revises: c9a2f1d4e6b7
Create Date: 2026-05-23 15:10:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2f4d8c1a9e7"
down_revision: Union[str, Sequence[str], None] = "c9a2f1d4e6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "journal_entries",
        sa.Column("journal_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("chart_id", sa.Uuid(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("life_area", sa.String(length=32), nullable=False),
        sa.Column("note_text", sa.String(length=2000), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("anchor_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.chart_id"], name=op.f("fk_journal_entries_chart_id_charts")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.user_id"], name=op.f("fk_journal_entries_owner_user_id_users")),
        sa.PrimaryKeyConstraint("journal_id", name=op.f("pk_journal_entries")),
    )
    op.create_index(op.f("idx_journal_owner"), "journal_entries", ["owner_user_id"], unique=False)
    op.create_index(op.f("idx_journal_chart"), "journal_entries", ["chart_id"], unique=False)
    op.create_index(op.f("idx_journal_entry_date"), "journal_entries", ["entry_date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("idx_journal_entry_date"), table_name="journal_entries")
    op.drop_index(op.f("idx_journal_chart"), table_name="journal_entries")
    op.drop_index(op.f("idx_journal_owner"), table_name="journal_entries")
    op.drop_table("journal_entries")

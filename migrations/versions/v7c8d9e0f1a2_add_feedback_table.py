"""add feedback table

Revision ID: v7c8d9e0f1a2
Revises: u6b7c8d9e0f1
Create Date: 2026-06-14 10:00:00.000000

Beta launch — persist feedback and reviews so submissions survive server
restarts. Replaces the in-process ``_feedback_log`` list in app/api/feedback.py.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "v7c8d9e0f1a2"
down_revision: str | Sequence[str] | None = "u6b7c8d9e0f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if "feedback" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "feedback",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("category", sa.String(length=32), nullable=False, server_default="other"),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("page_context", sa.String(length=120), nullable=True),
        sa.Column("is_review", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("allow_contact", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("reward_qualified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.user_id"], name="fk_feedback_user_id_users", ondelete="SET NULL"
        ),
    )
    op.create_index("idx_feedback_created_at", "feedback", ["created_at"])
    op.create_index("idx_feedback_user_id", "feedback", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_feedback_user_id", table_name="feedback")
    op.drop_index("idx_feedback_created_at", table_name="feedback")
    op.drop_table("feedback")

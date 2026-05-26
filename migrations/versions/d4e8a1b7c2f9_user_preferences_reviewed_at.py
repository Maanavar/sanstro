"""add last_retention_reviewed_at to user_preferences

Revision ID: d4e8a1b7c2f9
Revises: c3d7e1a9b4f2
Create Date: 2026-05-23 21:20:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e8a1b7c2f9"
down_revision: Union[str, Sequence[str], None] = "c3d7e1a9b4f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_preferences", sa.Column("last_retention_reviewed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("user_preferences", "last_retention_reviewed_at")

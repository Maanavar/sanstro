"""add expires_at to panchangam cache

Revision ID: k6e7f8a9b0c1
Revises: j4d5e6f7a8b9
Create Date: 2026-05-30 12:55:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "k6e7f8a9b0c1"
down_revision: str | Sequence[str] | None = "j4d5e6f7a8b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "panchangam_cache",
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW() + INTERVAL '90 days'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("panchangam_cache", "expires_at")

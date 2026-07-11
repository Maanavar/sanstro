"""default dashboard_lang to English and backfill existing rows

Product decision (2026-07-11): the site loads in English by default on both the
marketing surface and the dashboard. Users pick their preferred default load
language in Settings, which persists to user_preferences.dashboard_lang and
syncs across devices.

This migration flips the column default to 'en' and backfills every existing
row from 'ta' to 'en' ("Everyone -> English" — see AGENT decision). Because the
column has always defaulted to 'ta', existing rows cannot distinguish an
explicit Tamil choice from the old default, so the backfill resets everyone;
anyone who wants Tamil re-picks it in Settings.

Note: the backfill is inherently irreversible (original per-user values are not
preserved). downgrade() only restores the previous column default of 'ta'.

Revision ID: jj3f4a5b6c7d
Revises: ii2e3f4a5b6c
Create Date: 2026-07-11 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "jj3f4a5b6c7d"
down_revision: str | Sequence[str] | None = "ii2e3f4a5b6c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Flip the stored default for new rows.
    with op.batch_alter_table("user_preferences") as batch_op:
        batch_op.alter_column(
            "dashboard_lang",
            existing_type=sa.String(length=8),
            existing_nullable=False,
            server_default="en",
        )
    # Backfill existing rows to English ("Everyone -> English").
    op.execute("UPDATE user_preferences SET dashboard_lang = 'en' WHERE dashboard_lang = 'ta'")


def downgrade() -> None:
    # Restore the previous default. Original per-user values are not recoverable.
    with op.batch_alter_table("user_preferences") as batch_op:
        batch_op.alter_column(
            "dashboard_lang",
            existing_type=sa.String(length=8),
            existing_nullable=False,
            server_default="ta",
        )

"""Last-seen day, platform and language on users (admin spec L6, §8).

Adds `users.last_seen_on` (date, IST), `last_platform` and `last_language`.
Every business metric in spec §8 — DAU/WAU/MAU, activation, the D1/D7/D30
cohorts — is defined over "a signed-in user whose last_seen_on is that day",
computed server-side from this database rather than from PostHog (D-11), so the
numbers hold for accounts that granted no product analytics.

A date and not a timestamp: the day answers every §8 question, while a
per-request timestamp would build a usage trail on an app people consult about
illness and marriage. `app/core/presence.py` writes at most one row per account
per IST day.

Indexed because every one of those queries filters or groups on it, and the
cohort queries scan the whole table without it.

All three columns are nullable with no backfill. There is nothing honest to
backfill them from: `created_at` says when an account was made, not when it was
last used, and writing it here would invent a day of activity for every dormant
account and overstate the first DAU readings. Null reads as "not seen since
this shipped", which is the truth.

The columns are new and hold no data from before this revision, so the
downgrade drops them.

Revision ID: ab1c2d3e4f5a
Revises: fa5b6c7d8e9f
Create Date: 2026-11-04 10:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "ab1c2d3e4f5a"
down_revision = "fa5b6c7d8e9f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_seen_on", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("last_platform", sa.String(length=16), nullable=True))
    op.add_column("users", sa.Column("last_language", sa.String(length=2), nullable=True))
    op.create_index("ix_users_last_seen_on", "users", ["last_seen_on"])


def downgrade() -> None:
    op.drop_index("ix_users_last_seen_on", table_name="users")
    op.drop_column("users", "last_language")
    op.drop_column("users", "last_platform")
    op.drop_column("users", "last_seen_on")

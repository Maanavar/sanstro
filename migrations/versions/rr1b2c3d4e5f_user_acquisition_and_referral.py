"""Record where an account came from, and give it a referral code

GRW-03 / GRW-13 (2026-09-26). Seven nullable columns on `users`, no backfill,
no data rewrite:

- `acquisition_source`, `_medium`, `_campaign` — the utm tags on the visit that
  first reached the site;
- `acquisition_ref` — a referral code from a `?ref=` link, if the first visit
  carried one;
- `acquisition_referrer_host` — the referring site's host only, never the URL;
- `acquisition_landing_path` — the first page's path, without its query;
- `referral_code` — this account's own code, unique, minted on first request.

**Existing rows stay NULL.** There is no honest value to backfill: an account
that predates the capture has an unknown source, and "unknown" is what NULL
says. Inventing "direct" would inflate the one bucket the numbers are meant
to shrink.

Metadata-only adds plus one unique index on an all-NULL column, so fast on any
table size. Fully reversible: `downgrade()` drops the index and the columns,
losing only the attribution data itself.

Revision ID: rr1b2c3d4e5f
Revises: qq0a1b2c3d4e
Create Date: 2026-09-26 12:30:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "rr1b2c3d4e5f"
down_revision = "qq0a1b2c3d4e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("acquisition_source", sa.String(length=64), nullable=True))
        batch.add_column(sa.Column("acquisition_medium", sa.String(length=64), nullable=True))
        batch.add_column(sa.Column("acquisition_campaign", sa.String(length=128), nullable=True))
        batch.add_column(sa.Column("acquisition_ref", sa.String(length=32), nullable=True))
        batch.add_column(sa.Column("acquisition_referrer_host", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("acquisition_landing_path", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("referral_code", sa.String(length=16), nullable=True))
        batch.create_unique_constraint("uq_users_referral_code", ["referral_code"])


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("uq_users_referral_code", type_="unique")
        batch.drop_column("referral_code")
        batch.drop_column("acquisition_landing_path")
        batch.drop_column("acquisition_referrer_host")
        batch.drop_column("acquisition_ref")
        batch.drop_column("acquisition_campaign")
        batch.drop_column("acquisition_medium")
        batch.drop_column("acquisition_source")

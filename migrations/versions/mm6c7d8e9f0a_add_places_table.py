"""Add places table for offline birthplace search

Owner ruling 2026-08-24 (B-006): birthplace lookup should be a bundled,
offline dataset by default, not a per-keystroke third-party geocoder call.
This creates the empty table only — population is a separate, idempotent
script (`scripts/ingest_places.py`), not migration data, per this repo's own
migration-authoring rules (schema and bulk data don't belong in the same
step; a schema migration should stay small, reviewable, and fast to run
against `vinaadi_dev`).

`search_key` (lowercased, ASCII-folded `name`) is what the index below is
built for — prefix queries (`search_key LIKE 'mann%'`) — not the display name
itself. The index uses `varchar_pattern_ops`: under this DB's default
(non-C) locale collation, a plain btree index cannot serve a `LIKE 'prefix%'`
scan at all (confirmed via EXPLAIN against a 40k-row test load — even with
the planner forced away from a sequential scan, no index-based plan existed).

Revision ID: mm6c7d8e9f0a
Revises: ll5b6c7d8e9f
Create Date: 2026-08-24 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "mm6c7d8e9f0a"
down_revision: Union[str, Sequence[str], None] = "ll5b6c7d8e9f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "places",
        sa.Column("geoname_id", sa.BigInteger(), autoincrement=False, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("search_key", sa.String(200), nullable=False),
        sa.Column("admin1_name", sa.String(100), nullable=True),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("country_name", sa.String(100), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("timezone", sa.String(64), nullable=False),
        sa.Column("population", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("geoname_id", name=op.f("pk_places")),
    )
    op.create_index(
        "idx_places_search_key_pattern",
        "places",
        ["search_key"],
        postgresql_ops={"search_key": "varchar_pattern_ops"},
    )


def downgrade() -> None:
    op.drop_table("places")

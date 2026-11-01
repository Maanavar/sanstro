"""birth_profiles: birth date, latitude and longitude are NOT NULL (ARC-18).

The model has always declared these three NOT NULL, and every write path
supplies them. The database never enforced it: `dd3e4f5a6b7c` rebuilt them as
encrypted BYTEA columns, nullable, and nothing tightened them afterwards. A
profile without a birth date or place cannot produce a chart, so the database
now refuses one instead of trusting every writer.

Refuses to run, naming the counts, if any row already holds a NULL: those rows
need a decision about the person's data, which a migration must not make.
vinaadi_dev held 0 such rows of 4 on 2026-11-01.

Reversible: downgrade drops the three NOT NULL constraints and touches no data.

The other ARC-18 drift (three indexes the migrations created but the models
never declared) is fixed in the models; the database already had them right.

Revision ID: zz9d0e1f2a3b
Revises: yy8c9d0e1f2a
Create Date: 2026-11-01 22:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "zz9d0e1f2a3b"
down_revision = "yy8c9d0e1f2a"
branch_labels = None
depends_on = None

_COLUMNS = ("birth_date_local", "birth_latitude", "birth_longitude")


def upgrade() -> None:
    conn = op.get_bind()
    nulls = {
        column: conn.execute(sa.text(f"SELECT count(*) FROM birth_profiles WHERE {column} IS NULL")).scalar_one()
        for column in _COLUMNS
    }
    if any(nulls.values()):
        raise RuntimeError(f"birth_profiles has NULLs that NOT NULL would reject: {nulls}. Resolve those rows first.")
    for column in _COLUMNS:
        op.alter_column("birth_profiles", column, existing_type=sa.LargeBinary(), nullable=False)


def downgrade() -> None:
    for column in _COLUMNS:
        op.alter_column("birth_profiles", column, existing_type=sa.LargeBinary(), nullable=True)

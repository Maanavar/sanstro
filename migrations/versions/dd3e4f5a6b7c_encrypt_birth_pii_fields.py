"""encrypt birth PII fields (date, time, lat, lon) with Fernet

Revision ID: dd3e4f5a6b7c
Revises: cc2d3e4f5a6b
Create Date: 2026-06-29 00:00:00.000000

REQUIRES: JOTHIDAM_ENCRYPTION_KEY env var set before running.
Test on vinaadi_test first, then apply to prod with a DB backup.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "dd3e4f5a6b7c"
down_revision: str | Sequence[str] | None = "cc2d3e4f5a6b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    from app.services.encryption import encrypt  # key must be set in env

    # 1. Add nullable shadow columns to hold ciphertext
    op.add_column("birth_profiles", sa.Column("birth_date_enc", sa.LargeBinary(), nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_time_enc", sa.LargeBinary(), nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_latitude_enc", sa.LargeBinary(), nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_longitude_enc", sa.LargeBinary(), nullable=True))

    # 2. Encrypt every existing row and write ciphertext into shadow columns
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT birth_profile_id, birth_date_local, birth_time_local, "
            "birth_latitude, birth_longitude FROM birth_profiles"
        )
    ).fetchall()

    for row in rows:
        bid, bd, bt, blat, blon = row
        conn.execute(
            sa.text(
                "UPDATE birth_profiles "
                "SET birth_date_enc      = :d, "
                "    birth_time_enc      = :t, "
                "    birth_latitude_enc  = :lat, "
                "    birth_longitude_enc = :lon "
                "WHERE birth_profile_id  = :id"
            ),
            {
                "d":   encrypt(str(bd).encode()) if bd is not None else None,
                "t":   encrypt(str(bt).encode()) if bt is not None else None,
                "lat": encrypt(str(float(blat)).encode()) if blat is not None else None,
                "lon": encrypt(str(float(blon)).encode()) if blon is not None else None,
                "id":  str(bid),
            },
        )

    # 3. Swap: drop plain columns, rename ciphertext columns to original names.
    #    batch_alter_table handles SQLite's limited ALTER TABLE support.
    with op.batch_alter_table("birth_profiles") as batch_op:
        batch_op.drop_column("birth_date_local")
        batch_op.drop_column("birth_time_local")
        batch_op.drop_column("birth_latitude")
        batch_op.drop_column("birth_longitude")
        batch_op.alter_column("birth_date_enc",      new_column_name="birth_date_local")
        batch_op.alter_column("birth_time_enc",      new_column_name="birth_time_local")
        batch_op.alter_column("birth_latitude_enc",  new_column_name="birth_latitude")
        batch_op.alter_column("birth_longitude_enc", new_column_name="birth_longitude")


def downgrade() -> None:
    # Decrypt ciphertext back to plain typed columns.
    # Requires JOTHIDAM_ENCRYPTION_KEY to be set.
    from app.services.encryption import decrypt

    op.add_column("birth_profiles", sa.Column("birth_date_plain",      sa.Date(),          nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_time_plain",      sa.Time(),          nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_latitude_plain",  sa.Numeric(9, 6),   nullable=True))
    op.add_column("birth_profiles", sa.Column("birth_longitude_plain", sa.Numeric(9, 6),   nullable=True))

    from datetime import date, time as _time
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT birth_profile_id, birth_date_local, birth_time_local, "
            "birth_latitude, birth_longitude FROM birth_profiles"
        )
    ).fetchall()

    for row in rows:
        bid, bd_enc, bt_enc, blat_enc, blon_enc = row
        conn.execute(
            sa.text(
                "UPDATE birth_profiles "
                "SET birth_date_plain      = :d, "
                "    birth_time_plain      = :t, "
                "    birth_latitude_plain  = :lat, "
                "    birth_longitude_plain = :lon "
                "WHERE birth_profile_id    = :id"
            ),
            {
                "d":   date.fromisoformat(decrypt(bytes(bd_enc)).decode()) if bd_enc is not None else None,
                "t":   _time.fromisoformat(decrypt(bytes(bt_enc)).decode()) if bt_enc is not None else None,
                "lat": float(decrypt(bytes(blat_enc)).decode()) if blat_enc is not None else None,
                "lon": float(decrypt(bytes(blon_enc)).decode()) if blon_enc is not None else None,
                "id":  str(bid),
            },
        )

    with op.batch_alter_table("birth_profiles") as batch_op:
        batch_op.drop_column("birth_date_local")
        batch_op.drop_column("birth_time_local")
        batch_op.drop_column("birth_latitude")
        batch_op.drop_column("birth_longitude")
        batch_op.alter_column("birth_date_plain",      new_column_name="birth_date_local")
        batch_op.alter_column("birth_time_plain",      new_column_name="birth_time_local")
        batch_op.alter_column("birth_latitude_plain",  new_column_name="birth_latitude")
        batch_op.alter_column("birth_longitude_plain", new_column_name="birth_longitude")

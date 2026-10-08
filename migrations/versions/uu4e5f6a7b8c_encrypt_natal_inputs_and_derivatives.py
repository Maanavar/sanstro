"""Encrypt the natal inputs and the derivatives that reconstruct them (A12 Option C)

Owner ruling 2026-10-08. Birth date, time and coordinates were already Fernet
columns, but a readable dump still gave the exact birth instant away through
``birth_profiles.birth_datetime_utc`` and ``charts.julian_day``, and almost as
precisely through the lagna/planet longitudes (the Moon fixes the date, the lagna
the time to minutes). This encrypts all of them, the planet payload that repeats
the longitudes, the family member's plaintext DOB copy, birth place/timezone,
and the current location.

Not encrypted, by ruling: rasi/nakshatra/pada keys (coarse, and SQL-filtered).
Not touched: ``dasha_periods`` and ``varga_positions`` — no writer, no rows; see
tests/test_birth_data_at_rest.py.

Same shape as oo8e9f0a1b2c (journal note_text): add a ciphertext column,
backfill in primary-key batches, drop the plaintext column, rename, then restore
NOT NULL. **Requires the encryption key**; refuses to run without one rather
than leaving plaintext behind a successful-looking upgrade. ``downgrade()``
decrypts back to the original types and is round-trip tested.

Backups taken before this migration still hold plaintext. Policy: forward-only;
those generations age out under normal retention (docs/DATA_PROTECTION.md §3).

Revision ID: uu4e5f6a7b8c
Revises: tt3d4e5f6a7b
Create Date: 2026-10-08 10:30:00.000000

"""
from __future__ import annotations

import json
from collections.abc import Callable, Sequence
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import sqlalchemy as sa
from alembic import op

revision: str = "uu4e5f6a7b8c"
down_revision: str | Sequence[str] | None = "tt3d4e5f6a7b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_BATCH = 500


def _enc_text(value: Any) -> bytes:
    return str(value).encode("utf-8")


def _enc_float(value: Any) -> bytes:
    return str(float(value)).encode()


def _enc_iso(value: Any) -> bytes:
    return value.isoformat().encode()


def _enc_json(value: Any) -> bytes:
    # Selected as ::text, so the stored document is encrypted verbatim and a
    # downgrade restores it byte for byte. Re-serialising would \u-escape Tamil.
    json.loads(value)
    return value.encode("utf-8")


def _dec_text(raw: bytes) -> str:
    return raw.decode("utf-8")


def _dec_float(raw: bytes) -> Decimal:
    return Decimal(raw.decode())


def _dec_datetime(raw: bytes) -> datetime:
    return datetime.fromisoformat(raw.decode())


def _dec_date(raw: bytes) -> date:
    return date.fromisoformat(raw.decode())


def _dec_json(raw: bytes) -> str:
    return raw.decode("utf-8")


# column, plaintext type, nullable, encode-to-plaintext-bytes, decode-from-plaintext-bytes
_Spec = tuple[str, sa.types.TypeEngine, bool, Callable[[Any], bytes], Callable[[bytes], Any]]

TABLES: tuple[tuple[str, str, tuple[_Spec, ...]], ...] = (
    (
        "birth_profiles",
        "birth_profile_id",
        (
            ("birth_datetime_utc", sa.DateTime(timezone=True), True, _enc_iso, _dec_datetime),
            ("birth_place", sa.String(255), False, _enc_text, _dec_text),
            ("birth_timezone", sa.String(64), False, _enc_text, _dec_text),
            ("current_place", sa.String(255), True, _enc_text, _dec_text),
            ("current_latitude", sa.Numeric(9, 6), True, _enc_float, _dec_float),
            ("current_longitude", sa.Numeric(9, 6), True, _enc_float, _dec_float),
            ("current_timezone", sa.String(64), True, _enc_text, _dec_text),
        ),
    ),
    (
        "charts",
        "chart_id",
        (
            ("julian_day", sa.Numeric(16, 8), False, _enc_float, _dec_float),
            ("lagna_longitude", sa.Numeric(12, 8), False, _enc_float, _dec_float),
        ),
    ),
    (
        "chart_planets",
        "chart_planet_id",
        (
            ("absolute_longitude", sa.Numeric(12, 8), False, _enc_float, _dec_float),
            ("degree_in_rasi", sa.Numeric(12, 8), False, _enc_float, _dec_float),
            ("speed_deg_per_day", sa.Numeric(12, 8), True, _enc_float, _dec_float),
            ("raw_payload", sa.JSON(), False, _enc_json, _dec_json),
        ),
    ),
    (
        "family_members",
        "family_member_id",
        (("date_of_birth_local", sa.Date(), True, _enc_iso, _dec_date),),
    ),
)


def _require_key() -> None:
    from app.core.encryption import configured_keys

    if not configured_keys():
        raise RuntimeError(
            "JOTHIDAM_ENCRYPTION_KEY (or JOTHIDAM_ENCRYPTION_KEYS) must be set before "
            "running this migration: it encrypts existing birth and chart data, and "
            "without a key it would leave every row in plaintext while reporting success."
        )


def _rewrite(table: str, pk: str, specs: tuple[_Spec, ...], suffix: str, convert: Callable[[_Spec, Any], Any]) -> None:
    """Copy every listed column into its `<column><suffix>` twin, converted, keyed by PK."""
    conn = op.get_bind()
    columns = [spec[0] for spec in specs]
    select_list = ", ".join(
        [pk, *(f"{spec[0]}::text" if isinstance(spec[1], sa.JSON) and suffix == "_enc" else spec[0] for spec in specs)]
    )
    set_list = ", ".join(f"{c}{suffix} = :{c}" for c in columns)
    # Identifiers are module constants above, never input.
    first = sa.text(f"SELECT {select_list} FROM {table} ORDER BY {pk} LIMIT :limit")  # noqa: S608
    after = sa.text(f"SELECT {select_list} FROM {table} WHERE {pk} > :last ORDER BY {pk} LIMIT :limit")  # noqa: S608
    update = sa.text(f"UPDATE {table} SET {set_list} WHERE {pk} = :pk")  # noqa: S608

    last = None
    while True:
        params: dict[str, Any] = {"limit": _BATCH}
        if last is not None:
            params["last"] = last
        rows = conn.execute(first if last is None else after, params).fetchall()
        if not rows:
            break
        for row in rows:
            values = {"pk": row[0]}
            for offset, spec in enumerate(specs, start=1):
                raw = row[offset]
                values[spec[0]] = None if raw is None else convert(spec, raw)
            conn.execute(update, values)
        last = rows[-1][0]


def _swap(table: str, specs: tuple[_Spec, ...], suffix: str, *, plaintext: bool) -> None:
    with op.batch_alter_table(table) as batch_op:
        for column, *_ in specs:
            batch_op.drop_column(column)
    with op.batch_alter_table(table) as batch_op:
        for column, _plain_type, nullable, *_ in specs:
            kwargs: dict[str, Any] = {"new_column_name": column, "nullable": nullable}
            if plaintext and column == "raw_payload":
                kwargs["server_default"] = sa.text("'{}'")
            batch_op.alter_column(f"{column}{suffix}", **kwargs)


def upgrade() -> None:
    from app.core.encryption import encrypt_bytes

    _require_key()
    for table, pk, specs in TABLES:
        with op.batch_alter_table(table) as batch_op:
            for column, *_ in specs:
                batch_op.add_column(sa.Column(f"{column}_enc", sa.LargeBinary(), nullable=True))
        _rewrite(table, pk, specs, "_enc", lambda spec, raw: encrypt_bytes(spec[3](raw)))
        _swap(table, specs, "_enc", plaintext=False)


def downgrade() -> None:
    """Decrypt back to plaintext. Real, because the only alternative is a restore."""
    from app.core.encryption import decrypt_bytes

    _require_key()
    for table, pk, specs in TABLES:
        with op.batch_alter_table(table) as batch_op:
            for column, plain_type, *_ in specs:
                batch_op.add_column(sa.Column(f"{column}_plain", plain_type, nullable=True))
        _rewrite(table, pk, specs, "_plain", lambda spec, raw: spec[4](decrypt_bytes(bytes(raw))))
        _swap(table, specs, "_plain", plaintext=True)

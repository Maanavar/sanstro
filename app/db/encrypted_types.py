"""SQLAlchemy column types for field-level encryption of PII.

Key material — including multi-key rotation — lives in `app.core.encryption`.
This module is only the mapping between Python values and Fernet ciphertext, and
deliberately holds no key logic of its own: it used to build its own `Fernet`
from the same setting, and two independent key paths is how a rotation ends up
half-applied.

Fernet is AES-128-CBC with an HMAC-SHA256, so ciphertext is authenticated —
tampering raises `InvalidToken` on read rather than yielding a plausible wrong
value.

Lives in `app.db` because it is persistence infrastructure: the ORM models
import it. It was `app.services.encryption` until A13 (2026-10-08), which made
every model depend on the services layer that is supposed to depend on them.
"""
from __future__ import annotations

import json
from datetime import date, datetime, time

from sqlalchemy import LargeBinary
from sqlalchemy.types import TypeDecorator

from app.core.encryption import decrypt_bytes, encrypt_bytes

__all__ = [
    "EncryptedBytes",
    "EncryptedDate",
    "EncryptedDateTime",
    "EncryptedFloat",
    "EncryptedJSON",
    "EncryptedString",
    "EncryptedTime",
    "decrypt",
    "encrypt",
]


def encrypt(plaintext: bytes) -> bytes:
    """Encrypt bytes with the newest configured key."""
    return encrypt_bytes(plaintext)


def decrypt(ciphertext: bytes) -> bytes:
    """Decrypt with whichever configured key wrote it. Raises InvalidToken if none."""
    return decrypt_bytes(ciphertext)


# ---------------------------------------------------------------------------
# SQLAlchemy TypeDecorators for transparent field-level encryption
#
# Every one of these stores LargeBinary. That is what makes the columns
# unsearchable in SQL: no LIKE, no ORDER BY, no index that means anything. Check
# for query-side use of a column before encrypting it — see EncryptedString.
# ---------------------------------------------------------------------------

class EncryptedDate(TypeDecorator):
    """Stores a Python date as Fernet-encrypted bytes in the DB column."""
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, date):
            return encrypt(value.isoformat().encode())
        raise TypeError(f"EncryptedDate expects date, got {type(value)!r}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return date.fromisoformat(decrypt(bytes(value)).decode())


class EncryptedTime(TypeDecorator):
    """Stores a Python time as Fernet-encrypted bytes in the DB column."""
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, time):
            return encrypt(value.isoformat().encode())
        raise TypeError(f"EncryptedTime expects time, got {type(value)!r}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return time.fromisoformat(decrypt(bytes(value)).decode())


class EncryptedDateTime(TypeDecorator):
    """Stores a timezone-aware datetime as Fernet-encrypted ISO-8601 bytes.

    Naive values are refused rather than guessed at: the column this replaced was
    ``TIMESTAMPTZ``, and a naive datetime written here would read back as a
    different instant on any host whose local zone is not UTC.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo is None:
                raise ValueError("EncryptedDateTime requires a timezone-aware datetime")
            return encrypt(value.isoformat().encode())
        raise TypeError(f"EncryptedDateTime expects datetime, got {type(value)!r}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return datetime.fromisoformat(decrypt(bytes(value)).decode())


class EncryptedJSON(TypeDecorator):
    """Stores a JSON-serialisable value as Fernet-encrypted bytes.

    Unlike ``JSON``, SQLAlchemy cannot see in-place mutation of the decrypted
    value; assign a new object to persist a change.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt(json.dumps(value, separators=(",", ":")).encode("utf-8"))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(decrypt(bytes(value)).decode("utf-8"))


class EncryptedFloat(TypeDecorator):
    """Stores a Python float as Fernet-encrypted bytes in the DB column."""
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt(str(float(value)).encode())

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return float(decrypt(bytes(value)).decode())


class EncryptedString(TypeDecorator):
    """Stores UTF-8 text as Fernet-encrypted bytes in the DB column.

    **Length limits stop being enforced by the database.** The others here wrap
    fixed-width values; this one replaces a ``String(n)``, and the ciphertext
    column has no ``n``. Whatever validated the length before — for
    ``JournalEntry.note_text``, ``max_length=2000`` on the Pydantic schema — is
    now the only thing that does. Removing that validator would silently permit
    unbounded rows.

    **And the column becomes unsearchable.** Ciphertext does not sort, match
    ``LIKE``, or index usefully. Confirm nothing filters on the column in SQL
    before applying this; journal tagging already ran in Python
    (``journal_service._extract_tags``), which is why note_text could move.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            return encrypt(value.encode("utf-8"))
        raise TypeError(f"EncryptedString expects str, got {type(value)!r}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt(bytes(value)).decode("utf-8")


class EncryptedBytes(TypeDecorator):
    """Stores an opaque byte string as Fernet-encrypted bytes.

    For a blob that is already bytes and must not be readable in a dump --
    `Report.pdf`, where the rendered document repeats the birth place, the birth
    date and the planet longitudes that are ciphertext in `birth_profiles`,
    `charts` and `chart_planets` by owner ruling (A12 Option C).

    A compressed PDF is not a protected one. reportlab writes
    `/Filter [ /ASCII85Decode /FlateDecode ]`, and both are standard, keyless
    transforms: ASCII85-decode then inflate and the birth place is a substring.
    Measured, not assumed.

    **Size.** Fernet base64-encodes its output, so ciphertext is roughly 4/3 of
    the plaintext plus a small header. `byte_size` and `sha256` on the row
    describe the *plaintext* document -- they are what proves a re-download is
    byte-identical -- so they must keep being computed before the value is
    handed to this type, never from the stored column's length.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, bytes | bytearray | memoryview):
            return encrypt(bytes(value))
        raise TypeError(f"EncryptedBytes expects bytes, got {type(value)!r}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt(bytes(value))

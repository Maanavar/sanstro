"""SQLAlchemy column types for field-level encryption of PII.

Key material — including multi-key rotation — lives in `app.core.encryption`.
This module is only the mapping between Python values and Fernet ciphertext, and
deliberately holds no key logic of its own: it used to build its own `Fernet`
from the same setting, and two independent key paths is how a rotation ends up
half-applied.

Fernet is AES-128-CBC with an HMAC-SHA256, so ciphertext is authenticated —
tampering raises `InvalidToken` on read rather than yielding a plausible wrong
value.
"""
from __future__ import annotations

from datetime import date, time

from sqlalchemy import LargeBinary
from sqlalchemy.types import TypeDecorator

from app.core.encryption import decrypt_bytes, encrypt_bytes

__all__ = [
    "EncryptedDate",
    "EncryptedFloat",
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

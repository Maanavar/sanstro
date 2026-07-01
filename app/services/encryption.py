"""Field-level symmetric encryption for PII stored in the database.

Uses Fernet (AES-128-CBC + HMAC-SHA256) from the cryptography package.
Set JOTHIDAM_ENCRYPTION_KEY to a URL-safe base64-encoded 32-byte key.
Generate a key with:
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
from __future__ import annotations

from datetime import date, time

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import LargeBinary
from sqlalchemy.types import TypeDecorator

from app.core.config import get_settings

_KEY_ENV = "JOTHIDAM_ENCRYPTION_KEY"
_fernet_cache: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet_cache
    if _fernet_cache is not None:
        return _fernet_cache
    key = get_settings().encryption_key
    if not key:
        raise RuntimeError(
            f"Encryption key not set. Configure {_KEY_ENV} in the environment. "
            "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    _fernet_cache = Fernet(key.encode())
    return _fernet_cache


def encrypt(plaintext: bytes) -> bytes:
    """Encrypt bytes with Fernet (AES-128-CBC + HMAC). Returns ciphertext bytes."""
    return _get_fernet().encrypt(plaintext)


def decrypt(ciphertext: bytes) -> bytes:
    """Decrypt Fernet ciphertext. Raises InvalidToken if tampered or wrong key."""
    return _get_fernet().decrypt(ciphertext)


# ---------------------------------------------------------------------------
# SQLAlchemy TypeDecorators for transparent field-level encryption
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

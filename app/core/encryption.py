"""Key material for field-level encryption at rest.

This module owns the keys. `app.services.encryption` owns the SQLAlchemy column
types that use them; it imports from here, and there is exactly one place a key
is read from configuration. There used to be two — this module and
`app.services.encryption` each built their own `Fernet` from
`settings.encryption_key` — which was survivable only because both read the same
single-key setting. Adding rotation to one and not the other would have produced
data that one half of the codebase could read and the other could not.

## Rotation

`MultiFernet` decrypts with any key in the list and encrypts with the **first**.
So a rotation is:

1. Prepend the new key to ``JOTHIDAM_ENCRYPTION_KEYS`` and deploy. Everything
   written from now on uses the new key; everything already written still
   decrypts under the old one. The application is fully functional at this point
   and this step is reversible.
2. Run ``scripts/rotate_encryption_key.py`` to re-encrypt existing rows.
3. Once it reports every row re-encrypted, drop the old key from the list.

The order matters. Removing the old key before step 2 finishes makes every row
still holding old ciphertext permanently unreadable — Fernet has no way to tell
you *which* key a token needs, only whether the ones you offered worked.

## What this protects against, precisely

A leaked database dump, and nothing more. The key sits in the environment of the
process that holds the data, so an attacker who compromises the application host
reads both. That is still worth having — dumps leak by routes that host
compromise does not (a misplaced backup, an over-broad read replica, a restored
snapshot on a laptop) — but it must not be described as more than it is, in the
privacy policy or anywhere else.
"""
from __future__ import annotations

import logging
from functools import lru_cache

from cryptography.fernet import Fernet, MultiFernet

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_KEY_ENV = "JOTHIDAM_ENCRYPTION_KEY"
_KEYS_ENV = "JOTHIDAM_ENCRYPTION_KEYS"

_GENERATE_HINT = (
    'Generate one with: python -c "from cryptography.fernet import Fernet; '
    'print(Fernet.generate_key().decode())"'
)


def configured_keys() -> list[str]:
    """Every key this process can decrypt with, newest first.

    ``JOTHIDAM_ENCRYPTION_KEYS`` (comma-separated) takes precedence;
    ``JOTHIDAM_ENCRYPTION_KEY`` remains supported as the single-key form, and a
    deployment that never rotates need not change anything.

    Order is the whole contract: index 0 encrypts, all of them decrypt.
    """
    settings = get_settings()
    raw = (getattr(settings, "encryption_keys", "") or "").strip()
    if raw:
        keys = [k.strip() for k in raw.split(",") if k.strip()]
    else:
        single = (settings.encryption_key or "").strip()
        keys = [single] if single else []

    # A duplicate is not an error worth failing on, but it does mean somebody
    # meant to rotate and pasted the same key twice — which looks like a
    # completed rotation and is not one.
    if len(set(keys)) != len(keys):
        logger.warning(
            "encryption_keys contains a duplicate; a rotation that lists the same "
            "key twice has not rotated anything."
        )
    return keys


@lru_cache
def get_fernet() -> MultiFernet:
    """The process-wide MultiFernet. Cached; a key change needs a restart."""
    keys = configured_keys()
    if not keys:
        raise RuntimeError(
            f"Encryption key not set. Configure {_KEYS_ENV} (comma-separated, "
            f"newest first) or {_KEY_ENV} in the environment. {_GENERATE_HINT}"
        )
    try:
        return MultiFernet([Fernet(key.encode()) for key in keys])
    except (ValueError, TypeError) as exc:
        # Fernet raises on a malformed key. Say which position, without ever
        # putting key material in a log line.
        raise RuntimeError(
            f"Invalid Fernet key in {_KEYS_ENV}/{_KEY_ENV}: {exc}. Keys must be "
            f"url-safe base64-encoded 32-byte values. {_GENERATE_HINT}"
        ) from exc


def reset_fernet_cache() -> None:
    """Drop the cached MultiFernet. For tests and the rotation script."""
    get_fernet.cache_clear()


def encrypt_bytes(data: bytes) -> bytes:
    """Encrypt with the newest key."""
    return get_fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    """Decrypt with whichever configured key wrote it. Raises InvalidToken if none."""
    return get_fernet().decrypt(data)


def rotate_bytes(data: bytes) -> bytes:
    """Re-encrypt existing ciphertext under the newest key.

    ``MultiFernet.rotate`` decrypts with any configured key and re-encrypts with
    the first. Note it also resets the token's embedded timestamp — irrelevant
    here, since nothing in this codebase enforces a Fernet TTL.
    """
    return get_fernet().rotate(data)

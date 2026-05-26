from __future__ import annotations

from cryptography.fernet import Fernet

from app.core.config import get_settings


def _get_fernet() -> Fernet:
    key = get_settings().encryption_key
    if not key:
        raise RuntimeError(
            "JOTHIDAM_ENCRYPTION_KEY is not configured. Set a valid Fernet key in the environment."
        )
    return Fernet(key)


def encrypt_bytes(data: bytes) -> bytes:
    return _get_fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    return _get_fernet().decrypt(data)

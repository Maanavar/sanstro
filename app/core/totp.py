"""TOTP (RFC 6238) for admin second factor — standard library only.

SHA-1, 30-second steps, 6 digits: the defaults every authenticator app
(Google Authenticator, Microsoft Authenticator, 1Password, Aegis) assumes when
it scans an `otpauth://` URI without parameters. Deliberately not configurable:
a non-default here is how an enrolment silently produces codes the app will
never match.

Replay is the caller's job: `verify` returns the matched step so the caller can
store it and refuse that step (and earlier) next time.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote

STEP_SECONDS = 30
DIGITS = 6
#: Steps either side of now that still match — absorbs phone clock drift and
#: the seconds a person takes to type. ±1 step is the RFC's recommendation.
DRIFT_STEPS = 1


def new_secret() -> str:
    """A fresh 160-bit secret, base32 without padding (what apps expect)."""
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _key(secret: str) -> bytes:
    padded = secret.upper() + "=" * (-len(secret) % 8)
    return base64.b32decode(padded)


def code_at_step(secret: str, step: int) -> str:
    digest = hmac.new(_key(secret), struct.pack(">Q", step), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(value % (10**DIGITS)).zfill(DIGITS)


def current_step(now: float | None = None) -> int:
    return int((time.time() if now is None else now) // STEP_SECONDS)


def verify(secret: str, code: str, *, now: float | None = None, after_step: int | None = None) -> int | None:
    """The step `code` matches within the drift window, or None.

    `after_step`: the last step already accepted for this secret. A code for
    that step or earlier is refused even if it is correct — that is what stops
    a code read over someone's shoulder being used a second time.
    """
    cleaned = "".join(ch for ch in code if ch.isdigit())
    if len(cleaned) != DIGITS:
        return None
    step = current_step(now)
    for candidate in range(step - DRIFT_STEPS, step + DRIFT_STEPS + 1):
        if after_step is not None and candidate <= after_step:
            continue
        if hmac.compare_digest(code_at_step(secret, candidate), cleaned):
            return candidate
    return None


def provisioning_uri(secret: str, account: str, issuer: str = "Vinaadi Admin") -> str:
    """The `otpauth://` URI an authenticator app scans or accepts pasted."""
    label = quote(f"{issuer}:{account}")
    return f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}"

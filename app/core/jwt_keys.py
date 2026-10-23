"""JWT secrets, and the single place a token's signature is checked.

Why this module exists
----------------------
Until 2026-10-10 ``JOTHIDAM_JWT_SECRET`` was one value that both signed and
verified, with no second slot. Changing it invalidated every token in flight at
once:

- **Web** — the session is a cookie JWT with a ``jwt_expire_minutes`` lifetime
  (1 day) and no refresh token, so every signed-in reader is signed out the
  moment the new secret loads.
- **Mobile** — the 30-minute access token dies, but the refresh token survives,
  because that one is an opaque ``secrets.token_hex(32)`` row in
  ``refresh_tokens`` (``app/api/mobile_auth.py``) and is not signed with this
  secret at all. A client that handles 401 -> ``/auth/refresh`` recovers without
  the reader noticing.

So a rotation cost a forced sign-out of the whole web tier, which is the same as
saying the secret was never going to be rotated. That mattered from 2026-10-08,
when the move off python-jose to PyJWT started surfacing
``InsecureKeyLengthWarning`` for an HMAC secret shorter than its hash — a
weakness that had always been there and that nothing could act on, because
acting on it was an outage.

The fix mirrors the encryption-key design in ``app/core/encryption.py`` exactly,
so there is one rotation shape to learn in this codebase, not two:

1. Prepend the new secret to ``JOTHIDAM_JWT_SECRETS`` (comma-separated, **newest
   first**) and deploy. New tokens are signed with the new secret; tokens still
   held by readers verify against the old one. Nobody is signed out.
2. After ``jwt_expire_minutes`` (web) / the mobile access TTL has passed, every
   token in flight was signed with the new secret. Drop the old entry and
   deploy again.

Dropping the old secret before that window has passed is the one destructive
step, and it costs exactly what the single-secret form cost every time: a forced
sign-out. It does **not** lose data, unlike the encryption-key twin.

``JOTHIDAM_JWT_SECRET`` (singular) remains supported and is still the right
choice for a deployment that has never rotated. It is never split on commas, so
a secret that legitimately contains one keeps working.

Verification lives here too
---------------------------
``decode_jwt_payload`` is the only place in the app that calls ``jwt.decode``.
Two call sites used to, with the accepted algorithms pinned at each; a list of
secrets would have meant duplicating the loop and the pin. One site means one
thing to get right. ``tests/test_jwt_hmac_only.py`` ratchets that there is
exactly one and that it still pins its algorithms.
"""
from __future__ import annotations

import jwt

from app.core.config import get_settings

# ``app.core.config``'s boot validator calls the pure helpers below to refuse an
# undersized secret, so that the precedence rule and the length thresholds exist
# in one place. It imports them *inside* the validator, which runs when
# ``Settings()`` is constructed rather than at import time, so this module-level
# import cannot cycle.

SECRET_ENV = "JOTHIDAM_JWT_SECRET"  # noqa: S105 - an env var name, not a credential
SECRETS_ENV = "JOTHIDAM_JWT_SECRETS"  # noqa: S105 - an env var name, not a credential

# An HMAC secret shorter than the hash it feeds adds no strength beyond its own
# length and is brute-forceable offline from a single captured token. PyJWT >=
# 2.10 warns about it; these are the thresholds it uses, in bytes.
MIN_SECRET_BYTES = {"HS256": 32, "HS384": 48, "HS512": 64}


def split_jwt_secrets(plural: str | None, single: str | None) -> list[str]:
    """Apply the precedence rule. Pure, so the boot validator can call it too.

    ``JOTHIDAM_JWT_SECRETS`` (comma-separated) takes precedence;
    ``JOTHIDAM_JWT_SECRET`` remains supported as the single-secret form and is
    never split. Returns ``[]`` when neither is set - the caller decides whether
    that is a boot failure or a dev default.
    """
    raw = (plural or "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    lone = (single or "").strip()
    return [lone] if lone else []


def configured_jwt_secrets() -> list[str]:
    """Verification secrets, newest first. The first one signs."""
    settings = get_settings()
    secrets_list = split_jwt_secrets(getattr(settings, "jwt_secrets", ""), settings.jwt_secret)
    if not secrets_list:
        raise RuntimeError("JWT secret is not configured.")
    if len(set(secrets_list)) != len(secrets_list):
        # The same secret twice means the operator believes a rotation is in
        # progress when the old and new halves are identical, so step 2 above
        # would be a no-op and nothing is actually being rotated.
        raise RuntimeError(
            f"{SECRETS_ENV} contains a duplicate; a rotation that lists the same "
            "secret twice is not a rotation."
        )
    return secrets_list


def signing_secret() -> str:
    """The secret new tokens are signed with: the newest configured one."""
    return configured_jwt_secrets()[0]


def undersized_jwt_secrets(secrets_list: list[str], algorithm: str) -> list[int]:
    """1-based positions of secrets too short for ``algorithm``.

    Positions rather than values: this feeds a boot error message, and the
    message must not print the secret it is complaining about.
    """
    minimum = MIN_SECRET_BYTES.get(algorithm)
    if minimum is None:
        return []
    return [i for i, s in enumerate(secrets_list, start=1) if len(s.encode()) < minimum]


def decode_jwt_payload(token: str) -> dict:
    """Verify ``token`` against every configured secret, newest first.

    Raises ``jwt.PyJWTError`` if none of them verifies it. Trying several
    secrets is not a weakening: each verification is independent, every secret
    in the list is one this deployment issued tokens under, and the accepted
    algorithms are pinned on every attempt.
    """
    settings = get_settings()
    secrets_list = configured_jwt_secrets()
    first_error: jwt.PyJWTError | None = None
    for secret in secrets_list:
        try:
            return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
        except jwt.InvalidSignatureError as exc:
            # Only a wrong secret gets another attempt. Every other PyJWTError
            # means a secret *did* verify the signature and the token itself is
            # bad (expired, wrong algorithm, malformed) - trying the remaining
            # secrets cannot change that, and would turn "expired" into the
            # misleading "invalid signature" of the last attempt.
            if first_error is None:
                first_error = exc
            continue
    if first_error is not None:
        raise first_error
    raise jwt.InvalidTokenError("No JWT secret verified the token.")

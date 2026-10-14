"""First-touch attribution — where an account came from (GRW-03).

The web client records the visit that first reached the site in a first-party
cookie, `vinaadi_ft` (web/lib/acquisition.ts): utm tags, a `?ref=` referral
code, the referring *host* and the landing *path*. This module reads it once,
when an account is created — by email registration or by the Google callback,
both of which pass through the Next proxy with the browser's cookies — and
copies it onto the user row.

The cookie is client-written, so everything in it is treated as hostile input:
each field is length-capped and reduced to a small character set, and a value
that does not survive that is dropped rather than stored mangled. A missing or
malformed cookie is not an error — the account is created exactly as before,
with its attribution left NULL ("unknown").
"""
from __future__ import annotations

import json
import re
import secrets
import urllib.parse
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.user import User

FIRST_TOUCH_COOKIE = "vinaadi_ft"

# Tags and codes: letters, digits and a few separators people actually use in
# campaign names. Anything else is refused, not escaped.
_TAG = re.compile(r"^[A-Za-z0-9._\-+ ]{1,128}$")
_HOST = re.compile(r"^[A-Za-z0-9.\-]{1,255}$")
_PATH = re.compile(r"^/[A-Za-z0-9._~\-/]{0,254}$")
_REF = re.compile(r"^[A-Za-z0-9]{4,32}$")

# (cookie key, user attribute, pattern, max length)
_FIELDS: tuple[tuple[str, str, re.Pattern[str], int], ...] = (
    ("s", "acquisition_source", _TAG, 64),
    ("m", "acquisition_medium", _TAG, 64),
    ("c", "acquisition_campaign", _TAG, 128),
    ("r", "acquisition_ref", _REF, 32),
    ("h", "acquisition_referrer_host", _HOST, 255),
    ("p", "acquisition_landing_path", _PATH, 255),
)


def parse_first_touch(raw: str | None) -> dict[str, str]:
    """The cookie's fields that pass validation, keyed by user attribute."""
    if not raw:
        return {}
    try:
        data: Any = json.loads(urllib.parse.unquote(raw))
    except (ValueError, TypeError):
        return {}
    if not isinstance(data, dict):
        return {}
    out: dict[str, str] = {}
    for key, attr, pattern, limit in _FIELDS:
        value = data.get(key)
        if not isinstance(value, str):
            continue
        value = value.strip()[:limit]
        if key == "h":
            value = value.lower()
        if value and pattern.match(value):
            out[attr] = value
    return out


def apply_first_touch(user: User, request: Request) -> None:
    """Stamp a brand-new account with where it came from. Never raises."""
    for attr, value in parse_first_touch(request.cookies.get(FIRST_TOUCH_COOKIE)).items():
        setattr(user, attr, value)


# Unambiguous alphabet — no 0/O, 1/l/I — because people read these aloud and
# type them from a screenshot.
_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
_CODE_LENGTH = 8


def _new_code() -> str:
    return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(_CODE_LENGTH))


def referral_code_for(session: Session, user: User) -> str:
    """The account's referral code, minted on first request (GRW-13).

    31^8 ≈ 8.5e11 codes, so a collision is vanishingly rare; the unique
    constraint is the backstop and a clash simply retries.
    """
    if user.referral_code:
        return user.referral_code
    for _ in range(5):
        code = _new_code()
        exists = session.query(User.user_id).filter(User.referral_code == code).first()
        if exists is None:
            user.referral_code = code
            session.flush()
            return code
    raise RuntimeError("Could not mint a unique referral code in 5 attempts.")

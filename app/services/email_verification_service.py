"""Email address verification (prerequisite for the trial and admin roles).

A signed, short-lived token, not a table row: proving an address twice is
harmless, so single use buys nothing. The token carries a hash of the address
it was sent to, so changing the account's email kills every link sent to the
old one.
"""
from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.auth import TOKEN_TYPE_EMAIL_VERIFY, create_access_token, decode_token
from app.models.user import User

VERIFY_TOKEN_TTL = timedelta(hours=48)


class InvalidVerificationToken(ValueError):
    pass


def _email_fingerprint(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:32]


def issue_verification_token(user: User) -> str:
    if not user.email:
        raise InvalidVerificationToken("Account has no email address.")
    return create_access_token(
        str(user.user_id),
        expires_delta=VERIFY_TOKEN_TTL,
        token_type=TOKEN_TYPE_EMAIL_VERIFY,
        # Reuses the jti claim for the address fingerprint: create_access_token's
        # only free-form claim, and nothing else reads jti on this token type.
        jti=_email_fingerprint(user.email),
    )


def mark_verified(user: User, at: datetime | None = None) -> bool:
    """Stamp the address as proven. False if it already was (idempotent)."""
    if user.email_verified_at is not None:
        return False
    user.email_verified_at = at or datetime.now(UTC)
    return True


def user_for_token(db: Session, token: str) -> User:
    """The account a valid token proves; raises InvalidVerificationToken.

    Identifies only. Marking verified goes through
    `account_lifecycle.verify_email`, so the trial cannot be skipped.
    """
    try:
        payload = decode_token(token)
    except HTTPException as exc:
        raise InvalidVerificationToken("This link has expired or is not valid.") from exc
    if payload.get("typ") != TOKEN_TYPE_EMAIL_VERIFY:
        raise InvalidVerificationToken("This link has expired or is not valid.")
    try:
        user_id = UUID(str(payload.get("sub")))
    except ValueError as exc:
        raise InvalidVerificationToken("This link has expired or is not valid.") from exc
    user = db.get(User, user_id)
    if user is None or not user.email or payload.get("jti") != _email_fingerprint(user.email):
        raise InvalidVerificationToken("This link has expired or is not valid.")
    return user

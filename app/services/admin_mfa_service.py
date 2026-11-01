"""Admin TOTP enrolment, verification and recovery codes (admin spec L3, D-15).

The one service for the admin second factor. Elevation (`/admin/elevate`) and
enrolment both call `verify_second_factor`, so a recovery code and a TOTP code
are accepted by exactly the same rules wherever a second factor is asked for.
"""
from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core import totp
from app.models.admin_mfa import AdminMfaCredential, AdminRecoveryCode
from app.models.user import User

RECOVERY_CODE_COUNT = 10


class MfaError(ValueError):
    """A second-factor operation the caller asked for cannot be done."""


def _normalise_recovery_code(code: str) -> str:
    return "".join(ch for ch in code.upper() if ch.isalnum())


def _hash_recovery_code(code: str) -> str:
    return hashlib.sha256(_normalise_recovery_code(code).encode("ascii")).hexdigest()


def _new_recovery_code() -> str:
    raw = base64.b32encode(secrets.token_bytes(7)).decode("ascii").rstrip("=")[:10]
    return f"{raw[:5]}-{raw[5:]}"


def is_enrolled(db: Session, user: User) -> bool:
    credential = db.get(AdminMfaCredential, user.user_id)
    return credential is not None and credential.confirmed_at is not None


def start_enrolment(db: Session, user: User) -> tuple[str, str]:
    """A new secret and its otpauth URI. Replaces any unconfirmed secret.

    Refused once confirmed: replacing a working second factor must itself
    require the second factor (use `reset_for` by an owner, or a recovery code
    to elevate first), or a stolen session could swap in the thief's phone.
    """
    credential = db.get(AdminMfaCredential, user.user_id)
    if credential is not None and credential.confirmed_at is not None:
        raise MfaError("Two-step sign-in is already set up for this account.")
    secret = totp.new_secret()
    if credential is None:
        db.add(AdminMfaCredential(user_id=user.user_id, totp_secret=secret))
    else:
        credential.totp_secret = secret
        credential.last_used_step = None
    db.flush()
    return secret, totp.provisioning_uri(secret, user.email or str(user.user_id))


def _issue_recovery_codes(db: Session, user: User) -> list[str]:
    db.query(AdminRecoveryCode).filter(AdminRecoveryCode.user_id == user.user_id).delete(
        synchronize_session=False
    )
    codes = [_new_recovery_code() for _ in range(RECOVERY_CODE_COUNT)]
    for code in codes:
        db.add(AdminRecoveryCode(user_id=user.user_id, code_hash=_hash_recovery_code(code)))
    db.flush()
    return codes


def confirm_enrolment(db: Session, user: User, code: str) -> list[str]:
    """Confirm with a first correct code; returns the recovery codes, shown once."""
    credential = db.get(AdminMfaCredential, user.user_id)
    if credential is None:
        raise MfaError("Start set-up first.")
    if credential.confirmed_at is not None:
        raise MfaError("Two-step sign-in is already set up for this account.")
    step = totp.verify(credential.totp_secret, code, after_step=credential.last_used_step)
    if step is None:
        raise MfaError("That code did not match. Check the time on your phone and try the newest code.")
    credential.last_used_step = step
    credential.confirmed_at = datetime.now(UTC)
    return _issue_recovery_codes(db, user)


def verify_second_factor(db: Session, user: User, code: str) -> str | None:
    """'totp' or 'recovery' when `code` is a valid second factor, else None.

    A TOTP step is accepted once; a recovery code is spent on use.
    """
    credential = db.get(AdminMfaCredential, user.user_id)
    if credential is None or credential.confirmed_at is None:
        return None
    step = totp.verify(credential.totp_secret, code, after_step=credential.last_used_step)
    if step is not None:
        credential.last_used_step = step
        db.flush()
        return "totp"
    if len(_normalise_recovery_code(code)) == 10:
        row = (
            db.query(AdminRecoveryCode)
            .filter(
                AdminRecoveryCode.user_id == user.user_id,
                AdminRecoveryCode.code_hash == _hash_recovery_code(code),
                AdminRecoveryCode.used_at.is_(None),
            )
            .with_for_update()
            .first()
        )
        if row is not None:
            row.used_at = datetime.now(UTC)
            db.flush()
            return "recovery"
    return None


def remaining_recovery_codes(db: Session, user: User) -> int:
    return (
        db.query(AdminRecoveryCode)
        .filter(AdminRecoveryCode.user_id == user.user_id, AdminRecoveryCode.used_at.is_(None))
        .count()
    )


def regenerate_recovery_codes(db: Session, user: User) -> list[str]:
    """New set of ten; every old code stops working. Caller must hold elevation."""
    if not is_enrolled(db, user):
        raise MfaError("Two-step sign-in is not set up for this account.")
    return _issue_recovery_codes(db, user)


def reset_for(db: Session, target: User) -> bool:
    """Remove a target admin's second factor (lost phone, no recovery codes).

    They must enrol again before any admin route answers them. Owner action,
    elevated and audited at the route. True if there was anything to remove.
    """
    removed = db.query(AdminMfaCredential).filter(AdminMfaCredential.user_id == target.user_id).delete(
        synchronize_session=False
    )
    db.query(AdminRecoveryCode).filter(AdminRecoveryCode.user_id == target.user_id).delete(
        synchronize_session=False
    )
    db.flush()
    return bool(removed)

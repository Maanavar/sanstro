"""Admin role grants and the one-time owner seed (admin spec L3, D-14).

The one service that changes who is an admin. The route, the env seed and any
future tooling all come through here, so the guards below cannot be skipped by
taking a different path.
"""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.auth import ADMIN_ROLES, admin_role_of
from app.core.config import get_settings
from app.models.user import User
from app.services.audit_service import log_admin_action

logger = logging.getLogger(__name__)

#: Roles that may be granted today (D-14). The rest are defined, not assignable.
ASSIGNABLE_ROLES = frozenset({"owner", "support"})


class RoleChangeError(ValueError):
    """A role change the guards refuse."""


def _owner_count(db: Session) -> int:
    return db.query(User).filter((User.admin_role == "owner") | (User.is_admin.is_(True) & User.admin_role.is_(None))).count()


def _set_role(user: User, role: str | None) -> None:
    # `is_admin` kept in step so every older reader (analytics' "exclude admins"
    # filter, admin_role_of's fallback) agrees with the role.
    user.admin_role = role
    user.is_admin = role is not None


def grant_role(db: Session, *, target: User, role: str) -> str | None:
    """Give `target` an admin role. Returns the previous role.

    Only a verified account can hold a role: an unproven address is exactly what
    an attacker would register to receive one.
    """
    if role not in ADMIN_ROLES:
        raise RoleChangeError(f"Unknown role {role!r}.")
    if role not in ASSIGNABLE_ROLES:
        raise RoleChangeError(f"The {role} role is defined but not assignable yet.")
    if target.email_verified_at is None:
        raise RoleChangeError("That account has not verified its email address.")
    previous = admin_role_of(target)
    if previous == "owner" and role != "owner" and _owner_count(db) <= 1:
        raise RoleChangeError("This is the last owner. Make someone else owner first.")
    _set_role(target, role)
    db.flush()
    return previous


def revoke_role(db: Session, *, target: User) -> str | None:
    """Remove `target`'s admin role. Returns the role removed."""
    previous = admin_role_of(target)
    if previous is None:
        return None
    if previous == "owner" and _owner_count(db) <= 1:
        raise RoleChangeError("This is the last owner. Make someone else owner first.")
    _set_role(target, None)
    db.flush()
    return previous


def seed_owner_from_env(db: Session) -> User | None:
    """Make the first owner from JOTHIDAM_ADMIN_EMAILS, once, then do nothing.

    Runs at startup. Acts only when no owner exists yet, and only on an account
    that already exists and has verified its email — so the list can no longer
    hand the console to whoever registers a listed address first. In
    development an unverified account is accepted with a warning, because
    local accounts predate email verification.
    """
    if _owner_count(db) > 0:
        return None
    settings = get_settings()
    allow_unverified = settings.environment == "development"
    for email in sorted(settings.admin_email_set):
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            continue
        if user.email_verified_at is None and not allow_unverified:
            logger.warning("admin_seed_skipped_unverified email_domain=%s", email.split("@")[-1])
            continue
        _set_role(user, "owner")
        db.flush()
        logger.info("admin_seed_owner user_id=%s", user.user_id)
        log_admin_action(
            "seed_owner",
            target_type="user",
            target_id=str(user.user_id),
            payload_summary="first owner seeded from JOTHIDAM_ADMIN_EMAILS",
        )
        return user
    return None

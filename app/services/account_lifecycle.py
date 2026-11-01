"""What happens when an account is created or proves its email address.

One place, because there are three ways in (web register, mobile register,
Google sign-in) and every consequence — the verification email today, the
Premium trial (admin spec L1, decision 4) — must follow all three. A
consequence wired into one route and forgotten in another is the failure this
module exists to prevent.
"""
from __future__ import annotations

import logging

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.email_service import enqueue_verification_email
from app.services.email_verification_service import issue_verification_token, mark_verified

logger = logging.getLogger(__name__)


def on_email_verified(session: Session, user: User) -> None:
    """Runs exactly once per account, the first time its address is proven."""
    from app.services.entitlement_service import start_trial_if_eligible

    start_trial_if_eligible(session, user)


def on_account_created(
    session: Session,
    user: User,
    *,
    background_tasks: BackgroundTasks | None,
    email_verified_by_provider: bool,
) -> None:
    """After the new user row is flushed, inside the creating transaction.

    `email_verified_by_provider`: Google has already proven the address, so
    there is nothing to send and verification happens now.
    """
    if email_verified_by_provider:
        if mark_verified(user):
            on_email_verified(session, user)
        return
    if user.email and background_tasks is not None:
        enqueue_verification_email(background_tasks, user.email, issue_verification_token(user))


def verify_email(session: Session, user: User) -> bool:
    """Mark verified and run the consequences once. True if newly verified."""
    if not mark_verified(user):
        return False
    on_email_verified(session, user)
    return True

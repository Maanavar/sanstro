"""Entitlements: who has what access right now (admin spec L1, D-05, D-07).

The one service that writes `entitlements` rows. Reads live in
`app.core.entitlement_access`, which `app.core.subscription` uses to answer
`limits_for_user` and `/auth/me`; nothing else should query the table for
access decisions.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.entitlement_access import (
    PREMIUM,
    Access,
    AccessState,
    active_entitlements,
    entitlement_access,
)
from app.models.entitlement import Entitlement
from app.models.user import User

__all__ = [
    "PREMIUM",
    "TRIAL_LENGTH",
    "Access",
    "AccessState",
    "active_entitlements",
    "entitlement_access",
    "has_had_trial",
    "start_trial_if_eligible",
]

#: D-07: seven days of Premium from email verification.
TRIAL_LENGTH = timedelta(days=7)


def has_had_trial(session: Session, user_id: UUID) -> bool:
    return (
        session.query(Entitlement.id)
        .filter(Entitlement.user_id == user_id, Entitlement.source == "trial")
        .first()
        is not None
    )


def start_trial_if_eligible(session: Session, user: User, *, now: datetime | None = None) -> Entitlement | None:
    """Start the seven-day Premium trial, once per account. None if not eligible.

    Called from `account_lifecycle.on_email_verified`, so it runs on every way
    an address gets proven. Not eligible when:

    * the account already had a trial (the partial unique index enforces this
      too, so two concurrent verifications cannot both start one);
    * it already has Premium (a subscription, purchase or grant) — a trial
      would only be spent invisibly;
    * the open beta is on. The beta already gives Premium's features with a
      larger Ask allowance (7/day against the trial's 3), and a trial outranks
      the beta in `limits_for_user`, so starting one would cut a beta user's
      Ask allowance for a week and use up their trial. Beta accounts get the
      launch-day grant instead (ARC-12).
    """
    from app.core.subscription import is_premium, open_beta_active

    if open_beta_active():
        return None
    if has_had_trial(session, user.user_id):
        return None
    if is_premium(user.user_id, session) or entitlement_access(session, user.user_id, now=now).state == "premium":
        return None
    started = now or datetime.now(UTC)
    row = Entitlement(
        user_id=user.user_id,
        key=PREMIUM,
        source="trial",
        starts_at=started,
        ends_at=started + TRIAL_LENGTH,
    )
    try:
        with session.begin_nested():
            session.add(row)
            session.flush()
    except IntegrityError:
        # Lost a race with a concurrent verification: that one started it.
        return None
    return row

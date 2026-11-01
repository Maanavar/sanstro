"""Reading entitlements: who has what access right now (admin spec L1, D-05).

The read half of `app/services/entitlement_service.py`, which writes the rows.
It lives in `app/core` because `app.core.subscription` answers
`limits_for_user` and `/auth/me` from it, and core may not import services
(tests/test_dependency_direction.py).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.entitlement import Entitlement

PREMIUM = "premium"

AccessState = Literal["free", "trial", "premium"]


@dataclass(frozen=True)
class Access:
    state: AccessState
    #: When the trial ends; None unless state is "trial".
    trial_ends_at: datetime | None = None


def _active_filter(user_id: UUID, now: datetime) -> tuple:
    return (
        Entitlement.user_id == user_id,
        Entitlement.revoked_at.is_(None),
        Entitlement.starts_at <= now,
        or_(Entitlement.ends_at.is_(None), Entitlement.ends_at > now),
    )


def active_entitlements(session: Session, user_id: UUID, *, now: datetime | None = None) -> list[Entitlement]:
    """Unrevoked rows in force at `now`."""
    at = now or datetime.now(UTC)
    return session.query(Entitlement).filter(*_active_filter(user_id, at)).all()


def entitlement_access(session: Session, user_id: UUID, *, now: datetime | None = None) -> Access:
    """Access from entitlement rows alone (subscriptions are the caller's job).

    A purchase or grant of `premium` outranks a trial, so a trial user who is
    granted Premium sees "premium" at once, not at the trial's end.
    """
    premium_rows = [row for row in active_entitlements(session, user_id, now=now) if row.key == PREMIUM]
    if any(row.source != "trial" for row in premium_rows):
        return Access("premium")
    trials = [row for row in premium_rows if row.source == "trial"]
    if trials:
        return Access("trial", trial_ends_at=trials[0].ends_at)
    return Access("free")

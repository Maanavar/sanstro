"""Subscription helpers — single source of truth for premium status.

Premium is derived live from `app.models.subscription.Subscription`. We never add a
separate premium flag to the user model (see GROWTH_FEATURES.md key decision #8).
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.subscription import Subscription

# Tiers that do NOT grant premium access even when a row exists with status="active".
_NON_PREMIUM_TIERS = {"free", "none", "trial_expired", "cancelled"}


def is_premium(user_id: UUID, db: Session) -> bool:
    """Return True if the user currently holds an active, paid subscription."""
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id, Subscription.status == "active")
        .first()
    )
    if sub is None:
        return False
    return (sub.tier or "").strip().lower() not in _NON_PREMIUM_TIERS

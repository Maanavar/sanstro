"""Subscription helpers — single source of truth for premium status.

Premium is derived live from `app.models.subscription.Subscription`. We never add a
separate premium flag to the user model (see GROWTH_FEATURES.md key decision #8).
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.entitlement_access import Access, entitlement_access
from app.core.tier_limits import OPEN_BETA_LIMITS, TIER_LIMITS, TRIAL_LIMITS, TierLimits
from app.models.subscription import Subscription

# Tiers that do NOT grant premium access even when a row exists with status="active".
# "trial" is intentionally absent — an active trial row grants premium access.
# RevenueCat INITIAL_PURCHASE during a trial period stores tier="premium" (see webhooks.py),
# so "trial" as a stored value is unlikely, but it is treated as premium if it ever appears.
# "trial_expired" IS in the set — RevenueCat sends EXPIRATION at trial end if not converted.
_NON_PREMIUM_TIERS = {"free", "none", "trial_expired", "cancelled", ""}


def current_subscription_filter(user_id: UUID) -> tuple[Any, ...]:
    """WHERE clauses for "this user's subscription still grants access now".

    A row grants access while it is `active` and its paid period has not ended.
    `current_period_end` is NULL for rows with no known end (seeded, or a
    provider that sent none) — those stay valid, as before.

    The period end is what lets a cancellation be honoured correctly: turning off
    auto-renew (RevenueCat CANCELLATION) or a failed renewal inside the store's
    grace period (BILLING_ISSUE) does not end access — the period the user paid
    for runs out at `current_period_end`, and this filter stops granting premium
    then, even if the EXPIRATION webhook never arrives. One rule for every
    reader, so `/users/me/subscription` and the server's gates cannot disagree.

    Razorpay (spec L1 flow 2): while a renewal is being retried
    (`provider_status = 'pending'`) access continues past the period end;
    `halted` or `cancelled` then ends it, and the nightly reconciliation
    catches a pending state whose closing webhook never came.
    """
    return (
        Subscription.user_id == user_id,
        Subscription.status == "active",
        or_(
            Subscription.current_period_end.is_(None),
            Subscription.current_period_end > datetime.now(UTC),
            Subscription.provider_status == "pending",
        ),
    )


def is_premium(user_id: UUID, db: Session) -> bool:
    """Return True if the user currently holds an active, paid subscription."""
    sub = db.query(Subscription).filter(*current_subscription_filter(user_id)).first()
    if sub is None:
        return False
    return (sub.tier or "").strip().lower() not in _NON_PREMIUM_TIERS


def open_beta_active() -> bool:
    """Whether the open beta is on. The only reader of `settings.open_beta`."""
    return bool(get_settings().open_beta)


def access_for_user(user_id: UUID, db: Session) -> Access:
    """free / trial / premium for a signed-in account — what `/auth/me` reports.

    Premium is an active subscription (computed here, from `subscriptions`) or
    an active premium purchase or grant (`entitlements`). The open beta is not
    an access state: it lifts limits without making anyone premium, and
    `/auth/me` carries it separately as `openBeta`.
    """
    if is_premium(user_id, db):
        return Access("premium")
    return entitlement_access(db, user_id)


def limits_for_user(user_id: UUID, db: Session) -> TierLimits:
    """The limits a signed-in user is held to — every server-side cap reads this.

    First match wins: premium (subscription, purchase or grant), then the
    trial (TRIAL_LIMITS), then the open beta while it runs (OPEN_BETA_LIMITS),
    then registered. Kept apart from `is_premium`, which stays a fact about a
    subscription row: the beta unlocks limits, it does not make anyone a
    subscriber, so `/auth/me` keeps reporting the true tier and carries
    `openBeta` and `accessState` beside it.
    """
    state = access_for_user(user_id, db).state
    if state == "premium":
        return TIER_LIMITS["premium"]
    if state == "trial":
        return TRIAL_LIMITS
    if open_beta_active():
        return OPEN_BETA_LIMITS
    return TIER_LIMITS["registered"]

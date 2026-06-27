"""Ask Vinaadi chip-usage accounting — tier-aware.

Guest:      2 questions / day  (tracked client-side; backend enforces for authenticated calls)
Registered: 5 questions / day  (DB-backed, resets at local date boundary)
Premium:    30 questions / month (summed from daily rows, no schema change needed)
"""
from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.subscription import is_premium
from app.core.tier_limits import ask_vinaadi_limit_for_tier
from app.models.ask_vinaadi_usage import AskVinaadiUsage


def _tier(user_id: UUID, session: Session) -> str:
    return "premium" if is_premium(user_id, session) else "registered"


def _month_start() -> date:
    today = date.today()
    return today.replace(day=1)


def _get_usage(session: Session, user_id: UUID, on_date: date) -> AskVinaadiUsage | None:
    return (
        session.query(AskVinaadiUsage)
        .filter(AskVinaadiUsage.user_id == user_id, AskVinaadiUsage.usage_date == on_date)
        .first()
    )


def _get_monthly_count(session: Session, user_id: UUID) -> int:
    total = session.execute(
        select(func.sum(AskVinaadiUsage.chip_count)).where(
            AskVinaadiUsage.user_id == user_id,
            AskVinaadiUsage.usage_date >= _month_start(),
        )
    ).scalar_one()
    return int(total or 0)


def get_daily_status(session: Session, user_id: UUID) -> dict:
    """Return chip usage: {chipsUsed, chipsRemaining, isPremium, dailyLimit, monthlyLimit}."""
    tier = _tier(user_id, session)
    daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)

    if monthly_limit is not None:
        used = _get_monthly_count(session, user_id)
        return {
            "chipsUsed": used,
            "chipsRemaining": max(0, monthly_limit - used),
            "isPremium": True,
            "dailyLimit": None,
            "monthlyLimit": monthly_limit,
        }

    usage = _get_usage(session, user_id, date.today())
    used = usage.chip_count if usage else 0
    return {
        "chipsUsed": used,
        "chipsRemaining": max(0, (daily_limit or 0) - used),
        "isPremium": False,
        "dailyLimit": daily_limit,
        "monthlyLimit": None,
    }


def assert_chip_available(session: Session, user_id: UUID) -> None:
    """Raise 429 if the user has exhausted their quota (daily for registered, monthly for premium)."""
    tier = _tier(user_id, session)
    daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)

    if monthly_limit is not None:
        used = _get_monthly_count(session, user_id)
        if used >= monthly_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"error": "MONTHLY_LIMIT_REACHED", "chips_used": used, "monthly_limit": monthly_limit},
            )
        return

    usage = _get_usage(session, user_id, date.today())
    used = usage.chip_count if usage else 0
    if used >= (daily_limit or 0):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "DAILY_LIMIT_REACHED", "chips_used": used, "daily_limit": daily_limit},
        )


def consume_chip(session: Session, user_id: UUID) -> int | None:
    """Increment today's chip count. Returns chips remaining (None if top-up packs are in play)."""
    tier = _tier(user_id, session)
    daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)

    today = date.today()
    usage = _get_usage(session, user_id, today)
    if usage is None:
        usage = AskVinaadiUsage(id=uuid4(), user_id=user_id, usage_date=today, chip_count=0)
        session.add(usage)
    usage.chip_count += 1
    session.flush()

    if monthly_limit is not None:
        monthly_used = _get_monthly_count(session, user_id)
        return max(0, monthly_limit - monthly_used)

    return max(0, (daily_limit or 0) - usage.chip_count)

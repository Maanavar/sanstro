"""Ask Vinaadi Lite chip-usage accounting — Feature 3.

Free-tier users get FREE_DAILY_CHIPS questions per day (DB-backed, resets at the
local date boundary). Premium users are not limited here.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.subscription import is_premium
from app.models.ask_vinaadi_usage import AskVinaadiUsage

FREE_DAILY_CHIPS = 3


def _get_usage(session: Session, user_id: UUID, on_date: date) -> AskVinaadiUsage | None:
    return (
        session.query(AskVinaadiUsage)
        .filter(AskVinaadiUsage.user_id == user_id, AskVinaadiUsage.usage_date == on_date)
        .first()
    )


def get_daily_status(session: Session, user_id: UUID) -> dict:
    """Return chip usage for today: {chipsUsed, chipsRemaining, isPremium, dailyLimit}."""
    premium = is_premium(user_id, session)
    used = 0
    if not premium:
        usage = _get_usage(session, user_id, date.today())
        used = usage.chip_count if usage else 0
    return {
        "chipsUsed": used,
        "chipsRemaining": None if premium else max(0, FREE_DAILY_CHIPS - used),
        "isPremium": premium,
        "dailyLimit": FREE_DAILY_CHIPS,
    }


def assert_chip_available(session: Session, user_id: UUID) -> None:
    """Raise 429 if a free user has exhausted today's chips. No-op for premium."""
    if is_premium(user_id, session):
        return
    usage = _get_usage(session, user_id, date.today())
    used = usage.chip_count if usage else 0
    if used >= FREE_DAILY_CHIPS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "DAILY_LIMIT_REACHED", "chips_used": used},
        )


def consume_chip(session: Session, user_id: UUID) -> int | None:
    """Increment today's chip count for free users. Returns chips remaining (None=premium)."""
    if is_premium(user_id, session):
        return None
    today = date.today()
    usage = _get_usage(session, user_id, today)
    if usage is None:
        usage = AskVinaadiUsage(id=uuid4(), user_id=user_id, usage_date=today, chip_count=0)
        session.add(usage)
    usage.chip_count += 1
    session.flush()
    return max(0, FREE_DAILY_CHIPS - usage.chip_count)

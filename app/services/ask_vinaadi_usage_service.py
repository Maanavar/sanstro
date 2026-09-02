"""Ask Vinaadi chip-usage accounting — tier-aware.

Guest:      2 questions / day  (tracked client-side; backend enforces for authenticated calls)
Registered: 5 questions / day  (DB-backed, resets at local date boundary)
Premium:    30 questions / month (summed from daily rows, no schema change needed)
"""
from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
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
    """Increment today's chip count. Returns chips remaining.

    Superseded by `reserve_chip`, which is what the endpoint now calls: this
    counts *after* the fact and so cannot stop two concurrent questions both
    being allowed. Kept because it is still a correct "spend one chip"
    primitive and is used by tests, but the read-modify-write it used to do
    (`usage.chip_count += 1`) is gone — that lost updates under concurrency, so
    two answers advanced the counter by one. The increment is now done by the
    database.
    """
    tier = _tier(user_id, session)
    daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)
    today = date.today()

    _ensure_today_row(session, user_id, today)
    session.execute(
        update(AskVinaadiUsage)
        .where(
            AskVinaadiUsage.user_id == user_id,
            AskVinaadiUsage.usage_date == today,
        )
        .values(chip_count=AskVinaadiUsage.chip_count + 1)
    )
    session.flush()

    if monthly_limit is not None:
        return max(0, monthly_limit - _get_monthly_count(session, user_id))

    usage = _get_usage(session, user_id, today)
    if usage is not None:
        session.refresh(usage)
    return max(0, (daily_limit or 0) - (usage.chip_count if usage else 0))


def _ensure_today_row(session: Session, user_id: UUID, today: date) -> None:
    """Make sure today's row exists, without racing a concurrent request.

    Two first-questions-of-the-day arriving together would both find no row and
    both INSERT, and the second would fail on uq_ask_vinaadi_usage_user_date.
    ON CONFLICT DO NOTHING makes that a no-op instead of a 500.
    """
    session.execute(
        pg_insert(AskVinaadiUsage)
        .values(id=uuid4(), user_id=user_id, usage_date=today, chip_count=0)
        .on_conflict_do_nothing(constraint="uq_ask_vinaadi_usage_user_date")
    )


def reserve_chip(session: Session, user_id: UUID) -> int | None:
    """Claim one chip BEFORE the provider call. Raises 429 if none is left.

    Replaces the old check-then-act pair (assert_chip_available … answer …
    consume_chip), which had two separate races, both reproduced against
    Postgres:

    1. Both requests read `chip_count` before either wrote, so both passed the
       limit check at limit-1 and both went on to call the provider. The user
       got two answers on one remaining chip and we paid for two API calls.
    2. `usage.chip_count += 1` is a read-modify-write in Python, not an atomic
       increment, so the second write clobbered the first. Two answers, and the
       counter advanced by one — the quota under-counted its own spending.

    `UPDATE … SET chip_count = chip_count + 1 WHERE chip_count < :limit` does
    the test and the increment in one statement, and its rowcount is the
    verdict. The reservation is taken up front so a concurrent request sees it,
    and `refund_chip` gives it back if the answer never arrives.
    """
    tier = _tier(user_id, session)
    daily_limit, monthly_limit = ask_vinaadi_limit_for_tier(tier)
    today = date.today()

    _ensure_today_row(session, user_id, today)

    if monthly_limit is not None:
        # The premium limit spans rows, so it cannot be expressed as a predicate
        # on the row being updated. Take today's chip atomically first, then
        # settle the month against a count that already includes this request —
        # erring toward refusing one question too early rather than allowing one
        # too many, which is the direction a quota should fail in.
        session.execute(
            update(AskVinaadiUsage)
            .where(
                AskVinaadiUsage.user_id == user_id,
                AskVinaadiUsage.usage_date == today,
            )
            .values(chip_count=AskVinaadiUsage.chip_count + 1)
        )
        session.flush()
        monthly_used = _get_monthly_count(session, user_id)
        if monthly_used > monthly_limit:
            refund_chip(session, user_id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "MONTHLY_LIMIT_REACHED",
                    "chips_used": monthly_used - 1,
                    "monthly_limit": monthly_limit,
                },
            )
        return max(0, monthly_limit - monthly_used)

    limit = daily_limit or 0
    reserved = session.execute(
        update(AskVinaadiUsage)
        .where(
            AskVinaadiUsage.user_id == user_id,
            AskVinaadiUsage.usage_date == today,
            AskVinaadiUsage.chip_count < limit,
        )
        .values(chip_count=AskVinaadiUsage.chip_count + 1)
    ).rowcount
    session.flush()

    if reserved == 0:
        usage = _get_usage(session, user_id, today)
        used = usage.chip_count if usage else limit
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "DAILY_LIMIT_REACHED", "chips_used": used, "daily_limit": daily_limit},
        )

    usage = _get_usage(session, user_id, today)
    if usage is None:
        # The UPDATE above matched a row (reserved != 0), so the row is there.
        # Stated rather than assumed: if the reserve query is ever rewritten to
        # insert-on-miss, this fails with its own name instead of inside
        # session.refresh(None).
        raise RuntimeError("Chip reserved but no usage row to read back.")
    session.refresh(usage)
    return max(0, limit - usage.chip_count)


def refund_chip(session: Session, user_id: UUID) -> None:
    """Give back a reservation whose answer never arrived.

    Charging for a question the user did not receive is the failure mode that
    reserving up front introduces, so it has to be paid back explicitly. The
    `chip_count > 0` guard keeps a double refund from driving the count
    negative and handing out free questions.
    """
    session.execute(
        update(AskVinaadiUsage)
        .where(
            AskVinaadiUsage.user_id == user_id,
            AskVinaadiUsage.usage_date == date.today(),
            AskVinaadiUsage.chip_count > 0,
        )
        .values(chip_count=AskVinaadiUsage.chip_count - 1)
    )
    session.flush()

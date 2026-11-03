"""Ask Vinaadi chip-usage accounting — tier-aware.

The daily allowance is a setting per rung of the `limits_for_user` ladder
(`ask_daily_limit_<state>` in feature_flags, spec L7 / ARC-07), whose defaults
are the app/core/tier_limits.py constants. A tier with a monthly allowance (none
today) still takes it from tier_limits.

Daily caps are DB-backed and reset at the local date boundary; the monthly cap
is summed from the same daily rows, so it needs no schema of its own. Once the
allowance is spent, a bought question credit (the Ask top-up) is spent instead.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Literal
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.clock import (
    SYSTEM_CLOCK,
    Clock,
    accounting_date,
    accounting_month_start,
    next_accounting_day_start,
    next_accounting_month_start,
)
from app.core.subscription import is_premium, limits_for_state, limits_state_for_user, open_beta_active
from app.core.tier_limits import ask_vinaadi_limits
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.services.feature_flags import get_flag
from app.services.payment_service import credit_balance, return_credit, spend_credit

#: The credit key the Ask top-up grants (`products.credit_grants`).
ASK_CREDIT_KEY = "ask_question"


def _limits(user_id: UUID, session: Session) -> tuple[int | None, int | None]:
    state = limits_state_for_user(user_id, session)
    _, monthly_limit = ask_vinaadi_limits(limits_for_state(state))
    if monthly_limit is not None:
        return None, monthly_limit
    return int(get_flag(f"ask_daily_limit_{state}")), None


def _quota_day(*, clock: Clock = SYSTEM_CLOCK) -> date:
    return accounting_date(clock=clock)


def _month_start(*, clock: Clock = SYSTEM_CLOCK) -> date:
    return accounting_month_start(clock=clock)


def _get_usage(session: Session, user_id: UUID, on_date: date) -> AskVinaadiUsage | None:
    return (
        session.query(AskVinaadiUsage)
        .filter(AskVinaadiUsage.user_id == user_id, AskVinaadiUsage.usage_date == on_date)
        .first()
    )


def _get_monthly_count(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> int:
    total = session.execute(
        select(func.sum(AskVinaadiUsage.chip_count)).where(
            AskVinaadiUsage.user_id == user_id,
            AskVinaadiUsage.usage_date >= _month_start(clock=clock),
        )
    ).scalar_one()
    return int(total or 0)


def _wire_instant(value: datetime) -> str:
    """The UTC instant as the response model serialises it ("…Z"), so the
    model passes the dict through unchanged (test_a14_response_contracts)."""
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def get_daily_status(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> dict:
    """Return chip usage: {chipsUsed, chipsRemaining, isPremium, openBeta, dailyLimit, monthlyLimit, resetsAt}.

    `isPremium` is the subscription fact. `openBeta` tells the client that a
    spent daily allowance is a fair-use cap to wait out, not a paywall — so it
    must not offer an upgrade. `resetsAt` is the UTC instant the allowance
    refills, so a client can name the reader's local time instead of
    "tomorrow".
    """
    premium = is_premium(user_id, session)
    open_beta = open_beta_active() and not premium
    daily_limit, monthly_limit = _limits(user_id, session)

    if monthly_limit is not None:
        used = _get_monthly_count(session, user_id, clock=clock)
        return {
            "chipsUsed": used,
            "chipsRemaining": max(0, monthly_limit - used),
            "isPremium": premium,
            "openBeta": open_beta,
            "dailyLimit": None,
            "monthlyLimit": monthly_limit,
            "resetsAt": _wire_instant(next_accounting_month_start(clock=clock)),
        }

    usage = _get_usage(session, user_id, _quota_day(clock=clock))
    used = usage.chip_count if usage else 0
    return {
        "chipsUsed": used,
        "chipsRemaining": max(0, (daily_limit or 0) - used),
        "isPremium": premium,
        "openBeta": open_beta,
        "dailyLimit": daily_limit,
        "monthlyLimit": None,
        "resetsAt": _wire_instant(next_accounting_day_start(clock=clock)),
    }


def assert_chip_available(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> None:
    """Raise 429 if the user has exhausted their quota (daily for registered, monthly for premium)."""
    daily_limit, monthly_limit = _limits(user_id, session)

    if monthly_limit is not None:
        used = _get_monthly_count(session, user_id, clock=clock)
        if used >= monthly_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"error": "MONTHLY_LIMIT_REACHED", "chips_used": used, "monthly_limit": monthly_limit},
            )
        return

    usage = _get_usage(session, user_id, _quota_day(clock=clock))
    used = usage.chip_count if usage else 0
    if used >= (daily_limit or 0):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "DAILY_LIMIT_REACHED", "chips_used": used, "daily_limit": daily_limit},
        )


def consume_chip(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> int | None:
    """Increment today's chip count. Returns chips remaining.

    Superseded by `reserve_chip`, which is what the endpoint now calls: this
    counts *after* the fact and so cannot stop two concurrent questions both
    being allowed. Kept because it is still a correct "spend one chip"
    primitive and is used by tests, but the read-modify-write it used to do
    (`usage.chip_count += 1`) is gone — that lost updates under concurrency, so
    two answers advanced the counter by one. The increment is now done by the
    database.
    """
    daily_limit, monthly_limit = _limits(user_id, session)
    today = _quota_day(clock=clock)

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
        return max(0, monthly_limit - _get_monthly_count(session, user_id, clock=clock))

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


def reserve_chip(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> int | None:
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
    daily_limit, monthly_limit = _limits(user_id, session)
    today = _quota_day(clock=clock)

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
        monthly_used = _get_monthly_count(session, user_id, clock=clock)
        if monthly_used > monthly_limit:
            refund_chip(session, user_id, clock=clock)
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


def refund_chip(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> None:
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
            AskVinaadiUsage.usage_date == _quota_day(clock=clock),
            AskVinaadiUsage.chip_count > 0,
        )
        .values(chip_count=AskVinaadiUsage.chip_count - 1)
    )
    session.flush()


# ── One question: the allowance first, then a bought credit ──────────────────


@dataclass(frozen=True)
class AskReservation:
    """What paid for one question, so `release_question` can give back the same thing."""

    source: Literal["allowance", "credit"]
    #: Allowance left after this question (0 when a credit paid).
    chips_remaining: int | None
    #: Ledger key of the spent credit; None for the allowance.
    credit_spend_key: str | None = None


def reserve_question(
    session: Session,
    user_id: UUID,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> AskReservation:
    """Claim the right to one question BEFORE the provider call.

    The day's allowance goes first (`reserve_chip`). When it is spent, one
    bought question credit is taken instead; with neither, the allowance's own
    429 stands, so a client sees the same refusal it always has.

    Concurrent questions from one account would both read a balance of 1 and
    both spend it. The balance is read under a lock on the account's usage row
    for today (which `reserve_chip` has just made sure exists), so the second
    request waits for the first to commit and then reads 0.
    """
    try:
        return AskReservation("allowance", reserve_chip(session, user_id, clock=clock))
    except HTTPException as exc:
        if exc.status_code != status.HTTP_429_TOO_MANY_REQUESTS:
            raise
        session.execute(
            select(AskVinaadiUsage.id)
            .where(AskVinaadiUsage.user_id == user_id, AskVinaadiUsage.usage_date == _quota_day(clock=clock))
            .with_for_update()
        )
        if credit_balance(session, user_id, ASK_CREDIT_KEY) <= 0:
            raise
        key = spend_credit(session, user_id=user_id, credit_key=ASK_CREDIT_KEY, source_id=f"ask:{uuid4()}")
        session.flush()
        return AskReservation("credit", 0, key)


def release_question(
    session: Session,
    user_id: UUID,
    reservation: AskReservation,
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> None:
    """Give back what paid for a question whose answer never arrived."""
    if reservation.credit_spend_key is not None:
        return_credit(
            session, user_id=user_id, credit_key=ASK_CREDIT_KEY, spend_key=reservation.credit_spend_key
        )
        session.flush()
        return
    refund_chip(session, user_id, clock=clock)

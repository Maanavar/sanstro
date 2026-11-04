"""Ask Vinaadi cost metering and the daily spend cap (admin spec L7).

Every provider call leaves one `ask_vinaadi_calls` row with its tokens and
cost, answered or not, written in a session of its own: the request's session
rolls back when the answer fails, and a call we paid for must still count
against the cap.

The cap is checked before the provider is called. Once a day's recorded cost
reaches `ask_daily_spend_cap_paise`, no further call is made that day. Calls
already in flight when the cap is crossed still finish, so the overshoot is at
most one answer per concurrent request (about ₹2 each at today's prices).

Owners are emailed once per day at 80% and once at 100%; `ask_spend_alerts`
remembers which went, so a busy afternoon sends two emails, not hundreds.
"""
from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_CEILING, Decimal
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.clock import SYSTEM_CLOCK, Clock, accounting_date
from app.core.error_codes import BilingualMessage, ErrorCode
from app.core.errors import AppError
from app.db.session import SessionLocal
from app.models.ask_vinaadi_call import AskSpendAlert, AskVinaadiCall
from app.models.user import User
from app.services.email_service import EmailMessage, send_email
from app.services.feature_flags import get_flag

logger = logging.getLogger("jothidam.ask_vinaadi.metering")


@dataclass(frozen=True)
class ModelPrice:
    """US dollars per million tokens (Anthropic first-party list price)."""

    input_usd: Decimal
    output_usd: Decimal

    # Prompt-cache multipliers on the input price: writes 1.25x, reads 0.1x.
    @property
    def cache_write_usd(self) -> Decimal:
        return self.input_usd * Decimal("1.25")

    @property
    def cache_read_usd(self) -> Decimal:
        return self.input_usd * Decimal("0.1")


#: A model missing here cannot be metered, so `cost_paise` refuses it rather
#: than calling it free; tests/test_ask_rails.py pins that the model Ask calls
#: is listed.
MODEL_PRICES: dict[str, ModelPrice] = {
    "claude-sonnet-4-6": ModelPrice(input_usd=Decimal("3"), output_usd=Decimal("15")),
}

#: Owner alert thresholds, percent of the day's cap.
ALERT_THRESHOLDS: tuple[int, ...] = (80, 100)

#: The refusal at the cap. Not the user's own quota, so not DAILY_LIMIT_REACHED
#: (which clients answer with an upgrade offer): nothing they can buy helps.
CAP_REACHED_MESSAGE: BilingualMessage = {
    "ta": "இன்றைக்கு விநாடி பதில் சொல்லக்கூடிய கேள்விகள் முடிந்துவிட்டன. நாளை மீண்டும் வாருங்கள்.",
    "en": "Vinaadi has answered all the questions it can for today. Please come back tomorrow.",
}


@dataclass(frozen=True)
class CallUsage:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


def _count(value: Any) -> int:
    # Only a real int is a token count: the SDK reports None for an absent cache
    # figure, and a mocked message reports MagicMock for everything.
    return value if isinstance(value, int) and not isinstance(value, bool) and value > 0 else 0


def usage_from_message(message: Any) -> CallUsage:
    usage = getattr(message, "usage", None)
    if usage is None:
        return CallUsage()
    return CallUsage(
        input_tokens=_count(getattr(usage, "input_tokens", 0)),
        output_tokens=_count(getattr(usage, "output_tokens", 0)),
        cache_read_tokens=_count(getattr(usage, "cache_read_input_tokens", 0)),
        cache_write_tokens=_count(getattr(usage, "cache_creation_input_tokens", 0)),
    )


def cost_paise(model: str, usage: CallUsage, *, usd_inr_paise: int) -> int:
    """What one call cost, in paise, rounded up."""
    price = MODEL_PRICES[model]
    usd = (
        usage.input_tokens * price.input_usd
        + usage.output_tokens * price.output_usd
        + usage.cache_write_tokens * price.cache_write_usd
        + usage.cache_read_tokens * price.cache_read_usd
    ) / Decimal(1_000_000)
    return int((usd * usd_inr_paise).to_integral_value(rounding=ROUND_CEILING))


def spent_paise(session: Session, day: date) -> int:
    total = session.execute(
        select(func.coalesce(func.sum(AskVinaadiCall.cost_paise), 0)).where(AskVinaadiCall.spend_date == day)
    ).scalar_one()
    return int(total or 0)


def daily_cap_paise() -> int:
    return int(get_flag("ask_daily_spend_cap_paise"))


def spend_cap_reached(session: Session, *, clock: Clock = SYSTEM_CLOCK) -> bool:
    """Has today's spend reached the cap? The same test `assert_spend_headroom`
    applies, read without raising or alerting, so the daily status can tell a
    reader Ask is paused before they type (audit U4, 2026-11-03)."""
    return spent_paise(session, accounting_date(clock=clock)) >= daily_cap_paise()


def assert_spend_headroom(session: Session, *, clock: Clock = SYSTEM_CLOCK) -> None:
    """503 with "come back tomorrow" once today's spend has reached the cap."""
    day = accounting_date(clock=clock)
    cap = daily_cap_paise()
    spent = spent_paise(session, day)
    if spent < cap:
        return
    _alert_if_crossed(day, spent, cap)
    raise AppError(
        ErrorCode.SERVICE_UNAVAILABLE,
        message=CAP_REACHED_MESSAGE,
        detail=CAP_REACHED_MESSAGE["en"],
    )


def record_call(
    *,
    model: str,
    prompt_version: str,
    usage: CallUsage,
    latency_ms: int,
    outcome: str,
    flags: tuple[str, ...],
    clock: Clock = SYSTEM_CLOCK,
) -> None:
    """Write one call's row and alert owners if it crossed a threshold.

    A failure here is logged, not raised: the person already has (or has
    already lost) their answer, and an error now would only hide that.
    """
    day = accounting_date(clock=clock)
    try:
        cost = cost_paise(model, usage, usd_inr_paise=int(get_flag("ask_usd_inr_paise")))
        with SessionLocal() as session, session.begin():
            session.add(
                AskVinaadiCall(
                    spend_date=day,
                    prompt_version=prompt_version,
                    model=model,
                    input_tokens=usage.input_tokens,
                    output_tokens=usage.output_tokens,
                    cache_read_tokens=usage.cache_read_tokens,
                    cache_write_tokens=usage.cache_write_tokens,
                    cost_paise=cost,
                    latency_ms=max(0, latency_ms),
                    outcome=outcome,
                    flags=list(flags),
                )
            )
            session.flush()
            spent = spent_paise(session, day)
        _alert_if_crossed(day, spent, daily_cap_paise())
    except Exception:  # noqa: BLE001 — metering must never fail the request it measures
        logger.exception("ask_call_metering_failed outcome=%s model=%s", outcome, model)


# ── Owner alerts ─────────────────────────────────────────────────────────────


def _alert_if_crossed(day: date, spent: int, cap: int) -> None:
    """Alert the highest threshold crossed. A day that hits the cap without
    having passed 80% first (a lowered cap) gets one email saying so, not two."""
    crossed = [pct for pct in ALERT_THRESHOLDS if spent * 100 >= cap * pct]
    if crossed:
        _claim_and_send(day, max(crossed), spent, cap)


def _owner_emails(session: Session) -> list[str]:
    rows = session.execute(
        select(User.email).where(
            or_(User.admin_role == "owner", User.is_admin.is_(True) & User.admin_role.is_(None)),
            User.email.is_not(None),
        )
    ).scalars()
    return sorted({email for email in rows if email})


def _rupees(paise: int) -> str:
    return f"₹{Decimal(paise) / 100:,.2f}"


def _alert_message(to: str, day: date, pct: int, spent: int, cap: int) -> EmailMessage:
    headline = (
        "Ask Vinaadi has reached today's spend cap and is pausing until tomorrow."
        if pct >= 100
        else f"Ask Vinaadi has used {pct}% of today's spend cap."
    )
    body = (
        f"{headline}\n\n"
        f"Day (IST): {day.isoformat()}\n"
        f"Spent: {_rupees(spent)} of {_rupees(cap)}\n\n"
        "To change the cap, edit the setting ask_daily_spend_cap_paise in the admin console "
        "(Settings), with a reason. To stop Ask now, turn off enable_ask_vinaadi."
    )
    return EmailMessage(to_address=to, subject=f"[Vinaadi] Ask spend at {pct}% of today's cap", body_text=body)


def dispatch_owner_alert(messages: list[EmailMessage]) -> None:
    """Send off the request thread: SMTP retries take seconds, and the person
    whose question crossed the line should not wait for them."""
    if not messages:
        return

    def _send() -> None:
        for message in messages:
            send_email(message)

    threading.Thread(target=_send, name="ask-spend-alert", daemon=True).start()


def _claim_and_send(day: date, pct: int, spent: int, cap: int) -> None:
    with SessionLocal() as session, session.begin():
        claimed = session.execute(
            pg_insert(AskSpendAlert)
            .values(spend_date=day, threshold_pct=pct, spent_paise=spent, cap_paise=cap)
            .on_conflict_do_nothing(index_elements=["spend_date", "threshold_pct"])
        ).rowcount
        owners = _owner_emails(session) if claimed else []
    if not claimed:
        return
    logger.warning("ask_spend_threshold day=%s pct=%s spent_paise=%s cap_paise=%s", day, pct, spent, cap)
    if not owners:
        logger.error("ask_spend_threshold_no_owner day=%s pct=%s: no owner account to email", day, pct)
    dispatch_owner_alert([_alert_message(to, day, pct, spent, cap) for to in owners])

"""Named infrastructure clock policies and injectable wall-clock access.

Astrology dates remain explicit inputs to calculation functions. This module
is for infrastructure time: account quotas, notification scheduling/expiry and
cache freshness/invalidation.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from typing import Protocol, runtime_checkable
from zoneinfo import ZoneInfo


@runtime_checkable
class Clock(Protocol):
    def now_utc(self) -> datetime: ...


class SystemClock:
    def now_utc(self) -> datetime:
        return datetime.now(UTC)


SYSTEM_CLOCK: Clock = SystemClock()

# Account quotas are commercial/account state, not an astrology calculation or
# a device-location feature. Vinaadi uses this stable business timezone so a
# trip, current-location edit or DST transition cannot create a second quota
# day/month. There is no account-timezone column to anchor a different stable
# choice today; silently borrowing a mutable birth/current profile would make
# quota identity depend on which profile was edited.
ACCOUNTING_TIMEZONE_NAME = "Asia/Kolkata"


def utc_now(*, clock: Clock = SYSTEM_CLOCK) -> datetime:
    """Return an aware UTC instant and reject malformed injected clocks."""
    value = clock.now_utc()
    if value.tzinfo is None:
        raise ValueError("Clock.now_utc() must return a timezone-aware datetime")
    return value.astimezone(UTC)


def local_date(timezone_name: str, *, clock: Clock = SYSTEM_CLOCK) -> date:
    """Civil date at the clock instant in one explicit IANA timezone."""
    return utc_now(clock=clock).astimezone(ZoneInfo(timezone_name)).date()


def accounting_date(*, clock: Clock = SYSTEM_CLOCK) -> date:
    """Current Vinaadi quota day under the stable account-time policy."""
    return local_date(ACCOUNTING_TIMEZONE_NAME, clock=clock)


def accounting_month_start(*, clock: Clock = SYSTEM_CLOCK) -> date:
    return accounting_date(clock=clock).replace(day=1)


def _accounting_midnight_utc(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=ZoneInfo(ACCOUNTING_TIMEZONE_NAME)).astimezone(UTC)


def next_accounting_day_start(*, clock: Clock = SYSTEM_CLOCK) -> datetime:
    """UTC instant the next quota day begins.

    Clients show this in the reader's own timezone. "Tomorrow" is only true in
    Kolkata: a New York reader's quota day turns over mid-afternoon.
    """
    return _accounting_midnight_utc(accounting_date(clock=clock) + timedelta(days=1))


def next_accounting_month_start(*, clock: Clock = SYSTEM_CLOCK) -> datetime:
    """UTC instant the next quota month begins."""
    start = accounting_month_start(clock=clock)
    if start.month == 12:
        return _accounting_midnight_utc(date(start.year + 1, 1, 1))
    return _accounting_midnight_utc(date(start.year, start.month + 1, 1))


def earliest_local_date(
    timezone_names: tuple[str, ...],
    *,
    clock: Clock = SYSTEM_CLOCK,
) -> date:
    """Earliest civil date across old/new locations at one instant.

    Location-dependent cache invalidation uses the earlier date so travelling
    across the date line cannot leave a stale row addressable in either place.
    """
    if not timezone_names:
        raise ValueError("at least one timezone is required")
    return min(local_date(name, clock=clock) for name in timezone_names)

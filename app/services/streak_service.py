"""Server-side daily activity streak.

The streak counts consecutive days on which a signed-in user opened the app.
Day boundaries are computed in Asia/Kolkata (the app-wide convention) so the
count is deterministic regardless of client timezone.

The client may send an optional ``localDays`` seed with a ping; it is honored
only when the user has no server row yet, so a pre-existing localStorage
streak survives the move to server persistence. The value is cosmetic —
there are no streak rewards.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models import UserStreak
from app.schemas.dasha import ResponseMeta
from app.schemas.streak import StreakData, StreakResponse

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"
_IST = ZoneInfo("Asia/Kolkata")


def _meta() -> ResponseMeta:
    return ResponseMeta(calculation_version=_CALC_VERSION, generated_at=datetime.now(tz=UTC))


def _ist_today() -> date:
    return datetime.now(tz=UTC).astimezone(_IST).date()


def _to_data(streak: UserStreak | None, today: date) -> StreakData:
    if streak is None:
        return StreakData(days=0, longestDays=0, lastActiveDate=None)
    broken = streak.last_active_date < today - timedelta(days=1)
    return StreakData(
        days=0 if broken else streak.current_days,
        longestDays=streak.longest_days,
        lastActiveDate=streak.last_active_date,
    )


def get_streak(session: Session, user_id: UUID, today: date | None = None) -> StreakResponse:
    """Current streak without recording activity — a stale row reads as 0."""
    today = today or _ist_today()
    return StreakResponse(data=_to_data(session.get(UserStreak, user_id), today), meta=_meta())


def record_ping(
    session: Session,
    user_id: UUID,
    local_days: int | None = None,
    today: date | None = None,
) -> StreakResponse:
    """Record activity for today and return the updated streak. Idempotent per day."""
    today = today or _ist_today()
    streak = session.get(UserStreak, user_id)

    if streak is None:
        seed = local_days or 1
        streak = UserStreak(
            user_id=user_id,
            current_days=seed,
            longest_days=seed,
            last_active_date=today,
        )
        session.add(streak)
        session.flush()
    elif streak.last_active_date != today:
        if streak.last_active_date == today - timedelta(days=1):
            streak.current_days += 1
        else:
            streak.current_days = 1
        streak.last_active_date = today
        streak.longest_days = max(streak.longest_days, streak.current_days)

    return StreakResponse(data=_to_data(streak, today), meta=_meta())

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Any, Literal

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day

# Ask again if the location has not been confirmed in this long. Owner ruling
# R2 (2026-09-22): 45 days, and it is the **backstop**, not the main path — the
# device-timezone mismatch prompt is what catches an actual move. Server-side so
# web and mobile share one cadence, the same reason LIFE_MODE_STALE_DAYS is.
#
# "Confirmed" includes keeping the existing place: a reader who answers "Keep
# Chennai" has told us as much as one who changes it, so the stamp moves on both
# answers. Without that, declining the prompt would leave it due forever.
LOCATION_CHECK_DUE_DAYS = 45


@dataclass(frozen=True, slots=True)
class EffectiveDailyLocation:
    place: str
    latitude: float
    longitude: float
    timezone: str
    source: Literal["current", "birth"]


def _value(profile: Any, field: str, default: Any = None) -> Any:
    if isinstance(profile, dict):
        return profile.get(field, default)
    return getattr(profile, field, default)


def _is_complete(latitude: Any, longitude: Any, timezone: Any) -> bool:
    return latitude is not None and longitude is not None and bool(timezone)


def _has_complete_current_location(profile: Any) -> bool:
    return _is_complete(
        _value(profile, "current_latitude"),
        _value(profile, "current_longitude"),
        _value(profile, "current_timezone"),
    )


def _has_complete_birth_location(profile: Any) -> bool:
    return _is_complete(
        _value(profile, "birth_latitude"),
        _value(profile, "birth_longitude"),
        _value(profile, "birth_timezone"),
    )


def resolve_effective_daily_location(profile: Any) -> EffectiveDailyLocation:
    if _has_complete_current_location(profile):
        return EffectiveDailyLocation(
            place=str(_value(profile, "current_place") or _value(profile, "birth_place") or ""),
            latitude=float(_value(profile, "current_latitude")),
            longitude=float(_value(profile, "current_longitude")),
            timezone=str(_value(profile, "current_timezone")),
            source="current",
        )
    return EffectiveDailyLocation(
        place=str(_value(profile, "birth_place") or ""),
        latitude=float(_value(profile, "birth_latitude")),
        longitude=float(_value(profile, "birth_longitude")),
        timezone=str(_value(profile, "birth_timezone")),
        source="birth",
    )


def resolve_effective_daily_location_or_none(profile: Any) -> EffectiveDailyLocation | None:
    """`resolve_effective_daily_location`, but None rather than a TypeError when
    no usable location exists.

    The resolver proper assumes a birth location is present, which holds for any
    profile that finished onboarding — it calls `float()` on the birth
    coordinates unconditionally. A surface that renders for a partial profile
    needs the third answer instead of an exception, and must not re-derive the
    current-vs-birth rule to get it.
    """
    if _has_complete_current_location(profile) or _has_complete_birth_location(profile):
        return resolve_effective_daily_location(profile)
    return None


def is_location_check_due(
    confirmed_at: datetime | None,
    *,
    now: datetime | None = None,
) -> bool:
    """Whether the backstop strip is owed a reader.

    A profile that has never confirmed a current location is due immediately:
    `current_location_updated_at` is null for everyone who has only ever had a
    birth location, and those are exactly the readers whose timings are most
    likely to be for a place they left.
    """
    if confirmed_at is None:
        return True
    if confirmed_at.tzinfo is None:
        confirmed_at = confirmed_at.replace(tzinfo=UTC)
    now = now or datetime.now(tz=UTC)
    return now - confirmed_at >= timedelta(days=LOCATION_CHECK_DUE_DAYS)


def resolve_effective_daily_timezone(profile: Any) -> str:
    return resolve_effective_daily_location(profile).timezone


def local_noon_as_utc_for_profile(on_date: date, profile: Any) -> datetime:
    local_noon = datetime.combine(on_date, time(12, 0))
    return local_datetime_to_utc(local_noon, resolve_effective_daily_timezone(profile))


def local_midnight_as_jd_for_profile(on_date: date, profile: Any) -> float:
    local_midnight = datetime.combine(on_date, time.min)
    midnight_utc = local_datetime_to_utc(local_midnight, resolve_effective_daily_timezone(profile))
    return utc_datetime_to_julian_day(midnight_utc)

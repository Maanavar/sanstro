from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Any, Literal

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day


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


def _has_complete_current_location(profile: Any) -> bool:
    return (
        _value(profile, "current_latitude") is not None
        and _value(profile, "current_longitude") is not None
        and bool(_value(profile, "current_timezone"))
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


def resolve_effective_daily_timezone(profile: Any) -> str:
    return resolve_effective_daily_location(profile).timezone


def local_noon_as_utc_for_profile(on_date: date, profile: Any) -> datetime:
    local_noon = datetime.combine(on_date, time(12, 0))
    return local_datetime_to_utc(local_noon, resolve_effective_daily_timezone(profile))


def local_midnight_as_jd_for_profile(on_date: date, profile: Any) -> float:
    local_midnight = datetime.combine(on_date, time.min)
    midnight_utc = local_datetime_to_utc(local_midnight, resolve_effective_daily_timezone(profile))
    return utc_datetime_to_julian_day(midnight_utc)

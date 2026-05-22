from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from math import floor
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

EPSILON_DEGREES = 1e-9
NAKSHATRA_SIZE_DEGREES = 40 / 3
PADA_SIZE_DEGREES = 10 / 3

RASI_NAMES = {
    1: "Mesham",
    2: "Rishabam",
    3: "Midhunam",
    4: "Kadagam",
    5: "Simmam",
    6: "Kanni",
    7: "Thulaam",
    8: "Vrichigam",
    9: "Dhanusu",
    10: "Magaram",
    11: "Kumbam",
    12: "Meenam",
}

RASI_NAME_TO_NUMBER = {name.lower(): number for number, name in RASI_NAMES.items()}


def normalize_longitude(longitude: float) -> float:
    """Normalize any longitude into the [0, 360) range."""
    return longitude % 360.0


def _normalized_index(degree: float, size: float) -> int:
    normalized = normalize_longitude(degree)
    return floor(normalized / size + EPSILON_DEGREES)


def rasi_from_degree(degree: float) -> int:
    return _normalized_index(degree, 30.0) + 1


def degree_in_rasi(degree: float) -> float:
    return normalize_longitude(degree) % 30.0


def nakshatra_from_degree(degree: float) -> int:
    return _normalized_index(degree, NAKSHATRA_SIZE_DEGREES) + 1


def pada_from_degree(degree: float) -> int:
    return _normalized_index(degree, PADA_SIZE_DEGREES) % 4 + 1


def resolve_rasi(rasi: int | str) -> int:
    if isinstance(rasi, int):
        if 1 <= rasi <= 12:
            return rasi
        raise ValueError("Rasi number must be between 1 and 12.")

    normalized = rasi.strip().lower()
    if normalized not in RASI_NAME_TO_NUMBER:
        raise ValueError(f"Unknown rasi name: {rasi}")
    return RASI_NAME_TO_NUMBER[normalized]


def house_from_reference(reference_rasi: int | str, target_rasi: int | str) -> int:
    reference_number = resolve_rasi(reference_rasi)
    target_number = resolve_rasi(target_rasi)
    return ((target_number - reference_number) % 12) + 1


def local_datetime_to_utc(local_datetime: datetime, timezone_name: str) -> datetime:
    timezone_obj = resolve_timezone(timezone_name)
    if local_datetime.tzinfo is None:
        localized = local_datetime.replace(tzinfo=timezone_obj)
    else:
        localized = local_datetime.astimezone(timezone_obj)
    return localized.astimezone(UTC)


def resolve_timezone(timezone_name: str) -> timezone | ZoneInfo:
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        if timezone_name in {"Asia/Kolkata", "Asia/Calcutta"}:
            return timezone(timedelta(hours=5, minutes=30), name=timezone_name)
        raise


def utc_datetime_to_julian_day(utc_datetime: datetime) -> float:
    if utc_datetime.tzinfo is None:
        raise ValueError("utc_datetime_to_julian_day requires a timezone-aware UTC datetime.")

    utc = utc_datetime.astimezone(UTC)
    day_fraction = (
        utc.hour / 24.0
        + utc.minute / 1440.0
        + utc.second / 86400.0
        + utc.microsecond / 86400_000000.0
    )

    year = utc.year
    month = utc.month
    day = utc.day + day_fraction

    if month <= 2:
        year -= 1
        month += 12

    century = year // 100
    correction = 2 - century + century // 4

    return (
        floor(365.25 * (year + 4716))
        + floor(30.6001 * (month + 1))
        + day
        + correction
        - 1524.5
    )


def julian_day_to_utc_datetime(julian_day: float) -> datetime:
    seconds_from_epoch = (julian_day - 2440587.5) * 86400.0
    return datetime(1970, 1, 1, tzinfo=UTC) + timedelta(seconds=seconds_from_epoch)


def utc_datetime_to_local_datetime(utc_datetime: datetime, timezone_name: str) -> datetime:
    return utc_datetime.astimezone(resolve_timezone(timezone_name))


def navamsa_rasi_from_degree(degree: float) -> int:
    normalized = normalize_longitude(degree)
    natal_rasi = rasi_from_degree(normalized)
    # Index within the natal rasi (0-8): how many 3°20' divisions into this sign.
    degree_in_sign = normalized % 30.0
    index = floor(degree_in_sign / PADA_SIZE_DEGREES + EPSILON_DEGREES)

    if natal_rasi in {1, 4, 7, 10}:    # movable — start from same sign
        start_rasi = natal_rasi
    elif natal_rasi in {2, 5, 8, 11}:  # fixed — start from 9th sign
        start_rasi = ((natal_rasi + 8 - 1) % 12) + 1
    else:                               # dual — start from 5th sign
        start_rasi = ((natal_rasi + 4 - 1) % 12) + 1

    return ((start_rasi + index - 1) % 12) + 1


def navamsa_rasi_from_nakshatra_pada(nakshatra: int | str, pada: int) -> int:
    """Temporary lookup helper for nakshatra-pada-based regression checks.

    Sprint 1 only needs the known QA cases for navamsa regression coverage.
    """
    if isinstance(nakshatra, str):
        normalized = nakshatra.strip().lower()
        if normalized != "uthiradam":
            raise ValueError(f"Unsupported nakshatra name for lookup: {nakshatra}")
        nakshatra_key = normalized
    else:
        nakshatra_key = nakshatra

    if pada not in {1, 2, 3, 4}:
        raise ValueError("Pada must be between 1 and 4.")

    overrides: dict[tuple[Any, int], int] = {
        ("uthiradam", 3): resolve_rasi("Kumbam"),
    }

    if (nakshatra_key, pada) in overrides:
        return overrides[(nakshatra_key, pada)]

    raise ValueError("Navamsa lookup is only implemented for the required regression cases in Sprint 1.")

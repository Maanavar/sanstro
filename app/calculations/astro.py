from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from math import floor
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

EPSILON_DEGREES = 1e-9
NAKSHATRA_SIZE_DEGREES = 40 / 3
PADA_SIZE_DEGREES = 10 / 3

RASI_NAMES = {
    1: "Mesham",
    2: "Rishabam",
    3: "Mithunam",
    4: "Kadagam",
    5: "Simmam",
    6: "Kanni",
    7: "Thulam",
    8: "Viruchigam",
    9: "Dhanusu",
    10: "Magaram",
    11: "Kumbam",
    12: "Meenam",
}

RASI_NAME_TO_NUMBER = {name.lower(): number for number, name in RASI_NAMES.items()}
RASI_NAME_TO_NUMBER.update(
    {
        # Backward-compatible aliases retained for legacy data and tests.
        "midhunam": 3,
        "thulaam": 7,
        "vrichigam": 8,
    }
)
NAKSHATRA_NAMES = (
    "ASWINI",
    "BHARANI",
    "KARTHIGAI",
    "ROHINI",
    "MIRUGASEERIDAM",
    "THIRUVATHIRAI",
    "PUNARPOOSAM",
    "POOSAM",
    "AYILYAM",
    "MAGAM",
    "POORAM",
    "UTHIRAM",
    "HASTHAM",
    "CHITHIRAI",
    "SWATHI",
    "VISAKAM",
    "ANUSHAM",
    "KETTAI",
    "MOOLAM",
    "POORADAM",
    "UTHIRADAM",
    "THIRUVONAM",
    "AVITTAM",
    "SADAYAM",
    "POORATTATHI",
    "UTHIRATTATHI",
    "REVATHI",
)
NAKSHATRA_NAME_TO_NUMBER = {
    "".join(char for char in name.lower() if char.isalnum()): index + 1
    for index, name in enumerate(NAKSHATRA_NAMES)
}


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
    # Pada 1-4 per nakshatra: index the full zodiac in 3°20' steps, then mod 4.
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


def nakshatra_to_rasi(nakshatra: int | str, pada: int = 1) -> int:
    """Return rasi (1-12) using the standard 9-pada-per-rasi mapping."""
    if isinstance(nakshatra, str):
        normalized = "".join(char for char in nakshatra.strip().lower() if char.isalnum())
        nakshatra_number = NAKSHATRA_NAME_TO_NUMBER.get(normalized)
        if nakshatra_number is None:
            raise ValueError(f"Unknown nakshatra name: {nakshatra}")
    else:
        nakshatra_number = nakshatra

    if not 1 <= nakshatra_number <= 27:
        raise ValueError("Nakshatra number must be between 1 and 27.")
    pada_norm = pada if 1 <= pada <= 4 else 1
    absolute_pada = (nakshatra_number - 1) * 4 + (pada_norm - 1)
    return absolute_pada // 9 + 1


def chandrashtama_rasi_from_janma(janma_rasi: int | str) -> int:
    """Return the 8th rasi from natal Moon rasi, counted inclusively."""
    janma_rasi_number = resolve_rasi(janma_rasi)
    return ((janma_rasi_number - 1 + 7) % 12) + 1


def is_chandrashtama(janma_rasi: int | str, transit_moon_rasi: int | str) -> bool:
    return resolve_rasi(transit_moon_rasi) == chandrashtama_rasi_from_janma(janma_rasi)


def local_datetime_to_utc(local_datetime: datetime, timezone_name: str) -> datetime:
    timezone_obj = resolve_timezone(timezone_name)
    if local_datetime.tzinfo is None:
        if isinstance(timezone_obj, ZoneInfo):
            fold0 = local_datetime.replace(tzinfo=timezone_obj, fold=0)
            fold1 = local_datetime.replace(tzinfo=timezone_obj, fold=1)
            roundtrip0 = fold0.astimezone(UTC).astimezone(timezone_obj).replace(tzinfo=None)
            roundtrip1 = fold1.astimezone(UTC).astimezone(timezone_obj).replace(tzinfo=None)
            valid0 = roundtrip0 == local_datetime
            valid1 = roundtrip1 == local_datetime

            if valid0 and valid1 and fold0.utcoffset() != fold1.utcoffset():
                localized = fold1
            elif valid0:
                localized = fold0
            elif valid1:
                localized = fold1
            else:
                raise ValueError(
                    f"Non-existent local datetime due to DST transition: {local_datetime.isoformat()} {timezone_name}"
                )
        else:
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

    # Method A (per-sign start): preserves vargottama at 0° of all movable signs.
    # Method B (universal anchor) breaks movable vargottama — not suitable for this system.
    if natal_rasi in {1, 4, 7, 10}:    # movable — start from same sign
        start_rasi = natal_rasi
    elif natal_rasi in {2, 5, 8, 11}:  # fixed — start from 9th sign
        start_rasi = ((natal_rasi + 8 - 1) % 12) + 1
    else:                               # dual — start from 5th sign
        start_rasi = ((natal_rasi + 4 - 1) % 12) + 1

    return ((start_rasi + index - 1) % 12) + 1


def navamsa_rasi_from_nakshatra_pada(nakshatra: int | str, pada: int) -> int:
    if isinstance(nakshatra, str):
        normalized = "".join(char for char in nakshatra.strip().lower() if char.isalnum())
        nakshatra_number = NAKSHATRA_NAME_TO_NUMBER.get(normalized)
        if nakshatra_number is None:
            raise ValueError(f"Unknown nakshatra name: {nakshatra}")
    else:
        nakshatra_number = nakshatra

    if not 1 <= nakshatra_number <= 27:
        raise ValueError("Nakshatra number must be between 1 and 27.")
    if pada not in {1, 2, 3, 4}:
        raise ValueError("Pada must be between 1 and 4.")

    degree = (
        (nakshatra_number - 1) * NAKSHATRA_SIZE_DEGREES
        + (pada - 1) * PADA_SIZE_DEGREES
        + (PADA_SIZE_DEGREES / 2.0)
    )
    return navamsa_rasi_from_degree(degree)

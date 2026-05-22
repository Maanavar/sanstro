from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from math import ceil, floor

from app.calculations.astro import (
    julian_day_to_utc_datetime,
    local_datetime_to_utc,
    normalize_longitude,
    resolve_timezone,
    utc_datetime_to_julian_day,
    utc_datetime_to_local_datetime,
)
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sidereal_planets

TITHI_NAMES = [
    "PRATIPADA",
    "DWITIYA",
    "TRITIYA",
    "CHATURTHI",
    "PANCHAMI",
    "SHASHTHI",
    "SAPTAMI",
    "ASHTAMI",
    "NAVAMI",
    "DASHAMI",
    "EKADASHI",
    "DWADASHI",
    "TRAYODASHI",
    "CHATURDASHI",
    "POURNAMI",
]

NAKSHATRA_NAMES = [
    "ASHWINI",
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
]

YOGA_NAMES = [
    "VISHKAMBHA",
    "PRITI",
    "AYUSHMAN",
    "SAUBHAGYA",
    "SHOBHANA",
    "ATIGANDA",
    "SUKARMA",
    "DHRITI",
    "SHOOLA",
    "GANDA",
    "VRIDDHI",
    "DHRUVA",
    "VYAGHATA",
    "HARSHANA",
    "VAJRA",
    "SIDDHI",
    "VYATIPATA",
    "VARIYANA",
    "PARIGHA",
    "SHIVA",
    "SIDDHA",
    "SADHYA",
    "SHUBHA",
    "SHUKLA",
    "BRAHMA",
    "INDRA",
    "VAIDHRITI",
]

MOVABLE_KARANAS = [
    "BAVA",
    "BALAVA",
    "KAULAVA",
    "TAITILA",
    "GARAJA",
    "VANIJA",
    "VISHTI",
]

WEEKDAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
WEEKDAY_LORDS = {
    0: "MOON",
    1: "MARS",
    2: "MERCURY",
    3: "GURU",
    4: "VENUS",
    5: "SATURN",
    6: "SUN",
}

RAHU_SLOT = {6: 8, 0: 2, 1: 7, 2: 5, 3: 6, 4: 4, 5: 3}
YAMA_SLOT = {6: 5, 0: 4, 1: 3, 2: 2, 3: 1, 4: 7, 5: 6}
KULIGAI_SLOT = {6: 3, 0: 1, 1: 6, 2: 4, 3: 7, 4: 5, 5: 2}


@dataclass(frozen=True, slots=True)
class PanchangamSlot:
    start: datetime
    end: datetime
    slot: int


@dataclass(frozen=True, slots=True)
class PanchangamHoraEntry:
    index: int
    lord: str
    start: datetime
    end: datetime


@dataclass(frozen=True, slots=True)
class PanchangamSnapshot:
    date_local: date
    timezone_name: str
    latitude: float
    longitude: float
    sunrise: datetime
    sunset: datetime
    solar_noon: datetime
    weekday: str
    weekday_lord: str
    tithi_number: int
    tithi_name: str
    tithi_paksha: str
    tithi_ends_at: datetime
    nakshatra_number: int
    nakshatra_name: str
    nakshatra_pada: int
    nakshatra_ends_at: datetime
    yoga_number: int
    yoga_name: str
    karana_name: str
    rahu_kalam: PanchangamSlot
    yamagandam: PanchangamSlot
    kuligai: PanchangamSlot
    abhijit_start: datetime
    abhijit_end: datetime
    abhijit_restricted: bool
    hora: list[PanchangamHoraEntry]
    warnings: tuple[str, ...] = ()


def _format_hhmm(moment: datetime) -> str:
    return moment.strftime("%H:%M")


def _angle_continuous(angle_fn, jd_start: float, jd: float, base_angle: float) -> float:
    angle = normalize_longitude(angle_fn(jd))
    if angle < base_angle - 180.0:
        angle += 360.0
    return angle


def _find_next_boundary_jd(start_jd: float, angle_fn, step_degrees: float) -> float:
    base_angle = normalize_longitude(angle_fn(start_jd))
    current_index = int((base_angle + 1e-9) // step_degrees) + 1
    target_angle = current_index * step_degrees
    if target_angle > 360.0:
        target_angle = 360.0

    lo = start_jd
    hi = start_jd + 1 / 24
    while hi - lo <= 4.0:
        hi_angle = _angle_continuous(angle_fn, start_jd, hi, base_angle)
        if hi_angle >= target_angle:
            break
        hi += 1 / 24
    else:
        return hi

    for _ in range(64):
        mid = (lo + hi) / 2
        mid_angle = _angle_continuous(angle_fn, start_jd, mid, base_angle)
        if mid_angle >= target_angle:
            hi = mid
        else:
            lo = mid
    return hi


def _tithi_name(number: int) -> str:
    if number == 30:
        return "AMAVASAI"
    return TITHI_NAMES[(number - 1) % 15]


def _yoga_name(number: int) -> str:
    return YOGA_NAMES[(number - 1) % 27]


def _karana_name(index: int) -> str:
    if index == 0:
        return "KIMSTUGHNA"
    if 1 <= index <= 56:
        return MOVABLE_KARANAS[(index - 1) % 7]
    return {57: "SHAKUNI", 58: "CHATUSHPADA", 59: "NAGA"}[index]


def _weekday_lord_and_name(day: date) -> tuple[str, str]:
    weekday_index = day.weekday()
    return WEEKDAY_NAMES[weekday_index], WEEKDAY_LORDS[weekday_index]


def _slot_datetime(start: datetime, duration: timedelta, slot_number: int) -> PanchangamSlot:
    slot_start = start + duration * (slot_number - 1)
    slot_end = slot_start + duration
    return PanchangamSlot(start=slot_start, end=slot_end, slot=slot_number)


def _make_hora_entries(sunrise: datetime, sunset: datetime, next_sunrise: datetime, weekday_lord: str) -> list[PanchangamHoraEntry]:
    sequence = ["SUN", "VENUS", "MERCURY", "MOON", "SATURN", "GURU", "MARS"]
    first_index = sequence.index(weekday_lord)

    day_duration = (sunset - sunrise) / 12
    night_duration = (next_sunrise - sunset) / 12

    entries: list[PanchangamHoraEntry] = []
    for i in range(12):
        start = sunrise + day_duration * i
        end = start + day_duration
        entries.append(
            PanchangamHoraEntry(
                index=i + 1,
                lord=sequence[(first_index + i) % 7],
                start=start,
                end=end,
            )
        )

    for i in range(12):
        start = sunset + night_duration * i
        end = start + night_duration
        entries.append(
            PanchangamHoraEntry(
                index=i + 13,
                lord=sequence[(first_index + 12 + i) % 7],
                start=start,
                end=end,
            )
        )

    return entries


def _calculate_positions_at_sunrise(jd_ut: float) -> tuple[float, float, tuple[str, ...]]:
    snapshot = calculate_sidereal_planets(jd_ut)
    return (
        snapshot.bodies["SUN"].absolute_longitude,
        snapshot.bodies["MOON"].absolute_longitude,
        snapshot.source_warnings,
    )


def calculate_daily_panchangam(date_local: date, latitude: float, longitude: float, timezone_name: str) -> PanchangamSnapshot:
    timezone_obj = resolve_timezone(timezone_name)
    local_midnight = datetime.combine(date_local, datetime.min.time(), tzinfo=timezone_obj)
    jd_start = utc_datetime_to_julian_day(local_midnight.astimezone(UTC))

    sunrise_jd = calculate_rise_transit_jd(jd_start, latitude, longitude, rise=True)
    sunset_jd = calculate_rise_transit_jd(jd_start, latitude, longitude, rise=False)
    next_sunrise_jd = calculate_rise_transit_jd(
        utc_datetime_to_julian_day((local_midnight + timedelta(days=1)).astimezone(UTC)),
        latitude,
        longitude,
        rise=True,
    )

    sunrise = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(sunrise_jd), timezone_name)
    sunset = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(sunset_jd), timezone_name)
    next_sunrise = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(next_sunrise_jd), timezone_name)
    solar_noon = sunrise + (sunset - sunrise) / 2

    sun_longitude, moon_longitude, warnings = _calculate_positions_at_sunrise(sunrise_jd)
    diff = normalize_longitude(moon_longitude - sun_longitude)

    tithi_number = int((diff + 1e-9) // 12) + 1
    tithi_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, lambda jd: normalize_longitude(_calculate_positions_at_sunrise(jd)[1] - _calculate_positions_at_sunrise(jd)[0]), 12.0)),
        timezone_name,
    )

    nakshatra_number = int((moon_longitude + 1e-9) // (40 / 3)) + 1
    nakshatra_pada = int(((moon_longitude % (40 / 3)) + 1e-9) // (10 / 3)) + 1
    nakshatra_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, lambda jd: _calculate_positions_at_sunrise(jd)[1], 40 / 3)),
        timezone_name,
    )

    yoga_number = int((normalize_longitude(sun_longitude + moon_longitude) + 1e-9) // (40 / 3)) + 1

    karana_index = int((diff + 1e-9) // 6)

    weekday_name, weekday_lord = _weekday_lord_and_name(date_local)
    rahu_slot = RAHU_SLOT[date_local.weekday()]
    yama_slot = YAMA_SLOT[date_local.weekday()]
    kuligai_slot = KULIGAI_SLOT[date_local.weekday()]

    day_duration = sunset - sunrise
    slot_duration = day_duration / 8
    rahu = _slot_datetime(sunrise, slot_duration, rahu_slot)
    yama = _slot_datetime(sunrise, slot_duration, yama_slot)
    kuligai = _slot_datetime(sunrise, slot_duration, kuligai_slot)

    abhijit_start = solar_noon - timedelta(minutes=24)
    abhijit_end = solar_noon + timedelta(minutes=24)

    hora_entries = _make_hora_entries(sunrise, sunset, next_sunrise, weekday_lord)

    return PanchangamSnapshot(
        date_local=date_local,
        timezone_name=timezone_name,
        latitude=latitude,
        longitude=longitude,
        sunrise=sunrise,
        sunset=sunset,
        solar_noon=solar_noon,
        weekday=weekday_name,
        weekday_lord=weekday_lord,
        tithi_number=tithi_number,
        tithi_name=_tithi_name(tithi_number),
        tithi_paksha="SHUKLA" if tithi_number <= 15 else "KRISHNA",
        tithi_ends_at=tithi_ends_at,
        nakshatra_number=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        nakshatra_pada=nakshatra_pada,
        nakshatra_ends_at=nakshatra_ends_at,
        yoga_number=yoga_number,
        yoga_name=_yoga_name(yoga_number),
        karana_name=_karana_name(karana_index),
        rahu_kalam=rahu,
        yamagandam=yama,
        kuligai=kuligai,
        abhijit_start=abhijit_start,
        abhijit_end=abhijit_end,
        abhijit_restricted=date_local.weekday() == 2,
        hora=hora_entries,
        warnings=warnings,
    )

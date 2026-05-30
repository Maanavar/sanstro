from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from math import ceil, floor

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.astro import (
    julian_day_to_utc_datetime,
    local_datetime_to_utc,
    normalize_longitude,
    resolve_timezone,
    utc_datetime_to_julian_day,
    utc_datetime_to_local_datetime,
)
from app.calculations.ephemeris import calculate_rise_transit_jd, calculate_sidereal_planets
from app.models.panchangam_cache import PanchangamCache

# Tamil tithi names (Thirukanitham tradition — numbered 1 to 15, same for both pakshas)
TITHI_NAMES = [
    "PRATHAMA",     # 1 — பிரதமை
    "DVITHIYAI",    # 2 — துவிதியை
    "THRITHIYAI",   # 3 — திரிதியை
    "CHATHURTHI",   # 4 — சதுர்த்தி
    "PANCHAMI",     # 5 — பஞ்சமி
    "SHASHTI",      # 6 — சஷ்டி
    "SAPTAMI",      # 7 — சப்தமி
    "ASHTAMI",      # 8 — அஷ்டமி
    "NAVAMI",       # 9 — நவமி
    "DASAMI",       # 10 — தசமி
    "EKADASI",      # 11 — ஏகாதசி
    "DVADASI",      # 12 — துவாதசி
    "THRAYODASI",   # 13 — திரயோதசி
    "CHATHURDASI",  # 14 — சதுர்தசி
    "POURNAMI",     # 15 (Shukla) / AMAVASAI (Krishna) — handled by paksha logic
]

NAKSHATRA_NAMES = [
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
# Kuligai (Gulika) daytime slots by Python weekday index (Mon=0..Sun=6).
# Traditional order is Sun=7, Mon=6, Tue=5, Wed=4, Thu=3, Fri=2, Sat=1.
KULIGAI_SLOT = {6: 7, 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1}
# Mandhi (Maandi) upagraha daytime slots by Python weekday (Mon=0..Sun=6).
# Traditional Tamil Panchangam: Sun=7, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6.
MANDHI_SLOT = {6: 7, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
# Nalla Neram: 2 auspicious slots per day, same 8-slot grid as Rahu/Yama/Kuligai.
# Traditional Tamil Panchangam values (Sun=6, Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5).
NALLA_NERAM_SLOTS = {6: (2, 5), 0: (1, 6), 1: (3, 8), 2: (4, 7), 3: (1, 6), 4: (2, 5), 5: (3, 8)}

# Gowri Nalla Neram: 3 auspicious slots per day on the same 8-slot grid.
# Traditional assignment by day (each slot is ~1.5 hr window).
GOWRI_NALLA_NERAM_SLOTS = {
    6: (1, 4, 7),   # Sun
    0: (2, 5, 8),   # Mon
    1: (1, 4, 7),   # Tue
    2: (3, 6,),     # Wed (only 2 for Wednesday in tradition)
    3: (2, 5, 8),   # Thu
    4: (1, 4, 7),   # Fri
    5: (3, 6, 8),   # Sat
}

# Subha (auspicious) yoga names per Thirukanitha tradition
SUBHA_YOGAS = {"SIDDHA", "AMRITA", "SHUBHA", "VARIYAAN", "HARSHANA", "BRAHMA", "INDRA", "VAIDHRITI"}
ASHUBHA_YOGAS = {"VYAGHATA", "GANDA", "SHOOLA", "ATIGANDA", "VYATIPATA", "PARIGHA"}

# Auspicious tithis for muhurtham (Shukla paksha 2,3,5,6,7,10,11,12,13; Krishna 2,3,6,7,10,11)
SUBHA_TITHIS_SHUKLA = {2, 3, 5, 6, 7, 10, 11, 12, 13}
SUBHA_TITHIS_KRISHNA = {2, 3, 6, 7, 10, 11}

# Auspicious nakshatras for muhurtham (Thirukanitha list)
SUBHA_NAKSHATRAS = {
    "ASHWINI", "ROHINI", "MRIGASHIRA", "PUNARVASU", "PUSHYA", "HASTA",
    "CHITRA", "SWATI", "ANURADHA", "MULA", "UTTARASHADA", "UTTARABHADRA",
    "REVATI", "MAGHA", "UTTARAPHALGUNI", "SHRAVANA", "DHANISHTHA",
}
PANCHANGAM_CACHE_TTL_HOURS = 24
DEFAULT_AYANAMSA_TYPE = "LAHIRI"
PANCHANGAM_CACHE_DATA_VERSION = 5


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
    mandhi: PanchangamSlot
    nalla_neram: list[PanchangamSlot]
    gowri_nalla_neram: list[PanchangamSlot]
    abhijit_start: datetime
    abhijit_end: datetime
    abhijit_restricted: bool
    is_subha_muhurtham: bool
    subha_muhurtham_reason: str
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


def _compute_nalla_neram(
    sunrise: datetime,
    sunset: datetime,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """Nalla Neram: 2 slots per day on the same 8-slot daylight grid as Rahu/Yama/Kuligai."""
    dur = (sunset - sunrise) / 8
    return [_slot_datetime(sunrise, dur, s) for s in NALLA_NERAM_SLOTS[weekday_index]]


def _compute_gowri_nalla_neram(
    sunrise: datetime,
    sunset: datetime,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """Gowri Nalla Neram: 2–3 slots per day on the same 8-slot daylight grid."""
    dur = (sunset - sunrise) / 8
    return [_slot_datetime(sunrise, dur, s) for s in GOWRI_NALLA_NERAM_SLOTS[weekday_index]]


def _compute_subha_muhurtham(
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    yoga_name: str,
    weekday_index: int,
    abhijit_restricted: bool,
) -> tuple[bool, str]:
    """Determine if today is a Subha Muhurtham day per Thirukanitha Panchangam."""
    reasons: list[str] = []
    inauspicious: list[str] = []

    if yoga_name in ASHUBHA_YOGAS:
        inauspicious.append(f"{yoga_name} yoga")
    elif yoga_name in SUBHA_YOGAS:
        reasons.append(f"{yoga_name} yoga")

    if tithi_paksha == "SHUKLA" and tithi_number in SUBHA_TITHIS_SHUKLA:
        reasons.append("auspicious tithi")
    elif tithi_paksha == "KRISHNA" and tithi_number in SUBHA_TITHIS_KRISHNA:
        reasons.append("auspicious tithi")
    else:
        inauspicious.append("inauspicious tithi")

    if nakshatra_name in SUBHA_NAKSHATRAS:
        reasons.append("auspicious nakshatra")
    else:
        inauspicious.append("inauspicious nakshatra")

    # Amavasai (30), Chaturdashi (14/29) and Ashtami (8/23) are always inauspicious
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15
    if tithi_in_paksha in {8, 14} or tithi_number == 30:
        inauspicious.append("Rahu tithi / Amavasai")

    is_subha = len(inauspicious) == 0 and len(reasons) >= 2
    if is_subha:
        reason = "Auspicious: " + ", ".join(reasons)
    elif inauspicious:
        reason = "Inauspicious: " + ", ".join(inauspicious)
    else:
        reason = "Neutral day"
    return is_subha, reason


def _calculate_positions_at_sunrise(jd_ut: float) -> tuple[float, float, tuple[str, ...]]:
    snapshot = calculate_sidereal_planets(jd_ut)
    return (
        snapshot.bodies["SUN"].absolute_longitude,
        snapshot.bodies["MOON"].absolute_longitude,
        snapshot.source_warnings,
    )


def _serialize_snapshot(snapshot: PanchangamSnapshot) -> dict:
    return {
        "schema_version": PANCHANGAM_CACHE_DATA_VERSION,
        "date_local": snapshot.date_local.isoformat(),
        "timezone_name": snapshot.timezone_name,
        "latitude": snapshot.latitude,
        "longitude": snapshot.longitude,
        "sunrise": snapshot.sunrise.isoformat(),
        "sunset": snapshot.sunset.isoformat(),
        "solar_noon": snapshot.solar_noon.isoformat(),
        "weekday": snapshot.weekday,
        "weekday_lord": snapshot.weekday_lord,
        "tithi_number": snapshot.tithi_number,
        "tithi_name": snapshot.tithi_name,
        "tithi_paksha": snapshot.tithi_paksha,
        "tithi_ends_at": snapshot.tithi_ends_at.isoformat(),
        "nakshatra_number": snapshot.nakshatra_number,
        "nakshatra_name": snapshot.nakshatra_name,
        "nakshatra_pada": snapshot.nakshatra_pada,
        "nakshatra_ends_at": snapshot.nakshatra_ends_at.isoformat(),
        "yoga_number": snapshot.yoga_number,
        "yoga_name": snapshot.yoga_name,
        "karana_name": snapshot.karana_name,
        "rahu_kalam": {
            "start": snapshot.rahu_kalam.start.isoformat(),
            "end": snapshot.rahu_kalam.end.isoformat(),
            "slot": snapshot.rahu_kalam.slot,
        },
        "yamagandam": {
            "start": snapshot.yamagandam.start.isoformat(),
            "end": snapshot.yamagandam.end.isoformat(),
            "slot": snapshot.yamagandam.slot,
        },
        "kuligai": {
            "start": snapshot.kuligai.start.isoformat(),
            "end": snapshot.kuligai.end.isoformat(),
            "slot": snapshot.kuligai.slot,
        },
        "mandhi": {
            "start": snapshot.mandhi.start.isoformat(),
            "end": snapshot.mandhi.end.isoformat(),
            "slot": snapshot.mandhi.slot,
        },
        "nalla_neram": [
            {"start": w.start.isoformat(), "end": w.end.isoformat(), "slot": w.slot}
            for w in snapshot.nalla_neram
        ],
        "gowri_nalla_neram": [
            {"start": w.start.isoformat(), "end": w.end.isoformat(), "slot": w.slot}
            for w in snapshot.gowri_nalla_neram
        ],
        "is_subha_muhurtham": snapshot.is_subha_muhurtham,
        "subha_muhurtham_reason": snapshot.subha_muhurtham_reason,
        "abhijit_start": snapshot.abhijit_start.isoformat(),
        "abhijit_end": snapshot.abhijit_end.isoformat(),
        "abhijit_restricted": snapshot.abhijit_restricted,
        "hora": [
            {
                "index": entry.index,
                "lord": entry.lord,
                "start": entry.start.isoformat(),
                "end": entry.end.isoformat(),
            }
            for entry in snapshot.hora
        ],
        "warnings": list(snapshot.warnings),
    }


def _deserialize_snapshot(data: dict) -> PanchangamSnapshot:
    return PanchangamSnapshot(
        date_local=date.fromisoformat(data["date_local"]),
        timezone_name=str(data["timezone_name"]),
        latitude=float(data["latitude"]),
        longitude=float(data["longitude"]),
        sunrise=datetime.fromisoformat(data["sunrise"]),
        sunset=datetime.fromisoformat(data["sunset"]),
        solar_noon=datetime.fromisoformat(data["solar_noon"]),
        weekday=str(data["weekday"]),
        weekday_lord=str(data["weekday_lord"]),
        tithi_number=int(data["tithi_number"]),
        tithi_name=str(data["tithi_name"]),
        tithi_paksha=str(data["tithi_paksha"]),
        tithi_ends_at=datetime.fromisoformat(data["tithi_ends_at"]),
        nakshatra_number=int(data["nakshatra_number"]),
        nakshatra_name=str(data["nakshatra_name"]),
        nakshatra_pada=int(data["nakshatra_pada"]),
        nakshatra_ends_at=datetime.fromisoformat(data["nakshatra_ends_at"]),
        yoga_number=int(data["yoga_number"]),
        yoga_name=str(data["yoga_name"]),
        karana_name=str(data["karana_name"]),
        rahu_kalam=PanchangamSlot(
            start=datetime.fromisoformat(data["rahu_kalam"]["start"]),
            end=datetime.fromisoformat(data["rahu_kalam"]["end"]),
            slot=int(data["rahu_kalam"]["slot"]),
        ),
        yamagandam=PanchangamSlot(
            start=datetime.fromisoformat(data["yamagandam"]["start"]),
            end=datetime.fromisoformat(data["yamagandam"]["end"]),
            slot=int(data["yamagandam"]["slot"]),
        ),
        kuligai=PanchangamSlot(
            start=datetime.fromisoformat(data["kuligai"]["start"]),
            end=datetime.fromisoformat(data["kuligai"]["end"]),
            slot=int(data["kuligai"]["slot"]),
        ),
        mandhi=PanchangamSlot(
            start=datetime.fromisoformat(data["mandhi"]["start"]),
            end=datetime.fromisoformat(data["mandhi"]["end"]),
            slot=int(data["mandhi"]["slot"]),
        ),
        nalla_neram=[
            PanchangamSlot(
                start=datetime.fromisoformat(w["start"]),
                end=datetime.fromisoformat(w["end"]),
                slot=int(w["slot"]),
            )
            for w in (data["nalla_neram"] if isinstance(data.get("nalla_neram"), list) else [])
        ] or [PanchangamSlot(
            start=datetime.fromisoformat(data["kuligai"]["start"]),
            end=datetime.fromisoformat(data["kuligai"]["end"]),
            slot=1,
        )],
        gowri_nalla_neram=[
            PanchangamSlot(
                start=datetime.fromisoformat(w["start"]),
                end=datetime.fromisoformat(w["end"]),
                slot=int(w["slot"]),
            )
            for w in (data["gowri_nalla_neram"] if isinstance(data.get("gowri_nalla_neram"), list) else [])
        ],
        is_subha_muhurtham=bool(data.get("is_subha_muhurtham", False)),
        subha_muhurtham_reason=str(data.get("subha_muhurtham_reason", "")),
        abhijit_start=datetime.fromisoformat(data["abhijit_start"]),
        abhijit_end=datetime.fromisoformat(data["abhijit_end"]),
        abhijit_restricted=bool(data["abhijit_restricted"]),
        hora=[
            PanchangamHoraEntry(
                index=int(entry["index"]),
                lord=str(entry["lord"]),
                start=datetime.fromisoformat(entry["start"]),
                end=datetime.fromisoformat(entry["end"]),
            )
            for entry in data["hora"]
        ],
        warnings=tuple(data.get("warnings", [])),
    )


def _load_cached_snapshot(
    session: Session,
    date_local: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> PanchangamSnapshot | None:
    row = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date == date_local,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    if row.created_at < datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS):
        return None
    if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
        return None
    return _deserialize_snapshot(row.data)


def _store_cached_snapshot(
    session: Session,
    snapshot: PanchangamSnapshot,
    ayanamsa_type: str,
) -> None:
    latitude = round(snapshot.latitude, 6)
    longitude = round(snapshot.longitude, 6)
    payload = _serialize_snapshot(snapshot)
    session.execute(
        pg_insert(PanchangamCache)
        .values(
            cache_date=snapshot.date_local,
            latitude=latitude,
            longitude=longitude,
            ayanamsa_type=ayanamsa_type,
            data=payload,
        )
        .on_conflict_do_update(
            constraint="uq_panchangam_cache_key",
            set_={"data": payload, "created_at": datetime.now(tz=UTC)},
        )
    )


def calculate_daily_panchangam(
    date_local: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
    use_cache: bool = True,
) -> PanchangamSnapshot:
    if use_cache and session is not None:
        cached = _load_cached_snapshot(session, date_local, latitude, longitude, DEFAULT_AYANAMSA_TYPE)
        if cached is not None:
            return cached

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
    mandhi_slot = MANDHI_SLOT[date_local.weekday()]

    kalam_anchor = sunrise
    kalam_slot_duration = (sunset - sunrise) / 8
    rahu = _slot_datetime(kalam_anchor, kalam_slot_duration, rahu_slot)
    yama = _slot_datetime(kalam_anchor, kalam_slot_duration, yama_slot)
    kuligai = _slot_datetime(kalam_anchor, kalam_slot_duration, kuligai_slot)
    mandhi = _slot_datetime(kalam_anchor, kalam_slot_duration, mandhi_slot)

    abhijit_start = solar_noon - timedelta(minutes=24)
    abhijit_end = solar_noon + timedelta(minutes=24)
    abhijit_restricted = date_local.weekday() == 2

    tithi_paksha: str = "SHUKLA" if tithi_number <= 15 else "KRISHNA"
    yoga_name_str = _yoga_name(yoga_number)

    hora_entries = _make_hora_entries(sunrise, sunset, next_sunrise, weekday_lord)
    nalla_neram = _compute_nalla_neram(sunrise, sunset, date_local.weekday())
    gowri_nalla_neram = _compute_gowri_nalla_neram(sunrise, sunset, date_local.weekday())

    is_subha, subha_reason = _compute_subha_muhurtham(
        tithi_number, tithi_paksha, NAKSHATRA_NAMES[nakshatra_number - 1],
        yoga_name_str, date_local.weekday(), abhijit_restricted,
    )

    snapshot = PanchangamSnapshot(
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
        tithi_paksha=tithi_paksha,
        tithi_ends_at=tithi_ends_at,
        nakshatra_number=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        nakshatra_pada=nakshatra_pada,
        nakshatra_ends_at=nakshatra_ends_at,
        yoga_number=yoga_number,
        yoga_name=yoga_name_str,
        karana_name=_karana_name(karana_index),
        rahu_kalam=rahu,
        yamagandam=yama,
        kuligai=kuligai,
        mandhi=mandhi,
        nalla_neram=nalla_neram,
        gowri_nalla_neram=gowri_nalla_neram,
        abhijit_start=abhijit_start,
        abhijit_end=abhijit_end,
        abhijit_restricted=abhijit_restricted,
        is_subha_muhurtham=is_subha,
        subha_muhurtham_reason=subha_reason,
        hora=hora_entries,
        warnings=warnings,
    )

    if use_cache and session is not None:
        _store_cached_snapshot(session, snapshot, DEFAULT_AYANAMSA_TYPE)
    return snapshot

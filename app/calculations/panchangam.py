from __future__ import annotations

from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from math import ceil, floor

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.astro import (
    RASI_NAMES,
    degree_in_rasi,
    julian_day_to_utc_datetime,
    local_datetime_to_utc,
    nakshatra_from_degree,
    normalize_longitude,
    rasi_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
    utc_datetime_to_local_datetime,
)
from app.calculations.ephemeris import (
    calculate_lagna_degree,
    calculate_rise_transit_jd,
    calculate_sidereal_planets,
)
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

# Thirukanitham / Pambu Panchangam slot tables (8-slot daytime grid, Mon=0..Sun=6)
# Canonical sequence used by QA golden cases.
# Sun Mon Tue Wed Thu Fri Sat
RAHU_SLOT = {6: 8, 0: 2, 1: 7, 2: 5, 3: 6, 4: 4, 5: 3}
YAMA_SLOT = {6: 5, 0: 4, 1: 3, 2: 2, 3: 1, 4: 7, 5: 6}
KULIGAI_SLOT = {6: 7, 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1}
# Gowri Panchangam full engine tables. Day slots run sunrise->sunset; night slots
# run sunset->next sunrise. Names are kept normalized for API consumers.
GOWRI_GOOD_NAMES = frozenset({"AMIRDHA", "UTHI", "LAABAM", "DHANAM", "SUGAM"})
GOWRI_GOOD_RANK = {
    "AMIRDHA": 1,
    "UTHI": 2,
    "LAABAM": 3,
    "DHANAM": 4,
    "SUGAM": 5,
}
# NOTE: web/lib/gowri.ts (GOWRI_CATEGORY_DETAILS) duplicates these label/purpose strings
# verbatim for the dashboard, since the API does not expose per-slot localized fields.
# Keep both in sync when editing.
GOWRI_GOOD_LABELS_EN = {
    "AMIRDHA": "Amirdha",
    "UTHI": "Uthiyogam",
    "LAABAM": "Laabam",
    "DHANAM": "Dhanam",
    "SUGAM": "Sugam",
}
GOWRI_GOOD_LABELS_TA = {
    "AMIRDHA": "அமிர்தம்",
    "UTHI": "உத்தியோகம்",
    "LAABAM": "லாபம்",
    "DHANAM": "தனம்",
    "SUGAM": "சுகம்",
}
GOWRI_GOOD_PURPOSE_EN = {
    "AMIRDHA": "best overall",
    "UTHI": "new starts, jobs, official work, and applications",
    "LAABAM": "profit, business, deals, buying, and selling",
    "DHANAM": "money, finance, investments, and wealth matters",
    "SUGAM": "comfort, health, family peace, travel, and routine good work",
}
GOWRI_GOOD_PURPOSE_TA = {
    "AMIRDHA": "மிகச் சிறந்த பொது நல்ல நேரம்",
    "UTHI": "புதிய தொடக்கம், வேலை, அலுவல், விண்ணப்பங்களுக்கு நல்லது",
    "LAABAM": "லாபம், வணிகம், ஒப்பந்தம், வாங்கல்/விற்பனைக்கு நல்லது",
    "DHANAM": "பணம், நிதி, முதலீடு, செல்வ விஷயங்களுக்கு நல்லது",
    "SUGAM": "சுகம், ஆரோக்கியம், குடும்ப அமைதி, பயணம், வழக்கமான நல்ல செயல்களுக்கு நல்லது",
}
GOWRI_DAY_TABLE = {
    6: ("UTHI", "AMIRDHA", "ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "VISHAM"),
    0: ("AMIRDHA", "VISHAM", "ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "UTHI"),
    1: ("ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRDHA"),
    2: ("LAABAM", "DHANAM", "SUGAM", "SORAM", "VISHAM", "UTHI", "AMIRDHA", "ROGAM"),
    3: ("DHANAM", "SUGAM", "SORAM", "UTHI", "AMIRDHA", "VISHAM", "ROGAM", "LAABAM"),
    4: ("SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRDHA", "ROGAM", "LAABAM", "DHANAM"),
    5: ("SORAM", "UTHI", "VISHAM", "AMIRDHA", "ROGAM", "LAABAM", "DHANAM", "SUGAM"),
}
GOWRI_NIGHT_TABLE = {
    6: ("DHANAM", "SUGAM", "SORAM", "VISHAM", "UTHI", "AMIRDHA", "ROGAM", "LAABAM"),
    0: ("SUGAM", "SORAM", "UTHI", "AMIRDHA", "VISHAM", "ROGAM", "LAABAM", "DHANAM"),
    1: ("SORAM", "UTHI", "VISHAM", "AMIRDHA", "ROGAM", "LAABAM", "DHANAM", "SUGAM"),
    2: ("UTHI", "AMIRDHA", "ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "VISHAM"),
    3: ("AMIRDHA", "VISHAM", "ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "UTHI"),
    4: ("ROGAM", "LAABAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRDHA"),
    5: ("LAABAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRDHA", "ROGAM"),
}

# Subha/ashubha nitya yoga names per Thirukanitha tradition.
SUBHA_YOGAS = {"SIDDHA", "SHUBHA", "VARIYANA", "HARSHANA", "BRAHMA", "INDRA"}
ASHUBHA_YOGAS = {
    "VISHKAMBHA",
    "VYAGHATA",
    "GANDA",
    "SHOOLA",
    "ATIGANDA",
    "VAJRA",
    "VYATIPATA",
    "PARIGHA",
    "VAIDHRITI",
}

# Auspicious tithis for muhurtham (Shukla paksha 2,3,5,6,7,10,11,12,13; Krishna 2,3,6,7,10,11)
SUBHA_TITHIS_SHUKLA = {2, 3, 5, 6, 7, 10, 11, 12, 13}
SUBHA_TITHIS_KRISHNA = {2, 3, 6, 7, 10, 11}

# Auspicious nakshatras for muhurtham (Thirukanitha list — Tamil names matching NAKSHATRA_NAMES)
SUBHA_NAKSHATRAS = {
    "ASWINI",         # 1  — Ashwini
    "ROHINI",         # 4  — Rohini
    "MIRUGASEERIDAM", # 5  — Mrigashira
    "PUNARPOOSAM",    # 7  — Punarvasu
    "POOSAM",         # 8  — Pushya
    "HASTHAM",        # 13 — Hasta
    "CHITHIRAI",      # 14 — Chitra
    "SWATHI",         # 15 — Swati
    "ANUSHAM",        # 17 — Anuradha
    "MOOLAM",         # 19 — Mula
    "UTHIRADAM",      # 21 — Uttarashada
    "UTHIRATTATHI",   # 26 — Uttarabhadrapada
    "REVATHI",        # 27 — Revati
    "MAGAM",          # 10 — Magha
    "UTHIRAM",        # 12 — Uttaraphalguni
    "THIRUVONAM",     # 22 — Shravana
    "AVITTAM",        # 23 — Dhanishtha
}
# DRAFT — verify against Thirukanitham before relying on these tables.
# Soolam (சூலம்): the inauspicious travel direction for the day, by weekday
# (0=Mon..6=Sun, matching RAHU_SLOT). Parigaram is the remedy food traditionally
# eaten before travelling in the Soolam direction to nullify its effect.
SOOLAM_DIRECTION = {
    0: "கிழக்கு",   # Monday — East
    1: "வடக்கு",    # Tuesday — North
    2: "வடக்கு",    # Wednesday — North
    3: "தெற்கு",    # Thursday — South
    4: "மேற்கு",    # Friday — West
    5: "கிழக்கு",   # Saturday — East
    6: "மேற்கு",    # Sunday — West
}
SOOLAM_PARIGARAM_BY_DIRECTION = {
    "கிழக்கு": "வெல்லம்",
    "மேற்கு": "தயிர்",
    "வடக்கு": "பால்",
    "தெற்கு": "எண்ணெய்",
}

# Nethiram (நேத்திரம்) and Jeevan (ஜீவன்): daily vitality/clarity indicators
# derived from the current Sun nakshatra and the day's Moon nakshatra.
JEEVAN_LABELS = {0: "இல்லை", 0.5: "அரை வாழ்க்கை", 1: "முழு வாழ்க்கை"}
NETHIRAM_LABELS = {0: "குருடு", 1: "ஒரு கண்", 2: "இரு கண்"}


def _nakshatra_ring_distance(a: int, b: int) -> int:
    diff = abs(a - b) % 27
    return min(diff, 27 - diff)


def _jeevan_value(sun_nakshatra: int, reference_nakshatra: int) -> float:
    distance = _nakshatra_ring_distance(sun_nakshatra, reference_nakshatra)
    if distance <= 1:
        return 0
    if distance == 9:
        return 0
    if distance <= 8:
        return 0.5
    return 1


def _nethiram_value(sun_nakshatra: int, reference_nakshatra: int) -> int:
    distance = _nakshatra_ring_distance(sun_nakshatra, reference_nakshatra)
    if distance <= 2:
        return 0
    if distance <= 8:
        return 1
    return 2

# Amirdhadhi Yogam (அமிர்தாதி யோகம்): fixed weekday + nakshatra table used by
# Tamil almanacs for Amirtha/Siddha/Marana daily yoga.
AMIRDHADHI_YOGAM_LABELS = {
    "A": "அமிர்தயோகம்",
    "C": "சித்தயோகம்",
    "M": "மரணயோகம்",
}
AMIRDHADHI_YOGAM_TABLE = {
    6: ("C", "C", "C", "C", "C", "C", "C", "C", "C", "M", "C", "A", "A", "C", "C", "M", "M", "M", "A", "C", "A", "A", "M", "C", "C", "A", "A"),
    0: ("C", "C", "M", "A", "A", "C", "A", "C", "C", "M", "C", "C", "C", "C", "A", "M", "C", "C", "C", "C", "M", "A", "C", "C", "M", "C", "C"),
    1: ("C", "C", "C", "A", "C", "M", "C", "C", "C", "C", "C", "A", "C", "C", "C", "M", "C", "C", "A", "C", "C", "C", "C", "M", "M", "A", "C"),
    2: ("M", "C", "A", "C", "C", "C", "C", "C", "C", "C", "A", "A", "M", "C", "C", "C", "C", "C", "M", "A", "A", "C", "M", "C", "A", "C", "M"),
    3: ("A", "C", "M", "M", "M", "M", "A", "A", "C", "A", "C", "M", "C", "C", "A", "C", "C", "C", "C", "C", "C", "C", "C", "M", "C", "C", "C"),
    4: ("A", "C", "C", "M", "C", "C", "C", "M", "M", "M", "C", "C", "A", "C", "C", "C", "C", "M", "A", "C", "C", "M", "C", "C", "C", "C", "A"),
    5: ("C", "C", "A", "A", "C", "C", "C", "C", "M", "A", "C", "M", "M", "M", "A", "C", "C", "C", "C", "C", "C", "C", "C", "A", "M", "C", "M"),
}

# DRAFT — daily Chandrashtamam listing: nakshatra count-positions traditionally
# called out as "in Chandrashtamam" relative to the Moon's current nakshatra.
# This is the generic almanac convention (distinct from, and NOT a substitute
# for, the natal-rasi-based is_chandrashtama check frozen in astro.py).
CHANDRASHTAMAM_OFFSETS = (8, 12, 16, 21, 24)

PANCHANGAM_CACHE_TTL_HOURS = 24
DEFAULT_AYANAMSA_TYPE = "LAHIRI"
PANCHANGAM_CACHE_DATA_VERSION = 21
DOMINANT_SPECIAL_TITHIS = {15, 30}

# Compact daily-calendar summary windows used by Tamil calendars for everyday
# planning. The full Gowri Panchangam engine below remains sunrise/sunset based;
# these two-slot summaries intentionally use the familiar clock-table convention.
NALLA_NERAM_SUMMARY_TABLE = {
    # Mon
    0: ((6 * 60 + 30, 7 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Tue
    1: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Wed
    2: ((9 * 60 + 30, 10 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Thu
    3: ((10 * 60 + 30, 11 * 60 + 30, "AM"), (12 * 60 + 30, 13 * 60 + 30, "PM")),
    # Fri
    4: ((9 * 60 + 30, 10 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Sat
    5: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Sun
    6: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (15 * 60 + 30, 16 * 60 + 30, "PM")),
}

GOWRI_NALLA_NERAM_SUMMARY_TABLE = {
    # Mon
    0: ((9 * 60 + 15, 10 * 60 + 15, "DAY"), (19 * 60 + 30, 20 * 60 + 30, "NIGHT")),
    # Tue
    1: ((10 * 60 + 30, 11 * 60 + 30, "DAY"), (19 * 60 + 30, 20 * 60 + 30, "NIGHT")),
    # Wed
    2: ((10 * 60 + 45, 11 * 60 + 45, "DAY"), (18 * 60 + 30, 19 * 60 + 30, "NIGHT")),
    # Thu
    3: ((6 * 60 + 30, 7 * 60 + 30, "DAY"), (18 * 60 + 30, 19 * 60 + 30, "NIGHT")),
    # Fri
    4: ((12 * 60 + 30, 13 * 60 + 30, "DAY"), (18 * 60 + 30, 19 * 60 + 30, "NIGHT")),
    # Sat
    5: ((10 * 60 + 30, 11 * 60 + 30, "DAY"), (21 * 60 + 30, 22 * 60 + 30, "NIGHT")),
    # Sun
    6: ((10 * 60 + 45, 11 * 60 + 45, "DAY"), (25 * 60 + 30, 26 * 60 + 30, "NIGHT")),
}


@dataclass(frozen=True, slots=True)
class PanchangamSlot:
    start: datetime
    end: datetime
    slot: int
    name: str | None = None
    period: str | None = None
    is_good: bool | None = None


def _gowri_key(name: str | None) -> str:
    return str(name or "").upper()


def gowri_category_rank(name: str | None) -> int:
    return GOWRI_GOOD_RANK.get(_gowri_key(name), 999)


def gowri_good_label(name: str | None, lang: str = "en") -> str | None:
    key = _gowri_key(name)
    labels = GOWRI_GOOD_LABELS_TA if lang == "ta" else GOWRI_GOOD_LABELS_EN
    return labels.get(key)


def gowri_good_purpose(name: str | None, lang: str = "en") -> str | None:
    key = _gowri_key(name)
    purposes = GOWRI_GOOD_PURPOSE_TA if lang == "ta" else GOWRI_GOOD_PURPOSE_EN
    return purposes.get(key)


def best_gowri_slot(
    slots: Sequence[PanchangamSlot] | PanchangamSlot | None,
) -> PanchangamSlot | None:
    if not slots:
        return None
    if hasattr(slots, "start") and hasattr(slots, "end"):
        candidates = [slots]
    else:
        candidates = list(slots)
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda slot: (
            gowri_category_rank(getattr(slot, "name", None)),
            getattr(slot, "start", datetime.max),
        ),
    )


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
    yoga_ends_at: datetime
    yoga_next_name: str
    karana_name: str
    karana_ends_at: datetime
    karana_next_name: str
    rahu_kalam: PanchangamSlot
    yamagandam: PanchangamSlot
    kuligai: PanchangamSlot
    gowri_panchangam: list[PanchangamSlot]
    nalla_neram: list[PanchangamSlot]
    gowri_nalla_neram: list[PanchangamSlot]
    abhijit_start: datetime
    abhijit_end: datetime
    abhijit_restricted: bool
    is_subha_muhurtham: bool
    subha_muhurtham_reason: str
    is_subha_muhurtham_strict: bool
    subha_muhurtham_strict_reason: str
    hora: list[PanchangamHoraEntry]
    moon_phase_label: str
    tithi_next_number: int
    tithi_next_name: str
    tithi_next_paksha: str
    special_tithi_day_number: int | None
    nakshatra_next_name: str
    soolam_direction: str
    soolam_parigaram: str
    nethiram: str
    jeevan: str
    lagna_rasi_number: int
    lagna_rasi_name: str
    lagna_ends_at: datetime
    lagna_nazhigai: int
    lagna_vinadi: int
    amirdhadhi_yogam_name: str
    amirdhadhi_yogam_ends_at: datetime
    amirdhadhi_yogam_next_name: str
    chandrashtamam_moon_rasi_number: int
    chandrashtamam_moon_rasi_name: str
    chandrashtamam_affected_janma_rasi_number: int
    chandrashtamam_affected_janma_rasi_name: str
    chandrashtamam_today_nakshatras: tuple[str, ...]
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


def _tithi_angle_at_jd(jd: float) -> float:
    sun, moon, _ = _calculate_positions_at_sunrise(jd)
    return normalize_longitude(moon - sun)


def _tithi_number_at_jd(jd: float) -> int:
    return int((_tithi_angle_at_jd(jd) + 1e-9) // 12) + 1


def _nakshatra_angle_at_jd(jd: float) -> float:
    _, moon, _ = _calculate_positions_at_sunrise(jd)
    return normalize_longitude(moon)


def _nakshatra_number_at_jd(jd: float) -> int:
    return int((_nakshatra_angle_at_jd(jd) + 1e-9) // (40 / 3)) + 1


def _yoga_angle_at_jd(jd: float) -> float:
    sun, moon, _ = _calculate_positions_at_sunrise(jd)
    return normalize_longitude(sun + moon)


def _yoga_number_at_jd(jd: float) -> int:
    return int((_yoga_angle_at_jd(jd) + 1e-9) // (40 / 3)) + 1


def _civil_day_bounds_jd(date_local: date, timezone_name: str) -> tuple[float, float]:
    timezone_obj = resolve_timezone(timezone_name)
    start_local = datetime.combine(date_local, datetime.min.time(), tzinfo=timezone_obj)
    end_local = start_local + timedelta(days=1)
    start_jd = utc_datetime_to_julian_day(start_local.astimezone(UTC))
    end_jd = utc_datetime_to_julian_day(end_local.astimezone(UTC))
    return start_jd, end_jd


def _state_durations_for_civil_day(
    date_local: date,
    timezone_name: str,
    *,
    value_at_jd,
    boundary_at_jd,
    max_transitions: int,
) -> tuple[dict[int, float], int]:
    start_jd, end_jd = _civil_day_bounds_jd(date_local, timezone_name)
    noon_value = int(value_at_jd((start_jd + end_jd) / 2))

    durations: dict[int, float] = {}
    cursor = start_jd
    for _ in range(max_transitions):
        if cursor >= end_jd - 1e-10:
            break
        current_value = int(value_at_jd(cursor))
        next_boundary = boundary_at_jd(cursor)
        interval_end = min(next_boundary, end_jd)
        durations[current_value] = durations.get(current_value, 0.0) + max(0.0, interval_end - cursor) * 86400.0
        if next_boundary >= end_jd:
            break
        cursor = min(next_boundary + 1e-8, end_jd)

    return durations, noon_value


def _dominant_state_for_civil_day(
    date_local: date,
    timezone_name: str,
    *,
    value_at_jd,
    boundary_at_jd,
    max_transitions: int,
) -> int | None:
    durations, noon_value = _state_durations_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=value_at_jd,
        boundary_at_jd=boundary_at_jd,
        max_transitions=max_transitions,
    )
    if not durations:
        return None

    return max(
        durations.items(),
        key=lambda item: (item[1], 1 if item[0] == noon_value else 0, -item[0]),
    )[0]


def _special_tithi_durations_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> dict[int, float]:
    durations, _ = _state_durations_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=_tithi_number_at_jd,
        boundary_at_jd=lambda jd: _find_next_boundary_jd(jd, _tithi_angle_at_jd, 12.0),
        max_transitions=8,
    )
    durations = {number: durations.get(number, 0.0) for number in DOMINANT_SPECIAL_TITHIS}
    return durations


def dominant_tithi_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> int | None:
    return _dominant_state_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=_tithi_number_at_jd,
        boundary_at_jd=lambda jd: _find_next_boundary_jd(jd, _tithi_angle_at_jd, 12.0),
        max_transitions=8,
    )


def dominant_nakshatra_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> int | None:
    return _dominant_state_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=_nakshatra_number_at_jd,
        boundary_at_jd=lambda jd: _find_next_boundary_jd(jd, _nakshatra_angle_at_jd, 40 / 3),
        max_transitions=6,
    )


def dominant_yoga_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> int | None:
    return _dominant_state_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=_yoga_number_at_jd,
        boundary_at_jd=lambda jd: _find_next_boundary_jd(jd, _yoga_angle_at_jd, 40 / 3),
        max_transitions=6,
    )


def dominant_special_tithi_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> int | None:
    """Return Amavasai/Pournami only for the civil date with the longest span."""
    current = _special_tithi_durations_for_civil_day(date_local, timezone_name)
    active_specials = {
        tithi_number
        for tithi_number, duration in current.items()
        if duration > 0
    }
    if not active_specials:
        return None

    previous = _special_tithi_durations_for_civil_day(date_local - timedelta(days=1), timezone_name)
    following = _special_tithi_durations_for_civil_day(date_local + timedelta(days=1), timezone_name)

    candidates: list[tuple[float, int]] = []
    for tithi_number in active_specials:
        duration = current[tithi_number]
        if duration >= previous[tithi_number] and duration >= following[tithi_number]:
            candidates.append((duration, tithi_number))

    if not candidates:
        return None
    return max(candidates)[1]


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


def _gowri_slot_datetime(
    start: datetime,
    duration: timedelta,
    slot_number: int,
    name: str,
    period: str,
) -> PanchangamSlot:
    slot_start = start + duration * (slot_number - 1)
    slot_end = slot_start + duration
    return PanchangamSlot(
        start=slot_start,
        end=slot_end,
        slot=slot_number,
        name=name,
        period=period,
        is_good=name in GOWRI_GOOD_NAMES,
    )


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


def _summary_slot(
    date_local: date,
    tzinfo,
    slot_number: int,
    start_minutes: int,
    end_minutes: int,
    period: str,
) -> PanchangamSlot:
    day_start = datetime.combine(date_local, datetime.min.time(), tzinfo=tzinfo)
    start = day_start + timedelta(minutes=start_minutes)
    end = day_start + timedelta(minutes=end_minutes)
    if end <= start:
        end += timedelta(days=1)
    return PanchangamSlot(
        start=start,
        end=end,
        slot=slot_number,
        period=period,
        is_good=True,
    )


def _summary_slots(
    date_local: date,
    tzinfo,
    table: dict[int, tuple[tuple[int, int, str], ...]],
    weekday_index: int,
) -> list[PanchangamSlot]:
    return [
        _summary_slot(date_local, tzinfo, slot_number, start, end, period)
        for slot_number, (start, end, period) in enumerate(table[weekday_index], start=1)
    ]


def _compute_nalla_neram(date_local: date, tzinfo, weekday_index: int) -> list[PanchangamSlot]:
    """Compact morning/evening Nalla Neram summary for daily planning."""
    return _summary_slots(date_local, tzinfo, NALLA_NERAM_SUMMARY_TABLE, weekday_index)


def _compute_gowri_panchangam(
    sunrise: datetime,
    sunset: datetime,
    next_sunrise: datetime,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """All 16 named Gowri slots across the panchangam day and night."""
    day_duration = (sunset - sunrise) / 8
    night_duration = (next_sunrise - sunset) / 8
    day_slots = [
        _gowri_slot_datetime(sunrise, day_duration, i + 1, name, "DAY")
        for i, name in enumerate(GOWRI_DAY_TABLE[weekday_index])
    ]
    night_slots = [
        _gowri_slot_datetime(sunset, night_duration, i + 1, name, "NIGHT")
        for i, name in enumerate(GOWRI_NIGHT_TABLE[weekday_index])
    ]
    return day_slots + night_slots


def _compute_gowri_nalla_neram(
    date_local: date,
    tzinfo,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """Compact day/night Gowri Nalla Neram summary for daily planning."""
    return _summary_slots(date_local, tzinfo, GOWRI_NALLA_NERAM_SUMMARY_TABLE, weekday_index)


# Tithis universally treated as Rahu/rikta — excluded from muhurtham regardless
# of paksha (Ashtami, Navami; Amavasai is handled separately via tithi_number == 30).
RAHU_TITHIS_IN_PAKSHA = {8, 9}
MUHURTHAM_BLOCKED_WEEKDAYS = {1, 5}  # Tuesday, Saturday


def _muhurtham_weekday_block_reason(weekday_index: int) -> str:
    weekday_name = WEEKDAY_NAMES[weekday_index].title()
    return f"Inauspicious: {weekday_name} excluded for Subha Muhurtham in Tamil tradition"


def _compute_subha_muhurtham_broad(
    tithi_number: int,
    nakshatra_name: str,
    weekday_index: int,
) -> tuple[bool, str]:
    """Nakshatra-led Subha Muhurtham check matching how published Tamil almanacs list
    wedding-muhurtham dates — the day's nakshatra is the deciding factor, while
    Tuesday, Saturday, Amavasai, and the Rahu tithis (Ashtami/Navami) are excluded."""
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15

    if weekday_index in MUHURTHAM_BLOCKED_WEEKDAYS:
        return False, _muhurtham_weekday_block_reason(weekday_index)
    if tithi_number == 30:
        return False, "Inauspicious: Amavasai tithi"
    if tithi_in_paksha in RAHU_TITHIS_IN_PAKSHA:
        return False, f"Inauspicious: {_tithi_name(tithi_number)} (Rahu tithi)"

    if nakshatra_name in SUBHA_NAKSHATRAS:
        return True, f"Auspicious: {nakshatra_name} nakshatra"

    return False, f"Neutral: {nakshatra_name} not a muhurtham nakshatra"


def _compute_subha_muhurtham_strict(
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    yoga_name: str,
    weekday_index: int,
    abhijit_restricted: bool,
) -> tuple[bool, str]:
    """Stricter Subha Muhurtham check requiring auspicious tithi + nakshatra + nitya yoga
    together — closer to the combination rules many traditional almanacs apply."""
    reasons: list[str] = []
    inauspicious: list[str] = []

    # tithi_number is 1-30 across both pakshas; convert to within-paksha (1-15) for table lookups
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15

    if weekday_index in MUHURTHAM_BLOCKED_WEEKDAYS:
        return False, _muhurtham_weekday_block_reason(weekday_index)

    if yoga_name in ASHUBHA_YOGAS:
        inauspicious.append(f"{yoga_name} yoga")
    elif yoga_name in SUBHA_YOGAS:
        reasons.append(f"{yoga_name} yoga")

    if tithi_paksha == "SHUKLA" and tithi_in_paksha in SUBHA_TITHIS_SHUKLA:
        reasons.append("auspicious tithi")
    elif tithi_paksha == "KRISHNA" and tithi_in_paksha in SUBHA_TITHIS_KRISHNA:
        reasons.append("auspicious tithi")
    else:
        inauspicious.append("inauspicious tithi")

    if nakshatra_name in SUBHA_NAKSHATRAS:
        reasons.append("auspicious nakshatra")
    else:
        inauspicious.append("inauspicious nakshatra")

    # Amavasai (30), Chaturdashi (14/29) and Ashtami (8/23) are always inauspicious
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


def _moon_phase_label(paksha: str) -> str:
    return "வளர்பிறை (Waxing)" if paksha == "SHUKLA" else "தேய்பிறை (Waning)"


def _next_tithi(tithi_number: int) -> tuple[int, str, str]:
    next_number = (tithi_number % 30) + 1
    next_paksha = "SHUKLA" if next_number <= 15 else "KRISHNA"
    return next_number, _tithi_name(next_number), next_paksha


def _next_nakshatra_name(nakshatra_number: int) -> str:
    next_number = (nakshatra_number % 27) + 1
    return NAKSHATRA_NAMES[next_number - 1]


def _next_yoga_name(yoga_number: int) -> str:
    return _yoga_name((yoga_number % 27) + 1)


def _next_karana_name(karana_index: int) -> str:
    return _karana_name((karana_index + 1) % 60)


def _amirdhadhi_yogam_name(weekday_index: int, nakshatra_number: int) -> str:
    table = AMIRDHADHI_YOGAM_TABLE[weekday_index]
    key = table[(nakshatra_number - 1) % 27]
    return AMIRDHADHI_YOGAM_LABELS[key]


def _chandrashtamam_affected_janma_rasi(moon_rasi_number: int) -> int:
    return ((moon_rasi_number - 8) % 12) + 1


def _chandrashtamam_today_nakshatras(nakshatra_number: int) -> tuple[str, ...]:
    """Birth-nakshatra natives traditionally called out as affected by
    Chandrashtamam today, per the generic almanac (nakshatra-count) convention.
    Distinct from the natal-rasi-based is_chandrashtama check in astro.py."""
    return tuple(
        NAKSHATRA_NAMES[(nakshatra_number - 1 + offset) % 27]
        for offset in CHANDRASHTAMAM_OFFSETS
    )


def _find_lagna_rasi_boundary_jd(start_jd: float, latitude: float, longitude: float) -> float:
    """Find the JD at which the sidereal ascendant crosses into the next rasi (30°)."""
    base_degree = normalize_longitude(calculate_lagna_degree(start_jd, latitude, longitude))
    base_index = int(base_degree // 30.0)
    target_degree = (base_index + 1) * 30.0
    if target_degree >= 360.0:
        target_degree = 0.0

    def _continuous_degree(jd: float) -> float:
        degree = normalize_longitude(calculate_lagna_degree(jd, latitude, longitude))
        if degree < base_degree - 180.0:
            degree += 360.0
        return degree

    target_continuous = target_degree if target_degree > base_degree else target_degree + 360.0

    lo = start_jd
    hi = start_jd + 1 / 24
    while hi - lo <= 1.0:
        if _continuous_degree(hi) >= target_continuous:
            break
        hi += 1 / 24
    else:
        return hi

    for _ in range(48):
        mid = (lo + hi) / 2
        if _continuous_degree(mid) >= target_continuous:
            hi = mid
        else:
            lo = mid
    return hi


def _calculate_positions_at_sunrise(jd_ut: float) -> tuple[float, float, tuple[str, ...]]:
    snapshot = calculate_sidereal_planets(jd_ut)
    return (
        snapshot.bodies["SUN"].absolute_longitude,
        snapshot.bodies["MOON"].absolute_longitude,
        snapshot.source_warnings,
    )


def _serialize_slot(slot: PanchangamSlot) -> dict:
    return {
        "start": slot.start.isoformat(),
        "end": slot.end.isoformat(),
        "slot": slot.slot,
        "name": slot.name,
        "period": slot.period,
        "is_good": slot.is_good,
    }


def _deserialize_slot(data: dict) -> PanchangamSlot:
    return PanchangamSlot(
        start=datetime.fromisoformat(data["start"]),
        end=datetime.fromisoformat(data["end"]),
        slot=int(data["slot"]),
        name=data.get("name"),
        period=data.get("period"),
        is_good=data.get("is_good"),
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
        "yoga_ends_at": snapshot.yoga_ends_at.isoformat(),
        "yoga_next_name": snapshot.yoga_next_name,
        "karana_name": snapshot.karana_name,
        "karana_ends_at": snapshot.karana_ends_at.isoformat(),
        "karana_next_name": snapshot.karana_next_name,
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
        "gowri_panchangam": [_serialize_slot(w) for w in snapshot.gowri_panchangam],
        "nalla_neram": [_serialize_slot(w) for w in snapshot.nalla_neram],
        "gowri_nalla_neram": [_serialize_slot(w) for w in snapshot.gowri_nalla_neram],
        "is_subha_muhurtham": snapshot.is_subha_muhurtham,
        "subha_muhurtham_reason": snapshot.subha_muhurtham_reason,
        "is_subha_muhurtham_strict": snapshot.is_subha_muhurtham_strict,
        "subha_muhurtham_strict_reason": snapshot.subha_muhurtham_strict_reason,
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
        "moon_phase_label": snapshot.moon_phase_label,
        "tithi_next_number": snapshot.tithi_next_number,
        "tithi_next_name": snapshot.tithi_next_name,
        "tithi_next_paksha": snapshot.tithi_next_paksha,
        "special_tithi_day_number": snapshot.special_tithi_day_number,
        "nakshatra_next_name": snapshot.nakshatra_next_name,
        "soolam_direction": snapshot.soolam_direction,
        "soolam_parigaram": snapshot.soolam_parigaram,
        "nethiram": snapshot.nethiram,
        "jeevan": snapshot.jeevan,
        "lagna_rasi_number": snapshot.lagna_rasi_number,
        "lagna_rasi_name": snapshot.lagna_rasi_name,
        "lagna_ends_at": snapshot.lagna_ends_at.isoformat(),
        "lagna_nazhigai": snapshot.lagna_nazhigai,
        "lagna_vinadi": snapshot.lagna_vinadi,
        "amirdhadhi_yogam_name": snapshot.amirdhadhi_yogam_name,
        "amirdhadhi_yogam_ends_at": snapshot.amirdhadhi_yogam_ends_at.isoformat(),
        "amirdhadhi_yogam_next_name": snapshot.amirdhadhi_yogam_next_name,
        "chandrashtamam_moon_rasi_number": snapshot.chandrashtamam_moon_rasi_number,
        "chandrashtamam_moon_rasi_name": snapshot.chandrashtamam_moon_rasi_name,
        "chandrashtamam_affected_janma_rasi_number": snapshot.chandrashtamam_affected_janma_rasi_number,
        "chandrashtamam_affected_janma_rasi_name": snapshot.chandrashtamam_affected_janma_rasi_name,
        "chandrashtamam_today_nakshatras": list(snapshot.chandrashtamam_today_nakshatras),
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
        yoga_ends_at=datetime.fromisoformat(data["yoga_ends_at"]) if data.get("yoga_ends_at") else datetime.fromisoformat(data["nakshatra_ends_at"]),
        yoga_next_name=str(data.get("yoga_next_name", "")),
        karana_name=str(data["karana_name"]),
        karana_ends_at=datetime.fromisoformat(data["karana_ends_at"]) if data.get("karana_ends_at") else datetime.fromisoformat(data["tithi_ends_at"]),
        karana_next_name=str(data.get("karana_next_name", "")),
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
        gowri_panchangam=[
            _deserialize_slot(w)
            for w in (data["gowri_panchangam"] if isinstance(data.get("gowri_panchangam"), list) else [])
        ],
        nalla_neram=[
            _deserialize_slot(w)
            for w in (data["nalla_neram"] if isinstance(data.get("nalla_neram"), list) else [])
        ],
        gowri_nalla_neram=[
            _deserialize_slot(w)
            for w in (data["gowri_nalla_neram"] if isinstance(data.get("gowri_nalla_neram"), list) else [])
        ],
        is_subha_muhurtham=bool(data.get("is_subha_muhurtham", False)),
        subha_muhurtham_reason=str(data.get("subha_muhurtham_reason", "")),
        is_subha_muhurtham_strict=bool(data.get("is_subha_muhurtham_strict", False)),
        subha_muhurtham_strict_reason=str(data.get("subha_muhurtham_strict_reason", "")),
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
        moon_phase_label=str(data.get("moon_phase_label", "")),
        tithi_next_number=int(data.get("tithi_next_number", 0)),
        tithi_next_name=str(data.get("tithi_next_name", "")),
        tithi_next_paksha=str(data.get("tithi_next_paksha", "")),
        special_tithi_day_number=(
            int(data["special_tithi_day_number"])
            if data.get("special_tithi_day_number") is not None
            else None
        ),
        nakshatra_next_name=str(data.get("nakshatra_next_name", "")),
        soolam_direction=str(data.get("soolam_direction", "")),
        soolam_parigaram=str(data.get("soolam_parigaram", "")),
        nethiram=str(data.get("nethiram", "")),
        jeevan=str(data.get("jeevan", "")),
        lagna_rasi_number=int(data.get("lagna_rasi_number", 0)),
        lagna_rasi_name=str(data.get("lagna_rasi_name", "")),
        lagna_ends_at=datetime.fromisoformat(data["lagna_ends_at"]) if data.get("lagna_ends_at") else datetime.fromisoformat(data["sunrise"]),
        lagna_nazhigai=int(data.get("lagna_nazhigai", 0)),
        lagna_vinadi=int(data.get("lagna_vinadi", 0)),
        amirdhadhi_yogam_name=str(data.get("amirdhadhi_yogam_name", "")),
        amirdhadhi_yogam_ends_at=datetime.fromisoformat(data["amirdhadhi_yogam_ends_at"]) if data.get("amirdhadhi_yogam_ends_at") else datetime.fromisoformat(data["nakshatra_ends_at"]),
        amirdhadhi_yogam_next_name=str(data.get("amirdhadhi_yogam_next_name", "")),
        chandrashtamam_moon_rasi_number=int(data.get("chandrashtamam_moon_rasi_number", 0)),
        chandrashtamam_moon_rasi_name=str(data.get("chandrashtamam_moon_rasi_name", "")),
        chandrashtamam_affected_janma_rasi_number=int(data.get("chandrashtamam_affected_janma_rasi_number", 0)),
        chandrashtamam_affected_janma_rasi_name=str(data.get("chandrashtamam_affected_janma_rasi_name", "")),
        chandrashtamam_today_nakshatras=tuple(data.get("chandrashtamam_today_nakshatras", [])),
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


def _load_cached_snapshots_in_range(
    session: Session,
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> dict[date, PanchangamSnapshot]:
    rows = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date >= start_date,
            PanchangamCache.cache_date <= end_date,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalars()

    snapshots: dict[date, PanchangamSnapshot] = {}
    cutoff = datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS)
    for row in rows:
        if row.created_at < cutoff:
            continue
        if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
            continue
        snapshots[row.cache_date] = _deserialize_snapshot(row.data)
    return snapshots


def purge_expired_panchangam_cache(session: Session) -> int:
    result = session.execute(
        delete(PanchangamCache).where(PanchangamCache.expires_at < datetime.now(tz=UTC))
    )
    # Avoid committing here: this helper is called from read paths and should not
    # flush or commit unrelated pending ORM changes in the caller's session.
    return int(result.rowcount or 0)


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
            set_={
                "data": payload,
                "created_at": datetime.now(tz=UTC),
                "expires_at": datetime.now(tz=UTC) + timedelta(days=90),
            },
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
        purge_expired_panchangam_cache(session)
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

    def _tithi_angle(jd: float) -> float:
        sun, moon, _ = _calculate_positions_at_sunrise(jd)
        return normalize_longitude(moon - sun)

    def _nakshatra_angle(jd: float) -> float:
        _, moon, _ = _calculate_positions_at_sunrise(jd)
        return moon

    def _yoga_angle(jd: float) -> float:
        sun, moon, _ = _calculate_positions_at_sunrise(jd)
        return normalize_longitude(sun + moon)

    tithi_number = int((diff + 1e-9) // 12) + 1
    tithi_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _tithi_angle, 12.0)),
        timezone_name,
    )

    nakshatra_number = int((moon_longitude + 1e-9) // (40 / 3)) + 1
    nakshatra_pada = int(((moon_longitude % (40 / 3)) + 1e-9) // (10 / 3)) + 1
    nakshatra_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _nakshatra_angle, 40 / 3)),
        timezone_name,
    )

    yoga_number = int((normalize_longitude(sun_longitude + moon_longitude) + 1e-9) // (40 / 3)) + 1
    yoga_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _yoga_angle, 40 / 3)),
        timezone_name,
    )

    karana_index = int((diff + 1e-9) // 6)
    karana_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _tithi_angle, 6.0)),
        timezone_name,
    )

    weekday_name, weekday_lord = _weekday_lord_and_name(date_local)
    rahu_slot = RAHU_SLOT[date_local.weekday()]
    yama_slot = YAMA_SLOT[date_local.weekday()]
    kuligai_slot = KULIGAI_SLOT[date_local.weekday()]

    kalam_anchor = sunrise
    kalam_slot_duration = (sunset - sunrise) / 8
    rahu = _slot_datetime(kalam_anchor, kalam_slot_duration, rahu_slot)
    yama = _slot_datetime(kalam_anchor, kalam_slot_duration, yama_slot)
    kuligai = _slot_datetime(kalam_anchor, kalam_slot_duration, kuligai_slot)

    abhijit_start = solar_noon - timedelta(minutes=24)
    abhijit_end = solar_noon + timedelta(minutes=24)
    abhijit_restricted = date_local.weekday() == 2

    tithi_paksha: str = "SHUKLA" if tithi_number <= 15 else "KRISHNA"
    yoga_name_str = _yoga_name(yoga_number)

    hora_entries = _make_hora_entries(sunrise, sunset, next_sunrise, weekday_lord)
    weekday_index = date_local.weekday()
    gowri_panchangam = _compute_gowri_panchangam(sunrise, sunset, next_sunrise, weekday_index)
    gowri_nalla_neram = _compute_gowri_nalla_neram(date_local, sunrise.tzinfo, weekday_index)
    nalla_neram = _compute_nalla_neram(date_local, sunrise.tzinfo, weekday_index)

    is_subha, subha_reason = _compute_subha_muhurtham_broad(
        tithi_number, NAKSHATRA_NAMES[nakshatra_number - 1], weekday_index,
    )
    is_subha_strict, subha_strict_reason = _compute_subha_muhurtham_strict(
        tithi_number, tithi_paksha, NAKSHATRA_NAMES[nakshatra_number - 1],
        yoga_name_str, weekday_index, abhijit_restricted,
    )

    moon_phase_label = _moon_phase_label(tithi_paksha)
    tithi_next_number, tithi_next_name, tithi_next_paksha = _next_tithi(tithi_number)
    nakshatra_next_name = _next_nakshatra_name(nakshatra_number)
    special_tithi_day_number = dominant_special_tithi_for_civil_day(date_local, timezone_name)

    soolam_direction = SOOLAM_DIRECTION[weekday_index]
    soolam_parigaram = SOOLAM_PARIGARAM_BY_DIRECTION[soolam_direction]
    sun_nakshatra_number = nakshatra_from_degree(sun_longitude)
    nethiram = NETHIRAM_LABELS[_nethiram_value(sun_nakshatra_number, nakshatra_number)]
    jeevan = JEEVAN_LABELS[_jeevan_value(sun_nakshatra_number, nakshatra_number)]

    lagna_degree = normalize_longitude(calculate_lagna_degree(sunrise_jd, latitude, longitude))
    lagna_rasi_number = rasi_from_degree(lagna_degree)
    lagna_boundary_jd = _find_lagna_rasi_boundary_jd(sunrise_jd, latitude, longitude)
    lagna_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(lagna_boundary_jd), timezone_name,
    )
    lagna_remaining_seconds = max(0.0, (lagna_boundary_jd - sunrise_jd) * 86400.0)
    lagna_nazhigai = int(lagna_remaining_seconds // 1440)
    lagna_vinadi = int((lagna_remaining_seconds % 1440) // 24)

    amirdhadhi_yogam_name = _amirdhadhi_yogam_name(weekday_index, nakshatra_number)
    amirdhadhi_yogam_next_name = _amirdhadhi_yogam_name(weekday_index, nakshatra_number + 1)
    moon_rasi_number = rasi_from_degree(moon_longitude)
    affected_janma_rasi_number = _chandrashtamam_affected_janma_rasi(moon_rasi_number)
    chandrashtamam_today_nakshatras = _chandrashtamam_today_nakshatras(nakshatra_number)

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
        yoga_ends_at=yoga_ends_at,
        yoga_next_name=_next_yoga_name(yoga_number),
        karana_name=_karana_name(karana_index),
        karana_ends_at=karana_ends_at,
        karana_next_name=_next_karana_name(karana_index),
        rahu_kalam=rahu,
        yamagandam=yama,
        kuligai=kuligai,
        gowri_panchangam=gowri_panchangam,
        nalla_neram=nalla_neram,
        gowri_nalla_neram=gowri_nalla_neram,
        abhijit_start=abhijit_start,
        abhijit_end=abhijit_end,
        abhijit_restricted=abhijit_restricted,
        is_subha_muhurtham=is_subha,
        subha_muhurtham_reason=subha_reason,
        is_subha_muhurtham_strict=is_subha_strict,
        subha_muhurtham_strict_reason=subha_strict_reason,
        hora=hora_entries,
        moon_phase_label=moon_phase_label,
        tithi_next_number=tithi_next_number,
        tithi_next_name=tithi_next_name,
        tithi_next_paksha=tithi_next_paksha,
        special_tithi_day_number=special_tithi_day_number,
        nakshatra_next_name=nakshatra_next_name,
        soolam_direction=soolam_direction,
        soolam_parigaram=soolam_parigaram,
        nethiram=nethiram,
        jeevan=jeevan,
        lagna_rasi_number=lagna_rasi_number,
        lagna_rasi_name=RASI_NAMES[lagna_rasi_number],
        lagna_ends_at=lagna_ends_at,
        lagna_nazhigai=lagna_nazhigai,
        lagna_vinadi=lagna_vinadi,
        amirdhadhi_yogam_name=amirdhadhi_yogam_name,
        amirdhadhi_yogam_ends_at=nakshatra_ends_at,
        amirdhadhi_yogam_next_name=amirdhadhi_yogam_next_name,
        chandrashtamam_moon_rasi_number=moon_rasi_number,
        chandrashtamam_moon_rasi_name=RASI_NAMES[moon_rasi_number],
        chandrashtamam_affected_janma_rasi_number=affected_janma_rasi_number,
        chandrashtamam_affected_janma_rasi_name=RASI_NAMES[affected_janma_rasi_number],
        chandrashtamam_today_nakshatras=chandrashtamam_today_nakshatras,
        warnings=warnings,
    )

    if use_cache and session is not None:
        _store_cached_snapshot(session, snapshot, DEFAULT_AYANAMSA_TYPE)
    return snapshot


def calculate_daily_panchangam_range(
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
) -> dict[date, PanchangamSnapshot]:
    """Compute panchangam snapshots for a date range with batched cache I/O.

    Replaces the per-day SELECT + DELETE that ``calculate_daily_panchangam``
    performs when called in a loop (e.g. for a monthly calendar) with a single
    bulk SELECT covering the whole range and a single purge call. Cache misses
    fall back to the regular per-day computation, which also stores its result.
    """
    if session is None:
        return {
            current: calculate_daily_panchangam(current, latitude, longitude, timezone_name, session=None)
            for current in _date_range(start_date, end_date)
        }

    purge_expired_panchangam_cache(session)
    cached = _load_cached_snapshots_in_range(
        session, start_date, end_date, latitude, longitude, DEFAULT_AYANAMSA_TYPE,
    )

    snapshots: dict[date, PanchangamSnapshot] = {}
    for current in _date_range(start_date, end_date):
        existing = cached.get(current)
        if existing is not None:
            snapshots[current] = existing
            continue
        computed = calculate_daily_panchangam(
            current, latitude, longitude, timezone_name, session=session, use_cache=False,
        )
        _store_cached_snapshot(session, computed, DEFAULT_AYANAMSA_TYPE)
        snapshots[current] = computed
    return snapshots


def _date_range(start_date: date, end_date: date) -> Iterator[date]:
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)

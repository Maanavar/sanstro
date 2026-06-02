from __future__ import annotations

from datetime import UTC, datetime

from app.calculations.astro import NAKSHATRA_NAMES, RASI_NAMES, house_from_reference, nakshatra_from_degree, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets

_PRASNA_QUESTION_AREAS = {
    "JOB": {"houses": [10, 6, 2, 11], "karaka": "MERCURY"},
    "MARRIAGE": {"houses": [7, 2, 8], "karaka": "VENUS"},
    "HEALTH": {"houses": [1, 6, 8, 12], "karaka": "SUN"},
    "FINANCE": {"houses": [2, 5, 9, 11], "karaka": "JUPITER"},
    "PROPERTY": {"houses": [4, 11], "karaka": "MARS"},
    "TRAVEL": {"houses": [3, 9, 12], "karaka": "MERCURY"},
    "LEGAL": {"houses": [6, 7, 8], "karaka": "MARS"},
    "CHILDREN": {"houses": [5, 9], "karaka": "JUPITER"},
    "GENERAL": {"houses": [1, 10], "karaka": "SUN"},
}


def _norm(longitude: float) -> float:
    return longitude % 360.0


def _moon_applying_to_karaka(moon_longitude: float, karaka_longitude: float) -> bool:
    sep = (_norm(karaka_longitude) - _norm(moon_longitude)) % 360.0
    return 0.0 < sep <= 180.0


def cast_prasna_chart(
    question_datetime_local: datetime,
    timezone_name: str,
    latitude: float,
    longitude: float,
    question_area: str = "GENERAL",
    ayanamsa_type: str = "LAHIRI",
) -> dict:
    _ = ayanamsa_type
    area_key = (question_area or "GENERAL").upper()
    area = _PRASNA_QUESTION_AREAS.get(area_key, _PRASNA_QUESTION_AREAS["GENERAL"])

    tz = resolve_timezone(timezone_name)
    if question_datetime_local.tzinfo is None:
        local_dt = question_datetime_local.replace(tzinfo=tz)
    else:
        local_dt = question_datetime_local.astimezone(tz)
    utc_dt = local_dt.astimezone(UTC)
    jd = utc_datetime_to_julian_day(utc_dt)

    lagna_longitude = calculate_lagna_degree(jd, latitude, longitude)
    prasna_lagna_rasi = int((_norm(lagna_longitude) // 30.0) + 1)
    transit = calculate_sidereal_planets(jd)
    moon = transit.bodies["MOON"]
    moon_rasi = moon.rasi
    moon_nakshatra = nakshatra_from_degree(moon.absolute_longitude)

    karaka = area["karaka"]
    karaka_body = transit.bodies[karaka]
    karaka_rasi = karaka_body.rasi
    karaka_house = house_from_reference(prasna_lagna_rasi, karaka_rasi)

    positive: list[str] = []
    negative: list[str] = []

    if karaka_house in {1, 4, 5, 7, 9, 10}:
        positive.append(f"{karaka} in kendra/trikona from Prasna Lagna")
    elif karaka_house in {3, 6, 11}:
        positive.append(f"{karaka} in upachaya house (results with effort/time)")
    else:
        negative.append(f"{karaka} in dusthana from Prasna Lagna")

    if _moon_applying_to_karaka(moon.absolute_longitude, karaka_body.absolute_longitude):
        positive.append("Moon applying toward karaka (Itthasala-type support)")
    else:
        negative.append("Moon not applying toward karaka")

    lagna_lord = SIGN_LORD[prasna_lagna_rasi]
    lagna_lord_house = house_from_reference(prasna_lagna_rasi, transit.bodies[lagna_lord].rasi)
    moon_house = house_from_reference(prasna_lagna_rasi, moon_rasi)
    if lagna_lord_house in {6, 8, 12}:
        negative.append("Lagna lord in dusthana")
    if moon_house in {6, 8, 12}:
        negative.append("Moon in dusthana")

    payload = {
        "prasna_lagna_rasi": prasna_lagna_rasi,
        "prasna_lagna_degree": lagna_longitude,
        "moon_rasi": moon_rasi,
        "moon_nakshatra": moon_nakshatra,
        "question_area": area_key,
        "relevant_houses": area["houses"],
        "karaka": karaka,
        "karaka_rasi": karaka_rasi,
        "karaka_house": karaka_house,
        "positive_indicators": positive,
        "negative_indicators": negative,
        "outlook": "MIXED",
        "outlook_ta": "கலப்பு நிலை",
        "outlook_en": "Mixed indications",
    }

    outlook = prasna_outlook(payload, {})
    if outlook == "FAVOURABLE":
        payload["outlook_ta"] = "சாதகமான குறியீடுகள் மேலோங்குகின்றன."
        payload["outlook_en"] = "Favourable indicators dominate."
    elif outlook == "UNFAVOURABLE":
        payload["outlook_ta"] = "சவால்கள் அதிகம்; கவனமாக நடப்பது நல்லது."
        payload["outlook_en"] = "Challenging indicators dominate; proceed carefully."
    elif outlook == "DELAY":
        payload["outlook_ta"] = "பலன் தாமதமாக கிடைக்கும்."
        payload["outlook_en"] = "Result is likely with delay."
    payload["outlook"] = outlook
    payload["moon_nakshatra_name"] = NAKSHATRA_NAMES[moon_nakshatra - 1]
    payload["prasna_lagna_name"] = RASI_NAMES[prasna_lagna_rasi]
    return payload


def prasna_outlook(
    prasna_chart: dict,
    lagna_nature_map: dict[str, str],
) -> str:
    _ = lagna_nature_map
    positives = len(prasna_chart.get("positive_indicators", []))
    negatives = len(prasna_chart.get("negative_indicators", []))
    karaka_house = int(prasna_chart.get("karaka_house", 0))

    if karaka_house in {3, 6, 10, 11} and positives >= negatives:
        return "DELAY"
    if positives >= 2 and negatives == 0:
        return "FAVOURABLE"
    if negatives >= 2 and positives == 0:
        return "UNFAVOURABLE"
    return "MIXED"

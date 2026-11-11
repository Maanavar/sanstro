from __future__ import annotations

from datetime import UTC, datetime
from typing import TypedDict

from app.calculations.astro import (
    NAKSHATRA_NAMES,
    RASI_NAMES,
    house_from_reference,
    nakshatra_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets


class _QuestionArea(TypedDict):
    houses: list[int]
    karaka: str


# Typed: a bare dict literal joins the two value types to Sequence[object], and
# `area["karaka"]` then stops being a planet name.
_PRASNA_QUESTION_AREAS: dict[str, _QuestionArea] = {
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


def _karaka_placement(karaka: str, karaka_house: int) -> tuple[bool, str, int]:
    """(is_positive, indicator line, rank) for a karaka's house from the
    Prasna Lagna. Rank orders placements best-first (0 = kendra/trikona)."""
    if karaka_house in {1, 4, 5, 7, 9, 10}:
        return True, f"{karaka} in kendra/trikona from Prasna Lagna", 0
    if karaka_house in {3, 6, 11}:
        return True, f"{karaka} in upachaya house (results with effort/time)", 1
    if karaka_house == 2:
        # FAA-19: the 2nd is a maraka sthana, not a dusthana. Same weight as
        # before (one negative); only the label was wrong.
        return False, f"{karaka} in the 2nd house (a maraka sthana) from Prasna Lagna", 2
    return False, f"{karaka} in dusthana from Prasna Lagna", 3


def _stated_gender(gender: str | None) -> str | None:
    """FAA-16 policy (docs/FAA_DECISIONS_2026-11-11.md §2): only an explicit
    "female" / "male" is stated; anything else is unknown. Never inferred."""
    g = (gender or "").strip().lower()
    return g if g in {"female", "male"} else None


def cast_prasna_chart(
    question_datetime_local: datetime,
    timezone_name: str,
    latitude: float,
    longitude: float,
    question_area: str = "GENERAL",
    ayanamsa_type: str = "LAHIRI",
    querent_gender: str | None = None,
) -> dict:
    """``querent_gender`` is the querent's stated ``gender_for_traditional_rules``
    and is read only for a MARRIAGE question (FAA-16)."""
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

    def house_of(graha: str) -> int:
        return house_from_reference(prasna_lagna_rasi, transit.bodies[graha].rasi)

    # FAA-16: a marriage question reads the spouse karaka for the querent's
    # STATED gender — Guru for a woman, Sukran for a man — and notes the other
    # as the secondary significator. Gender unknown: both are equal (a Vinaadi
    # policy, as in marriage_service's gate), so the better-placed one is read
    # and the other noted. The verdict is counted from the primary alone, as
    # it always was; the secondary line says it is not counted.
    karaka = area["karaka"]
    secondary_karaka: str | None = None
    gender = _stated_gender(querent_gender) if area_key == "MARRIAGE" else None
    if area_key == "MARRIAGE":
        if gender == "female":
            karaka, secondary_karaka = "JUPITER", "VENUS"
        elif gender == "male":
            karaka, secondary_karaka = "VENUS", "JUPITER"
        else:
            # Tie keeps Venus first: the karaka this question read before FAA-16.
            karaka, secondary_karaka = sorted(
                ("VENUS", "JUPITER"), key=lambda g: _karaka_placement(g, house_of(g))[2]
            )
    karaka_body = transit.bodies[karaka]
    karaka_rasi = karaka_body.rasi
    karaka_house = house_of(karaka)

    positive: list[str] = []
    negative: list[str] = []

    is_positive, line, _rank = _karaka_placement(karaka, karaka_house)
    (positive if is_positive else negative).append(line)

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

    # Appended AFTER the verdict so it cannot move it (see FAA-16 note above).
    payload["secondary_karaka"] = secondary_karaka
    payload["querent_gender"] = gender
    if secondary_karaka is not None:
        role = "secondary spouse significator" if gender else "the other marriage significator"
        sec_positive, sec_line, _ = _karaka_placement(secondary_karaka, house_of(secondary_karaka))
        (positive if sec_positive else negative).append(f"{sec_line} ({role}; noted, not counted)")
        if gender is None:
            # A disclosure, not a challenge: it rides on the verdict text
            # (bilingual), never in the negative list the outlook counts.
            for key in ("outlook_ta", "outlook_en"):
                text = str(payload[key])
                payload[key] = text if text.endswith(".") else text + "."
            payload["outlook_ta"] = str(payload["outlook_ta"]) + (
                " பாலினம் குறிப்பிடப்படாததால் குருவும் சுக்கிரனும் சமமாகப் பார்க்கப்பட்டு, "
                "நன்றாக அமைந்த கிரகம் எடுத்துக்கொள்ளப்பட்டது."
            )
            payload["outlook_en"] = str(payload["outlook_en"]) + (
                " Gender is not given, so Guru and Venus are read equally and the better-placed "
                "one is used (a Vinaadi policy, not a traditional rule)."
            )

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

    # DELAY houses are the pure upachaya set {3, 6, 11} (L-15) — matching
    # this module's own karaka-placement split above, which already treats
    # the 10th as kendra (positive), not upachaya. The 10th was previously
    # double-counted in both sets, so a 10th-house karaka could earn a
    # positive indicator and a DELAY verdict at the same time.
    if karaka_house in {3, 6, 11} and positives >= negatives:
        return "DELAY"
    if positives >= 2 and negatives == 0:
        return "FAVOURABLE"
    if negatives >= 2 and positives == 0:
        return "UNFAVOURABLE"
    return "MIXED"

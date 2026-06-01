"""
Life event window service — P1-A.

Returns 3-5 year forward-looking windows for CAREER, MARRIAGE, STUDIES,
RELOCATION, and HEALTH_CAUTION events with HIGH/MEDIUM/LOW confidence tiers.

Confidence = count of independent signals (natal promise, dasha timing, gochar):
  HIGH   ≥ 3 signals
  MEDIUM = 2 signals
  LOW    = 1 signal (dasha alone, no gochar or natal corroboration)
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from typing import Literal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import get_jupiter_aspects
from app.models import BirthProfile, Chart
from app.schemas.dasha import ResponseMeta
from app.schemas.life_events import BiText, LifeEventWindow, LifeEventsResponse, LifeEventsResponseData
from app.services.chart_service import load_persisted_chart_response


# ── Bilingual helper ──────────────────────────────────────────────────────────

def _t(ta: str, en: str) -> BiText:
    return BiText(ta=ta, en=en)


# ── Reason catalog ────────────────────────────────────────────────────────────

_REASON_TA: dict[str, str] = {
    "7th_lord_dasha_active":    "7ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "venus_dasha_active":       "சுக்கிரன் தசை நடப்பில் உள்ளது",
    "jupiter_supports_7th":     "குரு 7ஆம் இடத்தை பார்க்கிறது அல்லது நிற்கிறது",
    "venus_transits_7th":       "சுக்கிரன் 7ஆம் இடத்தில் சஞ்சாரம்",
    "10th_lord_dasha_active":   "10ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "sun_dasha_active":         "சூரியன் தசை நடப்பில் உள்ளது",
    "mercury_dasha_active":     "புதன் தசை நடப்பில் உள்ளது",
    "jupiter_supports_10th":    "குரு 10ஆம் இடத்தை பார்க்கிறது அல்லது நிற்கிறது",
    "sun_transits_10th":        "சூரியன் 10ஆம் இடத்தில் சஞ்சாரம்",
    "4th_lord_dasha_active":    "4ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "5th_lord_dasha_active":    "5ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "jupiter_dasha_active":     "குரு தசை நடப்பில் உள்ளது",
    "mercury_supports_4th":     "புதன் 4ஆம் இடத்தை பார்க்கிறது அல்லது நிற்கிறது",
    "jupiter_supports_5th":     "குரு 5ஆம் இடத்தை பார்க்கிறது அல்லது நிற்கிறது",
    "12th_lord_dasha_active":   "12ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "rahu_dasha_active":        "ராகு தசை நடப்பில் உள்ளது",
    "saturn_transits_12th":     "சனி 12ஆம் இடத்தில் சஞ்சாரம்",
    "rahu_transits_key_house":  "ராகு முக்கிய இடத்தில் சஞ்சாரம்",
    "6th_lord_dasha_active":    "6ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "8th_lord_dasha_active":    "8ஆம் இட அதிபதி தசை நடப்பில் உள்ளது",
    "saturn_dasha_active":      "சனி தசை நடப்பில் உள்ளது",
    "saturn_supports_6th":      "சனி 6ஆம் இடத்தை பார்க்கிறது அல்லது நிற்கிறது",
    "mars_transits_6th":        "செவ்வாய் 6ஆம் இடத்தில் சஞ்சாரம்",
    "natal_promise_strong":     "ஜாதகத்தில் வலுவான ஆதரவு உள்ளது",
}

_REASON_EN: dict[str, str] = {
    "7th_lord_dasha_active":    "7th lord dasha is active",
    "venus_dasha_active":       "Venus dasha is active",
    "jupiter_supports_7th":     "Jupiter aspects or occupies the 7th house",
    "venus_transits_7th":       "Venus transits the 7th house",
    "10th_lord_dasha_active":   "10th lord dasha is active",
    "sun_dasha_active":         "Sun dasha is active",
    "mercury_dasha_active":     "Mercury dasha is active",
    "jupiter_supports_10th":    "Jupiter aspects or occupies the 10th house",
    "sun_transits_10th":        "Sun transits the 10th house",
    "4th_lord_dasha_active":    "4th lord dasha is active",
    "5th_lord_dasha_active":    "5th lord dasha is active",
    "jupiter_dasha_active":     "Jupiter dasha is active",
    "mercury_supports_4th":     "Mercury aspects or occupies the 4th house",
    "jupiter_supports_5th":     "Jupiter aspects or occupies the 5th house",
    "12th_lord_dasha_active":   "12th lord dasha is active",
    "rahu_dasha_active":        "Rahu dasha is active",
    "saturn_transits_12th":     "Saturn transits the 12th house",
    "rahu_transits_key_house":  "Rahu transits a key house",
    "6th_lord_dasha_active":    "6th lord dasha is active",
    "8th_lord_dasha_active":    "8th lord dasha is active",
    "saturn_dasha_active":      "Saturn dasha is active",
    "saturn_supports_6th":      "Saturn aspects or occupies the 6th house",
    "mars_transits_6th":        "Mars transits the 6th house",
    "natal_promise_strong":     "Strong natal promise for this event",
}


def _reason_bitext(key: str) -> BiText:
    return _t(_REASON_TA.get(key, key), _REASON_EN.get(key, key))


# ── House helpers ─────────────────────────────────────────────────────────────

def _house_rasi(lagna_rasi: int, house_num: int) -> int:
    return ((lagna_rasi + house_num - 2) % 12) + 1


def _lord_of(lagna_rasi: int, house_num: int) -> str:
    return SIGN_LORD[_house_rasi(lagna_rasi, house_num)]


# ── Confidence tier ───────────────────────────────────────────────────────────

def _confidence(signal_count: int) -> Literal["HIGH", "MEDIUM", "LOW"]:
    if signal_count >= 3:
        return "HIGH"
    if signal_count >= 2:
        return "MEDIUM"
    return "LOW"


def _compute_age(on_date: date, birth_date: date) -> int:
    return on_date.year - birth_date.year - ((on_date.month, on_date.day) < (birth_date.month, birth_date.day))


# ── Per-event window finders ──────────────────────────────────────────────────

def _marriage_windows(lagna_rasi: int, birth_jd: float, moon_lon: float, from_year: int, to_year: int) -> list[dict]:
    seventh_rasi = _house_rasi(lagna_rasi, 7)
    seventh_lord = _lord_of(lagna_rasi, 7)
    results: list[dict] = []

    for year in range(from_year, to_year + 1):
        anchor_jd = utc_datetime_to_julian_day(datetime(year, 7, 1, 12, 0, tzinfo=UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

        dasha_reasons: list[str] = []
        if seventh_lord in active_lords:
            dasha_reasons.append("7th_lord_dasha_active")
        if "VENUS" in active_lords:
            dasha_reasons.append("venus_dasha_active")
        if not dasha_reasons:
            continue

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        venus_rasi = transit.bodies["VENUS"].rasi

        gochar_reasons: list[str] = []
        if seventh_rasi in get_jupiter_aspects(jupiter_rasi) or jupiter_rasi == seventh_rasi:
            gochar_reasons.append("jupiter_supports_7th")
        if venus_rasi == seventh_rasi:
            gochar_reasons.append("venus_transits_7th")

        signals = len(dasha_reasons) + len(gochar_reasons)
        if signals == 0:
            continue

        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
        results.append({
            "event_type": "MARRIAGE",
            "start_date": date(year, 7, 1),
            "end_date": date(year, 12, 31),
            "confidence": _confidence(signals),
            "reasons": dasha_reasons + gochar_reasons,
            "dasha_ta": f"{maha} - {antar} தசை நடப்பில்",
            "dasha_en": f"{maha} - {antar} dasha active",
            "gochar_ta": f"குரு {jupiter_rasi}ஆம் ராசியில் சஞ்சாரம்",
            "gochar_en": f"Jupiter transiting rasi {jupiter_rasi}",
        })

    return results


def _career_windows(lagna_rasi: int, birth_jd: float, moon_lon: float, from_year: int, to_year: int) -> list[dict]:
    tenth_rasi = _house_rasi(lagna_rasi, 10)
    tenth_lord = _lord_of(lagna_rasi, 10)
    results: list[dict] = []

    for year in range(from_year, to_year + 1):
        anchor_jd = utc_datetime_to_julian_day(datetime(year, 7, 1, 12, 0, tzinfo=UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

        dasha_reasons: list[str] = []
        if tenth_lord in active_lords:
            dasha_reasons.append("10th_lord_dasha_active")
        if "SUN" in active_lords:
            dasha_reasons.append("sun_dasha_active")
        if "MERCURY" in active_lords:
            dasha_reasons.append("mercury_dasha_active")
        if not dasha_reasons:
            continue

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        sun_rasi = transit.bodies["SUN"].rasi

        gochar_reasons: list[str] = []
        if tenth_rasi in get_jupiter_aspects(jupiter_rasi) or jupiter_rasi == tenth_rasi:
            gochar_reasons.append("jupiter_supports_10th")
        if sun_rasi == tenth_rasi:
            gochar_reasons.append("sun_transits_10th")

        signals = len(dasha_reasons) + len(gochar_reasons)
        if signals == 0:
            continue

        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
        results.append({
            "event_type": "CAREER",
            "start_date": date(year, 7, 1),
            "end_date": date(year, 12, 31),
            "confidence": _confidence(signals),
            "reasons": dasha_reasons + gochar_reasons,
            "dasha_ta": f"{maha} - {antar} தசை நடப்பில்",
            "dasha_en": f"{maha} - {antar} dasha active",
            "gochar_ta": f"குரு {jupiter_rasi}ஆம் ராசியில் சஞ்சாரம்",
            "gochar_en": f"Jupiter transiting rasi {jupiter_rasi}",
        })

    return results


def _studies_windows(lagna_rasi: int, birth_jd: float, moon_lon: float, from_year: int, to_year: int) -> list[dict]:
    fourth_rasi = _house_rasi(lagna_rasi, 4)
    fifth_rasi = _house_rasi(lagna_rasi, 5)
    fourth_lord = _lord_of(lagna_rasi, 4)
    fifth_lord = _lord_of(lagna_rasi, 5)
    results: list[dict] = []

    for year in range(from_year, to_year + 1):
        anchor_jd = utc_datetime_to_julian_day(datetime(year, 7, 1, 12, 0, tzinfo=UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

        dasha_reasons: list[str] = []
        if fourth_lord in active_lords:
            dasha_reasons.append("4th_lord_dasha_active")
        if fifth_lord in active_lords:
            dasha_reasons.append("5th_lord_dasha_active")
        if "JUPITER" in active_lords:
            dasha_reasons.append("jupiter_dasha_active")
        if "MERCURY" in active_lords:
            dasha_reasons.append("mercury_dasha_active")
        if not dasha_reasons:
            continue

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        mercury_rasi = transit.bodies["MERCURY"].rasi

        gochar_reasons: list[str] = []
        jup_aspects = get_jupiter_aspects(jupiter_rasi)
        if mercury_rasi == fourth_rasi or fourth_rasi in jup_aspects:
            gochar_reasons.append("mercury_supports_4th")
        if fifth_rasi in jup_aspects or jupiter_rasi == fifth_rasi:
            gochar_reasons.append("jupiter_supports_5th")

        signals = len(dasha_reasons) + len(gochar_reasons)
        if signals == 0:
            continue

        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
        results.append({
            "event_type": "STUDIES",
            "start_date": date(year, 7, 1),
            "end_date": date(year, 12, 31),
            "confidence": _confidence(signals),
            "reasons": dasha_reasons + gochar_reasons,
            "dasha_ta": f"{maha} - {antar} தசை நடப்பில்",
            "dasha_en": f"{maha} - {antar} dasha active",
            "gochar_ta": f"குரு {jupiter_rasi}ஆம் ராசியில் சஞ்சாரம்",
            "gochar_en": f"Jupiter transiting rasi {jupiter_rasi}",
        })

    return results


def _relocation_windows(lagna_rasi: int, birth_jd: float, moon_lon: float, from_year: int, to_year: int) -> list[dict]:
    twelfth_rasi = _house_rasi(lagna_rasi, 12)
    twelfth_lord = _lord_of(lagna_rasi, 12)
    results: list[dict] = []

    for year in range(from_year, to_year + 1):
        anchor_jd = utc_datetime_to_julian_day(datetime(year, 7, 1, 12, 0, tzinfo=UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

        dasha_reasons: list[str] = []
        if twelfth_lord in active_lords:
            dasha_reasons.append("12th_lord_dasha_active")
        if "RAHU" in active_lords:
            dasha_reasons.append("rahu_dasha_active")
        if not dasha_reasons:
            continue

        transit = calculate_sidereal_planets(anchor_jd)
        saturn_rasi = transit.bodies["SATURN"].rasi
        rahu_rasi = transit.bodies.get("RAHU", transit.bodies.get("MEAN_NODE"))
        rahu_rasi_val = rahu_rasi.rasi if rahu_rasi else 0

        gochar_reasons: list[str] = []
        if saturn_rasi == twelfth_rasi:
            gochar_reasons.append("saturn_transits_12th")
        if rahu_rasi_val in (twelfth_rasi, _house_rasi(lagna_rasi, 1), _house_rasi(lagna_rasi, 7)):
            gochar_reasons.append("rahu_transits_key_house")

        signals = len(dasha_reasons) + len(gochar_reasons)
        if signals == 0:
            continue

        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
        results.append({
            "event_type": "RELOCATION",
            "start_date": date(year, 7, 1),
            "end_date": date(year, 12, 31),
            "confidence": _confidence(signals),
            "reasons": dasha_reasons + gochar_reasons,
            "dasha_ta": f"{maha} - {antar} தசை நடப்பில்",
            "dasha_en": f"{maha} - {antar} dasha active",
            "gochar_ta": f"சனி {saturn_rasi}ஆம் ராசியில் சஞ்சாரம்",
            "gochar_en": f"Saturn transiting rasi {saturn_rasi}",
        })

    return results


def _health_caution_windows(lagna_rasi: int, birth_jd: float, moon_lon: float, from_year: int, to_year: int) -> list[dict]:
    sixth_rasi = _house_rasi(lagna_rasi, 6)
    sixth_lord = _lord_of(lagna_rasi, 6)
    eighth_lord = _lord_of(lagna_rasi, 8)
    results: list[dict] = []

    for year in range(from_year, to_year + 1):
        anchor_jd = utc_datetime_to_julian_day(datetime(year, 7, 1, 12, 0, tzinfo=UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

        dasha_reasons: list[str] = []
        if sixth_lord in active_lords:
            dasha_reasons.append("6th_lord_dasha_active")
        if eighth_lord in active_lords:
            dasha_reasons.append("8th_lord_dasha_active")
        if "SATURN" in active_lords:
            dasha_reasons.append("saturn_dasha_active")
        if not dasha_reasons:
            continue

        transit = calculate_sidereal_planets(anchor_jd)
        saturn_rasi = transit.bodies["SATURN"].rasi
        mars_rasi = transit.bodies["MARS"].rasi

        gochar_reasons: list[str] = []
        sat_aspects = get_jupiter_aspects(saturn_rasi)  # same aspect pattern: 3,7,10
        if saturn_rasi == sixth_rasi or sixth_rasi in sat_aspects:
            gochar_reasons.append("saturn_supports_6th")
        if mars_rasi == sixth_rasi:
            gochar_reasons.append("mars_transits_6th")

        signals = len(dasha_reasons) + len(gochar_reasons)
        if signals == 0:
            continue

        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
        results.append({
            "event_type": "HEALTH_CAUTION",
            "start_date": date(year, 7, 1),
            "end_date": date(year, 12, 31),
            "confidence": _confidence(signals),
            "reasons": dasha_reasons + gochar_reasons,
            "dasha_ta": f"{maha} - {antar} தசை நடப்பில்",
            "dasha_en": f"{maha} - {antar} dasha active",
            "gochar_ta": f"சனி {saturn_rasi}ஆம் ராசியில் சஞ்சாரம்",
            "gochar_en": f"Saturn transiting rasi {saturn_rasi}",
        })

    return results


# ── Headline builder ──────────────────────────────────────────────────────────

_HEADLINE_TA: dict[str, dict[str, str]] = {
    "MARRIAGE": {
        "HIGH":   "திருமண வாய்ப்பு மிகவும் சாதகமான காலம்",
        "MEDIUM": "திருமண வாய்ப்பு உள்ள காலம்",
        "LOW":    "திருமண பேச்சுவார்த்தைக்கு கவனிக்க வேண்டிய காலம்",
    },
    "CAREER": {
        "HIGH":   "தொழில் முன்னேற்றத்திற்கு மிகவும் சாதகமான காலம்",
        "MEDIUM": "தொழில் வளர்ச்சி சாத்தியமான காலம்",
        "LOW":    "தொழில் மாற்றத்திற்கு கவனிக்க வேண்டிய காலம்",
    },
    "STUDIES": {
        "HIGH":   "கல்வி மற்றும் சான்றிதழுக்கு மிகவும் சாதகமான காலம்",
        "MEDIUM": "கல்வி வளர்ச்சிக்கு நல்ல ஆதரவுள்ள காலம்",
        "LOW":    "கற்றலுக்கு கவனிக்க வேண்டிய காலம்",
    },
    "RELOCATION": {
        "HIGH":   "இடமாற்றம் அல்லது பயணத்திற்கு மிகவும் சாதகமான காலம்",
        "MEDIUM": "இடமாற்றம் சாத்தியமான காலம்",
        "LOW":    "இடமாற்றத்தை கவனிக்க வேண்டிய காலம்",
    },
    "HEALTH_CAUTION": {
        "HIGH":   "உடல்நலத்தில் கவனம் தேவைப்படும் காலம்",
        "MEDIUM": "சாதாரண உடல்நல கவனம் தேவையான காலம்",
        "LOW":    "உடல்நலத்தை கண்காணிக்க வேண்டிய காலம்",
    },
}

_HEADLINE_EN: dict[str, dict[str, str]] = {
    "MARRIAGE": {
        "HIGH":   "Highly favourable period for marriage prospects",
        "MEDIUM": "Moderate marriage opportunity window",
        "LOW":    "Period worth watching for marriage discussions",
    },
    "CAREER": {
        "HIGH":   "Highly favourable period for career advancement",
        "MEDIUM": "Career growth is possible during this window",
        "LOW":    "Period worth watching for career changes",
    },
    "STUDIES": {
        "HIGH":   "Highly favourable period for education and qualifications",
        "MEDIUM": "Good support for educational progress",
        "LOW":    "Period worth watching for learning opportunities",
    },
    "RELOCATION": {
        "HIGH":   "Highly favourable period for relocation or travel abroad",
        "MEDIUM": "Relocation is possible during this window",
        "LOW":    "Period worth watching for relocation possibilities",
    },
    "HEALTH_CAUTION": {
        "HIGH":   "Period requiring careful attention to health",
        "MEDIUM": "Moderate health caution advised",
        "LOW":    "Period to gently monitor health",
    },
}


def _headline(event_type: str, confidence: str) -> BiText:
    return _t(
        _HEADLINE_TA[event_type][confidence],
        _HEADLINE_EN[event_type][confidence],
    )


# ── Auth helper ───────────────────────────────────────────────────────────────

def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


# ── Public entry point ────────────────────────────────────────────────────────

def get_life_event_windows(
    session: Session,
    chart_id: UUID,
    as_of_date: date,
    years_ahead: int,
    *,
    owner_user_id: UUID,
) -> LifeEventsResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)

    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    lagna_rasi = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day
    birth_profile = chart_snapshot.data.birth_profile
    native_age = _compute_age(as_of_date, birth_profile.birth_date_local)
    marital_status = (getattr(birth_profile, "marital_status", None) or "").strip().lower()
    employment_type = (getattr(birth_profile, "employment_type", None) or "").strip().lower()
    is_student = employment_type == "student"
    is_retired = employment_type == "retired"

    from_year = as_of_date.year
    to_year = as_of_date.year + max(1, min(years_ahead, 10))

    raw: list[dict] = []
    allow_marriage = native_age >= 18 and marital_status != "married"
    allow_career = native_age >= 18 and not is_student and not is_retired
    allow_studies = native_age <= 25 or is_student
    allow_relocation = native_age >= 18

    if allow_marriage:
        raw.extend(_marriage_windows(lagna_rasi, birth_jd, natal_moon.absolute_longitude, from_year, to_year))
    if allow_career:
        raw.extend(_career_windows(lagna_rasi, birth_jd, natal_moon.absolute_longitude, from_year, to_year))
    if allow_studies:
        raw.extend(_studies_windows(lagna_rasi, birth_jd, natal_moon.absolute_longitude, from_year, to_year))
    if allow_relocation:
        raw.extend(_relocation_windows(lagna_rasi, birth_jd, natal_moon.absolute_longitude, from_year, to_year))
    raw.extend(_health_caution_windows(lagna_rasi, birth_jd, natal_moon.absolute_longitude, from_year, to_year))

    windows: list[LifeEventWindow] = []
    for w in raw:
        conf: Literal["HIGH", "MEDIUM", "LOW"] = w["confidence"]
        windows.append(LifeEventWindow(
            eventType=w["event_type"],
            startDate=w["start_date"],
            endDate=w["end_date"],
            confidence=conf,
            headline=_headline(w["event_type"], conf),
            reasons=[_reason_bitext(r) for r in w["reasons"]],
            dashaSupport=_t(w["dasha_ta"], w["dasha_en"]),
            gocharSupport=_t(w["gochar_ta"], w["gochar_en"]),
        ))

    windows.sort(key=lambda x: (x.start_date, x.event_type))

    return LifeEventsResponse(
        data=LifeEventsResponseData(
            chartId=str(chart_id),
            asOfDate=as_of_date,
            yearsAhead=years_ahead,
            windows=windows,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

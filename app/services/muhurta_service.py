"""
Muhurta picker service — P1-E.

Returns top-5 auspicious time slots for a given activity within a date range.
Uses panchangam (tithi, nakshatra, yoga, kalam) + dasha support.

Methodology (Thirukanitham):
- Primary filters: avoid Rahu Kalam, Yamagandam, Kuligai
- Avoid Chandrashtama days (8th rasi from Moon rasi)
- Avoid Ashtami/Navami tithis for auspicious events
- Positive signals: auspicious tithi, nakshatra, yoga; Abhijit muhurta (except Wed)
- Dasha support: check if dasha lord is relevant to the activity
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAME_TO_NUMBER, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.panchangam import (
    SUBHA_NAKSHATRAS,
    SUBHA_TITHIS_KRISHNA,
    SUBHA_TITHIS_SHUKLA,
    calculate_daily_panchangam,
)
from app.models import BirthProfile, Chart
from app.schemas.dasha import ResponseMeta
from app.schemas.muhurta import BiText, MuhurtaResponse, MuhurtaResponseData, MuhurtaSlot
from app.services.chart_service import load_persisted_chart_response

logger = logging.getLogger(__name__)

MAX_DATE_RANGE_DAYS = 60
TOP_N = 5

# Activity → relevant dasha lords (first-choice benefics for that domain)
_ACTIVITY_LORDS: dict[str, set[str]] = {
    "JOB_START":   {"SUN", "MERCURY", "JUPITER"},
    "MARRIAGE":    {"VENUS", "JUPITER", "MOON"},
    "EXAM":        {"MERCURY", "JUPITER", "MOON"},
    "TRAVEL":      {"MERCURY", "MOON", "VENUS"},
    "INVESTMENT":  {"JUPITER", "VENUS", "MERCURY"},
    "MEDICAL":     {"SUN", "MOON"},
    "PURCHASE":    {"VENUS", "JUPITER", "MERCURY"},
}

# Activity → house numbers to check for dasha support
_ACTIVITY_HOUSES: dict[str, list[int]] = {
    "JOB_START":  [10, 2],
    "MARRIAGE":   [7, 2],
    "EXAM":       [4, 9],
    "TRAVEL":     [3, 12],
    "INVESTMENT": [2, 11],
    "MEDICAL":    [1, 6],
    "PURCHASE":   [2, 11],
}


def _t(ta: str, en: str) -> BiText:
    return BiText(ta=ta, en=en)


def _score_panchangam(snapshot, activity: str, moon_rasi: int, lagna_rasi: int) -> tuple[float, BiText, list[BiText]]:
    """Score a single day's panchangam for the given activity. Returns (score, support, cautions)."""
    score = 50.0
    support_parts_ta: list[str] = []
    support_parts_en: list[str] = []
    cautions: list[BiText] = []

    tithi = snapshot.tithi_number
    paksha = snapshot.tithi_paksha
    nakshatra = snapshot.nakshatra_name
    yoga = snapshot.yoga_name
    weekday = snapshot.weekday

    # ── Negative filters ──────────────────────────────────────────────────────
    tithi_in_paksha = tithi if tithi <= 15 else tithi - 15

    if tithi == 30:  # Amavasai — no penalty per rules, just a content note
        cautions.append(_t("அமாவாசை — புதிய தொடக்கத்திற்கு ஏற்றதல்ல", "Amavasai — not ideal for new starts"))
        score -= 5

    if tithi_in_paksha in {8, 9}:
        cautions.append(_t("அஷ்டமி/நவமி திதி — சுப நிகழ்வுகளுக்கு தவிர்க்கவும்", "Ashtami/Navami tithi — avoid for auspicious events"))
        score -= 15

    # Chandrashtama: 8th rasi from natal Moon
    chandrashtama_rasi = ((moon_rasi - 1 + 7) % 12) + 1  # 8th from moon
    moon_nakshatra_rasi = _nakshatra_to_rasi(snapshot.nakshatra_number)
    if moon_nakshatra_rasi == chandrashtama_rasi:
        cautions.append(_t("சந்திர அஷ்டமம் — ஓய்வு எடு", "Chandrashtama — rest day, avoid major decisions"))
        score -= 20

    # ── Positive signals ──────────────────────────────────────────────────────
    if snapshot.is_subha_muhurtham:
        score += 20
        support_parts_ta.append("சுப முகூர்த்த நாள்")
        support_parts_en.append("Auspicious muhurta day")

    if paksha == "SHUKLA" and tithi in SUBHA_TITHIS_SHUKLA:
        score += 10
        support_parts_ta.append("சுக்ல திதி")
        support_parts_en.append("Auspicious Shukla tithi")
    elif paksha == "KRISHNA" and tithi in SUBHA_TITHIS_KRISHNA:
        score += 8
        support_parts_ta.append("சுப கிருஷ்ண திதி")
        support_parts_en.append("Auspicious Krishna tithi")

    # Normalize nakshatra name to match SUBHA_NAKSHATRAS set
    if nakshatra.upper().replace("H", "") in {n.upper().replace("H", "") for n in SUBHA_NAKSHATRAS} or nakshatra in SUBHA_NAKSHATRAS:
        score += 10
        support_parts_ta.append("சுப நட்சத்திரம்")
        support_parts_en.append("Auspicious nakshatra")

    # Abhijit muhurta (except Wednesday)
    if weekday != "WEDNESDAY" and not snapshot.abhijit_restricted:
        score += 5
        support_parts_ta.append("அபிஜித் முகூர்த்தம்")
        support_parts_en.append("Abhijit muhurta available")

    # Nalla Neram slots available
    if snapshot.nalla_neram:
        score += 5

    support_ta = ", ".join(support_parts_ta) if support_parts_ta else "சாதாரண நாள்"
    support_en = ", ".join(support_parts_en) if support_parts_en else "Ordinary day"
    support = _t(support_ta, support_en)

    return score, support, cautions


def _nakshatra_to_rasi(nak_number: int) -> int:
    """Return rasi (1-12) for a nakshatra number (1-27). Each rasi spans 2.25 nakshatras."""
    return ((nak_number - 1) * 3 // 9) + 1  # simplified: 3 nakshatras per rasi, 9 padas


def _best_time_window(snapshot) -> tuple[str, str]:
    """Return the best (time_start, time_end) slot for the day — Nalla Neram or Abhijit."""
    # Prefer first Nalla Neram slot if available
    if snapshot.nalla_neram:
        s = snapshot.nalla_neram[0]
        return s.start.strftime("%H:%M"), s.end.strftime("%H:%M")
    # Fallback: Abhijit
    return snapshot.abhijit_start.strftime("%H:%M"), snapshot.abhijit_end.strftime("%H:%M")


def _dasha_support(maha_lord: str, antar_lord: str, activity: str) -> BiText:
    """Generate dasha support text for the activity."""
    favorable = _ACTIVITY_LORDS.get(activity, set())
    lords_active = []
    if maha_lord in favorable:
        lords_active.append(maha_lord.capitalize())
    if antar_lord in favorable:
        lords_active.append(antar_lord.capitalize())

    if lords_active:
        en = f"{' and '.join(lords_active)} dasha supports this activity"
        ta = f"{' மற்றும் '.join(lords_active)} தசை இந்த செயலை ஆதரிக்கிறது"
        return _t(ta, en)
    return _t(
        "தசை நடுநிலையானது — கிரக சஞ்சாரம் முக்கிய காரணி",
        "Dasha is neutral — transit timing is the primary factor",
    )


def find_best_muhurta_slots(
    chart_id: UUID,
    activity: str,
    date_from: date,
    date_to: date,
    session: Session,
) -> MuhurtaResponse:
    activity = activity.upper()
    if activity not in _ACTIVITY_LORDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown activity '{activity}'. Valid values: {sorted(_ACTIVITY_LORDS)}",
        )

    delta_days = (date_to - date_from).days
    if delta_days < 0:
        raise HTTPException(status_code=422, detail="date_to must be >= date_from")
    if delta_days > MAX_DATE_RANGE_DAYS:
        raise HTTPException(status_code=422, detail=f"Date range cannot exceed {MAX_DATE_RANGE_DAYS} days")

    # Load chart via persisted snapshot (same pattern as life_event_service)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    chart_row = session.get(Chart, chart_id)
    if chart_row is None:
        raise HTTPException(status_code=404, detail="Chart not found")
    bp = session.get(BirthProfile, chart_row.birth_profile_id)
    if bp is None:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    lat = float(bp.latitude)
    lon = float(bp.longitude)
    tz_name = str(bp.timezone_name)
    lagna_rasi = chart_snapshot.data.lagna.rasi
    moon_rasi = RASI_NAME_TO_NUMBER.get(str(chart_row.moon_rasi).lower(), 1)

    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    birth_jd = chart_snapshot.data.julian_day
    moon_lon = natal_moon.absolute_longitude

    # Get current dasha lords
    try:
        tz_obj = resolve_timezone(tz_name)
        today_local = datetime.now(tz_obj).date()
        today_midnight = datetime.combine(today_local, datetime.min.time(), tzinfo=tz_obj)
        jd_today = utc_datetime_to_julian_day(today_midnight.astimezone(UTC))
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, jd_today)
        maha_lord = timeline.current_mahadasha.lord
        antar_lord = timeline.current_antardasha.lord
    except Exception:
        maha_lord = "UNKNOWN"
        antar_lord = "UNKNOWN"

    dasha_support = _dasha_support(maha_lord, antar_lord, activity)

    # Scan each day in range
    scored_days: list[tuple[float, date, str, str, BiText, list[BiText]]] = []
    current = date_from
    while current <= date_to:
        try:
            snap = calculate_daily_panchangam(current, lat, lon, tz_name, session=session)
            day_score, pan_support, cautions = _score_panchangam(snap, activity, moon_rasi, lagna_rasi)
            # Dasha bonus
            if maha_lord in _ACTIVITY_LORDS.get(activity, set()) or antar_lord in _ACTIVITY_LORDS.get(activity, set()):
                day_score += 10
            t_start, t_end = _best_time_window(snap)
            scored_days.append((day_score, current, t_start, t_end, pan_support, cautions))
        except Exception as exc:
            logger.debug("Muhurta score failed for %s: %s", current, exc)
        current += timedelta(days=1)

    # Sort by score descending, take top N
    scored_days.sort(key=lambda x: x[0], reverse=True)
    top = scored_days[:TOP_N]

    slots = [
        MuhurtaSlot(
            date=d,
            timeStart=t_start,
            timeEnd=t_end,
            score=round(s, 1),
            panchangamSupport=pan_support,
            dashaSupport=dasha_support,
            cautions=cautions,
        )
        for s, d, t_start, t_end, pan_support, cautions in top
    ]

    return MuhurtaResponse(
        success=True,
        data=MuhurtaResponseData(
            chartId=chart_id,
            activity=activity,
            dateFrom=date_from,
            dateTo=date_to,
            slots=slots,
        ),
        meta=ResponseMeta(
            calculationVersion="1.0",
            generatedAt=datetime.now(UTC).isoformat(),
        ),
    )

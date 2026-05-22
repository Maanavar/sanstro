from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, nakshatra_from_degree, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.transits import RASI_NAMES, classify_sani_cycle, is_combust
from app.models import BirthProfile, Chart
from app.schemas.daily_guidance import (
    DailyGuidanceData,
    DailyGuidanceResponse,
    DailyGuidanceRangeData,
    DailyGuidanceRangeResponse,
    DailyGuidanceScoreBreakdown,
    DailyGuidanceSuggestion,
    DailyGuidanceText,
    DailyGuidanceWindow,
)
from app.schemas.dasha import ResponseMeta
from app.services.chart_service import load_persisted_chart_response

SIGN_LORDS = {
    1: "MARS",
    2: "VENUS",
    3: "MERCURY",
    4: "MOON",
    5: "SUN",
    6: "MERCURY",
    7: "VENUS",
    8: "MARS",
    9: "JUPITER",
    10: "SATURN",
    11: "SATURN",
    12: "JUPITER",
}

# Nakshatras traditionally considered auspicious for daily activity in Tamil Jyothidam.
# Sources: Ashwini(1), Rohini(4), Mirugaseeridam(5), Punarpoosam(7), Poosam(8),
# Hastham(13), Chithirai(14), Swathi(15), Anusham(17), Thiruvonam(22), Revathi(27).
AUSPICIOUS_DAILY_NAKSHATRAS: set[int] = {1, 4, 5, 7, 8, 13, 14, 15, 17, 22, 27}
CAUTION_YOGAS = {1, 6, 9, 10, 17, 27}

PLANET_DAILY_WEIGHT = {
    "JUPITER": 0.18,
    "SATURN": 0.20,
    "RAHU": 0.12,
    "KETU": 0.08,
    "MARS": 0.14,
    "MOON": 0.10,
}

TRANSIT_BASE_SCORE = {
    "JUPITER": {1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38, 7: 74, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34},
    "SATURN": {1: 38, 2: 30, 3: 58, 4: 28, 5: 55, 6: 60, 7: 35, 8: 22, 9: 52, 10: 45, 11: 62, 12: 34},
    "RAHU": {1: 40, 2: 45, 3: 50, 4: 42, 5: 48, 6: 44, 7: 45, 8: 30, 9: 46, 10: 40, 11: 52, 12: 36},
    "KETU": {1: 42, 2: 40, 3: 46, 4: 48, 5: 44, 6: 42, 7: 46, 8: 34, 9: 48, 10: 44, 11: 40, 12: 38},
    "MARS": {1: 38, 2: 34, 3: 50, 4: 40, 5: 46, 6: 52, 7: 42, 8: 28, 9: 48, 10: 44, 11: 50, 12: 32},
    "MOON": {1: 55, 2: 58, 3: 50, 4: 48, 5: 62, 6: 46, 7: 60, 8: 30, 9: 64, 10: 52, 11: 56, 12: 36},
}

PLANET_PERIOD_SCORE = {
    "SUN": 55,
    "MOON": 60,
    "MARS": 48,
    "MERCURY": 63,
    "JUPITER": 72,
    "VENUS": 68,
    "SATURN": 44,
    "RAHU": 40,
    "KETU": 42,
}

GRAHA_RELATIONSHIP_SCORE = {
    ("SUN", "MOON"): 70,
    ("SUN", "MARS"): 72,
    ("SUN", "JUPITER"): 70,
    ("SUN", "MERCURY"): 62,
    ("SUN", "VENUS"): 42,
    ("SUN", "SATURN"): 38,
    ("SUN", "RAHU"): 40,
    ("SUN", "KETU"): 40,
    ("MOON", "MERCURY"): 65,
    ("MOON", "MARS"): 58,
    ("MOON", "JUPITER"): 55,
    ("MOON", "VENUS"): 58,
    ("MOON", "SATURN"): 48,
    ("MOON", "RAHU"): 46,
    ("MOON", "KETU"): 46,
}


def _to_utc(datetime_value: datetime) -> datetime:
    if datetime_value.tzinfo is None:
        return datetime_value.replace(tzinfo=UTC)
    return datetime_value.astimezone(UTC)


def _birth_datetime_utc(profile: BirthProfile) -> datetime:
    birth_datetime_utc = profile.birth_datetime_utc
    if birth_datetime_utc is not None:
        if birth_datetime_utc.tzinfo is None:
            return birth_datetime_utc.replace(tzinfo=UTC)
        return birth_datetime_utc.astimezone(UTC)

    if profile.birth_time_local is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Birth time is required.")

    local_dt = datetime.combine(profile.birth_date_local, profile.birth_time_local)
    return local_dt.replace(tzinfo=resolve_timezone(profile.birth_timezone)).astimezone(UTC)


def _local_noon_as_utc(on_date: date, timezone_name: str) -> datetime:
    timezone_obj = resolve_timezone(timezone_name)
    local_noon = datetime.combine(on_date, time(12, 0), tzinfo=timezone_obj)
    return local_noon.astimezone(UTC)


def _rasi_lord(rasi_number: int) -> str:
    return SIGN_LORDS[rasi_number]


def _normalize_graha_name(name: str) -> str:
    return {
        "GURU": "JUPITER",
        "SANI": "SATURN",
    }.get(name, name)


def _score_label(score: int) -> str:
    if score >= 80:
        return "STRONG_SUPPORT"
    if score >= 65:
        return "GOOD"
    if score >= 50:
        return "BALANCED"
    if score >= 35:
        return "CAUTION"
    return "RESTORATIVE"


def _planet_period_score(lord: str) -> int:
    return PLANET_PERIOD_SCORE[lord]


def _graha_relationship_score(maha_lord: str, antar_lord: str) -> int:
    if maha_lord == antar_lord:
        return 72

    pair = (maha_lord, antar_lord)
    reverse_pair = (antar_lord, maha_lord)
    if pair in GRAHA_RELATIONSHIP_SCORE:
        return GRAHA_RELATIONSHIP_SCORE[pair]
    if reverse_pair in GRAHA_RELATIONSHIP_SCORE:
        return GRAHA_RELATIONSHIP_SCORE[reverse_pair]
    return 52


def _money_hora_name(lord: str) -> str:
    return {
        "SUN": "SUN",
        "MOON": "MOON",
        "MARS": "MARS",
        "MERCURY": "MERCURY",
        "GURU": "JUPITER",
        "VENUS": "VENUS",
        "SATURN": "SATURN",
    }[lord]


def _best_hours(panchangam, current_maha_lord: str) -> list[DailyGuidanceWindow]:
    windows: list[DailyGuidanceWindow] = []
    if not panchangam.abhijit_restricted:
        windows.append(
            DailyGuidanceWindow(
                type="ABHIJIT",
                start=panchangam.abhijit_start.strftime("%H:%M"),
                end=panchangam.abhijit_end.strftime("%H:%M"),
            )
        )

    supportive_lords = {
        _normalize_graha_name(panchangam.weekday_lord),
        current_maha_lord,
        "JUPITER",
        "VENUS",
        "MERCURY",
        "MOON",
        "SUN",
    }
    for entry in panchangam.hora[:12]:
        if _normalize_graha_name(_money_hora_name(entry.lord)) in supportive_lords:
            windows.append(
                DailyGuidanceWindow(
                    type=f"{entry.lord}_HORA",
                    start=entry.start.strftime("%H:%M"),
                    end=entry.end.strftime("%H:%M"),
                )
            )
            break

    return windows


def _caution_windows(panchangam) -> list[DailyGuidanceWindow]:
    return [
        DailyGuidanceWindow(
            type="RAHU_KALAM",
            start=panchangam.rahu_kalam.start.strftime("%H:%M"),
            end=panchangam.rahu_kalam.end.strftime("%H:%M"),
        )
    ]


def _build_text(score: int, label: str, best_windows: list[DailyGuidanceWindow], caution_windows: list[DailyGuidanceWindow]) -> tuple[DailyGuidanceText, DailyGuidanceSuggestion, DailyGuidanceSuggestion]:
    if label == "STRONG_SUPPORT":
        en = "Today is strongly supportive for planned actions. Use the clearest window and keep decisions calm."
        ta = "இன்று திட்டமிட்ட செயல்களுக்கு நல்ல ஆதரவு உள்ளது. நல்ல நேரத்தை பயன்படுத்தி முடிவுகளை அமைதியாக எடுத்துக்கொள்ளுங்கள்."
    elif label == "GOOD":
        en = "Today has useful support for planned actions. Avoid Rahu Kalam for new starts and keep important decisions structured."
        ta = "இன்று திட்டமிட்ட செயல்களுக்கு நல்ல ஆதரவு உள்ளது. ராகு காலத்தைத் தவிர்த்து முக்கிய முடிவுகளை அமைதியாக எடுத்துக்கொள்ளுங்கள்."
    elif label == "BALANCED":
        en = "Today is steady and workable. Move step by step, and prefer simple, practical decisions."
        ta = "இன்று நிலையான நாளாக உள்ளது. படிப்படியாகச் செயல்பட்டு, எளிய மற்றும் நடைமுறை முடிவுகளைத் தேர்வு செய்யுங்கள்."
    elif label == "CAUTION":
        en = "Keep the day light and structured. Focus on routine tasks, and save major decisions for a better window."
        ta = "இன்று நாளை இலகுவாகவும் ஒழுங்காகவும் வைத்துக்கொள்ளுங்கள். வழக்கமான பணிகளுக்கு முன்னுரிமை கொடுத்து, பெரிய முடிவுகளை நல்ல நேரத்திற்கு மாற்றுங்கள்."
    else:
        en = "A quieter, restorative pace will suit today. Keep commitments small and favor rest, review, and simple follow-through."
        ta = "இன்று சற்று அமைதியான, மீளச்சேர்க்கை தரும் நடைமுறை நல்லது. சிறிய பொறுப்புகளை மட்டும் எடுத்துக்கொண்டு ஓய்வு, மறுபரிசீலனை, எளிய தொடர்ச்சி ஆகியவற்றுக்கு முன்னுரிமை கொடுங்கள்."

    action_en = "Use the best window for your most important task."
    action_ta = "உங்கள் முக்கியமான பணியை நல்ல நேரத்தில் செய்யுங்கள்."
    if best_windows:
        action_en = f"Use {best_windows[0].type.replace('_', ' ').title()} for your most important task."
        action_ta = f"{best_windows[0].type.replace('_', ' ')} நேரத்தில் முக்கிய பணியைத் தொடங்குங்கள்."

    caution_en = "Avoid rushing decisions during Rahu Kalam and keep the day practical."
    caution_ta = "ராகு காலத்தில் அவசர முடிவுகளைத் தவிர்த்து, நாளை நடைமுறைபூர்வமாக வைத்துக்கொள்ளுங்கள்."

    return (
        DailyGuidanceText(ta=ta, en=en),
        DailyGuidanceSuggestion(ta=action_ta, en=action_en),
        DailyGuidanceSuggestion(ta=caution_ta, en=caution_en),
    )


def build_daily_guidance_response(
    chart_snapshot,
    on_date: date,
    language: str = "ta-en",
    *,
    panchangam=None,
    transit_snapshot=None,
) -> DailyGuidanceResponse:
    chart_id = chart_snapshot.data.chart_id
    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_lagna = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day

    birth_profile = chart_snapshot.data.birth_profile
    if panchangam is None:
        panchangam = calculate_daily_panchangam(
            on_date,
            float(birth_profile.birth_latitude),
            float(birth_profile.birth_longitude),
            birth_profile.birth_timezone,
        )
    solar_noon_utc = panchangam.solar_noon.astimezone(UTC)
    current_jd = utc_datetime_to_julian_day(solar_noon_utc)
    if transit_snapshot is None:
        transit_snapshot = calculate_sidereal_planets(current_jd)
    moon = transit_snapshot.bodies["MOON"]
    sun = transit_snapshot.bodies["SUN"]
    saturn = transit_snapshot.bodies["SATURN"]
    jupiter = transit_snapshot.bodies["JUPITER"]
    rahu = transit_snapshot.bodies["RAHU"]
    ketu = transit_snapshot.bodies["KETU"]
    mars = transit_snapshot.bodies["MARS"]

    current_nakshatra = nakshatra_from_degree(moon.absolute_longitude)
    janma_nakshatra = natal_moon.nakshatra
    moon_score = 70
    if current_nakshatra == janma_nakshatra:
        moon_score -= 20
    if current_nakshatra == ((janma_nakshatra + 8 - 1) % 27) + 1:
        moon_score -= 15
    if current_nakshatra == ((janma_nakshatra + 17 - 1) % 27) + 1:
        moon_score -= 15
    chandrashtama = house_from_reference(natal_moon.rasi, moon.rasi) == 8
    if chandrashtama:
        moon_score -= 25
    if current_nakshatra in AUSPICIOUS_DAILY_NAKSHATRAS:
        moon_score += 10
    moon_score = max(0, min(100, moon_score))

    # av_multiplier uses Ashtakavarga bindu lookup per spec section 10.3.
    # Ashtakavarga engine is deferred (Sprint 9); default bindu=4 maps to multiplier 1.0.
    AV_MULTIPLIER = {0: 0.5, 1: 0.6, 2: 0.75, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.2, 7: 1.3, 8: 1.4}
    DEFAULT_AV_BINDU = 4

    transit_score = 50.0
    for graha, body in {
        "JUPITER": jupiter,
        "SATURN": saturn,
        "RAHU": rahu,
        "KETU": ketu,
        "MARS": mars,
        "MOON": moon,
    }.items():
        house_from_moon = house_from_reference(natal_moon.rasi, body.rasi)
        base = TRANSIT_BASE_SCORE[graha][house_from_moon]
        av_multiplier = AV_MULTIPLIER[DEFAULT_AV_BINDU]
        transit_score += (base - 50) * PLANET_DAILY_WEIGHT[graha] * av_multiplier
    transit_score = max(0, min(100, transit_score))

    timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, current_jd)
    maha_lord = timeline.current_mahadasha.lord
    antar_lord = timeline.current_antardasha.lord
    maha_score = _planet_period_score(maha_lord)
    antar_score = _planet_period_score(antar_lord)
    relationship_score = _graha_relationship_score(maha_lord, antar_lord)
    dasha_score = max(0, min(100, round(maha_score * 0.55 + antar_score * 0.35 + relationship_score * 0.10)))

    panchangam_score = 70
    if panchangam.tithi_number in [4, 9, 14, 19, 24, 29]:
        panchangam_score -= 15
    if panchangam.tithi_number in [8, 23, 30]:
        panchangam_score -= 10
    if panchangam.yoga_number in CAUTION_YOGAS:
        panchangam_score -= 10
    if panchangam.karana_name == "VISHTI":
        panchangam_score -= 10
    if panchangam.weekday_lord == _rasi_lord(natal_lagna):
        panchangam_score += 8
    if panchangam.weekday_lord == maha_lord:
        panchangam_score += 5
    panchangam_score = max(0, min(100, panchangam_score))

    saturn_cycle = classify_sani_cycle(house_from_reference(natal_moon.rasi, saturn.rasi))
    personal_safety_score = 60
    if chandrashtama:
        personal_safety_score -= 15
    if saturn_cycle.is_active and saturn_cycle.type in {"JANMA_SANI", "ARDHASHTAMA_SANI", "ASHTAMA_SANI", "KANTAKA_SANI"}:
        personal_safety_score -= 10
    if panchangam.abhijit_restricted:
        personal_safety_score -= 5
    if is_combust(
        "MERCURY",
        transit_snapshot.bodies["MERCURY"].absolute_longitude,
        sun.absolute_longitude,
        transit_snapshot.bodies["MERCURY"].is_retrograde,
    ):
        personal_safety_score -= 3
    personal_safety_score = max(0, min(100, personal_safety_score))

    score = round(
        moon_score * 0.30
        + transit_score * 0.25
        + dasha_score * 0.20
        + panchangam_score * 0.15
        + personal_safety_score * 0.10
    )

    best_windows = _best_hours(panchangam, maha_lord)
    caution_windows = _caution_windows(panchangam)
    remedial_support = 6 if best_windows else 0

    score = max(0, min(100, score + remedial_support))
    label = _score_label(score)
    text, action, caution = _build_text(score, label, best_windows, caution_windows)

    return DailyGuidanceResponse(
        data=DailyGuidanceData(
            chartId=chart_id,
            dateLocal=on_date,
            score=score,
            label=label,
            scoreBreakdown=DailyGuidanceScoreBreakdown(
                moonTransit=round(moon_score * 0.30),
                dashaSupport=round(dasha_score * 0.20),
                panchangam=round(panchangam_score * 0.15),
                gocharSupport=round(transit_score * 0.25),
                personalCautions=-(round((60 - personal_safety_score) * 0.2) if personal_safety_score < 60 else 0),
                remedialActionSupport=remedial_support,
            ),
            bestWindows=best_windows,
            cautionWindows=caution_windows,
            text=text,
            actionSuggestion=action,
            cautionSuggestion=caution,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_daily_guidance(session: Session, chart_id: UUID, on_date: date, language: str = "ta-en") -> DailyGuidanceResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    return build_daily_guidance_response(chart_snapshot, on_date, language)


def get_daily_guidance_range(
    session: Session,
    profile_id: UUID,
    from_date: date,
    to_date: date,
    language: str = "ta-en",
) -> DailyGuidanceRangeResponse:
    if to_date < from_date:
        raise HTTPException(status_code=422, detail="End date must be on or after start date.")

    chart = session.execute(
        select(Chart)
        .where(Chart.birth_profile_id == profile_id, Chart.status == "completed")
        .order_by(Chart.created_at.desc())
    ).scalar_one_or_none()
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    items: list[DailyGuidanceData] = []
    current = from_date
    while current <= to_date:
        items.append(get_daily_guidance(session, chart.chart_id, current, language).data)
        current += timedelta(days=1)

    return DailyGuidanceRangeResponse(
        data=DailyGuidanceRangeData(
            profileId=profile_id,
            chartId=chart.chart_id,
            fromDate=from_date,
            toDate=to_date,
            items=items,
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

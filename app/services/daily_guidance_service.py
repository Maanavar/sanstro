from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from collections import Counter
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.activity_timing_rules import ActivityType, assess_activity_timing
from app.calculations.astro import (
    house_from_reference,
    local_datetime_to_utc,
    nakshatra_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.panchangam import calculate_daily_panchangam, calculate_daily_panchangam_range
from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
from app.calculations.chart_strength import compute_natal_planet_score
from app.calculations.functional_nature import get_dasha_modifier, get_transit_modifier
from app.calculations.transits import RASI_NAMES, check_vedha, classify_kandaka_cycle, classify_sani_cycle, is_combust
from app.models import BirthProfile, Chart, DailyScore, JournalEntry
from app.schemas.charts import ChartCalculateResponse
from app.schemas.daily_guidance import (
    ActivityTimingData,
    ActivityTimingDayResult,
    ActivityTimingResponse,
    DailyGuidanceData,
    DailyGuidanceEmotionalWeather,
    DailyGuidanceJournalInsight,
    DailyGuidanceJournalSignal,
    DailyGuidanceReasons,
    DailyGuidanceResponse,
    DailyGuidanceRangeData,
    DailyGuidanceRangeResponse,
    DailyGuidanceScoreBreakdown,
    DailyGuidanceSuggestion,
    DailyGuidanceText,
    DailyGuidanceWindow,
    DashaStoryData,
    DashaStoryPeriod,
    DashaStoryResponse,
    JournalCorrelationData,
    JournalCorrelationItem,
    JournalCorrelationResponse,
    PeyarchiReportData,
    PeyarchiReportPeriod,
    PeyarchiReportResponse,
    WeekAheadData,
    WeekAheadDayItem,
    WeekAheadResponse,
)
from app.schemas.dasha import ResponseMeta
from app.services.chart_service import load_persisted_chart_response
from app.services.context_service import get_context_row, should_surface_proactively
from app.services.emotional_weather import TransitPoint, compute_emotional_weather
from app.services.goals_service import get_active_goals_for_chart
from app.services.location_service import (
    local_noon_as_utc_for_profile,
    resolve_effective_daily_location,
    resolve_effective_daily_timezone,
)
from app.services.nakshatra_content import build_nakshatra_perspective
from app.services.narrative_engine import build_score_reasons, tithi_content_card

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
    "JUPITER": {1: 50, 2: 72, 3: 48, 4: 42, 5: 78, 6: 38, 7: 68, 8: 25, 9: 82, 10: 58, 11: 80, 12: 34},
    "SATURN": {1: 42, 2: 40, 3: 62, 4: 34, 5: 52, 6: 64, 7: 50, 8: 22, 9: 36, 10: 62, 11: 76, 12: 42},
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

# Classical Thirukanitham natural friendship table (Parashari doctrine).
# Covers all 9×9 pairs. See CONFLICT-04 in the enhancement doc for derivation.
_NATURAL_FRIENDS: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON":    frozenset({"SUN", "MERCURY"}),
    "MARS":    frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS":   frozenset({"MERCURY", "SATURN"}),
    "SATURN":  frozenset({"MERCURY", "VENUS"}),
    "RAHU":    frozenset({"VENUS", "SATURN"}),
    "KETU":    frozenset({"MARS", "VENUS"}),
}
def _age_dasha_modifier(age: int, planet: str) -> float:
    """Return a life-stage multiplier for a dasha planet.

    Thirukanitham teaches that the same dasha produces different intensity depending
    on the native's age. Saturn is harsh during youth (before karmic readiness), Mars
    peaks during the physically active years, Venus during the romantic/creative prime,
    Jupiter during the wisdom-expansion years, and the Moon colours the emotionally
    receptive phases.
    """
    if planet == "SATURN":
        return 0.88 if age < 30 else (1.05 if age > 55 else 1.0)
    if planet == "MARS":
        return 0.92 if age < 25 else (1.05 if age <= 45 else 0.95)
    if planet == "VENUS":
        return 0.90 if age < 20 else (1.08 if age <= 40 else (0.95 if age > 55 else 1.0))
    if planet == "JUPITER":
        return 1.10 if 35 <= age <= 60 else 1.0
    if planet == "MOON":
        return 1.05 if (age < 20 or age > 60) else 1.0
    return 1.0  # SUN, MERCURY, RAHU, KETU — no strong age-dependency in Thirukanitham


_NATURAL_ENEMIES: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON":    frozenset({"RAHU", "KETU"}),
    "MARS":    frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS":   frozenset({"SUN", "MOON", "RAHU", "KETU"}),
    "SATURN":  frozenset({"SUN", "MOON", "MARS"}),
    "RAHU":    frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU":    frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
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
    return local_datetime_to_utc(local_dt, profile.birth_timezone)


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


def _angular_sep(a: float, b: float) -> float:
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def _collect_afflicted_planets(chart_snapshot) -> list[str]:
    planets = chart_snapshot.data.planets
    lagna_rasi = chart_snapshot.data.lagna.rasi
    sun = next((p for p in planets if p.graha == "SUN"), None)
    saturn = next((p for p in planets if p.graha == "SATURN"), None)
    rahu = next((p for p in planets if p.graha == "RAHU"), None)
    ketu = next((p for p in planets if p.graha == "KETU"), None)
    sun_longitude = sun.absolute_longitude if sun is not None else 0.0

    afflicted: list[str] = []
    for planet in planets:
        graha = planet.graha
        house = house_from_reference(lagna_rasi, planet.rasi)
        strength = int(getattr(planet, "strength_score", 0) or 0)
        if strength <= 0:
            strength = compute_natal_planet_score(
                planet=graha,
                natal_rasi=planet.rasi,
                natal_longitude=planet.absolute_longitude,
                natal_lagna_rasi=lagna_rasi,
                sun_longitude=sun_longitude,
                is_retrograde=planet.is_retrograde,
                is_vargottama=planet.is_vargottama,
                d9_rasi=planet.d9_rasi,
            )

        is_conj_malefic = False
        for malefic in (saturn, rahu, ketu):
            if malefic is None or malefic.graha == graha:
                continue
            if _angular_sep(planet.absolute_longitude, malefic.absolute_longitude) <= 8:
                is_conj_malefic = True
                break

        if graha == "SUN" and planet.rasi == 7:
            afflicted.append(graha)
            continue

        if (house in {6, 8, 12} and strength < 45) or (planet.is_combust and graha != "SUN") or is_conj_malefic:
            afflicted.append(graha)

    # Preserve order, keep top 3 for concise remedy output.
    unique = list(dict.fromkeys(afflicted))
    return unique[:3]


def _planet_period_score(lord: str) -> int:
    return PLANET_PERIOD_SCORE[lord]


def _transit_with_av_score(
    planet: str,
    transit_rasi: int,
    moon_rasi: int,
    bhinnashtakavarga: dict[str, dict[int, int]],
) -> int:
    """
    Adjust transit house score by Ashtakavarga Bhinna bindus.
    bindus >= 4: supportive transit (+8)
    bindus <= 2: difficult transit (-8)
    """
    base_house = house_from_reference(moon_rasi, transit_rasi)
    base_score = TRANSIT_BASE_SCORE.get(planet, {}).get(base_house, 50)
    bindus = get_av_bindu(bhinnashtakavarga, planet, transit_rasi)
    if bindus >= 4:
        base_score += 8
    elif bindus <= 2:
        base_score -= 8
    return max(10, min(90, base_score))


def _dasha_lord_strength_score(
    planet: str,
    natal_planet_score: int,
    transit_house: int,
    is_retrograde_transit: bool = False,
) -> int:
    """
    Compute dasha lord support score from natal strength and current transit.
    Returns 10-95.
    """
    natal_component = natal_planet_score * 0.40
    transit_base = TRANSIT_BASE_SCORE.get(planet, {}).get(transit_house, 50)
    transit_component = transit_base * 0.40
    retro_component = 20.0 if is_retrograde_transit else 10.0
    return max(10, min(95, round(natal_component + transit_component + retro_component)))


def _pratyantar_narrative(
    pratyantar_lord: str,
    pratyantar_days_remaining: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],
    lang: str = "ta-en",
) -> dict[str, str] | None:
    if pratyantar_days_remaining > 90:
        return None

    score = planet_scores.get(pratyantar_lord, 50)
    quality = "strong" if score >= 65 else ("challenging" if score <= 35 else "moderate")
    quality_ta = "வலுவான" if score >= 65 else ("சவாலான" if score <= 35 else "மிதமான")
    en = (
        f"{pratyantar_lord.capitalize()} Pratyantar ({pratyantar_days_remaining}d remaining) "
        f"brings a {quality} short-term influence within the "
        f"{antardasha_lord.capitalize()} Antardasha of {mahadasha_lord.capitalize()} Mahadasha."
    )
    ta = (
        f"{pratyantar_lord} பிரத்யந்தர தசை ({pratyantar_days_remaining} நாள் மீதம்) - "
        f"{antardasha_lord} அந்தர தசையில் குறுகிய கால {quality_ta} தாக்கம்."
    )
    return {"en": en, "ta": ta}


def _graha_relationship_score(maha_lord: str, antar_lord: str) -> int:
    """Relationship score from classical natural friendship table. Covers all 9×9 pairs."""
    if maha_lord == antar_lord:
        return 72
    if antar_lord in _NATURAL_FRIENDS.get(maha_lord, frozenset()):
        return 70   # Natural friends
    if antar_lord in _NATURAL_ENEMIES.get(maha_lord, frozenset()):
        return 38   # Natural enemies
    return 55       # Natural neutrals


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


def _current_hora_lord(panchangam, on_date: date, timezone_name: str) -> str | None:
    """
    Return the currently running hora lord for on_date in local timezone.
    Returns None when the requested date is not today in that timezone.
    """
    tz_now = datetime.now(resolve_timezone(timezone_name))
    if tz_now.date() != on_date:
        return None

    now_local = tz_now
    for slot in panchangam.hora:
        start = _to_utc(slot.start).astimezone(tz_now.tzinfo)
        end = _to_utc(slot.end).astimezone(tz_now.tzinfo)
        if start <= now_local < end:
            normalized_lord = _normalize_graha_name(slot.lord)
            if normalized_lord == "GURU":
                return "JUPITER"
            return normalized_lord
    return None


_NATURAL_BENEFIC_LORDS = {"JUPITER", "VENUS", "MERCURY", "MOON"}

# Lords whose hora is universally cautioned (malefics with no offsetting dignity)
_MALEFIC_HORA_LORDS = {"SATURN", "MARS", "RAHU", "KETU"}


def _personal_hora_lords(
    lagna_rasi: int,
    maha_lord: str,
    antar_lord: str,
) -> tuple[set[str], set[str]]:
    """
    Return (priority_lords, supportive_lords).

    priority_lords  — personal planets: lagna lord + current dasha lords.
                      These are ranked highest regardless of natural benefic status.
    supportive_lords — natural benefics + SUN + priority_lords.
                      Any hora from this set is shown as a best window.
    """
    lagna_lord = _normalize_graha_name(_rasi_lord(lagna_rasi))
    norm_maha = _normalize_graha_name(maha_lord)
    norm_antar = _normalize_graha_name(antar_lord)

    priority = {lagna_lord, norm_maha, norm_antar} - _MALEFIC_HORA_LORDS
    supportive = set(_NATURAL_BENEFIC_LORDS) | {"SUN"} | priority
    return priority, supportive


def _best_hours(
    panchangam,
    current_maha_lord: str,
    lagna_rasi: int = 0,
    current_antar_lord: str = "",
) -> list[DailyGuidanceWindow]:
    windows: list[DailyGuidanceWindow] = []
    if not panchangam.abhijit_restricted:
        windows.append(
            DailyGuidanceWindow(
                type="ABHIJIT",
                start=panchangam.abhijit_start.strftime("%H:%M"),
                end=panchangam.abhijit_end.strftime("%H:%M"),
            )
        )

    if lagna_rasi and current_antar_lord:
        priority_lords, supportive_lords = _personal_hora_lords(
            lagna_rasi, current_maha_lord, current_antar_lord
        )
    else:
        # Fallback: generic benefic set + weekday/maha lords if they qualify
        supportive_lords = set(_NATURAL_BENEFIC_LORDS) | {"SUN"}
        priority_lords: set[str] = set()
        norm_maha = _normalize_graha_name(current_maha_lord)
        if norm_maha not in _MALEFIC_HORA_LORDS:
            supportive_lords.add(norm_maha)

    # Emit all daytime horas that qualify, marking personal-planet horas distinctly
    for entry in panchangam.hora[:12]:
        norm_lord = _normalize_graha_name(_money_hora_name(entry.lord))
        if norm_lord in supportive_lords:
            tag = "PERSONAL_HORA" if norm_lord in priority_lords else "HORA"
            windows.append(
                DailyGuidanceWindow(
                    type=f"{norm_lord}_{tag}",
                    start=entry.start.strftime("%H:%M"),
                    end=entry.end.strftime("%H:%M"),
                )
            )

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


_GOAL_DASHA_AFFINITY: dict[str, set[str]] = {
    "job_change":     {"SUN", "SATURN", "MARS", "JUPITER"},
    "business_start": {"MERCURY", "JUPITER", "SATURN"},
    "marriage":       {"VENUS", "JUPITER", "MOON"},
    "education":      {"MERCURY", "JUPITER"},
    "property":       {"SATURN", "MARS", "MOON"},
    "health":         {"SUN", "MARS", "JUPITER"},
    "travel_abroad":  {"RAHU", "JUPITER"},
    "spiritual":      {"JUPITER", "KETU"},
    "family_harmony": {"MOON", "JUPITER"},
    "money":          {"JUPITER", "VENUS", "MERCURY"},
    "child_birth":    {"JUPITER", "MOON"},
    "other":          {"JUPITER", "SUN"},
}

_GOAL_LABEL_TA = {
    "job_change":     "வேலை மாற்றம்",
    "business_start": "தொழில் தொடக்கம்",
    "marriage":       "திருமணம்",
    "education":      "கல்வி",
    "property":       "சொத்து",
    "health":         "உடல்நலம்",
    "travel_abroad":  "வெளிநாடு பயணம்",
    "spiritual":      "ஆன்மீகம்",
    "family_harmony": "குடும்ப நலம்",
    "money":          "பண வரவு",
    "child_birth":    "குழந்தை பாக்கியம்",
    "other":          "உங்கள் இலக்கு",
}
_GOAL_LABEL_EN = {
    "job_change":     "job change",
    "business_start": "starting a business",
    "marriage":       "marriage",
    "education":      "education",
    "property":       "property",
    "health":         "health",
    "travel_abroad":  "travel abroad",
    "spiritual":      "spiritual growth",
    "family_harmony": "family harmony",
    "money":          "financial growth",
    "child_birth":    "child birth",
    "other":          "your goal",
}

_PLANET_TA = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}
_PLANET_EN = {
    "SUN": "Suryan", "MOON": "Chandran", "MARS": "Chevvai",
    "MERCURY": "Budhan", "JUPITER": "Guru", "VENUS": "Sukran",
    "SATURN": "Sani", "RAHU": "Rahu", "KETU": "Ketu",
}

_JOURNAL_INSIGHT_LOOKBACK_DAYS = 30


# Bump when the daily-score engine logic changes (scoring weights, dasha/porutham
# corrections, transit rules, …) so previously cached rows self-invalidate instead
# of being served stale. Combined with the chart calculation_version on load.
DAILY_SCORE_ENGINE_VERSION = "2026-06-05-v3"


def _cache_version(calculation_version: str) -> str:
    return f"{calculation_version}::{DAILY_SCORE_ENGINE_VERSION}"


def _load_daily_score_cache(
    session: Session,
    *,
    birth_profile_id: UUID,
    score_date: date,
    calculation_version: str,
) -> DailyGuidanceResponse | None:
    row = session.execute(
        select(DailyScore).where(
            DailyScore.birth_profile_id == birth_profile_id,
            DailyScore.score_date == score_date,
        )
        .order_by(DailyScore.created_at.desc())
        .limit(1)
    ).scalars().first()
    if row is None:
        return None
    stored = dict(row.data)
    # Stale row from an older engine/chart version → force recompute.
    if stored.pop("_cacheVersion", None) != _cache_version(calculation_version):
        return None
    return DailyGuidanceResponse(
        data=DailyGuidanceData.model_validate(stored),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _load_daily_score_cache_range(
    session: Session,
    *,
    birth_profile_id: UUID,
    start_date: date,
    end_date: date,
    calculation_version: str,
) -> dict[date, DailyGuidanceResponse]:
    """Bulk-fetch DailyScore cache rows for a date range in a single query.

    Mirrors ``calculate_daily_panchangam_range``'s batching of ``PanchangamCache``
    lookups: callers that need several consecutive days (month view, week-ahead
    digest) should use this instead of looping ``_load_daily_score_cache`` —
    that loop issued one SELECT per day.
    """
    rows = session.execute(
        select(DailyScore)
        .where(
            DailyScore.birth_profile_id == birth_profile_id,
            DailyScore.score_date >= start_date,
            DailyScore.score_date <= end_date,
        )
        .order_by(DailyScore.score_date, DailyScore.created_at.desc())
    ).scalars()

    expected_version = _cache_version(calculation_version)
    cached: dict[date, DailyGuidanceResponse] = {}
    for row in rows:
        if row.score_date in cached:
            continue  # keep the most recent row per date (ordered by created_at desc)
        stored = dict(row.data)
        if stored.pop("_cacheVersion", None) != expected_version:
            continue
        cached[row.score_date] = DailyGuidanceResponse(
            data=DailyGuidanceData.model_validate(stored),
            meta=ResponseMeta(
                calculation_version=calculation_version,
                generated_at=datetime.now(tz=UTC),
            ),
        )
    return cached


def _store_daily_score_cache(
    session: Session,
    *,
    birth_profile_id: UUID,
    score_date: date,
    response: DailyGuidanceResponse,
    calculation_version: str,
) -> None:
    payload = response.data.model_dump(mode="json", by_alias=True)
    payload["_cacheVersion"] = _cache_version(calculation_version)
    session.execute(
        pg_insert(DailyScore)
        .values(
            score_id=uuid4(),
            birth_profile_id=birth_profile_id,
            score_date=score_date,
            score=response.data.score,
            label=response.data.label,
            data=payload,
        )
        .on_conflict_do_update(
            constraint="uq_daily_scores_profile_date",
            set_={
                "score": response.data.score,
                "label": response.data.label,
                "data": payload,
                "created_at": datetime.now(tz=UTC),
            },
        )
    )


def _enrich_action_with_goals(
    action: DailyGuidanceSuggestion,
    active_goals: list,
    maha_lord: str,
    label: str,
    *,
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
) -> DailyGuidanceSuggestion:
    """Append a goal-relevant context sentence to the action suggestion.

    Checks Thirukanitham timing rules (tithi/paksha/weekday) for the active goal
    type first. If timing is CAUTION for the goal, that overrides a positive dasha
    match — a Rikta tithi during Theipirai on a Saturday cannot be softened just
    because the dasha lord is supportive.
    """
    if not active_goals:
        return action

    goal_type = active_goals[0].goal_type
    affinity_lords = _GOAL_DASHA_AFFINITY.get(goal_type, set())
    goal_ta = _GOAL_LABEL_TA.get(goal_type, "உங்கள் இலக்கு")
    goal_en = _GOAL_LABEL_EN.get(goal_type, "your goal")
    planet_ta = _PLANET_TA.get(maha_lord, maha_lord)
    planet_en = _PLANET_EN.get(maha_lord, maha_lord)

    # Assess Thirukanitham timing for this specific goal.
    timing = assess_activity_timing(
        activity=goal_type if goal_type in (
            "job_change", "business_start", "marriage", "education",
            "property", "health", "travel_abroad", "spiritual",
            "family_harmony", "money", "child_birth",
        ) else "other",
        tithi_number=tithi_number,
        paksha=paksha,
        weekday_lord=weekday_lord,
    )

    if timing.combined_alignment == "CAUTION":
        # Timing caution overrides positive dasha — do not encourage action today.
        suffix_ta = f" {goal_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள். {timing.combined_ta}"
        suffix_en = f" Defer major {goal_en} decisions today. {timing.combined_en}"
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if timing.combined_alignment == "SUPPORTS" and maha_lord in affinity_lords and label in ("STRONG_SUPPORT", "GOOD"):
        suffix_ta = (
            f" {goal_ta} குறித்த முயற்சிகளுக்கு இன்று {planet_ta} தசையும் பஞ்சாங்கமும் ஆதரவளிக்கின்றன. {timing.combined_ta}"
        )
        suffix_en = (
            f" {planet_en} dasa and today's Panchangam both support {goal_en} efforts. {timing.combined_en}"
        )
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if maha_lord in affinity_lords and label in ("STRONG_SUPPORT", "GOOD"):
        suffix_ta = f" {goal_ta} குறித்த முயற்சிகளுக்கு இன்று {planet_ta} தசை ஆதரவளிக்கிறது."
        suffix_en = f" {planet_en} dasa is supportive for {goal_en} efforts today."
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if label in ("CAUTION", "RESTORATIVE"):
        suffix_ta = f" {goal_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்."
        suffix_en = f" Postpone major decisions related to {goal_en} today."
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    return action


_GOAL_TRACK_TA: dict[str, str] = {
    "CAREER":       "தொழில் வளர்ச்சி",
    "EXAM":         "தேர்வு வெற்றி",
    "RELATIONSHIP": "உறவு மேம்பாடு",
    "FINANCIAL":    "பண வரவு",
}
_GOAL_TRACK_EN: dict[str, str] = {
    "CAREER":       "career growth",
    "EXAM":         "exam success",
    "RELATIONSHIP": "relationship goals",
    "FINANCIAL":    "financial growth",
}
_GOAL_TRACK_DASHA_AFFINITY: dict[str, set[str]] = {
    "CAREER":       {"SUN", "SATURN", "MARS", "JUPITER"},
    "EXAM":         {"MERCURY", "JUPITER"},
    "RELATIONSHIP": {"VENUS", "JUPITER", "MOON"},
    "FINANCIAL":    {"JUPITER", "VENUS", "MERCURY"},
}


def _enrich_action_with_goal_track(
    action: DailyGuidanceSuggestion,
    goal_track: str,
    maha_lord: str,
    label: str,
) -> DailyGuidanceSuggestion:
    """Append a lightweight goal-track hint when user has set a focus track but no active goal."""
    affinity = _GOAL_TRACK_DASHA_AFFINITY.get(goal_track, set())
    track_ta = _GOAL_TRACK_TA.get(goal_track, "உங்கள் இலக்கு")
    track_en = _GOAL_TRACK_EN.get(goal_track, "your goal")
    planet_ta = _PLANET_TA.get(maha_lord, maha_lord)
    planet_en = _PLANET_EN.get(maha_lord, maha_lord)
    if maha_lord in affinity and label in ("STRONG_SUPPORT", "GOOD"):
        return DailyGuidanceSuggestion(
            ta=action.ta + f" {track_ta} குறித்த முயற்சிகளுக்கு {planet_ta} தசை இன்று ஆதரவளிக்கிறது.",
            en=action.en + f" {planet_en} dasa supports {track_en} efforts today.",
        )
    if label in ("CAUTION", "RESTORATIVE"):
        return DailyGuidanceSuggestion(
            ta=action.ta + f" {track_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்.",
            en=action.en + f" Defer major {track_en} decisions today.",
        )
    return action


def _build_journal_insight(
    session: Session,
    *,
    owner_user_id: UUID,
    chart_id: UUID,
    on_date: date,
) -> DailyGuidanceJournalInsight | None:
    from_date = on_date - timedelta(days=_JOURNAL_INSIGHT_LOOKBACK_DAYS)
    rows = session.execute(
        select(JournalEntry).where(
            JournalEntry.owner_user_id == owner_user_id,
            JournalEntry.chart_id == chart_id,
            JournalEntry.deleted_at.is_(None),
            JournalEntry.entry_date >= from_date,
            JournalEntry.entry_date <= on_date,
        )
    ).scalars().all()
    if not rows:
        return None

    life_area_counts = Counter(row.life_area for row in rows)
    tag_counts = Counter(tag for row in rows for tag in (row.tags or []))
    dominant_life_area, _ = life_area_counts.most_common(1)[0]
    top_tags = [tag for tag, _ in tag_counts.most_common(3)]
    signals = [
        DailyGuidanceJournalSignal(lifeArea=area, count=count)
        for area, count in life_area_counts.most_common(3)
    ]

    return DailyGuidanceJournalInsight(
        lookbackDays=_JOURNAL_INSIGHT_LOOKBACK_DAYS,
        entryCount=len(rows),
        dominantLifeArea=dominant_life_area,
        topTags=top_tags,
        text=DailyGuidanceText(
            ta=(
                f"கடந்த {_JOURNAL_INSIGHT_LOOKBACK_DAYS} நாட்களில் உங்கள் குறிப்புகளில் "
                f"'{dominant_life_area}' தலைவிரிப்பு அதிகம். இன்று சிறு, அமைதியான முன்னேற்ற அடிகள் பயனுள்ளது."
            ),
            en=(
                f"Your recent journal pattern over the last {_JOURNAL_INSIGHT_LOOKBACK_DAYS} days is centered on "
                f"'{dominant_life_area}'. Today favors small, calm progress steps in that area."
            ),
        ),
        signals=signals,
    )


def build_daily_guidance_response(
    chart_snapshot,
    on_date: date,
    language: str = "ta-en",
    *,
    session: Session | None = None,
    panchangam=None,
    transit_snapshot=None,
    active_goals: list | None = None,
    context_row=None,
    journal_insight: DailyGuidanceJournalInsight | None = None,
    goal_track: str | None = None,
) -> DailyGuidanceResponse:
    chart_id = chart_snapshot.data.chart_id
    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_venus = next(planet for planet in chart_snapshot.data.planets if planet.graha == "VENUS")
    natal_lagna = chart_snapshot.data.lagna.rasi
    birth_jd = chart_snapshot.data.julian_day

    # Build natal Rasi map for Ashtakavarga (BUG-05)
    natal_rasi_map: dict[str, int] = {"LAGNA": natal_lagna}
    for _p in chart_snapshot.data.planets:
        natal_rasi_map[_p.graha] = _p.rasi
    _bav = compute_bhinnashtakavarga(natal_rasi_map)

    birth_profile = chart_snapshot.data.birth_profile
    daily_location = resolve_effective_daily_location(birth_profile)
    if panchangam is None:
        panchangam = calculate_daily_panchangam(
            on_date,
            daily_location.latitude,
            daily_location.longitude,
            daily_location.timezone,
            session=session,
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
    # Chandrashtama = Moon in the 8th Rasi from natal Janma Rasi (per spec §4.11)
    # NOT the 8th Nakshatra — Nakshatra and Rasi boundaries do not align
    chandrashtama_rasi = ((natal_moon.rasi - 1 + 7) % 12) + 1
    chandrashtama = moon.rasi == chandrashtama_rasi
    if chandrashtama:
        moon_score -= 25
    if current_nakshatra in AUSPICIOUS_DAILY_NAKSHATRAS:
        moon_score += 10
    moon_score = max(0, min(100, moon_score))

    _transit_bodies = {
        "JUPITER": jupiter,
        "SATURN":  saturn,
        "RAHU":    rahu,
        "KETU":    ketu,
        "MARS":    mars,
        "MOON":    moon,
    }

    # Pre-compute house from Moon for all transit bodies (needed for Vedha check)
    _all_transit_houses: dict[str, int] = {
        g: house_from_reference(natal_moon.rasi, b.rasi)
        for g, b in _transit_bodies.items()
    }

    transit_score = 50.0
    for graha, body in _transit_bodies.items():
        house_from_moon = _all_transit_houses[graha]
        base = _transit_with_av_score(graha, body.rasi, natal_moon.rasi, _bav)
        fn_mult     = get_transit_modifier(natal_lagna, graha)  # Lagna-specific (BUG-10)
        contribution = (base - 50) * PLANET_DAILY_WEIGHT[graha] * fn_mult
        # Vedha Vichara: if blocking planet in Vedha house, transit benefit is cancelled (BUG-08)
        if check_vedha(graha, house_from_moon, _all_transit_houses):
            contribution *= 0.25
        transit_score += contribution
    transit_score = max(0, min(100, transit_score))
    # Moon-based Jupiter refinement (primary) + Lagna-based Saturn material modifier.
    jupiter_house_from_moon = _all_transit_houses["JUPITER"]
    saturn_house_from_lagna  = house_from_reference(natal_lagna, saturn.rasi)
    lagna_modifier = 0.0
    jupiter_moon_modifier = {
        1: 0.0,   # Neutral
        2: 3.0,   # Good
        3: -3.0,  # Unfavourable
        4: -4.0,  # Unfavourable
        5: 4.0,   # Very good
        6: -2.0,  # Unfavourable
        7: 3.0,   # Good (mixed) - never punitive
        8: -6.0,  # Bad
        9: 4.0,   # Very good
        10: 1.0,  # Neutral leaning supportive
        11: 4.0,  # Very good
        12: -3.0, # Unfavourable
    }
    lagna_modifier += jupiter_moon_modifier.get(jupiter_house_from_moon, 0.0)
    if saturn_house_from_lagna in {1, 4, 7, 10}:
        lagna_modifier -= 4.0
    elif saturn_house_from_lagna in {3, 6, 11}:
        lagna_modifier += 2.0
    transit_score = max(0, min(100, transit_score + lagna_modifier))

    timeline = calculate_vimshottari_timeline(birth_jd, natal_moon.absolute_longitude, current_jd)
    maha_lord = timeline.current_mahadasha.lord
    antar_lord = timeline.current_antardasha.lord
    pratyantar_lord = timeline.current_pratyantardasha.lord

    # Natal planet strength for dasha score (BUG-06): use actual chart placement, not generic scores
    natal_sun_data = next((p for p in chart_snapshot.data.planets if p.graha == "SUN"), None)
    natal_moon_data = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)
    natal_maha_data = next((p for p in chart_snapshot.data.planets if p.graha == maha_lord), None)
    natal_antar_data = next((p for p in chart_snapshot.data.planets if p.graha == antar_lord), None)
    sun_lon = float(natal_sun_data.absolute_longitude) if natal_sun_data else 0.0
    moon_lon = float(natal_moon_data.absolute_longitude) if natal_moon_data else 0.0
    is_daytime = True if birth_profile.birth_time_local is None else (6 <= birth_profile.birth_time_local.hour < 18)
    paksha_is_shukla = ((moon_lon - sun_lon) % 360.0) < 180.0

    if natal_maha_data:
        maha_natal_score = int(getattr(natal_maha_data, "strength_score", 0) or 0)
        if maha_natal_score <= 0:
            maha_natal_score = compute_natal_planet_score(
                planet=maha_lord,
                natal_rasi=natal_maha_data.rasi,
                natal_longitude=float(natal_maha_data.absolute_longitude),
                natal_lagna_rasi=natal_lagna,
                sun_longitude=sun_lon,
                is_retrograde=natal_maha_data.is_retrograde,
                is_vargottama=bool(natal_maha_data.is_vargottama),
                d9_rasi=natal_maha_data.d9_rasi,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
            )
        maha_transit = _transit_bodies.get(maha_lord)
        if maha_transit is not None:
            maha_score = _dasha_lord_strength_score(
                maha_lord,
                maha_natal_score,
                house_from_reference(natal_moon.rasi, maha_transit.rasi),
                is_retrograde_transit=bool(maha_transit.is_retrograde),
            )
        else:
            maha_score = maha_natal_score
    else:
        maha_score = _planet_period_score(maha_lord) if maha_lord in PLANET_PERIOD_SCORE else 50

    if natal_antar_data:
        antar_natal_score = int(getattr(natal_antar_data, "strength_score", 0) or 0)
        if antar_natal_score <= 0:
            antar_natal_score = compute_natal_planet_score(
                planet=antar_lord,
                natal_rasi=natal_antar_data.rasi,
                natal_longitude=float(natal_antar_data.absolute_longitude),
                natal_lagna_rasi=natal_lagna,
                sun_longitude=sun_lon,
                is_retrograde=natal_antar_data.is_retrograde,
                is_vargottama=bool(natal_antar_data.is_vargottama),
                d9_rasi=natal_antar_data.d9_rasi,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
            )
        antar_transit = _transit_bodies.get(antar_lord)
        if antar_transit is not None:
            antar_score = _dasha_lord_strength_score(
                antar_lord,
                antar_natal_score,
                house_from_reference(natal_moon.rasi, antar_transit.rasi),
                is_retrograde_transit=bool(antar_transit.is_retrograde),
            )
        else:
            antar_score = antar_natal_score
    else:
        antar_score = _planet_period_score(antar_lord) if antar_lord in PLANET_PERIOD_SCORE else 50
    planet_strength_map: dict[str, int] = {}
    if natal_maha_data:
        planet_strength_map[maha_lord] = maha_natal_score
    if natal_antar_data:
        planet_strength_map[antar_lord] = antar_natal_score
    natal_praty_data = next((p for p in chart_snapshot.data.planets if p.graha == pratyantar_lord), None)
    if natal_praty_data:
        praty_score = int(getattr(natal_praty_data, "strength_score", 0) or 0)
        if praty_score <= 0:
            praty_score = compute_natal_planet_score(
                planet=pratyantar_lord,
                natal_rasi=natal_praty_data.rasi,
                natal_longitude=float(natal_praty_data.absolute_longitude),
                natal_lagna_rasi=natal_lagna,
                sun_longitude=sun_lon,
                is_retrograde=natal_praty_data.is_retrograde,
                is_vargottama=bool(natal_praty_data.is_vargottama),
                d9_rasi=natal_praty_data.d9_rasi,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
            )
        planet_strength_map[pratyantar_lord] = praty_score

    # Compute native's age for life-stage dasha modifier
    profile_age = (on_date - birth_profile.birth_date_local).days // 365

    # Apply functional-nature modifier (lagna-based) + age-phase modifier (Thirukanitham)
    maha_score  = max(10, min(95, round(maha_score  * get_dasha_modifier(natal_lagna, maha_lord)  * _age_dasha_modifier(profile_age, maha_lord))))
    antar_score = max(10, min(95, round(antar_score * get_dasha_modifier(natal_lagna, antar_lord) * _age_dasha_modifier(profile_age, antar_lord))))

    # Relationship weight raised from 0.10 → 0.25: enemy lords cause meaningful score divergence
    relationship_score = _graha_relationship_score(maha_lord, antar_lord)
    dasha_score = max(0, min(100, round(maha_score * 0.45 + antar_score * 0.30 + relationship_score * 0.25)))

    panchangam_score = 70
    if panchangam.tithi_number in [4, 9, 14, 19, 24, 29]:
        panchangam_score -= 15
    # Ashtami (8th tithi in both pakshas) — mild caution
    # Amavasai (30) is NOT penalised: it is a sacred Pitru Tarpan day, not an inauspicious one
    if panchangam.tithi_number in {8, 23}:
        panchangam_score -= 10
    if panchangam.yoga_number in CAUTION_YOGAS:
        panchangam_score -= 10
    if panchangam.karana_name == "VISHTI":
        panchangam_score -= 10
    if panchangam.weekday_lord == _rasi_lord(natal_lagna):
        panchangam_score += 8
    if panchangam.weekday_lord == maha_lord:
        panchangam_score += 5

    # Activity-specific timing adjustment: when a goal is active, check
    # Thirukanitham timing rules and modulate panchangam score accordingly.
    if active_goals:
        _goal_type = active_goals[0].goal_type
        _activity = _goal_type if _goal_type in (
            "job_change", "business_start", "marriage", "education",
            "property", "health", "travel_abroad", "spiritual",
            "family_harmony", "money", "child_birth",
        ) else "other"
        _timing = assess_activity_timing(
            activity=_activity,
            tithi_number=panchangam.tithi_number,
            paksha=panchangam.tithi_paksha,
            weekday_lord=panchangam.weekday_lord,
        )
        if _timing.combined_alignment == "SUPPORTS":
            panchangam_score += 5
        elif _timing.combined_alignment == "CAUTION":
            panchangam_score -= 8

    panchangam_score = max(0, min(100, panchangam_score))

    # Ezhara Sani / Ashtama Sani from natal Moon (primary Saturn cycle)
    saturn_cycle = classify_sani_cycle(house_from_reference(natal_moon.rasi, saturn.rasi))
    # Kantaka Sani from natal Lagna (independent cycle per spec §6.3)
    kantaka_sani = classify_kandaka_cycle(house_from_reference(natal_lagna, saturn.rasi))

    personal_safety_score = 60
    if chandrashtama:
        personal_safety_score -= 15
    if saturn_cycle.is_active:
        if saturn_cycle.type in {"JANMA_SANI", "EZHARAI_SANI_PHASE_1", "EZHARAI_SANI_PHASE_3"}:
            # Sade Sati is a caution cycle, but never treated as flatly "bad".
            personal_safety_score -= 7
        elif saturn_cycle.type == "ARDHASHTAMA_SANI":
            personal_safety_score -= 9
        elif saturn_cycle.type == "ASHTAMA_SANI":
            personal_safety_score -= 12
    # Kantaka from Lagna: independent penalty only when Ezhara/Ashtama is not already active
    # to avoid double-counting when both cycles overlap on the same person
    if kantaka_sani.is_active and not saturn_cycle.is_active:
        personal_safety_score -= 7
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

    best_windows = _best_hours(panchangam, maha_lord, lagna_rasi=natal_lagna, current_antar_lord=antar_lord)
    caution_windows = _caution_windows(panchangam)
    # Remedial support reflects the *quality* of available windows, not merely their
    # presence (every day has some Nalla Neram). Full credit only when a personal-hora
    # window — ruled by the native's own lagna/dasha lords — is available; a partial
    # credit for generic benefic/Abhijit windows; none when the day offers nothing.
    _has_personal_window = any("PERSONAL_HORA" in w.type for w in best_windows)
    remedial_support = 6 if _has_personal_window else (3 if best_windows else 0)

    score = round(
        moon_score * 0.30
        + transit_score * 0.25
        + dasha_score * 0.20
        + panchangam_score * 0.15
        + personal_safety_score * 0.10
        + remedial_support
    )
    score = max(0, min(100, score))
    label = _score_label(score)

    # P1-B: Confidence tier — count of components scoring ≥60
    _conf_signals = sum(1 for s in (moon_score, dasha_score, transit_score) if s >= 60)
    if _conf_signals >= 3:
        _confidence = "HIGH"
        _conf_reason = DailyGuidanceText(
            ta="மூன்று சமிக்ஞைகளும் — சந்திரன், தசை, கோசாரம் — சீரமைக்கப்பட்டுள்ளன",
            en="All three signals — Moon, dasha, transits — are aligned",
        )
    elif _conf_signals == 2:
        _confidence = "MEDIUM"
        _conf_reason = DailyGuidanceText(
            ta="இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன",
            en="Two of three signals are aligned",
        )
    else:
        _confidence = "LOW"
        _conf_reason = DailyGuidanceText(
            ta="சமிக்ஞைகள் கலந்த நிலையில் உள்ளன — குறிப்பு மட்டுமே",
            en="Mixed signals — indicative only",
        )
    text, action, caution = _build_text(score, label, best_windows, caution_windows)
    nakshatra_perspective = build_nakshatra_perspective(janma_nakshatra, label)
    emotional_weather = compute_emotional_weather(
        natal_moon_longitude=natal_moon.absolute_longitude,
        natal_venus_longitude=natal_venus.absolute_longitude,
        lagna_rasi=natal_lagna,
        transits={
            "SATURN": TransitPoint(
                absolute_longitude=saturn.absolute_longitude,
                rasi=saturn.rasi,
            ),
            "JUPITER": TransitPoint(
                absolute_longitude=jupiter.absolute_longitude,
                rasi=jupiter.rasi,
            ),
            "MARS": TransitPoint(
                absolute_longitude=mars.absolute_longitude,
                rasi=mars.rasi,
            ),
            "VENUS": TransitPoint(
                absolute_longitude=transit_snapshot.bodies["VENUS"].absolute_longitude,
                rasi=transit_snapshot.bodies["VENUS"].rasi,
            ),
            "RAHU": TransitPoint(
                absolute_longitude=rahu.absolute_longitude,
                rasi=rahu.rasi,
            ),
            "SUN": TransitPoint(
                absolute_longitude=sun.absolute_longitude,
                rasi=sun.rasi,
            ),
        },
    )

    best_start = best_windows[0].start if best_windows else None
    best_end = best_windows[0].end if best_windows else None
    best_label = f"{best_windows[0].start}–{best_windows[0].end}" if best_windows else None
    rahu_start = caution_windows[0].start if caution_windows else "00:00"
    rahu_end = caution_windows[0].end if caution_windows else "00:00"

    jupiter_house = house_from_reference(natal_moon.rasi, jupiter.rasi)
    saturn_house = house_from_reference(natal_moon.rasi, saturn.rasi)
    mercury_combust = is_combust(
        "MERCURY",
        transit_snapshot.bodies["MERCURY"].absolute_longitude,
        sun.absolute_longitude,
        transit_snapshot.bodies["MERCURY"].is_retrograde,
    )
    afflicted_planets = _collect_afflicted_planets(chart_snapshot)

    reasons = build_score_reasons(
        score=score,
        current_nakshatra=current_nakshatra,
        janma_nakshatra=janma_nakshatra,
        chandrashtama=chandrashtama,
        current_moon_rasi=moon.rasi,
        janma_rasi=natal_moon.rasi,
        moon_score=moon_score,
        maha_lord=maha_lord,
        antar_lord=antar_lord,
        dasha_score=dasha_score,
        tithi_number=panchangam.tithi_number,
        yoga_number=panchangam.yoga_number,
        karana_name=panchangam.karana_name,
        weekday_lord=panchangam.weekday_lord,
        panchangam_score=panchangam_score,
        panchangam_nakshatra=panchangam.nakshatra_number,
        jupiter_house_from_moon=jupiter_house,
        saturn_house_from_moon=saturn_house,
        sani_cycle_type=saturn_cycle.type if saturn_cycle.is_active else None,
        sani_cycle_active=saturn_cycle.is_active,
        kantaka_sani_active=kantaka_sani.is_active,
        transit_score=round(transit_score),
        mercury_combust=mercury_combust,
        abhijit_restricted=panchangam.abhijit_restricted,
        personal_score=personal_safety_score,
        best_window_start=best_start,
        best_window_end=best_end,
        best_window_label=best_label,
        rahu_kalam_start=rahu_start,
        rahu_kalam_end=rahu_end,
        afflicted_planets=afflicted_planets,
    )

    action_suggestion = DailyGuidanceSuggestion(ta=reasons.action.ta, en=reasons.action.en)
    action_suggestion = _enrich_action_with_goals(
        action_suggestion,
        active_goals or [],
        maha_lord,
        label,
        tithi_number=panchangam.tithi_number,
        paksha=panchangam.tithi_paksha,
        weekday_lord=panchangam.weekday_lord,
    )
    if goal_track and not active_goals:
        action_suggestion = _enrich_action_with_goal_track(
            action_suggestion, goal_track, maha_lord, label
        )
    context_surface = should_surface_proactively(
        context_row,
        for_date=on_date,
        score_label=label,
        saturn_house_from_moon=saturn_house,
    )
    context_insight = (
        DailyGuidanceText(ta=context_surface.ta or "", en=context_surface.en or "")
        if context_surface.should_surface
        else None
    )

    def _build_tithi_card(tithi_number: int) -> DailyGuidanceText | None:
        card = tithi_content_card(tithi_number)
        if card is None:
            return None
        return DailyGuidanceText(ta=card.ta, en=card.en)

    pratyantar_days_remaining = max(0, (timeline.current_pratyantardasha.end_date - on_date).days)
    pratyantar_story = _pratyantar_narrative(
        pratyantar_lord=pratyantar_lord,
        pratyantar_days_remaining=pratyantar_days_remaining,
        mahadasha_lord=maha_lord,
        antardasha_lord=antar_lord,
        planet_scores=planet_strength_map,
        lang=language,
    )
    hora_lord = _current_hora_lord(panchangam, on_date, resolve_effective_daily_timezone(birth_profile))

    return DailyGuidanceResponse(
        data=DailyGuidanceData(
            chartId=chart_id,
            dateLocal=on_date,
            score=score,
            label=label,
            confidence=_confidence,
            confidenceReason=_conf_reason,
            scoreBreakdown=DailyGuidanceScoreBreakdown(
                moonTransit=round(moon_score * 0.30),
                dashaSupport=round(dasha_score * 0.20),
                panchangam=round(panchangam_score * 0.15),
                gocharSupport=round(transit_score * 0.25),
                # Shortfall from an unafflicted day (baseline 60), scaled by the real
                # 0.10 weight used in the score formula — keeps this driver dimensionally
                # consistent with moonTransit/dashaSupport/etc. (≤0 = personal-safety drag).
                personalCautions=round((personal_safety_score - 60) * 0.10),
                remedialActionSupport=remedial_support,
            ),
            bestWindows=best_windows,
            cautionWindows=caution_windows,
            text=DailyGuidanceText(ta=reasons.summary.ta, en=reasons.summary.en),
            nakshatraPerspective=DailyGuidanceText(
                ta=nakshatra_perspective.ta,
                en=nakshatra_perspective.en,
            ),
            emotionalWeather=DailyGuidanceEmotionalWeather(
                tone=emotional_weather.tone,
                physicalTendency=emotional_weather.physical_tendency,
                bestUseOfDay=emotional_weather.best_use_of_day,
                avoidBefore=(
                    DailyGuidanceText(
                        ta=emotional_weather.avoid_before.ta,
                        en=emotional_weather.avoid_before.en,
                    )
                    if emotional_weather.avoid_before is not None
                    else None
                ),
                toneText=DailyGuidanceText(
                    ta=emotional_weather.tone_text.ta,
                    en=emotional_weather.tone_text.en,
                ),
                physicalTendencyText=DailyGuidanceText(
                    ta=emotional_weather.physical_tendency_text.ta,
                    en=emotional_weather.physical_tendency_text.en,
                ),
                bestUseOfDayText=DailyGuidanceText(
                    ta=emotional_weather.best_use_of_day_text.ta,
                    en=emotional_weather.best_use_of_day_text.en,
                ),
            ),
            contextInsight=context_insight,
            journalInsight=journal_insight,
            actionSuggestion=action_suggestion,
            cautionSuggestion=DailyGuidanceSuggestion(ta=reasons.caution.ta, en=reasons.caution.en),
            reasons=DailyGuidanceReasons(
                moonTransit=DailyGuidanceText(ta=reasons.moon_transit.ta, en=reasons.moon_transit.en),
                dashaSupport=DailyGuidanceText(ta=reasons.dasha_support.ta, en=reasons.dasha_support.en),
                panchangam=DailyGuidanceText(ta=reasons.panchangam.ta, en=reasons.panchangam.en),
                gochar=DailyGuidanceText(ta=reasons.gochar.ta, en=reasons.gochar.en),
                personalCaution=DailyGuidanceText(ta=reasons.personal_caution.ta, en=reasons.personal_caution.en),
                summary=DailyGuidanceText(ta=reasons.summary.ta, en=reasons.summary.en),
            ),
            remedy=DailyGuidanceText(ta=reasons.remedy.ta, en=reasons.remedy.en),
            currentHoraLord=hora_lord,
            pratyantarNarrative=(
                DailyGuidanceText(ta=pratyantar_story["ta"], en=pratyantar_story["en"])
                if pratyantar_story is not None
                else None
            ),
            tithiCard=_build_tithi_card(panchangam.tithi_number),
            isChandrashtama=chandrashtama,
            saturnCycleAlert=saturn_cycle.type if saturn_cycle.is_active and saturn_cycle.type in {"JANMA_SANI", "ASHTAMA_SANI"} else None,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_daily_guidance(
    session: Session,
    chart_id: UUID,
    on_date: date,
    language: str = "ta-en",
    *,
    chart_snapshot: ChartCalculateResponse | None = None,
    preloaded_cache: dict[date, DailyGuidanceResponse] | None = None,
) -> DailyGuidanceResponse:
    from app.models.user import User as _User
    chart_snapshot = chart_snapshot or load_persisted_chart_response(session, chart_id)
    active_goals = get_active_goals_for_chart(session, chart_id)
    owner_user_id = chart_snapshot.data.birth_profile.owner_user_id
    _user_row = session.get(_User, owner_user_id)
    goal_track = getattr(_user_row, "goal_track", None) if _user_row else None
    context_row = get_context_row(session, owner_user_id, chart_id)
    journal_insight = _build_journal_insight(
        session,
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        on_date=on_date,
    )
    can_use_cache = not active_goals and context_row is None and journal_insight is None and not goal_track
    birth_profile_id = chart_snapshot.data.birth_profile.birth_profile_id
    if can_use_cache:
        if preloaded_cache is not None:
            cached = preloaded_cache.get(on_date)
        else:
            cached = _load_daily_score_cache(
                session,
                birth_profile_id=birth_profile_id,
                score_date=on_date,
                calculation_version=chart_snapshot.meta.calculation_version,
            )
        if cached is not None:
            return cached

    response = build_daily_guidance_response(
        chart_snapshot,
        on_date,
        language,
        session=session,
        active_goals=active_goals,
        context_row=context_row,
        journal_insight=journal_insight,
        goal_track=goal_track,
    )
    if can_use_cache:
        _store_daily_score_cache(
            session,
            birth_profile_id=birth_profile_id,
            score_date=on_date,
            response=response,
            calculation_version=chart_snapshot.meta.calculation_version,
        )
    return response


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
        .limit(1)
    ).scalar_one_or_none()
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    chart_snapshot = load_persisted_chart_response(session, chart.chart_id)
    preloaded_cache = _load_daily_score_cache_range(
        session,
        birth_profile_id=chart_snapshot.data.birth_profile.birth_profile_id,
        start_date=from_date,
        end_date=to_date,
        calculation_version=chart_snapshot.meta.calculation_version,
    )

    items: list[DailyGuidanceData] = []
    current = from_date
    while current <= to_date:
        items.append(
            get_daily_guidance(
                session,
                chart.chart_id,
                current,
                language,
                chart_snapshot=chart_snapshot,
                preloaded_cache=preloaded_cache,
            ).data
        )
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


_MAHADASHA_THEMES: dict[str, dict[str, str]] = {
    "KETU":    {"ta": "ஆன்மீகம், விலகல், மறைந்த விஷயங்கள்",   "en": "Spirituality, detachment, hidden matters"},
    "VENUS":   {"ta": "உறவுகள், கலை, ஐஸ்வர்யம், வாகனம்",     "en": "Relationships, arts, luxury, vehicles"},
    "SUN":     {"ta": "தொழில், அதிகாரம், தந்தை, உடல்நலம்",    "en": "Career, authority, father, vitality"},
    "MOON":    {"ta": "மனம், தாய், உணர்வு, பயணம்",            "en": "Mind, mother, emotions, travel"},
    "MARS":    {"ta": "ஆற்றல், உடன்பிறப்பு, சொத்து",          "en": "Energy, siblings, property, courage"},
    "RAHU":    {"ta": "லட்சியம், வெளிநாடு, திடீர் மாற்றம்",   "en": "Ambition, foreign connections, sudden changes"},
    "JUPITER": {"ta": "அறிவு, குழந்தை, செல்வம், விரிவாக்கம்", "en": "Knowledge, children, wealth, expansion"},
    "SATURN":  {"ta": "ஒழுக்கம், பொறுப்பு, சேவை, ஆயுள்",    "en": "Discipline, responsibility, service, longevity"},
    "MERCURY": {"ta": "தொடர்பு, வியாபாரம், கல்வி",            "en": "Communication, business, education"},
}

_SPECIAL_TITHI: dict[int, str] = {
    30: "AMAVASAI",
    15: "POURNAMI",
    13: "PRADOSHAM",
    28: "PRADOSHAM",
    11: "EKADASI",
    26: "EKADASI",
}


def get_week_ahead(
    session: Session,
    profile_id: UUID,
    week_start: date,
    language: str = "ta-en",
    calculation_version: str = "thirukanitham-2026-v1",
) -> WeekAheadResponse:
    """
    FEATURE-07: Weekly digest endpoint.
    Returns a 7-day summary using the existing daily guidance engine.
    """
    week_end = week_start + timedelta(days=6)
    range_response = get_daily_guidance_range(session, profile_id, week_start, week_end, language)
    chart_id = range_response.data.chart_id

    # Find the chart to get dasha info
    chart = session.execute(
        select(Chart)
        .where(Chart.birth_profile_id == profile_id, Chart.status == "completed")
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == profile_id)
    ).scalar_one_or_none()

    # Build per-day items
    day_items: list[WeekAheadDayItem] = []
    best_score = -1
    best_day = week_start
    chandrashtama_days: list[date] = []
    special_tithi_days: list[date] = []

    for day_data in range_response.data.items:
        tithi_num = 0
        nakshatra_num = 0
        dominant_special_tithi_num: int | None = None
        if birth_profile is not None:
            daily_location = resolve_effective_daily_location(birth_profile)
            panchangam = calculate_daily_panchangam(
                day_data.date_local,
                daily_location.latitude,
                daily_location.longitude,
                daily_location.timezone,
            )
            tithi_num = panchangam.tithi_number
            nakshatra_num = panchangam.nakshatra_number
            dominant_special_tithi_num = panchangam.special_tithi_day_number
        special = (
            _SPECIAL_TITHI[dominant_special_tithi_num]
            if dominant_special_tithi_num in {15, 30}
            else _SPECIAL_TITHI.get(tithi_num)
        )
        if special is not None:
            special_tithi_days.append(day_data.date_local)
        is_chandrashtama = day_data.is_chandrashtama
        if is_chandrashtama:
            chandrashtama_days.append(day_data.date_local)

        if day_data.score > best_score:
            best_score = day_data.score
            best_day = day_data.date_local

        best_win_start: str | None = day_data.best_windows[0].start if day_data.best_windows else None

        day_items.append(WeekAheadDayItem(
            dateLocal=day_data.date_local,
            score=day_data.score,
            label=day_data.label,
            nakshatraNumber=nakshatra_num,
            tithiNumber=tithi_num,
            isChandrashtama=is_chandrashtama,
            specialTithi=special,
            bestWindowStart=best_win_start,
        ))

    # Dasha theme from current maha lord
    dasha_theme_ta = "—"
    dasha_theme_en = "—"
    if chart is not None:
        try:
            chart_snapshot = load_persisted_chart_response(session, chart.chart_id)
            if birth_profile and chart_snapshot:
                from app.calculations.astro import utc_datetime_to_julian_day
                jd = utc_datetime_to_julian_day(local_noon_as_utc_for_profile(week_start, birth_profile))
                natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
                if birth_profile.birth_time_local is None:
                    birth_jd_val = float(chart_snapshot.data.julian_day)
                else:
                    birth_jd_val = utc_datetime_to_julian_day(
                        local_datetime_to_utc(
                            datetime.combine(birth_profile.birth_date_local, birth_profile.birth_time_local),
                            birth_profile.birth_timezone,
                        )
                    )
                timeline = calculate_vimshottari_timeline(birth_jd_val, float(natal_moon.absolute_longitude), jd)
                maha_lord = timeline.current_mahadasha.lord
                theme = _MAHADASHA_THEMES.get(maha_lord, {"ta": maha_lord, "en": maha_lord})
                dasha_theme_ta = theme["ta"]
                dasha_theme_en = theme["en"]
        except Exception:
            pass

    return WeekAheadResponse(
        data=WeekAheadData(
            profileId=profile_id,
            chartId=chart_id,
            weekStart=week_start,
            weekEnd=week_end,
            bestDay=best_day,
            bestDayScore=best_score,
            chandrashtamaDays=chandrashtama_days,
            specialTithiDays=special_tithi_days,
            dashaThemeTa=dasha_theme_ta,
            dashaThemeEn=dasha_theme_en,
            days=day_items,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_week_ahead_by_chart(
    session: Session,
    chart_id: UUID,
    week_start: date,
    language: str = "ta-en",
    calculation_version: str = "thirukanitham-2026-v1",
) -> WeekAheadResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")
    return get_week_ahead(session, chart.birth_profile_id, week_start, language, calculation_version)


def get_activity_timing(
    session: Session,
    chart_id: UUID,
    activity: str,
    month: str,
    calculation_version: str = "thirukanitham-2026-v1",
) -> ActivityTimingResponse:
    """
    FEATURE-08: Returns top 5 dates in the given month ranked by activity alignment.
    month format: YYYY-MM
    """
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    normalized_activity = _normalize_activity_timing_activity(activity)

    year, mon = int(month[:4]), int(month[5:7])
    from calendar import monthrange
    _, days_in_month = monthrange(year, mon)

    chart_snapshot = load_persisted_chart_response(session, chart_id)
    active_goals = get_active_goals_for_chart(session, chart_id)
    owner_user_id = chart_snapshot.data.birth_profile.owner_user_id
    context_row = get_context_row(session, owner_user_id, chart_id)
    birth_profile_id = chart_snapshot.data.birth_profile.birth_profile_id
    base_cache_eligible = not active_goals and context_row is None

    results: list[tuple[int, ActivityTimingDayResult]] = []
    alignment_rank = {"SUPPORTS": 2, "NEUTRAL": 1, "CAUTION": 0}

    # Batch-load/compute the whole month up front instead of looping per-day
    # (which previously recomputed panchangam from scratch — no session/cache —
    # and issued a separate DailyScore SELECT for every day).
    daily_location = resolve_effective_daily_location(birth_profile)
    month_start = date(year, mon, 1)
    month_end = date(year, mon, days_in_month)
    panchang_by_date = calculate_daily_panchangam_range(
        month_start,
        month_end,
        daily_location.latitude,
        daily_location.longitude,
        daily_location.timezone,
        session=session,
    )
    daily_score_cache = _load_daily_score_cache_range(
        session,
        birth_profile_id=birth_profile_id,
        start_date=month_start,
        end_date=month_end,
        calculation_version=chart_snapshot.meta.calculation_version,
    )

    for day_num in range(1, days_in_month + 1):
        d = date(year, mon, day_num)
        try:
            panchang = panchang_by_date[d]
            result = assess_activity_timing(
                activity=normalized_activity,
                tithi_number=panchang.tithi_number,
                paksha=panchang.tithi_paksha,
                weekday_lord=panchang.weekday_lord,
            )
            journal_insight = _build_journal_insight(
                session,
                owner_user_id=owner_user_id,
                chart_id=chart_id,
                on_date=d,
            )
            can_use_cache = base_cache_eligible and journal_insight is None

            cached_score: int | None = None
            if can_use_cache:
                cached_response = daily_score_cache.get(d)
                if cached_response is not None:
                    cached_score = cached_response.data.score

            if cached_score is not None:
                score = cached_score
            else:
                current_jd = utc_datetime_to_julian_day(panchang.solar_noon.astimezone(UTC))
                transit_snapshot = calculate_sidereal_planets(current_jd)
                daily_response = build_daily_guidance_response(
                    chart_snapshot,
                    d,
                    session=session,
                    panchangam=panchang,
                    transit_snapshot=transit_snapshot,
                    active_goals=active_goals,
                    context_row=context_row,
                    journal_insight=journal_insight,
                )
                if can_use_cache:
                    _store_daily_score_cache(
                        session,
                        birth_profile_id=birth_profile_id,
                        score_date=d,
                        response=daily_response,
                        calculation_version=chart_snapshot.meta.calculation_version,
                    )
                score = daily_response.data.score

            rank = alignment_rank.get(result.combined_alignment, 0) * 100 + score
            results.append((rank, ActivityTimingDayResult(
                dateLocal=d,
                score=score,
                label=_score_label(score),
                alignment=result.combined_alignment,
                reasonTa=result.combined_ta,
                reasonEn=result.combined_en,
            )))
        except Exception:
            continue

    results.sort(key=lambda x: x[0], reverse=True)
    top_dates = [item for _, item in results[:5]]

    return ActivityTimingResponse(
        data=ActivityTimingData(
            chartId=chart_id,
            activity=activity,
            month=month,
            topDates=top_dates,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

def get_dasha_story(
    session: Session,
    chart_id: UUID,
    as_of: date,
    calculation_version: str = "thirukanitham-2026-v1",
) -> DashaStoryResponse:
    """
    FEATURE-09: Returns all Mahadasha periods from birth through ~120 years with themes.
    """
    from app.models import BirthProfile

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)
    if natal_moon is None:
        raise HTTPException(status_code=422, detail="Moon data not available in chart.")

    if birth_profile.birth_time_local is None:
        raise HTTPException(status_code=422, detail="Birth time is required for Dasha story.")
    birth_dt = local_datetime_to_utc(
        datetime.combine(birth_profile.birth_date_local, birth_profile.birth_time_local),
        birth_profile.birth_timezone,
    )
    birth_jd = utc_datetime_to_julian_day(birth_dt)
    current_jd = utc_datetime_to_julian_day(local_noon_as_utc_for_profile(as_of, birth_profile))

    timeline = calculate_vimshottari_timeline(birth_jd, float(natal_moon.absolute_longitude), current_jd)
    birth_year = birth_profile.birth_date_local.year

    periods: list[DashaStoryPeriod] = []
    for maha in timeline.mahadashas:
        theme = _MAHADASHA_THEMES.get(maha.lord, {"ta": maha.lord, "en": maha.lord})
        age_start = maha.start_date.year - birth_year
        age_end = maha.end_date.year - birth_year
        is_current = (maha.start_date <= as_of <= maha.end_date)
        periods.append(DashaStoryPeriod(
            lord=maha.lord,
            startDate=maha.start_date,
            endDate=maha.end_date,
            ageStart=max(0, age_start),
            ageEnd=max(0, age_end),
            themeTa=theme["ta"],
            themeEn=theme["en"],
            isCurrent=is_current,
        ))

    return DashaStoryResponse(
        data=DashaStoryData(
            chartId=chart_id,
            openingLord=timeline.opening_lord,
            periods=periods,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


_PEYARCHI_OUTLOOK: dict[str, dict[int, dict[str, str]]] = {
    "JUPITER": {
        2:  {"ta": "கஜகேசரி யோகம் சாத்தியம். தன, குடும்ப விஷயங்கள் மேம்படலாம்.", "en": "Gajakesari yoga possible. Wealth and family matters may improve."},
        5:  {"ta": "புத்திர, கல்வி, ஆன்மீக வளர்ச்சி. நல்ல காலம்.", "en": "Good period for children, education, and spiritual growth."},
        7:  {"ta": "கல்யாண யோகம். கூட்டுறவு, வியாபாரம் சாதகம்.", "en": "Marriage and partnership prospects improve."},
        9:  {"ta": "பாக்ய ஸ்தானம். அதிர்ஷ்டம், ஆசீர்வாதம், வெற்றி.", "en": "Fortune house transit. Luck, blessings, and success."},
        11: {"ta": "லாப ஸ்தானம். வருமானம், சேர்க்கை, நண்பர்கள் ஆதரவு.", "en": "Gains house. Income, accumulation, and friend support."},
        4:  {"ta": "கேந்திர குரு — கட்டமைப்பு மாற்றம், வீடு விஷயங்கள்.", "en": "Kendra Jupiter — structural changes, home matters."},
        8:  {"ta": "கஷ்டமான குரு காலம். பொறுமையும் கவனமும் தேவை.", "en": "Challenging Jupiter transit. Patience and caution needed."},
        12: {"ta": "வெளிநாடு, ஆன்மீகம், செலவு அதிகமாகலாம்.", "en": "Possible travel, spirituality, and increased expenses."},
    },
    "SATURN": {
        1:  {"ta": "ஜன்ம சனி — மாற்றமும் முதிர்ச்சியும் தரும் காலம்; எச்சரிக்கையுடன் முன்னேறவும்.", "en": "Sade Sati peak (1st) — major life changes; proceed with discipline and perspective."},
        2:  {"ta": "ஏழரை சனி (முடிவு) — நிதியில் கட்டுப்பாடு தேவை; மெதுவாக நிலைநிறுத்தம் நடக்கும்.", "en": "Sade Sati ending (2nd) — financial caution is advised; consolidation improves over time."},
        3:  {"ta": "மூன்றாம் சனி — முயற்சிக்கு பலன், தைரியம் மற்றும் முன்னேற்றம்.", "en": "3rd Saturn — effort gets rewarded; courage and execution improve."},
        4:  {"ta": "அர்த்தாஷ்டம சனி — வீடு, மனஅமைதி, குடும்ப பொறுப்புகளில் அழுத்தம் இருக்கலாம்.", "en": "Ardhashtama phase (4th) — domestic and emotional pressure; stay grounded."},
        5:  {"ta": "ஐந்தாம் சனி — நடுநிலை. திட்டமிட்ட செயல் நிதானமாக பலன் தரும்.", "en": "5th Saturn — neutral; steady, structured action works best."},
        6:  {"ta": "ஆறாம் சனி — எதிரிகளை வெல்லலாம்; ஒழுக்கமான உழைப்பிற்கு பலன் கிடைக்கும்.", "en": "6th Saturn — strong for overcoming obstacles through disciplined effort."},
        7:  {"ta": "ஏழாம் சனி — கலப்பு/நடுநிலை பலன்; உறவில் பொறுமை மற்றும் தெளிவு தேவை.", "en": "7th Saturn — neutral to mixed; relationships improve with patience and clarity."},
        8:  {"ta": "அஷ்டம சனி — கடின பருவம்; உடல்நலம் மற்றும் ஆபத்து மேலாண்மையில் கவனம் அவசியம்.", "en": "Ashtama Sani (8th) — caution period for health and obstacles; take protective steps."},
        9:  {"ta": "ஒன்பதாம் சனி — பாக்கியம் மந்தமாகலாம்; தந்தை/குரு தொடர்பில் கவனமாக இருங்கள்.", "en": "9th Saturn — unfavourable for fortune flow; be careful in father/guru-related matters."},
        10: {"ta": "பத்தாம் சனி — கடின உழைப்பால் தொழிலில் நிலையான வளர்ச்சி சாத்தியம்.", "en": "10th Saturn — good for career growth through sustained hard work."},
        11: {"ta": "லாப சனி — நீண்ட முயற்சிக்கு பலன்; வருமானமும் வட்டார ஆதரவும்வளரும்.", "en": "11th Saturn — very supportive for gains, income, and long-term rewards."},
        12: {"ta": "ஏழரை சனி (தொடக்கம்) — செலவு, பயணம், உள்ளார்ந்த மாற்றம்; ஆன்மீக முன்னேற்றத்திற்கான காலம்.", "en": "Sade Sati beginning (12th) — expenses and transition, with strong spiritual-growth potential."},
    },
}


_HOUSE_THEME_TA: dict[int, str] = {
    1: "உடல், தன்மை, வாழ்க்கை திசை",
    2: "குடும்பம், பேச்சு, பண அடித்தளம்",
    3: "முயற்சி, துணிவு, தொடர்பு",
    4: "வீடு, மன அமைதி, சொத்து",
    5: "கல்வி, புத்தி, குழந்தைகள்",
    6: "சேவை, பழக்கங்கள், உடல் பராமரிப்பு",
    7: "உறவுகள், கூட்டாண்மை",
    8: "ஆழமான மாற்றம், மறைவு, உள்மாற்றம்",
    9: "தர்மம், ஆசீர்வாதம், உயர்கல்வி",
    10: "தொழில், பொறுப்பு, பொதுப் பங்கு",
    11: "லாபம், வலையமைப்பு, விருப்ப நிறைவு",
    12: "ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு",
}
_HOUSE_THEME_EN: dict[int, str] = {
    1: "self, body, and life direction",
    2: "family, speech, and financial foundations",
    3: "effort, courage, and communication",
    4: "home, emotional grounding, and property",
    5: "learning, intelligence, and children",
    6: "service, habits, and health management",
    7: "relationships and partnership",
    8: "deep change, hidden matters, and inner reset",
    9: "dharma, blessings, and higher learning",
    10: "career, responsibility, and public role",
    11: "gains, networks, and fulfilment of goals",
    12: "rest, foreign links, and spiritual release",
}
_ACTIVITY_TIMING_ACTIVITY_ALIASES: dict[str, ActivityType] = {
    "travel": "travel_abroad",
    "child": "child_birth",
}


def _normalize_activity_timing_activity(activity: str) -> ActivityType:
    normalized = _ACTIVITY_TIMING_ACTIVITY_ALIASES.get(activity, activity)
    allowed: set[ActivityType] = {
        "job_change",
        "business_start",
        "marriage",
        "education",
        "property",
        "health",
        "travel_abroad",
        "spiritual",
        "family_harmony",
        "money",
        "child_birth",
        "other",
    }
    if normalized not in allowed:
        raise HTTPException(status_code=422, detail="Unsupported activity type.")
    return normalized


def _node_axis_phase(rahu_house_from_moon: int) -> tuple[str, str]:
    if rahu_house_from_moon in {3, 6, 10, 11}:
        return (
            "இந்த அச்சு வெளிப்படையான முன்னேற்றம், திறன், சாதனை நோக்கை வலுப்படுத்தும்.",
            "This axis tends to externalize change through effort, skill-building, and visible progress.",
        )
    if rahu_house_from_moon in {1, 5, 7, 8, 12}:
        return (
            "இந்த அச்சு ஆழமான மறுசீரமைப்பு காலம்; வேகத்தை விட நிலைத்தன்மை முக்கியம்.",
            "This axis marks a deeper restructuring phase, so grounding matters more than speed.",
        )
    return (
        "இந்த அச்சு கலப்பு மாற்றத்தை தரும்; எது வளர வேண்டும், எது விடப்பட வேண்டும் என்பதில் தெளிவு தேவை.",
        "This axis brings mixed but meaningful change; clarity helps you separate what must grow from what must be released.",
    )


def _rahu_ketu_axis_outlook(
    planet: str,
    house_moon: int,
    house_lagna: int,
    opposite_house_moon: int,
    opposite_house_lagna: int,
) -> dict[str, str]:
    rahu_house_moon = house_moon if planet == "RAHU" else opposite_house_moon
    rahu_house_lagna = house_lagna if planet == "RAHU" else opposite_house_lagna
    ketu_house_moon = opposite_house_moon if planet == "RAHU" else house_moon
    ketu_house_lagna = opposite_house_lagna if planet == "RAHU" else house_lagna
    phase_ta, phase_en = _node_axis_phase(rahu_house_moon)

    if planet == "RAHU":
        return {
            "ta": (
                f"ராகு/கேது அச்சு மாற்றம் தொடங்குகிறது. ராகு சந்திர ராசியிலிருந்து {house_moon}ஆம் இடம் "
                f"({_HOUSE_THEME_TA[house_moon]}) மற்றும் லக்னத்திலிருந்து {house_lagna}ஆம் இடத்தை முன்னிலைப்படுத்தும். "
                f"எதிர் அச்சில் கேது {opposite_house_moon}ஆம் இடம் ({_HOUSE_THEME_TA[opposite_house_moon]}) மற்றும் "
                f"லக்னத்திலிருந்து {opposite_house_lagna}ஆம் இடங்களில் எளிமை, விடுவிப்பு, உள்ளார்ந்த திருப்பத்தை தரும். "
                f"{phase_ta}"
            ),
            "en": (
                f"Rahu/Ketu axis shift begins here. Rahu amplifies house {house_moon} from Moon "
                f"({_HOUSE_THEME_EN[house_moon]}) and house {house_lagna} from Lagna, increasing appetite and visibility in that area. "
                f"On the opposite axis, Ketu simplifies house {opposite_house_moon} from Moon "
                f"({_HOUSE_THEME_EN[opposite_house_moon]}) and house {opposite_house_lagna} from Lagna, "
                f"asking for release and inner correction. {phase_en}"
            ),
        }
    return {
        "ta": (
            f"ராகு/கேது அச்சு மாற்றம் தொடங்குகிறது. கேது சந்திர ராசியிலிருந்து {ketu_house_moon}ஆம் இடம் "
            f"({_HOUSE_THEME_TA[ketu_house_moon]}) மற்றும் லக்னத்திலிருந்து {ketu_house_lagna}ஆம் இடங்களில் எளிமை, "
            f"விடுவிப்பு, ஆன்மீக திருப்பத்தை தரும். எதிர் அச்சில் ராகு {rahu_house_moon}ஆம் இடம் "
            f"({_HOUSE_THEME_TA[rahu_house_moon]}) மற்றும் லக்னத்திலிருந்து {rahu_house_lagna}ஆம் இடங்களில் ஆசை, "
            f"வளர்ச்சி உந்துதல், வெளிப்படை இயக்கத்தை பெரிதாக்கும். {phase_ta}"
        ),
        "en": (
            f"Rahu/Ketu axis shift begins here. Ketu simplifies house {ketu_house_moon} from Moon "
            f"({_HOUSE_THEME_EN[ketu_house_moon]}) and house {ketu_house_lagna} from Lagna, encouraging release, "
            f"simplification, and inner correction. On the opposite axis, Rahu amplifies house {rahu_house_moon} "
            f"from Moon ({_HOUSE_THEME_EN[rahu_house_moon]}) and house {rahu_house_lagna} from Lagna, increasing "
            f"desire and outward movement. {phase_en}"
        ),
    }


def get_peyarchi_report(
    session: Session,
    chart_id: UUID,
    planet: str,
    as_of: date,
    calculation_version: str = "thirukanitham-2026-v1",
) -> PeyarchiReportResponse:
    """
    FEATURE-11: Personalised Peyarchi (Rasi transit) report for Jupiter, Saturn, Rahu, or Ketu.
    """
    from app.models import BirthProfile
    from app.calculations.astro import house_from_reference
    from app.services.peyarchi_service import find_next_rasi_change

    planet = planet.upper()
    if planet not in ("JUPITER", "SATURN", "RAHU", "KETU"):
        raise HTTPException(status_code=422, detail="Only JUPITER, SATURN, RAHU, and KETU are supported for peyarchi reports.")

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    chart_snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)
    natal_lagna = chart_snapshot.data.lagna.rasi

    from_dt = local_noon_as_utc_for_profile(as_of, birth_profile)
    from_jd = utc_datetime_to_julian_day(from_dt)

    current_snapshot = calculate_sidereal_planets(from_jd)
    current_rasi = current_snapshot.bodies[planet].rasi

    events: list[PeyarchiReportPeriod] = []
    scan_jd = from_jd

    for _ in range(5):
        try:
            transit_dt, next_rasi = find_next_rasi_change(planet, scan_jd)
        except Exception:
            break

        transit_date = transit_dt.date()
        house_moon = house_from_reference(natal_moon.rasi if natal_moon else 1, next_rasi)
        house_lagna = house_from_reference(natal_lagna, next_rasi)

        outlook = _PEYARCHI_OUTLOOK.get(planet, {}).get(house_moon, {
            "ta": f"கோசார {planet.capitalize()} {house_moon}ஆம் இடத்தில் — மிதமான காலம்.",
            "en": f"Transit {planet.capitalize()} in house {house_moon} — moderate period.",
        })

        if planet in {"RAHU", "KETU"}:
            opposite_rasi = ((next_rasi + 6 - 1) % 12) + 1
            opposite_house_moon = house_from_reference(natal_moon.rasi if natal_moon else 1, opposite_rasi)
            opposite_house_lagna = house_from_reference(natal_lagna, opposite_rasi)
            outlook = _rahu_ketu_axis_outlook(
                planet,
                house_moon,
                house_lagna,
                opposite_house_moon,
                opposite_house_lagna,
            )

        events.append(PeyarchiReportPeriod(
            planet=planet,
            fromRasi=current_rasi,
            toRasi=next_rasi,
            transitDate=transit_date,
            houseFromMoon=house_moon,
            houseFromLagna=house_lagna,
            outlookTa=outlook["ta"],
            outlookEn=outlook["en"],
        ))
        current_rasi = next_rasi
        scan_jd = utc_datetime_to_julian_day(transit_dt) + 10

    return PeyarchiReportResponse(
        data=PeyarchiReportData(
            chartId=chart_id,
            planet=planet,
            events=events,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


_MIN_JOURNAL_ENTRIES = 30


def get_journal_correlations(
    session: Session,
    chart_id: UUID,
    lookback_days: int = 90,
    calculation_version: str = "thirukanitham-2026-v1",
) -> JournalCorrelationResponse:
    """
    FEATURE-12: Correlates journal mood ratings with astrological conditions.
    Requires at least 30 journal entries.
    """
    from app.models import BirthProfile

    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    birth_profile = session.execute(
        select(BirthProfile).where(BirthProfile.birth_profile_id == chart.birth_profile_id)
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    cutoff = date.today() - timedelta(days=lookback_days)
    entries = session.execute(
        select(JournalEntry)
        .where(
            JournalEntry.chart_id == chart_id,
            JournalEntry.entry_date >= cutoff,
        )
        .order_by(JournalEntry.entry_date.desc())
    ).scalars().all()

    entry_count = len(entries)
    has_data = entry_count >= _MIN_JOURNAL_ENTRIES

    if not has_data:
        return JournalCorrelationResponse(
            data=JournalCorrelationData(
                chartId=chart_id,
                entryCount=entry_count,
                lookbackDays=lookback_days,
                correlations=[],
                minimumEntriesRequired=_MIN_JOURNAL_ENTRIES,
                hasSufficientData=False,
            ),
            meta=ResponseMeta(
                calculation_version=calculation_version,
                generated_at=datetime.now(tz=UTC),
            ),
        )

    # Group entries by daily guidance label (proxy via score stored in context or default)
    chandrashtama_entries = []
    non_chandrashtama_entries = []
    score_buckets: dict[str, list[float]] = {"STRONG_SUPPORT": [], "GOOD": [], "BALANCED": [], "CAUTION": [], "RESTORATIVE": []}

    for entry in entries:
        try:
            guidance = get_daily_guidance(session, chart_id, entry.entry_date)
            label = guidance.data.label
            if label in score_buckets and hasattr(entry, "mood_rating") and entry.mood_rating is not None:
                score_buckets[label].append(float(entry.mood_rating))
            if guidance.data.is_chandrashtama:
                if hasattr(entry, "mood_rating") and entry.mood_rating is not None:
                    chandrashtama_entries.append(float(entry.mood_rating))
            else:
                if hasattr(entry, "mood_rating") and entry.mood_rating is not None:
                    non_chandrashtama_entries.append(float(entry.mood_rating))
        except Exception:
            continue

    correlations: list[JournalCorrelationItem] = []

    # Score label correlations
    label_desc = {
        "STRONG_SUPPORT": ("வலுவான ஆதரவு நாட்களில்", "On strong support days"),
        "GOOD":           ("நல்ல நாட்களில்",           "On good days"),
        "BALANCED":       ("நிலையான நாட்களில்",        "On balanced days"),
        "CAUTION":        ("கவன நாட்களில்",            "On caution days"),
        "RESTORATIVE":    ("ஓய்வு நாட்களில்",          "On restorative days"),
    }
    for label, moods in score_buckets.items():
        if len(moods) >= 3:
            avg = sum(moods) / len(moods)
            ta_desc, en_desc = label_desc[label]
            correlations.append(JournalCorrelationItem(
                condition=label,
                sampleCount=len(moods),
                avgMood=round(avg, 2),
                descriptionTa=f"{ta_desc} உங்கள் சராசரி மனோநிலை மதிப்பெண்: {avg:.1f}/10.",
                descriptionEn=f"{en_desc}, your average mood rating was {avg:.1f}/10.",
            ))

    # Chandrashtama correlation
    if len(chandrashtama_entries) >= 3 and len(non_chandrashtama_entries) >= 3:
        avg_chan = sum(chandrashtama_entries) / len(chandrashtama_entries)
        avg_non = sum(non_chandrashtama_entries) / len(non_chandrashtama_entries)
        correlations.append(JournalCorrelationItem(
            condition="CHANDRASHTAMA",
            sampleCount=len(chandrashtama_entries),
            avgMood=round(avg_chan, 2),
            descriptionTa=(
                f"சந்திராஷ்டமம் நாட்களில் உங்கள் சராசரி மனோநிலை: {avg_chan:.1f}/10 "
                f"(மற்ற நாட்களில் {avg_non:.1f}/10)."
            ),
            descriptionEn=(
                f"On Chandrashtama days, your average mood was {avg_chan:.1f}/10 "
                f"(vs {avg_non:.1f}/10 on other days)."
            ),
        ))

    correlations.sort(key=lambda c: c.sample_count, reverse=True)

    return JournalCorrelationResponse(
        data=JournalCorrelationData(
            chartId=chart_id,
            entryCount=entry_count,
            lookbackDays=lookback_days,
            correlations=correlations,
            minimumEntriesRequired=_MIN_JOURNAL_ENTRIES,
            hasSufficientData=True,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


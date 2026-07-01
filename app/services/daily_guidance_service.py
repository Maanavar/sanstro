from __future__ import annotations

from calendar import monthrange
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.activity_timing_rules import assess_activity_timing
from app.calculations.ashtakavarga import compute_bhinnashtakavarga
from app.calculations.astro import (
    house_from_reference,
    local_datetime_to_utc,
    nakshatra_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import compute_natal_planet_score
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.functional_nature import get_dasha_modifier, get_transit_modifier
from app.calculations.panchangam import calculate_daily_panchangam, calculate_daily_panchangam_range
from app.calculations.transits import check_vedha, classify_kandaka_cycle, classify_sani_cycle, is_combust
from app.models import BirthProfile, Chart, JournalEntry
from app.schemas.charts import ChartCalculateResponse
from app.schemas.daily_guidance import (
    ActivityTimingData,
    ActivityTimingDayResult,
    ActivityTimingResponse,
    DailyGuidanceData,
    DailyGuidanceEmotionalWeather,
    DailyGuidanceJournalInsight,
    DailyGuidanceRangeData,
    DailyGuidanceRangeResponse,
    DailyGuidanceReasons,
    DailyGuidanceResponse,
    DailyGuidanceScoreBreakdown,
    DailyGuidanceSuggestion,
    DailyGuidanceText,
    DailyGuidanceWindow,
    JournalCorrelationData,
    JournalCorrelationItem,
    JournalCorrelationResponse,
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

# Sub-module imports — all symbols are re-exported here so existing consumers
# that import directly from daily_guidance_service continue to work unchanged.
from app.services._dg_scoring import (
    AUSPICIOUS_DAILY_NAKSHATRAS,
    CAUTION_YOGAS,
    PLANET_DAILY_WEIGHT,
    PLANET_PERIOD_SCORE,
    SIGN_LORDS,
    TRANSIT_BASE_SCORE,
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    _age_dasha_modifier,
    _angular_sep,
    _birth_datetime_utc,
    _collect_afflicted_planets,
    _dasha_lord_strength_score,
    _graha_relationship_score,
    _normalize_graha_name,
    _planet_period_score,
    _pratyantar_narrative,
    _rasi_lord,
    _score_label,
    _to_utc,
    _transit_with_av_score,
)
from app.services._dg_hora import (
    _MALEFIC_HORA_LORDS,
    _NATURAL_BENEFIC_LORDS,
    _best_hours,
    _build_text,
    _caution_windows,
    _current_hora_lord,
    _money_hora_name,
    _personal_hora_lords,
)
from app.services._dg_cache import (
    DAILY_SCORE_ENGINE_VERSION,
    _cache_version,
    _load_daily_score_cache,
    _load_daily_score_cache_range,
    _store_daily_score_cache,
)
from app.services._dg_goals import (
    _GOAL_DASHA_AFFINITY,
    _GOAL_LABEL_EN,
    _GOAL_LABEL_TA,
    _GOAL_TRACK_DASHA_AFFINITY,
    _GOAL_TRACK_EN,
    _GOAL_TRACK_TA,
    _JOURNAL_INSIGHT_LOOKBACK_DAYS,
    _PLANET_EN,
    _PLANET_TA,
    _build_journal_insight,
    _enrich_action_with_goal_track,
    _enrich_action_with_goals,
)
from app.services._dg_peyarchi import (
    _ACTIVITY_TIMING_ACTIVITY_ALIASES,
    _HOUSE_THEME_EN,
    _HOUSE_THEME_TA,
    _MAHADASHA_THEMES,
    _PEYARCHI_OUTLOOK,
    _node_axis_phase,
    _normalize_activity_timing_activity,
    _rahu_ketu_axis_outlook,
    get_dasha_story,
    get_peyarchi_report,
)

__all__ = [
    # Public API
    "build_daily_guidance_response",
    "get_daily_guidance",
    "get_daily_guidance_range",
    "get_week_ahead",
    "get_week_ahead_by_chart",
    "get_activity_timing",
    "get_journal_correlations",
    "get_dasha_story",
    "get_peyarchi_report",
    # Re-exported constants (consumed by tests and other services)
    "TRANSIT_BASE_SCORE",
    "DAILY_SCORE_ENGINE_VERSION",
    # Re-exported private helpers (consumed by tests and qa_service)
    "_build_text",
    "_graha_relationship_score",
]

_SPECIAL_TITHI: dict[int, str] = {
    30: "AMAVASAI",
    15: "POURNAMI",
    13: "PRADOSHAM",
    28: "PRADOSHAM",
    11: "EKADASI",
    26: "EKADASI",
}

_MIN_JOURNAL_ENTRIES = 30


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

    # Tarabalam — full 9-tara cycle repeating across all 27 nakshatras.
    # tara_pos cycles 1-9 as today's nakshatra steps away from the birth star.
    # Janma(1) Sampat(2) Vipat(3) Kshema(4) Pratyak(5) Sadhana(6) Naidhana(7) Mitra(8) Parama Mitra(9)
    _tara_pos = ((current_nakshatra - janma_nakshatra) % 27) % 9 + 1
    _TARA_DELTA: dict[int, int] = {
        1: -20,  # Janma
        2:  +8,  # Sampat
        3: -15,  # Vipat
        4:  +8,  # Kshema
        5: -10,  # Pratyak
        6:  +5,  # Sadhana
        7: -15,  # Naidhana
        8:  +8,  # Mitra
        9: +12,  # Parama Mitra
    }
    moon_score += _TARA_DELTA[_tara_pos]
    # Chandrashtama = Moon in the 8th Rasi from natal Janma Rasi (per spec §4.11)
    # NOT the 8th Nakshatra — Nakshatra and Rasi boundaries do not align
    chandrashtama_rasi = ((natal_moon.rasi - 1 + 7) % 12) + 1
    chandrashtama = moon.rasi == chandrashtama_rasi
    if chandrashtama:
        moon_score -= 25
    # Chandrashtama nullifies the transit nakshatra's daily auspiciousness (Thirukanitham §4.11)
    if current_nakshatra in AUSPICIOUS_DAILY_NAKSHATRAS and not chandrashtama:
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
        if saturn_cycle.type in {"JANMA_SANI", "EZHARAI_SANI_PHASE_1", "EZHARAI_SANI_PHASE_2", "EZHARAI_SANI_PHASE_3"}:
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

    # Weights (0.28+0.24+0.19+0.14+0.09 = 0.94) plus flat remedial max 6 → total max = 100.
    # Each component is rounded first; total is their sum — no double-rounding discrepancy.
    _moon_c     = round(moon_score * 0.28)
    _transit_c  = round(transit_score * 0.24)
    _dasha_c    = round(dasha_score * 0.19)
    _panch_c    = round(panchangam_score * 0.14)
    _personal_c = round(personal_safety_score * 0.09)
    score = min(100, _moon_c + _transit_c + _dasha_c + _panch_c + _personal_c + remedial_support)
    label = _score_label(score)
    # Chandrashtama is a prohibition period in Thirukanitham — no day in ashtama can be
    # labelled positively even if dasha/transits are strong.
    if chandrashtama and label in ("GOOD", "STRONG_SUPPORT"):
        label = "BALANCED"

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
    best_label = f"{best_windows[0].start}-{best_windows[0].end}" if best_windows else None
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
                moonTransit=_moon_c,
                dashaSupport=_dasha_c,
                panchangam=_panch_c,
                gocharSupport=_transit_c,
                personalCautions=_personal_c,
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
        except Exception:  # noqa: S110 — optional dasha theme enrichment; omitted on failure
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
        except Exception:  # noqa: S112 — skip an un-scorable candidate date, keep the rest
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
        except Exception:  # noqa: S112 — skip an un-correlatable journal entry, keep the rest
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

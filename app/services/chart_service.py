from __future__ import annotations

import json
from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import (
    degree_in_rasi,
    house_from_reference,
    julian_day_to_utc_datetime,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.transits import RASI_NAMES, is_combust
from app.calculations.panchangam import NAKSHATRA_NAMES
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets, calculate_rise_transit_jd
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ashtakavarga import compute_bhinnashtakavarga
from app.calculations.bhava_chalit import compute_bhava_chalit
from app.calculations.chart_strength import compute_natal_planet_score, compute_strength_breakdown, detect_planetary_wars
from app.calculations.divisional_charts import get_varga
from app.calculations.functional_nature import get_functional_nature
from app.calculations.nakshatra_analysis import build_dispositor_chain, gandanta_detail, pushkara_check
from app.calculations.yoga_activation import yoga_activation_score
from app.calculations.yogas import NakshatraCautionResult, detect_yogas_and_doshams
from app.calculations.d9_chart import calculate_d9_chart
from app.calculations.panchangam import calculate_daily_panchangam
from app.core.encryption import encrypt_bytes
from app.models import BirthProfile, Chart, ChartPlanet, User
from app.models.user_life_events import UserLifeEvent
from app.schemas.birth_profiles import BirthProfileCreate, BirthProfileResponse
from app.schemas.charts import (
    AyanamsaInfo,
    ChartCalculateRequest,
    ChartCalculateResponse,
    ChartCalculateResponseData,
    ChartDoshamInsight,
    ChartNakshatraCaution,
    ChartSummaryData,
    ChartSummaryResponse,
    ChartSummaryText,
    JadhagamReportAgeWiseTimeline,
    JadhagamReportBirthProfile,
    JadhagamReportCoreIdentity,
    JadhagamReportDashaAnalysis,
    JadhagamReportData,
    JadhagamReportExecutiveSummary,
    JadhagamReportNavamsaSummary,
    JadhagamReportPlanetStrengthItem,
    JadhagamReportPlanetStrengthSummary,
    JadhagamReportRasiSummary,
    JadhagamReportResponse,
    JadhagamReportYogaDoshamSummary,
    ChartYogaInsight,
    LagnaPosition,
    PlanetPosition,
    ResponseMeta,
)
from app.services.age_phase_service import (
    build_executive_summary,
    build_year_guidance,
    get_active_life_phases,
    get_age_based_practical_guidance,
    get_age_based_remedies,
)
from app.services.rectification_service import validate_chart_against_events

RASI_NUMBERS = {name: number for number, name in RASI_NAMES.items()}
PLANET_ORDER = {
    "SUN": 0,
    "MOON": 1,
    "MARS": 2,
    "MERCURY": 3,
    "JUPITER": 4,
    "VENUS": 5,
    "SATURN": 6,
    "RAHU": 7,
    "KETU": 8,
    "MANDHI": 9,
}


def _public_planets(planets: list[PlanetPosition]) -> list[PlanetPosition]:
    """Return the API planet set while keeping Mandhi internal-only."""
    return [planet for planet in planets if planet.graha != "MANDHI"]


# Maandhi (Mandhi) slot rules for chart longitude computation.
# Day birth: Sun=7, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6 (traditional Tamil Panchangam Maandi order)
MANDHI_DAY_SLOT = {6: 7, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
# Night birth: day_slot + 4 (wrapping within 1-8).
# Sun=3, Mon=5, Tue=6, Wed=7, Thu=8, Fri=1, Sat=2
MANDHI_NIGHT_SLOT = {6: 3, 0: 5, 1: 6, 2: 7, 3: 8, 4: 1, 5: 2}

DEFAULT_CALCULATION_VERSION = "jothidam-formula-engine-v1.1-2026"
_PLANET_MEAN_DAILY_SPEED: dict[str, float] = {
    "MOON": 13.176,
    "MERCURY": 1.20,
    "VENUS": 1.20,
    "SUN": 0.9856,
    "MARS": 0.524,
    "JUPITER": 0.083,
    "SATURN": 0.033,
    "RAHU": 0.053,
    "KETU": 0.053,
}
_NATAL_GRAHAS = frozenset({"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"})
_VARGA_DIVISIONS = (2, 3, 4, 7, 10, 12, 16, 20, 24, 30, 40, 60)
# Classical Deva/Manushya/Rakshasa assignment — must match app.calculations.porutham._GANA.
_NAKSHATRA_GANA = {
    1: "Deva", 2: "Manushya", 3: "Rakshasa", 4: "Manushya", 5: "Deva", 6: "Manushya",
    7: "Deva", 8: "Deva", 9: "Rakshasa", 10: "Rakshasa", 11: "Manushya", 12: "Manushya",
    13: "Deva", 14: "Rakshasa", 15: "Deva", 16: "Rakshasa", 17: "Deva", 18: "Rakshasa",
    19: "Rakshasa", 20: "Manushya", 21: "Manushya", 22: "Deva", 23: "Rakshasa", 24: "Rakshasa",
    25: "Manushya", 26: "Manushya", 27: "Deva",
}

_ASPECT_OFFSETS: dict[str, frozenset[int]] = {
    "MARS": frozenset({4, 7, 8}),
    "JUPITER": frozenset({5, 7, 9}),
    "SATURN": frozenset({3, 7, 10}),
    "RAHU": frozenset({5, 7, 9}),
    "KETU": frozenset({5, 7, 9}),
}


def _nakshatra_gana(nakshatra_number: int) -> str:
    return _NAKSHATRA_GANA.get(nakshatra_number, "Deva")


def _nakshatra_nadi(nakshatra_number: int) -> str:
    mod = (nakshatra_number - 1) % 9
    if mod < 3:
        return "Aadhi"
    if mod < 6:
        return "Madhya"
    return "Anthya"


def _compute_vargas(planet_longitudes: dict[str, float]) -> dict[str, dict[str, int]]:
    return {
        f"D{division}": get_varga(division, planet_longitudes)
        for division in _VARGA_DIVISIONS
    }


def _compute_nakshatra_analysis(planet_longitudes: dict[str, float]) -> dict[str, object]:
    return {
        "dispositor_chain": build_dispositor_chain(planet_longitudes),
        "pushkara": pushkara_check(planet_longitudes),
        "gandanta": gandanta_detail(planet_longitudes),
    }


def _birth_panchangam_signature(profile: Any) -> dict[str, object]:
    snapshot = calculate_daily_panchangam(
        date_local=_value(profile, "birth_date_local"),
        timezone_name=_value(profile, "birth_timezone"),
        latitude=float(_value(profile, "birth_latitude")),
        longitude=float(_value(profile, "birth_longitude")),
        session=None,
        use_cache=False,
    )
    return {
        "vaaram": snapshot.weekday,
        "vaaram_lord": snapshot.weekday_lord,
        "tithi": snapshot.tithi_name,
        "tithi_paksha": snapshot.tithi_paksha,
        "nakshatra": snapshot.nakshatra_name,
        "nakshatra_pada": snapshot.nakshatra_pada,
        "yogam": snapshot.yoga_name,
        "karanam": snapshot.karana_name,
        "is_vishti_karanam": snapshot.karana_name == "VISHTI",
        "gana": _nakshatra_gana(snapshot.nakshatra_number),
        "nadi": _nakshatra_nadi(snapshot.nakshatra_number),
    }


def _speed_ratio(graha: str, speed_deg_per_day: float) -> float | None:
    mean = _PLANET_MEAN_DAILY_SPEED.get(graha)
    if mean is None or mean <= 0:
        return None
    return abs(speed_deg_per_day) / mean


def _house_distance(from_rasi: int, to_rasi: int) -> int:
    return ((to_rasi - from_rasi) % 12) + 1


def _does_aspect(source_graha: str, source_rasi: int, target_rasi: int) -> bool:
    offsets = _ASPECT_OFFSETS.get(source_graha, frozenset({7}))
    return _house_distance(source_rasi, target_rasi) in offsets


def _aspect_counts(
    target_graha: str,
    planet_rasi_map: dict[str, int],
    combust_planets: set[str],
    *,
    paksha_is_shukla: bool,
) -> tuple[int, int]:
    target_rasi = planet_rasi_map.get(target_graha)
    if target_rasi is None:
        return 0, 0

    benefics = {"JUPITER", "VENUS"}
    malefics = {"SUN", "MARS", "SATURN", "RAHU", "KETU"}
    if paksha_is_shukla:
        benefics.add("MOON")
    else:
        malefics.add("MOON")
    if "MERCURY" in combust_planets:
        malefics.add("MERCURY")
    else:
        benefics.add("MERCURY")

    benefic_count = 0
    malefic_count = 0
    for source_graha, source_rasi in planet_rasi_map.items():
        if source_graha == target_graha:
            continue
        if source_graha not in _NATAL_GRAHAS:
            continue
        if not _does_aspect(source_graha, source_rasi, target_rasi):
            continue
        if source_graha in benefics:
            benefic_count += 1
        elif source_graha in malefics:
            malefic_count += 1
    return benefic_count, malefic_count


def _is_daytime_birth(birth_time_local: time | None) -> bool:
    if birth_time_local is None:
        return True
    return 6 <= birth_time_local.hour < 18


def _paksha_is_shukla(moon_longitude: float, sun_longitude: float) -> bool:
    phase = (moon_longitude - sun_longitude) % 360.0
    return phase < 180.0


def _mandhi_longitude(
    birth_date: date,
    birth_time_local: time | None,
    birth_lat: float,
    birth_lng: float,
    birth_timezone: str,
) -> float | None:
    """Return Mandhi's sidereal zodiac longitude at birth (degree of the rising sign at Mandhi-kalam start)."""
    try:
        if birth_time_local is None:
            return None
        tz = resolve_timezone(birth_timezone)
        local_midnight = datetime.combine(birth_date, datetime.min.time(), tzinfo=tz)
        jd_start = utc_datetime_to_julian_day(local_midnight.astimezone(UTC))
        sunrise_jd = calculate_rise_transit_jd(jd_start, birth_lat, birth_lng, rise=True)
        sunset_jd = calculate_rise_transit_jd(jd_start, birth_lat, birth_lng, rise=False)

        birth_local_dt = datetime.combine(birth_date, birth_time_local, tzinfo=tz)
        birth_jd = utc_datetime_to_julian_day(birth_local_dt.astimezone(UTC))
        weekday = birth_date.weekday()

        if sunrise_jd <= birth_jd < sunset_jd:
            slot_duration_days = (sunset_jd - sunrise_jd) / 8
            mandhi_slot = MANDHI_DAY_SLOT[weekday]
            mandhi_start_jd = sunrise_jd + slot_duration_days * (mandhi_slot - 1)
        else:
            mandhi_slot = MANDHI_NIGHT_SLOT[weekday]
            if birth_jd < sunrise_jd:
                prev_midnight = local_midnight - timedelta(days=1)
                prev_start_jd = utc_datetime_to_julian_day(prev_midnight.astimezone(UTC))
                prev_sunset_jd = calculate_rise_transit_jd(prev_start_jd, birth_lat, birth_lng, rise=False)
                slot_duration_days = (sunrise_jd - prev_sunset_jd) / 8
                mandhi_start_jd = prev_sunset_jd + slot_duration_days * (mandhi_slot - 1)
            else:
                next_midnight = local_midnight + timedelta(days=1)
                next_start_jd = utc_datetime_to_julian_day(next_midnight.astimezone(UTC))
                next_sunrise_jd = calculate_rise_transit_jd(next_start_jd, birth_lat, birth_lng, rise=True)
                slot_duration_days = (next_sunrise_jd - sunset_jd) / 8
                mandhi_start_jd = sunset_jd + slot_duration_days * (mandhi_slot - 1)

        return calculate_lagna_degree(mandhi_start_jd, birth_lat, birth_lng)
    except Exception:
        return None


def _mandhi_planet_position(longitude: float, lagna_rasi: int) -> PlanetPosition:
    rasi = int((longitude % 360) // 30) + 1
    nakshatra_number = nakshatra_from_degree(longitude)
    d9_rasi = navamsa_rasi_from_degree(longitude)
    return PlanetPosition(
        graha="MANDHI",
        rasi_name=RASI_NAMES[rasi],
        absolute_longitude=longitude,
        rasi=rasi,
        degree_in_rasi=degree_in_rasi(longitude),
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(longitude),
        house_from_lagna=house_from_reference(lagna_rasi, rasi),
        speed_deg_per_day=0.0,
        is_retrograde=False,
        is_combust=False,
        d9_rasi=d9_rasi,
        is_vargottama=rasi == d9_rasi,
        show_retrograde_badge=False,
        strength_score=0,
        strength_breakdown={
            "sthana": "NEUTRAL",
            "dik": "NEUTRAL",
            "kala": "NEUTRAL",
            "chesta": "NEUTRAL",
            "naisargika": "NEUTRAL",
            "drik": "NEUTRAL",
        },
    )


def _value(profile: Any, name: str, default: Any = None) -> Any:
    return getattr(profile, name, default)


def _warning_messages(profile: Any) -> list[str]:
    warnings: list[str] = []
    confidence = _value(profile, "birth_time_confidence_minutes", 0) or 0
    if confidence:
        warnings.append(
            f"Birth time confidence is +/- {confidence} minutes; Lagna near boundary should be verified."
        )
    return warnings


def _birth_datetime_utc(profile: Any) -> datetime:
    birth_datetime_utc = _value(profile, "birth_datetime_utc")
    if birth_datetime_utc is not None:
        if birth_datetime_utc.tzinfo is None:
            return birth_datetime_utc.replace(tzinfo=UTC)
        return birth_datetime_utc.astimezone(UTC)
    birth_time_local = _value(profile, "birth_time_local")
    if birth_time_local is None:
        raise ValueError("Birth time is required to calculate a chart.")
    birth_datetime_local = datetime.combine(_value(profile, "birth_date_local"), _value(profile, "birth_time_local"))
    return local_datetime_to_utc(birth_datetime_local, _value(profile, "birth_timezone"))


def _planet_position_from_snapshot(
    body: Any,
    *,
    lagna_rasi: int,
    sun_degree: float,
    is_daytime: bool,
    paksha_is_shukla: bool,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    planetary_wars: dict[str, str] | None = None,
) -> PlanetPosition:
    rasi_name = RASI_NAMES[body.rasi]
    nakshatra_number = nakshatra_from_degree(body.absolute_longitude)
    d9_rasi = navamsa_rasi_from_degree(body.absolute_longitude)
    is_vargottama = body.rasi == d9_rasi
    speed_ratio = _speed_ratio(body.graha, body.speed_deg_per_day)
    strength_score = compute_natal_planet_score(
        body.graha,
        body.rasi,
        body.absolute_longitude,
        lagna_rasi,
        sun_degree,
        body.is_retrograde,
        is_vargottama=is_vargottama,
        d9_rasi=d9_rasi,
        is_daytime=is_daytime,
        paksha_is_shukla=paksha_is_shukla,
        speed_ratio=speed_ratio,
        benefic_aspect_count=benefic_aspect_count,
        malefic_aspect_count=malefic_aspect_count,
        planetary_wars=planetary_wars,
    )
    return PlanetPosition(
        graha=body.graha,
        rasi_name=rasi_name,
        absolute_longitude=body.absolute_longitude,
        rasi=body.rasi,
        degree_in_rasi=body.degree_in_rasi,
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(body.absolute_longitude),
        house_from_lagna=house_from_reference(lagna_rasi, body.rasi),
        speed_deg_per_day=body.speed_deg_per_day,
        is_retrograde=body.is_retrograde,
        is_combust=is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde),
        d9_rasi=d9_rasi,
        is_vargottama=is_vargottama,
        show_retrograde_badge=body.show_retrograde_badge and body.graha not in {"RAHU", "KETU"},
        strength_score=strength_score,
        strength_breakdown=compute_strength_breakdown(
            body.graha,
            body.rasi,
            body.absolute_longitude,
            lagna_rasi,
            body.is_retrograde,
            is_vargottama=is_vargottama,
            d9_rasi=d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            benefic_aspect_count=benefic_aspect_count,
            malefic_aspect_count=malefic_aspect_count,
            speed_ratio=speed_ratio,
        ),
    )


def _active_dasha_lords(birth_jd: float, moon_longitude: float) -> set[str]:
    timeline = calculate_vimshottari_timeline(
        birth_jd,
        moon_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    return {
        timeline.current_mahadasha.lord,
        timeline.current_antardasha.lord,
        timeline.current_pratyantardasha.lord,
    }


def _current_dasha_lords(birth_jd: float, moon_longitude: float) -> tuple[str, str]:
    timeline = calculate_vimshottari_timeline(
        birth_jd,
        moon_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    return timeline.current_mahadasha.lord, timeline.current_antardasha.lord


def _build_yoga_dosham_insights(
    planets: list[PlanetPosition],
    *,
    lagna_rasi: int,
    moon_rasi: int,
    birth_jd: float,
    gender: str | None = None,
    d9_lagna_rasi: int | None = None,
    bhava_chalit_map: dict[str, int] | None = None,
) -> tuple[list[ChartYogaInsight], list[ChartDoshamInsight], list[ChartNakshatraCaution]]:
    planet_map: dict[str, int] = {planet.graha: planet.rasi for planet in planets}
    active_lords = _active_dasha_lords(birth_jd, next(planet.absolute_longitude for planet in planets if planet.graha == "MOON"))
    mahadasha_lord, antardasha_lord = _current_dasha_lords(
        birth_jd,
        next(planet.absolute_longitude for planet in planets if planet.graha == "MOON"),
    )
    planet_scores = {p.graha: p.strength_score for p in planets}
    combust_set = frozenset(p.graha for p in planets if p.is_combust)
    retrograde_set = frozenset(p.graha for p in planets if p.is_retrograde)
    moon_planet = next((p for p in planets if p.graha == "MOON"), None)
    janma_nakshatra = moon_planet.nakshatra if moon_planet else None
    d9_rasi_map: dict[str, int] = {p.graha: p.d9_rasi for p in planets if isinstance(p.d9_rasi, int)}
    yogas, doshams, nakshatra_cautions = detect_yogas_and_doshams(
        planet_map,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        active_lords=active_lords,
        current_maha_lord=mahadasha_lord,
        gender=gender,
        combust_planets=combust_set,
        retrograde_planets=retrograde_set,
        janma_nakshatra=janma_nakshatra,
        d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi,
        bhava_chalit_map=bhava_chalit_map,
    )

    yoga_models = [
        ChartYogaInsight(
            name=item.name,
            isPresent=item.is_present,
            strength=item.strength,
            conditionsMet=item.conditions_met,
            cancellationFactors=item.cancellation_factors,
            dashaActivated=item.dasha_activated,
            activationScore=yoga_activation_score(
                yoga_name=item.name,
                yoga_is_present=item.is_present,
                yoga_strength=item.strength,
                mahadasha_lord=mahadasha_lord,
                antardasha_lord=antardasha_lord,
                planet_scores=planet_scores,
            ),
            isCurrentlyActive=item.dasha_activated,
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
        )
        for item in yogas
    ]
    dosham_models = [
        ChartDoshamInsight(
            name=item.name,
            isPresent=item.is_present,
            isCancelled=item.is_cancelled,
            strength=item.strength,
            label=item.label,
            category=item.category,
            conditionsMet=item.conditions_met,
            cancellationFactors=item.cancellation_factors,
            missingData=item.missing_data,
            dashaActivated=item.dasha_activated,
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
            explanationWhatTa=item.explanation_what_ta,
            explanationWhatEn=item.explanation_what_en,
            explanationWhyTa=item.explanation_why_ta,
            explanationWhyEn=item.explanation_why_en,
            explanationHowTa=item.explanation_how_ta,
            explanationHowEn=item.explanation_how_en,
        )
        for item in doshams
    ]
    nakshatra_caution_models = [
        ChartNakshatraCaution(
            name=item.name,
            nakshatraNumber=item.nakshatra_number,
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
        )
        for item in nakshatra_cautions
    ]
    return yoga_models, dosham_models, nakshatra_caution_models


def _persist_chart_planets(
    session: Session,
    chart_id: UUID,
    planets: list[PlanetPosition],
    bhava_chalit_map: dict[str, int] | None = None,
) -> None:
    existing_planets = session.execute(select(ChartPlanet).where(ChartPlanet.chart_id == chart_id)).scalars().all()
    for row in existing_planets:
        session.delete(row)

    for planet in planets:
        session.add(
            ChartPlanet(
                chart_id=chart_id,
                graha=planet.graha,
                absolute_longitude=planet.absolute_longitude,
                degree_in_rasi=planet.degree_in_rasi,
                rasi=RASI_NAMES[planet.rasi],
                nakshatra=NAKSHATRA_NAMES[planet.nakshatra - 1],
                pada=planet.pada,
                house_from_lagna=planet.house_from_lagna,
                bhava_house=(bhava_chalit_map or {}).get(planet.graha),
                speed_deg_per_day=planet.speed_deg_per_day,
                is_retrograde=planet.is_retrograde,
                is_combust=planet.is_combust,
                is_sandhi=planet.absolute_longitude % 30 <= 1.0 or planet.absolute_longitude % 30 >= 29.0,
                d9_rasi=RASI_NAMES[planet.d9_rasi] if isinstance(planet.d9_rasi, int) else None,
                is_vargottama=planet.is_vargottama,
                raw_payload=planet.model_dump(mode="json", by_alias=True),
            )
        )


def _chart_response_from_record(chart: Chart) -> ChartCalculateResponse:
    birth_profile = chart.birth_profile
    if birth_profile is None:
        raise ValueError("Chart is missing its birth profile relation.")

    birth_profile_response = _birth_profile_response(
        profile=birth_profile,
        birth_profile_id=birth_profile.birth_profile_id,
        birth_datetime_utc=_birth_datetime_utc(birth_profile),
        calculation_status="completed" if chart.status == "completed" else chart.status,
        warnings=_warning_messages(birth_profile),
    )

    lagna_rasi = RASI_NUMBERS[chart.lagna_rasi]
    lagna_nakshatra = nakshatra_from_degree(float(chart.lagna_longitude))
    lagna = LagnaPosition(
        rasi=lagna_rasi,
        rasi_name=chart.lagna_rasi,
        absolute_longitude=float(chart.lagna_longitude),
        degree_in_rasi=degree_in_rasi(float(chart.lagna_longitude)),
        nakshatra=lagna_nakshatra,
        nakshatra_name=NAKSHATRA_NAMES[lagna_nakshatra - 1],
        pada=pada_from_degree(float(chart.lagna_longitude)),
    )

    planets = sorted(chart.planets, key=lambda planet: PLANET_ORDER.get(planet.graha, 99))
    planet_positions = [
        PlanetPosition(
            graha=planet.graha,
            rasi_name=planet.rasi,
            absolute_longitude=float(planet.absolute_longitude),
            rasi=RASI_NUMBERS[planet.rasi],
            degree_in_rasi=float(planet.degree_in_rasi),
            nakshatra=NAKSHATRA_NAMES.index(planet.nakshatra) + 1 if planet.nakshatra in NAKSHATRA_NAMES else nakshatra_from_degree(float(planet.absolute_longitude)),
            nakshatra_name=planet.nakshatra,
            pada=int(planet.pada),
            house_from_lagna=int(planet.house_from_lagna),
            speed_deg_per_day=float(planet.speed_deg_per_day) if planet.speed_deg_per_day is not None else 0.0,
            is_retrograde=bool(planet.is_retrograde),
            is_combust=bool(planet.is_combust),
            d9_rasi=RASI_NUMBERS.get(str(planet.d9_rasi), 1) if planet.d9_rasi is not None else navamsa_rasi_from_degree(float(planet.absolute_longitude)),
            is_vargottama=bool(planet.is_vargottama),
            show_retrograde_badge=bool(planet.is_retrograde) and planet.graha not in {"RAHU", "KETU"},
        )
        for planet in planets
    ]

    sun_degree = next(planet.absolute_longitude for planet in planet_positions if planet.graha == "SUN")
    moon_degree = next(planet.absolute_longitude for planet in planet_positions if planet.graha == "MOON")
    is_daytime = _is_daytime_birth(_value(birth_profile, "birth_time_local"))
    paksha_is_shukla = _paksha_is_shukla(moon_degree, sun_degree)
    planet_rasi_map = {p.graha: p.rasi for p in planet_positions if p.graha in _NATAL_GRAHAS}
    planetary_wars = detect_planetary_wars({p.graha: p.absolute_longitude for p in planet_positions})
    combust_planets = {
        p.graha
        for p in planet_positions
        if p.graha in _NATAL_GRAHAS and is_combust(p.graha, p.absolute_longitude, sun_degree, p.is_retrograde)
    }
    for planet in planet_positions:
        planet.is_combust = is_combust(
            planet.graha,
            planet.absolute_longitude,
            sun_degree,
            planet.is_retrograde,
        )
        if planet.graha == "MANDHI":
            continue
        benefic_aspects, malefic_aspects = _aspect_counts(
            planet.graha,
            planet_rasi_map,
            combust_planets,
            paksha_is_shukla=paksha_is_shukla,
        )
        speed_ratio = _speed_ratio(planet.graha, float(planet.speed_deg_per_day))
        planet.strength_score = compute_natal_planet_score(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=lagna_rasi,
            sun_longitude=sun_degree,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            speed_ratio=speed_ratio,
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            planetary_wars=planetary_wars,
        )
        planet.strength_breakdown = compute_strength_breakdown(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=lagna_rasi,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            speed_ratio=speed_ratio,
        )
    bhava_chalit_map = {
        p.graha: (int(getattr(p_row, "bhava_house")) if getattr(p_row, "bhava_house", None) is not None else 0)
        for p, p_row in zip(planet_positions, planets, strict=False)
    }
    if not all(v in range(1, 13) for v in bhava_chalit_map.values()):
        bhava_chalit_map = compute_bhava_chalit(
            float(chart.lagna_longitude),
            {p.graha: p.absolute_longitude for p in planet_positions},
        )

    moon_rasi = next(planet.rasi for planet in planet_positions if planet.graha == "MOON")
    d9_lagna_rasi_val = navamsa_rasi_from_degree(float(chart.lagna_longitude))
    yogas, doshams, nakshatra_cautions = _build_yoga_dosham_insights(
        planet_positions,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        birth_jd=float(chart.julian_day),
        gender=_value(birth_profile, "gender_for_traditional_rules"),
        d9_lagna_rasi=d9_lagna_rasi_val,
        bhava_chalit_map=bhava_chalit_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = float(chart.lagna_longitude)
    vargas = _compute_vargas(planet_longitudes)
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_panchangam_signature = _birth_panchangam_signature(birth_profile)

    return ChartCalculateResponse(
        data=ChartCalculateResponseData(
            chart_id=chart.chart_id,
            birth_profile=birth_profile_response,
            birth_datetime_utc=_birth_datetime_utc(birth_profile),
            julian_day=float(chart.julian_day),
            ayanamsa=AyanamsaInfo(value_degrees=float(chart.ayanamsa_value_degrees or 0.0)),
            lagna=lagna,
            planets=public_planet_positions,
            bhava_chalit={k: v for k, v in bhava_chalit_map.items() if k != "MANDHI"},
            vargas=vargas,
            nakshatra_analysis=nakshatra_analysis,
            birth_panchangam_signature=birth_panchangam_signature,
            yogas=yogas,
            doshams=doshams,
            nakshatra_cautions=nakshatra_cautions,
            calculation_version=chart.calculation_version,
            calculation_status="completed" if chart.status == "completed" else "completed",
            warnings=list(chart.warnings or []),
            ephemeris_backend=chart.ephemeris_version or "pyswisseph",
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def load_persisted_chart_response(session: Session, chart_id: UUID) -> ChartCalculateResponse:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

    birth_profile = _require_active_birth_profile(session, chart.birth_profile_id)

    chart.birth_profile = birth_profile
    if chart.planets:
        return _chart_response_from_record(chart)

    response = _chart_response_from_profile(birth_profile, chart.calculation_version, chart_id=chart.chart_id)
    _persist_chart_planets(session, chart.chart_id, response.data.planets, response.data.bhava_chalit)
    session.flush()
    return response


def _birth_profile_response(
    profile: Any,
    birth_profile_id: UUID,
    birth_datetime_utc: datetime,
    *,
    calculation_status: str = "completed",
    warnings: list[str] | None = None,
) -> BirthProfileResponse:
    return BirthProfileResponse(
        birth_profile_id=birth_profile_id,
        owner_user_id=_value(profile, "owner_user_id"),
        family_vault_id=_value(profile, "family_vault_id"),
        family_member_id=_value(profile, "family_member_id"),
        relationship_to_owner=_value(profile, "relationship_to_owner", "self"),
        display_name=_value(profile, "display_name"),
        birth_date_local=_value(profile, "birth_date_local"),
        birth_time_local=_value(profile, "birth_time_local"),
        birth_place=_value(profile, "birth_place"),
        birth_latitude=float(_value(profile, "birth_latitude")),
        birth_longitude=float(_value(profile, "birth_longitude")),
        birth_timezone=_value(profile, "birth_timezone"),
        current_place=_value(profile, "current_place"),
        current_latitude=(
            float(_value(profile, "current_latitude"))
            if _value(profile, "current_latitude") is not None
            else None
        ),
        current_longitude=(
            float(_value(profile, "current_longitude"))
            if _value(profile, "current_longitude") is not None
            else None
        ),
        current_timezone=_value(profile, "current_timezone"),
        current_location_updated_at=_value(profile, "current_location_updated_at"),
        birth_time_source=_value(profile, "birth_time_source", "unknown"),
        birth_time_confidence_minutes=int(_value(profile, "birth_time_confidence_minutes", 0) or 0),
        calendar_input_type=_value(profile, "calendar_input_type", "gregorian"),
        calculate_now=bool(_value(profile, "calculate_now", True)),
        language_preference=_value(profile, "language_preference", "ta-en"),
        gender_for_traditional_rules=_value(profile, "gender_for_traditional_rules"),
        birth_datetime_utc=birth_datetime_utc,
        calculation_status=calculation_status,
        warnings=warnings or [],
    )


def _chart_response_from_profile(profile: Any, calculation_version: str, chart_id: UUID | None = None) -> ChartCalculateResponse:
    birth_datetime_utc = _birth_datetime_utc(profile)
    julian_day = utc_datetime_to_julian_day(birth_datetime_utc)
    snapshot = calculate_sidereal_planets(julian_day)

    lagna_degree = calculate_lagna_degree(julian_day, float(_value(profile, "birth_latitude")), float(_value(profile, "birth_longitude")))
    lagna_rasi = int((lagna_degree % 360) // 30) + 1
    birth_profile_id = _value(profile, "birth_profile_id") or uuid4()
    chart_id = chart_id or uuid4()
    profile_warnings = _warning_messages(profile)

    lagna = LagnaPosition(
        rasi=lagna_rasi,
        rasi_name=RASI_NAMES[lagna_rasi],
        absolute_longitude=lagna_degree,
        degree_in_rasi=degree_in_rasi(lagna_degree),
        nakshatra=nakshatra_from_degree(lagna_degree),
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_from_degree(lagna_degree) - 1],
        pada=pada_from_degree(lagna_degree),
    )

    planet_positions = []
    sun_degree = snapshot.bodies["SUN"].absolute_longitude
    moon_degree = snapshot.bodies["MOON"].absolute_longitude
    birth_time_local = _value(profile, "birth_time_local")
    is_daytime = _is_daytime_birth(birth_time_local)
    paksha_is_shukla = _paksha_is_shukla(moon_degree, sun_degree)
    snapshot_rasi_map = {body.graha: body.rasi for body in snapshot.bodies.values() if body.graha in _NATAL_GRAHAS}
    snapshot_combust = {
        body.graha
        for body in snapshot.bodies.values()
        if body.graha in _NATAL_GRAHAS and is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde)
    }
    planetary_wars = detect_planetary_wars({
        body.graha: body.absolute_longitude for body in snapshot.bodies.values()
    })
    for body in snapshot.bodies.values():
        benefic_aspects, malefic_aspects = _aspect_counts(
            body.graha,
            snapshot_rasi_map,
            snapshot_combust,
            paksha_is_shukla=paksha_is_shukla,
        )
        planet_positions.append(
            _planet_position_from_snapshot(
                body,
                lagna_rasi=lagna_rasi,
                sun_degree=sun_degree,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
                benefic_aspect_count=benefic_aspects,
                malefic_aspect_count=malefic_aspects,
                planetary_wars=planetary_wars,
            )
        )

    # Mandhi (Maandi) upagraha — lagna degree at start of Mandhi kalam on birth date
    mandhi_lng = _mandhi_longitude(
        _value(profile, "birth_date_local"),
        _value(profile, "birth_time_local"),
        float(_value(profile, "birth_latitude")),
        float(_value(profile, "birth_longitude")),
        _value(profile, "birth_timezone"),
    )
    if mandhi_lng is not None:
        planet_positions.append(_mandhi_planet_position(mandhi_lng, lagna_rasi))

    bhava_chalit_map = compute_bhava_chalit(
        lagna_degree,
        {p.graha: p.absolute_longitude for p in planet_positions},
    )

    moon_rasi = next(planet.rasi for planet in planet_positions if planet.graha == "MOON")
    yogas, doshams, nakshatra_cautions = _build_yoga_dosham_insights(
        planet_positions,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        birth_jd=julian_day,
        gender=_value(profile, "gender_for_traditional_rules"),
        d9_lagna_rasi=navamsa_rasi_from_degree(lagna_degree),
        bhava_chalit_map=bhava_chalit_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = lagna_degree
    vargas = _compute_vargas(planet_longitudes)
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_panchangam_signature = _birth_panchangam_signature(profile)

    birth_profile_response = _birth_profile_response(
        profile=profile,
        birth_profile_id=birth_profile_id,
        birth_datetime_utc=birth_datetime_utc,
        calculation_status="completed",
        warnings=profile_warnings,
    )

    return ChartCalculateResponse(
        data=ChartCalculateResponseData(
            chart_id=chart_id,
            birth_profile=birth_profile_response,
            birth_datetime_utc=birth_datetime_utc,
            julian_day=julian_day,
            ayanamsa=AyanamsaInfo(value_degrees=snapshot.ayanamsa_value_degrees),
            lagna=lagna,
            planets=public_planet_positions,
            bhava_chalit={k: v for k, v in bhava_chalit_map.items() if k != "MANDHI"},
            vargas=vargas,
            nakshatra_analysis=nakshatra_analysis,
            birth_panchangam_signature=birth_panchangam_signature,
            yogas=yogas,
            doshams=doshams,
            nakshatra_cautions=nakshatra_cautions,
            calculation_version=calculation_version,
            calculation_status="completed",
            warnings=list(snapshot.source_warnings) + profile_warnings,
            ephemeris_backend=snapshot.backend,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _ensure_user(session: Session, owner_user_id: UUID) -> None:
    if session.get(User, owner_user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Owner account not found for this session.",
        )


def _require_active_birth_profile(session: Session, birth_profile_id: UUID) -> BirthProfile:
    birth_profile = session.get(BirthProfile, birth_profile_id)
    if birth_profile is None or birth_profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    return birth_profile


def create_birth_profile_record(
    session: Session,
    profile: BirthProfileCreate,
    *,
    family_member_id: UUID | None = None,
) -> BirthProfile:
    owner_user_id = profile.owner_user_id
    if owner_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ownerUserId is required for birth profile creation.",
        )
    _ensure_user(session, owner_user_id)

    birth_datetime_utc = None
    if _value(profile, "birth_time_local") is not None or _value(profile, "birth_datetime_utc") is not None:
        birth_datetime_utc = _birth_datetime_utc(profile)
    current_place = getattr(profile, "current_place", None)
    current_latitude = getattr(profile, "current_latitude", None)
    current_longitude = getattr(profile, "current_longitude", None)
    current_timezone = getattr(profile, "current_timezone", None)
    current_location_updated_at = getattr(profile, "current_location_updated_at", None)
    if (
        current_location_updated_at is None
        and (current_place or current_latitude is not None or current_longitude is not None or current_timezone)
    ):
        current_location_updated_at = datetime.now(tz=UTC)
    sensitive = {
        "birth_latitude": float(profile.birth_latitude),
        "birth_longitude": float(profile.birth_longitude),
        "birth_time_local": str(profile.birth_time_local),
        "birth_date_local": str(profile.birth_date_local),
    }
    birth_profile = BirthProfile(
        owner_user_id=owner_user_id,
        family_member_id=family_member_id or _value(profile, "family_member_id"),
        display_name=profile.display_name,
        birth_date_local=profile.birth_date_local,
        birth_time_local=profile.birth_time_local,
        birth_datetime_utc=birth_datetime_utc,
        birth_place=profile.birth_place,
        birth_latitude=profile.birth_latitude,
        birth_longitude=profile.birth_longitude,
        birth_timezone=profile.birth_timezone,
        current_place=current_place,
        current_latitude=current_latitude,
        current_longitude=current_longitude,
        current_timezone=current_timezone,
        current_location_updated_at=current_location_updated_at,
        birth_time_source=profile.birth_time_source,
        birth_time_confidence_minutes=profile.birth_time_confidence_minutes,
        calendar_input_type=profile.calendar_input_type,
        privacy_mode="cloud",
        encrypted_birth_payload=encrypt_bytes(json.dumps(sensitive).encode("utf-8")),
        marital_status=getattr(profile, "marital_status", None),
        employment_type=getattr(profile, "employment_type", None),
    )
    session.add(birth_profile)
    session.flush()
    return birth_profile


def _persist_chart_record(session: Session, birth_profile_id: UUID, response: ChartCalculateResponse) -> Chart:
    data = response.data
    planet_map = {planet.graha: planet for planet in data.planets}
    moon = planet_map["MOON"]
    chart = Chart(
        chart_id=data.chart_id,
        birth_profile_id=birth_profile_id,
        calculation_version=data.calculation_version,
        ephemeris_provider="SWISS_EPHEMERIS",
        ephemeris_version=data.ephemeris_backend,
        ayanamsa_type=data.ayanamsa.type,
        ayanamsa_value_degrees=data.ayanamsa.value_degrees,
        node_type="MEAN_NODE",
        house_system_primary="WHOLE_SIGN",
        julian_day=data.julian_day,
        lagna_rasi=RASI_NAMES[data.lagna.rasi],
        lagna_longitude=data.lagna.absolute_longitude,
        moon_rasi=RASI_NAMES[moon.rasi],
        janma_nakshatra=NAKSHATRA_NAMES[moon.nakshatra - 1],
        janma_pada=moon.pada,
        status=data.calculation_status,
        warnings=data.warnings,
    )
    session.add(chart)
    session.flush()
    _persist_chart_planets(session, chart.chart_id, data.planets, data.bhava_chalit)
    return chart


def calculate_chart_for_persisted_profile(
    session: Session,
    birth_profile: BirthProfile | BirthProfileCreate,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
    force_recalculate: bool = False,
    chart_id: UUID | None = None,
) -> ChartCalculateResponse:
    persisted_profile_id = _value(birth_profile, "birth_profile_id")
    if persisted_profile_id is None:
        raise ValueError("calculate_chart_for_persisted_profile requires a persisted birth profile.")

    if not force_recalculate:
        existing_chart = session.execute(
            select(Chart).where(
                Chart.birth_profile_id == persisted_profile_id,
                Chart.calculation_version == calculation_version,
            )
            .order_by(Chart.created_at.desc())
            .limit(1)
        ).scalars().first()
        if existing_chart is not None:
            return load_persisted_chart_response(session, existing_chart.chart_id)

    # Capture the most-recent previous chart before creating the new one,
    # so we can migrate active goals to the new chart_id after recalculation.
    prev_chart = session.execute(
        select(Chart)
        .where(Chart.birth_profile_id == persisted_profile_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalars().first()

    try:
        response = _chart_response_from_profile(birth_profile, calculation_version, chart_id=chart_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    _persist_chart_record(session, persisted_profile_id, response)
    session.flush()

    # Migrate active goals from the previous chart to the new one so they
    # are not orphaned when a user edits and recalculates their birth profile.
    if prev_chart is not None and prev_chart.chart_id != response.data.chart_id:
        from app.models.user_goal import UserGoal as _UserGoal
        from sqlalchemy import update as _sql_update
        session.execute(
            _sql_update(_UserGoal)
            .where(
                _UserGoal.chart_id == prev_chart.chart_id,
                _UserGoal.is_active.is_(True),
            )
            .values(chart_id=response.data.chart_id)
        )
        session.flush()

    return load_persisted_chart_response(session, response.data.chart_id)


def calculate_chart(payload: ChartCalculateRequest, session: Session | None = None) -> ChartCalculateResponse:
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database session is required when calculating from birthProfileId.",
        )

    birth_profile = _require_active_birth_profile(session, payload.birth_profile_id)
    return calculate_chart_for_persisted_profile(
        session,
        birth_profile,
        calculation_version=payload.calculation_version,
        force_recalculate=payload.force_recalculate,
    )


def _summary_text(language: str) -> ChartSummaryText:
    text = ChartSummaryText(
        ta="இது உங்கள் அடிப்படை ஜாதகச் சுருக்கம்.",
        en="This is your base chart summary.",
    )
    if language == "ta":
        return ChartSummaryText(ta=text.ta, en=text.en)
    if language == "en":
        return ChartSummaryText(ta=text.ta, en=text.en)
    return text


def _current_age(birth_date_local: date, today: date) -> int:
    age = today.year - birth_date_local.year
    if (today.month, today.day) < (birth_date_local.month, birth_date_local.day):
        age -= 1
    return age


def _functional_nature_table(lagna_rasi: int) -> dict[str, str]:
    return {
        planet: get_functional_nature(lagna_rasi, planet).value
        for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
    }


def _ashtakavarga_table(chart_response: ChartCalculateResponse) -> dict[str, dict[int, int]]:
    natal_rasi_map = {planet.graha: planet.rasi for planet in chart_response.data.planets}
    natal_rasi_map["LAGNA"] = chart_response.data.lagna.rasi
    return compute_bhinnashtakavarga(natal_rasi_map)


def get_chart_summary(session: Session, chart_id: UUID, *, language: str = "ta-en") -> ChartSummaryResponse:
    chart_response = load_persisted_chart_response(session, chart_id)
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    birth_profile = _require_active_birth_profile(session, chart.birth_profile_id)

    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    d9_lagna_rasi = navamsa_rasi_from_degree(chart_response.data.lagna.absolute_longitude)
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    today = datetime.now(tz=UTC).date()
    validation_status: str | None = None
    events = session.execute(
        select(UserLifeEvent).where(
            UserLifeEvent.chart_id == chart_id,
            UserLifeEvent.deleted_at.is_(None),
        )
    ).scalars().all()
    if events:
        report = validate_chart_against_events(
            chart_response,
            [
                {
                    "eventType": event.event_type,
                    "eventDate": event.event_date.isoformat(),
                }
                for event in events
            ],
        )
        validation_status = report.confidence

    return ChartSummaryResponse(
        data=ChartSummaryData(
            chart_id=chart_id,
            display_name=birth_profile.display_name,
            current_age=_current_age(birth_profile.birth_date_local, today),
            lagna_rasi=chart_response.data.lagna.rasi_name,
            moon_rasi=moon.rasi_name,
            d9_lagna_rasi=RASI_NAMES[d9_lagna_rasi],
            d9_moon_rasi=RASI_NAMES[moon.d9_rasi] if isinstance(moon.d9_rasi, int) else None,
            janma_nakshatra=moon.nakshatra_name,
            janma_pada=moon.pada,
            current_mahadasha=timeline.current_mahadasha.lord,
            current_antardasha=timeline.current_antardasha.lord,
            functional_nature=_functional_nature_table(chart_response.data.lagna.rasi),
            ashtakavarga=_ashtakavarga_table(chart_response),
            planets=chart_response.data.planets,
            yogas=chart_response.data.yogas,
            chart_validation_status=validation_status,
            primary_language_text=_summary_text(language),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_jadhagam_report(session: Session, chart_id: UUID) -> JadhagamReportResponse:
    chart_response = load_persisted_chart_response(session, chart_id)
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    birth_profile = _require_active_birth_profile(session, chart.birth_profile_id)

    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )
    today = datetime.now(tz=UTC).date()
    current_age = _current_age(birth_profile.birth_date_local, today)
    functional_nature = _functional_nature_table(chart_response.data.lagna.rasi)

    sun_lon = next(planet.absolute_longitude for planet in chart_response.data.planets if planet.graha == "SUN")
    moon_lon = next(planet.absolute_longitude for planet in chart_response.data.planets if planet.graha == "MOON")
    is_daytime = _is_daytime_birth(_value(birth_profile, "birth_time_local"))
    paksha_is_shukla = _paksha_is_shukla(moon_lon, sun_lon)
    report_rasi_map = {p.graha: p.rasi for p in chart_response.data.planets if p.graha in _NATAL_GRAHAS}
    report_wars = detect_planetary_wars({p.graha: p.absolute_longitude for p in chart_response.data.planets})
    report_combust = {
        p.graha
        for p in chart_response.data.planets
        if p.graha in _NATAL_GRAHAS and is_combust(p.graha, p.absolute_longitude, sun_lon, p.is_retrograde)
    }
    strength_items: list[JadhagamReportPlanetStrengthItem] = []
    for planet in chart_response.data.planets:
        if planet.graha == "MANDHI":
            continue
        benefic_aspects, malefic_aspects = _aspect_counts(
            planet.graha,
            report_rasi_map,
            report_combust,
            paksha_is_shukla=paksha_is_shukla,
        )
        score = compute_natal_planet_score(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=chart_response.data.lagna.rasi,
            sun_longitude=sun_lon,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            speed_ratio=_speed_ratio(planet.graha, float(planet.speed_deg_per_day)),
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            planetary_wars=report_wars,
        )
        strength_items.append(JadhagamReportPlanetStrengthItem(planet=planet.graha, score=score))

    strength_items.sort(key=lambda item: item.score, reverse=True)
    strong = [item for item in strength_items if item.score >= 70]
    weak = [item for item in strength_items if item.score <= 39]
    moderate = [item for item in strength_items if 40 <= item.score <= 69]

    d9_by_planet = {planet.graha: planet.d9_rasi for planet in chart_response.data.planets}
    vargottama_planets = [planet.graha for planet in chart_response.data.planets if planet.is_vargottama]

    active_focus = get_active_life_phases(current_age)
    life_area_predictions = [{"area": area, "status": "ACTIVE"} for area in active_focus]

    mahadasha_lord = timeline.current_mahadasha.lord
    antardasha_lord = timeline.current_antardasha.lord
    lagna_rasi_name = chart_response.data.lagna.rasi_name
    strong_planet_names = [item.planet for item in strong]
    weak_planet_names = [item.planet for item in weak]
    active_yoga_names = [y.name for y in chart_response.data.yogas if y.is_present]
    active_dosham_names = [d.name for d in chart_response.data.doshams if d.is_present and not d.is_cancelled]

    practical = get_age_based_practical_guidance(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        lagna_rasi=lagna_rasi_name,
        strong_planets=strong_planet_names,
        weak_planets=weak_planet_names,
    )
    remedies = get_age_based_remedies(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        lagna_rasi=lagna_rasi_name,
        weak_planets=weak_planet_names,
    )
    year_guidance = build_year_guidance(
        current_age=current_age,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        strong_planets=strong_planet_names,
    )
    executive = build_executive_summary(
        current_age=current_age,
        lagna_rasi=lagna_rasi_name,
        moon_rasi=moon.rasi_name,
        nakshatra=moon.nakshatra_name,
        mahadasha_lord=mahadasha_lord,
        antardasha_lord=antardasha_lord,
        strong_planets=strong_planet_names,
        weak_planets=weak_planet_names,
        active_yogas=active_yoga_names,
        active_doshams=active_dosham_names,
    )

    return JadhagamReportResponse(
        data=JadhagamReportData(
            chart_id=chart_id,
            birth_profile=JadhagamReportBirthProfile(
                display_name=birth_profile.display_name,
                birth_date_local=birth_profile.birth_date_local.isoformat(),
                birth_time_local=birth_profile.birth_time_local.isoformat() if birth_profile.birth_time_local else "--:--",
                birth_place=birth_profile.birth_place,
                birth_timezone=birth_profile.birth_timezone,
                current_age=current_age,
            ),
            core_identity=JadhagamReportCoreIdentity(
                lagna_rasi=lagna_rasi_name,
                moon_rasi=moon.rasi_name,
                janma_nakshatra=moon.nakshatra_name,
                janma_pada=moon.pada,
                current_mahadasha=mahadasha_lord,
                current_antardasha=antardasha_lord,
            ),
            rasi_chart_summary=JadhagamReportRasiSummary(
                lagna=chart_response.data.lagna,
                planets=chart_response.data.planets,
            ),
            navamsam_summary=JadhagamReportNavamsaSummary(
                d9_by_planet=d9_by_planet,
                vargottama_planets=vargottama_planets,
            ),
            functional_nature_table=functional_nature,
            yoga_dosham_summary=JadhagamReportYogaDoshamSummary(
                yogas=chart_response.data.yogas,
                doshams=chart_response.data.doshams,
            ),
            planetary_strength_summary=JadhagamReportPlanetStrengthSummary(
                strong=strong,
                moderate=moderate,
                weak=weak,
            ),
            dasha_analysis=JadhagamReportDashaAnalysis(
                current_mahadasha=mahadasha_lord,
                current_antardasha=antardasha_lord,
            ),
            life_area_predictions=life_area_predictions,
            age_wise_timeline=JadhagamReportAgeWiseTimeline(
                current_age=current_age,
                active_focus_areas=active_focus,
            ),
            current_year_guidance=year_guidance,
            upcoming_periods=[],
            practical_guidance=practical,
            optional_remedies=remedies,
            executive_summary=JadhagamReportExecutiveSummary(
                ta=executive["ta"],
                en=executive["en"],
            ),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

"""Assemble ChartCalculateResponse from a birth profile or a persisted Chart record."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.calculations.astro import (
    degree_in_rasi,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.bhava_chalit import compute_bhava_chalit
from app.calculations.chart_strength import (
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets
from app.calculations.panchangam import NAKSHATRA_NAMES, calculate_daily_panchangam
from app.calculations.transits import RASI_NAMES, is_combust
from app.calculations.yoga_activation import yoga_activation_score
from app.calculations.yogas import detect_yogas_and_doshams
from app.models import Chart
from app.schemas.birth_profiles import BirthProfileResponse
from app.schemas.charts import (
    AyanamsaInfo,
    ChartCalculateResponse,
    ChartCalculateResponseData,
    ChartDoshamInsight,
    ChartNakshatraCaution,
    ChartYogaInsight,
    LagnaPosition,
    PlanetPosition,
    ResponseMeta,
)
from app.services._chart_planets import (
    _NATAL_GRAHAS,
    _aspect_counts,
    _compute_nakshatra_analysis,
    _compute_vargas,
    _is_daytime_birth,
    _mandhi_longitude,
    _mandhi_planet_position,
    _paksha_is_shukla,
    _planet_position_from_snapshot,
    _speed_ratio,
)

DEFAULT_CALCULATION_VERSION = "jothidam-formula-engine-v1.1-2026"
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


def _birth_panchangam_signature(profile: Any) -> dict[str, object]:
    from zoneinfo import ZoneInfo
    from app.calculations.tamil_calendar import format_tamil_date

    snapshot = calculate_daily_panchangam(
        date_local=_value(profile, "birth_date_local"),
        timezone_name=_value(profile, "birth_timezone"),
        latitude=float(_value(profile, "birth_latitude")),
        longitude=float(_value(profile, "birth_longitude")),
        session=None,
        use_cache=False,
    )

    tz = ZoneInfo(str(_value(profile, "birth_timezone")))
    sunrise_local = snapshot.sunrise.astimezone(tz)
    sunset_local = snapshot.sunset.astimezone(tz)
    tamil_date_ta, tamil_date_en = format_tamil_date(
        _value(profile, "birth_date_local"),
        str(_value(profile, "birth_timezone")),
        float(_value(profile, "birth_latitude")),
        float(_value(profile, "birth_longitude")),
    )

    from app.services._chart_planets import _nakshatra_gana, _nakshatra_nadi
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
        "sunrise_time": sunrise_local.strftime("%I:%M:%S %p"),
        "sunset_time": sunset_local.strftime("%I:%M:%S %p"),
        "tamil_date_ta": tamil_date_ta,
        "tamil_date_en": tamil_date_en,
    }


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
        p.graha: (int(p_row.bhava_house) if getattr(p_row, "bhava_house", None) is not None else 0)
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

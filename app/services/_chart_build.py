"""Assemble ChartCalculateResponse from a birth profile or a persisted Chart record."""
from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, datetime, time
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
from app.calculations.birth_conditions import (
    birth_condition_strength_penalties,
    detect_birth_conditions,
    sun_rasi_day_bounds,
    tithi_number_from_longitudes,
)
from app.calculations.chart_strength import (
    apply_holistic_synthesis,
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets
from app.calculations.equal_bhava import compute_equal_bhava
from app.calculations.functional_nature import get_functional_nature
from app.calculations.panchangam import NAKSHATRA_NAMES, calculate_daily_panchangam
from app.calculations.transits import RASI_NAMES, is_cazimi, is_combust
from app.calculations.yoga_activation import yoga_activation_score
from app.calculations.yoga_effects import yoga_effect
from app.calculations.yogas import detect_yogas_and_doshams
from app.models import Chart
from app.schemas.birth_profiles import BirthProfileResponse
from app.schemas.charts import (
    AyanamsaInfo,
    ChartBirthCondition,
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
    _varga_reliability,
)
from app.services.feature_flags import get_flag

DEFAULT_CALCULATION_VERSION = "jothidam-formula-engine-v1.2-2026"
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
    """Return the API planet set.

    Mandhi (Gulika) is exposed here as an 8th pseudo-planet entry, same shape
    as Rahu/Ketu — per docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.2,
    classical Tamil Thirukanitham practice reads Gulika's house placement and
    aspects like a graha, not just as a muhurtham time-window (see
    panchangam.py: KULIGAI_SLOT for the time-window usage). Previously this
    function filtered Mandhi out of every consumer of ChartCalculateResponse;
    it no longer does.
    """
    return planets


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


def _build_birth_conditions(
    planet_positions: list[PlanetPosition],
    birth_time_local: time | None,
    lagna_rasi: int | None = None,
) -> tuple[list[ChartBirthCondition], dict[str, float]]:
    """Assemble the Border-Alert list (and its natal strength penalties) from planets.

    Everything here is derived from the planet longitudes/speeds plus the birth
    time, so it works identically on the fresh-calc and persisted-record paths
    with no extra ephemeris or panchangam call. Returns the display flags plus the
    EC-7.2 per-graha strength-penalty map (empty when no scoring boundary birth is
    present); the caller applies the map to the luminaries via
    ``_apply_birth_condition_penalties``.
    """
    longitudes = {p.graha: p.absolute_longitude for p in planet_positions}
    sun = next((p for p in planet_positions if p.graha == "SUN"), None)
    moon_lon = longitudes.get("MOON")
    if sun is None or moon_lon is None:
        return [], {}

    tithi_number = tithi_number_from_longitudes(sun.absolute_longitude, moon_lon)
    if birth_time_local is None:
        day_fraction = 0.5
    else:
        day_fraction = (
            birth_time_local.hour * 3600 + birth_time_local.minute * 60 + birth_time_local.second
        ) / 86400.0
    sun_start, sun_end = sun_rasi_day_bounds(
        sun.absolute_longitude, sun.speed_deg_per_day, day_fraction
    )
    cazimi_planets = [p.graha for p in planet_positions if p.is_cazimi]

    flags = detect_birth_conditions(
        planet_longitudes=longitudes,
        tithi_number=tithi_number,
        sun_rasi_day_start=sun_start,
        sun_rasi_day_end=sun_end,
        cazimi_planets=cazimi_planets,
        lagna_rasi=lagna_rasi,
    )
    conditions = [
        ChartBirthCondition(
            code=f.code,
            is_present=f.is_present,
            severity=f.severity,
            title_ta=f.title_ta,
            title_en=f.title_en,
            description_ta=f.description_ta,
            description_en=f.description_en,
            detail=f.detail,
        )
        for f in flags
    ]
    return conditions, birth_condition_strength_penalties(flags)


def _apply_birth_condition_penalties(
    planets: list[PlanetPosition],
    penalties: Mapping[str, float],
) -> None:
    """Lower the afflicted luminaries' natal strength for verified boundary births.

    EC-7.2: Grahana/Sankranti births are natal constants, so they are scored once
    here on the persisted natal ``strength_score`` (which daily + prediction read)
    rather than as a flat daily-tone offset. Floored at the same 10 as the scorer;
    the six-fold ``strength_breakdown`` is left untouched, consistent with the
    other score-only natal modifiers (cazimi/gandanta/war are likewise not in it).
    """
    if not penalties:
        return
    for planet in planets:
        penalty = penalties.get(planet.graha)
        if penalty and planet.strength_score is not None:
            planet.strength_score = max(10, int(round(planet.strength_score - penalty)))


def _apply_holistic_strength_synthesis(
    planet_positions: list[PlanetPosition],
    *,
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    combust_planets: frozenset[str] | set[str],
    paksha_is_shukla: bool,
    d9_lagna_rasi: int | None,
) -> None:
    """Flag-gated SECOND PASS refining each base ``strength_score`` with the four
    relational measures the six-bala blend omits — functional lordship, yuti
    (company kept), neecha bhanga, and strength-weighted drishti. Spec:
    docs/THIRUKANITHAM_STRENGTH_SYNTHESIS_2026-07-23.md.

    Shared by BOTH build paths (``_chart_response_from_profile`` and
    ``_chart_response_from_record``) so the fresh-calc / public-tools /
    compatibility path and the persisted-record read can never disagree on
    ``strength_score`` — the C1 fix in
    docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md. Must run AFTER the base
    per-planet loop (the relational terms read every other planet's base score)
    and BEFORE yoga detection (both paths feed the synthesised strength into
    yoga activation). No-op when the flag is OFF ⇒ scores stay byte-identical to
    the base loop. Mutates ``strength_score`` and the ``synthesis_*``
    transparency keys in place; nothing else is touched.
    """
    if not get_flag("holistic_strength_synthesis"):
        return
    natal = [p for p in planet_positions if p.graha in _NATAL_GRAHAS]
    base_scores = {p.graha: int(p.strength_score) for p in natal if p.strength_score is not None}
    if not base_scores:
        return
    d9_map = {p.graha: p.d9_rasi for p in natal if isinstance(p.d9_rasi, int)}
    functional = {
        p.graha: get_functional_nature(lagna_rasi, p.graha, node_rasi_map=planet_rasi_map).value
        for p in natal
    }
    # Contextual benefics — the same paksha-/combustion-aware classification the
    # drik counter uses (_chart_planets._aspect_counts), so the yuti and drishti
    # sign agrees with the base score's own drik sign.
    benefics = {"JUPITER", "VENUS"}
    if paksha_is_shukla:
        benefics.add("MOON")
    if "MERCURY" not in combust_planets:
        benefics.add("MERCURY")
    synthesis = apply_holistic_synthesis(
        base_scores,
        planet_rasi=planet_rasi_map,
        lagna_rasi=lagna_rasi,
        functional_nature=functional,
        benefic_planets=frozenset(benefics),
        d9_rasi_map=d9_map,
        d9_lagna_rasi=d9_lagna_rasi,
    )
    for p in natal:
        terms = synthesis.get(p.graha)
        if terms is None:
            continue
        p.strength_score = int(terms["score"])
        # Transparency (spec §5): surface the per-term deltas so the UI and
        # tests can show WHY the number moved ("Lagna lord +5, Guru +1").
        if p.strength_breakdown is not None:
            for key in ("functional", "yuti", "drishti", "bhanga", "delta"):
                value = terms[key]
                if value:
                    p.strength_breakdown[f"synthesis_{key}"] = f"{value:+g}"


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
    equal_bhava_map: dict[str, int] | None = None,
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
        equal_bhava_map=equal_bhava_map,
        planet_scores_in=planet_scores,
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
            # description_* states the mechanism (how the yoga forms); effect_*
            # states what it is traditionally held to do. Resolved here rather
            # than in each detector so the catalogue has one home.
            effectTa=yoga_effect(item.name)[0],
            effectEn=yoga_effect(item.name)[1],
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
            variantTa=item.variant_ta,
            variantEn=item.variant_en,
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
        # Life-stage inputs — must survive into the persisted snapshot: the
        # life-areas engine reads them for the age/phase gate (married ⇒ keep
        # Relationships/harmony lifelong; student-under-18 ⇒ drop Career;
        # retired ⇒ Career becomes "Life Purpose"). Dropping them here silently
        # disabled all of that.
        marital_status=_value(profile, "marital_status"),
        employment_type=_value(profile, "employment_type"),
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
    # Cazimi (heart of the Sun) is empowered, not burnt — exclude it from the
    # combust set exactly as the record path does, so the two build paths agree
    # on the paksha-/combustion-aware benefic classification (audit C1).
    snapshot_combust = {
        body.graha
        for body in snapshot.bodies.values()
        if body.graha in _NATAL_GRAHAS
        and is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde)
        and not is_cazimi(body.graha, body.absolute_longitude, sun_degree)
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

    # Holistic Strength Synthesis — shared with the record path (audit C1), run
    # here (before yoga detection) so the fresh-calc / public-tools / first-view
    # numbers match what the persisted-record read later produces.
    _apply_holistic_strength_synthesis(
        planet_positions,
        lagna_rasi=lagna_rasi,
        planet_rasi_map=snapshot_rasi_map,
        combust_planets=snapshot_combust,
        paksha_is_shukla=paksha_is_shukla,
        d9_lagna_rasi=navamsa_rasi_from_degree(lagna_degree),
    )

    equal_bhava_map = compute_equal_bhava(
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
        equal_bhava_map=equal_bhava_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = lagna_degree
    vargas = _compute_vargas(planet_longitudes)
    varga_reliability = _varga_reliability(int(_value(profile, "birth_time_confidence_minutes", 0) or 0))
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_conditions, bc_penalties = _build_birth_conditions(
        public_planet_positions, birth_time_local, lagna_rasi=lagna_rasi
    )
    _apply_birth_condition_penalties(public_planet_positions, bc_penalties)
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
            equal_bhava=equal_bhava_map,
            vargas=vargas,
            varga_reliability=varga_reliability,
            nakshatra_analysis=nakshatra_analysis,
            birth_conditions=birth_conditions,
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
        if p.graha in _NATAL_GRAHAS
        and is_combust(p.graha, p.absolute_longitude, sun_degree, p.is_retrograde)
        and not is_cazimi(p.graha, p.absolute_longitude, sun_degree)
    }
    for planet in planet_positions:
        planet.is_cazimi = is_cazimi(planet.graha, planet.absolute_longitude, sun_degree)
        # Cazimi overrides combustion — a heart-of-Sun planet is empowered, not burnt.
        planet.is_combust = (
            is_combust(planet.graha, planet.absolute_longitude, sun_degree, planet.is_retrograde)
            and not planet.is_cazimi
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

    # Holistic Strength Synthesis — shared across both build paths (audit C1).
    # Runs AFTER the base loop (relational terms read every other planet's base
    # score) and BEFORE yoga detection (yoga activation reads the synthesised
    # strength). See _apply_holistic_strength_synthesis.
    d9_lagna_rasi_val = navamsa_rasi_from_degree(float(chart.lagna_longitude))
    _apply_holistic_strength_synthesis(
        planet_positions,
        lagna_rasi=lagna_rasi,
        planet_rasi_map=planet_rasi_map,
        combust_planets=combust_planets,
        paksha_is_shukla=paksha_is_shukla,
        d9_lagna_rasi=d9_lagna_rasi_val,
    )

    equal_bhava_map = {
        p.graha: (int(p_row.bhava_house) if getattr(p_row, "bhava_house", None) is not None else 0)
        for p, p_row in zip(planet_positions, planets, strict=False)
    }
    if not all(v in range(1, 13) for v in equal_bhava_map.values()):
        equal_bhava_map = compute_equal_bhava(
            float(chart.lagna_longitude),
            {p.graha: p.absolute_longitude for p in planet_positions},
        )

    moon_rasi = next(planet.rasi for planet in planet_positions if planet.graha == "MOON")
    yogas, doshams, nakshatra_cautions = _build_yoga_dosham_insights(
        planet_positions,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        birth_jd=float(chart.julian_day),
        gender=_value(birth_profile, "gender_for_traditional_rules"),
        d9_lagna_rasi=d9_lagna_rasi_val,
        equal_bhava_map=equal_bhava_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = float(chart.lagna_longitude)
    vargas = _compute_vargas(planet_longitudes)
    varga_reliability = _varga_reliability(int(_value(birth_profile, "birth_time_confidence_minutes", 0) or 0))
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_conditions, bc_penalties = _build_birth_conditions(
        public_planet_positions, _value(birth_profile, "birth_time_local"), lagna_rasi=lagna_rasi
    )
    _apply_birth_condition_penalties(public_planet_positions, bc_penalties)
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
            equal_bhava=equal_bhava_map,
            vargas=vargas,
            varga_reliability=varga_reliability,
            nakshatra_analysis=nakshatra_analysis,
            birth_conditions=birth_conditions,
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

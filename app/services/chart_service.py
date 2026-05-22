from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import (
    degree_in_rasi,
    house_from_reference,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.transits import is_combust
from app.calculations.panchangam import NAKSHATRA_NAMES
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets
from app.calculations.dasha import calculate_vimshottari_timeline
from app.models import BirthProfile, Chart, ChartPlanet, User
from app.schemas.birth_profiles import BirthProfileCreate, BirthProfileResponse
from app.schemas.charts import (
    AyanamsaInfo,
    ChartCalculateRequest,
    ChartCalculateResponse,
    ChartCalculateResponseData,
    ChartSummaryData,
    ChartSummaryResponse,
    ChartSummaryText,
    LagnaPosition,
    PlanetPosition,
    ResponseMeta,
)

RASI_NAMES = {
    1: "MESHAM",
    2: "RISHABAM",
    3: "MIDHUNAM",
    4: "KADAGAM",
    5: "SIMMAM",
    6: "KANNI",
    7: "THULAAM",
    8: "VRICHIGAM",
    9: "DHANUSU",
    10: "MAGARAM",
    11: "KUMBAM",
    12: "MEENAM",
}

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
}

DEFAULT_CALCULATION_VERSION = "thirukanitham-2026-v1"


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
) -> PlanetPosition:
    rasi_name = RASI_NAMES[body.rasi]
    nakshatra_number = nakshatra_from_degree(body.absolute_longitude)
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
        d9_rasi=navamsa_rasi_from_degree(body.absolute_longitude),
        is_vargottama=body.rasi == navamsa_rasi_from_degree(body.absolute_longitude),
        show_retrograde_badge=body.show_retrograde_badge and body.graha not in {"RAHU", "KETU"},
    )


def _persist_chart_planets(session: Session, chart_id: UUID, planets: list[PlanetPosition]) -> None:
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
    for planet in planet_positions:
        planet.is_combust = is_combust(
            planet.graha,
            planet.absolute_longitude,
            sun_degree,
            planet.is_retrograde,
        )

    return ChartCalculateResponse(
        data=ChartCalculateResponseData(
            chart_id=chart.chart_id,
            birth_profile=birth_profile_response,
            birth_datetime_utc=_birth_datetime_utc(birth_profile),
            julian_day=float(chart.julian_day),
            ayanamsa=AyanamsaInfo(value_degrees=float(chart.ayanamsa_value_degrees or 0.0)),
            lagna=lagna,
            planets=planet_positions,
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

    birth_profile = session.get(BirthProfile, chart.birth_profile_id)
    if birth_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")

    chart.birth_profile = birth_profile
    if chart.planets:
        return _chart_response_from_record(chart)

    response = _chart_response_from_profile(birth_profile, chart.calculation_version, chart_id=chart.chart_id)
    _persist_chart_planets(session, chart.chart_id, response.data.planets)
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
    for body in snapshot.bodies.values():
        planet_positions.append(_planet_position_from_snapshot(body, lagna_rasi=lagna_rasi, sun_degree=sun_degree))

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
            planets=planet_positions,
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
        session.add(User(user_id=owner_user_id, email=None))
        session.flush()


def create_birth_profile_record(
    session: Session,
    profile: BirthProfileCreate,
    *,
    family_member_id: UUID | None = None,
) -> BirthProfile:
    owner_user_id = profile.owner_user_id or uuid4()
    _ensure_user(session, owner_user_id)

    birth_datetime_utc = None
    if _value(profile, "birth_time_local") is not None or _value(profile, "birth_datetime_utc") is not None:
        birth_datetime_utc = _birth_datetime_utc(profile)
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
        birth_time_source=profile.birth_time_source,
        birth_time_confidence_minutes=profile.birth_time_confidence_minutes,
        calendar_input_type=profile.calendar_input_type,
        privacy_mode="cloud",
        encrypted_birth_payload=None,
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
    _persist_chart_planets(session, chart.chart_id, data.planets)
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
        ).scalar_one_or_none()
        if existing_chart is not None:
            return load_persisted_chart_response(session, existing_chart.chart_id)

    try:
        response = _chart_response_from_profile(birth_profile, calculation_version, chart_id=chart_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    _persist_chart_record(session, persisted_profile_id, response)
    session.flush()
    return load_persisted_chart_response(session, response.data.chart_id)


def calculate_chart(payload: ChartCalculateRequest, session: Session | None = None) -> ChartCalculateResponse:
    if payload.birth_profile_id is not None:
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database session is required when calculating from birthProfileId.",
            )
        birth_profile = session.get(BirthProfile, payload.birth_profile_id)
        if birth_profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
        return calculate_chart_for_persisted_profile(
            session,
            birth_profile,
            calculation_version=payload.calculation_version,
            force_recalculate=payload.force_recalculate,
        )

    if payload.birth_profile is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either birthProfileId or birthProfile must be provided.",
        )

    if session is None:
        try:
            return _chart_response_from_profile(payload.birth_profile, payload.calculation_version)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    birth_profile = create_birth_profile_record(session, payload.birth_profile)
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


def get_chart_summary(session: Session, chart_id: UUID, *, language: str = "ta-en") -> ChartSummaryResponse:
    chart_response = load_persisted_chart_response(session, chart_id)
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    birth_profile = session.get(BirthProfile, chart.birth_profile_id)
    if birth_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")

    moon = next(planet for planet in chart_response.data.planets if planet.graha == "MOON")
    timeline = calculate_vimshottari_timeline(
        chart_response.data.julian_day,
        moon.absolute_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )

    return ChartSummaryResponse(
        data=ChartSummaryData(
            chart_id=chart_id,
            display_name=birth_profile.display_name,
            lagna_rasi=chart_response.data.lagna.rasi_name,
            moon_rasi=moon.rasi_name,
            janma_nakshatra=moon.nakshatra_name,
            janma_pada=moon.pada,
            current_mahadasha=timeline.current_mahadasha.lord,
            current_antardasha=timeline.current_antardasha.lord,
            primary_language_text=_summary_text(language),
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

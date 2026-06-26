"""DB persistence and public CRUD operations for charts and birth profiles."""
from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.panchangam import NAKSHATRA_NAMES
from app.calculations.transits import RASI_NAMES
from app.core.encryption import encrypt_bytes
from app.models import BirthProfile, Chart, ChartPlanet, User
from app.schemas.birth_profiles import BirthProfileCreate
from app.schemas.charts import ChartCalculateRequest, ChartCalculateResponse
from app.services._chart_build import (
    DEFAULT_CALCULATION_VERSION,
    RASI_NUMBERS,
    _birth_datetime_utc,
    _chart_response_from_profile,
    _chart_response_from_record,
    _value,
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


def _persist_chart_planets(
    session: Session,
    chart_id: UUID,
    planets: list,
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


def create_birth_profile_record(
    session: Session,
    profile: BirthProfileCreate,
    *,
    family_member_id: UUID | None = None,
) -> BirthProfile:
    owner_user_id = profile.owner_user_id
    if owner_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    _persist_chart_record(session, persisted_profile_id, response)
    session.flush()

    # Migrate active goals from the previous chart to the new one so they
    # are not orphaned when a user edits and recalculates their birth profile.
    if prev_chart is not None and prev_chart.chart_id != response.data.chart_id:
        from sqlalchemy import update as _sql_update

        from app.models.user_goal import UserGoal as _UserGoal
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

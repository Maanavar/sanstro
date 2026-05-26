from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, nakshatra_from_degree, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import (
    GRAHA_LABELS,
    MAJOR_GRAHAS,
    RASI_NAMES,
    TransitPosition as TransitPositionRecord,
    classify_kandaka_cycle,
    classify_sani_cycle,
    build_transit_position,
)
from app.schemas.dasha import ResponseMeta
from app.schemas.transits import (
    SaniCycleData,
    SaniCycleResponse,
    TransitCycle,
    TransitPosition as TransitPositionSchema,
    TransitSnapshotData,
    TransitSnapshotResponse,
)
from app.services.chart_service import load_persisted_chart_response


def _utc_midnight_local_date(local_date: date, timezone_name: str) -> datetime:
    timezone_obj = resolve_timezone(timezone_name)
    local_midnight = datetime.combine(local_date, time.min, tzinfo=timezone_obj)
    return local_midnight.astimezone(UTC)


def _to_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def build_transit_snapshot(
    chart_snapshot,
    as_of_utc: datetime,
    *,
    major_only: bool = False,
    current_snapshot=None,
) -> TransitSnapshotResponse:
    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    natal_moon_rasi = natal_moon.rasi

    jd = utc_datetime_to_julian_day(as_of_utc)
    if current_snapshot is None:
        current_snapshot = calculate_sidereal_planets(jd)
    sun_degree = current_snapshot.bodies["SUN"].absolute_longitude

    positions: list[TransitPositionSchema] = []
    for graha, body in current_snapshot.bodies.items():
        if major_only and GRAHA_LABELS[graha] not in MAJOR_GRAHAS:
            continue
        transit_record: TransitPositionRecord = build_transit_position(
            graha=graha,
            current_degree=body.absolute_longitude,
            current_rasi_number=body.rasi,
            sun_degree=sun_degree,
            natal_moon_rasi=natal_moon_rasi,
            natal_lagna_rasi=natal_lagna_rasi,
            is_retrograde=body.is_retrograde,
        )
        positions.append(TransitPositionSchema(**asdict(transit_record)))

    moon_position = current_snapshot.bodies["MOON"]
    janma_nakshatra = nakshatra_from_degree(natal_moon.absolute_longitude)
    current_nakshatra = nakshatra_from_degree(moon_position.absolute_longitude)
    chandrashtama = current_nakshatra == ((janma_nakshatra + 7 - 1) % 27) + 1

    return TransitSnapshotResponse(
        data=TransitSnapshotData(
            as_of_utc=as_of_utc,
            janma_rasi=RASI_NAMES[natal_moon_rasi],
            lagna_rasi=RASI_NAMES[natal_lagna_rasi],
            is_chandrashtama=chandrashtama,
            transits=positions,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_gochar_current(session: Session, chart_id: UUID, as_of: datetime | date) -> TransitSnapshotResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    if isinstance(as_of, date) and not isinstance(as_of, datetime):
        timezone_obj = resolve_timezone(chart_snapshot.data.birth_profile.birth_timezone)
        local_noon = datetime.combine(as_of, time(12, 0), tzinfo=timezone_obj)
        return build_transit_snapshot(chart_snapshot, local_noon.astimezone(UTC))
    return build_transit_snapshot(chart_snapshot, _to_utc_datetime(as_of))


def get_major_transits(session: Session, chart_id: UUID, as_of: datetime) -> TransitSnapshotResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    return build_transit_snapshot(chart_snapshot, _to_utc_datetime(as_of), major_only=True)


def build_sani_cycle_response(chart_snapshot, on_date: date, *, saturn_snapshot=None) -> SaniCycleResponse:
    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    if saturn_snapshot is None:
        saturn_snapshot = calculate_sidereal_planets(
            utc_datetime_to_julian_day(_utc_midnight_local_date(on_date, chart_snapshot.data.birth_profile.birth_timezone))
        )
    saturn = saturn_snapshot.bodies["SATURN"]

    position_from_moon = house_from_reference(natal_moon.rasi, saturn.rasi)
    position_from_lagna = house_from_reference(natal_lagna_rasi, saturn.rasi)
    moon_cycle = classify_sani_cycle(position_from_moon)
    lagna_cycle = classify_kandaka_cycle(position_from_lagna)

    if moon_cycle.type == "ARDHASHTAMA_SANI":
        confirmation = (
            f"Saturn is in {RASI_NAMES[saturn.rasi]}, which is {position_from_moon}th from "
            f"{RASI_NAMES[natal_moon.rasi]} Moon. This is Ardhashtama Sani, not Ezharai Sani."
        )
    elif moon_cycle.type == "JANMA_SANI":
        confirmation = (
            f"Saturn is in {RASI_NAMES[saturn.rasi]}, which is {position_from_moon}th from "
            f"{RASI_NAMES[natal_moon.rasi]} Moon. This is Janma Sani / Ezharai Phase 2."
        )
    elif moon_cycle.is_active and moon_cycle.type is not None:
        confirmation = (
            f"Saturn is in {RASI_NAMES[saturn.rasi]}, which is {position_from_moon}th from "
            f"{RASI_NAMES[natal_moon.rasi]} Moon. This is {moon_cycle.type}."
        )
    else:
        confirmation = (
            f"Saturn is in {RASI_NAMES[saturn.rasi]}, which is {position_from_moon}th from "
            f"{RASI_NAMES[natal_moon.rasi]} Moon. No named Saturn-pressure cycle is active."
        )

    return SaniCycleResponse(
        data=SaniCycleData(
            saturn_rasi=RASI_NAMES[saturn.rasi],
            janma_rasi=RASI_NAMES[natal_moon.rasi],
            lagna_rasi=RASI_NAMES[natal_lagna_rasi],
            position_from_moon=position_from_moon,
            position_from_lagna=position_from_lagna,
            moon_based_cycle=TransitCycle(
                type=moon_cycle.type,
                isActive=moon_cycle.is_active,
                supportiveLabel=moon_cycle.supportive_label,
            ),
            lagna_based_cycle=TransitCycle(
                type=lagna_cycle.type,
                isActive=lagna_cycle.is_active,
                supportiveLabel=lagna_cycle.supportive_label,
            ),
            confirmation_sentence=confirmation,
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_sani_cycle(session: Session, chart_id: UUID, on_date: date) -> SaniCycleResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    return build_sani_cycle_response(chart_snapshot, on_date)

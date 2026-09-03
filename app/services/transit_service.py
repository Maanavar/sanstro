from __future__ import annotations

import logging
from dataclasses import asdict
from datetime import UTC, date, datetime
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.calculations.astro import (
    house_from_reference,
    is_chandrashtama,
    julian_day_to_utc_datetime,
    utc_datetime_to_julian_day,
)
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import (
    GRAHA_LABELS,
    MAJOR_GRAHAS,
    RASI_NAMES,
    build_transit_position,
    classify_kandaka_cycle,
    classify_sani_cycle,
    find_saturn_egress_jd,
)
from app.calculations.transits import (
    TransitPosition as TransitPositionRecord,
)
from app.schemas.dasha import ResponseMeta
from app.schemas.transits import (
    SaniCycleData,
    SaniCycleResponse,
    TransitCycle,
    TransitSnapshotData,
    TransitSnapshotResponse,
)
from app.schemas.transits import (
    TransitPosition as TransitPositionSchema,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import (
    local_midnight_as_jd_for_profile,
    local_noon_as_utc_for_profile,
    resolve_effective_daily_timezone,
)

logger = logging.getLogger(__name__)

SADE_SATI_TYPES = {"EZHARAI_SANI_PHASE_1", "JANMA_SANI", "EZHARAI_SANI_PHASE_2", "EZHARAI_SANI_PHASE_3"}


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
    chandrashtama = is_chandrashtama(natal_moon_rasi, moon_position.rasi)

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
        return build_transit_snapshot(
            chart_snapshot,
            local_noon_as_utc_for_profile(as_of, chart_snapshot.data.birth_profile),
        )
    return build_transit_snapshot(chart_snapshot, _to_utc_datetime(as_of))


# Days to step past a computed egress before searching the next rasi.
#
# `find_saturn_egress_jd` RAISES when its start JD does not fall inside the rasi
# it is asked about, so each hop in the Ezharai walk has to land clear of the
# boundary it just crossed. The egress it returns is the FINAL one — Saturn does
# not come back — so any positive step works in principle; two days puts Saturn
# roughly 4 arcminutes inside the next rasi at its ~2'/day direct speed, which
# clears the bisection's tolerance without skipping anything.
_EGRESS_HOP_DAYS = 2.0


def _to_local_date(jd: float, timezone_name: str) -> date:
    return julian_day_to_utc_datetime(jd).astimezone(ZoneInfo(timezone_name)).date()


def _sade_sati_cycle_end_jd(current_rasi: int, phase_egress_jd: float, phase_type: str | None) -> float:
    """Walk forward to the egress that ENDS the 7½-year cycle, not this phase.

    Takes the phase egress already computed by the caller rather than
    recomputing it: each `find_saturn_egress_jd` is a bisection over repeated
    Swiss Ephemeris probes, and this function used to redo the first one that
    `_active_cycle_fields` had just paid for.

    Ezharai Sani is Saturn crossing the 12th, 1st and 2nd rasis from the natal
    Moon, so what remains after the current phase is two more rasis from the
    12th, one from the 1st, and none from the 2nd.
    """
    egress_jd = phase_egress_jd
    if phase_type == "EZHARAI_SANI_PHASE_1":
        next_rasi = (current_rasi % 12) + 1
        egress_jd = find_saturn_egress_jd(next_rasi, egress_jd + _EGRESS_HOP_DAYS)
        final_rasi = (next_rasi % 12) + 1
        egress_jd = find_saturn_egress_jd(final_rasi, egress_jd + _EGRESS_HOP_DAYS)
    elif phase_type in {"JANMA_SANI", "EZHARAI_SANI_PHASE_2"}:
        final_rasi = (current_rasi % 12) + 1
        egress_jd = find_saturn_egress_jd(final_rasi, egress_jd + _EGRESS_HOP_DAYS)
    return egress_jd


def _active_cycle_fields(
    *,
    cycle_type: str | None,
    current_rasi: int,
    phase_egress_jd: float | None,
    timezone_name: str,
    role: str,
) -> dict[str, str | None]:
    """End dates for one reckoning of the cycle, or just its role when quiet.

    `phase_egress_jd` is computed once per request and shared by both
    reckonings: they read the same Saturn, so they leave the same rasi on the
    same day, and computing it twice bought nothing.

    A failure to resolve the dates omits them rather than failing the response.
    The card renders "refresh to calculate the end date" for a missing value,
    which is a far better outcome than a 500 on a screen whose whole purpose is
    to tell an anxious reader when the pressure ends.
    """
    if not cycle_type or phase_egress_jd is None:
        return {"role": role}
    try:
        phase_end = _to_local_date(phase_egress_jd, timezone_name)
        cycle_end = (
            _to_local_date(_sade_sati_cycle_end_jd(current_rasi, phase_egress_jd, cycle_type), timezone_name)
            if cycle_type in SADE_SATI_TYPES
            else phase_end
        )
    except (ValueError, KeyError):
        logger.warning("Saturn egress search failed for rasi %s; omitting cycle end dates", current_rasi, exc_info=True)
        return {"role": role}
    return {
        "role": role,
        "phaseEndsOn": phase_end.isoformat(),
        "cycleEndsOn": cycle_end.isoformat(),
    }


def build_sani_cycle_response(chart_snapshot, on_date: date, *, saturn_snapshot=None) -> SaniCycleResponse:
    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    timezone_name = resolve_effective_daily_timezone(chart_snapshot.data.birth_profile)
    current_jd = local_midnight_as_jd_for_profile(on_date, chart_snapshot.data.birth_profile)
    if saturn_snapshot is None:
        saturn_snapshot = calculate_sidereal_planets(current_jd)
    saturn = saturn_snapshot.bodies["SATURN"]

    # One egress search for the whole response. Both reckonings read the same
    # Saturn, so the day it leaves its current rasi is the same day for both,
    # and this is the expensive part of the request. Skipped entirely when
    # neither cycle is active — see the `phase_egress_jd=None` guard below.
    phase_egress_jd: float | None = None

    position_from_moon = house_from_reference(natal_moon.rasi, saturn.rasi)
    position_from_lagna = house_from_reference(natal_lagna_rasi, saturn.rasi)
    moon_cycle = classify_sani_cycle(position_from_moon)
    lagna_cycle = classify_kandaka_cycle(position_from_lagna)

    if moon_cycle.is_active or lagna_cycle.is_active:
        try:
            phase_egress_jd = find_saturn_egress_jd(saturn.rasi, current_jd)
        except (ValueError, KeyError):
            logger.warning(
                "Saturn egress search failed for rasi %s at jd %s; cycle end dates omitted",
                saturn.rasi,
                current_jd,
                exc_info=True,
            )

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
                **_active_cycle_fields(
                    cycle_type=moon_cycle.type if moon_cycle.is_active else None,
                    current_rasi=saturn.rasi,
                    phase_egress_jd=phase_egress_jd,
                    timezone_name=timezone_name,
                    role="primary",
                ),
            ),
            lagna_based_cycle=TransitCycle(
                type=lagna_cycle.type,
                isActive=lagna_cycle.is_active,
                supportiveLabel=lagna_cycle.supportive_label,
                **_active_cycle_fields(
                    cycle_type=lagna_cycle.type if lagna_cycle.is_active else None,
                    current_rasi=saturn.rasi,
                    phase_egress_jd=phase_egress_jd,
                    timezone_name=timezone_name,
                    role="cross_check",
                ),
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

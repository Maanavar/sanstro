from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.astro import (
    house_from_reference,
    julian_day_to_utc_datetime,
    resolve_timezone,
    utc_datetime_to_julian_day,
    utc_datetime_to_local_datetime,
)
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import RASI_NAMES, classify_sani_cycle
from app.schemas.dasha import ResponseMeta
from app.schemas.peyarchi import PeyarchiEvent, PeyarchiSummaryResponse
from app.services.chart_service import load_persisted_chart_response

SLOW_PLANETS = ("SATURN", "JUPITER", "RAHU", "KETU")
SEARCH_DAYS_DEFAULT = 700
SEARCH_DAYS_SATURN = 1200
SEARCH_DAYS_RETROGRADE_CHECK = 90

PLANET_LABELS: dict[str, tuple[str, str]] = {
    "SATURN": ("Sani Peyarchi", "Saturn Transit"),
    "JUPITER": ("Guru Peyarchi", "Jupiter Transit"),
    "RAHU": ("Rahu Peyarchi", "Rahu Transit"),
    "KETU": ("Ketu Peyarchi", "Ketu Transit"),
}


def _search_days_for_planet(planet_key: str) -> int:
    return SEARCH_DAYS_SATURN if planet_key == "SATURN" else SEARCH_DAYS_DEFAULT


def _to_utc_noon(local_day: date, timezone_name: str) -> datetime:
    timezone_obj = resolve_timezone(timezone_name)
    local_noon = datetime.combine(local_day, time(12, 0), tzinfo=timezone_obj)
    return local_noon.astimezone(UTC)


def find_next_rasi_change(planet_key: str, from_jd: float, search_days: int | None = None) -> tuple[datetime, int]:
    if planet_key not in SLOW_PLANETS:
        raise ValueError(f"Unsupported planet for peyarchi search: {planet_key}")

    window_days = search_days if search_days is not None else _search_days_for_planet(planet_key)
    start_snapshot = calculate_sidereal_planets(from_jd)
    start_rasi = start_snapshot.bodies[planet_key].rasi

    lo = from_jd
    hi = from_jd + window_days
    end_snapshot = calculate_sidereal_planets(hi)
    if end_snapshot.bodies[planet_key].rasi == start_rasi:
        raise ValueError(f"No rasi change found for {planet_key} within {window_days} days.")
    hi_snapshot = end_snapshot

    while hi - lo > 1.0 / 1440.0:  # 1 minute in Julian day
        mid = (lo + hi) / 2.0
        mid_snapshot = calculate_sidereal_planets(mid)
        if mid_snapshot.bodies[planet_key].rasi != start_rasi:
            hi = mid
            hi_snapshot = mid_snapshot
        else:
            lo = mid

    result_dt = julian_day_to_utc_datetime(hi)
    return result_dt, hi_snapshot.bodies[planet_key].rasi


def find_next_permanent_rasi_change(planet_key: str, from_jd: float) -> tuple[datetime, int]:
    origin_snapshot = calculate_sidereal_planets(from_jd)
    origin_rasi = origin_snapshot.bodies[planet_key].rasi

    candidate_dt, candidate_rasi = find_next_rasi_change(planet_key, from_jd, _search_days_for_planet(planet_key))
    probe_start = utc_datetime_to_julian_day(candidate_dt + timedelta(days=1))

    for _ in range(8):
        # 90 days is the documented retrograde guard window for temporary dips.
        try:
            next_dt, next_rasi = find_next_rasi_change(
                planet_key,
                probe_start,
                SEARCH_DAYS_RETROGRADE_CHECK,
            )
        except ValueError:
            break

        if next_rasi == origin_rasi:
            candidate_dt, candidate_rasi = find_next_rasi_change(
                planet_key,
                utc_datetime_to_julian_day(next_dt + timedelta(days=1)),
                _search_days_for_planet(planet_key),
            )
            probe_start = utc_datetime_to_julian_day(candidate_dt + timedelta(days=1))
            continue
        break

    return candidate_dt, candidate_rasi


def get_peyarchi_summary(
    session: Session,
    chart_id: UUID,
    *,
    as_of: date,
    window_days: int | None = None,
) -> PeyarchiSummaryResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    birth_timezone = chart_snapshot.data.birth_profile.birth_timezone
    as_of_utc = _to_utc_noon(as_of, birth_timezone)
    from_jd = utc_datetime_to_julian_day(as_of_utc)

    natal_moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    current_snapshot = calculate_sidereal_planets(from_jd)

    events: list[PeyarchiEvent] = []
    for planet_key in SLOW_PLANETS:
        event_dt_utc, to_rasi = find_next_permanent_rasi_change(planet_key, from_jd)
        from_rasi = current_snapshot.bodies[planet_key].rasi
        local_event_date = utc_datetime_to_local_datetime(event_dt_utc, birth_timezone).date()
        days_from_today = (local_event_date - as_of).days

        if window_days is not None and days_from_today > window_days:
            continue
        if days_from_today < 0:
            continue

        house_from_moon = house_from_reference(natal_moon.rasi, to_rasi)
        house_from_lagna = house_from_reference(natal_lagna_rasi, to_rasi)
        sani_cycle_after = classify_sani_cycle(house_from_moon).type if planet_key == "SATURN" else None
        label_ta, label_en = PLANET_LABELS[planet_key]

        events.append(
            PeyarchiEvent(
                alertId=f"{chart_id}:{planet_key}:{local_event_date.isoformat()}",
                planet=planet_key,
                fromRasi=RASI_NAMES[from_rasi],
                toRasi=RASI_NAMES[to_rasi],
                peyarchiDateUTC=event_dt_utc,
                peyarchiDateLocal=local_event_date,
                daysFromToday=days_from_today,
                impactFromMoon=house_from_moon,
                impactFromLagna=house_from_lagna,
                saniCycleAfter=sani_cycle_after,
                labelTa=label_ta,
                labelEn=label_en,
            )
        )

    events.sort(key=lambda event: event.peyarchi_date_utc)
    return PeyarchiSummaryResponse(
        data=events,
        meta=ResponseMeta(
            calculationVersion=chart_snapshot.meta.calculation_version,
            generatedAt=datetime.now(tz=UTC),
        ),
    )

from __future__ import annotations

from datetime import UTC, date, datetime, time
from typing import Literal
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day, resolve_timezone
from app.calculations.dasha import _build_subperiods, calculate_vimshottari_timeline
from app.schemas.dasha import (
    DashaCurrentWindow,
    DashaOpeningWindow,
    DashaPeriodWindow,
    DashaTimelineResponse,
    DashaTimelineResponseData,
    ResponseMeta,
)
from app.services.chart_service import load_persisted_chart_response


def _local_midnight_as_jd(local_date: date, timezone_name: str) -> float:
    timezone_obj = resolve_timezone(timezone_name)
    local_midnight = datetime.combine(local_date, time.min, tzinfo=timezone_obj)
    return utc_datetime_to_julian_day(local_midnight.astimezone(UTC))


def _serialize_period(period) -> dict[str, object]:
    return {
        "level": period.level,
        "lord": period.lord,
        "startDate": period.start_date,
        "endDate": period.end_date,
    }


def _timeline_for_level(timeline, level: Literal["maha", "antar", "pratyantar", "sookshma", "prana"]) -> list[dict[str, object]]:
    if level == "maha":
        return [_serialize_period(period) for period in timeline.mahadashas]
    if level == "antar":
        return [_serialize_period(period) for period in _build_subperiods(timeline.current_mahadasha, "antar")]
    return [_serialize_period(period) for period in _build_subperiods(timeline.current_antardasha, "pratyantar")]


def get_chart_dasha(
    session: Session,
    chart_id: UUID,
    as_of: date,
    *,
    level: Literal["maha", "antar", "pratyantar", "sookshma", "prana"] = "pratyantar",
) -> DashaTimelineResponse:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    birth_jd = chart_snapshot.data.julian_day
    as_of_jd = _local_midnight_as_jd(as_of, chart_snapshot.data.birth_profile.birth_timezone)

    timeline = calculate_vimshottari_timeline(birth_jd, moon.absolute_longitude, as_of_jd)

    return DashaTimelineResponse(
        data=DashaTimelineResponseData(
            chartId=chart_id,
            openingDasha=DashaOpeningWindow(
                lord=timeline.opening_lord,
                balanceYearsAtBirth=timeline.balance_years_at_birth,
            ),
            current=DashaCurrentWindow(
                mahadasha=DashaPeriodWindow(
                    lord=timeline.current_mahadasha.lord,
                    startDate=timeline.current_mahadasha.start_date,
                    endDate=timeline.current_mahadasha.end_date,
                ),
                antardasha=DashaPeriodWindow(
                    lord=timeline.current_antardasha.lord,
                    startDate=timeline.current_antardasha.start_date,
                    endDate=timeline.current_antardasha.end_date,
                ),
                pratyantardasha=DashaPeriodWindow(
                    lord=timeline.current_pratyantardasha.lord,
                    startDate=timeline.current_pratyantardasha.start_date,
                    endDate=timeline.current_pratyantardasha.end_date,
                ),
            ),
            timeline=_timeline_for_level(timeline, level),
        ),
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

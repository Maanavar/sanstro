"""Composes the per-chart dashboard bundle (DASH-04).

Replaces the dashboard's ~13 parallel per-chart requests with one server-side
composition. Every section is isolated: a section whose computation raises is
returned as ``None`` (with a short diagnostic note in ``errors``) so one broken
calculation can never blank the whole dashboard (DASH-02).
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import UTC, date, datetime, timedelta
from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.dasha import ResponseMeta
from app.schemas.dashboard_bundle import (
    ChartDashboardBundleData,
    ChartDashboardBundleResponse,
)
from app.schemas.panchangam import PanchangamDailyQuery
from app.services._chart_summary import get_chart_summary_from_snapshot
from app.services.chart_explanation_service import build_chart_explanation
from app.services.chart_service import load_persisted_chart_response
from app.services.daily_guidance_service import (
    get_daily_guidance,
    get_daily_guidance_range,
    get_week_ahead_by_chart,
)
from app.services.dasha_service import get_chart_dasha_from_snapshot
from app.services.life_areas_service import get_life_areas
from app.services.nakshatra_content import get_nakshatra_card
from app.services.panchangam_service import calculate_panchangam, calculate_panchangam_timings
from app.services.peyarchi_service import get_peyarchi_summary
from app.services.transit_service import get_gochar_current, get_sani_cycle

logger = logging.getLogger(__name__)

T = TypeVar("T")


def _failure_note(exc: Exception) -> str:
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            detail = detail.get("en") or next(iter(detail.values()), "")
        return f"{exc.status_code}: {detail}"[:200]
    return f"{type(exc).__name__}"


def get_chart_dashboard_bundle(
    session: Session,
    chart_id: UUID,
    on_date: date,
    *,
    owner_user_id: UUID,
    language: str = "ta-en",
) -> ChartDashboardBundleResponse:
    # The chart snapshot itself is the one hard dependency — without it nothing
    # else can compute, so its 404 propagates (route has already checked owner).
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    profile = chart_snapshot.data.birth_profile

    errors: dict[str, str] = {}

    def safe(section: str, compute: Callable[[], T]) -> T | None:
        try:
            return compute()
        except Exception as exc:  # noqa: BLE001 — per-section isolation is the point
            logger.warning("dashboard-bundle: section %r failed for chart %s: %s", section, chart_id, exc)
            errors[section] = _failure_note(exc)
            return None

    # Same location choice the web client made before this endpoint existed:
    # the saved current location when complete, else the birth location.
    has_current = (
        profile.current_latitude is not None
        and profile.current_longitude is not None
        and bool(profile.current_timezone)
    )
    lat = profile.current_latitude if has_current else profile.birth_latitude
    lng = profile.current_longitude if has_current else profile.birth_longitude
    tz = profile.current_timezone if has_current else profile.birth_timezone
    has_location = lat is not None and lng is not None and bool(tz)

    moon = next((p for p in chart_snapshot.data.planets if p.graha == "MOON"), None)

    data = ChartDashboardBundleData(
        chartId=chart_snapshot.data.chart_id,
        dateLocal=on_date,
        chart=chart_snapshot.data,
        summary=safe(
            "summary",
            lambda: get_chart_summary_from_snapshot(chart_snapshot, language=language).data,
        ),
        dailyGuidance=safe(
            "dailyGuidance",
            lambda: get_daily_guidance(
                session, chart_id, on_date, language, chart_snapshot=chart_snapshot
            ).data,
        ),
        dailyGuidanceRange=safe(
            "dailyGuidanceRange",
            lambda: get_daily_guidance_range(
                session,
                profile.birth_profile_id,
                on_date,
                on_date + timedelta(days=2),
                language,
                chart_snapshot=chart_snapshot,
            ).data,
        ),
        dasha=safe(
            "dasha",
            lambda: get_chart_dasha_from_snapshot(
                chart_snapshot, on_date, level="maha,antar,pratyantar"
            ).data,
        ),
        transit=safe("transit", lambda: get_gochar_current(session, chart_id, on_date).data),
        sani=safe("sani", lambda: get_sani_cycle(session, chart_id, on_date).data),
        peyarchiUpcoming=safe(
            "peyarchiUpcoming",
            lambda: get_peyarchi_summary(session, chart_id, as_of=on_date, window_days=30).data,
        ),
        explanation=safe(
            "explanation",
            lambda: build_chart_explanation(
                session, chart_id, as_of=on_date, peyarchi_window_days=700
            ).data,
        ),
        panchangam=(
            safe(
                "panchangam",
                lambda: calculate_panchangam(
                    PanchangamDailyQuery(date=on_date, lat=lat, lng=lng, timezone=tz), session
                ).data,
            )
            if has_location
            else None
        ),
        panchangamTimings=(
            safe(
                "panchangamTimings",
                lambda: calculate_panchangam_timings(
                    PanchangamDailyQuery(date=on_date, lat=lat, lng=lng, timezone=tz), session
                ).data,
            )
            if has_location
            else None
        ),
        lifeAreas=safe(
            "lifeAreas",
            lambda: get_life_areas(session, chart_id, on_date, owner_user_id=owner_user_id).data,
        ),
        weekAhead=safe(
            "weekAhead",
            lambda: get_week_ahead_by_chart(session, chart_id, on_date, language).data,
        ),
        nakshatraCard=(
            safe("nakshatraCard", lambda: get_nakshatra_card(moon.nakshatra).data)
            if moon is not None and 1 <= moon.nakshatra <= 27
            else None
        ),
        panchangamLocation=("current" if has_current else "birth") if has_location else None,
        panchangamTimezone=tz if has_location else None,
        errors=errors,
    )

    return ChartDashboardBundleResponse(
        data=data,
        meta=ResponseMeta(
            calculation_version=chart_snapshot.meta.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )

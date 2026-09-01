from __future__ import annotations

import logging
from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

# noqa: PLC2701 — deliberate internal use of private helpers from sibling module
from app.api.public_tools import (  # type: ignore[attr-defined]
    _RASI_PALAN_EN,
    _RASI_PALAN_TA,
    _resolve_rasi_number,
)
from app.calculations.astro import RASI_NAMES
from app.core.auth import get_optional_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.panchangam import PanchangamDailyQuery
from app.services.daily_guidance_service import get_daily_guidance
from app.services.life_areas_service import get_life_areas
from app.services.life_event_service import get_life_event_windows
from app.services.panchangam_service import calculate_panchangam

log = logging.getLogger(__name__)

router = APIRouter()

# Per-section outcome, reported alongside the data.
#
# An absent section used to mean three different things at once — you did not
# ask for it, you are not allowed it, or it blew up — and the client could not
# tell them apart. It read as "no data today" in all three cases, so a failing
# section showed the user an incomplete reading with no error, and showed the
# operator nothing at all.
SECTION_OK = "ok"                        # computed and returned
SECTION_UNAVAILABLE = "unavailable"      # attempted and failed; see the logs
SECTION_NOT_REQUESTED = "not_requested"  # inputs absent, or caller not entitled
SECTION_INVALID_INPUT = "invalid_input"  # the caller's own parameter was wrong

_SECTION_NAMES = ("panchangam", "rasi_palan", "guidance", "life_areas", "life_events")

_RASI_NAMES_TA: dict[int, str] = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
}


class DailySnapshotData(BaseModel):
    panchangam: Any | None = None
    rasi_palan: Any | None = None
    guidance: Any | None = None
    life_areas: list[Any] | None = None
    life_events: list[Any] | None = None
    transits: list[Any] = []
    # Additive: existing clients that read only the payload fields are
    # unaffected. `sections[name]` is one of the SECTION_* values above.
    sections: dict[str, str] = {}

    model_config = {"populate_by_name": True}


class DailySnapshotResponse(BaseModel):
    success: bool = True
    data: DailySnapshotData


@router.get("/daily-snapshot", response_model=DailySnapshotResponse, tags=["snapshot"])
def daily_snapshot(
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    tz: str = Query(default="Asia/Kolkata"),
    rasi: str | None = Query(default=None),
    chart_id: UUID | None = Query(default=None, alias="chartId"),
    session: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> DailySnapshotResponse:
    """Composite today-screen endpoint — returns panchangam, rasi palan, guidance,
    life areas, life events, and transits in a single request.

    Auth is optional: unauthenticated callers receive panchangam + rasi palan only.
    Chart-specific sections (guidance, life areas, life events) require both a valid
    JWT and a chart_id that belongs to the authenticated user.
    """
    today = date.today()
    sections: dict[str, str] = dict.fromkeys(_SECTION_NAMES, SECTION_NOT_REQUESTED)

    # ── Panchangam ────────────────────────────────────────────────────────────
    panchangam_data: Any | None = None
    panchangam_result = None
    if lat is not None and lng is not None:
        try:
            query = PanchangamDailyQuery(date=today, lat=lat, lng=lng, timezone=tz)
            panchangam_result = calculate_panchangam(query, session)
            panchangam_data = panchangam_result.data.model_dump(by_alias=True)
            sections["panchangam"] = SECTION_OK
        except Exception:
            # Broad on purpose, and now loud. Narrowing to the known ephemeris
            # failures would let an unanticipated one escape and 500 the whole
            # composite response, taking the four healthy sections with it — a
            # worse outcome for the user than one section marked unavailable.
            # `logger.exception` under a stable event name is what makes these
            # countable instead of invisible.
            log.exception("daily_snapshot_panchangam_failed lat=%s lng=%s tz=%s", lat, lng, tz)
            sections["panchangam"] = SECTION_UNAVAILABLE

    # ── Rasi Palan ────────────────────────────────────────────────────────────
    rasi_palan_data: Any | None = None
    if rasi:
        try:
            janma_rasi = _resolve_rasi_number(rasi)
            if panchangam_result is not None:
                moon_rasi = panchangam_result.data.chandrashtamam_today.moon_rasi_number
            else:
                fallback_query = PanchangamDailyQuery(date=today, lat=lat or 13.0827, lng=lng or 80.2707, timezone=tz)
                fallback = calculate_panchangam(fallback_query, session)
                moon_rasi = fallback.data.chandrashtamam_today.moon_rasi_number
            moon_house = ((moon_rasi - janma_rasi) % 12) + 1
            pred_ta = _RASI_PALAN_TA[moon_house]
            pred_en = _RASI_PALAN_EN[moon_house]
            rasi_name_en = RASI_NAMES.get(janma_rasi, str(janma_rasi))
            rasi_name_ta = _RASI_NAMES_TA.get(janma_rasi, rasi_name_en)
            rasi_palan_data = {
                "rasi": janma_rasi,
                "rasiName": {"ta": rasi_name_ta, "en": rasi_name_en},
                "date": str(today),
                "moonRasi": moon_rasi,
                "moonHouse": moon_house,
                "headline": {"ta": pred_ta["title"], "en": pred_en["title"]},
                "body": {"ta": pred_ta["body"], "en": pred_en["body"]},
                "luckyColor": {"ta": pred_ta["lucky_color"], "en": pred_en["lucky_color"]},
                "luckyNumbers": pred_ta["lucky_numbers"],
                "pariharam": {"ta": pred_ta["pariharam"], "en": pred_en["pariharam"]},
                "tone": pred_ta["tone"],
            }
            sections["rasi_palan"] = SECTION_OK
        except ValueError:
            # `_resolve_rasi_number` raises ValueError, and only ValueError, for
            # a rasi it cannot parse. That is the caller's parameter being
            # wrong, not this service failing, and the two should not look the
            # same to the client or in the logs.
            log.info("daily_snapshot_rasi_palan_invalid_input rasi=%r", rasi)
            sections["rasi_palan"] = SECTION_INVALID_INPUT
        except Exception:
            log.exception("daily_snapshot_rasi_palan_failed rasi=%r", rasi)
            sections["rasi_palan"] = SECTION_UNAVAILABLE

    # ── Chart-specific sections (auth + ownership required) ───────────────────
    guidance_data: Any | None = None
    life_areas_data: list[Any] | None = None
    life_events_data: list[Any] | None = None

    if current_user is not None and chart_id is not None:
        chart = session.get(Chart, chart_id)
        profile = session.get(BirthProfile, chart.birth_profile_id) if chart else None
        is_owner = (
            profile is not None
            and profile.deleted_at is None
            and profile.owner_user_id == current_user.user_id
        )
        if is_owner:
            try:
                g_resp = get_daily_guidance(session, chart_id, today, "ta-en")
                guidance_data = g_resp.data.model_dump(by_alias=True)
                sections["guidance"] = SECTION_OK
            except Exception:
                log.exception("daily_snapshot_guidance_failed chart_id=%s", chart_id)
                sections["guidance"] = SECTION_UNAVAILABLE

            try:
                la_resp = get_life_areas(session, chart_id, today, owner_user_id=current_user.user_id)
                life_areas_data = [a.model_dump(by_alias=True) for a in la_resp.data.areas]
                sections["life_areas"] = SECTION_OK
            except Exception:
                log.exception("daily_snapshot_life_areas_failed chart_id=%s", chart_id)
                sections["life_areas"] = SECTION_UNAVAILABLE

            try:
                le_resp = get_life_event_windows(
                    session, chart_id, today, 3, owner_user_id=current_user.user_id
                )
                life_events_data = [w.model_dump(by_alias=True) for w in le_resp.data.windows]
                sections["life_events"] = SECTION_OK
            except Exception:
                log.exception("daily_snapshot_life_events_failed chart_id=%s", chart_id)
                sections["life_events"] = SECTION_UNAVAILABLE

    return DailySnapshotResponse(
        data=DailySnapshotData(
            panchangam=panchangam_data,
            rasi_palan=rasi_palan_data,
            guidance=guidance_data,
            life_areas=life_areas_data,
            life_events=life_events_data,
            transits=[],
            sections=sections,
        )
    )

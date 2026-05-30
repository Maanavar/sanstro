"""
Life Event Log service — P2-D.

Lets users log real life events with date and type. Correlates each event
retrospectively with the dasha/transit that was active on that date.
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAME_TO_NUMBER, RASI_NAMES, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.models import BirthProfile, Chart
from app.models.user_life_events import UserLifeEvent
from app.schemas.life_event_log import (
    BiText,
    EventCorrelation,
    LifeEventLogCreate,
    LifeEventLogCreateResponse,
    LifeEventLogItem,
    LifeEventLogResponse,
    VALID_EVENT_TYPES,
)

logger = logging.getLogger(__name__)

# Event type → theme mapping for correlation narrative
_EVENT_THEME_TA: dict[str, str] = {
    "JOB_CHANGE":           "தொழில் மாற்றம்",
    "PROMOTION":            "தொழில் முன்னேற்றம்",
    "RELATIONSHIP_START":   "புதிய உறவு தொடக்கம்",
    "RELATIONSHIP_END":     "உறவு முடிவு",
    "RELOCATION":           "இடமாற்றம்",
    "HEALTH_EVENT":         "உடல்நல நிகழ்வு",
    "EXAM_RESULT":          "தேர்வு முடிவு",
    "FINANCIAL_MILESTONE":  "நிதி மைல்கல்",
    "FAMILY_LOSS":          "குடும்ப இழப்பு",
    "OTHER":                "பிற நிகழ்வு",
}
_EVENT_THEME_EN: dict[str, str] = {
    "JOB_CHANGE":           "career change",
    "PROMOTION":            "career advancement",
    "RELATIONSHIP_START":   "new relationship",
    "RELATIONSHIP_END":     "relationship ending",
    "RELOCATION":           "relocation",
    "HEALTH_EVENT":         "health event",
    "EXAM_RESULT":          "exam result",
    "FINANCIAL_MILESTONE":  "financial milestone",
    "FAMILY_LOSS":          "family loss",
    "OTHER":                "life event",
}


def _t(ta: str, en: str) -> BiText:
    return BiText(ta=ta, en=en)


def _correlate(
    birth_jd: float,
    moon_lon: float,
    event_date: date,
    event_type: str,
    moon_rasi_name: str,
) -> EventCorrelation:
    """Compute which dasha/transit was active on the event date."""
    try:
        event_dt = datetime(event_date.year, event_date.month, event_date.day, 12, 0, tzinfo=UTC)
        event_jd = utc_datetime_to_julian_day(event_dt)
        timeline = calculate_vimshottari_timeline(birth_jd, moon_lon, event_jd)
        maha = timeline.current_mahadasha.lord
        antar = timeline.current_antardasha.lord
    except Exception:
        maha = "UNKNOWN"
        antar = "UNKNOWN"

    theme_ta = _EVENT_THEME_TA.get(event_type, "நிகழ்வு")
    theme_en = _EVENT_THEME_EN.get(event_type, "event")
    maha_disp = maha.capitalize()
    antar_disp = antar.capitalize()

    narrative = _t(
        f"இந்த நாளில் {maha_disp} மகாதசை — {antar_disp} அந்தர்தசை நடப்பில் இருந்தது. "
        f"பாரம்பரியமாக {maha_disp} தசை {theme_ta}உடன் தொடர்புடையது.",
        f"On this date, {maha_disp} mahadasha — {antar_disp} antardasha was active. "
        f"Traditionally, {maha_disp} dasha is associated with {theme_en}.",
    )

    return EventCorrelation(
        mahaLord=maha,
        antarLord=antar,
        moonRasi=moon_rasi_name,
        narrative=narrative,
    )


def _item_from_row(row: UserLifeEvent, correlation: EventCorrelation | None) -> LifeEventLogItem:
    return LifeEventLogItem(
        id=str(row.id),
        chartId=str(row.chart_id),
        eventType=row.event_type,
        eventDate=row.event_date,
        description=row.description,
        correlation=correlation,
    )


def _assert_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> tuple[Chart, BirthProfile]:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found")
    bp = session.get(BirthProfile, chart.birth_profile_id)
    if bp is None or bp.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return chart, bp


def log_life_event(
    session: Session,
    chart_id: UUID,
    payload: LifeEventLogCreate,
    owner_user_id: UUID,
) -> LifeEventLogCreateResponse:
    if payload.event_type.upper() not in VALID_EVENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid event_type. Valid: {sorted(VALID_EVENT_TYPES)}",
        )

    chart, bp = _assert_owner(session, chart_id, owner_user_id)

    row = UserLifeEvent(
        chart_id=chart_id,
        event_type=payload.event_type.upper(),
        event_date=payload.event_date,
        description=payload.description,
    )
    session.add(row)
    session.flush()  # get the id

    # Compute correlation
    try:
        from app.services.chart_service import load_persisted_chart_response
        snap = load_persisted_chart_response(session, chart_id)
        natal_moon = next(p for p in snap.data.planets if p.graha == "MOON")
        birth_jd = snap.data.julian_day
        moon_lon = natal_moon.absolute_longitude
        moon_rasi = str(chart.moon_rasi)
        corr = _correlate(birth_jd, moon_lon, payload.event_date, row.event_type, moon_rasi)
    except Exception as exc:
        logger.debug("Correlation failed: %s", exc)
        corr = None

    session.commit()
    session.refresh(row)

    return LifeEventLogCreateResponse(
        success=True,
        data=_item_from_row(row, corr),
    )


def get_life_event_log(
    session: Session,
    chart_id: UUID,
    owner_user_id: UUID,
) -> LifeEventLogResponse:
    _assert_owner(session, chart_id, owner_user_id)

    rows = session.execute(
        select(UserLifeEvent)
        .where(UserLifeEvent.chart_id == chart_id)
        .order_by(UserLifeEvent.event_date.desc())
    ).scalars().all()

    # Load chart once for correlations
    items: list[LifeEventLogItem] = []
    birth_jd: float | None = None
    moon_lon: float | None = None
    moon_rasi_name: str = ""
    try:
        from app.services.chart_service import load_persisted_chart_response
        chart = session.get(Chart, chart_id)
        snap = load_persisted_chart_response(session, chart_id)
        natal_moon = next(p for p in snap.data.planets if p.graha == "MOON")
        birth_jd = snap.data.julian_day
        moon_lon = natal_moon.absolute_longitude
        moon_rasi_name = str(chart.moon_rasi) if chart else ""
    except Exception:
        pass

    for row in rows:
        corr: EventCorrelation | None = None
        if birth_jd is not None and moon_lon is not None:
            try:
                corr = _correlate(birth_jd, moon_lon, row.event_date, row.event_type, moon_rasi_name)
            except Exception:
                pass
        items.append(_item_from_row(row, corr))

    return LifeEventLogResponse(success=True, data=items)

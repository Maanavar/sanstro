from __future__ import annotations

from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import angular_distance
from app.models import BirthProfile, Chart, RetrospectiveEntry
from app.schemas.dasha import ResponseMeta
from app.schemas.retrospective import (
    FutureRecurrence,
    PlanetarySnapshot,
    RetrospectiveBiText,
    RetrospectiveData,
    RetrospectiveListData,
    RetrospectiveListResponse,
    RetrospectiveResponse,
)
from app.services.chart_service import load_persisted_chart_response

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

_KEY_PLANETS = ("SATURN", "JUPITER", "RAHU", "KETU", "MARS", "MOON", "SUN", "VENUS")
_FUTURE_SCAN_PLANETS = ("SATURN", "JUPITER", "RAHU", "KETU", "MARS")
_EVENT_HOUSES = {
    "career": {10, 8, 12, 6},
    "family": {4, 2, 8, 12},
    "health": {1, 6, 8, 12},
    "relationship": {7, 2, 8, 12},
    "spiritual": {9, 12, 8, 5},
}


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _local_noon_jd(local_date: date, timezone_name: str) -> float:
    tz = resolve_timezone(timezone_name)
    local_noon = datetime.combine(local_date, time(12, 0), tzinfo=tz)
    return utc_datetime_to_julian_day(local_noon.astimezone(UTC))


def _month_add(d: date, months: int) -> date:
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, 28)
    return date(year, month, day)


def _approximate_date_text(d: date) -> str:
    if d.day <= 10:
        slot = "early"
    elif d.day <= 20:
        slot = "mid"
    else:
        slot = "late"
    return f"{slot} {d.strftime('%b %Y')}"


def _intensity_label(score: int, baseline: int) -> str:
    if score >= baseline + 2:
        return "stronger"
    if score >= baseline:
        return "similar"
    return "milder"


def _notable_aspect(planet: str, transit_degree: float, natal_planets: list[Any]) -> str | None:
    nearest_name: str | None = None
    nearest_sep = 360.0

    for natal in natal_planets:
        sep = angular_distance(transit_degree, natal.absolute_longitude)
        if sep < nearest_sep:
            nearest_sep = sep
            nearest_name = natal.graha

    if nearest_name is None:
        return None

    if nearest_sep <= 5.0:
        return f"{planet} conjunct natal {nearest_name}"
    if abs(nearest_sep - 180.0) <= 5.0:
        return f"{planet} opposite natal {nearest_name}"
    if abs(nearest_sep - 120.0) <= 4.0:
        return f"{planet} trine natal {nearest_name}"
    if abs(nearest_sep - 90.0) <= 4.0:
        return f"{planet} square natal {nearest_name}"
    return None


def _build_key_transits(
    event_type: str,
    natal_moon_rasi: int,
    natal_lagna_rasi: int,
    natal_planets: list[Any],
    transit_bodies: dict[str, Any],
) -> list[PlanetarySnapshot]:
    sensitive = _EVENT_HOUSES[event_type]
    ranked: list[tuple[int, PlanetarySnapshot]] = []

    for planet in _KEY_PLANETS:
        body = transit_bodies.get(planet)
        if body is None:
            continue
        h_moon = house_from_reference(natal_moon_rasi, body.rasi)
        h_lagna = house_from_reference(natal_lagna_rasi, body.rasi)
        emphasis = int(h_moon in sensitive) + int(h_lagna in sensitive)
        note = _notable_aspect(planet, body.absolute_longitude, natal_planets)
        if note is not None:
            emphasis += 1
        ranked.append(
            (
                emphasis,
                PlanetarySnapshot(
                    planet=planet,
                    houseFromMoon=h_moon,
                    houseFromLagna=h_lagna,
                    notableAspect=note,
                ),
            )
        )

    ranked.sort(key=lambda x: x[0], reverse=True)
    picked = [item for score, item in ranked if score > 0][:4]
    if picked:
        return picked
    return [item for _, item in ranked[:3]]


def _event_signature_score(
    event_type: str,
    natal_moon_rasi: int,
    natal_lagna_rasi: int,
    transit_bodies: dict[str, Any],
) -> int:
    sensitive = _EVENT_HOUSES[event_type]
    score = 0
    for planet in _FUTURE_SCAN_PLANETS:
        body = transit_bodies.get(planet)
        if body is None:
            continue
        hm = house_from_reference(natal_moon_rasi, body.rasi)
        hl = house_from_reference(natal_lagna_rasi, body.rasi)
        if hm in sensitive:
            score += 1
        if hl in sensitive:
            score += 1
    return score


def _correlation_explanation(
    event_type: str,
    event_description: str,
    dasha_text: str,
    key_transits: list[PlanetarySnapshot],
) -> RetrospectiveBiText:
    first = key_transits[0]
    ta = (
        f"'{event_description}' nigazhchi nerathil {dasha_text} seyalil irundhadhu. "
        f"{first.planet} {first.house_from_moon}am idathil (Moon reference) matrum "
        f"{first.house_from_lagna}am idathil (Lagna reference) irundha nilai, "
        f"{event_type} kuritha anubavangaludan traditionally associated endru paarppadhu."
    )
    en = (
        f"At the time of '{event_description}', {dasha_text} was active. "
        f"{first.planet} was in house {first.house_from_moon} from Moon and "
        f"house {first.house_from_lagna} from Lagna. In Tamil Jyothidam, "
        f"this pattern is traditionally associated with {event_type}-linked phases."
    )
    return RetrospectiveBiText(ta=ta, en=en)


def _future_recurrences(
    event_type: str,
    start_date: date,
    timezone_name: str,
    natal_moon_rasi: int,
    natal_lagna_rasi: int,
    baseline_score: int,
) -> list[FutureRecurrence]:
    scored: list[tuple[date, int]] = []
    for month_offset in range(1, 25):  # next 2 years, monthly — keeps HTTP response fast
        d = _month_add(start_date, month_offset)
        jd = _local_noon_jd(d, timezone_name)
        transits = calculate_sidereal_planets(jd)
        score = _event_signature_score(event_type, natal_moon_rasi, natal_lagna_rasi, transits.bodies)
        scored.append((d, score))

    candidates = [item for item in scored if item[1] >= 5][:3]
    if len(candidates) < 3:
        scored.sort(key=lambda x: x[1], reverse=True)
        used = {d for d, _ in candidates}
        for d, score in scored:
            if d in used:
                continue
            candidates.append((d, score))
            if len(candidates) == 3:
                break

    out: list[FutureRecurrence] = []
    for d, score in sorted(candidates, key=lambda x: x[0]):
        out.append(
            FutureRecurrence(
                approximateDate=_approximate_date_text(d),
                signatureDescription=(
                    f"Sensitive-house signature for {event_type} re-activates "
                    f"(score {score}/10 across Moon/Lagna references)."
                ),
                intensity=_intensity_label(score, baseline_score),
            )
        )
    return out


def _build_data_from_payload(
    retrospective_id: UUID,
    chart_id: UUID,
    event_date: date,
    event_description: str,
    event_type: str,
    payload: dict[str, Any],
    created_at: datetime,
) -> RetrospectiveData:
    return RetrospectiveData(
        retrospectiveId=retrospective_id,
        chartId=chart_id,
        eventDate=event_date,
        eventDescription=event_description,
        eventType=event_type,
        activeDasha=str(payload["active_dasha"]),
        keyTransits=[PlanetarySnapshot(**item) for item in payload["key_transits"]],
        correlationExplanation=RetrospectiveBiText(**payload["correlation_explanation"]),
        futureRecurrences=[FutureRecurrence(**item) for item in payload["future_recurrences"]],
        caution=RetrospectiveBiText(**payload["caution"]),
        createdAt=created_at,
    )


def analyse_and_save_retrospective(
    session: Session,
    owner_user_id: UUID,
    *,
    chart_id: UUID,
    event_date: date,
    event_description: str,
    event_type: str,
) -> RetrospectiveResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    timezone_name = chart_snapshot.data.birth_profile.birth_timezone
    # TODO: historical event location — not current location, separate future enhancement
    event_jd = _local_noon_jd(event_date, timezone_name)

    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    natal_lagna_rasi = chart_snapshot.data.lagna.rasi
    transit = calculate_sidereal_planets(event_jd)
    timeline = calculate_vimshottari_timeline(chart_snapshot.data.julian_day, natal_moon.absolute_longitude, event_jd)
    dasha_text = (
        f"{timeline.current_mahadasha.lord} Maha Dasha / "
        f"{timeline.current_antardasha.lord} Antar Dasha / "
        f"{timeline.current_pratyantardasha.lord} Pratyantar"
    )

    key_transits = _build_key_transits(
        event_type,
        natal_moon.rasi,
        natal_lagna_rasi,
        chart_snapshot.data.planets,
        transit.bodies,
    )
    baseline_score = _event_signature_score(event_type, natal_moon.rasi, natal_lagna_rasi, transit.bodies)
    future = _future_recurrences(
        event_type,
        event_date,
        timezone_name,
        natal_moon.rasi,
        natal_lagna_rasi,
        baseline_score,
    )
    correlation = _correlation_explanation(event_type, event_description, dasha_text, key_transits)
    caution = RetrospectiveBiText(
        ta="Idhu adhe nigazhchi thirumba nadakkum endru alla; idhe thanmai ullla kaalathai therivikkum oru signal-aaga paarungal.",
        en="This does not mean the same event repeats; it indicates a similar quality window for mindful planning.",
    )

    payload = {
        "active_dasha": dasha_text,
        "key_transits": [item.model_dump(mode="json", by_alias=True) for item in key_transits],
        "correlation_explanation": correlation.model_dump(mode="json"),
        "future_recurrences": [item.model_dump(mode="json", by_alias=True) for item in future],
        "caution": caution.model_dump(mode="json"),
    }

    entry = RetrospectiveEntry(
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        event_date=event_date,
        event_type=event_type,
        event_description=event_description,
        analysis_payload=payload,
    )
    session.add(entry)
    session.flush()

    return RetrospectiveResponse(
        data=_build_data_from_payload(
            entry.retrospective_id,
            chart_id,
            event_date,
            event_description,
            event_type,
            payload,
            entry.created_at,
        ),
        meta=_meta(),
    )


def list_retrospectives(session: Session, owner_user_id: UUID, chart_id: UUID) -> RetrospectiveListResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    rows = session.execute(
        select(RetrospectiveEntry)
        .where(
            RetrospectiveEntry.owner_user_id == owner_user_id,
            RetrospectiveEntry.chart_id == chart_id,
            RetrospectiveEntry.deleted_at.is_(None),
        )
        .order_by(RetrospectiveEntry.created_at.desc())
    ).scalars().all()

    items = [
        _build_data_from_payload(
            row.retrospective_id,
            row.chart_id,
            row.event_date,
            row.event_description,
            row.event_type,
            row.analysis_payload,
            row.created_at,
        )
        for row in rows
    ]
    return RetrospectiveListResponse(
        data=RetrospectiveListData(chartId=chart_id, items=items),
        meta=_meta(),
    )

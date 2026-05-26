from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BirthProfile, Chart, UserContext
from app.schemas.context import ContextData, ContextEvent, ContextReaction, ContextResponse
from app.schemas.dasha import ResponseMeta

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"


@dataclass(frozen=True)
class ProactiveContextResult:
    should_surface: bool
    ta: str | None = None
    en: str | None = None


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _to_event(item: dict[str, Any]) -> ContextEvent:
    return ContextEvent(
        type=str(item.get("type", "event")),
        date=date.fromisoformat(str(item["date"])) if not isinstance(item.get("date"), date) else item["date"],
        note=(str(item["note"]) if item.get("note") is not None else None),
    )


def _to_reaction(item: dict[str, Any]) -> ContextReaction:
    return ContextReaction(
        date=date.fromisoformat(str(item["date"])) if not isinstance(item.get("date"), date) else item["date"],
        guidanceScore=int(item.get("guidance_score", item.get("guidanceScore", 0))),
        userFelt=str(item.get("user_felt", item.get("userFelt", "neutral"))),
        note=(str(item["note"]) if item.get("note") is not None else None),
    )


def _to_response(context: UserContext) -> ContextResponse:
    events = [_to_event(item) for item in (context.active_events or [])]
    reactions = [_to_reaction(item) for item in (context.reaction_history or [])]
    return ContextResponse(
        data=ContextData(
            contextId=context.context_id,
            ownerUserId=context.owner_user_id,
            chartId=context.chart_id,
            lifeSituation=context.life_situation or {},
            activeEvents=events,
            reactionHistory=reactions,
            updatedAt=context.updated_at,
        ),
        meta=_meta(),
    )


def _event_key(item: dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(item.get("type", "")).strip().lower(),
        str(item.get("date", "")).strip(),
        str(item.get("note", "")).strip().lower(),
    )


def _merge_events(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for item in [*existing, *incoming]:
        key = _event_key(item)
        if key in seen:
            continue
        seen.add(key)
        merged.append(
            {
                "type": str(item.get("type", "event")),
                "date": str(item.get("date")),
                "note": (str(item["note"]) if item.get("note") is not None else None),
            }
        )
    return merged[-20:]


def _merge_reactions(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged = [*existing]
    for item in incoming:
        merged.append(
            {
                "date": str(item.get("date")),
                "guidance_score": int(item.get("guidance_score", item.get("guidanceScore", 0))),
                "user_felt": str(item.get("user_felt", item.get("userFelt", "neutral"))),
                "note": (str(item["note"]) if item.get("note") is not None else None),
            }
        )
    return merged[-60:]


def get_context_row(session: Session, owner_user_id: UUID, chart_id: UUID) -> UserContext | None:
    return session.execute(
        select(UserContext).where(
            UserContext.owner_user_id == owner_user_id,
            UserContext.chart_id == chart_id,
            UserContext.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def get_or_create_context(session: Session, owner_user_id: UUID, chart_id: UUID) -> UserContext:
    context = get_context_row(session, owner_user_id, chart_id)
    if context is not None:
        return context

    context = UserContext(
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        life_situation={},
        active_events=[],
        reaction_history=[],
    )
    session.add(context)
    session.flush()
    return context


def upsert_context(
    session: Session,
    owner_user_id: UUID,
    chart_id: UUID,
    *,
    life_situation: dict[str, Any] | None,
    active_events: list[dict[str, Any]] | None,
    reaction_history: list[dict[str, Any]] | None,
) -> ContextResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    context = get_or_create_context(session, owner_user_id, chart_id)

    if life_situation:
        next_life = dict(context.life_situation or {})
        next_life.update(life_situation)
        context.life_situation = next_life

    if active_events:
        context.active_events = _merge_events(context.active_events or [], active_events)

    if reaction_history:
        context.reaction_history = _merge_reactions(context.reaction_history or [], reaction_history)

    session.flush()
    return _to_response(context)


def get_context(session: Session, owner_user_id: UUID, chart_id: UUID) -> ContextResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    context = get_or_create_context(session, owner_user_id, chart_id)
    return _to_response(context)


def should_surface_proactively(
    context: UserContext | None,
    *,
    for_date: date,
    score_label: str,
    saturn_house_from_moon: int,
) -> ProactiveContextResult:
    if context is None:
        return ProactiveContextResult(should_surface=False)

    life = context.life_situation or {}
    active_events = context.active_events or []
    today_text = for_date.isoformat()

    job_status = str(life.get("job", "")).strip().lower()
    if job_status in {"stressed", "pressure", "overload"} and saturn_house_from_moon in {4, 8, 10}:
        return ProactiveContextResult(
            should_surface=True,
            ta="Neenga kuritha velai azhutham nilaiyai paarthaal, inru thittamitta siru adigal moolam nadavadikkai edukka vendum.",
            en="Given your stated job-pressure context, use structured small steps today instead of overloaded commitments.",
        )

    has_today_event = any(str(item.get("date")) == today_text for item in active_events)
    if has_today_event and score_label in {"CAUTION", "RESTORATIVE"}:
        return ProactiveContextResult(
            should_surface=True,
            ta="Inru ungal active event iruppathaal, mukkiya paniyai nalla nerathil thodangi matra panigalai ilaguvaga vaithukkolungal.",
            en="You have an active event today; start the most important task in a supportive window and keep the rest lightweight.",
        )

    return ProactiveContextResult(should_surface=False)


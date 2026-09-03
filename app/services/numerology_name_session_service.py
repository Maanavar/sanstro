"""Saved name sessions (NUM-58, Phase 5).

A user weighing a name change tries several spellings before deciding. This is
the shortlist: the spellings they kept, against one chart.

**The table stores the question, not the answer** — see
``app.models.numerology_name_session``. Everything a caller reads back is
recomputed here, at request time, from the current engine and the current flags.

Why the list endpoint does not return full corrections
-----------------------------------------------------
``correct_name`` runs a variant search. Doing that once per saved row would make
a twenty-row shortlist run twenty searches to render a page that shows each name
once. So a saved session reads back at *reading* altitude — the name's own
Chaldean numbers and how that number sits against this chart — and the full
correction stays where it already is, at
``POST /charts/{id}/numerology/name-correction``.

The chart context is loaded **once** for the whole list rather than per row. Two
saved names scored against two separately-loaded contexts is precisely how the
same chart ends up disagreeing with itself.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.numerology import NumberReading, NumerologyProfile, build_profile
from app.calculations.numerology_alignment import NumberAlignment, align_profile
from app.models import NumerologyNameSession
from app.services.numerology_service import (
    NumerologyChartContext,
    load_chart_context,
    require_numerology_enabled,
)

CALCULATION_VERSION = "numerology-name-session-v1"

#: Per chart, counting only live rows. A shortlist is a shortlist; past this the
#: feature has become a name generator with a save button, and the list endpoint
#: would be doing unbounded work per request.
MAX_SESSIONS_PER_CHART = 20


@dataclass(frozen=True, slots=True)
class SavedNameReading:
    """One saved spelling, recomputed against the chart as of right now."""

    session: NumerologyNameSession
    reading: NumberReading
    alignment: NumberAlignment
    calculation_version: str = CALCULATION_VERSION

    @property
    def recalculated_since_saved(self) -> bool:
        """Whether the engine has moved since the user saved this.

        Surfaced rather than hidden: a number that changed without explanation
        is worse than a number that changed with one.
        """
        return self.session.saved_calculation_version != self.calculation_version


def _live(chart_id: UUID):
    return (
        select(NumerologyNameSession)
        .where(
            NumerologyNameSession.chart_id == chart_id,
            NumerologyNameSession.deleted_at.is_(None),
        )
        .order_by(NumerologyNameSession.created_at.desc())
    )


def _read_name(name: str, ctx: NumerologyChartContext) -> tuple[NumerologyProfile, NumberReading]:
    """Score one candidate spelling against the chart's own date of birth.

    Raises ``ScriptMismatchError`` on non-Latin input (doctrine D3). The caller
    turns that into a 422 at the boundary the string arrived from.
    """
    profile = build_profile(
        year=ctx.birth_date.year,
        month=ctx.birth_date.month,
        day=ctx.birth_date.day,
        document_name=name,
    )
    if profile.name is None:  # pragma: no cover - build_profile refuses empty names first
        raise ValueError("name produced no scoreable letters")
    return profile, profile.name


def save_name_session(
    session: Session,
    *,
    owner_user_id: UUID,
    chart_id: UUID,
    name: str,
    label: str | None = None,
    max_edits: int = 2,
) -> NumerologyNameSession:
    """Save a spelling to this chart's shortlist, or update it if already saved.

    Saving the same spelling twice is not two sessions, so an existing live row
    for the same ``candidate_name`` is updated in place. That keeps the cap
    meaningful — otherwise a client with a retry loop fills the shortlist with
    one name.

    The name is scored *before* it is stored. A row holding a spelling the engine
    would refuse on read is a row that can only ever produce an error, and the
    422 belongs at the moment the user typed it, not days later when they open
    their shortlist.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    _read_name(name, ctx)

    existing = session.scalars(
        _live(chart_id).where(NumerologyNameSession.candidate_name == name)
    ).first()
    if existing is not None:
        existing.label = label
        existing.max_edits = max_edits
        existing.saved_calculation_version = CALCULATION_VERSION
        session.flush()
        return existing

    live_count = len(list(session.scalars(_live(chart_id))))
    if live_count >= MAX_SESSIONS_PER_CHART:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A chart may hold at most {MAX_SESSIONS_PER_CHART} saved names.",
        )

    row = NumerologyNameSession(
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        candidate_name=name,
        label=label,
        max_edits=max_edits,
        saved_calculation_version=CALCULATION_VERSION,
    )
    session.add(row)
    session.flush()
    return row


def list_name_sessions(session: Session, chart_id: UUID) -> list[SavedNameReading]:
    """The shortlist, recomputed. One chart load, N cheap readings."""
    require_numerology_enabled()
    rows = list(session.scalars(_live(chart_id)))
    if not rows:
        # Nothing to score, so do not pay for a chart snapshot to prove it.
        return []

    ctx = load_chart_context(session, chart_id)
    out: list[SavedNameReading] = []
    for row in rows:
        profile, reading = _read_name(row.candidate_name, ctx)
        alignment = align_profile(
            profile,
            ctx.lagna_rasi,
            strengths=ctx.strengths,
            node_rasi_map=ctx.node_rasi_map,
        )
        if alignment.name is None:  # pragma: no cover - a scored name always aligns
            continue
        out.append(SavedNameReading(session=row, reading=reading, alignment=alignment.name))
    return out


def delete_name_session(session: Session, *, chart_id: UUID, name_session_id: UUID) -> bool:
    """Soft-delete one saved spelling. False when there was nothing live to delete.

    Soft rather than hard because ``deleted_at`` is already on every table
    through ``TimestampMixin``, and because a name someone was considering
    changing to is exactly the kind of thing they may want back.
    """
    require_numerology_enabled()
    row = session.scalars(
        _live(chart_id).where(
            NumerologyNameSession.numerology_name_session_id == name_session_id
        )
    ).first()
    if row is None:
        return False
    row.deleted_at = datetime.now(UTC)
    session.flush()
    return True

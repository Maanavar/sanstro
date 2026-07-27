"""Fortune Alignment orchestration (NUM-30..33, Phase 3).

Thin by design. All the doctrine lives in the pure module
``app.calculations.numerology_alignment`` — the three guards (a number never
overrides a graha, "no change needed" must be reachable, no fear framing) are
enforced there, where they are unit-testable without a database. This module
only fetches the chart and hands it over.

The one thing it adds is the pairing of the *numbers* with their *alignments*.
``align_profile`` scores root digits, which is what a chart can be asked about;
but the compound outranks the root for display (43 and 34 both reduce to 7 and
read differently), so a surface needs both. Returning them together stops a
caller reconstructing the profile separately and scoring a different name than
the one that was aligned.
"""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.numerology import NumerologyProfile, build_profile
from app.calculations.numerology_alignment import (
    FortuneAlignment,
    NumberAlignment,
    align_profile,
    ranked_alignments_for,
)
from app.services.numerology_service import load_chart_context, require_numerology_enabled

CALCULATION_VERSION = "numerology-alignment-v1"


@dataclass(frozen=True, slots=True)
class ChartAlignment:
    """A Fortune Alignment together with the readings it was computed from."""

    profile: NumerologyProfile
    alignment: FortuneAlignment
    lagna_rasi: int
    calculation_version: str = CALCULATION_VERSION


@dataclass(frozen=True, slots=True)
class RankedNumbers:
    """The chart's own ranking of 1-9, best first (NUM-33)."""

    lagna_rasi: int
    alignments: tuple[NumberAlignment, ...]
    calculation_version: str = CALCULATION_VERSION

    @property
    def numbers(self) -> tuple[int, ...]:
        return tuple(a.number for a in self.alignments)


def alignment_for_chart(
    chart_id: UUID,
    session: Session,
    *,
    document_name: str | None = None,
    called_name: str | None = None,
) -> ChartAlignment:
    """Score this native's numbers against their own jadhagam (NUM-30..32).

    The date of birth comes from the chart, never from the caller — the whole
    point of the authenticated path is that the two cannot disagree. Names are
    caller-supplied because they are not chart data; ``build_profile`` raises
    ``ScriptMismatchError`` on non-Latin input (doctrine D3) and the route turns
    that into a 422 at the boundary where the string came from.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    profile = build_profile(
        year=ctx.birth_date.year,
        month=ctx.birth_date.month,
        day=ctx.birth_date.day,
        document_name=document_name,
        called_name=called_name,
    )
    return ChartAlignment(
        profile=profile,
        alignment=align_profile(
            profile,
            ctx.lagna_rasi,
            strengths=ctx.strengths,
            node_rasi_map=ctx.node_rasi_map,
        ),
        lagna_rasi=ctx.lagna_rasi,
    )


def ranked_numbers_for_chart(chart_id: UUID, session: Session) -> RankedNumbers:
    """Personalised favourable numbers, chart-first (NUM-33).

    Needs no name and no input beyond the chart, which is what makes it the one
    numerology reading that can sit on a dashboard unprompted.
    """
    require_numerology_enabled()
    ctx = load_chart_context(session, chart_id)
    return RankedNumbers(
        lagna_rasi=ctx.lagna_rasi,
        alignments=ranked_alignments_for(
            ctx.lagna_rasi, strengths=ctx.strengths, node_rasi_map=ctx.node_rasi_map
        ),
    )

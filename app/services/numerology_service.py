"""Shared numerology plumbing: the rollout gate and the chart context.

Everything numerology-related that more than one phase needs lives here, so
there is exactly one of each. Two things in particular:

**One flag gate.** ``numerology_engine`` was being read in three places
(``public_tools``, the timing service, and — once Phase 3/4 got routes — the
authenticated router). Three copies of a gate is three chances for one of them
to drift open. Every surface now calls ``require_numerology_enabled``.

**One chart context.** Phase 3 (Fortune Alignment) and Phase 4 (time
numerology) need the *same* four things off a persisted chart: the lagna rasi,
per-graha natal strengths, where the nodes sit, and the native's birth date.
Loading that twice, slightly differently, is how two surfaces end up scoring the
same chart differently.

This module deliberately does **not** check ownership. Authorisation is a route
concern in this codebase (``_assert_chart_owner`` lives in the API modules), and
a service that silently 403s would be surprising to the batch/report callers
that legitimately have no request user.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import BirthProfile, Chart
from app.schemas.charts import ChartCalculateResponse
from app.services.chart_service import load_persisted_chart_response
from app.services.feature_flags import get_flag
from app.services.location_service import resolve_effective_daily_location
from app.services.numerology_content import corpus_is_renderable


def numerology_enabled() -> bool:
    """Master rollout gate (plan §5.3)."""
    return bool(get_flag("numerology_engine"))


def require_numerology_enabled() -> None:
    """404 while the master flag is off.

    404 rather than 403: a feature that has not launched should not advertise
    its own existence. Checked *before* chart lookup on every route, so a flag-
    off deployment cannot be used to probe which chart ids exist.
    """
    if not numerology_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


def readings_available() -> bool:
    """Whether interpretive prose may be sent to a client.

    False today. The root 1-9 corpus, the compound 10-52 corpus and the Phase
    3/4 explanation strings (``reason_ta``, ``note_ta``, the name-change
    recommendation) were all drafted by the same hand and none has had a Tamil
    native pass. Numbers, graha names and scores are arithmetic and ship now;
    the sentences wait.

    Kept as a function rather than a constant so responses reflect the current
    value at request time and a flip is a one-line change in
    ``numerology_content.CONTENT_REVIEWED``.
    """
    return corpus_is_renderable()


@dataclass(frozen=True, slots=True)
class NumerologyChartContext:
    """Everything the numerology layers need from a persisted chart."""

    lagna_rasi: int
    strengths: dict[str, float]
    node_rasi_map: dict[str, int]
    birth_date: date
    timezone_name: str
    latitude: float
    longitude: float


def load_chart_context(
    session: Session, chart_id: UUID, *, snapshot: ChartCalculateResponse | None = None
) -> NumerologyChartContext:
    """Read the chart snapshot into the shape the numerology layers consume.

    ``snapshot`` lets a caller that already holds the persisted chart response
    hand it over instead of paying for a second load. NUM-34 compares two
    charts and needs each snapshot for the porutham as well as for the numbers;
    without this it would load four snapshots to read two charts. Callers that
    do not have one keep the original signature and behaviour.
    """
    chart_row = session.get(Chart, chart_id)
    if chart_row is None:
        raise HTTPException(status_code=404, detail="Chart not found")
    profile = session.get(BirthProfile, chart_row.birth_profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Birth profile not found")

    if snapshot is None:
        snapshot = load_persisted_chart_response(session, chart_id)
    location = resolve_effective_daily_location(profile)
    return NumerologyChartContext(
        lagna_rasi=snapshot.data.lagna.rasi,
        strengths={p.graha: float(p.strength_score) for p in snapshot.data.planets},
        # Nodes carry no rasi lordship; functional_nature resolves them via their
        # dispositor, which needs to know where they sit.
        node_rasi_map={
            p.graha: p.rasi for p in snapshot.data.planets if p.graha in ("RAHU", "KETU")
        },
        birth_date=profile.birth_date_local,
        timezone_name=location.timezone,
        latitude=location.latitude,
        longitude=location.longitude,
    )

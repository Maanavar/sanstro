"""DB-backed daily score cache for the daily guidance engine."""
from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models import DailyScore
from app.schemas.daily_guidance import DailyGuidanceData, DailyGuidanceResponse
from app.schemas.dasha import ResponseMeta

# Bump when the daily-score engine logic changes (scoring weights, dasha/porutham
# corrections, transit rules, …) so previously cached rows self-invalidate instead
# of being served stale. Combined with the chart calculation_version on load.
# v7 (2026-07-23): audit conflict fixes — unified neecha-bhanga detector (C2),
# node functional nature in life-area scoring (C4), dual-path strength synthesis
# parity (C1). See docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md.
# v8 (2026-07-24): additive `remedyFocus` (structured Today-card remedy). Bumped
# so warm rows recompute and surface the new field immediately rather than
# serving null until the cache naturally ages out.
# v9 (2026-08-14): best windows are now the intersection of the hora grid, the
# Gowri kala grid and the three kalams, trimmed to where all three agree, plus
# the new `bestWindowConflicts`. Window START/END VALUES CHANGE (a 62-minute hora
# clipped by a 93-minute kala is shorter), and on a day whose supportive horas
# all land in bad kalas `best_windows` can now hold only Abhijit — which lowers
# `remedialActionSupport` and therefore the score. Warm rows must recompute.
# v10 (2026-08-27): astrologer rulings from the function & calculation review.
# Three of them move this score. (1) `_age_dasha_modifier` now cuts its youth
# thresholds at the classical graha maturity ages instead of round numbers, and
# the Sun, Rahu and Ketu are no longer flat — the dasha component (weight 0.19)
# changes for every native under 48 running a node dasha. (2) Three naisargika
# node grades became symmetric, and one of them is Rahu/Saturn, which the same
# component reads through `_graha_relationship_score`. (3) Moon-in-Taurus and
# Mercury-in-Virgo dignity is now degree-bounded, which moves the natal graha
# scores the dasha component is built on. Warm rows must recompute.
DAILY_SCORE_ENGINE_VERSION = "2026-08-27-v10"


def _cache_version(calculation_version: str) -> str:
    return f"{calculation_version}::{DAILY_SCORE_ENGINE_VERSION}"


def _load_daily_score_cache(
    session: Session,
    *,
    birth_profile_id: UUID,
    score_date: date,
    calculation_version: str,
) -> DailyGuidanceResponse | None:
    row = session.execute(
        select(DailyScore).where(
            DailyScore.birth_profile_id == birth_profile_id,
            DailyScore.score_date == score_date,
        )
        .order_by(DailyScore.created_at.desc())
        .limit(1)
    ).scalars().first()
    if row is None:
        return None
    stored = dict(row.data)
    # Stale row from an older engine/chart version → force recompute.
    if stored.pop("_cacheVersion", None) != _cache_version(calculation_version):
        return None
    return DailyGuidanceResponse(
        data=DailyGuidanceData.model_validate(stored),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _load_daily_score_cache_range(
    session: Session,
    *,
    birth_profile_id: UUID,
    start_date: date,
    end_date: date,
    calculation_version: str,
) -> dict[date, DailyGuidanceResponse]:
    """Bulk-fetch DailyScore cache rows for a date range in a single query.

    Mirrors ``calculate_daily_panchangam_range``'s batching of ``PanchangamCache``
    lookups: callers that need several consecutive days (month view, week-ahead
    digest) should use this instead of looping ``_load_daily_score_cache`` —
    that loop issued one SELECT per day.
    """
    rows = session.execute(
        select(DailyScore)
        .where(
            DailyScore.birth_profile_id == birth_profile_id,
            DailyScore.score_date >= start_date,
            DailyScore.score_date <= end_date,
        )
        .order_by(DailyScore.score_date, DailyScore.created_at.desc())
    ).scalars()

    expected_version = _cache_version(calculation_version)
    cached: dict[date, DailyGuidanceResponse] = {}
    for row in rows:
        if row.score_date in cached:
            continue  # keep the most recent row per date (ordered by created_at desc)
        stored = dict(row.data)
        if stored.pop("_cacheVersion", None) != expected_version:
            continue
        cached[row.score_date] = DailyGuidanceResponse(
            data=DailyGuidanceData.model_validate(stored),
            meta=ResponseMeta(
                calculation_version=calculation_version,
                generated_at=datetime.now(tz=UTC),
            ),
        )
    return cached


def _store_daily_score_cache(
    session: Session,
    *,
    birth_profile_id: UUID,
    score_date: date,
    response: DailyGuidanceResponse,
    calculation_version: str,
) -> None:
    payload = response.data.model_dump(mode="json", by_alias=True)
    payload["_cacheVersion"] = _cache_version(calculation_version)
    session.execute(
        pg_insert(DailyScore)
        .values(
            score_id=uuid4(),
            birth_profile_id=birth_profile_id,
            score_date=score_date,
            score=response.data.score,
            label=response.data.label,
            data=payload,
        )
        .on_conflict_do_update(
            constraint="uq_daily_scores_profile_date",
            set_={
                "score": response.data.score,
                "label": response.data.label,
                "data": payload,
                "created_at": datetime.now(tz=UTC),
            },
        )
    )

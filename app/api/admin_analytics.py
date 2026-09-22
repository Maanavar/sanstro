"""Admin analytics endpoints - aggregate queries, no new models required."""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.db.session import get_db
from app.models import BirthProfile, Chart, FamilyVault
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.life_focus_event import LifeFocusEvent
from app.models.user import User
from app.models.user_preference import UserPreference

router = APIRouter(prefix="/admin/analytics", tags=["admin"])


class DailyCount(BaseModel):
    date: str
    count: int


class DailyMetrics(BaseModel):
    new_users: list[DailyCount]
    active_users: list[DailyCount]
    days: int


class FeatureUsage(BaseModel):
    charts_total: int
    family_vaults_total: int
    ask_vinaadi_total: int
    ask_vinaadi_today: int
    birth_profiles_total: int
    as_of: str


class RetentionCohort(BaseModel):
    cohort_week: str
    cohort_size: int
    retained_d7: int
    retained_d30: int


class RetentionReport(BaseModel):
    cohorts: list[RetentionCohort]


class LifeFocusMetrics(BaseModel):
    period: str
    total_users: int
    non_balanced_users: int
    non_balanced_share: float
    mode_counts: dict[str, int]
    first_run_decisions: int
    first_run_skips: int
    first_run_skip_rate: float | None
    focus_change_count: int
    focus_active_users: int
    focus_changes_per_active_user: float | None


def _month_bounds(month: str | None) -> tuple[datetime, datetime]:
    if month is None:
        now = datetime.now(UTC)
        start = datetime(now.year, now.month, 1, tzinfo=UTC)
    else:
        try:
            parsed = datetime.strptime(month, "%Y-%m")
            if parsed.strftime("%Y-%m") != month:
                raise ValueError
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="month must be YYYY-MM",
            ) from exc
        start = parsed.replace(tzinfo=UTC)
    if start.month == 12:
        end = datetime(start.year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(start.year, start.month + 1, 1, tzinfo=UTC)
    return start, end


def _series_from_rows(rows: list[tuple[date, int]], *, days: int) -> list[DailyCount]:
    today = datetime.now(UTC).date()
    start = today - timedelta(days=days - 1)
    counts = {row_date: count for row_date, count in rows}
    return [
        DailyCount(date=day.isoformat(), count=int(counts.get(day, 0)))
        for day in (start + timedelta(days=offset) for offset in range(days))
    ]


@router.get("/daily", response_model=DailyMetrics, summary="New signups and active users per day (last N days)")
def get_daily_metrics(
    days: int = 30,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> DailyMetrics:
    days = max(1, min(days, 90))
    since = datetime.now(UTC) - timedelta(days=days)

    new_users_rows = [
        (row.d, row.n)
        for row in session.execute(
            select(
                func.date(User.created_at).label("d"),
                func.count(User.user_id).label("n"),
            )
            .where(User.created_at >= since)
            .group_by(func.date(User.created_at))
            .order_by(func.date(User.created_at))
        ).all()
    ]
    active_rows = [
        (row.d, row.n)
        for row in session.execute(
            select(
                func.date(Chart.created_at).label("d"),
                func.count(func.distinct(BirthProfile.owner_user_id)).label("n"),
            )
            .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
            .where(Chart.created_at >= since)
            .group_by(func.date(Chart.created_at))
            .order_by(func.date(Chart.created_at))
        ).all()
    ]

    return DailyMetrics(
        new_users=_series_from_rows(new_users_rows, days=days),
        active_users=_series_from_rows(active_rows, days=days),
        days=days,
    )


@router.get("/features", response_model=FeatureUsage, summary="Overall feature usage counts")
def get_feature_usage(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> FeatureUsage:
    def count(model: object) -> int:
        return int(session.execute(select(func.count()).select_from(model)).scalar_one())

    ask_today = int(
        session.execute(
            select(func.coalesce(func.sum(AskVinaadiUsage.chip_count), 0)).where(
                AskVinaadiUsage.usage_date == date.today()
            )
        ).scalar_one()
    )
    ask_total = int(session.execute(select(func.coalesce(func.sum(AskVinaadiUsage.chip_count), 0))).scalar_one())

    return FeatureUsage(
        charts_total=count(Chart),
        family_vaults_total=count(FamilyVault),
        ask_vinaadi_total=ask_total,
        ask_vinaadi_today=ask_today,
        birth_profiles_total=count(BirthProfile),
        as_of=datetime.now(UTC).isoformat(),
    )


@router.get(
    "/life-focus",
    response_model=LifeFocusMetrics,
    summary="Life Focus adoption, first-run Skip, and monthly change rate",
)
def get_life_focus_metrics(
    month: str | None = None,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> LifeFocusMetrics:
    """Read the server-authoritative Phase 4 measures.

    ``focus_active_users`` means distinct users who interacted with the focus
    PATCH during the requested month. That is the denominator the plan says a
    PATCH-only store can support; broader product MAU remains a PostHog metric.
    """

    start, end = _month_bounds(month)
    total_users = int(session.execute(select(func.count()).select_from(User)).scalar_one())
    saved_rows = session.execute(
        select(UserPreference.life_mode, func.count(UserPreference.preference_id)).group_by(
            UserPreference.life_mode
        )
    ).all()
    saved_counts = {str(mode): int(count) for mode, count in saved_rows}
    non_balanced_users = sum(
        count for mode, count in saved_counts.items() if mode != "BALANCED"
    )
    mode_counts = dict(sorted(saved_counts.items()))
    # A user without a preference receives BALANCED, so the denominator is all
    # users rather than only readers who have opened the picker.
    mode_counts["BALANCED"] = total_users - non_balanced_users

    in_period = (
        LifeFocusEvent.created_at >= start,
        LifeFocusEvent.created_at < end,
    )
    first_run_decisions = int(
        session.execute(
            select(func.count())
            .select_from(LifeFocusEvent)
            .where(*in_period, LifeFocusEvent.is_first_run.is_(True))
        ).scalar_one()
    )
    first_run_skips = int(
        session.execute(
            select(func.count())
            .select_from(LifeFocusEvent)
            .where(
                *in_period,
                LifeFocusEvent.is_first_run.is_(True),
                LifeFocusEvent.intent == "SKIP",
            )
        ).scalar_one()
    )
    focus_active_users = int(
        session.execute(
            select(func.count(func.distinct(LifeFocusEvent.user_id))).where(*in_period)
        ).scalar_one()
    )
    focus_change_count = int(
        session.execute(
            select(func.count())
            .select_from(LifeFocusEvent)
            .where(
                *in_period,
                LifeFocusEvent.is_first_run.is_(False),
                LifeFocusEvent.intent == "SELECT",
                LifeFocusEvent.previous_mode != LifeFocusEvent.new_mode,
            )
        ).scalar_one()
    )

    return LifeFocusMetrics(
        period=start.strftime("%Y-%m"),
        total_users=total_users,
        non_balanced_users=non_balanced_users,
        non_balanced_share=round(non_balanced_users / total_users, 4) if total_users else 0.0,
        mode_counts=mode_counts,
        first_run_decisions=first_run_decisions,
        first_run_skips=first_run_skips,
        first_run_skip_rate=(
            round(first_run_skips / first_run_decisions, 4) if first_run_decisions else None
        ),
        focus_change_count=focus_change_count,
        focus_active_users=focus_active_users,
        focus_changes_per_active_user=(
            round(focus_change_count / focus_active_users, 4) if focus_active_users else None
        ),
    )


@router.get("/retention", response_model=RetentionReport, summary="Weekly cohort retention (D7, D30)")
def get_retention(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> RetentionReport:
    now = datetime.now(UTC)
    cutoff_d7 = now - timedelta(days=7)

    rows = session.execute(
        select(
            func.date_trunc("week", User.created_at).label("cohort_week"),
            func.count(User.user_id).label("cohort_size"),
        )
        .where(User.created_at <= cutoff_d7)
        .group_by(func.date_trunc("week", User.created_at))
        .order_by(func.date_trunc("week", User.created_at).desc())
        .limit(12)
    ).all()

    cohorts: list[RetentionCohort] = []
    for row in rows:
        week_start: datetime = row.cohort_week
        week_end = week_start + timedelta(days=7)

        cohort_user_ids = session.execute(
            select(User.user_id).where(
                User.created_at >= week_start,
                User.created_at < week_end,
            )
        ).scalars().all()
        if not cohort_user_ids:
            continue

        def active_count(after: datetime, cohort_user_ids: list = cohort_user_ids) -> int:
            return int(
                session.execute(
                    select(func.count(func.distinct(BirthProfile.owner_user_id)))
                    .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                    .where(
                        BirthProfile.owner_user_id.in_(cohort_user_ids),
                        Chart.created_at >= after,
                    )
                ).scalar_one()
            )

        d7_cutoff = week_start + timedelta(days=7)
        d30_cutoff = week_start + timedelta(days=30)
        cohorts.append(
            RetentionCohort(
                cohort_week=week_start.date().isoformat(),
                cohort_size=int(row.cohort_size),
                retained_d7=active_count(d7_cutoff) if d7_cutoff <= now else 0,
                retained_d30=active_count(d30_cutoff) if d30_cutoff <= now else 0,
            )
        )

    return RetentionReport(cohorts=cohorts)

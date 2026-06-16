"""Admin analytics endpoints - aggregate queries, no new models required."""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.db.session import get_db
from app.models import BirthProfile, Chart, FamilyVault
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.user import User

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

        def active_count(after: datetime) -> int:
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

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import UserPreference
from app.schemas.dasha import ResponseMeta
from app.schemas.settings import JournalSettingsData, JournalSettingsResponse

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"
_DEFAULT_RETENTION_DAYS = 365


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _next_recommended_review_date(row: UserPreference) -> date:
    base = row.last_retention_reviewed_at or row.updated_at
    return (base.date() + timedelta(days=30))


def get_or_create_user_preference(session: Session, owner_user_id: UUID) -> UserPreference:
    row = session.execute(
        select(UserPreference).where(
            UserPreference.owner_user_id == owner_user_id,
            UserPreference.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if row is not None:
        return row

    row = UserPreference(owner_user_id=owner_user_id, journal_retention_days=_DEFAULT_RETENTION_DAYS)
    session.add(row)
    session.flush()
    return row


def get_journal_settings(session: Session, owner_user_id: UUID) -> JournalSettingsResponse:
    row = get_or_create_user_preference(session, owner_user_id)
    return JournalSettingsResponse(
        data=JournalSettingsData(
            journalRetentionDays=row.journal_retention_days,
            lastUpdatedAt=row.updated_at,
            lastRetentionReviewedAt=row.last_retention_reviewed_at,
            nextRecommendedReviewDate=_next_recommended_review_date(row),
        ),
        meta=_meta(),
    )


def update_journal_settings(
    session: Session,
    owner_user_id: UUID,
    *,
    journal_retention_days: int,
    acknowledge_reminder: bool = False,
) -> JournalSettingsResponse:
    row = get_or_create_user_preference(session, owner_user_id)
    row.journal_retention_days = journal_retention_days
    if acknowledge_reminder:
        row.last_retention_reviewed_at = datetime.now(tz=UTC)
    session.flush()
    return JournalSettingsResponse(
        data=JournalSettingsData(
            journalRetentionDays=row.journal_retention_days,
            lastUpdatedAt=row.updated_at,
            lastRetentionReviewedAt=row.last_retention_reviewed_at,
            nextRecommendedReviewDate=_next_recommended_review_date(row),
        ),
        meta=_meta(),
    )

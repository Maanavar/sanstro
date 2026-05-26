from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class JournalSettingsData(BaseModel):
    journal_retention_days: int = Field(alias="journalRetentionDays", ge=7, le=3650)
    last_updated_at: datetime = Field(alias="lastUpdatedAt")
    last_retention_reviewed_at: datetime | None = Field(default=None, alias="lastRetentionReviewedAt")
    next_recommended_review_date: date = Field(alias="nextRecommendedReviewDate")

    model_config = ConfigDict(populate_by_name=True)


class JournalSettingsResponse(BaseModel):
    success: bool = True
    data: JournalSettingsData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalSettingsUpdateRequest(BaseModel):
    journal_retention_days: int = Field(alias="journalRetentionDays", ge=7, le=3650)
    acknowledge_reminder: bool = Field(default=False, alias="acknowledgeReminder")

    model_config = ConfigDict(populate_by_name=True)

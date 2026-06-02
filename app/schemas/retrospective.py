from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.dasha import ResponseMeta

VALID_RETROSPECTIVE_EVENT_TYPES = {
    "career", "family", "health", "relationship", "spiritual",
    "finance", "travel", "other",
}


class RetrospectiveRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    event_date: date = Field(alias="eventDate")
    event_description: str = Field(alias="eventDescription", min_length=3, max_length=500)
    event_type: str = Field(alias="eventType")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        if v not in VALID_RETROSPECTIVE_EVENT_TYPES:
            raise ValueError(f"event_type must be one of: {sorted(VALID_RETROSPECTIVE_EVENT_TYPES)}")
        return v


class RetrospectiveBiText(BaseModel):
    ta: str
    en: str


class PlanetarySnapshot(BaseModel):
    planet: str
    house_from_moon: int = Field(alias="houseFromMoon")
    house_from_lagna: int = Field(alias="houseFromLagna")
    notable_aspect: str | None = Field(default=None, alias="notableAspect")

    model_config = ConfigDict(populate_by_name=True)


class FutureRecurrence(BaseModel):
    approximate_date: str = Field(alias="approximateDate")
    signature_description: str = Field(alias="signatureDescription")
    intensity: str

    model_config = ConfigDict(populate_by_name=True)


class RetrospectiveData(BaseModel):
    retrospective_id: UUID = Field(alias="retrospectiveId")
    chart_id: UUID = Field(alias="chartId")
    event_date: date = Field(alias="eventDate")
    event_description: str = Field(alias="eventDescription")
    event_type: str = Field(alias="eventType")
    active_dasha: str = Field(alias="activeDasha")
    key_transits: list[PlanetarySnapshot] = Field(alias="keyTransits")
    correlation_explanation: RetrospectiveBiText = Field(alias="correlationExplanation")
    future_recurrences: list[FutureRecurrence] = Field(alias="futureRecurrences")
    caution: RetrospectiveBiText
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class RetrospectiveResponse(BaseModel):
    success: bool = True
    data: RetrospectiveData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class RetrospectiveListData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    items: list[RetrospectiveData]

    model_config = ConfigDict(populate_by_name=True)


class RetrospectiveListResponse(BaseModel):
    success: bool = True
    data: RetrospectiveListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


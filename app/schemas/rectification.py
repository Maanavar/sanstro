from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RectificationEvent(BaseModel):
    event_type: Literal["MARRIAGE", "CAREER_BREAK", "RELOCATION", "HEALTH_MAJOR", "PARENT_BIRTH"] = Field(alias="eventType")
    event_year: int = Field(alias="eventYear", ge=1900, le=2100)
    event_month: int | None = Field(default=None, alias="eventMonth", ge=1, le=12)

    model_config = ConfigDict(populate_by_name=True)


class RectificationRequest(BaseModel):
    events: list[RectificationEvent]

    model_config = ConfigDict(populate_by_name=True)


class CandidateWindow(BaseModel):
    time_local: str = Field(alias="timeLocal")
    lagna_rasi: int = Field(alias="lagnaRasi")
    lagna_rasi_name: str = Field(alias="lagnaRasiName")
    probability_weight: float = Field(alias="probabilityWeight")
    matching_events: int = Field(alias="matchingEvents")

    model_config = ConfigDict(populate_by_name=True)


class RectificationResultData(BaseModel):
    birth_profile_id: UUID = Field(alias="birthProfileId")
    candidates: list[CandidateWindow]
    # None while the recommendation is withdrawn (FAA-02 step 1).
    recommended_time: str | None = Field(alias="recommendedTime")
    recommendation_withdrawn: bool = Field(default=False, alias="recommendationWithdrawn")
    confidence_note: str = Field(alias="confidenceNote")
    confidence_note_ta: str | None = Field(default=None, alias="confidenceNoteTa")
    disclaimer: str

    model_config = ConfigDict(populate_by_name=True)


class RectificationResponse(BaseModel):
    success: bool = True
    data: RectificationResultData

    model_config = ConfigDict(populate_by_name=True)


class RectificationApplyRequest(BaseModel):
    selected_time: str = Field(alias="selectedTime")

    model_config = ConfigDict(populate_by_name=True)


class RectificationApplyResponse(BaseModel):
    birth_profile_id: UUID = Field(alias="birthProfileId")
    applied_offset_minutes: int = Field(alias="appliedOffsetMinutes")
    new_birth_time_local: str = Field(alias="newBirthTimeLocal")

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class DailyGuidanceWindow(BaseModel):
    type: str
    start: str
    end: str


class DailyGuidanceText(BaseModel):
    ta: str
    en: str


class DailyGuidanceSuggestion(BaseModel):
    ta: str
    en: str


class DailyGuidanceScoreBreakdown(BaseModel):
    moon_transit: int = Field(alias="moonTransit")
    dasha_support: int = Field(alias="dashaSupport")
    panchangam: int
    gochar_support: int = Field(alias="gocharSupport")
    personal_cautions: int = Field(alias="personalCautions")
    remedial_action_support: int = Field(alias="remedialActionSupport")

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")
    score: int
    label: str
    score_breakdown: DailyGuidanceScoreBreakdown = Field(alias="scoreBreakdown")
    best_windows: list[DailyGuidanceWindow] = Field(alias="bestWindows")
    caution_windows: list[DailyGuidanceWindow] = Field(alias="cautionWindows")
    text: DailyGuidanceText
    action_suggestion: DailyGuidanceSuggestion = Field(alias="actionSuggestion")
    caution_suggestion: DailyGuidanceSuggestion = Field(alias="cautionSuggestion")

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceResponse(BaseModel):
    success: bool = True
    data: DailyGuidanceData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceRangeData(BaseModel):
    profile_id: UUID = Field(alias="profileId")
    chart_id: UUID = Field(alias="chartId")
    from_date: date = Field(alias="fromDate")
    to_date: date = Field(alias="toDate")
    items: list[DailyGuidanceData]

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceRangeResponse(BaseModel):
    success: bool = True
    data: DailyGuidanceRangeData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

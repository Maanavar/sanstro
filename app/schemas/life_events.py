from __future__ import annotations

from datetime import date
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class BiText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class LifeEventWindow(BaseModel):
    event_type: Literal["CAREER", "MARRIAGE", "STUDIES", "RELOCATION", "HEALTH_CAUTION"] = Field(alias="eventType")
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    headline: BiText
    reasons: List[BiText]
    dasha_support: BiText = Field(alias="dashaSupport")
    gochar_support: BiText = Field(alias="gocharSupport")

    model_config = ConfigDict(populate_by_name=True)


class LifeEventsResponseData(BaseModel):
    chart_id: str = Field(alias="chartId")
    as_of_date: date = Field(alias="asOfDate")
    years_ahead: int = Field(alias="yearsAhead")
    windows: List[LifeEventWindow]

    model_config = ConfigDict(populate_by_name=True)


class LifeEventsResponse(BaseModel):
    success: bool = True
    data: LifeEventsResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

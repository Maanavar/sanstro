from __future__ import annotations

from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

VALID_EVENT_TYPES = {
    "JOB_CHANGE", "PROMOTION", "DEMOTION", "JOB_LOSS",
    "RELATIONSHIP_START", "RELATIONSHIP_END", "MARRIAGE", "DIVORCE", "REMARRIAGE",
    "RELOCATION", "TRAVEL_ABROAD",
    "HEALTH_EVENT", "SURGERY", "RECOVERY",
    "EXAM_RESULT", "EDUCATION_START", "EDUCATION_END",
    "FINANCIAL_MILESTONE", "INVESTMENT", "PROPERTY_PURCHASE", "DEBT",
    "FAMILY_LOSS", "BIRTH_OF_CHILD",
    "BUSINESS_START", "BUSINESS_END",
    "SPIRITUAL_EVENT", "PILGRIMAGE", "INITIATION",
    "LEGAL_MATTER",
    "OTHER",
}


class BiText(BaseModel):
    ta: str
    en: str


class LifeEventLogCreate(BaseModel):
    event_type: str = Field(alias="eventType")
    event_date: date = Field(alias="eventDate")
    description: Optional[str] = None

    model_config = {"populate_by_name": True}


class EventCorrelation(BaseModel):
    maha_lord: str = Field(alias="mahaLord")
    antar_lord: str = Field(alias="antarLord")
    moon_rasi: str = Field(alias="moonRasi")
    narrative: BiText

    model_config = {"populate_by_name": True}


class LifeEventLogItem(BaseModel):
    id: str
    chart_id: str = Field(alias="chartId")
    event_type: str = Field(alias="eventType")
    event_date: date = Field(alias="eventDate")
    description: Optional[str] = None
    correlation: Optional[EventCorrelation] = None

    model_config = {"populate_by_name": True}


class LifeEventLogResponse(BaseModel):
    success: bool = True
    data: List[LifeEventLogItem]


class LifeEventLogCreateResponse(BaseModel):
    success: bool = True
    data: LifeEventLogItem

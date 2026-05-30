from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class LifeAreaText(BaseModel):
    ta: str
    en: str


class LifeAreaDriver(BaseModel):
    """The primary planet and reason driving this area's current score."""
    planet: str
    reason: LifeAreaText


class LifeAreaData(BaseModel):
    area: str                                  # CAREER, MONEY, HEALTH, etc.
    label: LifeAreaText                        # Display name
    score: int                                 # 0–100
    trend: str                                 # UP / DOWN / STABLE
    confidence: str = "MEDIUM"                 # HIGH / MEDIUM / LOW
    confidence_reason: LifeAreaText = Field(
        default_factory=lambda: LifeAreaText(ta="இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன", en="Two signals aligned"),
        alias="confidenceReason",
    )
    driver: LifeAreaDriver                     # Primary planet behind the score
    narrative: LifeAreaText                    # 1–2 sentence explanation
    remedy: LifeAreaText                       # Specific remedy for this area
    next_30_day_outlook: LifeAreaText = Field(alias="next30DayOutlook")
    caution: LifeAreaText | None = None        # Optional caution note

    model_config = ConfigDict(populate_by_name=True)


class LifeAreasResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")
    areas: list[LifeAreaData]

    model_config = ConfigDict(populate_by_name=True)


class LifeAreasResponse(BaseModel):
    success: bool = True
    data: LifeAreasResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

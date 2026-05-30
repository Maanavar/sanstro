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
    area: str
    label: LifeAreaText
    score: int
    trend: str
    confidence: str = "MEDIUM"
    confidence_reason: LifeAreaText = Field(
        default_factory=lambda: LifeAreaText(ta="இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன", en="Two signals aligned"),
        alias="confidenceReason",
    )
    primary_house_strength: str = Field(default="NEUTRAL", alias="primaryHouseStrength")
    karaka_status: str = Field(default="MODERATE", alias="karakaStatus")
    dasha_activation: bool = Field(default=False, alias="dashaActivation")
    transit_support: int = Field(default=50, alias="transitSupport")
    supporting_factors: list[str] = Field(default_factory=list, alias="supportingFactors")
    blocking_factors: list[str] = Field(default_factory=list, alias="blockingFactors")
    driver: LifeAreaDriver
    narrative: LifeAreaText
    remedy: LifeAreaText
    next_30_day_outlook: LifeAreaText = Field(alias="next30DayOutlook")
    caution: LifeAreaText | None = None

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

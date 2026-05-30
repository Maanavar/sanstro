from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class AnnualWrappedBiText(BaseModel):
    ta: str
    en: str


class WrappedSlide(BaseModel):
    slide_id: str = Field(alias="slideId")
    slide_type: str = Field(alias="slideType")
    headline: AnnualWrappedBiText
    body: AnnualWrappedBiText
    accent_color: str = Field(default="#e5b84d", alias="accentColor")
    stat: str | None = None  # e.g. "73/100", "18 days", "JUPITER"

    model_config = ConfigDict(populate_by_name=True)


class AnnualWrappedData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    year: int
    slides: list[WrappedSlide]
    total_days_scored: int = Field(alias="totalDaysScored")
    peak_score: int = Field(alias="peakScore")
    peak_date: date | None = Field(default=None, alias="peakDate")
    valley_score: int = Field(alias="valleyScore")
    valley_date: date | None = Field(default=None, alias="valleyDate")
    dominant_dasha_lord: str = Field(alias="dominantDashaLord")
    high_days: int = Field(alias="highDays")
    caution_days: int = Field(alias="cautionDays")
    average_score: int = Field(alias="averageScore")
    top_life_area: str | None = Field(default=None, alias="topLifeArea")

    model_config = ConfigDict(populate_by_name=True)


class AnnualWrappedResponse(BaseModel):
    success: bool = True
    data: AnnualWrappedData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DashaInterpretation(BaseModel):
    activated_houses: list[int] = Field(default_factory=list, alias="activatedHouses")
    house_text_ta: str = Field(default="", alias="houseTextTa")
    house_text_en: str = Field(default="", alias="houseTextEn")
    natural_domain_ta: str = Field(default="", alias="naturalDomainTa")
    natural_domain_en: str = Field(default="", alias="naturalDomainEn")
    relationship_to_maha_ta: str = Field(default="", alias="relationshipToMahaTa")
    relationship_to_maha_en: str = Field(default="", alias="relationshipToMahaEn")

    model_config = ConfigDict(populate_by_name=True)


class DashaPeriodWindow(BaseModel):
    lord: str
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    interpretation: DashaInterpretation | None = Field(default=None)

    model_config = ConfigDict(populate_by_name=True)


class DashaOpeningWindow(BaseModel):
    lord: str
    balance_years_at_birth: float = Field(alias="balanceYearsAtBirth")

    model_config = ConfigDict(populate_by_name=True)


class DashaCurrentWindow(BaseModel):
    mahadasha: DashaPeriodWindow
    antardasha: DashaPeriodWindow
    pratyantardasha: DashaPeriodWindow


class DashaTimelineResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    opening_dasha: DashaOpeningWindow = Field(alias="openingDasha")
    current: DashaCurrentWindow
    timeline: list[dict[str, object]] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class ResponseMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class DashaTimelineResponse(BaseModel):
    success: bool = True
    data: DashaTimelineResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.birth_profiles import BirthProfileCreate, BirthProfileResponse


class ChartCalculateRequest(BaseModel):
    birth_profile_id: UUID | None = Field(default=None, alias="birthProfileId")
    birth_profile: BirthProfileCreate | None = Field(default=None, alias="birthProfile")
    calculation_version: str = Field(default="thirukanitham-2026-v1", alias="calculationVersion")
    force_recalculate: bool = Field(default=False, alias="forceRecalculate")

    model_config = ConfigDict(populate_by_name=True)


class AyanamsaInfo(BaseModel):
    type: Literal["LAHIRI"] = "LAHIRI"
    value_degrees: float = Field(alias="valueDegrees")

    model_config = ConfigDict(populate_by_name=True)


class LagnaPosition(BaseModel):
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    absolute_longitude: float = Field(alias="absoluteLongitude")
    degree_in_rasi: float = Field(alias="degreeInRasi")
    nakshatra: int
    nakshatra_name: str = Field(alias="nakshatraName")
    pada: int

    model_config = ConfigDict(populate_by_name=True)


class PlanetPosition(BaseModel):
    graha: str
    rasi_name: str = Field(alias="rasiName")
    absolute_longitude: float = Field(alias="absoluteLongitude")
    rasi: int
    degree_in_rasi: float = Field(alias="degreeInRasi")
    nakshatra: int
    nakshatra_name: str = Field(alias="nakshatraName")
    pada: int
    house_from_lagna: int = Field(alias="houseFromLagna")
    speed_deg_per_day: float = Field(alias="speedDegPerDay")
    is_retrograde: bool = Field(alias="isRetrograde")
    is_combust: bool = Field(alias="isCombust")
    d9_rasi: int = Field(alias="d9Rasi")
    is_vargottama: bool = Field(alias="isVargottama")
    show_retrograde_badge: bool = Field(alias="showRetrogradeBadge")

    model_config = ConfigDict(populate_by_name=True)


class ChartCalculateResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    birth_profile: BirthProfileResponse = Field(alias="birthProfile")
    birth_datetime_utc: datetime = Field(alias="birthDateTimeUTC")
    julian_day: float = Field(alias="julianDay")
    ayanamsa: AyanamsaInfo
    lagna: LagnaPosition
    planets: list[PlanetPosition]
    calculation_version: str = Field(alias="calculationVersion")
    calculation_status: Literal["completed"] = Field(default="completed", alias="calculationStatus")
    warnings: list[str] = Field(default_factory=list)
    ephemeris_backend: str = Field(alias="ephemerisBackend")

    model_config = ConfigDict(populate_by_name=True)


class ResponseMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class ChartCalculateResponse(BaseModel):
    success: bool = True
    data: ChartCalculateResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class ChartSummaryText(BaseModel):
    ta: str
    en: str


class ChartSummaryData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    display_name: str = Field(alias="displayName")
    lagna_rasi: str = Field(alias="lagnaRasi")
    moon_rasi: str = Field(alias="moonRasi")
    janma_nakshatra: str = Field(alias="janmaNakshatra")
    janma_pada: int = Field(alias="janmaPada")
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")
    primary_language_text: ChartSummaryText = Field(alias="primaryLanguageText")

    model_config = ConfigDict(populate_by_name=True)


class ChartSummaryResponse(BaseModel):
    success: bool = True
    data: ChartSummaryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

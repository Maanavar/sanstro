from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class PanchangamDailyQuery(BaseModel):
    date: date
    lat: float
    lng: float
    timezone: str

    model_config = ConfigDict(populate_by_name=True)


class PanchangamLocation(BaseModel):
    lat: float
    lng: float
    timezone: str

    model_config = ConfigDict(populate_by_name=True)


class PanchangamVara(BaseModel):
    weekday: str
    lord: str


class PanchangamTithi(BaseModel):
    number: int
    name: str
    paksha: Literal["SHUKLA", "KRISHNA"]
    ends_at: str = Field(alias="endsAt")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamNakshatra(BaseModel):
    name: str
    pada: int
    ends_at: str = Field(alias="endsAt")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamYoga(BaseModel):
    number: int
    name: str


class PanchangamKarana(BaseModel):
    name: str


class PanchangamSlot(BaseModel):
    start: str
    end: str
    slot: int


class PanchangamKalam(BaseModel):
    rahu_kalam: PanchangamSlot = Field(alias="rahuKalam")
    yamagandam: PanchangamSlot
    kuligai: PanchangamSlot
    nalla_neram: PanchangamSlot = Field(alias="nallaNeram")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamAbhijit(BaseModel):
    start: str
    end: str
    is_restricted_by_weekday: bool = Field(alias="isRestrictedByWeekday")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamHoraEntry(BaseModel):
    index: int
    lord: str
    start: str
    end: str


class PanchangamDailyResponseData(BaseModel):
    date_local: date = Field(alias="dateLocal")
    location: PanchangamLocation
    sunrise: str
    sunset: str
    solar_noon: str = Field(alias="solarNoon")
    vara: PanchangamVara
    tithi: PanchangamTithi
    nakshatra: PanchangamNakshatra
    yoga: PanchangamYoga
    karana: PanchangamKarana
    kalam: PanchangamKalam
    abhijit: PanchangamAbhijit
    hora: list[PanchangamHoraEntry]

    model_config = ConfigDict(populate_by_name=True)


class PanchangamMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamDailyResponse(BaseModel):
    success: bool = True
    data: PanchangamDailyResponseData
    meta: PanchangamMeta

    model_config = ConfigDict(populate_by_name=True)


class PanchangamTimingsData(BaseModel):
    date_local: date = Field(alias="dateLocal")
    location: PanchangamLocation
    sunrise: str
    sunset: str
    solar_noon: str = Field(alias="solarNoon")
    kalam: PanchangamKalam
    abhijit: PanchangamAbhijit
    hora: list[PanchangamHoraEntry]

    model_config = ConfigDict(populate_by_name=True)


class PanchangamTimingsResponse(BaseModel):
    success: bool = True
    data: PanchangamTimingsData
    meta: PanchangamMeta

    model_config = ConfigDict(populate_by_name=True)

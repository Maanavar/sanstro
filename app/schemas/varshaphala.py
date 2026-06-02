from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TajakaPlanetPosition(BaseModel):
    planet: str
    rasi: int
    degree_in_rasi: float = Field(alias="degreeInRasi")

    model_config = ConfigDict(populate_by_name=True)


class TajakaAspect(BaseModel):
    pair: str
    kind: str


class VarshaphalaAreaOutlook(BaseModel):
    area: str
    score: int
    narrative_ta: str = Field(alias="narrativeTa")
    narrative_en: str = Field(alias="narrativeEn")
    favourable_months: list[int] = Field(alias="favourableMonths")

    model_config = ConfigDict(populate_by_name=True)


class VarshaphalaData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    year: int
    solar_return_date: date = Field(alias="solarReturnDate")
    solar_return_lagna_rasi: int = Field(alias="solarReturnLagnaRasi")
    solar_return_lagna_name: str = Field(alias="solarReturnLagnaName")
    muntha_rasi: int = Field(alias="munthaRasi")
    muntha_rasi_name: str = Field(alias="munthaRasiName")
    muntha_house_from_sr_lagna: int = Field(alias="munthaHouseFromSrLagna")
    year_lord: str = Field(alias="yearLord")
    year_lord_house: int = Field(alias="yearLordHouse")
    tajaka_planets: list[TajakaPlanetPosition] = Field(alias="tajakaPlanets")
    itthasala_pairs: list[TajakaAspect] = Field(alias="itthasalaPairs")
    isarafa_pairs: list[TajakaAspect] = Field(alias="isarafaPairs")
    area_outlook: list[VarshaphalaAreaOutlook] = Field(alias="areaOutlook")

    model_config = ConfigDict(populate_by_name=True)


class VarshaphalaResponse(BaseModel):
    success: bool = True
    data: VarshaphalaData
    meta: dict[str, datetime | str]

    model_config = ConfigDict(populate_by_name=True)


from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PrasnaRequest(BaseModel):
    question_area: str = Field(default="GENERAL", alias="questionArea")
    timezone_name: str = Field(alias="timezoneName")
    latitude: float
    longitude: float
    question_datetime_local: datetime | None = Field(default=None, alias="questionDateTimeLocal")

    model_config = ConfigDict(populate_by_name=True)


class PrasnaResponse(BaseModel):
    prasna_lagna_rasi: int = Field(alias="prasnaLagnaRasi")
    prasna_lagna_name: str = Field(alias="prasnaLagnaName")
    moon_rasi: int = Field(alias="moonRasi")
    moon_nakshatra_name: str = Field(alias="moonNakshatraName")
    question_area: str = Field(alias="questionArea")
    karaka: str
    karaka_house: int = Field(alias="karakaHouse")
    outlook: str
    outlook_ta: str = Field(alias="outlookTa")
    outlook_en: str = Field(alias="outlookEn")
    positive_indicators: list[str] = Field(default_factory=list, alias="positiveIndicators")
    negative_indicators: list[str] = Field(default_factory=list, alias="negativeIndicators")
    caution_ta: str = Field(default="", alias="cautionTa")
    caution_en: str = Field(default="", alias="cautionEn")

    model_config = ConfigDict(populate_by_name=True)

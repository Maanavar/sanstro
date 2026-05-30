from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta

VALID_CARD_TYPES = {"DAILY_VIBE", "DASHA_ERA", "NAKSHATRA"}


class ShareCardBiText(BaseModel):
    ta: str
    en: str


class ShareCardData(BaseModel):
    card_type: str = Field(alias="cardType")
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")

    # DAILY_VIBE fields
    score: int | None = None
    score_label: str | None = Field(default=None, alias="scoreLabel")
    score_band: str | None = Field(default=None, alias="scoreBand")
    headline: ShareCardBiText | None = None
    sub_headline: ShareCardBiText | None = Field(default=None, alias="subHeadline")
    best_window: str | None = Field(default=None, alias="bestWindow")

    # DASHA_ERA fields
    maha_lord: str | None = Field(default=None, alias="mahaLord")
    maha_lord_plain: ShareCardBiText | None = Field(default=None, alias="mahaLordPlain")
    era_label: ShareCardBiText | None = Field(default=None, alias="eraLabel")
    era_years: str | None = Field(default=None, alias="eraYears")

    # NAKSHATRA fields
    nakshatra_name_ta: str | None = Field(default=None, alias="nakshatraNameTa")
    nakshatra_name_en: str | None = Field(default=None, alias="nakshatraNameEn")
    nakshatra_trait: ShareCardBiText | None = Field(default=None, alias="nakshatraTrait")
    ruling_planet: str | None = Field(default=None, alias="rulingPlanet")

    model_config = ConfigDict(populate_by_name=True)


class ShareCardResponse(BaseModel):
    success: bool = True
    data: ShareCardData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

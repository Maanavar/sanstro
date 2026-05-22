from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class TransitPosition(BaseModel):
    graha: str
    current_rasi: str = Field(alias="currentRasi")
    house_from_moon: int = Field(alias="houseFromMoon")
    house_from_lagna: int = Field(alias="houseFromLagna")
    is_retrograde: bool = Field(alias="isRetrograde")
    is_combust: bool = Field(alias="isCombust")
    is_sandhi: bool = Field(alias="isSandhi")
    is_gandanta: bool = Field(alias="isGandanta")
    interpretation_key: str = Field(alias="interpretationKey")

    model_config = ConfigDict(populate_by_name=True)


class TransitCycle(BaseModel):
    type: str | None = None
    is_active: bool = Field(alias="isActive")
    supportive_label: str | None = Field(default=None, alias="supportiveLabel")

    model_config = ConfigDict(populate_by_name=True)


class TransitSnapshotData(BaseModel):
    as_of_utc: datetime = Field(alias="asOfUTC")
    janma_rasi: str = Field(alias="janmaRasi")
    lagna_rasi: str = Field(alias="lagnaRasi")
    is_chandrashtama: bool = Field(default=False, alias="isChandrashtama")
    transits: list[TransitPosition]

    model_config = ConfigDict(populate_by_name=True)


class TransitSnapshotResponse(BaseModel):
    success: bool = True
    data: TransitSnapshotData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class SaniCycleData(BaseModel):
    saturn_rasi: str = Field(alias="saturnRasi")
    janma_rasi: str = Field(alias="janmaRasi")
    lagna_rasi: str = Field(alias="lagnaRasi")
    position_from_moon: int = Field(alias="positionFromMoon")
    position_from_lagna: int = Field(alias="positionFromLagna")
    moon_based_cycle: TransitCycle = Field(alias="moonBasedCycle")
    lagna_based_cycle: TransitCycle = Field(alias="lagnaBasedCycle")
    confirmation_sentence: str = Field(alias="confirmationSentence")

    model_config = ConfigDict(populate_by_name=True)


class SaniCycleResponse(BaseModel):
    success: bool = True
    data: SaniCycleData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


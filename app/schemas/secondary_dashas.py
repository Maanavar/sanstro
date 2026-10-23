"""Response models for the secondary/comparison dasha routes (A14).

Each route already returned a hand-built dict; these models describe that dict
exactly, so declaring them as `response_model` changes no byte of the payload
(`tests/test_a14_response_contracts.py` holds them to that) while giving the
OpenAPI schema — and the shared-wrapper contract guards — something concrete
to check.

Key casing is whatever the builder sends. Chara Dasha periods keep the
calculation layer's snake_case keys; every other shape is camelCase.
"""
from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

_ALIASED = ConfigDict(populate_by_name=True)

#: These timelines are two levels deep: no route here emits pratyantar or below.
SecondaryDashaLevel = Literal["maha", "antar"]
#: From the Sun–Moon elongation; the services compute nothing else.
Paksha = Literal["SHUKLA", "KRISHNA"]


# --- Chara Dasha (Jaimini) ---------------------------------------------------


class CharaDashaPeriod(BaseModel):
    rasi: int
    rasi_name: str
    years: int
    start_date: date
    end_date: date


class CharaKarakas(BaseModel):
    """The eight Jaimini Chara Karakas (8-karaka scheme, Doctrine §4) → graha.

    `compute_char_karakas` returns all eight whenever it is given all eight
    candidate grahas, which the route always does; it refuses the Rahu-less
    shape that would silently become the 7-karaka variant.
    """

    ATMAKARAKA: str
    AMATYAKARAKA: str
    BHRATRUKARAKA: str
    MATRUKARAKA: str
    PITRUKARAKA: str
    PUTRAKARAKA: str
    GNATIKARAKA: str
    DAARAKARAKA: str


class CharaDashaData(BaseModel):
    chart_id: str = Field(alias="chartId")
    lagna_rasi: int = Field(alias="lagnaRasi")
    current_period: CharaDashaPeriod | None = Field(alias="currentPeriod")
    periods: list[CharaDashaPeriod]
    char_karakas: CharaKarakas = Field(alias="charKarakas")
    atmakaraka: str | None
    karakamsa_rasi: int | None = Field(alias="karakamsaRasi")
    karakamsa_rasi_name: str | None = Field(alias="karakamsaRasiName")

    model_config = _ALIASED


class CharaDashaResponse(BaseModel):
    success: bool
    data: CharaDashaData


# --- Yogini Dasha --------------------------------------------------------------


class YoginiDashaPeriod(BaseModel):
    level: SecondaryDashaLevel
    yogini: str
    ruling_planet: str = Field(alias="rulingPlanet")
    years: int
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")

    model_config = _ALIASED


class YoginiOpening(BaseModel):
    yogini: str
    ruling_planet: str = Field(alias="rulingPlanet")
    balance_years_at_birth: float = Field(alias="balanceYearsAtBirth")

    model_config = _ALIASED


class YoginiCurrent(BaseModel):
    mahadasha: YoginiDashaPeriod
    antardasha: YoginiDashaPeriod


class YoginiDashaData(BaseModel):
    chart_id: str = Field(alias="chartId")
    opening_yogini: YoginiOpening = Field(alias="openingYogini")
    current: YoginiCurrent
    mahadashas: list[YoginiDashaPeriod]
    antardashas: list[YoginiDashaPeriod]

    model_config = _ALIASED


class YoginiDashaResponse(BaseModel):
    success: bool
    data: YoginiDashaData


# --- Lord-based nakshatra dashas (Ashtottari, the conditional family) ----------


class LordDashaPeriod(BaseModel):
    level: SecondaryDashaLevel
    lord: str
    years: int
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")

    model_config = _ALIASED


class LordDashaOpening(BaseModel):
    lord: str
    balance_years_at_birth: float = Field(alias="balanceYearsAtBirth")

    model_config = _ALIASED


class LordDashaCurrent(BaseModel):
    mahadasha: LordDashaPeriod
    antardasha: LordDashaPeriod


class AshtottariApplicabilityData(BaseModel):
    rule_en: str = Field(alias="ruleEn")
    rule_ta: str = Field(alias="ruleTa")
    applicable: bool | None
    reason: str
    paksha: Paksha
    is_day_birth: bool | None = Field(alias="isDayBirth")
    is_day_birth_approximate: bool = Field(alias="isDayBirthApproximate")
    paksha_supports: bool | None = Field(alias="pakshaSupports")
    paksha_reason: str = Field(alias="pakshaReason")

    model_config = _ALIASED


class AshtottariDashaData(BaseModel):
    chart_id: str = Field(alias="chartId")
    opening_lord: LordDashaOpening = Field(alias="openingLord")
    current: LordDashaCurrent
    mahadashas: list[LordDashaPeriod]
    antardashas: list[LordDashaPeriod]
    applicability: AshtottariApplicabilityData

    model_config = _ALIASED


class AshtottariDashaResponse(BaseModel):
    success: bool
    data: AshtottariDashaData


class ConditionalDashaTimelineData(BaseModel):
    key: str
    name_en: str = Field(alias="nameEn")
    name_ta: str = Field(alias="nameTa")
    total_years: int = Field(alias="totalYears")
    applicability_en: str = Field(alias="applicabilityEn")
    applicability_ta: str = Field(alias="applicabilityTa")
    opening_lord: LordDashaOpening = Field(alias="openingLord")
    current: LordDashaCurrent
    mahadashas: list[LordDashaPeriod]
    antardashas: list[LordDashaPeriod]

    model_config = _ALIASED


class ConditionalDashaApplicabilityResult(BaseModel):
    key: str
    applicable: bool | None
    reason: str


class ConditionalDashaApplicability(BaseModel):
    paksha: Paksha
    is_day_birth: bool | None = Field(alias="isDayBirth")
    is_day_birth_approximate: bool = Field(alias="isDayBirthApproximate")
    results: list[ConditionalDashaApplicabilityResult]

    model_config = _ALIASED


class ConditionalDashasData(BaseModel):
    chart_id: str = Field(alias="chartId")
    as_of: date = Field(alias="asOf")
    dashas: list[ConditionalDashaTimelineData]
    applicability: ConditionalDashaApplicability

    model_config = _ALIASED


class ConditionalDashasResponse(BaseModel):
    success: bool
    data: ConditionalDashasData


# --- Kalachakra Dasha ----------------------------------------------------------


class KalachakraDashaPeriod(BaseModel):
    level: SecondaryDashaLevel
    rasi: int
    rasi_code: str = Field(alias="rasiCode")
    rasi_name: str | None = Field(alias="rasiName")
    years: int
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")

    model_config = _ALIASED


class KalachakraOpening(BaseModel):
    chakra: str
    direction: str
    pada: int
    paramayus: int
    rasi: int
    rasi_code: str = Field(alias="rasiCode")
    rasi_name: str | None = Field(alias="rasiName")
    balance_years_at_birth: float = Field(alias="balanceYearsAtBirth")

    model_config = _ALIASED


class KalachakraCurrent(BaseModel):
    mahadasha: KalachakraDashaPeriod
    antardasha: KalachakraDashaPeriod


class KalachakraDashaData(BaseModel):
    chart_id: str = Field(alias="chartId")
    opening_info: KalachakraOpening = Field(alias="openingInfo")
    current: KalachakraCurrent
    mahadashas: list[KalachakraDashaPeriod]
    antardashas: list[KalachakraDashaPeriod]

    model_config = _ALIASED


class KalachakraDashaResponse(BaseModel):
    success: bool
    data: KalachakraDashaData

from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.charts import ChartDoshamInsight, ChartYogaInsight, ResponseMeta


class ChartExplanationText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationCoreIdentity(BaseModel):
    lagna_rasi: str = Field(alias="lagnaRasi")
    moon_rasi: str = Field(alias="moonRasi")
    janma_nakshatra: str = Field(alias="janmaNakshatra")
    janma_pada: int = Field(alias="janmaPada")
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")
    current_pratyantardasha: str = Field(alias="currentPratyantardasha")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPlanet(BaseModel):
    graha: str
    house_from_lagna: int = Field(alias="houseFromLagna")
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    nakshatra: int
    nakshatra_name: str = Field(alias="nakshatraName")
    pada: int
    dignity: str
    dignity_score: int = Field(alias="dignityScore")
    strength_score: int = Field(alias="strengthScore")
    is_retrograde: bool = Field(alias="isRetrograde")
    is_combust: bool = Field(alias="isCombust")
    is_vargottama: bool = Field(alias="isVargottama")
    d9_rasi: int = Field(alias="d9Rasi")
    house_group: str = Field(alias="houseGroup")
    functional_nature: str = Field(alias="functionalNature")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationMaitriPair(BaseModel):
    planet_a: str = Field(alias="planetA")
    planet_b: str = Field(alias="planetB")
    relationship: str
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationConjunctionGroup(BaseModel):
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    house_from_lagna: int = Field(alias="houseFromLagna")
    planets: list[str]
    relationship_tone: str = Field(alias="relationshipTone")
    pairs: list[ChartExplanationMaitriPair]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationAspect(BaseModel):
    source_planet: str = Field(alias="sourcePlanet")
    target_planet: str = Field(alias="targetPlanet")
    source_house: int = Field(alias="sourceHouse")
    target_house: int = Field(alias="targetHouse")
    aspect_house: int = Field(alias="aspectHouse")
    aspect_type: str = Field(alias="aspectType")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationHouseGroup(BaseModel):
    group: str
    houses: list[int]
    planets: list[str]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationYogaDoshamSection(BaseModel):
    yogas: list[ChartYogaInsight]
    doshams: list[ChartDoshamInsight]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationActivationSignal(BaseModel):
    source_planet: str = Field(alias="sourcePlanet")
    signal_type: str = Field(alias="signalType")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationDashaLordActivation(BaseModel):
    level: str
    lord: str
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    natal_house_from_lagna: int = Field(alias="natalHouseFromLagna")
    natal_house_from_moon: int = Field(alias="natalHouseFromMoon")
    natal_rasi: int = Field(alias="natalRasi")
    natal_rasi_name: str = Field(alias="natalRasiName")
    natal_dignity: str = Field(alias="natalDignity")
    natal_strength_score: int = Field(alias="natalStrengthScore")
    functional_nature: str = Field(alias="functionalNature")
    transit_rasi: int = Field(alias="transitRasi")
    transit_rasi_name: str = Field(alias="transitRasiName")
    transit_house_from_moon: int = Field(alias="transitHouseFromMoon")
    transit_house_from_lagna: int = Field(alias="transitHouseFromLagna")
    transit_is_retrograde: bool = Field(alias="transitIsRetrograde")
    period_tone: str = Field(alias="periodTone")
    life_areas: list[str] = Field(alias="lifeAreas")
    transit_signals: list[ChartExplanationActivationSignal] = Field(alias="transitSignals")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationCurrentActivationSection(BaseModel):
    as_of: date = Field(alias="asOf")
    period_summary: ChartExplanationText = Field(alias="periodSummary")
    transit_summary: ChartExplanationText = Field(alias="transitSummary")
    active_lords: list[ChartExplanationDashaLordActivation] = Field(alias="activeLords")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationSummarySection(BaseModel):
    strongest_planet: str | None = Field(alias="strongestPlanet")
    weakest_planet: str | None = Field(alias="weakestPlanet")
    positives: list[ChartExplanationText]
    cautions: list[ChartExplanationText]

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPeyarchiEvent(BaseModel):
    planet: str
    event_date: date = Field(alias="eventDate")
    from_rasi: str = Field(alias="fromRasi")
    to_rasi: str = Field(alias="toRasi")
    house_from_moon: int = Field(alias="houseFromMoon")
    house_from_lagna: int = Field(alias="houseFromLagna")
    sani_cycle_after: str | None = Field(default=None, alias="saniCycleAfter")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPeyarchiSection(BaseModel):
    as_of: date = Field(alias="asOf")
    events: list[ChartExplanationPeyarchiEvent]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    core_identity: ChartExplanationCoreIdentity = Field(alias="coreIdentity")
    planets: list[ChartExplanationPlanet]
    conjunctions: list[ChartExplanationConjunctionGroup]
    aspects: list[ChartExplanationAspect]
    house_groups: list[ChartExplanationHouseGroup] = Field(alias="houseGroups")
    functional_nature: dict[str, str] = Field(alias="functionalNature")
    yoga_dosham: ChartExplanationYogaDoshamSection = Field(alias="yogaDosham")
    current_activation: ChartExplanationCurrentActivationSection = Field(alias="currentActivation")
    summary: ChartExplanationSummarySection
    peyarchi: ChartExplanationPeyarchiSection
    method_note: ChartExplanationText = Field(alias="methodNote")

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationResponse(BaseModel):
    success: bool = True
    data: ChartExplanationData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

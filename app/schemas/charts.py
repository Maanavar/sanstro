from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.birth_profiles import BirthProfileResponse


class ChartCalculateRequest(BaseModel):
    birth_profile_id: UUID = Field(alias="birthProfileId")
    calculation_version: str = Field(default="thirukanitham-2026-v1", alias="calculationVersion")
    force_recalculate: bool = Field(default=False, alias="forceRecalculate")

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


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
    strength_breakdown: dict[str, str] = Field(
        default_factory=lambda: {"sthana": "NEUTRAL", "dik": "NEUTRAL", "kala": "NEUTRAL", "chesta": "NEUTRAL"},
        alias="strengthBreakdown",
    )

    model_config = ConfigDict(populate_by_name=True)


class ChartYogaInsight(BaseModel):
    name: str
    is_present: bool = Field(alias="isPresent")
    strength: str
    conditions_met: list[str] = Field(alias="conditionsMet")
    cancellation_factors: list[str] = Field(alias="cancellationFactors")
    dasha_activated: bool = Field(alias="dashaActivated")
    description_ta: str = Field(alias="descriptionTa")
    description_en: str = Field(alias="descriptionEn")

    model_config = ConfigDict(populate_by_name=True)


class ChartDoshamInsight(BaseModel):
    name: str
    is_present: bool = Field(alias="isPresent")
    is_cancelled: bool = Field(alias="isCancelled")
    strength: str
    label: str = "NO_DOSHAM"
    category: str = "GENERAL"
    conditions_met: list[str] = Field(alias="conditionsMet")
    cancellation_factors: list[str] = Field(alias="cancellationFactors")
    missing_data: list[str] = Field(default_factory=list, alias="missingData")
    dasha_activated: bool = Field(alias="dashaActivated")
    description_ta: str = Field(alias="descriptionTa")
    description_en: str = Field(alias="descriptionEn")
    explanation_what_ta: str = Field(default="", alias="explanationWhatTa")
    explanation_what_en: str = Field(default="", alias="explanationWhatEn")
    explanation_why_ta: str = Field(default="", alias="explanationWhyTa")
    explanation_why_en: str = Field(default="", alias="explanationWhyEn")
    explanation_how_ta: str = Field(default="", alias="explanationHowTa")
    explanation_how_en: str = Field(default="", alias="explanationHowEn")

    model_config = ConfigDict(populate_by_name=True)


class ChartNakshatraCaution(BaseModel):
    name: str
    nakshatra_number: int = Field(alias="nakshatraNumber")
    description_ta: str = Field(alias="descriptionTa")
    description_en: str = Field(alias="descriptionEn")

    model_config = ConfigDict(populate_by_name=True)


class ChartCalculateResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    birth_profile: BirthProfileResponse = Field(alias="birthProfile")
    birth_datetime_utc: datetime = Field(alias="birthDateTimeUTC")
    julian_day: float = Field(alias="julianDay")
    ayanamsa: AyanamsaInfo
    lagna: LagnaPosition
    planets: list[PlanetPosition]
    yogas: list[ChartYogaInsight] = Field(default_factory=list)
    doshams: list[ChartDoshamInsight] = Field(default_factory=list)
    nakshatra_cautions: list[ChartNakshatraCaution] = Field(default_factory=list, alias="nakshatraCautions")
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
    current_age: int = Field(alias="currentAge")
    lagna_rasi: str = Field(alias="lagnaRasi")
    moon_rasi: str = Field(alias="moonRasi")
    janma_nakshatra: str = Field(alias="janmaNakshatra")
    janma_pada: int = Field(alias="janmaPada")
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")
    functional_nature: dict[str, str] = Field(alias="functionalNature")
    ashtakavarga: dict[str, dict[int, int]] = Field(alias="ashtakavarga")
    primary_language_text: ChartSummaryText = Field(alias="primaryLanguageText")

    model_config = ConfigDict(populate_by_name=True)


class ChartSummaryResponse(BaseModel):
    success: bool = True
    data: ChartSummaryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportBirthProfile(BaseModel):
    display_name: str = Field(alias="displayName")
    birth_date_local: str = Field(alias="birthDateLocal")
    birth_time_local: str = Field(alias="birthTimeLocal")
    birth_place: str = Field(alias="birthPlace")
    birth_timezone: str = Field(alias="birthTimezone")
    current_age: int = Field(alias="currentAge")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportCoreIdentity(BaseModel):
    lagna_rasi: str = Field(alias="lagnaRasi")
    moon_rasi: str = Field(alias="moonRasi")
    janma_nakshatra: str = Field(alias="janmaNakshatra")
    janma_pada: int = Field(alias="janmaPada")
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportRasiSummary(BaseModel):
    lagna: LagnaPosition
    planets: list[PlanetPosition]

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportNavamsaSummary(BaseModel):
    d9_by_planet: dict[str, int] = Field(alias="d9ByPlanet")
    vargottama_planets: list[str] = Field(alias="vargottamaPlanets")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportYogaDoshamSummary(BaseModel):
    yogas: list[ChartYogaInsight]
    doshams: list[ChartDoshamInsight]

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportPlanetStrengthItem(BaseModel):
    planet: str
    score: int

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportPlanetStrengthSummary(BaseModel):
    strong: list[JadhagamReportPlanetStrengthItem]
    moderate: list[JadhagamReportPlanetStrengthItem]
    weak: list[JadhagamReportPlanetStrengthItem]

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportDashaAnalysis(BaseModel):
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportAgeWiseTimeline(BaseModel):
    current_age: int = Field(alias="currentAge")
    active_focus_areas: list[str] = Field(alias="activeFocusAreas")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportExecutiveSummary(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    birth_profile: JadhagamReportBirthProfile = Field(alias="birthProfile")
    core_identity: JadhagamReportCoreIdentity = Field(alias="coreIdentity")
    rasi_chart_summary: JadhagamReportRasiSummary = Field(alias="rasiChartSummary")
    navamsam_summary: JadhagamReportNavamsaSummary = Field(alias="navamsamSummary")
    functional_nature_table: dict[str, str] = Field(alias="functionalNatureTable")
    yoga_dosham_summary: JadhagamReportYogaDoshamSummary = Field(alias="yogaDoshamSummary")
    planetary_strength_summary: JadhagamReportPlanetStrengthSummary = Field(alias="planetaryStrengthSummary")
    dasha_analysis: JadhagamReportDashaAnalysis = Field(alias="dashaAnalysis")
    life_area_predictions: list[dict[str, str]] = Field(alias="lifeAreaPredictions")
    age_wise_timeline: JadhagamReportAgeWiseTimeline = Field(alias="ageWiseTimeline")
    current_year_guidance: dict[str, str] = Field(alias="currentYearGuidance")
    upcoming_periods: list[dict[str, str]] = Field(alias="upcomingPeriods")
    practical_guidance: dict[str, list[str]] = Field(alias="practicalGuidance")
    optional_remedies: dict[str, list[str]] = Field(alias="optionalRemedies")
    executive_summary: JadhagamReportExecutiveSummary = Field(alias="executiveSummary")

    model_config = ConfigDict(populate_by_name=True)


class JadhagamReportResponse(BaseModel):
    success: bool = True
    data: JadhagamReportData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

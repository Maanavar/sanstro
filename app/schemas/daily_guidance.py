from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class DailyGuidanceWindow(BaseModel):
    type: str
    start: str
    end: str


class DailyGuidanceText(BaseModel):
    ta: str
    en: str


class DailyGuidanceSuggestion(BaseModel):
    ta: str
    en: str


class DailyGuidanceJournalSignal(BaseModel):
    life_area: str = Field(alias="lifeArea")
    count: int

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceJournalInsight(BaseModel):
    lookback_days: int = Field(alias="lookbackDays")
    entry_count: int = Field(alias="entryCount")
    dominant_life_area: str = Field(alias="dominantLifeArea")
    top_tags: list[str] = Field(alias="topTags")
    text: DailyGuidanceText
    signals: list[DailyGuidanceJournalSignal]

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceEmotionalWeather(BaseModel):
    tone: str
    physical_tendency: str = Field(alias="physicalTendency")
    best_use_of_day: str = Field(alias="bestUseOfDay")
    avoid_before: DailyGuidanceText | None = Field(alias="avoidBefore")
    tone_text: DailyGuidanceText = Field(alias="toneText")
    physical_tendency_text: DailyGuidanceText = Field(alias="physicalTendencyText")
    best_use_of_day_text: DailyGuidanceText = Field(alias="bestUseOfDayText")

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceScoreBreakdown(BaseModel):
    moon_transit: int = Field(alias="moonTransit")
    dasha_support: int = Field(alias="dashaSupport")
    panchangam: int
    gochar_support: int = Field(alias="gocharSupport")
    personal_cautions: int = Field(alias="personalCautions")
    remedial_action_support: int = Field(alias="remedialActionSupport")

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceReasons(BaseModel):
    """Per-component Tamil + English explanations plus a synthesised summary paragraph."""
    moon_transit: DailyGuidanceText = Field(alias="moonTransit")
    dasha_support: DailyGuidanceText = Field(alias="dashaSupport")
    panchangam: DailyGuidanceText
    gochar: DailyGuidanceText
    personal_caution: DailyGuidanceText = Field(alias="personalCaution")
    summary: DailyGuidanceText  # Full synthesised paragraph combining all factors

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")
    score: int
    label: str
    confidence: str = Field(default="MEDIUM")
    confidence_reason: DailyGuidanceText = Field(
        default_factory=lambda: DailyGuidanceText(ta="இரண்டு சமிக்ஞைகள் சீரமைக்கப்பட்டுள்ளன", en="Two signals aligned"),
        alias="confidenceReason",
    )
    score_breakdown: DailyGuidanceScoreBreakdown = Field(alias="scoreBreakdown")
    best_windows: list[DailyGuidanceWindow] = Field(alias="bestWindows")
    caution_windows: list[DailyGuidanceWindow] = Field(alias="cautionWindows")
    text: DailyGuidanceText
    nakshatra_perspective: DailyGuidanceText = Field(alias="nakshatraPerspective")
    emotional_weather: DailyGuidanceEmotionalWeather = Field(alias="emotionalWeather")
    context_insight: DailyGuidanceText | None = Field(alias="contextInsight")
    journal_insight: DailyGuidanceJournalInsight | None = Field(alias="journalInsight")
    action_suggestion: DailyGuidanceSuggestion = Field(alias="actionSuggestion")
    caution_suggestion: DailyGuidanceSuggestion = Field(alias="cautionSuggestion")
    reasons: DailyGuidanceReasons
    remedy: DailyGuidanceText
    pratyantar_narrative: DailyGuidanceText | None = Field(default=None, alias="pratyantarNarrative")
    tithi_card: DailyGuidanceText | None = Field(default=None, alias="tithiCard")
    is_chandrashtama: bool = Field(default=False, alias="isChandrashtama")
    saturn_cycle_alert: str | None = Field(default=None, alias="saturnCycleAlert")

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceResponse(BaseModel):
    success: bool = True
    data: DailyGuidanceData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceRangeData(BaseModel):
    profile_id: UUID = Field(alias="profileId")
    chart_id: UUID = Field(alias="chartId")
    from_date: date = Field(alias="fromDate")
    to_date: date = Field(alias="toDate")
    items: list[DailyGuidanceData]

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceRangeResponse(BaseModel):
    success: bool = True
    data: DailyGuidanceRangeData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class WeekAheadDayItem(BaseModel):
    date_local: date = Field(alias="dateLocal")
    score: int
    label: str
    nakshatra_number: int = Field(alias="nakshatraNumber")
    tithi_number: int = Field(alias="tithiNumber")
    is_chandrashtama: bool = Field(alias="isChandrashtama")
    special_tithi: str | None = Field(default=None, alias="specialTithi")
    best_window_start: str | None = Field(default=None, alias="bestWindowStart")

    model_config = ConfigDict(populate_by_name=True)


class WeekAheadData(BaseModel):
    profile_id: UUID = Field(alias="profileId")
    chart_id: UUID = Field(alias="chartId")
    week_start: date = Field(alias="weekStart")
    week_end: date = Field(alias="weekEnd")
    best_day: date = Field(alias="bestDay")
    best_day_score: int = Field(alias="bestDayScore")
    chandrashtama_days: list[date] = Field(alias="chandrashtamaDays")
    special_tithi_days: list[date] = Field(alias="specialTithiDays")
    dasha_theme_ta: str = Field(alias="dashaThemeTa")
    dasha_theme_en: str = Field(alias="dashaThemeEn")
    days: list[WeekAheadDayItem]

    model_config = ConfigDict(populate_by_name=True)


class WeekAheadResponse(BaseModel):
    success: bool = True
    data: WeekAheadData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingDayResult(BaseModel):
    date_local: date = Field(alias="dateLocal")
    score: int
    label: str
    alignment: str
    reason_ta: str = Field(alias="reasonTa")
    reason_en: str = Field(alias="reasonEn")

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    activity: str
    month: str
    top_dates: list[ActivityTimingDayResult] = Field(alias="topDates")

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingResponse(BaseModel):
    success: bool = True
    data: ActivityTimingData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class DashaStoryPeriod(BaseModel):
    lord: str
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    age_start: int = Field(alias="ageStart")
    age_end: int = Field(alias="ageEnd")
    theme_ta: str = Field(alias="themeTa")
    theme_en: str = Field(alias="themeEn")
    is_current: bool = Field(alias="isCurrent")

    model_config = ConfigDict(populate_by_name=True)


class DashaStoryData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    opening_lord: str = Field(alias="openingLord")
    periods: list[DashaStoryPeriod]

    model_config = ConfigDict(populate_by_name=True)


class DashaStoryResponse(BaseModel):
    success: bool = True
    data: DashaStoryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class PeyarchiReportPeriod(BaseModel):
    planet: str
    from_rasi: int = Field(alias="fromRasi")
    to_rasi: int = Field(alias="toRasi")
    transit_date: date = Field(alias="transitDate")
    house_from_moon: int = Field(alias="houseFromMoon")
    house_from_lagna: int = Field(alias="houseFromLagna")
    outlook_ta: str = Field(alias="outlookTa")
    outlook_en: str = Field(alias="outlookEn")

    model_config = ConfigDict(populate_by_name=True)


class PeyarchiReportData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    planet: str
    events: list[PeyarchiReportPeriod]

    model_config = ConfigDict(populate_by_name=True)


class PeyarchiReportResponse(BaseModel):
    success: bool = True
    data: PeyarchiReportData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalCorrelationItem(BaseModel):
    condition: str
    sample_count: int = Field(alias="sampleCount")
    avg_mood: float = Field(alias="avgMood")
    description_ta: str = Field(alias="descriptionTa")
    description_en: str = Field(alias="descriptionEn")

    model_config = ConfigDict(populate_by_name=True)


class JournalCorrelationData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    entry_count: int = Field(alias="entryCount")
    lookback_days: int = Field(alias="lookbackDays")
    correlations: list[JournalCorrelationItem]
    minimum_entries_required: int = Field(alias="minimumEntriesRequired")
    has_sufficient_data: bool = Field(alias="hasSufficientData")

    model_config = ConfigDict(populate_by_name=True)


class JournalCorrelationResponse(BaseModel):
    success: bool = True
    data: JournalCorrelationData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

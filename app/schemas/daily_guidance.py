from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class DailyGuidanceText(BaseModel):
    ta: str
    en: str


class DailyGuidanceWindow(BaseModel):
    type: str
    start: str
    end: str
    # What the window is actually made of. Populated since the best window became
    # the intersection of the hora grid and the Gowri kala grid (see
    # _dg_hora._perfect_windows) so a surface can say *why* a time is best
    # instead of the unfalsifiable "good for important tasks". All optional:
    # rows cached before the change, and the stale-snapshot fallback path, carry
    # a bare type/start/end and must still validate.
    kala: str | None = Field(default=None)          # AMIRTHAM | UTHI | LABHAM | …
    hora_lord: str | None = Field(default=None, alias="horaLord")
    is_personal: bool = Field(default=False, alias="isPersonal")
    text: DailyGuidanceText | None = Field(default=None)

    model_config = ConfigDict(populate_by_name=True)


class DailyGuidanceWindowConflict(BaseModel):
    """A stretch of the day that was nearly a best window, and what spoiled it.

    Emitted so the hero can name a cause rather than silently omit the time. A
    reader looking at the panchangam page sees Sugam 6:13-7:46 am marked good; if
    the app's own "best window" skips it, the app owes them the reason.

    Only hora-vs-kala collisions appear here — the one pairing no surface in the
    app reconciles. Rahu Kalam / Yamagandam / Kuligai clashes are excluded on
    purpose: they already have their own hero card and their own red rows on the
    panchangam page, so repeating them would crowd out what nothing else explains.
    """

    kind: str   # BAD_KALA | MALEFIC_HORA
    cause: str  # ROGAM | SATURN — the specific thing named
    start: str
    end: str
    text: DailyGuidanceText

    model_config = ConfigDict(populate_by_name=True)


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


class DailyActivityVerdict(BaseModel):
    """One activity and today's verdict on it, for the green/red-light board."""

    activity: str
    label: DailyGuidanceText
    alignment: str  # SUPPORTS | NEUTRAL | CAUTION
    reason: DailyGuidanceText

    model_config = ConfigDict(populate_by_name=True)


class DailyActivityBoardData(BaseModel):
    """"What is today good for?" — the question users actually open the app with.

    The per-activity timing rules already existed but were only consulted for a
    goal the user had pre-selected. This is the same doctrine swept across every
    activity and partitioned, so the answer can be read at a glance.
    """

    favourable: list[DailyActivityVerdict] = Field(default_factory=list)
    caution: list[DailyActivityVerdict] = Field(default_factory=list)
    neutral: list[DailyActivityVerdict] = Field(default_factory=list)
    # True when the day is Chandrashtama, in which case `favourable` is
    # deliberately empty — see calculations.activity_timing_rules.
    is_chandrashtama: bool = Field(default=False, alias="isChandrashtama")

    model_config = ConfigDict(populate_by_name=True)


class RemedyFocusAction(BaseModel):
    """One concrete remedy act for the day's anchor planet.

    `cadence` is a genuine, always-true attribute of the act's nature — the
    temple offering is a ritual tied to the planet's weekday (`RITUAL_ON_DAY`),
    the seva acts are charitable service done whenever (`ANY_DAY`). It is NOT a
    per-chart ranking (there is no seva-potency scoring), so nothing here claims
    one act is stronger than another. The frontend renders it as a small tag.
    """

    text: DailyGuidanceText
    kind: str  # TEMPLE | SEVA
    cadence: str  # RITUAL_ON_DAY | ANY_DAY

    model_config = ConfigDict(populate_by_name=True)


class RemedyFocus(BaseModel):
    """The Today card's chart-driven remedy: one anchor planet + why + how.

    Populated from the running Mahadasha lord and the shared `select_remedy_focus`
    selection, with concrete acts composed from `PLANET_REMEDY_CATALOG`. Additive
    and optional on `DailyGuidanceData` — older cached rows return null and the
    client falls back to the flat `remedy` string.
    """

    planet: str
    role: str  # DASHA_LORD | WEAK_BENEFIC | DOSHA
    is_weak: bool = Field(alias="isWeak")
    weekday: str  # English enum (e.g. MONDAY); client localises + finds next date
    lead: DailyGuidanceText
    why: DailyGuidanceText
    actions: list[RemedyFocusAction] = Field(default_factory=list)
    japa: int | None = Field(default=None)

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
    # Ordinal reasoning band (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT).
    # Additive; populated when the reasoning_bands flag is on. Legacy
    # `confidence` stays derived from it (D2, plan Phase 2).
    band: str | None = Field(default=None)
    score_breakdown: DailyGuidanceScoreBreakdown = Field(alias="scoreBreakdown")
    best_windows: list[DailyGuidanceWindow] = Field(alias="bestWindows")
    caution_windows: list[DailyGuidanceWindow] = Field(alias="cautionWindows")
    # Near-misses with their causes — see DailyGuidanceWindowConflict. Additive
    # and defaulted so rows cached before it still validate.
    best_window_conflicts: list[DailyGuidanceWindowConflict] = Field(
        default_factory=list, alias="bestWindowConflicts"
    )
    text: DailyGuidanceText
    nakshatra_perspective: DailyGuidanceText = Field(alias="nakshatraPerspective")
    emotional_weather: DailyGuidanceEmotionalWeather = Field(alias="emotionalWeather")
    context_insight: DailyGuidanceText | None = Field(alias="contextInsight")
    journal_insight: DailyGuidanceJournalInsight | None = Field(alias="journalInsight")
    action_suggestion: DailyGuidanceSuggestion = Field(alias="actionSuggestion")
    caution_suggestion: DailyGuidanceSuggestion = Field(alias="cautionSuggestion")
    reasons: DailyGuidanceReasons
    # Track A synthesis: the six `reasons` composed into one prioritized, flowing
    # briefing (verdict lead → salient signals → one action). Populated only when
    # the `daily_briefing_synth` flag is on; additive/optional so existing
    # consumers and cached rows built before it are unaffected.
    briefing: DailyGuidanceText | None = Field(default=None)
    remedy: DailyGuidanceText
    # Structured, chart-driven remedy for the Today card (anchor planet + three
    # concrete acts). Additive/optional — cached rows built before it return
    # null and the client falls back to the flat `remedy` string above.
    remedy_focus: RemedyFocus | None = Field(default=None, alias="remedyFocus")
    current_hora_lord: str | None = Field(default=None, alias="currentHoraLord")
    pratyantar_narrative: DailyGuidanceText | None = Field(default=None, alias="pratyantarNarrative")
    tithi_card: DailyGuidanceText | None = Field(default=None, alias="tithiCard")
    is_chandrashtama: bool = Field(default=False, alias="isChandrashtama")
    # When Chandrashtama LIFTS TODAY — null when it runs past the end of the
    # solar day, which is most days of a 2-3 day stretch (ruling 2026-09-01).
    # Null is therefore normal, not a gap: the card keeps its untimed "Extra
    # care advised today." line, which is true on every day of the stretch.
    # Also null when `is_chandrashtama` is false, and for cache rows built
    # before this field existed.
    chandrashtama_ends: datetime | None = Field(default=None, alias="chandrashtamaEnds")
    saturn_cycle_alert: str | None = Field(default=None, alias="saturnCycleAlert")
    activity_board: DailyActivityBoardData | None = Field(default=None, alias="activityBoard")

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
    # Compact named cause ("Navami — rikta tithi") for chip-sized UI; optional
    # so older cached payloads still validate.
    short_reason_ta: str | None = Field(default=None, alias="shortReasonTa")
    short_reason_en: str | None = Field(default=None, alias="shortReasonEn")

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingLocation(BaseModel):
    """Location used for the Panchangam behind an activity-timing result."""

    latitude: float
    longitude: float
    timezone: str
    source: Literal["current", "birth"]


class ActivityTimingData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    activity: str
    month: str
    top_dates: list[ActivityTimingDayResult] = Field(alias="topDates")
    # Chronological SUPPORTS days after ``as_of``. Unlike ``topDates``, these
    # answer the practical follow-up: "when can I do this?"
    next_favourable_dates: list[date] = Field(
        default_factory=list, alias="nextFavourableDates"
    )
    date_result: ActivityTimingDayResult | None = Field(default=None, alias="dateResult")
    daily_location: ActivityTimingLocation | None = Field(default=None, alias="dailyLocation")

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingResponse(BaseModel):
    success: bool = True
    data: ActivityTimingData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingBatchData(BaseModel):
    """Several activities' timings for one chart+month in a single response
    (DASH-04: the dashboard Decide strip previously issued one request per
    activity). ``results`` is keyed by the requested activity id; a failed or
    unknown activity maps to ``None`` so one bad activity never sinks the rest."""

    chart_id: UUID = Field(alias="chartId")
    month: str
    results: dict[str, ActivityTimingData | None]

    model_config = ConfigDict(populate_by_name=True)


class ActivityTimingBatchResponse(BaseModel):
    success: bool = True
    data: ActivityTimingBatchData
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

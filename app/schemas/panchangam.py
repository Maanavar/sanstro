from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class BiText(BaseModel):
    ta: str
    en: str


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


class PanchangamLimbSpan(BaseModel):
    """One stretch of a single limb value inside the solar day.

    Every limb ships its full day's spans, not just the first transition. That
    matters most for karana, which averages 11.79 h: a solar day carries three
    karanas on most days, so `nextName` alone left the third unrepresented and
    no client could show the real timeline even if it wanted to.

    `fraction` is the span's share of the solar day, so a client can rank or
    label a stretch ("most of the day", "the last two hours") without doing
    date arithmetic.
    """

    number: int
    name: str
    starts_at: str = Field(alias="startsAt")
    ends_at: str = Field(alias="endsAt")
    starts_at_iso: str = Field(alias="startsAtIso")
    ends_at_iso: str = Field(alias="endsAtIso")
    fraction: float

    model_config = ConfigDict(populate_by_name=True)


class PanchangamNethiramJeevan(BaseModel):
    """Nethiram and Jeevan with the boundary they change at.

    Both are a function of (Sun's star, Moon's star). Inside one day only the
    Moon's star moves, so both flip at the nakshatra boundary — which is why
    they belong beside Nokku, which is derived from the same star and already
    rolls over live on the calendar card. Without `endsAt` on the wire no client
    could make them agree.
    """

    nethiram: str
    jeevan: str
    nethiram_next: str = Field(alias="nethiramNext")
    jeevan_next: str = Field(alias="jeevanNext")
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamTithi(BaseModel):
    number: int
    name: str
    paksha: Literal["SHUKLA", "KRISHNA"]
    ends_at: str = Field(alias="endsAt")
    # Full local-datetime ISO string alongside the bare "HH:MM" above — the
    # boundary is the first crossing after sunrise, so it routinely lands on
    # the next calendar day, and a clock-only string can't say which day.
    # Clients must use this (not endsAt + a guessed date) for same-day-rollover
    # promotion. See docs/... project_tithi_rollover_bug_2026-07-20 note.
    ends_at_iso: str = Field(alias="endsAtIso")
    next_number: int = Field(alias="nextNumber")
    next_name: str = Field(alias="nextName")
    next_paksha: Literal["SHUKLA", "KRISHNA"] = Field(alias="nextPaksha")

    spans: list[PanchangamLimbSpan] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class PanchangamNakshatra(BaseModel):
    name: str
    pada: int
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")
    next_name: str = Field(alias="nextName")
    # `name` above is the value at sunrise — the உதய rule, which names the day.
    # `spans` is what the limb actually did. Additive, so existing clients are
    # untouched; a client that wants to show the star in effect *now* reads this.
    spans: list[PanchangamLimbSpan] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class PanchangamYoga(BaseModel):
    number: int
    name: str
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")
    next_name: str = Field(alias="nextName")

    spans: list[PanchangamLimbSpan] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class PanchangamKarana(BaseModel):
    name: str
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")
    next_name: str = Field(alias="nextName")

    spans: list[PanchangamLimbSpan] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class PanchangamSlot(BaseModel):
    start: str
    end: str
    slot: int
    warning: str | None = None
    name: str | None = None
    period: Literal["DAY", "NIGHT", "AM", "PM"] | None = None
    is_good: bool | None = Field(default=None, alias="isGood")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamKalam(BaseModel):
    rahu_kalam: PanchangamSlot = Field(alias="rahuKalam")
    yamagandam: PanchangamSlot
    kuligai: PanchangamSlot
    gowri_panchangam: list[PanchangamSlot] = Field(default_factory=list, alias="gowriPanchangam")
    nalla_neram: list[PanchangamSlot] = Field(alias="nallaNeram")
    gowri_nalla_neram: list[PanchangamSlot] = Field(alias="gowriNallaNeram")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamAbhijit(BaseModel):
    start: str
    end: str
    is_restricted_by_weekday: bool = Field(alias="isRestrictedByWeekday")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamFestival(BaseModel):
    name: str
    category: str
    tags: list[str] = Field(default_factory=list)


class PanchangamSubhaMuhurtham(BaseModel):
    is_subha: bool = Field(alias="isSubha")
    reason: str
    is_subha_strict: bool = Field(alias="isSubhaStrict")
    strict_reason: str = Field(alias="strictReason")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamHoraEntry(BaseModel):
    index: int
    lord: str
    start: str
    end: str


class PanchangamSoolam(BaseModel):
    direction: str
    parigaram: str
    status: str = Field(default="preliminary", description="Verification status: 'preliminary' indicates pending source verification")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamLagnam(BaseModel):
    rasi_number: int = Field(alias="rasiNumber")
    rasi_name: str = Field(alias="rasiName")
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")
    nazhigai: int
    vinadi: int

    model_config = ConfigDict(populate_by_name=True)


class PanchangamAmirdhadhiYogam(BaseModel):
    name: str
    ends_at: str = Field(alias="endsAt")
    ends_at_iso: str = Field(alias="endsAtIso")
    next_name: str = Field(alias="nextName")
    status: str = Field(default="preliminary", description="Verification status: 'preliminary' indicates pending source verification")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamChandrashtamamNakshatraWindow(BaseModel):
    name: str
    start: datetime
    end: datetime


class PanchangamChandrashtamamToday(BaseModel):
    """Rasi-based Chandrashtamam for the current Moon rasi.

    nakshatras is retained for older clients as a flat name list; it is derived
    from janma_nakshatra_windows (not an independent computation) so the two
    fields can never disagree. janma_nakshatra_windows carries the rasi-specific
    nakshatra timing windows that Tamil almanacs usually call out.
    """

    moon_rasi_number: int = Field(alias="moonRasiNumber")
    moon_rasi_name: str = Field(alias="moonRasiName")
    affected_janma_rasi_number: int = Field(alias="affectedJanmaRasiNumber")
    affected_janma_rasi_name: str = Field(alias="affectedJanmaRasiName")
    nakshatras: list[str] = Field(default_factory=list)
    janma_nakshatra_windows: list[PanchangamChandrashtamamNakshatraWindow] = Field(default_factory=list, alias="janmaNakshatraWindows")
    status: str = Field(default="preliminary", description="Verification status: 'preliminary' indicates pending source verification")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamSpecialTithiDay(BaseModel):
    tithi_number: int = Field(alias="tithiNumber")
    name: Literal["POURNAMI", "AMAVASAI"]
    moon_phase: Literal["FULL", "NEW"] = Field(alias="moonPhase")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamDailyResponseData(BaseModel):
    date_local: date = Field(alias="dateLocal")
    tamil_date: BiText | None = Field(alias="tamilDate", default=None)
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
    subha_muhurtham: PanchangamSubhaMuhurtham = Field(alias="subhaMuhurtham")
    festivals: list[PanchangamFestival] = []
    hora: list[PanchangamHoraEntry]
    moon_phase_label: str = Field(alias="moonPhaseLabel")
    soolam: PanchangamSoolam
    lagnam: PanchangamLagnam
    nethiram: str
    jeevan: str
    # Additive: the two bare strings above kept their shape for existing
    # clients; this carries the boundary and the post-boundary values.
    nethiram_jeevan: PanchangamNethiramJeevan | None = Field(default=None, alias="nethiramJeevan")
    amirdhadhi_yogam: PanchangamAmirdhadhiYogam = Field(alias="amirdhadhiYogam")
    chandrashtamam_today: PanchangamChandrashtamamToday = Field(alias="chandrashtamamToday")
    special_tithi_day: PanchangamSpecialTithiDay | None = Field(default=None, alias="specialTithiDay")
    is_karinaal: bool = Field(default=False, alias="isKarinaal")

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
    subha_muhurtham: PanchangamSubhaMuhurtham = Field(alias="subhaMuhurtham")
    festivals: list[PanchangamFestival] = []
    hora: list[PanchangamHoraEntry]

    model_config = ConfigDict(populate_by_name=True)


class PanchangamTimingsResponse(BaseModel):
    success: bool = True
    data: PanchangamTimingsData
    meta: PanchangamMeta

    model_config = ConfigDict(populate_by_name=True)


class PanchangamMonthlyQuery(BaseModel):
    year: int
    month: int = Field(ge=1, le=12)
    lat: float
    lng: float
    timezone: str


class PanchangamMonthDayEntry(BaseModel):
    date_local: date = Field(alias="dateLocal")
    tamil_date: BiText | None = Field(alias="tamilDate", default=None)
    weekday: str
    tithi_number: int = Field(alias="tithiNumber")
    tithi_name: str = Field(alias="tithiName")
    tithi_paksha: Literal["SHUKLA", "KRISHNA"] = Field(alias="tithiPaksha")
    nakshatra_name: str = Field(alias="nakshatraName")
    special_tithi_day_number: int | None = Field(default=None, alias="specialTithiDayNumber")
    festivals: list[PanchangamFestival] = []
    is_tamil_muhurtham_day: bool = Field(alias="isTamilMuhurthamDay")
    is_subha_muhurtham: bool = Field(alias="isSubhaMuhurtham")
    is_subha_muhurtham_strict: bool = Field(alias="isSubhaMuhurthamStrict")
    is_karinaal: bool = Field(default=False, alias="isKarinaal")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamMonthlyData(BaseModel):
    year: int
    month: int
    tamil_month_name: BiText | None = Field(default=None, alias="tamilMonthName")
    entries: list[PanchangamMonthDayEntry] = []

    model_config = ConfigDict(populate_by_name=True)


class PanchangamMonthlyResponse(BaseModel):
    success: bool = True
    data: PanchangamMonthlyData
    meta: PanchangamMeta

    model_config = ConfigDict(populate_by_name=True)

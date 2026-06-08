from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal

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


class PanchangamTithi(BaseModel):
    number: int
    name: str
    paksha: Literal["SHUKLA", "KRISHNA"]
    ends_at: str = Field(alias="endsAt")
    next_number: int = Field(alias="nextNumber")
    next_name: str = Field(alias="nextName")
    next_paksha: Literal["SHUKLA", "KRISHNA"] = Field(alias="nextPaksha")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamNakshatra(BaseModel):
    name: str
    pada: int
    ends_at: str = Field(alias="endsAt")
    next_name: str = Field(alias="nextName")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamYoga(BaseModel):
    number: int
    name: str
    ends_at: str = Field(alias="endsAt")
    next_name: str = Field(alias="nextName")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamKarana(BaseModel):
    name: str
    ends_at: str = Field(alias="endsAt")
    next_name: str = Field(alias="nextName")

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


class PanchangamLagnam(BaseModel):
    rasi_number: int = Field(alias="rasiNumber")
    rasi_name: str = Field(alias="rasiName")
    ends_at: str = Field(alias="endsAt")
    nazhigai: int
    vinadi: int

    model_config = ConfigDict(populate_by_name=True)


class PanchangamAmirdhadhiYogam(BaseModel):
    name: str
    ends_at: str = Field(alias="endsAt")
    next_name: str = Field(alias="nextName")

    model_config = ConfigDict(populate_by_name=True)


class PanchangamChandrashtamamToday(BaseModel):
    """Rasi-based Chandrashtamam for the current Moon rasi.

    nakshatras is retained for older clients that display the generic almanac
    nakshatra-count list.
    """

    moon_rasi_number: int = Field(alias="moonRasiNumber")
    moon_rasi_name: str = Field(alias="moonRasiName")
    affected_janma_rasi_number: int = Field(alias="affectedJanmaRasiNumber")
    affected_janma_rasi_name: str = Field(alias="affectedJanmaRasiName")
    nakshatras: list[str] = Field(default_factory=list)

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
    amirdhadhi_yogam: PanchangamAmirdhadhiYogam = Field(alias="amirdhadhiYogam")
    chandrashtamam_today: PanchangamChandrashtamamToday = Field(alias="chandrashtamamToday")
    special_tithi_day: PanchangamSpecialTithiDay | None = Field(default=None, alias="specialTithiDay")

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

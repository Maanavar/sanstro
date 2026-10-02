"""Response schemas for muhurtham-naal listing and chart-matched ranking."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class BiText(BaseModel):
    ta: str
    en: str


class NallaNeramWindow(BaseModel):
    start: str
    end: str
    period: str  # "AM" | "PM"


class MuhurthamNaalItem(BaseModel):
    date: str
    weekday: BiText
    pirai: BiText
    tamil_month: BiText = Field(serialization_alias="tamilMonth")
    tamil_day: int = Field(serialization_alias="tamilDay")
    nakshatra: BiText
    tithi_number: int = Field(serialization_alias="tithiNumber")
    paksha: str
    nalla_neram: list[NallaNeramWindow] = Field(serialization_alias="nallaNeram")

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalListResponse(BaseModel):
    success: bool = True
    year: int
    source: str
    count: int
    naals: list[MuhurthamNaalItem]

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalReading(BaseModel):
    """One chart's reading of one date. `who` is null for a single chart."""

    who: BiText | None = None
    tara_number: int = Field(serialization_alias="taraNumber")
    tara_name: BiText = Field(serialization_alias="taraName")
    tara_quality: str = Field(serialization_alias="taraQuality")  # GOOD|NEUTRAL|AVOID
    is_chandrashtama: bool = Field(serialization_alias="isChandrashtama")
    governs: bool

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalMatchItem(BaseModel):
    naal: MuhurthamNaalItem
    # The governing reading's tara — the one that set `matchScore`.
    tara_number: int = Field(serialization_alias="taraNumber")
    tara_name: BiText = Field(serialization_alias="taraName")
    tara_quality: str = Field(serialization_alias="taraQuality")  # GOOD|NEUTRAL|AVOID
    # Chandrashtama for either chart.
    is_chandrashtama: bool = Field(serialization_alias="isChandrashtama")
    is_recommended: bool = Field(serialization_alias="isRecommended")
    match_score: int = Field(serialization_alias="matchScore")
    reasons: list[BiText]
    # One per chart, in request order. Additive: a consumer that predates
    # couple mode reads the top-level fields and is still told the truth.
    readings: list[MuhurthamNaalReading] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalLocation(BaseModel):
    """Location used to calculate the Nalla Neram displayed with a matched date."""

    latitude: float
    longitude: float
    timezone: str
    source: Literal["current", "birth"]


class MuhurthamNaalPartnerContext(BaseModel):
    who: BiText
    janma_nakshatra: BiText = Field(serialization_alias="janmaNakshatra")
    janma_rasi_number: int = Field(serialization_alias="janmaRasiNumber")
    chandrashtama_rasi_number: int = Field(serialization_alias="chandrashtamaRasiNumber")

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalMatchContext(BaseModel):
    janma_nakshatra: BiText = Field(serialization_alias="janmaNakshatra")
    janma_rasi_number: int = Field(serialization_alias="janmaRasiNumber")
    chandrashtama_rasi_number: int = Field(serialization_alias="chandrashtamaRasiNumber")
    # For a couple: dates that suit *both* charts.
    recommended_count: int = Field(serialization_alias="recommendedCount")
    total_count: int = Field(serialization_alias="totalCount")
    source: str
    daily_location: MuhurthamNaalLocation | None = Field(default=None, serialization_alias="dailyLocation")
    # Couple mode only; null for a single chart.
    subject_who: BiText | None = Field(default=None, serialization_alias="subjectWho")
    partner: MuhurthamNaalPartnerContext | None = None

    model_config = ConfigDict(populate_by_name=True)


class MuhurthamNaalMatchResponse(BaseModel):
    success: bool = True
    year: int
    chart_id: str = Field(serialization_alias="chartId")
    partner_chart_id: str | None = Field(default=None, serialization_alias="partnerChartId")
    context: MuhurthamNaalMatchContext
    matches: list[MuhurthamNaalMatchItem]

    model_config = ConfigDict(populate_by_name=True)


# ── converters from service dataclasses (duck-typed) ───────────────────────
def _bi(label: Any) -> BiText:
    return BiText(ta=label.ta, en=label.en)


def item_from_view(view: Any) -> MuhurthamNaalItem:
    return MuhurthamNaalItem(
        date=view.date,
        weekday=_bi(view.weekday),
        pirai=_bi(view.pirai),
        tamil_month=_bi(view.tamil_month),
        tamil_day=view.tamil_day,
        nakshatra=_bi(view.nakshatra),
        tithi_number=view.tithi_number,
        paksha=view.paksha,
        nalla_neram=[
            NallaNeramWindow(start=w.start, end=w.end, period=w.period)
            for w in view.nalla_neram
        ],
    )


def item_from_match(match: Any) -> MuhurthamNaalMatchItem:
    return MuhurthamNaalMatchItem(
        naal=item_from_view(match.naal),
        tara_number=match.tara_number,
        tara_name=_bi(match.tara_name),
        tara_quality=match.tara_quality,
        is_chandrashtama=match.is_chandrashtama,
        is_recommended=match.is_recommended,
        match_score=match.match_score,
        reasons=[_bi(r) for r in match.reasons],
        readings=[
            MuhurthamNaalReading(
                who=_bi(r.who) if r.who is not None else None,
                tara_number=r.tara_number,
                tara_name=_bi(r.tara_name),
                tara_quality=r.tara_quality,
                is_chandrashtama=r.is_chandrashtama,
                governs=r.governs,
            )
            for r in getattr(match, "readings", ())
        ],
    )


def context_from_dict(ctx: dict) -> MuhurthamNaalMatchContext:
    partner = ctx.get("partner")
    subject_who = ctx.get("subject_who")
    return MuhurthamNaalMatchContext(
        janma_nakshatra=_bi(ctx["janma_nakshatra"]),
        janma_rasi_number=ctx["janma_rasi_number"],
        chandrashtama_rasi_number=ctx["chandrashtama_rasi_number"],
        recommended_count=ctx["recommended_count"],
        total_count=ctx["total_count"],
        source=ctx["source"],
        daily_location=ctx.get("daily_location"),
        subject_who=_bi(subject_who) if subject_who is not None else None,
        partner=(
            None if partner is None
            else MuhurthamNaalPartnerContext(
                who=_bi(partner["who"]),
                janma_nakshatra=_bi(partner["janma_nakshatra"]),
                janma_rasi_number=partner["janma_rasi_number"],
                chandrashtama_rasi_number=partner["chandrashtama_rasi_number"],
            )
        ),
    )

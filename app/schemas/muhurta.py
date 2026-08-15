from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.calculations.muhurta_engine import FactorResult, resolve_rule_source


class BiText(BaseModel):
    ta: str
    en: str


class MuhurtaCitation(BaseModel):
    """Where a factor's rule comes from, when a classical text decided it.

    Present only for factors whose `RuleSource` is primary-text confirmed. A
    citation on screen is a strong claim — that a named page of a named edition
    says this — so it is built from `RuleSource.is_primary_text_confirmed()`
    rather than from the mere presence of a rule_id.
    """

    tradition: str | None = None
    chapter: str | None = None
    page: str | None = None
    passage: str | None = None
    edition: str | None = None


class MuhurtaFactor(BaseModel):
    """One thing the engine checked, what it decided, and why.

    This is the audit trail. Until it existed, the engine computed verdicts,
    citations and rule conflicts and the API dropped all of it except the
    penalties, folded anonymously into `cautions` — the product paid for
    provenance nobody could see.

    `verdict` is the engine's five-state vocabulary, and the distinctions in it
    are load-bearing for the UI:

    * `UNSOURCED` is **not** `NEUTRAL`. "We checked and it is fine" and "we have
      no table to check against" must never render the same way.
    * `VETO` is not a large `PENALTY`. A veto removes the day and cannot be
      outweighed; render it as an exclusion, never as a low score.
    """

    factor: str = Field(description="ALMANAC_TITHI | NAKSHATRA | TARA_BALA | CHANDRA_BALA | ...")
    verdict: str = Field(description="VETO | PENALTY | NEUTRAL | BONUS | UNSOURCED")
    contribution: float = Field(description="Points this factor added to or removed from the day")
    reason: BiText
    # True only for primary-text-confirmed doctrine. False for engine
    # heuristics and for the generic almanac layer — which must never be
    # presented as though a classical text ruled on it.
    sourced: bool = False
    rule_id: str | None = Field(alias="ruleId", default=None)
    citation: MuhurtaCitation | None = None
    # Set when two sourced rules both matched and the text does not settle
    # which wins. Surfaced rather than silently resolved.
    conflict: str | None = None

    model_config = {"populate_by_name": True}

    @classmethod
    def from_engine(cls, factor: FactorResult) -> MuhurtaFactor:
        record = resolve_rule_source(factor.rule_id) if factor.rule_id else None
        confirmed = record is not None and record.is_primary_text_confirmed()
        citation = None
        if confirmed and record is not None:
            citation = MuhurtaCitation(
                tradition=record.authority.tradition,
                chapter=record.authority.chapter,
                # `page` is `int | str | None` on the Authority record — normalise
                # to a string so the wire type is stable whichever it was.
                page=None if record.authority.page is None else str(record.authority.page),
                passage=record.authority.verse_or_passage,
                edition=record.authority.translation_edition,
            )
        return cls(
            factor=factor.factor,
            verdict=factor.verdict.value,
            contribution=round(factor.contribution, 1),
            reason=BiText(ta=factor.reason_ta, en=factor.reason_en),
            sourced=confirmed,
            ruleId=factor.rule_id,
            citation=citation,
            conflict=factor.conflict,
        )


class MuhurtaQuery(BaseModel):
    chart_id: UUID
    activity: str = Field(
        description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL | NAMING_CEREMONY | ANNAPRASANA | EAR_BORING | TREASURE_STORE | GOLD | GEMS | GRAIN | LAND_POSSESSION | LAND_PURCHASE | CATTLE_PURCHASE"
    )
    date_from: date
    date_to: date = Field(description="Max 60 days from date_from")

    model_config = {"populate_by_name": True}


class MuhurtaSlot(BaseModel):
    date: date
    tamil_date: BiText | None = Field(alias="tamilDate", default=None)
    time_start: str = Field(alias="timeStart")
    time_end: str = Field(alias="timeEnd")
    score: float
    panchangam_support: BiText = Field(alias="panchangamSupport")
    dasha_support: BiText = Field(alias="dashaSupport")
    hora_support: BiText | None = Field(alias="horaSupport", default=None)
    cautions: list[BiText]
    # Every factor the engine weighed for this day, in evaluation order.
    # `cautions` above is a lossy projection of this list (the PENALTY reasons
    # only) kept for the surfaces that already render it; new UI should read
    # `factors` instead, which also carries verdicts, citations and conflicts.
    # Defaulted so the numerology surfaces that embed a MuhurtaSlot keep working.
    factors: list[MuhurtaFactor] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class MuhurtaResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    activity: str
    date_from: date = Field(alias="dateFrom")
    date_to: date = Field(alias="dateTo")
    timezone: str = Field(description="IANA timezone the slot times are computed and expressed in")
    slots: list[MuhurtaSlot]

    model_config = {"populate_by_name": True}


class ResponseMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion", default="1.0")
    generated_at: str = Field(alias="generatedAt", default="")

    model_config = {"populate_by_name": True}


class MuhurtaResponse(BaseModel):
    success: bool = True
    data: MuhurtaResponseData
    meta: ResponseMeta

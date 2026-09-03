from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class BiText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiQuery(BaseModel):
    question: str = Field(max_length=500)
    lang: str = Field(default="en")
    # Feature 3 — set when the question originated from a pre-written daily chip.
    # Used only for rate-limit accounting; the answer logic ignores it.
    is_chip_question: bool = Field(default=False, alias="isChipQuestion")

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiVerdict(BaseModel):
    """A plain go/stay answer led *before* the reasoning, for decision/voice
    users who want a verdict, not a paragraph (UX #6). ``kind`` is one of
    GO | WAIT | CAUTION | MIXED | NA; NA means the question was informational,
    not a decision, and the client hides the chip."""

    kind: str
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiResponseData(BaseModel):
    question: str
    answer: BiText
    verdict: AskVinaadiVerdict | None = None
    signals_used: list[str] = Field(alias="signalsUsed")
    confidence: str
    caveat: BiText | None = None
    questions_used_today: int = Field(alias="questionsUsedToday")
    daily_limit: int | None = Field(alias="dailyLimit")
    monthly_limit: int | None = Field(default=None, alias="monthlyLimit")
    chips_remaining: int | None = Field(default=None, alias="chipsRemaining")

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiResponse(BaseModel):
    success: bool = True
    data: AskVinaadiResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class BiText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiQuery(BaseModel):
    question: str = Field(max_length=500)
    lang: str = Field(default="en")

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiResponseData(BaseModel):
    question: str
    answer: BiText
    signals_used: list[str] = Field(alias="signalsUsed")
    confidence: str
    caveat: Optional[BiText] = None
    questions_used_today: int = Field(alias="questionsUsedToday")
    daily_limit: int = Field(alias="dailyLimit")

    model_config = ConfigDict(populate_by_name=True)


class AskVinaadiResponse(BaseModel):
    success: bool = True
    data: AskVinaadiResponseData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

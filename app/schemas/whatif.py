from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user_goal import VALID_GOAL_TYPES
from app.schemas.dasha import ResponseMeta

VALID_SCENARIOS = VALID_GOAL_TYPES  # reuse same set


class WhatIfRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    scenario: str
    target_date: date = Field(alias="targetDate")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("scenario")
    @classmethod
    def validate_scenario(cls, v: str) -> str:
        if v not in VALID_SCENARIOS:
            raise ValueError(f"scenario must be one of: {sorted(VALID_SCENARIOS)}")
        return v


class TripleConfirmation(BaseModel):
    """
    The three-pillar check from the Thirukanitham formula spec.
    Every prediction must trace to all three sources.
    """
    natal_promise: str = Field(alias="natalPromise")
    natal_promise_strength: str = Field(alias="natalPromiseStrength")  # STRONG / MODERATE / WEAK
    dasha_support: str = Field(alias="dashaSupport")
    dasha_support_strength: str = Field(alias="dashaSupportStrength")
    gochar_support: str = Field(alias="gocharSupport")
    gochar_support_strength: str = Field(alias="gocharSupportStrength")
    overall_verdict: str = Field(alias="overallVerdict")  # FAVOURABLE / NEUTRAL / CAUTION

    model_config = ConfigDict(populate_by_name=True)


class WhatIfBiText(BaseModel):
    ta: str
    en: str


class WhatIfData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    scenario: str
    target_date: date = Field(alias="targetDate")
    overall_score: int = Field(alias="overallScore")
    verdict: str                                     # FAVOURABLE / NEUTRAL / CAUTION
    triple_confirmation: TripleConfirmation = Field(alias="tripleConfirmation")
    summary: WhatIfBiText
    best_period_in_window: WhatIfBiText = Field(alias="bestPeriodInWindow")
    caution_note: WhatIfBiText = Field(alias="cautionNote")
    remedy: WhatIfBiText
    disclaimer: WhatIfBiText

    model_config = ConfigDict(populate_by_name=True)


class WhatIfResponse(BaseModel):
    success: bool = True
    data: WhatIfData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

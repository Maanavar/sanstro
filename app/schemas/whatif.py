from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user_goal import VALID_GOAL_TYPES
from app.schemas.dasha import ResponseMeta

# P2-3: whatif accepts two scenarios beyond the onboarding goal-track picker's
# vocabulary (foreign_settlement, litigation — see docs/PREDICTION_TAXONOMY.md
# §2/§5). Deliberately NOT added to VALID_GOAL_TYPES itself: that constant is
# also the onboarding "what's your focus" picker (app/models/user.py
# User.goal_track, consumed by daily_guidance_service/decisions_service/
# activity_timing_rules) where "litigation" would be a nonsensical life-goal
# option — so whatif keeps its own superset instead of widening the shared one.
VALID_SCENARIOS = VALID_GOAL_TYPES | {"foreign_settlement", "litigation"}


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
    The four-pillar check from the Thirukanitham formula spec.
    Every prediction must trace to all four sources.
    """
    natal_promise: str = Field(alias="natalPromise")
    natal_promise_strength: str = Field(alias="natalPromiseStrength")  # STRONG / MODERATE / WEAK
    dasha_support: str = Field(alias="dashaSupport")
    dasha_support_strength: str = Field(alias="dashaSupportStrength")
    gochar_support: str = Field(alias="gocharSupport")
    gochar_support_strength: str = Field(alias="gocharSupportStrength")
    panchangam_quality: str = Field(default="MODERATE", alias="panchangamQuality")
    overall_verdict: str = Field(alias="overallVerdict")  # FAVOURABLE / NEUTRAL / CAUTION

    model_config = ConfigDict(populate_by_name=True)


class WhatIfBiText(BaseModel):
    ta: str
    en: str


class WhatIfChartSignature(BaseModel):
    """Dominant-graha framing for the whole chart (plan Phase 5), mirrors
    app.schemas.life_areas.ChartSignatureData's shape for this surface."""
    dominant: str
    framing: WhatIfBiText


class WhatIfData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    scenario: str
    target_date: date = Field(alias="targetDate")
    overall_score: int = Field(alias="overallScore")
    verdict: str                                     # FAVOURABLE / NEUTRAL / CAUTION
    # Ordinal reasoning band (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT).
    # Additive — populated only when the reasoning_gate flag is on (Phase 1).
    band: str | None = Field(default=None)
    # Contradiction reading (PROMISED_AND_TIMED / PROMISED_NOT_NOW /
    # ACTIVE_BUT_UNPROMISED / PARTIALLY_PROMISED / NOT_PROMISED / MIXED /
    # SILENT). Additive — populated only when the reasoning_contradiction
    # flag is on (Phase 3, D4).
    reading: str | None = Field(default=None)
    triple_confirmation: TripleConfirmation = Field(alias="tripleConfirmation")
    summary: WhatIfBiText
    best_period_in_window: WhatIfBiText = Field(alias="bestPeriodInWindow")
    caution_note: WhatIfBiText = Field(alias="cautionNote")
    remedy: WhatIfBiText
    disclaimer: WhatIfBiText
    # Chart-level dominant-graha framing + a LOW/WEAK-confidence causal
    # chain (plan Phase 5). Additive — populated only when
    # reasoning_chart_signature is on; causal_chain only for non-STRONG
    # verdicts (mirrors life_areas_service's LOW-confidence-only rule).
    chart_signature: WhatIfChartSignature | None = Field(default=None, alias="chartSignature")
    causal_chain: WhatIfBiText | None = Field(default=None, alias="causalChain")

    model_config = ConfigDict(populate_by_name=True)


class WhatIfResponse(BaseModel):
    success: bool = True
    data: WhatIfData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

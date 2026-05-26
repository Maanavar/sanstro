from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.dasha import ResponseMeta

VALID_DECISION_PRIORITIES = {"career", "family", "health", "relationship", "education", "money", "spiritual"}


class DecisionOption(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=1000)


class DecisionBriefRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    option_a: DecisionOption = Field(alias="optionA")
    option_b: DecisionOption = Field(alias="optionB")
    priority: str | None = None
    target_date: date | None = Field(default=None, alias="targetDate")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in VALID_DECISION_PRIORITIES:
            raise ValueError(f"priority must be one of: {sorted(VALID_DECISION_PRIORITIES)}")
        return v


class DecisionBiText(BaseModel):
    ta: str
    en: str


class OptionAnalysis(BaseModel):
    label: str
    score: int
    alignment_notes: list[str] = Field(alias="alignmentNotes")
    risk_factors: list[str] = Field(alias="riskFactors")
    optimal_window: str | None = Field(alias="optimalWindow")

    model_config = ConfigDict(populate_by_name=True)


class DecisionBriefData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    target_date: date = Field(alias="targetDate")
    scenario_used: str = Field(alias="scenarioUsed")
    option_a: OptionAnalysis = Field(alias="optionA")
    option_b: OptionAnalysis = Field(alias="optionB")
    recommended: str
    confidence: int
    reasoning: DecisionBiText
    caution: DecisionBiText | None = None

    model_config = ConfigDict(populate_by_name=True)


class DecisionBriefResponse(BaseModel):
    success: bool = True
    data: DecisionBriefData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


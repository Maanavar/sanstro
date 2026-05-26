from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user_goal import VALID_GOAL_TYPES
from app.schemas.dasha import ResponseMeta


class GoalCreate(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    goal_type: str = Field(alias="goalType")
    description: str | None = None
    language_preference: str = Field(default="ta-en", alias="languagePreference")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: str) -> str:
        if v not in VALID_GOAL_TYPES:
            raise ValueError(f"goal_type must be one of: {sorted(VALID_GOAL_TYPES)}")
        return v


class GoalData(BaseModel):
    goal_id: UUID = Field(alias="goalId")
    chart_id: UUID = Field(alias="chartId")
    goal_type: str = Field(alias="goalType")
    description: str | None = None
    is_active: bool = Field(alias="isActive")
    language_preference: str = Field(alias="languagePreference")
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class GoalResponse(BaseModel):
    success: bool = True
    data: GoalData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class GoalListData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    goals: list[GoalData]

    model_config = ConfigDict(populate_by_name=True)


class GoalListResponse(BaseModel):
    success: bool = True
    data: GoalListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class GoalDeactivateResponse(BaseModel):
    success: bool = True
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class ContextEvent(BaseModel):
    type: str
    date: date
    note: str | None = None


class ContextReaction(BaseModel):
    date: date
    guidance_score: int = Field(alias="guidanceScore")
    user_felt: str = Field(alias="userFelt")
    note: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class ContextUpsertRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    life_situation: dict[str, object] | None = Field(default=None, alias="lifeSituation")
    active_events: list[ContextEvent] | None = Field(default=None, alias="activeEvents")
    reaction_history: list[ContextReaction] | None = Field(default=None, alias="reactionHistory")

    model_config = ConfigDict(populate_by_name=True)


class ContextData(BaseModel):
    context_id: UUID = Field(alias="contextId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    chart_id: UUID = Field(alias="chartId")
    life_situation: dict[str, object] = Field(alias="lifeSituation")
    active_events: list[ContextEvent] = Field(alias="activeEvents")
    reaction_history: list[ContextReaction] = Field(alias="reactionHistory")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class ContextResponse(BaseModel):
    success: bool = True
    data: ContextData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


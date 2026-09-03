from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta

# Upper bound for the one-time localStorage seed (~10 years); purely cosmetic.
MAX_SEED_DAYS = 3650


class StreakPingRequest(BaseModel):
    local_days: int | None = Field(default=None, alias="localDays", ge=1, le=MAX_SEED_DAYS)

    model_config = ConfigDict(populate_by_name=True)


class StreakData(BaseModel):
    days: int
    longest_days: int = Field(alias="longestDays")
    last_active_date: date | None = Field(default=None, alias="lastActiveDate")

    model_config = ConfigDict(populate_by_name=True)


class StreakResponse(BaseModel):
    success: bool = True
    data: StreakData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

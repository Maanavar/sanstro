from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class PeyarchiEvent(BaseModel):
    alert_id: str = Field(alias="alertId")
    planet: str
    from_rasi: str = Field(alias="fromRasi")
    to_rasi: str = Field(alias="toRasi")
    peyarchi_date_utc: datetime = Field(alias="peyarchiDateUTC")
    peyarchi_date_local: date = Field(alias="peyarchiDateLocal")
    days_from_today: int = Field(alias="daysFromToday")
    impact_from_moon: int = Field(alias="impactFromMoon")
    impact_from_lagna: int = Field(alias="impactFromLagna")
    sani_cycle_after: str | None = Field(default=None, alias="saniCycleAfter")
    label_ta: str = Field(alias="labelTa")
    label_en: str = Field(alias="labelEn")

    model_config = ConfigDict(populate_by_name=True)


class PeyarchiSummaryResponse(BaseModel):
    success: bool = True
    data: list[PeyarchiEvent]
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

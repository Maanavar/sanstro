from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta
from app.schemas.relationships import RelationshipBiText


class AmbientAlertItem(BaseModel):
    alert_id: str = Field(alias="alertId")
    source: str
    significance_score: int = Field(alias="significanceScore")
    trigger_planet: str | None = Field(default=None, alias="triggerPlanet")
    trigger_type: str | None = Field(default=None, alias="triggerType")
    event_date: date = Field(alias="eventDate")
    days_from_today: int = Field(alias="daysFromToday")
    tier: str | None = None
    chart_id: str | None = Field(default=None, alias="chartId")
    family_vault_id: str | None = Field(default=None, alias="familyVaultId")
    member_id: str | None = Field(default=None, alias="memberId")
    title: RelationshipBiText
    message: RelationshipBiText

    model_config = ConfigDict(populate_by_name=True)


class AmbientAlertsData(BaseModel):
    as_of_date: date = Field(alias="asOfDate")
    min_significance: int = Field(alias="minSignificance")
    unread_only: bool = Field(alias="unreadOnly")
    total_returned: int = Field(alias="totalReturned")
    total_suppressed: int = Field(alias="totalSuppressed")
    items: list[AmbientAlertItem]

    model_config = ConfigDict(populate_by_name=True)


class AmbientAlertsResponse(BaseModel):
    success: bool = True
    data: AmbientAlertsData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

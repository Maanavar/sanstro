from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


class RelationshipBiText(BaseModel):
    ta: str
    en: str


class SynastryAspect(BaseModel):
    pair: str
    aspect: str
    orb_degrees: float = Field(alias="orbDegrees")
    tone: str
    note: RelationshipBiText

    model_config = ConfigDict(populate_by_name=True)


class SynastryData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    member_id: UUID = Field(alias="memberId")
    score: int
    label: str
    harmony_notes: list[RelationshipBiText] = Field(alias="harmonyNotes")
    tension_notes: list[RelationshipBiText] = Field(alias="tensionNotes")
    key_aspects: list[SynastryAspect] = Field(alias="keyAspects")
    summary: RelationshipBiText

    model_config = ConfigDict(populate_by_name=True)


class SynastryResponse(BaseModel):
    success: bool = True
    data: SynastryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class RelationshipAlertData(BaseModel):
    alert_id: UUID = Field(alias="alertId")
    family_vault_id: UUID = Field(alias="familyVaultId")
    member_id: UUID = Field(alias="memberId")
    trigger_planet: str = Field(alias="triggerPlanet")
    trigger_type: str = Field(alias="triggerType")
    alert_date: date = Field(alias="alertDate")
    is_read: bool = Field(alias="isRead")
    message: RelationshipBiText
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class RelationshipAlertsListData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    unread_only: bool = Field(alias="unreadOnly")
    total_count: int = Field(alias="totalCount")
    items: list[RelationshipAlertData]

    model_config = ConfigDict(populate_by_name=True)


class RelationshipAlertsResponse(BaseModel):
    success: bool = True
    data: RelationshipAlertsListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


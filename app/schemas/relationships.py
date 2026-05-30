from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.dasha import ResponseMeta


# ---------------------------------------------------------------------------
# Porutham (10-kuta compatibility)
# ---------------------------------------------------------------------------

class KutaResult(BaseModel):
    name: str
    name_ta: str = Field(alias="nameTa")
    score: int
    max_score: int = Field(alias="maxScore")
    label: str

    model_config = ConfigDict(populate_by_name=True)


VALID_COMPATIBILITY_CONTEXTS = {"MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY", "GENERAL"}


class PorutthamData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    member_id: UUID = Field(alias="memberId")
    boy_nakshatra: int = Field(alias="boyNakshatra")
    boy_nakshatra_name: str = Field(alias="boyNakshatraName")
    girl_nakshatra: int = Field(alias="girlNakshatra")
    girl_nakshatra_name: str = Field(alias="girlNakshatraName")
    kutas: list[KutaResult]
    total_score: int = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    summary: RelationshipBiText
    compatibility_context: str = Field(default="GENERAL", alias="compatibilityContext")
    context_note: RelationshipBiText | None = Field(default=None, alias="contextNote")

    model_config = ConfigDict(populate_by_name=True)


class PorutthamResponse(BaseModel):
    success: bool = True
    data: PorutthamData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


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


class SynastryTimingIndicator(BaseModel):
    planet: str
    description: RelationshipBiText

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
    timing_indicators: list[SynastryTimingIndicator] = Field(
        default_factory=list, alias="timingIndicators"
    )

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


# ---------------------------------------------------------------------------
# Direct chart-to-chart compare (no vault required)
# ---------------------------------------------------------------------------

class DirectCompareRequest(BaseModel):
    chart_id_a: UUID = Field(alias="chartIdA")
    chart_id_b: UUID = Field(alias="chartIdB")
    compatibility_context: str = Field(default="GENERAL", alias="compatibilityContext")

    model_config = ConfigDict(populate_by_name=True)


class DirectPoruthamData(BaseModel):
    """PorutthamData without vault/member IDs — for direct chart comparison."""
    chart_id_a: UUID = Field(alias="chartIdA")
    chart_id_b: UUID = Field(alias="chartIdB")
    boy_nakshatra: int = Field(alias="boyNakshatra")
    boy_nakshatra_name: str = Field(alias="boyNakshatraName")
    girl_nakshatra: int = Field(alias="girlNakshatra")
    girl_nakshatra_name: str = Field(alias="girlNakshatraName")
    kutas: list[KutaResult]
    total_score: int = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    summary: RelationshipBiText
    compatibility_context: str = Field(default="GENERAL", alias="compatibilityContext")
    context_note: RelationshipBiText | None = Field(default=None, alias="contextNote")

    model_config = ConfigDict(populate_by_name=True)


class DirectPoruthamResponse(BaseModel):
    success: bool = True
    data: DirectPoruthamData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


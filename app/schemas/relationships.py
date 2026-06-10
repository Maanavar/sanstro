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


class NadiDoshaData(BaseModel):
    boy_nadi: str = Field(alias="boyNadi")
    girl_nadi: str = Field(alias="girlNadi")
    has_nadi_dosha: bool = Field(alias="hasNadiDosha")
    cancellations: list[str] = Field(default_factory=list)
    severity: str
    note_ta: str = Field(alias="noteTa")
    note_en: str = Field(alias="noteEn")

    model_config = ConfigDict(populate_by_name=True)


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
    nadi_dosha: NadiDoshaData = Field(alias="nadiDosha")
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
    nadi_dosha: NadiDoshaData = Field(alias="nadiDosha")
    summary: RelationshipBiText
    compatibility_context: str = Field(default="GENERAL", alias="compatibilityContext")
    context_note: RelationshipBiText | None = Field(default=None, alias="contextNote")

    model_config = ConfigDict(populate_by_name=True)


class DirectPoruthamResponse(BaseModel):
    success: bool = True
    data: DirectPoruthamData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Compatibility Intelligence Report (signed users — full 8-level analysis)
# ---------------------------------------------------------------------------

class SevvaiDoshamDetail(BaseModel):
    has_dosham: bool = Field(alias="hasDosham")
    mars_house: int = Field(alias="marsHouse")
    is_cancelled: bool = Field(alias="isCancelled")
    severity: str
    cancellation_reasons: list[str] = Field(default_factory=list, alias="cancellationReasons")
    note_en: str = Field(alias="noteEn")
    note_ta: str = Field(alias="noteTa")
    score: int

    model_config = ConfigDict(populate_by_name=True)


class ChartMarriageStrength(BaseModel):
    seventh_house_rasi: int = Field(alias="seventhHouseRasi")
    seventh_lord: str = Field(alias="seventhLord")
    seventh_lord_house: int = Field(alias="seventhLordHouse")
    seventh_lord_strength: int = Field(alias="seventhLordStrength")
    venus_house: int = Field(alias="venusHouse")
    venus_strength: int = Field(alias="venusStrength")
    jupiter_house: int = Field(alias="jupiterHouse")
    jupiter_strength: int = Field(alias="jupiterStrength")
    has_malefic_in_seventh: bool = Field(alias="hasMaleficInSeventh")
    score: int
    note_en: str = Field(alias="noteEn")
    note_ta: str = Field(alias="noteTa")

    model_config = ConfigDict(populate_by_name=True)


class NavamsaCompatibility(BaseModel):
    person_a_venus_d9: int = Field(alias="personAVenusD9")
    person_b_venus_d9: int = Field(alias="personBVenusD9")
    person_a_seventh_lord_d9: int = Field(alias="personASeventhLordD9")
    person_b_seventh_lord_d9: int = Field(alias="personBSeventhLordD9")
    harmony_label: str = Field(alias="harmonyLabel")
    note_en: str = Field(alias="noteEn")
    note_ta: str = Field(alias="noteTa")
    score: int

    model_config = ConfigDict(populate_by_name=True)


class DashaHarmony(BaseModel):
    person_a_maha_lord: str = Field(alias="personAMahaLord")
    person_a_antar_lord: str = Field(alias="personAantarLord")
    person_a_maha_end: str = Field(alias="personAMahaEnd")
    person_b_maha_lord: str = Field(alias="personBMahaLord")
    person_b_antar_lord: str = Field(alias="personBAntarLord")
    person_b_maha_end: str = Field(alias="personBMahaEnd")
    harmony_label: str = Field(alias="harmonyLabel")
    note_en: str = Field(alias="noteEn")
    note_ta: str = Field(alias="noteTa")
    score: int

    model_config = ConfigDict(populate_by_name=True)


class EmotionalCompatibility(BaseModel):
    moon_moon_harmony: str = Field(alias="moonMoonHarmony")
    venus_mars_harmony: str = Field(alias="venusMarsHarmony")
    communication_note: str = Field(alias="communicationNote")
    note_en: str = Field(alias="noteEn")
    note_ta: str = Field(alias="noteTa")
    score: int

    model_config = ConfigDict(populate_by_name=True)


class CompatibilityScoreBreakdown(BaseModel):
    porutham: int
    seventh_house: int = Field(alias="seventhHouse")
    navamsa: int
    dasha_harmony: int = Field(alias="dashaHarmony")
    dosham_analysis: int = Field(alias="doshamAnalysis")
    emotional: int
    synastry: int

    model_config = ConfigDict(populate_by_name=True)


class CompatibilityIntelligenceData(BaseModel):
    person_a_name: str = Field(alias="personAName")
    person_b_name: str = Field(alias="personBName")

    # Layer 1: Porutham
    porutham_score: int = Field(alias="poruthamScore")
    porutham_max: int = Field(alias="poruthamMax")
    porutham_percentage: float = Field(alias="poruthamPercentage")
    porutham_label: str = Field(alias="poruthamLabel")
    porutham_kutas: list[KutaResult] = Field(default_factory=list, alias="poruthamKutas")
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    nadi_dosha: NadiDoshaData = Field(alias="nadiDosha")

    # Layer 2+3: Chart strength
    chart_a_strength: ChartMarriageStrength = Field(alias="chartAStrength")
    chart_b_strength: ChartMarriageStrength = Field(alias="chartBStrength")

    # Layer 4: Navamsa
    navamsa: NavamsaCompatibility

    # Layer 5: Dosham
    sevvai_a: SevvaiDoshamDetail = Field(alias="sevvaiA")
    sevvai_b: SevvaiDoshamDetail = Field(alias="sevvaiB")

    # Layer 6: Dasha
    dasha_harmony: DashaHarmony = Field(alias="dashaHarmony")

    # Layer 7: Emotional
    emotional: EmotionalCompatibility

    # Layer 8: Synastry
    synastry_score: int = Field(alias="synastryScore")

    # Overall
    overall_score: int = Field(alias="overallScore")
    overall_label: str = Field(alias="overallLabel")
    score_breakdown: CompatibilityScoreBreakdown = Field(alias="scoreBreakdown")
    strengths_en: list[str] = Field(default_factory=list, alias="strengthsEn")
    strengths_ta: list[str] = Field(default_factory=list, alias="strengthsTa")
    risks_en: list[str] = Field(default_factory=list, alias="risksEn")
    risks_ta: list[str] = Field(default_factory=list, alias="risksTa")
    summary: RelationshipBiText

    model_config = ConfigDict(populate_by_name=True)


class CompatibilityIntelligenceResponse(BaseModel):
    success: bool = True
    data: CompatibilityIntelligenceData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


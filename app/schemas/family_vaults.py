from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.birth_profiles import BirthProfileCreate
from app.schemas.daily_guidance import DailyGuidanceWindow
from app.schemas.dasha import ResponseMeta


class FamilyVaultCreate(BaseModel):
    owner_user_id: UUID | None = Field(default=None, alias="ownerUserId")
    name: str = Field(alias="name", min_length=1)
    default_language: str = Field(default="ta-en", alias="defaultLanguage")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    name: str
    default_language: str = Field(alias="defaultLanguage")
    member_count: int = Field(alias="memberCount")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultCreateResponse(BaseModel):
    success: bool = True
    data: FamilyVaultData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultDetailData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    name: str
    default_language: str = Field(alias="defaultLanguage")
    member_count: int = Field(alias="memberCount")
    latest_aggregate_date: date | None = Field(default=None, alias="latestAggregateDate")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultDetailResponse(BaseModel):
    success: bool = True
    data: FamilyVaultDetailData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultListItem(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    name: str
    default_language: str = Field(alias="defaultLanguage")
    member_count: int = Field(alias="memberCount")
    latest_aggregate_date: date | None = Field(default=None, alias="latestAggregateDate")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultListData(BaseModel):
    owner_user_id: UUID = Field(alias="ownerUserId")
    limit: int
    offset: int
    total_count: int = Field(alias="totalCount")
    items: list[FamilyVaultListItem]

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultListResponse(BaseModel):
    success: bool = True
    data: FamilyVaultListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberCreate(BirthProfileCreate):
    member_weight: float = Field(default=1.0, alias="memberWeight", gt=0)

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberUpdate(BaseModel):
    """Editable fields for an existing family member. All fields are optional."""
    display_name: str | None = Field(default=None, alias="displayName", min_length=1)
    relationship_to_owner: str | None = Field(default=None, alias="relationshipToOwner")
    member_weight: float | None = Field(default=None, alias="memberWeight", gt=0)
    gender_for_traditional_rules: str | None = Field(default=None, alias="genderForTraditionalRules")
    birth_time_local: time | None = Field(default=None, alias="birthTimeLocal")
    birth_place: str | None = Field(default=None, alias="birthPlace", min_length=1)
    birth_latitude: float | None = Field(default=None, alias="birthLatitude", ge=-90.0, le=90.0)
    birth_longitude: float | None = Field(default=None, alias="birthLongitude", ge=-180.0, le=180.0)
    birth_timezone: str | None = Field(default=None, alias="birthTimezone", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberData(BaseModel):
    """Read view of a single family member."""
    family_member_id: UUID = Field(alias="familyMemberId")
    family_vault_id: UUID = Field(alias="familyVaultId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    display_name: str = Field(alias="displayName")
    relationship_to_owner: str = Field(alias="relationshipToOwner")
    member_weight: float = Field(alias="memberWeight")
    gender_for_traditional_rules: str = Field(alias="genderForTraditionalRules")
    date_of_birth_local: date | None = Field(default=None, alias="dateOfBirthLocal")
    is_minor: bool = Field(alias="isMinor")
    birth_profile_id: UUID | None = Field(default=None, alias="birthProfileId")

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberResponse(BaseModel):
    success: bool = True
    data: FamilyMemberData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberListData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    total_count: int = Field(alias="totalCount")
    items: list[FamilyMemberData]

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberListResponse(BaseModel):
    success: bool = True
    data: FamilyMemberListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberCreateResult(BaseModel):
    family_member_id: UUID = Field(alias="familyMemberId")
    family_vault_id: UUID = Field(alias="familyVaultId")
    owner_user_id: UUID = Field(alias="ownerUserId")
    display_name: str = Field(alias="displayName")
    relationship_to_owner: str = Field(alias="relationshipToOwner")
    member_weight: float = Field(alias="memberWeight")
    birth_profile_id: UUID = Field(alias="birthProfileId")
    chart_id: UUID | None = Field(default=None, alias="chartId")
    calculation_status: Literal["pending", "completed", "failed"] = Field(
        default="pending", alias="calculationStatus"
    )
    warnings: list[str] = Field(default_factory=list, alias="warnings")

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberCreateResponse(BaseModel):
    success: bool = True
    data: FamilyMemberCreateResult
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyAggregateSummary(BaseModel):
    ta: str
    en: str


class FamilyAggregateMember(BaseModel):
    family_member_id: UUID = Field(alias="familyMemberId")
    display_name: str = Field(alias="displayName")
    birth_profile_id: UUID = Field(alias="birthProfileId")
    chart_id: UUID = Field(alias="chartId")
    individual_score: int = Field(alias="individualScore")
    label: str
    member_weight: float = Field(alias="memberWeight")
    birth_time_confidence_minutes: int = Field(alias="birthTimeConfidenceMinutes")
    active_cycle_tags: list[str] = Field(alias="activeCycleTags")
    best_windows: list[DailyGuidanceWindow] = Field(alias="bestWindows")
    caution_windows: list[DailyGuidanceWindow] = Field(alias="cautionWindows")

    model_config = ConfigDict(populate_by_name=True)


class FamilyAggregateBreakdown(BaseModel):
    weighted_mean: float = Field(alias="weightedMean")
    mean_score: float = Field(alias="meanScore")
    lowest_score: int = Field(alias="lowestScore")
    highest_score: int = Field(alias="highestScore")
    total_weight: float = Field(alias="totalWeight")
    low_score_count: int = Field(alias="lowScoreCount")
    chandrashtama_count: int = Field(alias="chandrashtamaCount")
    major_sani_count: int = Field(alias="majorSaniCount")
    health_preventive_nudge_count: int = Field(alias="healthPreventiveNudgeCount")
    support_need_index: int = Field(alias="supportNeedIndex")
    decision_readiness_index: int = Field(alias="decisionReadinessIndex")
    common_good_window_bonus: int = Field(alias="commonGoodWindowBonus")
    rahu_yama_overlap_penalty: int = Field(alias="rahuYamaOverlapPenalty")
    key_member_low_score_penalty: int = Field(alias="keyMemberLowScorePenalty")

    model_config = ConfigDict(populate_by_name=True)


class FamilyAggregateData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    date_local: date = Field(alias="dateLocal")
    timezone: str
    family_score: int = Field(alias="familyScore")
    family_label: str = Field(alias="familyLabel")
    members: list[FamilyAggregateMember]
    aggregate_breakdown: FamilyAggregateBreakdown = Field(alias="aggregateBreakdown")
    best_family_windows: list[DailyGuidanceWindow] = Field(alias="bestFamilyWindows")
    avoid_for_family_decisions: list[DailyGuidanceWindow] = Field(alias="avoidForFamilyDecisions")
    summary: FamilyAggregateSummary

    model_config = ConfigDict(populate_by_name=True)


class FamilyAggregateResponse(BaseModel):
    success: bool = True
    data: FamilyAggregateData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilySummaryData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    date_local: date = Field(alias="dateLocal")
    family_score: int = Field(alias="familyScore")
    family_label: str = Field(alias="familyLabel")
    summary: FamilyAggregateSummary
    best_family_windows: list[DailyGuidanceWindow] = Field(alias="bestFamilyWindows")
    avoid_for_family_decisions: list[DailyGuidanceWindow] = Field(alias="avoidForFamilyDecisions")

    model_config = ConfigDict(populate_by_name=True)


class FamilySummaryResponse(BaseModel):
    success: bool = True
    data: FamilySummaryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyCalendarItem(BaseModel):
    date_local: date = Field(alias="dateLocal")
    family_score: int = Field(alias="familyScore")
    family_label: str = Field(alias="familyLabel")
    best_family_windows: list[DailyGuidanceWindow] = Field(alias="bestFamilyWindows")
    avoid_for_family_decisions: list[DailyGuidanceWindow] = Field(alias="avoidForFamilyDecisions")
    summary: FamilyAggregateSummary

    model_config = ConfigDict(populate_by_name=True)


class FamilyCalendarData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    from_date: date = Field(alias="fromDate")
    to_date: date = Field(alias="toDate")
    items: list[FamilyCalendarItem]

    model_config = ConfigDict(populate_by_name=True)


class FamilyCalendarResponse(BaseModel):
    success: bool = True
    data: FamilyCalendarData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyMemberDayView(BaseModel):
    profile_id: UUID = Field(alias="profileId")
    chart_id: UUID = Field(alias="chartId")
    name: str
    relationship: str
    score: int
    label: str
    highlight_ta: str = Field(alias="highlightTa")
    highlight_en: str = Field(alias="highlightEn")
    chandrashtama: bool
    sani_cycle_active: bool = Field(alias="saniCycleActive")
    sani_cycle_type: str | None = Field(default=None, alias="saniCycleType")
    nalla_neram_start: str = Field(alias="nallaNeramStart")
    rahu_kalam_start: str = Field(alias="rahuKalamStart")
    rahu_kalam_end: str = Field(alias="rahuKalamEnd")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultTodayData(BaseModel):
    vault_id: UUID = Field(alias="vaultId")
    date_local: date = Field(alias="dateLocal")
    members: list[FamilyMemberDayView]

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultTodayResponse(BaseModel):
    success: bool = True
    data: FamilyVaultTodayData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

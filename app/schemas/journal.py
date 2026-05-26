from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.dasha import ResponseMeta

VALID_LIFE_AREAS = {
    "career",
    "relationship",
    "health",
    "family",
    "finance",
    "education",
    "spiritual",
    "general",
}

VALID_SCORE_LABELS = {
    "STRONG_SUPPORT",
    "GOOD",
    "BALANCED",
    "CAUTION",
    "RESTORATIVE",
}


class JournalCreateRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    entry_date: date = Field(alias="entryDate")
    life_area: str = Field(default="general", alias="lifeArea")
    note_text: str = Field(alias="noteText", min_length=3, max_length=2000)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("life_area")
    @classmethod
    def validate_life_area(cls, value: str) -> str:
        if value not in VALID_LIFE_AREAS:
            raise ValueError(f"life_area must be one of: {sorted(VALID_LIFE_AREAS)}")
        return value


class JournalUpdateRequest(BaseModel):
    entry_date: date | None = Field(default=None, alias="entryDate")
    life_area: str | None = Field(default=None, alias="lifeArea")
    note_text: str | None = Field(default=None, alias="noteText", min_length=3, max_length=2000)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("life_area")
    @classmethod
    def validate_life_area(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in VALID_LIFE_AREAS:
            raise ValueError(f"life_area must be one of: {sorted(VALID_LIFE_AREAS)}")
        return value


class JournalAnchorData(BaseModel):
    active_dasha: str = Field(alias="activeDasha")
    moon_house_from_moon: int = Field(alias="moonHouseFromMoon")
    saturn_house_from_moon: int = Field(alias="saturnHouseFromMoon")
    moon_rasi: str = Field(alias="moonRasi")
    saturn_rasi: str = Field(alias="saturnRasi")

    model_config = ConfigDict(populate_by_name=True)


class JournalEntryData(BaseModel):
    journal_id: UUID = Field(alias="journalId")
    chart_id: UUID = Field(alias="chartId")
    entry_date: date = Field(alias="entryDate")
    life_area: str = Field(alias="lifeArea")
    note_text: str = Field(alias="noteText")
    tags: list[str]
    anchor: JournalAnchorData
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class JournalCreateResponse(BaseModel):
    success: bool = True
    data: JournalEntryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalListData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    total_count: int = Field(alias="totalCount")
    items: list[JournalEntryData]

    model_config = ConfigDict(populate_by_name=True)


class JournalListResponse(BaseModel):
    success: bool = True
    data: JournalListData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalDeleteData(BaseModel):
    journal_id: UUID = Field(alias="journalId")
    deleted_at: datetime = Field(alias="deletedAt")

    model_config = ConfigDict(populate_by_name=True)


class JournalDeleteResponse(BaseModel):
    success: bool = True
    data: JournalDeleteData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalRetentionApplyRequest(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    keep_days: int | None = Field(default=None, alias="keepDays", ge=7, le=3650)
    as_of_date: date | None = Field(default=None, alias="asOfDate")
    dry_run: bool = Field(default=False, alias="dryRun")

    model_config = ConfigDict(populate_by_name=True)


class JournalRetentionApplyData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    keep_days: int = Field(alias="keepDays")
    threshold_date: date = Field(alias="thresholdDate")
    matched_count: int = Field(alias="matchedCount")
    archived_count: int = Field(alias="archivedCount")
    dry_run: bool = Field(alias="dryRun")

    model_config = ConfigDict(populate_by_name=True)


class JournalRetentionApplyResponse(BaseModel):
    success: bool = True
    data: JournalRetentionApplyData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalPromptText(BaseModel):
    ta: str
    en: str


class JournalPromptItem(BaseModel):
    prompt_id: str = Field(alias="promptId")
    category: str
    text: JournalPromptText

    model_config = ConfigDict(populate_by_name=True)


class JournalPromptsData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")
    life_area: str = Field(alias="lifeArea")
    score_label: str = Field(alias="scoreLabel")
    prompts: list[JournalPromptItem]

    model_config = ConfigDict(populate_by_name=True)


class JournalPromptsResponse(BaseModel):
    success: bool = True
    data: JournalPromptsData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class JournalExportEntryData(BaseModel):
    journal_id: UUID = Field(alias="journalId")
    chart_id: UUID = Field(alias="chartId")
    entry_date: date = Field(alias="entryDate")
    life_area: str = Field(alias="lifeArea")
    note_text: str = Field(alias="noteText")
    tags: list[str]
    anchor: JournalAnchorData
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    deleted_at: datetime | None = Field(default=None, alias="deletedAt")

    model_config = ConfigDict(populate_by_name=True)


class JournalExportData(BaseModel):
    owner_user_id: UUID = Field(alias="ownerUserId")
    chart_id: UUID | None = Field(default=None, alias="chartId")
    from_date: date | None = Field(default=None, alias="fromDate")
    to_date: date | None = Field(default=None, alias="toDate")
    include_archived: bool = Field(alias="includeArchived")
    total_count: int = Field(alias="totalCount")
    items: list[JournalExportEntryData]

    model_config = ConfigDict(populate_by_name=True)


class JournalExportResponse(BaseModel):
    success: bool = True
    data: JournalExportData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalEntryData(BaseModel):
    journal_id: UUID = Field(alias="journalId")
    family_vault_id: UUID = Field(alias="familyVaultId")
    family_member_id: UUID = Field(alias="familyMemberId")
    member_display_name: str = Field(alias="memberDisplayName")
    birth_profile_id: UUID = Field(alias="birthProfileId")
    chart_id: UUID = Field(alias="chartId")
    entry_date: date = Field(alias="entryDate")
    life_area: str = Field(alias="lifeArea")
    note_text: str = Field(alias="noteText")
    tags: list[str]
    created_at: datetime = Field(alias="createdAt")
    deleted_at: datetime | None = Field(default=None, alias="deletedAt")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    include_archived: bool = Field(alias="includeArchived")
    total_count: int = Field(alias="totalCount")
    items: list[FamilyVaultJournalEntryData]

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalResponse(BaseModel):
    success: bool = True
    data: FamilyVaultJournalData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalLifeAreaCount(BaseModel):
    life_area: str = Field(alias="lifeArea")
    count: int

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalSummaryData(BaseModel):
    family_vault_id: UUID = Field(alias="familyVaultId")
    include_archived: bool = Field(alias="includeArchived")
    from_date: date | None = Field(default=None, alias="fromDate")
    to_date: date | None = Field(default=None, alias="toDate")
    total_entries: int = Field(alias="totalEntries")
    life_area_counts: list[FamilyVaultJournalLifeAreaCount] = Field(alias="lifeAreaCounts")

    model_config = ConfigDict(populate_by_name=True)


class FamilyVaultJournalSummaryResponse(BaseModel):
    success: bool = True
    data: FamilyVaultJournalSummaryData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)

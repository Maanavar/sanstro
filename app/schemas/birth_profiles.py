from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BirthProfileCreate(BaseModel):
    owner_user_id: UUID | None = Field(default=None, alias="ownerUserId")
    family_vault_id: UUID | None = Field(default=None, alias="familyVaultId")
    family_member_id: UUID | None = Field(default=None, alias="familyMemberId")
    relationship_to_owner: Literal["self", "spouse", "child", "parent", "sibling", "grandparent", "other"] = Field(
        default="self", alias="relationshipToOwner"
    )
    display_name: str = Field(alias="displayName", min_length=1)
    birth_date_local: date = Field(alias="birthDateLocal")
    birth_time_local: time | None = Field(default=None, alias="birthTimeLocal")
    birth_place: str = Field(alias="birthPlace", min_length=1)
    birth_latitude: float = Field(alias="birthLatitude", ge=-90.0, le=90.0)
    birth_longitude: float = Field(alias="birthLongitude", ge=-180.0, le=180.0)
    birth_timezone: str = Field(alias="birthTimezone", min_length=1)
    birth_time_source: str = Field(default="unknown", alias="birthTimeSource")
    birth_time_confidence_minutes: int = Field(default=0, alias="birthTimeConfidenceMinutes", ge=0)
    calendar_input_type: str = Field(default="gregorian", alias="calendarInputType")
    calculate_now: bool = Field(default=True, alias="calculateNow")
    language_preference: str = Field(default="ta-en", alias="languagePreference")
    gender_for_traditional_rules: str | None = Field(default=None, alias="genderForTraditionalRules")

    model_config = ConfigDict(populate_by_name=True)


class BirthProfileResponse(BirthProfileCreate):
    birth_profile_id: UUID = Field(alias="birthProfileId")
    birth_datetime_utc: datetime | None = Field(default=None, alias="birthDatetimeUtc")
    calculation_status: Literal["pending", "completed", "failed"] = Field(default="pending", alias="calculationStatus")
    warnings: list[str] = Field(default_factory=list, alias="warnings")

    model_config = ConfigDict(populate_by_name=True)


class BirthProfileCreateResult(BaseModel):
    birth_profile_id: UUID = Field(alias="birthProfileId")
    chart_id: UUID | None = Field(default=None, alias="chartId")
    calculation_status: Literal["pending", "completed", "failed"] = Field(default="pending", alias="calculationStatus")
    warnings: list[str] = Field(default_factory=list, alias="warnings")

    model_config = ConfigDict(populate_by_name=True)


class BirthProfileResponseMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = ConfigDict(populate_by_name=True)


class BirthProfileCreateResponse(BaseModel):
    success: bool = True
    data: BirthProfileCreateResult
    meta: BirthProfileResponseMeta

    model_config = ConfigDict(populate_by_name=True)


class BirthProfileGetResponse(BaseModel):
    success: bool = True
    data: BirthProfileResponse
    meta: BirthProfileResponseMeta

    model_config = ConfigDict(populate_by_name=True)

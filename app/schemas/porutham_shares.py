from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.birth_profiles import _validate_birth_date_bounds  # noqa: PLC2701 (shared validation)
from app.schemas.dasha import ResponseMeta
from app.schemas.relationships import KutaResult, NadiDoshaData, RelationshipBiText

# ---------------------------------------------------------------------------
# Create — authenticated
# ---------------------------------------------------------------------------


class PoruthamShareBirthInput(BaseModel):
    """Birth details for a share-source person. No display name — public
    content must never carry a real stored name (see labelA/labelB below)."""

    birth_date_local: date = Field(alias="birthDateLocal")
    birth_time_local: time | None = Field(alias="birthTimeLocal", default=None)
    birth_latitude: float = Field(alias="birthLatitude")
    birth_longitude: float = Field(alias="birthLongitude")
    birth_timezone: str = Field(alias="birthTimezone", default="Asia/Kolkata")
    birth_place: str = Field(alias="birthPlace", default="")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("birth_date_local")
    @classmethod
    def validate_birth_date_local(cls, value: date) -> date:
        return _validate_birth_date_bounds(value)


class CreatePoruthamShareRequest(BaseModel):
    person_a: PoruthamShareBirthInput = Field(alias="personA")
    person_b: PoruthamShareBirthInput = Field(alias="personB")
    compatibility_context: str = Field(alias="compatibilityContext", default="MARRIAGE")
    label_a: str | None = Field(alias="labelA", default=None)
    label_b: str | None = Field(alias="labelB", default=None)

    model_config = ConfigDict(populate_by_name=True)


class CreatePoruthamShareData(BaseModel):
    share_id: str = Field(alias="shareId")
    token: str
    url: str
    expires_at: datetime = Field(alias="expiresAt")
    label_a: str | None = Field(alias="labelA", default=None)
    label_b: str | None = Field(alias="labelB", default=None)

    model_config = ConfigDict(populate_by_name=True)


class CreatePoruthamShareResponse(BaseModel):
    success: bool = True
    data: CreatePoruthamShareData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# View — public, no auth
# ---------------------------------------------------------------------------


class PoruthamShareViewData(BaseModel):
    label_a: str | None = Field(alias="labelA", default=None)
    label_b: str | None = Field(alias="labelB", default=None)
    boy_nakshatra: int = Field(alias="boyNakshatra")
    boy_nakshatra_name: str = Field(alias="boyNakshatraName")
    girl_nakshatra: int = Field(alias="girlNakshatra")
    girl_nakshatra_name: str = Field(alias="girlNakshatraName")
    kutas: list[KutaResult]
    # float since 2026-08-31: a madhyama contributes 0.5. Rendered via
    # `format_porutham_total` so a whole score never reads "8.0/10".
    total_score: float = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    nadi_dosha: NadiDoshaData = Field(alias="nadiDosha")
    summary: RelationshipBiText
    compatibility_context: str = Field(alias="compatibilityContext")
    context_note: RelationshipBiText | None = Field(default=None, alias="contextNote")
    created_at: datetime = Field(alias="createdAt")
    expires_at: datetime = Field(alias="expiresAt")

    model_config = ConfigDict(populate_by_name=True)


class PoruthamShareViewResponse(BaseModel):
    success: bool = True
    data: PoruthamShareViewData

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Revoke — authenticated, owner-only
# ---------------------------------------------------------------------------


class RevokePoruthamShareData(BaseModel):
    share_id: str = Field(alias="shareId")
    revoked_at: datetime = Field(alias="revokedAt")

    model_config = ConfigDict(populate_by_name=True)


class RevokePoruthamShareResponse(BaseModel):
    success: bool = True
    data: RevokePoruthamShareData

    model_config = ConfigDict(populate_by_name=True)

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _EMAIL_RE.match(normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    model_config = ConfigDict(populate_by_name=True)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _EMAIL_RE.match(normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _EMAIL_RE.match(normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=4096)
    password: str = Field(min_length=8, max_length=255)


class AuthUserResponse(BaseModel):
    user_id: str = Field(alias="userId")
    email: str
    user_mode: Literal["BEGINNER", "BALANCED", "TRADITIONAL"] = Field(default="BALANCED", alias="userMode")
    goal_track: Literal["CAREER", "EXAM", "RELATIONSHIP", "FINANCIAL"] | None = Field(default=None, alias="goalTrack")
    lang: Literal["ta", "en"] = Field(default="en")
    #: Derived live from the Subscription table via ``app.core.subscription.is_premium``
    #: — never a stored flag on the user (GROWTH_FEATURES.md decision #8).
    #:
    #: Added 2026-07-27. ``packages/shared/src/api/auth.ts::MeResponse`` had
    #: declared ``tier`` since it was written, and no route had ever sent it, so
    #: ``mobile/app/_layout.tsx`` stored ``undefined`` as the session tier
    #: whenever RevenueCat was unavailable or reported no entitlement. Caught by
    #: ``tests/test_api_wrapper_field_contract.py``, which compares wrapper
    #: interfaces against this schema.
    #:
    #: Defaulted rather than required so a future construction site cannot fail
    #: to serialise; every current site passes it explicitly, and the safe
    #: default is the *lower* privilege.
    tier: Literal["registered", "premium"] = Field(default="registered")

    model_config = ConfigDict(populate_by_name=True)


class UpdateUserSettingsRequest(BaseModel):
    user_mode: Literal["BEGINNER", "BALANCED", "TRADITIONAL"] | None = Field(default=None, alias="userMode")
    goal_track: Literal["CAREER", "EXAM", "RELATIONSHIP", "FINANCIAL"] | None = Field(default=None, alias="goalTrack")

    model_config = ConfigDict(populate_by_name=True)


class RegisterResponse(BaseModel):
    detail: str


class ForgotPasswordResponse(BaseModel):
    detail: str


class AccountDeletionResult(BaseModel):
    detail: str


class AuthProvidersResponse(BaseModel):
    google: bool

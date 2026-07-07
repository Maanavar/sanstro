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
    lang: Literal["ta", "en"] = Field(default="ta")

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

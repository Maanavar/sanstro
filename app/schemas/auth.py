from __future__ import annotations

import re
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

CONSENT_REQUIRED_MESSAGE = "You must accept the privacy policy to create an account."


def require_true_consent(value: bool) -> bool:
    """Reject anything that is not exactly True.

    Shared by every schema that captures consent — including
    ``MobileRegisterRequest``, which lives in ``app/api/mobile_auth.py`` and is a
    separate route with a separate schema. DPDP §6 applies to a registration
    equally whichever client made it, and a second copy of this rule is a second
    place for it to quietly diverge.

    ``is not True`` rather than ``not value``: pydantic coerces, and this must not
    accept a truthy stand-in for an affirmative action the user took.
    """
    if value is not True:
        raise ValueError(CONSENT_REQUIRED_MESSAGE)
    return value


#: The consent field's type, so every schema that captures consent gets the same
#: rule by declaring the same type. An ``Annotated`` alias rather than a
#: ``field_validator`` per schema: a validator declared in a class body is bound
#: as a method, so sharing one across classes needs this indirection anyway, and
#: this way the rule travels with the type instead of being re-attached by hand.
ConsentGiven = Annotated[bool, AfterValidator(require_true_consent)]


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=255)
    #: DPDP Act 2023 §6 requires a specific, unambiguous consent *action* before
    #: personal data is collected. So this has no default: a client that omits it
    #: is rejected rather than treated as consenting, and a pre-ticked box on the
    #: form would not be an action the user took.
    consent_given: ConsentGiven = Field(alias="consentGiven")

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
    #: True when the client should show the consent panel: the user has never
    #: consented, or consented to a policy version older than the live one.
    #: One boolean rather than two, because the product response is the same and
    #: a caller that had to distinguish them would eventually forget one.
    #:
    #: Defaults True — the fail-safe direction. A construction site that forgets
    #: to pass it asks a consenting user once more; the opposite default would
    #: silently skip the ask for someone who never consented at all.
    consent_required: bool = Field(default=True, alias="consentRequired")

    model_config = ConfigDict(populate_by_name=True)


class ConsentRequest(BaseModel):
    """Consent recorded by an existing session, not at registration."""

    consent_given: ConsentGiven = Field(alias="consentGiven")

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

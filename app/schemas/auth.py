from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.subscription import access_for_user, is_premium, open_beta_active

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

ADULT_REQUIRED_MESSAGE = "You must confirm you are 18 or older to create an account."


def require_adult_declaration(value: bool) -> bool:
    """The 18+ self-declaration (spec L2, D-12): exactly True, like consent."""
    if value is not True:
        raise ValueError(ADULT_REQUIRED_MESSAGE)
    return value


AdultConfirmed = Annotated[bool, AfterValidator(require_adult_declaration)]


class OptionalConsents(BaseModel):
    """The optional purposes P2–P4 (D-10). Every one defaults off: no pre-ticked boxes."""

    updates: bool = False
    analytics: bool = False
    ask_improve: bool = Field(default=False, alias="askImprove")

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class ConsentState(BaseModel):
    """The latest answer per purpose (`app.privacy.consent.current_consents`)."""

    service: bool = False
    updates: bool = False
    analytics: bool = False
    ask_improve: bool = Field(default=False, alias="askImprove")

    model_config = ConfigDict(populate_by_name=True)


class ConsentUpdateRequest(BaseModel):
    """Settings toggles. Only the purposes sent are recorded.

    `service` is not a field, and unknown fields are refused: withdrawing the
    service consent is erasing the account (`DELETE /auth/me`).
    """

    updates: bool | None = None
    analytics: bool | None = None
    ask_improve: bool | None = Field(default=None, alias="askImprove")
    lang: Literal["ta", "en"] = "en"

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=255)
    #: DPDP Act 2023 §6 requires a specific, unambiguous consent *action* before
    #: personal data is collected. So this has no default: a client that omits it
    #: is rejected rather than treated as consenting, and a pre-ticked box on the
    #: form would not be an action the user took.
    consent_given: ConsentGiven = Field(alias="consentGiven")
    #: Spec L2, D-12: account holders are 18+. No default, for the same reason.
    adult_confirmed: AdultConfirmed = Field(alias="adultConfirmed")
    consents: OptionalConsents = Field(default_factory=OptionalConsents)
    #: The language the notice was shown in; recorded with each answer.
    lang: Literal["ta", "en"] = "en"

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
    #: True while the open beta runs (``settings.open_beta``). The server already
    #: holds a beta account to premium's limits (``limits_for_user``); this tells
    #: the client to unlock the same features and to show no upgrade prompt.
    #: Kept beside ``tier`` rather than folded into it, so ``tier`` stays the
    #: subscription fact and the day the beta ends needs no data migration.
    #: Read from settings, not passed per site, so no construction site can
    #: disagree with the server's own gating.
    open_beta: bool = Field(default_factory=open_beta_active, alias="openBeta")
    #: True when the client should show the consent panel: the user has never
    #: consented, or consented to a policy version older than the live one.
    #: One boolean rather than two, because the product response is the same and
    #: a caller that had to distinguish them would eventually forget one.
    #:
    #: Defaults True — the fail-safe direction. A construction site that forgets
    #: to pass it asks a consenting user once more; the opposite default would
    #: silently skip the ask for someone who never consented at all.
    consent_required: bool = Field(default=True, alias="consentRequired")
    #: The address has been proven (verification link, or Google SSO). The
    #: trial starts on verification and the client nudges until it is true.
    #: Defaults False — the lower privilege.
    email_verified: bool = Field(default=False, alias="emailVerified")
    #: free / trial / premium (``app.core.subscription.access_for_user``). Unlike
    #: ``tier`` this counts the seven-day trial and courtesy grants, so it is what
    #: a client gates features on (``effectiveTier`` in constants/tiers.ts).
    #: Defaults "free" — the lower privilege.
    access_state: Literal["free", "trial", "premium"] = Field(default="free", alias="accessState")
    #: When the trial ends (UTC); null unless ``accessState`` is "trial".
    trial_ends_at: datetime | None = Field(default=None, alias="trialEndsAt")
    #: Per-purpose consent (spec L2). Defaults all off — the fail-safe
    #: direction: a construction site that forgets it stops analytics
    #: identification rather than starting it.
    consents: ConsentState = Field(default_factory=ConsentState)
    #: The account holder has declared they are 18 or older.
    adult_declared: bool = Field(default=False, alias="adultDeclared")

    model_config = ConfigDict(populate_by_name=True)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=10, max_length=2048)


class VerifyEmailResponse(BaseModel):
    verified: bool
    detail: str


class ConsentRequest(BaseModel):
    """Consent recorded by an existing session, not at registration (the consent panel).

    `adultConfirmed` is required (True) only while the account has not declared
    it yet; the route checks. `consents`, when sent, records the optional
    purposes as shown on the panel.
    """

    consent_given: ConsentGiven = Field(alias="consentGiven")
    adult_confirmed: bool | None = Field(default=None, alias="adultConfirmed")
    consents: OptionalConsents | None = None
    lang: Literal["ta", "en"] = "en"

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


def access_response_fields(user_id: UUID, session: Session) -> dict[str, Any]:
    """`tier`, `accessState` and `trialEndsAt` for an AuthUserResponse.

    One helper for every construction site (web auth, mobile auth), so a new
    site cannot report the subscription and forget the trial.
    """
    access = access_for_user(user_id, session)
    return {
        "tier": "premium" if is_premium(user_id, session) else "registered",
        "accessState": access.state,
        "trialEndsAt": access.trial_ends_at,
    }


def consent_response_fields(user: Any, session: Session) -> dict[str, Any]:
    """`consents` and `adultDeclared` for an AuthUserResponse (spec L2).

    Beside `access_response_fields` for the same reason: one helper per group of
    fields, so no construction site reports one half and forgets the other.
    """
    from app.privacy.consent import current_consents

    state = current_consents(session, user.user_id)
    return {
        "consents": ConsentState(
            service=state["service"],
            updates=state["updates"],
            analytics=state["analytics"],
            askImprove=state["ask_improve"],
        ),
        "adultDeclared": getattr(user, "adult_declared_at", None) is not None,
    }

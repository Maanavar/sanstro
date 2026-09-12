"""Stable, bilingual API error codes.

Error codes are API contract values. Add new values when needed; never rename or
reuse a value that has reached a client. The English ``detail`` field remains in
responses for compatibility, while clients should render ``message`` in their
active language.

Because renaming is forbidden, **one concept gets exactly one code**. Two codes
meaning the same thing is not a redundancy a client can ignore — every client
must then branch on both, forever. If an existing code covers the case, reuse it
rather than adding a better-worded synonym.
"""
from __future__ import annotations

from enum import Enum
from typing import TypedDict


class BilingualMessage(TypedDict):
    ta: str
    en: str


class ErrorMessageDefinition(TypedDict):
    status: int
    message: BilingualMessage
    user_message: str
    technical: str


class ErrorCode(str, Enum):
    """Error codes that can safely be handled without parsing English prose."""

    # Generic and resource lookup failures.
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    BIRTH_PROFILE_NOT_FOUND = "BIRTH_PROFILE_NOT_FOUND"
    CHART_NOT_FOUND = "CHART_NOT_FOUND"
    FAMILY_VAULT_NOT_FOUND = "FAMILY_VAULT_NOT_FOUND"
    FAMILY_MEMBER_NOT_FOUND = "FAMILY_MEMBER_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    JOURNAL_ENTRY_NOT_FOUND = "JOURNAL_ENTRY_NOT_FOUND"
    GOAL_NOT_FOUND = "GOAL_NOT_FOUND"
    FEEDBACK_NOT_FOUND = "FEEDBACK_NOT_FOUND"

    # Authentication and authorization.
    ACCESS_DENIED = "ACCESS_DENIED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    ELEVATION_REQUIRED = "ELEVATION_REQUIRED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    SESSION_INVALID = "SESSION_INVALID"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"  # noqa: S105 - client-visible code, never a credential
    TOKEN_INVALID = "TOKEN_INVALID"  # noqa: S105 - client-visible code, never a credential
    TOKEN_REVOKED = "TOKEN_REVOKED"  # noqa: S105 - client-visible code, never a credential

    # Limits and conflicts.
    PROFILE_LIMIT_REACHED = "PROFILE_LIMIT_REACHED"
    RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED"
    # RATE_LIMITED: too many requests too quickly — retry after a pause.
    # DAILY_LIMIT_REACHED: the day's quota is spent — retrying will not help.
    # Both are 429 and they need different UI, so they are separate codes.
    RATE_LIMITED = "RATE_LIMITED"
    DAILY_LIMIT_REACHED = "DAILY_LIMIT_REACHED"
    # Already emitted as detail={"error": "MONTHLY_LIMIT_REACHED"} by the
    # Ask Vinaadi premium quota; named here so it types rather than degrading.
    MONTHLY_LIMIT_REACHED = "MONTHLY_LIMIT_REACHED"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"

    # Caller-correctable input errors.
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    BIRTH_TIME_REQUIRED = "BIRTH_TIME_REQUIRED"
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"
    MISSING_DATA = "MISSING_DATA"
    INVALID_FORMAT = "INVALID_FORMAT"
    VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE"
    MISSING_MOON_DATA = "MISSING_MOON_DATA"
    MISSING_SUN_DATA = "MISSING_SUN_DATA"

    # Service failures.
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


def _entry(http_status: int, ta: str, en: str, technical: str) -> ErrorMessageDefinition:
    return {
        "status": http_status,
        "message": {"ta": ta, "en": en},
        "user_message": en,
        "technical": technical,
    }


ERROR_MESSAGES: dict[ErrorCode, ErrorMessageDefinition] = {
    ErrorCode.RESOURCE_NOT_FOUND: _entry(404, "கோரிய தகவல் கிடைக்கவில்லை.", "The requested resource was not found.", "Resource not found."),
    ErrorCode.BIRTH_PROFILE_NOT_FOUND: _entry(404, "பிறப்புத் தகவல் கிடைக்கவில்லை.", "The birth profile was not found.", "Birth profile not found."),
    ErrorCode.CHART_NOT_FOUND: _entry(404, "ஜாதகம் கிடைக்கவில்லை.", "The birth chart was not found.", "Chart not found."),
    ErrorCode.FAMILY_VAULT_NOT_FOUND: _entry(404, "குடும்பப் பெட்டகம் கிடைக்கவில்லை.", "The family vault was not found.", "Family vault not found."),
    ErrorCode.FAMILY_MEMBER_NOT_FOUND: _entry(404, "குடும்ப உறுப்பினர் கிடைக்கவில்லை.", "The family member was not found.", "Family member not found."),
    ErrorCode.USER_NOT_FOUND: _entry(404, "பயனர் கிடைக்கவில்லை.", "The user was not found.", "User not found."),
    ErrorCode.JOURNAL_ENTRY_NOT_FOUND: _entry(404, "குறிப்பேட்டு பதிவு கிடைக்கவில்லை.", "The journal entry was not found.", "Journal entry not found."),
    ErrorCode.GOAL_NOT_FOUND: _entry(404, "இலக்கு கிடைக்கவில்லை.", "The goal was not found.", "Goal not found."),
    ErrorCode.FEEDBACK_NOT_FOUND: _entry(404, "கருத்துப் பதிவு கிடைக்கவில்லை.", "The feedback entry was not found.", "Feedback not found."),
    ErrorCode.ACCESS_DENIED: _entry(403, "இந்தத் தகவலை அணுக உங்களுக்கு அனுமதி இல்லை.", "You do not have permission to access this resource.", "Access denied."),
    ErrorCode.PERMISSION_DENIED: _entry(403, "இந்தச் செயலைச் செய்ய உங்களுக்கு அனுமதி இல்லை.", "You do not have permission to perform this action.", "Permission denied."),
    ErrorCode.ELEVATION_REQUIRED: _entry(403, "இந்த நிர்வாகச் செயலுக்கு மீண்டும் உறுதிப்படுத்தல் தேவை.", "Please re-authenticate before this administrative action.", "Admin elevation required."),
    ErrorCode.ACCOUNT_SUSPENDED: _entry(403, "இந்தக் கணக்கு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது.", "This account has been suspended.", "Account suspended."),
    ErrorCode.NOT_AUTHENTICATED: _entry(401, "தொடர உள்நுழையவும்.", "Please log in to continue.", "Not authenticated."),
    ErrorCode.SESSION_INVALID: _entry(401, "உங்கள் அமர்வு செல்லுபடியாக இல்லை. மீண்டும் உள்நுழையவும்.", "Your session is invalid. Please log in again.", "Session invalid."),
    ErrorCode.TOKEN_EXPIRED: _entry(401, "உங்கள் அமர்வு முடிந்துவிட்டது. மீண்டும் உள்நுழையவும்.", "Your session has expired. Please log in again.", "Token expired."),
    ErrorCode.TOKEN_INVALID: _entry(401, "உங்கள் அமர்வு செல்லுபடியாக இல்லை. மீண்டும் உள்நுழையவும்.", "Your session is invalid. Please log in again.", "Token invalid."),
    ErrorCode.TOKEN_REVOKED: _entry(401, "உங்கள் அமர்வு நிறுத்தப்பட்டுள்ளது. மீண்டும் உள்நுழையவும்.", "Your session has been revoked. Please log in again.", "Token revoked."),
    ErrorCode.PROFILE_LIMIT_REACHED: _entry(409, "உங்கள் பிறப்புத் தகவல் வரம்பை அடைந்துவிட்டீர்கள்.", "You have reached your birth-profile limit.", "Profile limit reached."),
    ErrorCode.RESOURCE_LIMIT_EXCEEDED: _entry(409, "உங்கள் திட்ட வரம்பை அடைந்துவிட்டீர்கள்.", "You have reached a plan limit.", "Resource limit exceeded."),
    ErrorCode.RATE_LIMITED: _entry(429, "மிக விரைவாக கோரிக்கைகள் வருகின்றன. சிறிது நேரம் கழித்து முயற்சிக்கவும்.", "Too many requests. Please wait a moment and try again.", "Rate limited."),
    ErrorCode.DAILY_LIMIT_REACHED: _entry(429, "இன்றைக்கான வரம்பை அடைந்துவிட்டீர்கள். நாளை மீண்டும் முயற்சிக்கவும்.", "You have reached today's limit. Please try again tomorrow.", "Daily limit reached."),
    ErrorCode.MONTHLY_LIMIT_REACHED: _entry(429, "இந்த மாதத்திற்கான வரம்பை அடைந்துவிட்டீர்கள்.", "You have reached this month's limit.", "Monthly limit reached."),
    ErrorCode.DUPLICATE_RESOURCE: _entry(409, "இதே தகவல் ஏற்கனவே உள்ளது.", "This resource already exists.", "Duplicate resource."),
    ErrorCode.EMAIL_ALREADY_EXISTS: _entry(409, "இந்த மின்னஞ்சலுடன் ஏற்கனவே ஒரு கணக்கு உள்ளது.", "An account with this email already exists.", "Email already exists."),
    ErrorCode.VALIDATION_ERROR: _entry(422, "உள்ளிட்ட தகவலைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", "Please check the information entered and try again.", "Validation error."),
    ErrorCode.INVALID_INPUT: _entry(422, "உள்ளிட்ட தகவல் சரியல்ல.", "The information entered is invalid.", "Invalid input."),
    ErrorCode.MISSING_REQUIRED_FIELD: _entry(422, "தேவையான தகவல் விடுபட்டுள்ளது.", "Required information is missing.", "Required field missing."),
    ErrorCode.BIRTH_TIME_REQUIRED: _entry(422, "இந்தக் கணக்கீட்டிற்கு பிறந்த நேரம் தேவை.", "A birth time is required for this calculation.", "Birth time required."),
    ErrorCode.INVALID_DATE_RANGE: _entry(422, "தேர்ந்தெடுத்த தேதிவரம்பு சரியல்ல.", "The selected date range is invalid.", "Invalid date range."),
    ErrorCode.MISSING_DATA: _entry(422, "தேவையான தரவு கிடைக்கவில்லை.", "Required data is missing.", "Missing data."),
    ErrorCode.INVALID_FORMAT: _entry(422, "தகவலின் வடிவம் சரியல்ல.", "The information format is invalid.", "Invalid format."),
    ErrorCode.VALUE_OUT_OF_RANGE: _entry(422, "உள்ளிட்ட மதிப்பு அனுமதிக்கப்பட்ட வரம்பிற்கு வெளியே உள்ளது.", "A value is outside the allowed range.", "Value out of range."),
    ErrorCode.MISSING_MOON_DATA: _entry(422, "சந்திரன் நிலைத் தகவல் கிடைக்கவில்லை.", "Moon-position data is unavailable.", "Moon data missing."),
    ErrorCode.MISSING_SUN_DATA: _entry(422, "சூரியன் நிலைத் தகவல் கிடைக்கவில்லை.", "Sun-position data is unavailable.", "Sun data missing."),
    ErrorCode.SERVICE_UNAVAILABLE: _entry(503, "சேவை இப்போது கிடைக்கவில்லை. சிறிது நேரத்தில் முயற்சிக்கவும்.", "The service is temporarily unavailable. Please try again shortly.", "Service unavailable."),
    ErrorCode.CONFIGURATION_ERROR: _entry(503, "சேவை அமைப்பில் சிக்கல் உள்ளது. பின்னர் முயற்சிக்கவும்.", "The service is not configured correctly. Please try again later.", "Configuration error."),
    ErrorCode.INTERNAL_ERROR: _entry(500, "எதிர்பாராத சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.", "An unexpected error occurred. Please try again.", "Internal error."),
}

# ``detail`` was a released, English-only API contract before the typed error
# envelope existed. Keep that prose byte-for-byte for callers that still render
# it, while new callers render ``message`` in their chosen language.
_LEGACY_ERROR_DETAILS: dict[ErrorCode, tuple[str, str]] = {
    ErrorCode.RESOURCE_NOT_FOUND: ("The requested resource was not found. Please check and try again.", "Resource not found."),
    ErrorCode.BIRTH_PROFILE_NOT_FOUND: ("Birth profile not found. Please create one to get started.", "Birth profile not found."),
    ErrorCode.CHART_NOT_FOUND: ("Chart not found. Your birth profile may need a birth time to calculate it.", "Chart not found."),
    ErrorCode.FAMILY_VAULT_NOT_FOUND: ("Family vault not found. It may have been deleted.", "Family vault not found."),
    ErrorCode.FAMILY_MEMBER_NOT_FOUND: ("Family member not found in the vault.", "Family member not found."),
    ErrorCode.USER_NOT_FOUND: ("User not found. Please check the user ID and try again.", "User not found."),
    ErrorCode.JOURNAL_ENTRY_NOT_FOUND: ("Journal entry not found. It may have been deleted.", "Journal entry not found."),
    ErrorCode.GOAL_NOT_FOUND: ("Goal not found. It may have been deleted.", "Goal not found."),
    ErrorCode.FEEDBACK_NOT_FOUND: ("Feedback not found.", "Feedback not found."),
    ErrorCode.ACCESS_DENIED: ("You don't have permission to access this resource.", "Access denied."),
    ErrorCode.PERMISSION_DENIED: ("You don't have permission to perform this action.", "Permission denied."),
    ErrorCode.ACCOUNT_SUSPENDED: ("Your account has been suspended. Please contact support for assistance.", "Account suspended."),
    ErrorCode.NOT_AUTHENTICATED: ("Please log in to continue.", "Not authenticated."),
    ErrorCode.TOKEN_EXPIRED: ("Your session has expired. Please log in again.", "Token has expired."),
    ErrorCode.TOKEN_INVALID: ("Your session is invalid. Please log in again.", "Invalid token."),
    ErrorCode.TOKEN_REVOKED: ("Your session has been revoked. Please log in again.", "Token has been revoked."),
    ErrorCode.RESOURCE_LIMIT_EXCEEDED: ("You have reached a plan limit. Delete an unused item to make room, or upgrade for more.", "Resource limit exceeded."),
    ErrorCode.DUPLICATE_RESOURCE: ("This resource already exists.", "Resource already exists."),
    ErrorCode.EMAIL_ALREADY_EXISTS: ("An account with this email already exists.", "Email already registered."),
    ErrorCode.INVALID_INPUT: ("The provided input is invalid. Please check and try again.", "Invalid input."),
    ErrorCode.VALIDATION_ERROR: ("Please check your input and try again.", "Validation failed."),
    ErrorCode.MISSING_REQUIRED_FIELD: ("Some required information is missing. Please fill in all fields.", "Required field missing."),
    ErrorCode.INVALID_DATE_RANGE: ("The date range is invalid. Please check the start and end dates.", "Invalid date range."),
    ErrorCode.MISSING_DATA: ("Required data is missing. Please provide all necessary information.", "Missing required data."),
    ErrorCode.INVALID_FORMAT: ("The format of your input is invalid. Please check and try again.", "Invalid format."),
    ErrorCode.VALUE_OUT_OF_RANGE: ("One of the values you entered is outside the acceptable range.", "Value out of range."),
    ErrorCode.MISSING_MOON_DATA: ("Moon position data is not available. Your profile may need a more accurate birth time.", "Moon data not available."),
    ErrorCode.MISSING_SUN_DATA: ("Sun position data is not available. Your profile may need a more accurate birth time.", "Sun data not available."),
    ErrorCode.SERVICE_UNAVAILABLE: ("The service is temporarily unavailable. Please try again in a few moments.", "Service unavailable."),
    ErrorCode.CONFIGURATION_ERROR: ("A system configuration error has occurred. Please contact support.", "Configuration error."),
}

for _legacy_code, (_legacy_detail, _legacy_technical) in _LEGACY_ERROR_DETAILS.items():
    ERROR_MESSAGES[_legacy_code]["user_message"] = _legacy_detail
    ERROR_MESSAGES[_legacy_code]["technical"] = _legacy_technical


def coerce_error_code(value: ErrorCode | str | None) -> ErrorCode:
    """Return a stable code, degrading unknown values to ``INTERNAL_ERROR``."""
    if isinstance(value, ErrorCode):
        return value
    if isinstance(value, str):
        try:
            return ErrorCode(value)
        except ValueError:
            pass
    return ErrorCode.INTERNAL_ERROR


def get_bilingual_error_message(error_code: ErrorCode | str | None) -> BilingualMessage:
    """Return a copy so callers cannot mutate the shared message catalogue."""
    entry = ERROR_MESSAGES[coerce_error_code(error_code)]
    return {"ta": entry["message"]["ta"], "en": entry["message"]["en"]}


def get_error_message(error_code: ErrorCode | str, context: str | None = None) -> dict:
    """Legacy adapter for existing raisers while the codebase migrates to AppError."""
    code = coerce_error_code(error_code)
    entry = ERROR_MESSAGES[code]
    message = get_bilingual_error_message(code)
    user_message = entry["user_message"]
    if context:
        user_message = f"{user_message}\n\nDetails: {context}"
    return {
        "status": entry["status"],
        "message": message,
        "user_message": user_message,
        "technical": entry["technical"],
    }

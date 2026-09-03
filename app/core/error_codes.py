"""Stable, bilingual API error codes.

Error codes are API contract values. Add new values when needed; never rename or
reuse a value that has reached a client. The English ``detail`` field remains in
responses for compatibility, while clients should render ``message`` in their
active language.
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
    technical: str


class ErrorCode(str, Enum):
    """Error codes that can safely be handled without parsing English prose."""

    # Generic and resource lookup failures.
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND"
    BIRTH_PROFILE_NOT_FOUND = "BIRTH_PROFILE_NOT_FOUND"
    CHART_NOT_FOUND = "CHART_NOT_FOUND"
    VAULT_NOT_FOUND = "VAULT_NOT_FOUND"
    FAMILY_VAULT_NOT_FOUND = "FAMILY_VAULT_NOT_FOUND"
    MEMBER_NOT_FOUND = "MEMBER_NOT_FOUND"
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
    DAILY_LIMIT_REACHED = "DAILY_LIMIT_REACHED"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"

    # Caller-correctable input errors.
    VALIDATION_FAILED = "VALIDATION_FAILED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    BIRTH_TIME_REQUIRED = "BIRTH_TIME_REQUIRED"
    DATE_RANGE_INVALID = "DATE_RANGE_INVALID"
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
    return {"status": http_status, "message": {"ta": ta, "en": en}, "technical": technical}


ERROR_MESSAGES: dict[ErrorCode, ErrorMessageDefinition] = {
    ErrorCode.RESOURCE_NOT_FOUND: _entry(404, "கோரிய தகவல் கிடைக்கவில்லை.", "The requested resource was not found.", "Resource not found."),
    ErrorCode.PROFILE_NOT_FOUND: _entry(404, "பிறப்புத் தகவல் கிடைக்கவில்லை.", "The birth profile was not found.", "Profile not found."),
    ErrorCode.BIRTH_PROFILE_NOT_FOUND: _entry(404, "பிறப்புத் தகவல் கிடைக்கவில்லை.", "The birth profile was not found.", "Birth profile not found."),
    ErrorCode.CHART_NOT_FOUND: _entry(404, "ஜாதகம் கிடைக்கவில்லை.", "The birth chart was not found.", "Chart not found."),
    ErrorCode.VAULT_NOT_FOUND: _entry(404, "குடும்பப் பெட்டகம் கிடைக்கவில்லை.", "The family vault was not found.", "Vault not found."),
    ErrorCode.FAMILY_VAULT_NOT_FOUND: _entry(404, "குடும்பப் பெட்டகம் கிடைக்கவில்லை.", "The family vault was not found.", "Family vault not found."),
    ErrorCode.MEMBER_NOT_FOUND: _entry(404, "குடும்ப உறுப்பினர் கிடைக்கவில்லை.", "The family member was not found.", "Member not found."),
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
    ErrorCode.DAILY_LIMIT_REACHED: _entry(429, "இன்றைக்கான வரம்பை அடைந்துவிட்டீர்கள். நாளை மீண்டும் முயற்சிக்கவும்.", "You have reached today's limit. Please try again tomorrow.", "Daily limit reached."),
    ErrorCode.DUPLICATE_RESOURCE: _entry(409, "இதே தகவல் ஏற்கனவே உள்ளது.", "This resource already exists.", "Duplicate resource."),
    ErrorCode.EMAIL_ALREADY_EXISTS: _entry(409, "இந்த மின்னஞ்சலுடன் ஏற்கனவே ஒரு கணக்கு உள்ளது.", "An account with this email already exists.", "Email already exists."),
    ErrorCode.VALIDATION_FAILED: _entry(422, "உள்ளிட்ட தகவலைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", "Please check the information entered and try again.", "Validation failed."),
    ErrorCode.VALIDATION_ERROR: _entry(422, "உள்ளிட்ட தகவலைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", "Please check the information entered and try again.", "Validation error."),
    ErrorCode.INVALID_INPUT: _entry(422, "உள்ளிட்ட தகவல் சரியல்ல.", "The information entered is invalid.", "Invalid input."),
    ErrorCode.MISSING_REQUIRED_FIELD: _entry(422, "தேவையான தகவல் விடுபட்டுள்ளது.", "Required information is missing.", "Required field missing."),
    ErrorCode.BIRTH_TIME_REQUIRED: _entry(422, "இந்தக் கணக்கீட்டிற்கு பிறந்த நேரம் தேவை.", "A birth time is required for this calculation.", "Birth time required."),
    ErrorCode.DATE_RANGE_INVALID: _entry(422, "தேர்ந்தெடுத்த தேதிவரம்பு சரியல்ல.", "The selected date range is invalid.", "Date range invalid."),
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
    if context:
        message["en"] = f"{message['en']}\n\nDetails: {context}"
    return {
        "status": entry["status"],
        "message": message,
        "user_message": message["en"],
        "technical": entry["technical"],
    }

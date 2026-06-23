"""
Centralized error code definitions and user-friendly error messages.

Maps HTTP status codes and error types to human-readable descriptions
that are helpful to end users while maintaining consistency.
"""

from enum import Enum
from fastapi import status


class ErrorCode(str, Enum):
    """Error codes for consistent error handling throughout the app."""

    # 404 - Not Found
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    BIRTH_PROFILE_NOT_FOUND = "BIRTH_PROFILE_NOT_FOUND"
    CHART_NOT_FOUND = "CHART_NOT_FOUND"
    FAMILY_VAULT_NOT_FOUND = "FAMILY_VAULT_NOT_FOUND"
    FAMILY_MEMBER_NOT_FOUND = "FAMILY_MEMBER_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    JOURNAL_ENTRY_NOT_FOUND = "JOURNAL_ENTRY_NOT_FOUND"
    GOAL_NOT_FOUND = "GOAL_NOT_FOUND"
    FEEDBACK_NOT_FOUND = "FEEDBACK_NOT_FOUND"

    # 403 - Forbidden
    ACCESS_DENIED = "ACCESS_DENIED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"

    # 401 - Unauthorized
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    TOKEN_REVOKED = "TOKEN_REVOKED"

    # 409 - Conflict
    RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED"
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"

    # 422 - Validation
    INVALID_INPUT = "INVALID_INPUT"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"
    MISSING_DATA = "MISSING_DATA"
    INVALID_FORMAT = "INVALID_FORMAT"
    VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE"
    MISSING_MOON_DATA = "MISSING_MOON_DATA"
    MISSING_SUN_DATA = "MISSING_SUN_DATA"

    # 503 - Service Unavailable
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"


# Map error codes to user-friendly messages and HTTP status codes
ERROR_MESSAGES = {
    ErrorCode.RESOURCE_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "The requested resource was not found. Please check and try again.",
        "technical": "Resource not found.",
    },
    ErrorCode.BIRTH_PROFILE_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Birth profile not found. Please create one to get started.",
        "technical": "Birth profile not found.",
    },
    ErrorCode.CHART_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Chart not found. Your birth profile may need a birth time to calculate it.",
        "technical": "Chart not found.",
    },
    ErrorCode.FAMILY_VAULT_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Family vault not found. It may have been deleted.",
        "technical": "Family vault not found.",
    },
    ErrorCode.FAMILY_MEMBER_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Family member not found in the vault.",
        "technical": "Family member not found.",
    },
    ErrorCode.USER_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "User not found. Please check the user ID and try again.",
        "technical": "User not found.",
    },
    ErrorCode.JOURNAL_ENTRY_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Journal entry not found. It may have been deleted.",
        "technical": "Journal entry not found.",
    },
    ErrorCode.GOAL_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Goal not found. It may have been deleted.",
        "technical": "Goal not found.",
    },
    ErrorCode.FEEDBACK_NOT_FOUND: {
        "status": status.HTTP_404_NOT_FOUND,
        "user_message": "Feedback not found.",
        "technical": "Feedback not found.",
    },
    ErrorCode.ACCESS_DENIED: {
        "status": status.HTTP_403_FORBIDDEN,
        "user_message": "You don't have permission to access this resource.",
        "technical": "Access denied.",
    },
    ErrorCode.PERMISSION_DENIED: {
        "status": status.HTTP_403_FORBIDDEN,
        "user_message": "You don't have permission to perform this action.",
        "technical": "Permission denied.",
    },
    ErrorCode.ACCOUNT_SUSPENDED: {
        "status": status.HTTP_403_FORBIDDEN,
        "user_message": "Your account has been suspended. Please contact support for assistance.",
        "technical": "Account suspended.",
    },
    ErrorCode.NOT_AUTHENTICATED: {
        "status": status.HTTP_401_UNAUTHORIZED,
        "user_message": "Please log in to continue.",
        "technical": "Not authenticated.",
    },
    ErrorCode.TOKEN_EXPIRED: {
        "status": status.HTTP_401_UNAUTHORIZED,
        "user_message": "Your session has expired. Please log in again.",
        "technical": "Token has expired.",
    },
    ErrorCode.TOKEN_INVALID: {
        "status": status.HTTP_401_UNAUTHORIZED,
        "user_message": "Your session is invalid. Please log in again.",
        "technical": "Invalid token.",
    },
    ErrorCode.TOKEN_REVOKED: {
        "status": status.HTTP_401_UNAUTHORIZED,
        "user_message": "Your session has been revoked. Please log in again.",
        "technical": "Token has been revoked.",
    },
    ErrorCode.RESOURCE_LIMIT_EXCEEDED: {
        "status": status.HTTP_409_CONFLICT,
        "user_message": "You have reached the maximum number of birth profiles (10). Delete unused profiles from your settings to make room for new ones.",
        "technical": "Resource limit exceeded.",
    },
    ErrorCode.DUPLICATE_RESOURCE: {
        "status": status.HTTP_409_CONFLICT,
        "user_message": "This resource already exists.",
        "technical": "Resource already exists.",
    },
    ErrorCode.EMAIL_ALREADY_EXISTS: {
        "status": status.HTTP_409_CONFLICT,
        "user_message": "An account with this email already exists.",
        "technical": "Email already registered.",
    },
    ErrorCode.INVALID_INPUT: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "The provided input is invalid. Please check and try again.",
        "technical": "Invalid input.",
    },
    ErrorCode.VALIDATION_ERROR: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "Please check your input and try again.",
        "technical": "Validation failed.",
    },
    ErrorCode.MISSING_REQUIRED_FIELD: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "Some required information is missing. Please fill in all fields.",
        "technical": "Required field missing.",
    },
    ErrorCode.INVALID_DATE_RANGE: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "The date range is invalid. Please check the start and end dates.",
        "technical": "Invalid date range.",
    },
    ErrorCode.MISSING_DATA: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "Required data is missing. Please provide all necessary information.",
        "technical": "Missing required data.",
    },
    ErrorCode.INVALID_FORMAT: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "The format of your input is invalid. Please check and try again.",
        "technical": "Invalid format.",
    },
    ErrorCode.VALUE_OUT_OF_RANGE: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "One of the values you entered is outside the acceptable range.",
        "technical": "Value out of range.",
    },
    ErrorCode.MISSING_MOON_DATA: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "Moon position data is not available. Your profile may need a more accurate birth time.",
        "technical": "Moon data not available.",
    },
    ErrorCode.MISSING_SUN_DATA: {
        "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "user_message": "Sun position data is not available. Your profile may need a more accurate birth time.",
        "technical": "Sun data not available.",
    },
    ErrorCode.SERVICE_UNAVAILABLE: {
        "status": status.HTTP_503_SERVICE_UNAVAILABLE,
        "user_message": "The service is temporarily unavailable. Please try again in a few moments.",
        "technical": "Service unavailable.",
    },
    ErrorCode.CONFIGURATION_ERROR: {
        "status": status.HTTP_503_SERVICE_UNAVAILABLE,
        "user_message": "A system configuration error has occurred. Please contact support.",
        "technical": "Configuration error.",
    },
}


def get_error_message(error_code: ErrorCode | str, context: str | None = None) -> dict:
    """
    Get error message details for a given error code.

    Args:
        error_code: The error code (ErrorCode enum or string)
        context: Optional context to include in the message

    Returns:
        Dictionary with 'status', 'user_message', and 'technical' keys
    """
    if isinstance(error_code, str):
        try:
            error_code = ErrorCode(error_code)
        except ValueError:
            return {
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "user_message": "An unexpected error occurred. Please try again.",
                "technical": f"Unknown error code: {error_code}",
            }

    error_info = ERROR_MESSAGES.get(error_code)
    if not error_info:
        return {
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "user_message": "An unexpected error occurred. Please try again.",
            "technical": f"Unmapped error code: {error_code}",
        }

    if context:
        user_message = f"{error_info['user_message']}\n\nDetails: {context}"
    else:
        user_message = error_info["user_message"]

    return {
        "status": error_info["status"],
        "user_message": user_message,
        "technical": error_info["technical"],
    }

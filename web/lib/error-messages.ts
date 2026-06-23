/**
 * User-friendly error message formatting for API errors.
 * Maps HTTP status codes and error patterns to helpful user messages.
 */

interface ErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
  statusCode: number;
}

const ERROR_PATTERNS = {
  // 404 - Not Found
  "birth profile not found": {
    title: "Birth Profile Not Found",
    message: "Your birth profile could not be found.",
    suggestion: "Try creating a new birth profile or check if it was deleted.",
  },
  "chart not found": {
    title: "Chart Not Found",
    message: "The birth chart could not be found.",
    suggestion: "You may need to provide a birth time to calculate your chart.",
  },
  "family vault not found": {
    title: "Family Vault Not Found",
    message: "The family vault could not be found.",
    suggestion: "It may have been deleted. Try creating a new family vault.",
  },
  "family member not found": {
    title: "Family Member Not Found",
    message: "The family member could not be found.",
    suggestion: "They may have been removed from the family vault.",
  },
  "user not found": {
    title: "User Not Found",
    message: "The user could not be found.",
    suggestion: "Please verify the user ID and try again.",
  },
  "journal entry not found": {
    title: "Journal Entry Not Found",
    message: "The journal entry could not be found.",
    suggestion: "It may have been deleted.",
  },
  "goal not found": {
    title: "Goal Not Found",
    message: "The goal could not be found.",
    suggestion: "It may have been deleted.",
  },
  "not found": {
    title: "Resource Not Found",
    message: "The requested resource could not be found.",
    suggestion: "Please check and try again.",
  },

  // 403 - Forbidden
  "access denied": {
    title: "Access Denied",
    message: "You don't have permission to access this resource.",
    suggestion: "Contact the resource owner if you believe this is an error.",
  },

  // 401 - Unauthorized
  "not authenticated": {
    title: "Please Log In",
    message: "Your session has expired or you are not logged in.",
    suggestion: "Please log in to continue.",
  },
  "token": {
    title: "Session Invalid",
    message: "Your session is no longer valid.",
    suggestion: "Please log in again.",
  },
  "unauthorized": {
    title: "Unauthorized",
    message: "You are not authorized to perform this action.",
    suggestion: "Please log in with the correct account.",
  },

  // 409 - Conflict
  "birth profile limit reached": {
    title: "Profile Limit Reached",
    message: "You have reached the maximum number of birth profiles.",
    suggestion: "Delete an existing profile or upgrade your plan to add more.",
  },
  "email already exists": {
    title: "Email Already Registered",
    message: "An account with this email address already exists.",
    suggestion: "Try logging in or use a different email address.",
  },
  "already exists": {
    title: "Resource Already Exists",
    message: "This resource already exists.",
    suggestion: "Try a different name or check if you already have this item.",
  },

  // 422 - Validation
  "invalid input": {
    title: "Invalid Input",
    message: "The information you provided is invalid.",
    suggestion: "Please check the fields and try again.",
  },
  "must be between": {
    title: "Value Out of Range",
    message: "One of the values you entered is outside the acceptable range.",
    suggestion: "Please enter a value within the allowed range.",
  },
  "must be >=": {
    title: "Invalid Date Range",
    message: "The end date must be on or after the start date.",
    suggestion: "Please adjust the dates and try again.",
  },
  "cannot exceed": {
    title: "Range Too Large",
    message: "The range you selected is too large.",
    suggestion: "Please select a smaller date range.",
  },
  "required": {
    title: "Missing Information",
    message: "Some required information is missing.",
    suggestion: "Please fill in all required fields.",
  },
  "moon": {
    title: "Moon Data Missing",
    message: "The moon position is not available for this chart.",
    suggestion: "Your profile may need a more accurate birth time.",
  },
  "sun": {
    title: "Sun Data Missing",
    message: "The sun position is not available for this chart.",
    suggestion: "Your profile may need a more accurate birth time.",
  },
  "birth time": {
    title: "Birth Time Required",
    message: "A birth time is required for this calculation.",
    suggestion: "Please provide your birth time and try again.",
  },
  "time format": {
    title: "Invalid Time Format",
    message: "The time format is invalid.",
    suggestion: "Use HH:MM format (e.g., 14:30).",
  },
  "between": {
    title: "Invalid Value",
    message: "The value must be within the acceptable range.",
    suggestion: "Please check the valid range and try again.",
  },
  "uuid": {
    title: "Invalid ID",
    message: "The provided ID is not valid.",
    suggestion: "Please check the ID and try again.",
  },

  // 503 - Service Unavailable
  "service unavailable": {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable.",
    suggestion: "Please try again in a few moments.",
  },
  "not configured": {
    title: "Service Not Configured",
    message: "A required service is not properly configured.",
    suggestion: "Please contact support.",
  },

  // Network errors
  "network error": {
    title: "Connection Error",
    message: "Unable to connect to the server.",
    suggestion: "Check your internet connection and try again.",
  },
  "unreachable": {
    title: "Connection Error",
    message: "The server could not be reached.",
    suggestion: "Check your internet connection and try again.",
  },
};

function normalizeErrorString(str: string): string {
  return str.toLowerCase().trim();
}

function findMatchingPattern(errorText: string): (typeof ERROR_PATTERNS)[keyof typeof ERROR_PATTERNS] | null {
  const normalized = normalizeErrorString(errorText);

  // Try exact matches first (multi-word patterns)
  for (const [pattern, info] of Object.entries(ERROR_PATTERNS)) {
    if (pattern.length > 5 && normalized.includes(normalizeErrorString(pattern))) {
      return info;
    }
  }

  // Try shorter patterns
  for (const [pattern, info] of Object.entries(ERROR_PATTERNS)) {
    if (pattern.length <= 5 && normalized.includes(normalizeErrorString(pattern))) {
      return info;
    }
  }

  return null;
}

export function formatErrorMessage(error: unknown): ErrorInfo {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;

    // Extract status code if present (format: "404: /path: message")
    const statusMatch = message.match(/^(\d{3}):/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 500;

    // Try to find a matching pattern
    const matched = findMatchingPattern(message);
    if (matched) {
      return {
        ...matched,
        statusCode,
      };
    }

    // Fallback: use the error message as-is but improve it
    return {
      title: getStatusCodeTitle(statusCode),
      message: extractUserMessage(message),
      statusCode,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    const matched = findMatchingPattern(error);
    if (matched) {
      return {
        ...matched,
        statusCode: 500,
      };
    }

    return {
      title: "Error",
      message: error,
      statusCode: 500,
    };
  }

  // Fallback for unknown error types
  return {
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again.",
    statusCode: 500,
  };
}

function getStatusCodeTitle(statusCode: number): string {
  const titles: Record<number, string> = {
    400: "Invalid Request",
    401: "Authentication Required",
    403: "Access Denied",
    404: "Not Found",
    409: "Conflict",
    422: "Invalid Input",
    429: "Too Many Requests",
    500: "Server Error",
    503: "Service Unavailable",
  };
  return titles[statusCode] || "Error";
}

function extractUserMessage(errorText: string): string {
  // Remove status code prefix if present (e.g., "409: /api/v1/birth-profiles: message")
  const cleaned = errorText.replace(/^\d{3}:\s*[^:]*:\s*/, "").trim();

  // Remove technical prefixes
  if (cleaned.includes("detail:")) {
    return cleaned.split("detail:")[1]?.trim() || cleaned;
  }

  return cleaned || "An error occurred. Please try again.";
}

export function getErrorTitle(error: unknown): string {
  return formatErrorMessage(error).title;
}

export function getErrorDescription(error: unknown): string {
  const info = formatErrorMessage(error);
  return info.suggestion ? `${info.message}\n\n${info.suggestion}` : info.message;
}

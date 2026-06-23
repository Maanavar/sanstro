/**
 * User-friendly error message formatting for API errors (mobile).
 * Maps HTTP status codes and error patterns to helpful user messages.
 */

interface ErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
  statusCode: number;
}

const ERROR_PATTERNS: Record<string, Omit<ErrorInfo, "statusCode">> = {
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
  "not found": {
    title: "Not Found",
    message: "The requested item could not be found.",
    suggestion: "Please check and try again.",
  },

  // 403 - Forbidden
  "access denied": {
    title: "Access Denied",
    message: "You don't have permission to access this.",
    suggestion: "Contact support if you think this is incorrect.",
  },

  // 401 - Unauthorized
  "not authenticated": {
    title: "Please Log In",
    message: "Your session has expired.",
    suggestion: "Log in again to continue.",
  },
  "token": {
    title: "Session Expired",
    message: "Your session is no longer valid.",
    suggestion: "Log in again.",
  },
  "unauthorized": {
    title: "Unauthorized",
    message: "You're not authorized for this action.",
    suggestion: "Log in with the correct account.",
  },

  // 409 - Conflict
  "birth profile limit reached": {
    title: "Profile Limit Reached",
    message: "You've reached the maximum number of birth profiles.",
    suggestion: "Delete an existing profile to add a new one.",
  },
  "email already exists": {
    title: "Email Already Registered",
    message: "An account with this email already exists.",
    suggestion: "Try logging in or use a different email.",
  },
  "already exists": {
    title: "Already Exists",
    message: "This item already exists.",
    suggestion: "Try using a different name.",
  },

  // 422 - Validation
  "invalid input": {
    title: "Invalid Input",
    message: "Please check what you entered.",
    suggestion: "Make sure all information is correct.",
  },
  "must be between": {
    title: "Invalid Value",
    message: "The value is outside the acceptable range.",
    suggestion: "Please enter a valid value.",
  },
  "must be >=": {
    title: "Invalid Dates",
    message: "The end date must be after the start date.",
    suggestion: "Adjust the dates and try again.",
  },
  "cannot exceed": {
    title: "Range Too Large",
    message: "You selected too large a range.",
    suggestion: "Choose a smaller date range.",
  },
  "required": {
    title: "Missing Information",
    message: "Some required fields are empty.",
    suggestion: "Please fill in all required fields.",
  },
  "moon": {
    title: "Moon Data Missing",
    message: "Moon position is not available.",
    suggestion: "You may need a more accurate birth time.",
  },
  "sun": {
    title: "Sun Data Missing",
    message: "Sun position is not available.",
    suggestion: "You may need a more accurate birth time.",
  },
  "birth time": {
    title: "Birth Time Required",
    message: "Birth time is needed for this.",
    suggestion: "Provide your birth time and try again.",
  },
  "time format": {
    title: "Invalid Time",
    message: "The time format is not correct.",
    suggestion: "Use HH:MM format (e.g., 14:30).",
  },
  "between": {
    title: "Invalid Value",
    message: "The value is outside the valid range.",
    suggestion: "Please use a valid value.",
  },

  // 503 - Service Unavailable
  "service unavailable": {
    title: "Service Down",
    message: "The service is temporarily unavailable.",
    suggestion: "Try again in a few moments.",
  },
  "not configured": {
    title: "Service Error",
    message: "A required service is not properly set up.",
    suggestion: "Contact support.",
  },

  // Network errors
  "network error": {
    title: "Connection Error",
    message: "Can't connect to the server.",
    suggestion: "Check your internet connection.",
  },
  "unreachable": {
    title: "Connection Error",
    message: "The server is unreachable.",
    suggestion: "Check your internet and try again.",
  },
};

function normalizeErrorString(str: string): string {
  return str.toLowerCase().trim();
}

function findMatchingPattern(errorText: string): (typeof ERROR_PATTERNS)[string] | null {
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

    // Extract status code if present
    const statusMatch = message.match(/^(\d{3})/);
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
    title: "Error",
    message: "Something went wrong. Please try again.",
    statusCode: 500,
  };
}

function getStatusCodeTitle(statusCode: number): string {
  const titles: Record<number, string> = {
    400: "Invalid Request",
    401: "Log In Required",
    403: "Access Denied",
    404: "Not Found",
    409: "Conflict",
    422: "Invalid Input",
    429: "Too Many Requests",
    500: "Server Error",
    503: "Service Down",
  };
  return titles[statusCode] || "Error";
}

function extractUserMessage(errorText: string): string {
  // Remove status code prefix if present
  const cleaned = errorText.replace(/^\d{3}:\s*[^:]*:\s*/, "").trim();

  // Remove technical prefixes
  if (cleaned.includes("detail:")) {
    return cleaned.split("detail:")[1]?.trim() || cleaned;
  }

  return cleaned || "Something went wrong. Please try again.";
}

export function getErrorTitle(error: unknown): string {
  return formatErrorMessage(error).title;
}

export function getErrorDescription(error: unknown): string {
  const info = formatErrorMessage(error);
  return info.suggestion ? `${info.message}\n\n${info.suggestion}` : info.message;
}

export function getErrorStatusCode(error: unknown): number {
  return formatErrorMessage(error).statusCode;
}

/** Stable client-side representation of the backend's typed error envelope. */

export const API_ERROR_CODES = [
  "RESOURCE_NOT_FOUND",
  "BIRTH_PROFILE_NOT_FOUND",
  "CHART_NOT_FOUND",
  "FAMILY_VAULT_NOT_FOUND",
  "FAMILY_MEMBER_NOT_FOUND",
  "USER_NOT_FOUND",
  "JOURNAL_ENTRY_NOT_FOUND",
  "GOAL_NOT_FOUND",
  "FEEDBACK_NOT_FOUND",
  "ACCESS_DENIED",
  "PERMISSION_DENIED",
  "ELEVATION_REQUIRED",
  "ACCOUNT_SUSPENDED",
  "NOT_AUTHENTICATED",
  "SESSION_INVALID",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_REVOKED",
  "PROFILE_LIMIT_REACHED",
  "RESOURCE_LIMIT_EXCEEDED",
  "RATE_LIMITED",
  "DAILY_LIMIT_REACHED",
  "MONTHLY_LIMIT_REACHED",
  "DUPLICATE_RESOURCE",
  "EMAIL_ALREADY_EXISTS",
  "VALIDATION_ERROR",
  "INVALID_INPUT",
  "MISSING_REQUIRED_FIELD",
  "BIRTH_TIME_REQUIRED",
  "INVALID_DATE_RANGE",
  "MISSING_DATA",
  "INVALID_FORMAT",
  "VALUE_OUT_OF_RANGE",
  "MISSING_MOON_DATA",
  "MISSING_SUN_DATA",
  "SERVICE_UNAVAILABLE",
  "CONFIGURATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorMessage {
  ta: string;
  en: string;
}

export interface ApiError {
  code: ApiErrorCode;
  message: ApiErrorMessage;
  requestId: string | null;
  field?: string;
  detail: unknown;
  status: number;
}

type ErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    request_id?: unknown;
    field?: unknown;
  };
  detail?: unknown;
  request_id?: unknown;
  message?: unknown;
};

const CODE_SET = new Set<string>(API_ERROR_CODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function defaultCodeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "NOT_AUTHENTICATED";
  if (status === 403) return "ACCESS_DENIED";
  if (status === 404) return "RESOURCE_NOT_FOUND";
  if (status === 409) return "DUPLICATE_RESOURCE";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return "INTERNAL_ERROR";
}

function fallbackMessage(code: ApiErrorCode): ApiErrorMessage {
  const messages: Record<ApiErrorCode, ApiErrorMessage> = {
    RESOURCE_NOT_FOUND: { ta: "கோரிய தகவல் கிடைக்கவில்லை.", en: "The requested resource was not found." },
    BIRTH_PROFILE_NOT_FOUND: { ta: "பிறப்புத் தகவல் கிடைக்கவில்லை.", en: "The birth profile was not found." },
    CHART_NOT_FOUND: { ta: "ஜாதகம் கிடைக்கவில்லை.", en: "The birth chart was not found." },
    FAMILY_VAULT_NOT_FOUND: { ta: "குடும்பப் பெட்டகம் கிடைக்கவில்லை.", en: "The family vault was not found." },
    FAMILY_MEMBER_NOT_FOUND: { ta: "குடும்ப உறுப்பினர் கிடைக்கவில்லை.", en: "The family member was not found." },
    USER_NOT_FOUND: { ta: "பயனர் கிடைக்கவில்லை.", en: "The user was not found." },
    JOURNAL_ENTRY_NOT_FOUND: { ta: "குறிப்பேட்டு பதிவு கிடைக்கவில்லை.", en: "The journal entry was not found." },
    GOAL_NOT_FOUND: { ta: "இலக்கு கிடைக்கவில்லை.", en: "The goal was not found." },
    FEEDBACK_NOT_FOUND: { ta: "கருத்துப் பதிவு கிடைக்கவில்லை.", en: "The feedback entry was not found." },
    ACCESS_DENIED: { ta: "இந்தத் தகவலை அணுக அனுமதி இல்லை.", en: "You do not have permission to access this resource." },
    PERMISSION_DENIED: { ta: "இந்தச் செயலைச் செய்ய அனுமதி இல்லை.", en: "You do not have permission to perform this action." },
    ELEVATION_REQUIRED: { ta: "மீண்டும் உறுதிப்படுத்தல் தேவை.", en: "Please re-authenticate before this administrative action." },
    ACCOUNT_SUSPENDED: { ta: "இந்தக் கணக்கு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது.", en: "This account has been suspended." },
    NOT_AUTHENTICATED: { ta: "தொடர உள்நுழையவும்.", en: "Please log in to continue." },
    SESSION_INVALID: { ta: "உங்கள் அமர்வு செல்லுபடியாக இல்லை.", en: "Your session is invalid. Please log in again." },
    TOKEN_EXPIRED: { ta: "உங்கள் அமர்வு முடிந்துவிட்டது.", en: "Your session has expired. Please log in again." },
    TOKEN_INVALID: { ta: "உங்கள் அமர்வு செல்லுபடியாக இல்லை.", en: "Your session is invalid. Please log in again." },
    TOKEN_REVOKED: { ta: "உங்கள் அமர்வு நிறுத்தப்பட்டுள்ளது.", en: "Your session has been revoked. Please log in again." },
    PROFILE_LIMIT_REACHED: { ta: "பிறப்புத் தகவல் வரம்பை அடைந்துவிட்டீர்கள்.", en: "You have reached your birth-profile limit." },
    RESOURCE_LIMIT_EXCEEDED: { ta: "உங்கள் திட்ட வரம்பை அடைந்துவிட்டீர்கள்.", en: "You have reached a plan limit." },
    DAILY_LIMIT_REACHED: { ta: "இன்றைக்கான வரம்பை அடைந்துவிட்டீர்கள்.", en: "You have reached today's limit. Please try again tomorrow." },
    DUPLICATE_RESOURCE: { ta: "இதே தகவல் ஏற்கனவே உள்ளது.", en: "This resource already exists." },
    EMAIL_ALREADY_EXISTS: { ta: "இந்த மின்னஞ்சலுடன் ஏற்கனவே ஒரு கணக்கு உள்ளது.", en: "An account with this email already exists." },
    VALIDATION_ERROR: { ta: "உள்ளிட்ட தகவலைச் சரிபார்க்கவும்.", en: "Please check the information entered and try again." },
    INVALID_INPUT: { ta: "உள்ளிட்ட தகவல் சரியல்ல.", en: "The information entered is invalid." },
    MISSING_REQUIRED_FIELD: { ta: "தேவையான தகவல் விடுபட்டுள்ளது.", en: "Required information is missing." },
    BIRTH_TIME_REQUIRED: { ta: "பிறந்த நேரம் தேவை.", en: "A birth time is required for this calculation." },
    INVALID_DATE_RANGE: { ta: "தேர்ந்தெடுத்த தேதிவரம்பு சரியல்ல.", en: "The selected date range is invalid." },
    MISSING_DATA: { ta: "தேவையான தரவு கிடைக்கவில்லை.", en: "Required data is missing." },
    INVALID_FORMAT: { ta: "தகவலின் வடிவம் சரியல்ல.", en: "The information format is invalid." },
    VALUE_OUT_OF_RANGE: { ta: "மதிப்பு அனுமதிக்கப்பட்ட வரம்பிற்கு வெளியே உள்ளது.", en: "A value is outside the allowed range." },
    MISSING_MOON_DATA: { ta: "சந்திரன் நிலைத் தகவல் கிடைக்கவில்லை.", en: "Moon-position data is unavailable." },
    MISSING_SUN_DATA: { ta: "சூரியன் நிலைத் தகவல் கிடைக்கவில்லை.", en: "Sun-position data is unavailable." },
    SERVICE_UNAVAILABLE: { ta: "சேவை இப்போது கிடைக்கவில்லை.", en: "The service is temporarily unavailable. Please try again shortly." },
    CONFIGURATION_ERROR: { ta: "சேவை அமைப்பில் சிக்கல் உள்ளது.", en: "The service is not configured correctly. Please try again later." },
    INTERNAL_ERROR: { ta: "எதிர்பாராத சிக்கல் ஏற்பட்டது.", en: "An unexpected error occurred. Please try again." },
    RATE_LIMITED: { ta: "மிக விரைவாக கோரிக்கைகள் வருகின்றன. சிறிது நேரம் கழித்து முயற்சிக்கவும்.", en: "Too many requests. Please wait a moment and try again." },
    MONTHLY_LIMIT_REACHED: { ta: "இந்த மாதத்திற்கான வரம்பை அடைந்துவிட்டீர்கள்.", en: "You have reached this month's limit." },
  };
  return messages[code];
}

function parseMessage(value: unknown, code: ApiErrorCode): ApiErrorMessage {
  if (isRecord(value) && typeof value.ta === "string" && typeof value.en === "string") {
    return { ta: value.ta, en: value.en };
  }
  return fallbackMessage(code);
}

export function parseApiErrorText(status: number, text: string, requestId: string | null = null): ApiError {
  let payload: ErrorEnvelope = {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (isRecord(parsed)) payload = parsed as ErrorEnvelope;
  } catch {
    // Network intermediaries and older deployments may send plain text.
  }

  const error = isRecord(payload.error) ? payload.error : {};
  const rawCode = error.code;
  const code = typeof rawCode === "string" && CODE_SET.has(rawCode)
    ? rawCode as ApiErrorCode
    : defaultCodeForStatus(status);
  const responseRequestId = typeof error.request_id === "string"
    ? error.request_id
    : typeof payload.request_id === "string"
      ? payload.request_id
      : requestId;

  return {
    code,
    message: parseMessage(error.message, code),
    requestId: responseRequestId,
    field: typeof error.field === "string" ? error.field : undefined,
    detail: payload.detail ?? payload.message ?? (text || undefined),
    status,
  };
}

/** Parse an unsuccessful Fetch response. This consumes its body exactly once. */
export async function parseApiError(response: Response): Promise<ApiError> {
  const text = await response.text().catch(() => "");
  return parseApiErrorText(response.status, text, response.headers.get("X-Request-ID"));
}

/** English compatibility detail for legacy error strings and logs. */
export function apiErrorDetail(error: ApiError): string {
  if (typeof error.detail === "string" && error.detail.trim()) return error.detail;
  if (Array.isArray(error.detail)) {
    const validation = error.detail
      .filter(isRecord)
      .map((item) => typeof item.msg === "string" ? item.msg : "")
      .filter(Boolean)
      .join("; ");
    if (validation) return validation;
  }
  return error.message.en;
}

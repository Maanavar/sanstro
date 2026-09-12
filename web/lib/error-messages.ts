/** Presentation copy for typed API errors, with a narrow legacy fallback. */
import type { ApiErrorCode } from "@vinaadi/shared/api";

import { getApiError } from "./api";

type Language = "ta" | "en";
type BiText = Record<Language, string>;

export interface ErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
  statusCode: number;
  code?: ApiErrorCode;
}

type ErrorMeta = {
  title: BiText;
  suggestion?: BiText;
};

const DEFAULT_META: ErrorMeta = {
  title: { ta: "சிக்கல் ஏற்பட்டது", en: "Something went wrong" },
  suggestion: { ta: "மீண்டும் முயற்சிக்கவும்.", en: "Please try again." },
};

/**
 * Exhaustive by type, not by convention: a new ApiErrorCode fails the build here
 * until it is given a real title, rather than silently rendering "Something went
 * wrong". Every backend code has exactly one entry — there are no alias keys,
 * because the synonym codes they mirrored were removed before any client shipped.
 */
const ERROR_META: Record<ApiErrorCode, ErrorMeta> = {
  RESOURCE_NOT_FOUND: { title: { ta: "கோரிய தகவல் கிடைக்கவில்லை", en: "Requested Item Not Found" } },
  USER_NOT_FOUND: { title: { ta: "பயனர் கிடைக்கவில்லை", en: "User Not Found" } },
  FEEDBACK_NOT_FOUND: { title: { ta: "கருத்துப்பதிவு கிடைக்கவில்லை", en: "Feedback Not Found" } },
  PERMISSION_DENIED: { title: { ta: "செயல்படுத்த அனுமதி இல்லை", en: "Permission Denied" } },
  ACCOUNT_SUSPENDED: { title: { ta: "கணக்கு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது", en: "Account Suspended" } },
  TOKEN_REVOKED: { title: { ta: "அமர்வு நிறுத்தப்பட்டுள்ளது", en: "Session Revoked" } },
  RATE_LIMITED: { title: { ta: "கோரிக்கைகளை சிறிது நேரம் கழித்து முயற்சிக்கவும்", en: "Too Many Requests" } },
  MONTHLY_LIMIT_REACHED: { title: { ta: "மாத வரம்பு முடிந்தது", en: "Monthly Limit Reached" } },
  DUPLICATE_RESOURCE: { title: { ta: "இதே தகவல் ஏற்கனவே உள்ளது", en: "Already Exists" } },
  MISSING_REQUIRED_FIELD: { title: { ta: "தேவையான தகவல் விடுபட்டுள்ளது", en: "Required Information Missing" } },
  MISSING_DATA: { title: { ta: "தேவையான தரவு இல்லை", en: "Required Data Missing" } },
  INVALID_FORMAT: { title: { ta: "தகவல் வடிவம் சரியல்ல", en: "Invalid Format" } },
  VALUE_OUT_OF_RANGE: { title: { ta: "மதிப்பு அனுமதிக்கப்பட்ட வரம்புக்கு வெளியே உள்ளது", en: "Value Out of Range" } },
  MISSING_MOON_DATA: { title: { ta: "சந்திர நிலைத்தகவல் இல்லை", en: "Moon Data Unavailable" } },
  MISSING_SUN_DATA: { title: { ta: "சூரிய நிலைத்தகவல் இல்லை", en: "Sun Data Unavailable" } },
  CONFIGURATION_ERROR: { title: { ta: "சேவை அமைப்பில் சிக்கல்", en: "Configuration Error" } },
  BIRTH_PROFILE_NOT_FOUND: { title: { ta: "பிறப்புத் தகவல் கிடைக்கவில்லை", en: "Birth Profile Not Found" } },
  CHART_NOT_FOUND: { title: { ta: "ஜாதகம் கிடைக்கவில்லை", en: "Birth Chart Not Found" } },
  FAMILY_VAULT_NOT_FOUND: { title: { ta: "குடும்பப் பெட்டகம் கிடைக்கவில்லை", en: "Family Vault Not Found" } },
  FAMILY_MEMBER_NOT_FOUND: { title: { ta: "குடும்ப உறுப்பினர் கிடைக்கவில்லை", en: "Family Member Not Found" } },
  JOURNAL_ENTRY_NOT_FOUND: { title: { ta: "குறிப்பேட்டு பதிவு கிடைக்கவில்லை", en: "Journal Entry Not Found" } },
  GOAL_NOT_FOUND: { title: { ta: "இலக்கு கிடைக்கவில்லை", en: "Goal Not Found" } },
  ACCESS_DENIED: { title: { ta: "அணுகல் அனுமதி இல்லை", en: "Access Denied" } },
  ELEVATION_REQUIRED: { title: { ta: "மீண்டும் உறுதிப்படுத்தல் தேவை", en: "Re-authentication Required" } },
  NOT_AUTHENTICATED: { title: { ta: "உள்நுழையவும்", en: "Please Log In" } },
  SESSION_INVALID: { title: { ta: "அமர்வு செல்லுபடியாக இல்லை", en: "Session Invalid" } },
  TOKEN_EXPIRED: { title: { ta: "அமர்வு முடிந்துவிட்டது", en: "Session Expired" } },
  TOKEN_INVALID: { title: { ta: "அமர்வு செல்லுபடியாக இல்லை", en: "Session Invalid" } },
  PROFILE_LIMIT_REACHED: { title: { ta: "பிறப்புத் தகவல் வரம்பு முடிந்தது", en: "Profile Limit Reached" } },
  RESOURCE_LIMIT_EXCEEDED: { title: { ta: "திட்ட வரம்பு முடிந்தது", en: "Plan Limit Reached" } },
  DAILY_LIMIT_REACHED: { title: { ta: "இன்றைய வரம்பு முடிந்தது", en: "Daily Limit Reached" } },
  EMAIL_ALREADY_EXISTS: { title: { ta: "மின்னஞ்சல் ஏற்கனவே உள்ளது", en: "Email Already Registered" } },
  BIRTH_TIME_REQUIRED: { title: { ta: "பிறந்த நேரம் தேவை", en: "Birth Time Required" } },
  INVALID_DATE_RANGE: { title: { ta: "தேதிவரம்பு சரியல்ல", en: "Invalid Date Range" } },
  VALIDATION_ERROR: { title: { ta: "தகவலைச் சரிபார்க்கவும்", en: "Check Your Information" } },
  INVALID_INPUT: { title: { ta: "தவறான தகவல்", en: "Invalid Information" } },
  SERVICE_UNAVAILABLE: { title: { ta: "சேவை தற்காலிகமாக கிடைக்கவில்லை", en: "Service Unavailable" } },
  INTERNAL_ERROR: { title: { ta: "எதிர்பாராத சிக்கல்", en: "Unexpected Error" } },
};

function activeLanguage(): Language {
  if (typeof document !== "undefined" && document.documentElement.lang === "ta") return "ta";
  return "en";
}

function statusCodeFromError(error: unknown): number {
  if (!(error instanceof Error)) return 500;
  const match = error.message.match(/^(\d{3}):/);
  return match ? Number.parseInt(match[1], 10) : 500;
}

/**
 * Handles responses without an API code (older deployed servers, cached clients,
 * third-party failures, and network errors). Do not add typed cases here.
 */
function legacyFallbackMessage(errorText: string, statusCode: number, lang: Language): ErrorInfo {
  const normalized = errorText.toLowerCase();
  if (normalized.includes("birth time")) {
    return {
      title: lang === "ta" ? "பிறந்த நேரம் தேவை" : "Birth Time Required",
      message: lang === "ta" ? "இந்தக் கணக்கீட்டிற்கு பிறந்த நேரம் தேவை." : "A birth time is required for this calculation.",
      statusCode,
      code: "BIRTH_TIME_REQUIRED",
    };
  }
  if (normalized.includes("network error") || normalized.includes("unreachable")) {
    return {
      title: lang === "ta" ? "இணைப்பு சிக்கல்" : "Connection Error",
      message: lang === "ta" ? "சேவையகத்துடன் இணைக்க முடியவில்லை." : "Unable to connect to the server.",
      suggestion: lang === "ta" ? "இணைய இணைப்பைச் சரிபார்த்து முயற்சிக்கவும்." : "Check your connection and try again.",
      statusCode,
    };
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn("[vinaadi] falling back to legacy error text", errorText);
  }
  return {
    title: statusCode === 503 ? (lang === "ta" ? "சேவை கிடைக்கவில்லை" : "Service Unavailable") : DEFAULT_META.title[lang],
    message: lang === "ta" ? "மீண்டும் முயற்சிக்கவும்." : "Please try again.",
    statusCode,
  };
}

export function formatErrorMessage(error: unknown): ErrorInfo {
  const lang = activeLanguage();
  const apiError = getApiError(error);
  if (apiError) {
    const meta = ERROR_META[apiError.code] ?? DEFAULT_META;
    return {
      title: meta.title[lang],
      message: apiError.message[lang],
      suggestion: meta.suggestion?.[lang],
      statusCode: apiError.status,
      code: apiError.code,
    };
  }
  return legacyFallbackMessage(
    error instanceof Error ? error.message : typeof error === "string" ? error : "",
    statusCodeFromError(error),
    lang,
  );
}

/** One-line friendly message for toasts and status lines. */
export function getFriendlyErrorMessage(error: unknown): string {
  const info = formatErrorMessage(error);
  return info.suggestion ? `${info.message} ${info.suggestion}` : info.message;
}

/** The raw compatibility detail for an optional technical disclosure. */
export function getTechnicalDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function getErrorTitle(error: unknown): string {
  return formatErrorMessage(error).title;
}

export function getErrorDescription(error: unknown): string {
  const info = formatErrorMessage(error);
  return info.suggestion ? `${info.message}\n\n${info.suggestion}` : info.message;
}

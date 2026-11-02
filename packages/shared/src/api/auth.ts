import type { AccessState } from "../constants/tiers";
import type { DataExport } from "./adminAudit";
import { getApiClient } from "./client";

export interface RegisterResponse {
  detail: string;
}

export interface MobileAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    displayName: string | null;
    /** Same fields as `MeResponse` — the backend sends an `AuthUserResponse` here. */
    tier: "registered" | "premium";
    openBeta: boolean;
    accessState: AccessState;
    trialEndsAt: string | null;
    emailVerified: boolean;
    consentRequired: boolean;
    consents: ConsentState;
    adultDeclared: boolean;
  };
}

/**
 * The latest answer per purpose (admin spec L2, D-10). Anything never answered
 * reads false.
 * - `service` (P1): required to store birth details; withdrawn only by deleting the account.
 * - `updates` (P2): astro alerts and nudges. The server sends none without it.
 * - `analytics` (P3): identify the account to PostHog only while true.
 * - `askImprove` (P4): Ask Vinaadi answers may be reviewed to improve it.
 */
export interface ConsentState {
  service: boolean;
  updates: boolean;
  analytics: boolean;
  askImprove: boolean;
}

/** The optional purposes, as answered on a form. Every one starts unticked. */
export interface OptionalConsents {
  updates: boolean;
  analytics: boolean;
  askImprove: boolean;
}

export interface MeResponse {
  userId: string;
  email: string;
  userMode: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  goalTrack: "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;
  lang: "ta" | "en";
  /** Derived live from the subscription table — never a stored flag on the user. */
  tier: "registered" | "premium";
  /**
   * True while the open beta runs. The server already holds a beta account to
   * premium's limits, so the client unlocks the same features and shows no
   * upgrade prompt. `tier` stays the subscription fact — read both through
   * `effectiveTier()` (constants/tiers.ts), never one alone.
   */
  openBeta: boolean;
  /**
   * True when the consent panel should be shown: the user has never consented,
   * consented to a policy version older than the live one (DPDP Act 2023 §6), or
   * has not made the 18+ declaration. Answer it with `recordConsent()` below.
   *
   * Non-blocking by decision — an account with this true still works normally,
   * except that an account with no service consent at all cannot store new
   * birth details (`CONSENT_REQUIRED`). Do not use it to gate routes.
   */
  consentRequired: boolean;
  /**
   * The address has been proven (verification link, or Google sign-in). The
   * seven-day trial starts on verification; until then the client nudges and
   * offers `resendVerificationEmail()`.
   */
  emailVerified: boolean;
  /**
   * free / trial / premium. Unlike `tier` this counts the trial and courtesy
   * grants. Gate features through `effectiveTier(tier, openBeta, accessState)`.
   */
  accessState: AccessState;
  /** When the trial ends (ISO-8601 UTC); null unless `accessState` is "trial". */
  trialEndsAt: string | null;
  /** Per-purpose consent (admin spec L2). Defaults all false on the server. */
  consents: ConsentState;
  /** The account holder has declared they are 18 or older. `recordConsent` asks while false. */
  adultDeclared: boolean;
  /**
   * NOT SENT BY THE BACKEND. There is no user display name anywhere in this
   * system: `users` has no such column, registration does not accept one, and
   * `updateMe({ displayName })` below patches a field
   * `UpdateUserSettingsRequest` silently discards. Always `undefined` at
   * runtime — kept only so existing call sites keep compiling, and typed
   * `undefined` so the compiler says so.
   *
   * Tracked in tests/test_api_wrapper_field_contract.py::KNOWN_DRIFT.
   */
  displayName?: undefined;
}

export function login(email: string, password: string): Promise<MobileAuthResponse> {
  return getApiClient().post("/auth/mobile/login", { email, password }) as Promise<MobileAuthResponse>;
}

/**
 * What a signup form answers (admin spec L2). `consentGiven` and `adultConfirmed`
 * are required, not defaulted: the backend rejects a missing or false value
 * rather than treating it as consent, and a default here would send `true` for
 * a box the user never ticked.
 */
export interface SignupAnswers {
  consentGiven: boolean;
  adultConfirmed: boolean;
  consents: OptionalConsents;
  /** The language the notice was shown in. */
  lang: "ta" | "en";
}

export function register(email: string, password: string, answers: SignupAnswers): Promise<RegisterResponse> {
  return getApiClient().post("/auth/mobile/register", { email, password, ...answers }) as Promise<RegisterResponse>;
}

/**
 * Answer the consent panel, when `MeResponse.consentRequired` is true. Returns
 * the refreshed user, on which `consentRequired` is then false.
 *
 * `adultConfirmed` is required (true) only while `MeResponse.adultDeclared` is
 * false. `consents`, when sent, records the optional purposes as shown.
 * POST, and the backend requires the CSRF header — the shared client adds it.
 */
export function recordConsent(answers: {
  adultConfirmed?: boolean;
  consents?: OptionalConsents;
  lang: "ta" | "en";
}): Promise<MeResponse> {
  return getApiClient().post("/auth/consent", { consentGiven: true, ...answers }) as Promise<MeResponse>;
}

/**
 * Grant or withdraw optional purposes from settings. Only the purposes passed
 * are recorded; the change applies from the next request. The service consent
 * is not here: withdrawing it is `deleteAccount()`.
 */
export function updateMyConsents(
  changes: Partial<OptionalConsents> & { lang: "ta" | "en" },
): Promise<ConsentState> {
  return getApiClient().put("/auth/me/consents", changes) as Promise<ConsentState>;
}

export function logout(): Promise<void> {
  return getApiClient().post("/auth/mobile/logout") as Promise<void>;
}

export function getMe(): Promise<MeResponse> {
  return getApiClient().get("/auth/me") as Promise<MeResponse>;
}

export function updateMe(patch: { displayName?: string }): Promise<MeResponse> {
  return getApiClient().patch("/auth/me", patch) as Promise<MeResponse>;
}

/**
 * Erase the account and everything held for it (admin spec L5). Answers 409 while
 * the account has a renewing Premium subscription: cancel that first.
 */
export function deleteAccount(): Promise<void> {
  return getApiClient().delete("/auth/me");
}

/** Everything held on the signed-in person, as JSON (DPDP right of access). */
export function exportMyData(): Promise<DataExport> {
  return getApiClient().get("/auth/me/export") as Promise<DataExport>;
}

export interface PasswordResetDetailResponse {
  detail: string;
}

export function requestPasswordReset(email: string): Promise<PasswordResetDetailResponse> {
  return getApiClient().post("/auth/forgot-password", { email }) as Promise<PasswordResetDetailResponse>;
}

export function confirmPasswordReset(token: string, password: string): Promise<PasswordResetDetailResponse> {
  return getApiClient().post("/auth/reset-password/confirm", { token, password }) as Promise<PasswordResetDetailResponse>;
}

/** POST /auth/verify-email and /auth/verify-email/resend — app/api/auth.py. */
export interface VerifyEmailResponse {
  verified: boolean;
  detail: string;
}

/** Confirm an address from the emailed link (`/login?verifyToken=…`). Unauthenticated. */
export function confirmEmailVerification(token: string): Promise<VerifyEmailResponse> {
  return getApiClient().post("/auth/verify-email", { token }) as Promise<VerifyEmailResponse>;
}

/** Send the verification link again to the signed-in account's address. Throttled. */
export function resendVerificationEmail(): Promise<VerifyEmailResponse> {
  return getApiClient().post("/auth/verify-email/resend") as Promise<VerifyEmailResponse>;
}

export interface SubscriptionInfo {
  tier: string;
  status: string;
  provider: string | null;
  current_period_end: string | null;
}

export interface SubscriptionInfoResponse {
  success: boolean;
  data: SubscriptionInfo | null;
}

export function getMySubscription(): Promise<SubscriptionInfoResponse> {
  return getApiClient().get("/users/me/subscription") as Promise<SubscriptionInfoResponse>;
}

/** GET /users/me/referral — app/api/users.py `get_own_referral` (GRW-13). */
export interface ReferralInfo {
  /** Minted on the first call, stable afterwards. */
  code: string;
  /** The site root carrying `?ref=<code>`. */
  shareUrl: string;
  /** Accounts whose first visit arrived through this code. */
  referredCount: number;
}

export interface ReferralInfoResponse {
  success: boolean;
  data: ReferralInfo;
}

export function getMyReferral(): Promise<ReferralInfoResponse> {
  return getApiClient().get("/users/me/referral") as Promise<ReferralInfoResponse>;
}

export interface AuthProvidersResponse {
  google: boolean;
}

/** Whether SSO providers are configured server-side (env vars set). The web
 * login page only renders a provider's button when this reports it enabled. */
export function getAuthProviders(): Promise<AuthProvidersResponse> {
  return getApiClient().get("/auth/oauth/providers") as Promise<AuthProvidersResponse>;
}

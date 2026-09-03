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
  };
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

export function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<RegisterResponse> {
  return getApiClient().post("/auth/mobile/register", { email, password, displayName }) as Promise<RegisterResponse>;
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

export function deleteAccount(): Promise<void> {
  return getApiClient().delete("/auth/me");
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

export interface AuthProvidersResponse {
  google: boolean;
}

/** Whether SSO providers are configured server-side (env vars set). The web
 * login page only renders a provider's button when this reports it enabled. */
export function getAuthProviders(): Promise<AuthProvidersResponse> {
  return getApiClient().get("/auth/oauth/providers") as Promise<AuthProvidersResponse>;
}

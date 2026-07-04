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
  displayName: string | null;
  tier: "registered" | "premium";
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

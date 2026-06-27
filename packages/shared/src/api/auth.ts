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

export function registerPushToken(payload: {
  deviceId: string;
  fcmToken: string;
  platform: "ios" | "android";
  appVersion: string;
  anonymousId?: string;
}): Promise<void> {
  return getApiClient().post("/devices/push-token", payload) as Promise<void>;
}

export function unregisterPushToken(deviceId: string): Promise<void> {
  return getApiClient().delete(`/devices/push-token?deviceId=${encodeURIComponent(deviceId)}`);
}

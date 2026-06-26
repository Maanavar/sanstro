import { apiPost, apiGet, apiPatch, apiDelete } from "./client";
import { setTokens, clearTokens } from "@/lib/secureStore";

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

export async function login(email: string, password: string): Promise<MobileAuthResponse> {
  const data = await apiPost<MobileAuthResponse>("/auth/mobile/login", { email, password });
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>("/auth/mobile/register", {
    email,
    password,
    displayName,
  });
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/auth/mobile/logout");
  } finally {
    await clearTokens();
  }
}

export async function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>("/auth/me");
}

export async function updateMe(patch: { displayName?: string }): Promise<MeResponse> {
  return apiPatch<MeResponse>("/auth/me", patch);
}

export async function deleteAccount(): Promise<void> {
  return apiDelete("/auth/me");
}

export async function registerPushToken(payload: {
  deviceId: string;
  fcmToken: string;
  platform: "ios" | "android";
  appVersion: string;
  anonymousId?: string;
}): Promise<void> {
  await apiPost("/devices/push-token", payload);
}

export async function unregisterPushToken(deviceId: string): Promise<void> {
  await apiDelete(`/devices/push-token?deviceId=${encodeURIComponent(deviceId)}`);
}

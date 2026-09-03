import {
  login as _loginApi,
  logout as _logoutApi,
  type MobileAuthResponse,
} from "@vinaadi/shared/api/auth";
import { setTokens, clearTokens } from "@/lib/secureStore";

export type { RegisterResponse, MobileAuthResponse, MeResponse, SubscriptionInfo, SubscriptionInfoResponse, PasswordResetDetailResponse } from "@vinaadi/shared/api/auth";
export {
  register,
  recordConsent,
  getMe,
  updateMe,
  deleteAccount,
  getMySubscription,
  requestPasswordReset,
  confirmPasswordReset,
} from "@vinaadi/shared/api/auth";

export async function login(
  email: string,
  password: string,
): Promise<MobileAuthResponse> {
  const data = await _loginApi(email, password);
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function logout(): Promise<void> {
  try {
    await _logoutApi();
  } finally {
    await clearTokens();
  }
}

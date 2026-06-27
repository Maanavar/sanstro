import { router } from "expo-router";
import { getTokens, setTokens, clearTokens } from "@/lib/secureStore";
import { ENV } from "@/lib/env";
import { initApiClient } from "@vinaadi/shared/api/client";

const API_V1_PREFIX = "/api/v1";

function buildApiUrl(path: string): string {
  const bypass = path.startsWith("/api/") || path.startsWith("/public/");
  return ENV.API_BASE_URL + (bypass ? path : `${API_V1_PREFIX}${path}`);
}

// Single-flight 401 refresh - all concurrent 401s share one refresh Promise
let _refreshPromise: Promise<void> | null = null;

async function rotateTokens(): Promise<void> {
  const stored = await getTokens();
  if (!stored) throw new Error("no refresh token");

  const res = await fetch(buildApiUrl("/auth/mobile/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
  });

  if (!res.ok) throw new Error("refresh failed");

  const json = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };

  await setTokens({
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
  });
}

function getRefreshPromise(): Promise<void> {
  if (!_refreshPromise) {
    _refreshPromise = rotateTokens().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;

  const res = await fetch(buildApiUrl(url), { ...init, headers });

  if (res.status !== 401) return res;

  try {
    await getRefreshPromise();
    return fetchWithAuth(url, init);
  } catch {
    await clearTokens();
    router.replace("/(auth)/login");
    return res;
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchWithAuth(url, { method: "DELETE" });
  if (!res.ok) throw new ApiError(res.status, await res.text());
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound()     { return this.status === 404; }
  get isLimitReached() { return this.status === 429; }
  get isConflict()     { return this.status === 409; }

  getUserMessage(): string {
    try {
      const json = JSON.parse(this.message) as { detail?: string };
      return json.detail || this.message;
    } catch {
      return this.message;
    }
  }
}

// Register mobile implementations with the shared API client
initApiClient({
  get: (path) => apiGet(path),
  post: (path, body) => apiPost(path, body),
  patch: (path, body) => apiPatch(path, body),
  delete: (path) => apiDelete(path),
});

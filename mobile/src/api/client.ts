import { router } from "expo-router";
import { getTokens, setTokens, clearTokens } from "@/lib/secureStore";
import { ENV } from "@/lib/env";
import { initApiClient, type ApiQueryParams } from "@vinaadi/shared/api/client";

const API_V1_PREFIX = "/api/v1";

export function buildApiUrl(path: string): string {
  // Only fully-qualified /api/... paths bypass the version prefix. `/public/*` is
  // mounted at /api/v1/public/* on the backend, so it must be prefixed like any
  // other path (see app/main.py — there is no unversioned mount).
  const bypass = path.startsWith("/api/");
  return ENV.API_BASE_URL + (bypass ? path : `${API_V1_PREFIX}${path}`);
}

function appendQuery(path: string, params?: ApiQueryParams): string {
  if (!params) return path;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  if (!queryString) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
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

function generateRequestId(): string {
  // crypto.randomUUID() is available in Hermes (React Native >= 0.71)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: lightweight hex UUID-v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": generateRequestId(),
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

export async function apiGet<T>(url: string, params?: ApiQueryParams): Promise<T> {
  const res = await fetchWithAuth(appendQuery(url, params));
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

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "PUT",
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
  get: (path, params) => apiGet(path, params),
  post: (path, body) => apiPost(path, body),
  patch: (path, body) => apiPatch(path, body),
  put: (path, body) => apiPut(path, body),
  delete: (path) => apiDelete(path),
});

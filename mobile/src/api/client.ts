import { router } from "expo-router";
import { getTokens, setTokens, clearTokens } from "@/lib/secureStore";
import { ENV } from "@/lib/env";

// Single-flight 401 refresh — queue concurrent 401s, resolve after one refresh
const QUEUE: Array<() => void> = [];
let isRefreshing = false;

async function rotateTokens(): Promise<void> {
  const stored = await getTokens();
  if (!stored) throw new Error("no refresh token");

  const res = await fetch(`${ENV.API_BASE_URL}/auth/mobile/refresh`, {
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

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;

  const res = await fetch(ENV.API_BASE_URL + url, { ...init, headers });

  if (res.status !== 401) return res;

  if (!isRefreshing) {
    isRefreshing = true;
    try {
      await rotateTokens();
      QUEUE.forEach((fn) => fn());
      QUEUE.length = 0;
    } catch {
      await clearTokens();
      router.replace("/(auth)/login");
      return res;
    } finally {
      isRefreshing = false;
    }
  }

  return new Promise((resolve) =>
    QUEUE.push(() => resolve(fetchWithAuth(url, init)))
  );
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
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound()     { return this.status === 404; }
  get isLimitReached() { return this.status === 429; }
}

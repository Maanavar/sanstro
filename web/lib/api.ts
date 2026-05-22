const BACKEND_PREFIX = "/api/backend";

// ── Token store ───────────────────────────────────────────────────────────────
// Token is written by the auth flow (sign-in page / Supabase callback) and
// read here so every API call is automatically authenticated.

const TOKEN_KEY = "jothidam_access_token";

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    query.set(key, String(value));
  });
  const value = query.toString();
  return value.length > 0 ? `?${value}` : "";
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  let response: Response;
  try {
    response = await fetch(`${BACKEND_PREFIX}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Network error — backend unreachable. Check your connection.");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // Try to extract a structured error message from JSON response bodies
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const msg =
        (typeof json.detail === "string" ? json.detail : null) ??
        (typeof json.message === "string" ? json.message : null) ??
        (Array.isArray(json.detail)
          ? (json.detail as Array<{ msg?: string }>).map((d) => d.msg ?? String(d)).join("; ")
          : null) ??
        text;
      throw new Error(`${response.status}: ${msg}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith(`${response.status}:`)) throw parseErr;
      throw new Error(text || `Request failed with status ${response.status}`);
    }
  }

  return (await response.json()) as T;
}

export function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error. Please try again.";
}

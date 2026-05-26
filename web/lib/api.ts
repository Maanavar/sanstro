const BACKEND_PREFIX = "/api/backend";

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
  let response: Response;
  try {
    response = await fetch(`${BACKEND_PREFIX}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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

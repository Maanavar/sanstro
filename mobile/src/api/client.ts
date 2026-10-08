import { router } from "expo-router";
import { getTokens, setTokens } from "@/lib/secureStore";
import { isTokenPair } from "@/lib/tokenPair";
import { ENV } from "@/lib/env";
import { currentGeneration, isCurrentGeneration } from "@/lib/sessionIdentity";
import {
  apiErrorDetail,
  initApiClient,
  parseApiError,
  type ApiError as ApiErrorEnvelope,
  type ApiQueryParams,
} from "@vinaadi/shared/api";

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

async function rotateTokens(generation: number): Promise<void> {
  const stored = await getTokens();
  if (!stored) throw new Error("no refresh token");

  const res = await fetch(buildApiUrl("/auth/mobile/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: stored.refreshToken }),
  });

  if (!res.ok) throw new Error("refresh failed");

  // Checked, not cast (A14 step 8): this body goes straight into SecureStore,
  // which writes the two keys separately. A 200 carrying only an access token
  // would keep the old refresh token — already rotated, i.e. revoked — and the
  // next refresh would present it, which the backend treats as token theft and
  // answers by revoking every session (A03). Anything but two non-empty token
  // strings is a failed refresh: nothing is written and the session ends.
  const json: unknown = await res.json();
  if (!isTokenPair(json)) throw new Error("refresh returned a malformed token pair");

  // A logout that landed while this was in flight must not be undone by it.
  // Writing these would hand the next (signed-out, or different) session a
  // working credential pair for the previous account — A02's invariant, on the
  // one code path most likely to violate it, because it is the only one that
  // writes credentials without a user action.
  if (!isCurrentGeneration(generation)) throw new SessionChangedError();

  await setTokens({
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
  });
}

class SessionChangedError extends Error {
  constructor() {
    super("session changed during refresh");
    this.name = "SessionChangedError";
  }
}

function getRefreshPromise(generation: number): Promise<void> {
  if (!_refreshPromise) {
    _refreshPromise = rotateTokens(generation).finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

/**
 * The session is over and no retry can help.
 *
 * Routed through the A02 coordinator rather than the old `clearTokens()` +
 * `router.replace()` pair, so a server-side revocation ends with the same end
 * state as pressing Sign out: cache cleared, persisted cache removed,
 * preferences and analytics identity dropped. Clearing only the tokens left the
 * previous account's data in a cache the next sign-in would read.
 */
async function endSessionTerminally(): Promise<void> {
  // Required lazily to break a genuine import cycle: the coordinator revokes
  // the session through @/api/auth, which is built on this module. Resolved at
  // call time, by which point every module in the cycle is initialised.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { endSession } = require("@/state/sessionTransition") as typeof import("@/state/sessionTransition");
  // revokeRemote: false — a 401 means the server has already stopped accepting
  // these credentials, and calling logout() would re-enter this same client.
  await endSession({ revokeRemote: false });
  router.replace("/(auth)/login");
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

async function sendOnce(url: string, init: RequestInit): Promise<Response> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": generateRequestId(),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;

  return fetch(buildApiUrl(url), { ...init, headers });
}

/**
 * Send a request, and on a 401 refresh ONCE and replay ONCE.
 *
 * A08. This used to end with `return fetchWithAuth(url, init)` — a tail call to
 * itself with nothing recording that the request had already spent its one
 * refresh. A resource that answers 401 for any reason other than an expired
 * access token (revoked session, changed permission, server bug) therefore
 * looped without bound, rotating the refresh token on every pass. Running the
 * pre-fix client against a persistently-401 resource ends in
 * `FATAL ERROR: JavaScript heap out of memory`; the audit's probe only looked
 * bounded because the probe itself failed the fifth refresh on purpose.
 *
 * Rotation makes the loop worse than a spin: each rotation revokes the previous
 * refresh token, so the loop burns the token family, and a concurrent genuine
 * request can then present a revoked token — which the backend reads as a theft
 * signal and answers by revoking everything and bumping `token_version` (A03).
 * A client retry bug could sign the user out of every device.
 *
 * Not implemented here, and not claimed: request deadlines and cancellation
 * (A08 step 7). The bound is on attempts, not on time.
 */
export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  // Which login lifecycle this request belongs to. Captured before the first
  // send, compared before anything is written or replayed.
  const generation = currentGeneration();

  const first = await sendOnce(url, init);
  if (first.status !== 401) return first;

  // A logout or account switch landed while this was in flight. Its result is
  // nobody's business now: do not refresh, do not replay, and above all do not
  // run the teardown again on the new session's behalf.
  if (!isCurrentGeneration(generation)) return first;

  try {
    await getRefreshPromise(generation);
  } catch {
    // Distinguishing a rejected refresh token from a network failure is A08
    // step 8 and needs the error classification this client does not yet have.
    // Until then a failed refresh is treated as terminal, which is the
    // pre-existing behaviour and errs toward signing out.
    if (isCurrentGeneration(generation)) await endSessionTerminally();
    return first;
  }

  if (!isCurrentGeneration(generation)) return first;

  const replayed = await sendOnce(url, init);
  if (replayed.status !== 401) return replayed;

  // The refresh succeeded and the resource still says no. More refreshes cannot
  // change that; this is the terminal outcome the old recursion never reached.
  if (isCurrentGeneration(generation)) await endSessionTerminally();
  return replayed;
}

export async function apiGet<T>(url: string, params?: ApiQueryParams): Promise<T> {
  const res = await fetchWithAuth(appendQuery(url, params));
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithAuth(url, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json() as Promise<T>;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchWithAuth(url, { method: "DELETE" });
  if (!res.ok) throw await ApiError.fromResponse(res);
}

export class ApiError extends Error {
  static async fromResponse(response: Response): Promise<ApiError> {
    const apiError = await parseApiError(response);
    return new ApiError(response.status, apiErrorDetail(apiError), apiError);
  }

  constructor(
    public readonly status: number,
    message: string,
    public readonly apiError?: ApiErrorEnvelope,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound()     { return this.status === 404; }
  get isLimitReached() { return this.status === 429; }
  get isConflict()     { return this.status === 409; }

  getUserMessage(): string {
    return this.apiError?.message.en ?? this.message;
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

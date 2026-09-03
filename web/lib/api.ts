import {
  apiErrorDetail,
  initApiClient,
  parseApiError,
  type ApiError,
  type ApiQueryParams,
} from "@vinaadi/shared/api";

const BACKEND_PREFIX = "/api/backend";
const API_V1_PREFIX = "/api/v1";
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  headers.set("X-Request-ID", crypto.randomUUID());
  const method = (init?.method ?? "GET").toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    headers.set("X-Vinaadi-CSRF", "1");
  }
  return headers;
}

function normalizeApiPath(path: string) {
  return path.startsWith("/api/") ? path : `${API_V1_PREFIX}${path}`;
}

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

function appendQuery(path: string, params?: ApiQueryParams) {
  if (!params) return path;
  const query = toQuery(params);
  if (!query) return path;
  return `${path}${path.includes("?") ? `&${query.slice(1)}` : query}`;
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_PREFIX}${normalizeApiPath(path)}`, {
      ...init,
      credentials: "include",
      headers: buildHeaders(init),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new Error("Network error - backend unreachable. Check your connection.");
  }

  if (!response.ok) {
    const apiError = await parseApiError(response);
    throw new ApiRequestError(response.status, path, apiError);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** A transport error carrying the typed backend envelope when one was returned. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly apiError: ApiError,
  ) {
    super(`${status}: ${path}: ${apiErrorDetail(apiError)}`);
    this.name = "ApiRequestError";
  }
}

export function getApiError(error: unknown): ApiError | null {
  return error instanceof ApiRequestError ? error.apiError : null;
}

initApiClient({
  get: (path, params) => apiFetchJson(appendQuery(path, params)),
  post: (path, body) => apiFetchJson(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  patch: (path, body) => apiFetchJson(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  put: (path, body) => apiFetchJson(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  delete: (path) => apiFetchJson(path, { method: "DELETE" }),
});

export function readErrorMessage(error: unknown): string {
  const apiError = getApiError(error);
  if (apiError) return apiErrorDetail(apiError);
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error. Please try again.";
}

export function readUserFriendlyError(error: unknown): { title: string; message: string; suggestion?: string } {
  const { formatErrorMessage } = require("./error-messages");
  if (typeof formatErrorMessage === "function") {
    return formatErrorMessage(error);
  }

  const msg = readErrorMessage(error);
  return {
    title: "Error",
    message: msg,
  };
}

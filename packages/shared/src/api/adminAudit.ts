// Contract for app/api/admin.py audit-log route, and for the admin routes whose
// reason admin spec L4 made required.
//
// The admin console calls these paths through its own fetch so it can attach
// the elevation header; it imports the types and `adminAuditPaths` from here,
// so a route or shape change has one place to land on the client side.

/** success = done; refused = a 4xx (elevation, not found, missing reason); error = a 5xx. */
export type AuditOutcome = "success" | "refused" | "error";

/** GET /admin/audit-log row (app/api/admin.py AuditLogEntry). */
export interface AuditLogEntry {
  id: string;
  action: string;
  actor_user_id: string | null;
  actor_email: string | null;
  /** owner, support, … or "service_key" for the server-to-server key, which names no person. */
  actor_role: string | null;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  outcome: AuditOutcome;
  /** Old/new values, per-table counts, and `error` ({status, detail}) on a refusal. */
  details: Record<string, unknown> | null;
  /** Free text on rows written before `details` existed. */
  payload_summary: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  total: number;
  items: AuditLogEntry[];
}

/** GET /admin/audit-log query. `actor` is an admin's user id, or part of their email. */
export interface AuditLogQuery {
  page?: number;
  page_size?: number;
  action?: string;
  actor?: string;
  target_type?: string;
  target_id?: string;
  outcome?: AuditOutcome;
  /** ISO-8601; bounds created_at, `since` inclusive and `until` exclusive. */
  since?: string;
  until?: string;
}

/** DELETE /admin/users/{id}/data answer (app/api/admin.py ErasureResultOut). The account is gone. */
export interface ErasureResult {
  /** How the audit log names the person from now on: `erased:<erasure_id>`. */
  erasure_id: string;
  erased_at: string;
  /** Registry key (app/privacy/registry.py) -> rows deleted, detached or, for accounting records, seen. */
  tables: Record<string, number>;
  /** External stores whose manual erasure step is now due, e.g. "posthog". */
  external_followups: string[];
}

/** One registry store in an export (app/privacy/erasure.py export_user). */
export interface DataExportStore {
  holds: string;
  retention: string;
  rows: Record<string, unknown>[];
}

/** GET /auth/me/export and GET /admin/users/{id}/export. */
export interface DataExport {
  format_version: number;
  exported_at: string;
  account_id: string;
  stores: Record<string, DataExportStore>;
  /** Processors outside the database that may hold data about the person. */
  elsewhere: { store: string; holds: string; retention: string }[];
}

/** Shortest reason the server accepts where one is required (audit_service.MIN_REASON_LENGTH). */
export const MIN_AUDIT_REASON_LENGTH = 3;

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const adminAuditPaths = {
  log: (q: AuditLogQuery = {}) => `/admin/audit-log${query({ ...q })}`,
  /** Reason required. Elevated. Erases the account itself, like DELETE /auth/me. Answers ErasureResult. */
  deleteUserData: (userId: string, reason: string) =>
    `/admin/users/${encodeURIComponent(userId)}/data${query({ reason })}`,
  /** GET. Reason required. Elevated. Answers DataExport. */
  exportUserData: (userId: string, reason: string) =>
    `/admin/users/${encodeURIComponent(userId)}/export${query({ reason })}`,
  /** PATCH body {suspend, reason}; a reason is required both ways. Elevated. */
  suspend: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/suspend`,
  /** A reason is required when the job is destructive (JobInfo.destructive), and elevation too. */
  triggerJob: (jobId: string, reason?: string) =>
    `/admin/jobs/${encodeURIComponent(jobId)}/trigger${query({ reason })}`,
  /** Reason required. Elevated. */
  clearQaRegressions: (reason: string) => `/qa/regressions${query({ reason })}`,
} as const;

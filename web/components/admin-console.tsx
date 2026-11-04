"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { useSession } from "@/hooks/useSession";
import { readErrorMessage } from "@/lib/api";
import {
  ADMIN_MFA_REQUIRED,
  ASSIGNABLE_ADMIN_ROLES,
  MIN_AUDIT_REASON_LENGTH,
  adminAccessPaths,
  adminAuditPaths,
  adminSupportPaths,
  adminSettingsPaths,
  parseApiErrorText,
  type AdminMe,
  type AdminRole,
  type AdminRoleEntry,
  type ApiErrorCode,
  type AuditLogEntry,
  type AuditLogQuery,
  type AuditLogResponse,
  type AuditOutcome,
  type DataExport,
  type ElevationGrant,
  type ErasureResult,
  type FlagChange,
  type FlagEntry,
  type LifeFocusMetrics,
  type MfaEnrolment,
  type RecoveryCodes,
  type SupportView,
} from "@vinaadi/shared/api";
import { AdminLifeFocusPanel } from "@/components/admin-life-focus-panel";
import { AdminSupportPanel } from "@/components/admin-support-panel";
import { formatDateTimeLabel } from "@/lib/format";

type AdminStats = {
  total_users: number;
  total_birth_profiles: number;
  total_charts: number;
  total_family_vaults: number;
  total_family_members: number;
  as_of: string;
};

type ComponentHealth = {
  name: string;
  status: "ok" | "warning" | "error";
  detail: string | null;
};

type HealthDetailResponse = {
  overall: string;
  components: ComponentHealth[];
  checked_at: string;
};

type UserSummary = {
  user_id: string;
  email: string | null;
  user_mode: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  birth_profile_count: number;
  chart_count: number;
  created_at: string;
};

type UserListResponse = {
  total: number;
  items: UserSummary[];
  page: number;
  page_size: number;
};

type UserDetail = UserSummary & {
  family_vault_count: number;
  family_member_count: number;
  feedback_count: number;
  ask_vinaadi_usage_today: number;
  subscription_tier: string | null;
  subscription_status: string | null;
};

type DailyCount = { date: string; count: number };
type DailyMetrics = { new_users: DailyCount[]; active_users: DailyCount[]; days: number };

type FeatureUsage = {
  charts_total: number;
  family_vaults_total: number;
  ask_vinaadi_total: number;
  ask_vinaadi_today: number;
  birth_profiles_total: number;
  as_of: string;
};

type RetentionCohort = {
  cohort_week: string;
  cohort_size: number;
  retained_d7: number;
  retained_d30: number;
};

type RetentionReport = { cohorts: RetentionCohort[] };

type CalibrationBucket = {
  key: string;
  hit: number;
  near: number;
  miss: number;
  n: number;
  hit_rate: number | null;
};

type CalibrationReport = {
  total_logged: number;
  total_open: number;
  total_graded: number;
  by_area_band: CalibrationBucket[];
  by_dasha_lord: CalibrationBucket[];
  as_of: string;
};

type FeedbackItem = {
  id: string;
  submitted_at: string;
  category: "bug" | "calculation" | "suggestion" | "review" | "other";
  rating: number | null;
  message: string;
  page_context: string | null;
  owner_user_id: string | null;
  is_review: boolean;
  allow_contact: boolean;
  reward_qualified: boolean;
};

type FeedbackResponse = {
  total: number;
  items: FeedbackItem[];
};

// `destructive` jobs need elevation and a reason (app/api/admin.py trigger_job).
type JobInfo = { job_id: string; label: string; description: string; destructive: boolean };
type JobRunResult = { job_id: string; started_at: string; finished_at: string; result_summary: string | null };

type AuditFilters = { action: string; actor: string; target_id: string; outcome: AuditOutcome | "" };
const EMPTY_AUDIT_FILTERS: AuditFilters = { action: "", actor: "", target_id: "", outcome: "" };

function hasReason(text: string): boolean {
  return text.trim().length >= MIN_AUDIT_REASON_LENGTH;
}

// What the row says beyond its columns: the structured details, or the old free text.
function auditDetailText(entry: AuditLogEntry): string {
  if (entry.details && Object.keys(entry.details).length > 0) return JSON.stringify(entry.details);
  return entry.payload_summary ?? "-";
}

/** Hand the operator a JSON file. Never stored anywhere else by the console. */
function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type AdminTab =
  | "overview"
  | "health"
  | "users"
  | "analytics"
  | "calibration"
  | "feedback"
  | "operations"
  | "notifications"
  | "config"
  | "audit"
  | "privacy"
  | "roles";

// `permission` is the one the tab's first request needs (app/core/permissions.py).
// Hiding a tab is a courtesy: the server refuses the request either way.
const tabs: Array<{ id: AdminTab; label: string; permission: string }> = [
  { id: "overview", label: "Overview", permission: "overview.read" },
  { id: "health", label: "Health", permission: "overview.read" },
  { id: "users", label: "Users", permission: "users.search" },
  { id: "analytics", label: "Analytics", permission: "overview.read" },
  { id: "calibration", label: "Calibration", permission: "overview.read" },
  { id: "feedback", label: "Feedback", permission: "feedback.review" },
  { id: "operations", label: "Operations", permission: "overview.read" },
  { id: "notifications", label: "Notifications", permission: "messaging.broadcast" },
  { id: "config", label: "Config", permission: "flags.read" },
  { id: "audit", label: "Audit Log", permission: "audit.read" },
  { id: "privacy", label: "Privacy", permission: "privacy.erase" },
  { id: "roles", label: "Roles", permission: "roles.grant" },
];

/** `month` is "YYYY-MM" from the picker; empty means "the endpoint's default". */
function lifeFocusPath(month: string): string {
  const trimmed = month.trim();
  return trimmed
    ? `/api/v1/admin/analytics/life-focus?month=${encodeURIComponent(trimmed)}`
    : "/api/v1/admin/analytics/life-focus";
}

function numberLabel(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat().format(value);
}

/** A flag value as editable text. Lists stay JSON so they round-trip. */
function draftFor(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

type ParsedDraft = { ok: true; value: unknown } | { ok: false; message: string };

/** Parse an edited flag by the type of its default, never by its look. */
function parseFlagDraft(defaultValue: unknown, raw: string): ParsedDraft {
  const text = raw.trim();
  if (typeof defaultValue === "boolean") {
    if (text === "true") return { ok: true, value: true };
    if (text === "false") return { ok: true, value: false };
    return { ok: false, message: "enter true or false." };
  }
  if (typeof defaultValue === "number") {
    const value = Number(text);
    if (text === "" || !Number.isInteger(value)) return { ok: false, message: "enter a whole number." };
    return { ok: true, value };
  }
  if (Array.isArray(defaultValue)) {
    try {
      const value: unknown = JSON.parse(text);
      if (Array.isArray(value)) return { ok: true, value };
    } catch {
      // fall through to the message below
    }
    return { ok: false, message: `"${raw}" is not a valid list, e.g. [3, 6].` };
  }
  return { ok: true, value: raw };
}

// ── Admin elevation (P1-4 step 2) ────────────────────────────────────────────
//
// Holding an admin session is authority to look. Destructive operations —
// erasing a user's data, suspending an account, broadcasting a push, moving a
// feature flag — additionally need proof that the person at the keyboard is
// still the account holder, given in the last few minutes.
//
// The token lives in a module variable and NEVER in sessionStorage. Persisting
// it would repeat the exact mistake this whole item exists to undo: the console
// used to keep a long-lived admin key in sessionStorage, readable by any XSS on
// the origin, any extension, anyone on a shared machine. A credential that dies
// with the tab is the design, not a limitation of it.
const ELEVATION_HEADER = "X-Admin-Elevation";

let elevationToken: string | null = null;
let elevationExpiresAtMs = 0;

// Treat the token as spent slightly before the server will, so a request sent
// right on the boundary fails in the UI's hands rather than the server's.
const ELEVATION_SKEW_MS = 5_000;

function liveElevationToken(): string | null {
  if (!elevationToken) return null;
  if (Date.now() >= elevationExpiresAtMs - ELEVATION_SKEW_MS) {
    elevationToken = null;
    return null;
  }
  return elevationToken;
}

function rememberElevation(token: string, expiresInSeconds: number) {
  elevationToken = token;
  elevationExpiresAtMs = Date.now() + expiresInSeconds * 1000;
}

function forgetElevation() {
  elevationToken = null;
  elevationExpiresAtMs = 0;
}

/**
 * Asks the operator for a second-factor code and returns whether elevation succeeded.
 * The console registers one on mount.
 *
 * This lives in the shared fetch layer rather than at each destructive call
 * site on purpose. Five operations need elevation today; the sixth one written
 * must not depend on its author remembering to wrap it — which is the same
 * failure mode the server-side structural test in tests/test_admin_elevation.py
 * exists to catch, handled here the same way: centrally, not by discipline.
 */
type ElevationPrompt = () => Promise<boolean>;
let elevationPrompt: ElevationPrompt | null = null;

function registerElevationPrompt(prompt: ElevationPrompt | null) {
  elevationPrompt = prompt;
}

/** The server's signal that this session may act, but must re-authenticate first. */
// Called when any admin route answers 403 `mfa_required` — the account's
// two-step sign-in was reset by another owner mid-session. The console swaps
// to the set-up screen instead of showing a raw 403.
let mfaRequiredHandler: (() => void) | null = null;

function registerMfaRequiredHandler(handler: (() => void) | null) {
  mfaRequiredHandler = handler;
}

function needsElevation(status: number, code?: ApiErrorCode) {
  return status === 403 && code === "ELEVATION_REQUIRED";
}

function adminHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  const method = (init.method ?? "GET").toUpperCase();
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    headers.set("X-Vinaadi-CSRF", "1");
  }
  const elevation = liveElevationToken();
  if (elevation) {
    headers.set(ELEVATION_HEADER, elevation);
  }
  return headers;
}

/** Pull `detail` out of an error body, falling back to the raw text. */
function errorDetail(text: string): string {
  try {
    const json = JSON.parse(text) as { detail?: unknown; message?: unknown };
    if (typeof json.detail === "string") return json.detail;
    if (typeof json.message === "string") return json.message;
  } catch {
    // Not JSON — the raw body is the best detail available.
  }
  return text;
}

async function adminFetchJson<T>(
  path: string,
  init: RequestInit = {},
  // Guards the retry to a single attempt. Without it, a server that kept
  // answering "elevation required" would prompt the operator in a loop.
  { allowElevationRetry = true }: { allowElevationRetry?: boolean } = {},
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    credentials: "include",
    headers: adminHeaders(init),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = errorDetail(text);
    const apiError = parseApiErrorText(response.status, text, response.headers.get("X-Request-ID"));

    if (response.status === 403 && detail === ADMIN_MFA_REQUIRED && mfaRequiredHandler) {
      mfaRequiredHandler();
    }

    if (allowElevationRetry && needsElevation(response.status, apiError.code) && elevationPrompt) {
      // Whatever we were holding is spent or was never right; do not send it again.
      forgetElevation();
      if (await elevationPrompt()) {
        return adminFetchJson<T>(path, init, { allowElevationRetry: false });
      }
    }

    throw new Error(detail ? `${response.status}: ${detail}` : `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function AdminConsole() {
  const { hydrated, userEmail, signOut } = useSession();
  // No credential is held here any more. Admin authority is a property of the
  // signed-in session and is checked server-side; the console only needs to
  // know whether this session has it, which it learns by asking.
  // "enrol" = an admin who has not finished two-step sign-in set-up; every
  // admin route except /admin/me and /admin/mfa/* answers them 403 mfa_required.
  const [access, setAccess] = useState<"checking" | "enrol" | "granted" | "denied">("checking");
  const [me, setMe] = useState<AdminMe | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [status, setStatus] = useState("Checking admin access…");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Non-null means the elevation modal is up and a destructive request is parked
  // on its answer. Resolving with `false` (cancel/Escape) lets that request fail
  // normally rather than hanging.
  const [elevationAsk, setElevationAsk] = useState<{ resolve: (ok: boolean) => void } | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [healthDetail, setHealthDetail] = useState<HealthDetailResponse | null>(null);
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  // The L9 support view, loaded alongside the detail for the same account. Kept
  // separate because it is the one request that may be refused on its own: a
  // role with `users.search` but not `users.read_masked` still gets the list.
  const [supportView, setSupportView] = useState<SupportView | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [retention, setRetention] = useState<RetentionReport | null>(null);
  // Life Focus (audit U7). "" = whatever month the endpoint defaults to (the
  // current one), so the first load needs no date arithmetic here.
  const [lifeFocus, setLifeFocus] = useState<LifeFocusMetrics | null>(null);
  const [lifeFocusMonth, setLifeFocusMonth] = useState("");
  const [calibration, setCalibration] = useState<CalibrationReport | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [jobResults, setJobResults] = useState<Record<string, JobRunResult>>({});
  const [runningJob, setRunningJob] = useState<string | null>(null);
  // Destructive jobs need a reason (admin spec L4); one reason covers the next run.
  const [jobReason, setJobReason] = useState("");
  const [flags, setFlags] = useState<FlagEntry[]>([]);
  const [flagDrafts, setFlagDrafts] = useState<Record<string, string>>({});
  // Every persisted change records why (admin spec §2.7); one reason covers the next save.
  const [flagReason, setFlagReason] = useState("");
  const [flagHistory, setFlagHistory] = useState<FlagChange[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogResponse | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteResult, setDeleteResult] = useState<ErasureResult | null>(null);
  const [exportUserId, setExportUserId] = useState("");
  const [exportReason, setExportReason] = useState("");
  const [roles, setRoles] = useState<AdminRoleEntry[]>([]);
  const [roleUserId, setRoleUserId] = useState("");
  const [roleChoice, setRoleChoice] = useState<AdminRole>("support");
  const [roleReason, setRoleReason] = useState("");
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);

  const isUnlocked = access === "granted";
  const visibleTabs = useMemo(
    () => tabs.filter((tab) => me?.permissions.includes(tab.permission)),
    [me],
  );

  // Probe once on mount. The backend is the only thing that can answer this:
  // get_admin_user checks the is_admin column and the bootstrap admin-email
  // Hand the fetch layer a way to ask for a password, so a destructive call that
  // comes back "elevation required" can raise the prompt and retry itself. No
  // call site needs to know elevation exists.
  //
  // Elevation is dropped on unmount: leaving the console should not leave a live
  // destructive credential behind in the tab.
  useEffect(() => {
    registerElevationPrompt(
      () => new Promise<boolean>((resolve) => setElevationAsk({ resolve })),
    );
    return () => {
      registerElevationPrompt(null);
      forgetElevation();
    };
  }, []);

  // role against the session. A 403 here is a legitimate answer about this
  // account, not a failure to report as an error. /admin/me answers before
  // two-step sign-in is set up, so it can tell "not an admin" from "an admin
  // who must enrol first".
  async function probeAccess(isCancelled: () => boolean = () => false) {
    try {
      const who = await adminFetchJson<AdminMe>(`/api/v1${adminAccessPaths.me}`);
      if (isCancelled()) return;
      setMe(who);
      if (who.mfa_enrolled) {
        setAccess("granted");
        setStatus(`Signed in as ${who.role}.`);
      } else {
        setAccess("enrol");
        setStatus("Set up two-step sign-in to open the console.");
      }
    } catch {
      if (isCancelled()) return;
      setMe(null);
      setAccess("denied");
      setStatus("This account does not have administrator access.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void probeAccess(() => cancelled);
    registerMfaRequiredHandler(() => {
      setAccess("enrol");
      setStatus("Two-step sign-in must be set up again.");
    });
    return () => {
      cancelled = true;
      registerMfaRequiredHandler(null);
    };
  }, []);

  // Land on the first tab the role can open; a support agent has no Config tab.
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "overview") return;
    void loadOverview();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "health") return;
    void loadHealthDetail();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "users") return;
    // Read the current userSearch when the tab is opened, but intentionally do
    // NOT react to it: the search input updates userSearch on every keystroke and
    // search is submitted explicitly (Search button), so depending on it here
    // would fire a request per keystroke. This reads the latest value at
    // activation, which is the intended behaviour — not a stale closure.
    void loadUsers(1, userSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "analytics") return;
    // Load on tab activation only. loadAnalytics reads lifeFocusMonth, but the
    // month picker reloads Life Focus itself (loadLifeFocus), so reacting to the
    // month here would refetch all four reports on every pick.
    void loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "calibration") return;
    void loadCalibration();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "feedback") return;
    void loadFeedback();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "operations") return;
    void loadJobs();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "config") return;
    void loadFlags();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "roles") return;
    void loadRoles();
  }, [isUnlocked, activeTab]);

  useEffect(() => {
    if (!isUnlocked || activeTab !== "audit") return;
    // Opening the tab starts unfiltered, so the list and the filter inputs agree.
    setAuditFilters(EMPTY_AUDIT_FILTERS);
    void loadAuditLog(1, EMPTY_AUDIT_FILTERS);
  }, [isUnlocked, activeTab]);

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<AdminStats>("/api/v1/admin/stats");
      setStats(data);
      setStatus("Overview refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("Overview could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHealthDetail() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<HealthDetailResponse>("/api/v1/admin/health/detail");
      setHealthDetail(data);
      setStatus("Health check refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers(page = 1, search = "") {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "50" });
      if (search) params.set("search", search);
      const data = await adminFetchJson<UserListResponse>(`/api/v1/admin/users?${params}`);
      setUserList(data);
      setUserPage(page);
      setStatus("User list refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadUserDetail(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<UserDetail>(`/api/v1/admin/users/${encodeURIComponent(userId)}`);
      setUserDetail(data);
      setStatus("User details loaded.");
      await loadSupportView(userId);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /** The L9 support view. A refusal here must not blank the detail already shown. */
  async function loadSupportView(userId: string) {
    try {
      setSupportView(
        await adminFetchJson<SupportView>(`/api/v1${adminSupportPaths.view(userId)}`),
      );
    } catch {
      setSupportView(null);
    }
  }

  /** The four L9 actions, which differ only in path, body and what to say after. */
  async function supportAction(
    userId: string,
    path: string,
    body: Record<string, unknown>,
    done: string,
  ) {
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${path}`, { method: "POST", body: JSON.stringify(body) });
      setStatus(done);
      // Re-read rather than patch local state: a grant changes the access
      // state, and the sources list is computed server-side.
      await loadSupportView(userId);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspend(userId: string, suspend: boolean) {
    // Required both ways: a reinstatement undoes a decision and is audited with why.
    if (!hasReason(suspendReason)) {
      setError("Write a short reason first. Suspending and reinstating are both audited with it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminAuditPaths.suspend(userId)}`, {
        method: "PATCH",
        body: JSON.stringify({ suspend, reason: suspendReason.trim() }),
      });
      setSuspendReason("");
      await loadUserDetail(userId);
      await loadUsers(userPage, userSearch);
      setStatus(suspend ? "User suspended." : "User reinstated.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [daily, features, ret, focus] = await Promise.all([
        adminFetchJson<DailyMetrics>("/api/v1/admin/analytics/daily?days=30"),
        adminFetchJson<FeatureUsage>("/api/v1/admin/analytics/features"),
        adminFetchJson<RetentionReport>("/api/v1/admin/analytics/retention"),
        adminFetchJson<LifeFocusMetrics>(lifeFocusPath(lifeFocusMonth)),
      ]);
      setDailyMetrics(daily);
      setFeatureUsage(features);
      setRetention(ret);
      setLifeFocus(focus);
      setStatus("Analytics refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /** Reload Life Focus alone, for the month selector (audit U7). */
  async function loadLifeFocus() {
    setLoading(true);
    setError(null);
    try {
      setLifeFocus(await adminFetchJson<LifeFocusMetrics>(lifeFocusPath(lifeFocusMonth)));
      setStatus("Life Focus measures refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadCalibration() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<CalibrationReport>("/api/v1/admin/calibration");
      setCalibration(data);
      setStatus("Calibration report refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadFeedback() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<FeedbackResponse>("/api/v1/feedback");
      setFeedback(data);
      setStatus("Feedback refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleRewardQualified(feedbackId: string, rewardQualified: boolean) {
    setLoading(true);
    setError(null);
    try {
      const updated = await adminFetchJson<FeedbackItem>(`/api/v1/feedback/${encodeURIComponent(feedbackId)}/reward`, {
        method: "PATCH",
        body: JSON.stringify({ reward_qualified: rewardQualified }),
      });
      setFeedback((prev) => (prev ? { ...prev, items: prev.items.map((item) => (item.id === updated.id ? updated : item)) } : prev));
      setStatus(rewardQualified ? "Marked reward-qualified." : "Reward qualification removed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<JobInfo[]>("/api/v1/admin/jobs");
      setJobs(data);
      setStatus("Job registry refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function triggerJob(job: JobInfo) {
    const jobId = job.job_id;
    if (job.destructive && !hasReason(jobReason)) {
      setError("This job deletes or sends something. Write a reason first; the run is audited with it.");
      return;
    }
    setRunningJob(jobId);
    setError(null);
    try {
      const result = await adminFetchJson<JobRunResult>(
        `/api/v1${adminAuditPaths.triggerJob(jobId, jobReason.trim() || undefined)}`,
        { method: "POST" },
      );
      if (job.destructive) setJobReason("");
      setJobResults((prev) => ({ ...prev, [jobId]: result }));
      setStatus(`Job ${jobId} completed.`);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setRunningJob(null);
    }
  }

  async function loadFlags() {
    setLoading(true);
    setError(null);
    try {
      const [data, history] = await Promise.all([
        adminFetchJson<FlagEntry[]>(`/api/v1${adminSettingsPaths.list}`),
        adminFetchJson<FlagChange[]>(`/api/v1${adminSettingsPaths.history}?limit=50`),
      ]);
      setFlags(data);
      setFlagHistory(history);
      setFlagDrafts(Object.fromEntries(data.map((flag) => [flag.name, draftFor(flag.value)])));
      setStatus("Config flags refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function requireReason(): string | null {
    const reason = flagReason.trim();
    if (reason.length < 3) {
      setError("Write a reason first. Every setting change records who, when and why.");
      return null;
    }
    return reason;
  }

  async function saveFlag(flag: FlagEntry, rawValue: string) {
    // Parsed by the default's type, not by what the text looks like: a string
    // flag such as a banner must be able to hold "10", and a boolean must never
    // receive the text "false". The server checks the type again.
    const parsed = parseFlagDraft(flag.default, rawValue);
    if (!parsed.ok) {
      setError(`Flag ${flag.name}: ${parsed.message}`);
      return;
    }
    const reason = requireReason();
    if (reason === null) return;

    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminSettingsPaths.flag(flag.name)}`, {
        method: "PATCH",
        body: JSON.stringify({ value: parsed.value, reason }),
      });
      setStatus(`Flag ${flag.name} updated${flag.doctrine ? " on this worker only" : " for every worker"}.`);
      setFlagReason("");
      await loadFlags();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetFlag(name: string) {
    const reason = requireReason();
    if (reason === null) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminSettingsPaths.reset(name, reason)}`, {
        method: "DELETE",
      });
      setStatus(`Flag ${name} reset to default.`);
      setFlagReason("");
      await loadFlags();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function rollbackFlagChange(change: FlagChange) {
    const reason = requireReason();
    if (reason === null) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminSettingsPaths.rollback(change.id)}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setStatus(`Change to ${change.name} rolled back.`);
      setFlagReason("");
      await loadFlags();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Filters are an argument, not read from state, so the tab-open effect does
  // not depend on (and re-run for) every keystroke in the filter inputs.
  async function loadAuditLog(page: number, filters: AuditFilters) {
    setLoading(true);
    setError(null);
    const query: AuditLogQuery = {
      page,
      page_size: 100,
      action: filters.action.trim() || undefined,
      actor: filters.actor.trim() || undefined,
      target_id: filters.target_id.trim() || undefined,
      outcome: filters.outcome || undefined,
    };
    try {
      const data = await adminFetchJson<AuditLogResponse>(`/api/v1${adminAuditPaths.log(query)}`);
      setAuditLog(data);
      setAuditPage(page);
      setStatus("Audit log refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteUserData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUnlocked) return;
    const userId = deleteUserId.trim();
    if (!userId || deleteConfirm.trim() !== "DELETE" || !hasReason(deleteReason)) {
      setError("Enter a user id and a reason, and type DELETE to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetchJson<ErasureResult>(
        `/api/v1${adminAuditPaths.deleteUserData(userId, deleteReason.trim())}`,
        { method: "DELETE" },
      );
      setDeleteResult(result);
      setDeleteConfirm("");
      setDeleteReason("");
      setDeleteUserId("");
      setStatus("Account erased.");
      if (activeTab === "overview") {
        await loadOverview();
      }
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("Erasure failed.");
    } finally {
      setLoading(false);
    }
  }

  async function exportUserData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUnlocked) return;
    const userId = exportUserId.trim();
    if (!userId || !hasReason(exportReason)) {
      setError("Enter a user id and a reason. Every export is audited with it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<DataExport>(
        `/api/v1${adminAuditPaths.exportUserData(userId, exportReason.trim())}`,
      );
      downloadJson(`vinaadi-export-${userId}.json`, data);
      setExportReason("");
      setStatus("Export downloaded.");
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("Export failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    setLoading(true);
    setError(null);
    try {
      setRoles(await adminFetchJson<AdminRoleEntry[]>(`/api/v1${adminAccessPaths.roles}`));
      setStatus("Roles refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function requireRoleReason(): string | null {
    const reason = roleReason.trim();
    if (reason.length < 3) {
      setError("Write a short reason first. Every role change is audited with it.");
      return null;
    }
    return reason;
  }

  async function grantRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = roleUserId.trim();
    const reason = requireRoleReason();
    if (!userId || !reason) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson<AdminRoleEntry>(`/api/v1${adminAccessPaths.role(userId)}`, {
        method: "PUT",
        body: JSON.stringify({ role: roleChoice, reason }),
      });
      setRoleUserId("");
      setRoleReason("");
      setStatus(`Granted ${roleChoice}.`);
      await loadRoles();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function revokeRole(entry: AdminRoleEntry) {
    const reason = requireRoleReason();
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminAccessPaths.revokeRole(entry.user_id, reason)}`, { method: "DELETE" });
      setRoleReason("");
      setStatus(`Removed ${entry.role} from ${entry.email ?? entry.user_id}.`);
      await loadRoles();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetMfa(entry: AdminRoleEntry) {
    const reason = requireRoleReason();
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1${adminAccessPaths.resetMfa(entry.user_id, reason)}`, { method: "DELETE" });
      setRoleReason("");
      setStatus(`Two-step sign-in reset for ${entry.email ?? entry.user_id}. They must set it up again.`);
      await loadRoles();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function replaceRecoveryCodes() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetchJson<RecoveryCodes>(`/api/v1${adminAccessPaths.mfaRecoveryCodes}`, {
        method: "POST",
      });
      setNewRecoveryCodes(result.recovery_codes);
      setStatus("New recovery codes issued. The old ones no longer work.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function clearLoadedData() {
    setStats(null);
    setHealthDetail(null);
    setUserList(null);
    setUserDetail(null);
    setDailyMetrics(null);
    setFeatureUsage(null);
    setRetention(null);
    setFeedback(null);
    setJobs([]);
    setJobResults({});
    setFlags([]);
    setFlagDrafts({});
    setAuditLog(null);
    setAuditFilters(EMPTY_AUDIT_FILTERS);
    setDeleteResult(null);
    setDeleteReason("");
    setExportUserId("");
    setExportReason("");
    setJobReason("");
    setRoles([]);
    setNewRecoveryCodes(null);
  }

  const statsRows = useMemo(
    () => [
      { label: "Users", value: stats?.total_users, hint: "Registered identities" },
      { label: "Birth profiles", value: stats?.total_birth_profiles, hint: "Stored profile records" },
      { label: "Charts", value: stats?.total_charts, hint: "Calculated jadhagam records" },
      { label: "Family vaults", value: stats?.total_family_vaults, hint: "Shared planning groups" },
      { label: "Family members", value: stats?.total_family_members, hint: "Managed people" },
    ],
    [stats],
  );

  const detailMetrics = useMemo(
    () =>
      userDetail
        ? [
            { label: "Mode", value: userDetail.user_mode },
            { label: "Profiles", value: userDetail.birth_profile_count },
            { label: "Charts", value: userDetail.chart_count },
            { label: "Vaults", value: userDetail.family_vault_count },
            { label: "Members", value: userDetail.family_member_count },
            { label: "Feedback", value: userDetail.feedback_count },
            { label: "Asks today", value: userDetail.ask_vinaadi_usage_today },
            { label: "Subscription", value: userDetail.subscription_tier ?? "None" },
            { label: "Sub status", value: userDetail.subscription_status ?? "-" },
          ]
        : [],
    [userDetail],
  );

  if (!hydrated) {
    return (
      <main className="admin-shell">
        <div className="admin-loading" role="status">Loading admin session...</div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Vinaadi Operations</p>
          <h1>Admin Console</h1>
          <p className="admin-subtitle">Monitor health, manage users, and control runtime operations.</p>
        </div>
        <div className="admin-session">
          <span className="admin-session__email">
            {userEmail ?? "Signed in"}
            {me ? ` · ${me.role}` : ""}
          </span>
          <button className="admin-button admin-button--quiet" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="admin-status" aria-live="polite">
        <div>
          <span className={`admin-dot ${error ? "admin-dot--error" : isUnlocked ? "admin-dot--ok" : ""}`} />
          <span>{error ?? status}</span>
        </div>
        {isUnlocked ? (
          <button
            className="admin-button admin-button--quiet"
            type="button"
            onClick={() => {
              clearLoadedData();
              signOut();
            }}
          >
            Sign out
          </button>
        ) : null}
      </section>

      {access === "enrol" ? (
        <MfaSetup
          onDone={() => {
            void probeAccess();
          }}
        />
      ) : !isUnlocked ? (
        <section className="admin-unlock" aria-labelledby="admin-unlock-title">
          <div>
            <p className="admin-kicker">Protected Area</p>
            <h2 id="admin-unlock-title">
              {access === "checking" ? "Checking access…" : "Administrator access required"}
            </h2>
            <p>
              {access === "checking"
                ? "Confirming whether this account has administrator access."
                : "This console is available to accounts with administrator access. " +
                  "There is no key to enter — authority comes from who you are signed in as, " +
                  "so ask an existing administrator to grant it to this account."}
            </p>
          </div>
        </section>
      ) : (
        <>
          <nav className="admin-tabs" aria-label="Admin sections">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? "admin-tab--active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "overview" ? (
            <section className="admin-section" aria-labelledby="overview-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="overview-title">System Overview</h2>
                  <p>Counts refresh from the backend admin stats endpoint.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadOverview()} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="admin-metrics">
                {statsRows.map((row) => (
                  <div className="admin-metric" key={row.label}>
                    <span>{row.label}</span>
                    <strong>{numberLabel(row.value)}</strong>
                    <small>{row.hint}</small>
                  </div>
                ))}
              </div>
              <div className="admin-note">
                <span>Last stats snapshot</span>
                <strong>{formatDateTimeLabel(stats?.as_of)}</strong>
              </div>
            </section>
          ) : null}

          {activeTab === "health" ? (
            <section className="admin-section" aria-labelledby="health-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="health-title">System Health</h2>
                  {healthDetail ? (
                    <p>
                      Overall:
                      {" "}
                      <span className={`admin-badge ${healthDetail.overall === "ok" ? "admin-badge--ok" : "admin-badge--danger"}`}>
                        {healthDetail.overall.toUpperCase()}
                      </span>
                      {" "}
                      as of {formatDateTimeLabel(healthDetail.checked_at)}
                    </p>
                  ) : (
                    <p>Database, scheduler, and secrets health checks.</p>
                  )}
                </div>
                <button className="admin-button" type="button" onClick={() => void loadHealthDetail()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <div className="admin-health-list">
                {(healthDetail?.components ?? []).map((component) => (
                  <div key={component.name} className={`admin-health-item admin-health-item--${component.status}`}>
                    <div className="admin-health-name">
                      <span
                        className={`admin-dot ${
                          component.status === "ok"
                            ? "admin-dot--ok"
                            : component.status === "warning"
                              ? "admin-dot--warning"
                              : "admin-dot--error"
                        }`}
                      />
                      <code>{component.name}</code>
                    </div>
                    <span className="admin-health-detail">{component.detail ?? "-"}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "users" ? (
            <section className="admin-section" aria-labelledby="users-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="users-title">User Management</h2>
                  <p>{numberLabel(userList?.total)} registered users.</p>
                </div>
              </div>
              <form
                className="admin-search-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadUsers(1, userSearch);
                }}
              >
                <input
                  className="admin-input"
                  type="search"
                  placeholder="Search by email..."
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
                <button className="admin-button" type="submit" disabled={loading}>Search</button>
                <button
                  className="admin-button admin-button--quiet"
                  type="button"
                  onClick={() => {
                    setUserSearch("");
                    void loadUsers(1, "");
                  }}
                >
                  Clear
                </button>
              </form>

              {userDetail ? (
                <div className="admin-user-detail">
                  <div className="admin-section__header">
                    <div>
                      <h3>{userDetail.email ?? userDetail.user_id}</h3>
                      <p>Joined {formatDateTimeLabel(userDetail.created_at)}</p>
                    </div>
                    <button className="admin-button admin-button--quiet" type="button" onClick={() => setUserDetail(null)}>
                      Close
                    </button>
                  </div>
                  <div className="admin-metrics admin-metrics--detail">
                    {detailMetrics.map((row) => (
                      <div className="admin-metric" key={row.label}>
                        <span>{row.label}</span>
                        <strong>{typeof row.value === "number" ? numberLabel(row.value) : row.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="admin-suspend-section">
                    <h4>{userDetail.is_suspended ? "Account is suspended" : "Account is active"}</h4>
                    {userDetail.suspension_reason ? <p>Reason: {userDetail.suspension_reason}</p> : null}
                    <div className="admin-suspend-form">
                      <input
                        className="admin-input"
                        type="text"
                        aria-label={userDetail.is_suspended ? "Reinstatement reason" : "Suspension reason"}
                        placeholder={
                          userDetail.is_suspended ? "Why reinstate (required)" : "Suspension reason (required)"
                        }
                        maxLength={500}
                        value={suspendReason}
                        onChange={(event) => setSuspendReason(event.target.value)}
                      />
                      {userDetail.is_suspended ? (
                        <button
                          className="admin-button"
                          type="button"
                          onClick={() => void toggleSuspend(userDetail.user_id, false)}
                          disabled={loading || !hasReason(suspendReason)}
                        >
                          Reinstate account
                        </button>
                      ) : (
                        <button
                          className="admin-button admin-button--danger"
                          type="button"
                          onClick={() => void toggleSuspend(userDetail.user_id, true)}
                          disabled={loading || !hasReason(suspendReason)}
                        >
                          Suspend account
                        </button>
                      )}
                    </div>
                  </div>
                  {supportView ? (
                    <AdminSupportPanel
                      view={supportView}
                      role={me?.role ?? null}
                      busy={loading}
                      onResetLink={(reason) =>
                        void supportAction(
                          userDetail.user_id,
                          adminSupportPaths.resetLink(userDetail.user_id),
                          { reason },
                          "A reset link has been emailed to the account holder.",
                        )
                      }
                      onForceLogout={(reason) =>
                        void supportAction(
                          userDetail.user_id,
                          adminSupportPaths.forceLogout(userDetail.user_id),
                          { reason },
                          "Every session has been ended.",
                        )
                      }
                      onGrant={(key, days, reason) =>
                        void supportAction(
                          userDetail.user_id,
                          adminSupportPaths.grantEntitlement(userDetail.user_id),
                          { key, days, reason },
                          `Granted ${key} for ${days} days.`,
                        )
                      }
                      onRevoke={(entitlementId, reason) =>
                        void supportAction(
                          userDetail.user_id,
                          adminSupportPaths.revokeEntitlement(userDetail.user_id, entitlementId),
                          { reason },
                          "The entitlement has been revoked.",
                        )
                      }
                    />
                  ) : null}
                </div>
              ) : (userList?.items ?? []).length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Mode</th>
                      <th>Profiles</th>
                      <th>Charts</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(userList?.items ?? []).map((user) => (
                      <tr key={user.user_id} className={user.is_suspended ? "admin-row--suspended" : ""}>
                        <td>{user.email ?? <em>anonymous</em>}</td>
                        <td>{user.user_mode}</td>
                        <td>{numberLabel(user.birth_profile_count)}</td>
                        <td>{numberLabel(user.chart_count)}</td>
                        <td>
                          <span className={`admin-badge ${user.is_suspended ? "admin-badge--danger" : "admin-badge--ok"}`}>
                            {user.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td>{formatDateTimeLabel(user.created_at)}</td>
                        <td>
                          <button
                            className="admin-button admin-button--quiet"
                            type="button"
                            onClick={() => void loadUserDetail(user.user_id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="admin-empty">No users found.</div>
              )}

              {(userList?.total ?? 0) > 50 && !userDetail ? (
                <div className="admin-pagination">
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    disabled={userPage <= 1 || loading}
                    onClick={() => void loadUsers(userPage - 1, userSearch)}
                  >
                    Previous
                  </button>
                  <span>Page {userPage} of {Math.ceil((userList?.total ?? 0) / 50)}</span>
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    disabled={userPage * 50 >= (userList?.total ?? 0) || loading}
                    onClick={() => void loadUsers(userPage + 1, userSearch)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "analytics" ? (
            <section className="admin-section" aria-labelledby="analytics-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="analytics-title">Analytics</h2>
                  <p>Growth and feature usage over the last 30 days.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadAnalytics()} disabled={loading}>
                  Refresh
                </button>
              </div>

              {featureUsage ? (
                <div className="admin-metrics">
                  {[
                    { label: "Total charts", value: featureUsage.charts_total, hint: "All time" },
                    { label: "Profiles", value: featureUsage.birth_profiles_total, hint: "All time" },
                    { label: "Family vaults", value: featureUsage.family_vaults_total, hint: "All time" },
                    { label: "Ask Vinaadi total", value: featureUsage.ask_vinaadi_total, hint: "All time" },
                    { label: "Ask Vinaadi today", value: featureUsage.ask_vinaadi_today, hint: "Current day" },
                  ].map((row) => (
                    <div className="admin-metric" key={row.label}>
                      <span>{row.label}</span>
                      <strong>{numberLabel(row.value)}</strong>
                      <small>{row.hint}</small>
                    </div>
                  ))}
                </div>
              ) : null}

              {dailyMetrics ? (
                <div className="admin-chart-section">
                  <h3>New signups - last {dailyMetrics.days} days</h3>
                  <div className="admin-sparkbar-row">
                    {dailyMetrics.new_users.map((day) => {
                      const maxCount = Math.max(...dailyMetrics.new_users.map((entry) => entry.count), 1);
                      return (
                        <div key={day.date} className="admin-sparkbar" title={`${day.date}: ${day.count}`}>
                          <div className="admin-sparkbar__fill" style={{ height: `${(day.count / maxCount) * 100}%` }} />
                          <span className="admin-sparkbar__label">{day.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {retention && retention.cohorts.length > 0 ? (
                <div className="admin-retention">
                  <h3>Weekly cohort retention</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Cohort week</th>
                        <th>Signed up</th>
                        <th>Active D7</th>
                        <th>D7 %</th>
                        <th>Active D30</th>
                        <th>D30 %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retention.cohorts.map((cohort) => (
                        <tr key={cohort.cohort_week}>
                          <td>{cohort.cohort_week}</td>
                          <td>{numberLabel(cohort.cohort_size)}</td>
                          <td>{numberLabel(cohort.retained_d7)}</td>
                          <td>{cohort.cohort_size > 0 ? `${Math.round((cohort.retained_d7 / cohort.cohort_size) * 100)}%` : "-"}</td>
                          <td>{numberLabel(cohort.retained_d30)}</td>
                          <td>{cohort.cohort_size > 0 ? `${Math.round((cohort.retained_d30 / cohort.cohort_size) * 100)}%` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <AdminLifeFocusPanel
                metrics={lifeFocus}
                month={lifeFocusMonth}
                onMonthChange={setLifeFocusMonth}
                onRefresh={() => void loadLifeFocus()}
                loading={loading}
              />
            </section>
          ) : null}

          {activeTab === "calibration" ? (
            <section className="admin-section" aria-labelledby="calibration-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="calibration-title">Prediction Calibration (D5)</h2>
                  <p>
                    {calibration
                      ? `Hit/near/miss rates as of ${formatDateTimeLabel(calibration.as_of)}. Read-only — any weight recalibration stays a manual owner + specialist decision.`
                      : "Hit/near/miss rates per life area, band, and dasha lord."}
                  </p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadCalibration()} disabled={loading}>
                  Refresh
                </button>
              </div>

              {calibration ? (
                <>
                  <div className="admin-metrics">
                    {[
                      { label: "Total logged", value: calibration.total_logged },
                      { label: "Still open", value: calibration.total_open, hint: "Not yet graded" },
                      { label: "Graded", value: calibration.total_graded },
                    ].map((row) => (
                      <div className="admin-metric" key={row.label}>
                        <span>{row.label}</span>
                        <strong>{numberLabel(row.value)}</strong>
                        {row.hint ? <small>{row.hint}</small> : null}
                      </div>
                    ))}
                  </div>

                  {calibration.total_graded < 30 ? (
                    <div className="admin-empty">
                      Fewer than 30 graded predictions so far — bucket numbers below are not statistically meaningful yet.
                    </div>
                  ) : null}

                  <div className="admin-retention">
                    <h3>By life area &times; band</h3>
                    {calibration.by_area_band.length > 0 ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Life area / band</th>
                            <th>Hit</th>
                            <th>Near</th>
                            <th>Miss</th>
                            <th>N</th>
                            <th>Hit rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calibration.by_area_band.map((bucket) => (
                            <tr key={bucket.key}>
                              <td>{bucket.key}</td>
                              <td>{numberLabel(bucket.hit)}</td>
                              <td>{numberLabel(bucket.near)}</td>
                              <td>{numberLabel(bucket.miss)}</td>
                              <td>{numberLabel(bucket.n)}</td>
                              <td>{bucket.hit_rate !== null ? `${Math.round(bucket.hit_rate * 100)}%` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="admin-empty">No graded predictions yet.</div>
                    )}
                  </div>

                  <div className="admin-retention">
                    <h3>By active dasha lord</h3>
                    {calibration.by_dasha_lord.length > 0 ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Dasha lord</th>
                            <th>Hit</th>
                            <th>Near</th>
                            <th>Miss</th>
                            <th>N</th>
                            <th>Hit rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calibration.by_dasha_lord.map((bucket) => (
                            <tr key={bucket.key}>
                              <td>{bucket.key}</td>
                              <td>{numberLabel(bucket.hit)}</td>
                              <td>{numberLabel(bucket.near)}</td>
                              <td>{numberLabel(bucket.miss)}</td>
                              <td>{numberLabel(bucket.n)}</td>
                              <td>{bucket.hit_rate !== null ? `${Math.round(bucket.hit_rate * 100)}%` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="admin-empty">No graded predictions yet.</div>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {activeTab === "feedback" ? (
            <section className="admin-section" aria-labelledby="feedback-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="feedback-title">Feedback Inbox</h2>
                  <p>{numberLabel(feedback?.total)} submissions in the feedback store.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadFeedback()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <div className="admin-feedback-list">
                {(feedback?.items ?? []).length > 0 ? (
                  feedback?.items.map((item) => (
                    <article className="admin-feedback" key={item.id}>
                      <div className="admin-feedback__meta">
                        <span className="admin-badge">{item.category}</span>
                        <span>{formatDateTimeLabel(item.submitted_at)}</span>
                        <span>{item.rating ? `${item.rating}/5` : "No rating"}</span>
                        {item.reward_qualified ? (
                          <span className="admin-badge admin-badge--ok">Reward-qualified</span>
                        ) : null}
                      </div>
                      <p>{item.message}</p>
                      <footer>
                        <span>User {item.owner_user_id ?? "unknown"}</span>
                        <span>{item.page_context ?? "No page context"}</span>
                        <button
                          className="admin-button admin-button--quiet"
                          type="button"
                          disabled={loading}
                          onClick={() => void toggleRewardQualified(item.id, !item.reward_qualified)}
                        >
                          {item.reward_qualified ? "Remove reward flag" : "Mark reward-qualified"}
                        </button>
                      </footer>
                    </article>
                  ))
                ) : (
                  <div className="admin-empty">No feedback yet.</div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "operations" ? (
            <section className="admin-section" aria-labelledby="operations-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="operations-title">Background Jobs</h2>
                  <p>Manually trigger any registered background job.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadJobs()} disabled={loading}>
                  Refresh
                </button>
              </div>
              {jobs.length === 0 ? <div className="admin-empty">No jobs registered yet.</div> : null}
              {jobs.some((job) => job.destructive) ? (
                <div className="admin-notif-form">
                  <label>
                    Reason for the next destructive run (required for jobs marked destructive)
                    <input
                      className="admin-input"
                      type="text"
                      value={jobReason}
                      maxLength={500}
                      placeholder="e.g. Retention sweep after the policy change"
                      onChange={(event) => setJobReason(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
              {jobs.map((job) => (
                <div className="admin-action-row" key={job.job_id}>
                  <div>
                    <h3>
                      {job.label}
                      {job.destructive ? <span className="admin-badge admin-badge--warning">destructive</span> : null}
                    </h3>
                    <p>{job.description}</p>
                    {jobResults[job.job_id] ? (
                      <div className="admin-result">
                        <span>Result: {jobResults[job.job_id].result_summary ?? "OK"}</span>
                        <span>Ran at: {formatDateTimeLabel(jobResults[job.job_id].started_at)}</span>
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="admin-button admin-button--primary"
                    type="button"
                    onClick={() => void triggerJob(job)}
                    disabled={runningJob !== null || (job.destructive && !hasReason(jobReason))}
                  >
                    {runningJob === job.job_id ? "Running..." : "Run now"}
                  </button>
                </div>
              ))}
            </section>
          ) : null}

          {activeTab === "notifications" ? (
            <section className="admin-section" aria-labelledby="notif-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="notif-title">Push Notifications</h2>
                  <p>Messaging at launch is transactional only.</p>
                </div>
              </div>
              <p className="admin-note">
                Broadcast is switched off until the consent-aware version ships (admin spec L8, decision D-17). Until
                then Vinaadi sends only transactional messages and each user&apos;s own alerts, through the outbox,
                and respects quiet hours (21:00–08:00 local).
              </p>
            </section>
          ) : null}

          {activeTab === "config" ? (
            <section className="admin-section" aria-labelledby="config-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="config-title">Feature Flags</h2>
                  <p>
                    Changes apply to every worker within seconds and survive restarts. Doctrine flags are the exception:
                    they change this worker only, and a ruling belongs in code.
                  </p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadFlags()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <div className="admin-notif-form">
                <label>
                  Reason for the next change (required)
                  <input
                    className="admin-input"
                    type="text"
                    value={flagReason}
                    maxLength={500}
                    placeholder="e.g. Ask provider outage, pausing until resolved"
                    onChange={(event) => setFlagReason(event.target.value)}
                  />
                </label>
              </div>
              <div className="admin-flags-list">
                {flags.map((flag) => (
                  <div className="admin-flag-row" key={flag.name}>
                    <div className="admin-flag-info">
                      <code className="admin-flag-name">{flag.name}</code>
                      {flag.source === "persisted" ? <span className="admin-badge admin-badge--warning">overridden</span> : null}
                      {flag.source === "process" ? <span className="admin-badge admin-badge--warning">this worker only</span> : null}
                      <small>default: {draftFor(flag.default)}</small>
                    </div>
                    <div className="admin-flag-controls">
                      <input
                        className="admin-input admin-flag-input"
                        type="text"
                        aria-label={`Value for ${flag.name}`}
                        value={flagDrafts[flag.name] ?? draftFor(flag.value)}
                        onChange={(event) => setFlagDrafts((prev) => ({ ...prev, [flag.name]: event.target.value }))}
                      />
                      <button
                        className="admin-button"
                        type="button"
                        onClick={() => void saveFlag(flag, flagDrafts[flag.name] ?? draftFor(flag.value))}
                        disabled={loading}
                      >
                        Save
                      </button>
                      {flag.overridden ? (
                        <button
                          className="admin-button admin-button--quiet"
                          type="button"
                          onClick={() => void resetFlag(flag.name)}
                          disabled={loading}
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <h3>Recent changes</h3>
              {flagHistory.length === 0 ? (
                <p>No setting has been changed yet.</p>
              ) : (
                <ul className="admin-flags-list">
                  {flagHistory.map((change) => (
                    <li className="admin-flag-row" key={change.id}>
                      <div className="admin-flag-info">
                        <code className="admin-flag-name">{change.name}</code>
                        <small>
                          {new Date(change.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST ·{" "}
                          {change.old_value === null ? "default" : draftFor(change.old_value)} →{" "}
                          {change.new_value === null ? "default" : draftFor(change.new_value)} · {change.reason}
                        </small>
                      </div>
                      <div className="admin-flag-controls">
                        <button
                          className="admin-button admin-button--quiet"
                          type="button"
                          onClick={() => void rollbackFlagChange(change)}
                          disabled={loading}
                        >
                          Undo
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {activeTab === "audit" ? (
            <section className="admin-section" aria-labelledby="audit-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="audit-title">Audit Log</h2>
                  <p>{numberLabel(auditLog?.total)} admin actions recorded.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadAuditLog(auditPage, auditFilters)} disabled={loading}>
                  Refresh
                </button>
              </div>
              <form
                className="admin-notif-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadAuditLog(1, auditFilters);
                }}
              >
                <label>
                  Action
                  <input
                    className="admin-input"
                    type="text"
                    value={auditFilters.action}
                    placeholder="e.g. suspend_user"
                    onChange={(event) => setAuditFilters((prev) => ({ ...prev, action: event.target.value }))}
                  />
                </label>
                <label>
                  Who (email or user id)
                  <input
                    className="admin-input"
                    type="text"
                    value={auditFilters.actor}
                    onChange={(event) => setAuditFilters((prev) => ({ ...prev, actor: event.target.value }))}
                  />
                </label>
                <label>
                  Target id
                  <input
                    className="admin-input"
                    type="text"
                    value={auditFilters.target_id}
                    onChange={(event) => setAuditFilters((prev) => ({ ...prev, target_id: event.target.value }))}
                  />
                </label>
                <label>
                  Outcome
                  <select
                    className="admin-input"
                    value={auditFilters.outcome}
                    onChange={(event) =>
                      setAuditFilters((prev) => ({ ...prev, outcome: event.target.value as AuditFilters["outcome"] }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="success">Success</option>
                    <option value="refused">Refused</option>
                    <option value="error">Error</option>
                  </select>
                </label>
                <button className="admin-button" type="submit" disabled={loading}>
                  Filter
                </button>
                <button
                  className="admin-button admin-button--quiet"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setAuditFilters(EMPTY_AUDIT_FILTERS);
                    void loadAuditLog(1, EMPTY_AUDIT_FILTERS);
                  }}
                >
                  Clear
                </button>
              </form>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Outcome</th>
                    <th>Target</th>
                    <th>Reason</th>
                    <th>Details</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditLog?.items ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTimeLabel(entry.created_at)}</td>
                      <td>
                        {entry.actor_email ?? "-"}
                        {entry.actor_role ? <small> ({entry.actor_role})</small> : null}
                      </td>
                      <td><code>{entry.action}</code></td>
                      <td>
                        <span
                          className={
                            entry.outcome === "success" ? "admin-badge" : "admin-badge admin-badge--warning"
                          }
                        >
                          {entry.outcome}
                        </span>
                      </td>
                      <td>
                        {entry.target_type ?? "-"}
                        {entry.target_id ? <small> {entry.target_id}</small> : null}
                      </td>
                      <td>{entry.reason ?? "-"}</td>
                      <td><small>{auditDetailText(entry)}</small></td>
                      <td><small>{entry.ip_address ?? "-"}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(auditLog?.total ?? 0) > 100 ? (
                <div className="admin-pagination">
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => void loadAuditLog(auditPage - 1, auditFilters)}
                  >
                    Previous
                  </button>
                  <span>Page {auditPage}</span>
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    disabled={auditPage * 100 >= (auditLog?.total ?? 0)}
                    onClick={() => void loadAuditLog(auditPage + 1, auditFilters)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "privacy" ? (
            <section className="admin-section" aria-labelledby="privacy-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="privacy-title">Privacy Requests</h2>
                  <p>
                    Export or erase everything held for a person. Erasure removes the account itself, the same as
                    the person deleting it from their settings, and needs the deletion flag enabled. Both ask for
                    your code and are audited.
                  </p>
                </div>
              </div>
              <form className="admin-delete" onSubmit={exportUserData}>
                <label>
                  User id
                  <input
                    className="admin-input"
                    type="text"
                    inputMode="text"
                    value={exportUserId}
                    onChange={(event) => setExportUserId(event.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </label>
                <label>
                  Reason (required, audited)
                  <input
                    className="admin-input"
                    type="text"
                    maxLength={500}
                    value={exportReason}
                    onChange={(event) => setExportReason(event.target.value)}
                    placeholder="e.g. Access request received by email"
                  />
                </label>
                <button className="admin-button" type="submit" disabled={loading || !hasReason(exportReason)}>
                  Download export
                </button>
              </form>
              <form className="admin-delete" onSubmit={deleteUserData}>
                <label>
                  User id
                  <input
                    className="admin-input"
                    type="text"
                    inputMode="text"
                    value={deleteUserId}
                    onChange={(event) => setDeleteUserId(event.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </label>
                <label>
                  Reason (required, audited)
                  <input
                    className="admin-input"
                    type="text"
                    maxLength={500}
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                    placeholder="e.g. Erasure request received by email"
                  />
                </label>
                <label>
                  Type DELETE to confirm
                  <input
                    className="admin-input"
                    type="text"
                    value={deleteConfirm}
                    onChange={(event) => setDeleteConfirm(event.target.value)}
                    placeholder="DELETE"
                  />
                </label>
                <button
                  className="admin-button admin-button--danger"
                  type="submit"
                  disabled={loading || deleteConfirm !== "DELETE" || !hasReason(deleteReason)}
                >
                  Erase account
                </button>
              </form>
              {deleteResult ? (
                <div className="admin-result admin-result--danger">
                  <span>Erased at: {formatDateTimeLabel(deleteResult.erased_at)}</span>
                  <span>Audit log name: erased:{deleteResult.erasure_id}</span>
                  {Object.entries(deleteResult.tables)
                    .filter(([, count]) => count > 0)
                    .map(([store, count]) => (
                      <span key={store}>
                        {store}: {numberLabel(count)}
                      </span>
                    ))}
                  <span>Still to do by hand: {deleteResult.external_followups.join(", ")}</span>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "roles" ? (
            <section className="admin-section" aria-labelledby="roles-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="roles-title">Admin roles</h2>
                  <p>
                    Owner and support can be granted today. The account must have confirmed its email
                    address. Every change needs a reason, asks for your code, and is audited.
                  </p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadRoles()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <div className="admin-notif-form">
                <label>
                  Reason (required for every change on this tab)
                  <input
                    className="admin-input"
                    type="text"
                    value={roleReason}
                    maxLength={500}
                    onChange={(event) => setRoleReason(event.target.value)}
                    placeholder="e.g. new support agent, starts Monday"
                  />
                </label>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Two-step sign-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((entry) => (
                    <tr key={entry.user_id}>
                      <td>
                        {entry.email ?? "-"}
                        <br />
                        <small>{entry.user_id}</small>
                      </td>
                      <td><code>{entry.role}</code></td>
                      <td>{entry.mfa_enrolled ? "Set up" : "Not set up"}</td>
                      <td>
                        <button
                          className="admin-button admin-button--quiet"
                          type="button"
                          disabled={loading}
                          onClick={() => void revokeRole(entry)}
                        >
                          Remove role
                        </button>
                        {entry.user_id !== me?.user_id ? (
                          <button
                            className="admin-button admin-button--quiet"
                            type="button"
                            disabled={loading || !entry.mfa_enrolled}
                            onClick={() => void resetMfa(entry)}
                          >
                            Reset two-step sign-in
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <form className="admin-delete" onSubmit={grantRole}>
                <label>
                  User id
                  <input
                    className="admin-input"
                    type="text"
                    value={roleUserId}
                    onChange={(event) => setRoleUserId(event.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </label>
                <label>
                  Role
                  <select
                    className="admin-input"
                    value={roleChoice}
                    onChange={(event) => setRoleChoice(event.target.value as AdminRole)}
                  >
                    {ASSIGNABLE_ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <button className="admin-button" type="submit" disabled={loading || !roleUserId.trim()}>
                  Grant role
                </button>
              </form>
              <div className="admin-section__header">
                <div>
                  <h3>Your recovery codes</h3>
                  <p>{numberLabel(me?.recovery_codes_remaining)} unused. Replacing them stops every old code working.</p>
                </div>
                <button
                  className="admin-button admin-button--quiet"
                  type="button"
                  onClick={() => void replaceRecoveryCodes()}
                  disabled={loading}
                >
                  Replace recovery codes
                </button>
              </div>
              {newRecoveryCodes ? <RecoveryCodeList codes={newRecoveryCodes} /> : null}
            </section>
          ) : null}
        </>
      )}

      {elevationAsk ? (
        <ElevationDialog
          onResolve={(ok) => {
            elevationAsk.resolve(ok);
            setElevationAsk(null);
          }}
        />
      ) : null}
    </main>
  );
}

/**
 * Re-authentication prompt for destructive operations.
 *
 * Deliberately narrow: it takes a second-factor code (TOTP, or one recovery
 * code), exchanges it for a short-lived elevation token, and reports success.
 * It was the account password until spec L3; a code works for Google-sign-in
 * admins, who have no password. It does not know which operation is
 * waiting on it, so it cannot leak what the operator was about to do into a
 * dialog that might be screenshotted or shoulder-read.
 *
 * Cancelling resolves `false` rather than leaving the request hanging — a
 * dialog that can be escaped into a stuck UI is its own bug.
 */
function ElevationDialog({ onResolve }: { onResolve: (ok: boolean) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const grant = await adminFetchJson<ElevationGrant>(
        `/api/v1${adminAccessPaths.elevate}`,
        { method: "POST", body: JSON.stringify({ code: code.trim() }) },
        // This endpoint is what satisfies elevation; it must never try to elevate
        // to reach itself.
        { allowElevationRetry: false },
      );
      rememberElevation(grant.token, grant.expires_in_seconds);
      setCode("");
      onResolve(true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Could not confirm your code.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      label="Enter your two-step sign-in code to continue"
      onClose={() => onResolve(false)}
      overlayClassName="admin-elevate-overlay"
      panelClassName="admin-elevate-panel"
    >
      <form className="admin-elevate" onSubmit={submit}>
        <h2 className="admin-elevate__title">Confirm it&rsquo;s you</h2>
        <p className="admin-elevate__body">
          This action changes or removes data that people depend on. Enter the
          current code from your authenticator app, or one of your recovery codes,
          to authorise it. The confirmation lasts a few minutes and is never stored.
        </p>
        <label className="admin-elevate__label" htmlFor="admin-elevation-code">
          Code
        </label>
        <input
          id="admin-elevation-code"
          className="admin-input"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={busy}
          required
        />
        {failure ? (
          <p className="admin-elevate__error" role="alert">{failure}</p>
        ) : null}
        <div className="admin-elevate__actions">
          <button
            className="admin-button admin-button--quiet"
            type="button"
            onClick={() => onResolve(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="admin-button" type="submit" disabled={busy || !code.trim()}>
            {busy ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/**
 * Two-step sign-in set-up (spec L3, D-15). Every admin route but this one and
 * /admin/me refuses an admin who has not finished it.
 *
 * Three steps: get a secret, prove the authenticator app holds it with a first
 * code, then see the ten recovery codes — once. The secret is shown as text and
 * as an otpauth:// link; most authenticator apps accept either.
 */
function MfaSetup({ onDone }: { onDone: () => void }) {
  const [enrolment, setEnrolment] = useState<MfaEnrolment | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setFailure(null);
    try {
      setEnrolment(
        await adminFetchJson<MfaEnrolment>(`/api/v1${adminAccessPaths.mfaEnroll}`, { method: "POST" }),
      );
    } catch (error) {
      setFailure(readErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const result = await adminFetchJson<RecoveryCodes>(
        `/api/v1${adminAccessPaths.mfaConfirm}`,
        { method: "POST", body: JSON.stringify({ code: code.trim() }) },
        { allowElevationRetry: false },
      );
      setCodes(result.recovery_codes);
    } catch (error) {
      setFailure(readErrorMessage(error));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-unlock" aria-labelledby="admin-mfa-title">
      <div>
        <p className="admin-kicker">Two-step sign-in</p>
        <h2 id="admin-mfa-title">
          {codes ? "Save your recovery codes" : "Set up two-step sign-in"}
        </h2>
        {codes ? (
          <>
            <p>
              Each code works once, in place of your authenticator code, if you lose your phone.
              They are shown only now. Store them offline, away from this computer.
            </p>
            <RecoveryCodeList codes={codes} />
            <button className="admin-button" type="button" onClick={onDone}>
              I have stored these codes
            </button>
          </>
        ) : !enrolment ? (
          <>
            <p>
              The admin console needs a code from an authenticator app (Google Authenticator,
              Microsoft Authenticator, 1Password or similar) as well as your sign-in.
            </p>
            <button className="admin-button" type="button" onClick={() => void start()} disabled={busy}>
              {busy ? "Starting…" : "Start set-up"}
            </button>
          </>
        ) : (
          <form className="admin-elevate" onSubmit={confirm}>
            <p>
              Add this key to your authenticator app, or open the link on the phone that has the app.
            </p>
            <p>
              <code className="admin-mfa-secret">{enrolment.secret}</code>
            </p>
            <p>
              <a href={enrolment.otpauth_uri}>Open in authenticator app</a>
            </p>
            <label className="admin-elevate__label" htmlFor="admin-mfa-code">
              Then enter the 6-digit code it shows
            </label>
            <input
              id="admin-mfa-code"
              className="admin-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={busy}
              required
            />
            <button className="admin-button" type="submit" disabled={busy || !code.trim()}>
              {busy ? "Checking…" : "Confirm"}
            </button>
          </form>
        )}
        {failure ? (
          <p className="admin-elevate__error" role="alert">{failure}</p>
        ) : null}
      </div>
    </section>
  );
}

function RecoveryCodeList({ codes }: { codes: string[] }) {
  return (
    <ol className="admin-recovery-codes" aria-label="Recovery codes">
      {codes.map((recoveryCode) => (
        <li key={recoveryCode}>
          <code>{recoveryCode}</code>
        </li>
      ))}
    </ol>
  );
}

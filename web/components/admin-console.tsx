"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { ModalShell } from "@/components/modal-shell";
import { useSession } from "@/hooks/useSession";
import { readErrorMessage } from "@/lib/api";
import { parseApiErrorText, type ApiErrorCode } from "@vinaadi/shared/api";
import { formatDateTimeLabel } from "@/lib/format";

type ElevationGrant = {
  token: string;
  expires_at: string;
  expires_in_seconds: number;
};

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

type JobInfo = { job_id: string; label: string; description: string };
type JobRunResult = { job_id: string; started_at: string; finished_at: string; result_summary: string | null };

type BroadcastResult = { sent: number; skipped: number; target: string; sent_at: string };

type FlagEntry = { name: string; value: unknown; default: unknown; overridden: boolean };

type AuditLogEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  payload_summary: string | null;
  ip_address: string | null;
  created_at: string;
};

type AuditLogResponse = { total: number; items: AuditLogEntry[] };

type DataDeletionResult = {
  owner_user_id: string;
  deleted_at: string;
  birth_profiles_deleted: number;
  charts_deleted: number;
  family_vaults_deleted: number;
  family_members_deleted: number;
  family_daily_scores_deleted: number;
};

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
  | "privacy";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "Health" },
  { id: "users", label: "Users" },
  { id: "analytics", label: "Analytics" },
  { id: "calibration", label: "Calibration" },
  { id: "feedback", label: "Feedback" },
  { id: "operations", label: "Operations" },
  { id: "notifications", label: "Notifications" },
  { id: "config", label: "Config" },
  { id: "audit", label: "Audit Log" },
  { id: "privacy", label: "Privacy" },
];

function numberLabel(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat().format(value);
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
 * Asks the operator for their password and returns whether elevation succeeded.
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
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
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
  const [suspendReason, setSuspendReason] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [retention, setRetention] = useState<RetentionReport | null>(null);
  const [calibration, setCalibration] = useState<CalibrationReport | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [jobResults, setJobResults] = useState<Record<string, JobRunResult>>({});
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifTarget, setNotifTarget] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
  const [flags, setFlags] = useState<FlagEntry[]>([]);
  const [flagDrafts, setFlagDrafts] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<AuditLogResponse | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteResult, setDeleteResult] = useState<DataDeletionResult | null>(null);

  const isUnlocked = access === "granted";

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

  // list against the session cookie. A 403 here is a legitimate answer about
  // this account, not a failure to report as an error.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await adminFetchJson<AdminStats>("/api/v1/admin/stats");
        if (cancelled) return;
        setAccess("granted");
        setStatus("Signed in as an administrator.");
      } catch {
        if (cancelled) return;
        setAccess("denied");
        setStatus("This account does not have administrator access.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    void loadAnalytics();
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
    if (!isUnlocked || activeTab !== "audit") return;
    void loadAuditLog();
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
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspend(userId: string, suspend: boolean) {
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1/admin/users/${encodeURIComponent(userId)}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ suspend, reason: suspend ? suspendReason || null : null }),
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
      const [daily, features, ret] = await Promise.all([
        adminFetchJson<DailyMetrics>("/api/v1/admin/analytics/daily?days=30"),
        adminFetchJson<FeatureUsage>("/api/v1/admin/analytics/features"),
        adminFetchJson<RetentionReport>("/api/v1/admin/analytics/retention"),
      ]);
      setDailyMetrics(daily);
      setFeatureUsage(features);
      setRetention(ret);
      setStatus("Analytics refreshed.");
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

  async function triggerJob(jobId: string) {
    setRunningJob(jobId);
    setError(null);
    try {
      const result = await adminFetchJson<JobRunResult>(
        `/api/v1/admin/jobs/${encodeURIComponent(jobId)}/trigger`,
        { method: "POST" },
      );
      setJobResults((prev) => ({ ...prev, [jobId]: result }));
      setStatus(`Job ${jobId} completed.`);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setRunningJob(null);
    }
  }

  async function sendBroadcast() {
    if (!notifTitle.trim() || !notifBody.trim()) {
      setError("Title and body are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetchJson<BroadcastResult>("/api/v1/admin/notify/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: notifTitle.trim(),
          body: notifBody.trim(),
          target_user_id: notifTarget.trim() || null,
        }),
      });
      setBroadcastResult(result);
      setNotifTitle("");
      setNotifBody("");
      setNotifTarget("");
      setStatus(`Broadcast sent to ${result.sent} users.`);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadFlags() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<FlagEntry[]>("/api/v1/admin/flags");
      setFlags(data);
      setFlagDrafts(Object.fromEntries(data.map((flag) => [flag.name, String(flag.value)])));
      setStatus("Config flags refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveFlag(name: string, rawValue: string) {
    let value: unknown = rawValue;
    if (rawValue === "true") value = true;
    else if (rawValue === "false") value = false;
    else if (!Number.isNaN(Number(rawValue)) && rawValue.trim() !== "") value = Number(rawValue);

    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1/admin/flags/${encodeURIComponent(name)}`, {
        method: "PATCH",
        body: JSON.stringify({ value }),
      });
      setStatus(`Flag ${name} updated.`);
      await loadFlags();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetFlag(name: string) {
    setLoading(true);
    setError(null);
    try {
      await adminFetchJson(`/api/v1/admin/flags/${encodeURIComponent(name)}/reset`, {
        method: "DELETE",
      });
      setStatus(`Flag ${name} reset to default.`);
      await loadFlags();
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadAuditLog(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchJson<AuditLogResponse>(
        `/api/v1/admin/audit-log?page=${page}&page_size=100`,
      );
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
    if (!userId || deleteConfirm.trim() !== "DELETE") {
      setError("Enter a user id and type DELETE to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetchJson<DataDeletionResult>(
        `/api/v1/admin/users/${encodeURIComponent(userId)}/data`,
        { method: "DELETE" },
      );
      setDeleteResult(result);
      setDeleteConfirm("");
      setStatus("User data deletion completed.");
      if (activeTab === "overview") {
        await loadOverview();
      }
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("User data deletion failed.");
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
    setBroadcastResult(null);
    setFlags([]);
    setFlagDrafts({});
    setAuditLog(null);
    setDeleteResult(null);
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
          <span className="admin-session__email">{userEmail ?? "Signed in"}</span>
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

      {!isUnlocked ? (
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
            {tabs.map((tab) => (
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
                    {userDetail.is_suspended ? (
                      <button
                        className="admin-button"
                        type="button"
                        onClick={() => void toggleSuspend(userDetail.user_id, false)}
                        disabled={loading}
                      >
                        Reinstate account
                      </button>
                    ) : (
                      <div className="admin-suspend-form">
                        <input
                          className="admin-input"
                          type="text"
                          placeholder="Suspension reason (optional)"
                          value={suspendReason}
                          onChange={(event) => setSuspendReason(event.target.value)}
                        />
                        <button
                          className="admin-button admin-button--danger"
                          type="button"
                          onClick={() => void toggleSuspend(userDetail.user_id, true)}
                          disabled={loading}
                        >
                          Suspend account
                        </button>
                      </div>
                    )}
                  </div>
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
              {jobs.map((job) => (
                <div className="admin-action-row" key={job.job_id}>
                  <div>
                    <h3>{job.label}</h3>
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
                    onClick={() => void triggerJob(job.job_id)}
                    disabled={runningJob !== null}
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
                  <p>Broadcast to all users or target a specific user.</p>
                </div>
              </div>
              <div className="admin-notif-form">
                <label>
                  Title
                  <input
                    className="admin-input"
                    type="text"
                    value={notifTitle}
                    onChange={(event) => setNotifTitle(event.target.value)}
                    placeholder="Notification title"
                  />
                </label>
                <label>
                  Body
                  <textarea
                    className="admin-input admin-textarea"
                    value={notifBody}
                    onChange={(event) => setNotifBody(event.target.value)}
                    placeholder="Notification body text"
                    rows={3}
                  />
                </label>
                <label>
                  Target user ID <small>(leave blank to send to all users)</small>
                  <input
                    className="admin-input"
                    type="text"
                    value={notifTarget}
                    onChange={(event) => setNotifTarget(event.target.value)}
                    placeholder="UUID or blank for broadcast"
                  />
                </label>
                <button
                  className="admin-button admin-button--primary"
                  type="button"
                  onClick={() => void sendBroadcast()}
                  disabled={loading || !notifTitle.trim() || !notifBody.trim()}
                >
                  {notifTarget.trim() ? "Send to user" : "Broadcast to all"}
                </button>
              </div>
              {broadcastResult ? (
                <div className="admin-result">
                  <span>Sent: {numberLabel(broadcastResult.sent)}</span>
                  <span>Skipped: {numberLabel(broadcastResult.skipped)}</span>
                  <span>Target: {broadcastResult.target}</span>
                  <span>At: {formatDateTimeLabel(broadcastResult.sent_at)}</span>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "config" ? (
            <section className="admin-section" aria-labelledby="config-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="config-title">Feature Flags</h2>
                  <p>Runtime overrides reset on process restart. Permanent changes still belong in environment config.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadFlags()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <div className="admin-flags-list">
                {flags.map((flag) => (
                  <div className="admin-flag-row" key={flag.name}>
                    <div className="admin-flag-info">
                      <code className="admin-flag-name">{flag.name}</code>
                      {flag.overridden ? <span className="admin-badge admin-badge--warning">overridden</span> : null}
                      <small>default: {String(flag.default)}</small>
                    </div>
                    <div className="admin-flag-controls">
                      <input
                        className="admin-input admin-flag-input"
                        type="text"
                        value={flagDrafts[flag.name] ?? String(flag.value)}
                        onChange={(event) => setFlagDrafts((prev) => ({ ...prev, [flag.name]: event.target.value }))}
                      />
                      <button
                        className="admin-button"
                        type="button"
                        onClick={() => void saveFlag(flag.name, flagDrafts[flag.name] ?? String(flag.value))}
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
            </section>
          ) : null}

          {activeTab === "audit" ? (
            <section className="admin-section" aria-labelledby="audit-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="audit-title">Audit Log</h2>
                  <p>{numberLabel(auditLog?.total)} admin actions recorded.</p>
                </div>
                <button className="admin-button" type="button" onClick={() => void loadAuditLog()} disabled={loading}>
                  Refresh
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>ID</th>
                    <th>Summary</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditLog?.items ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTimeLabel(entry.created_at)}</td>
                      <td><code>{entry.action}</code></td>
                      <td>{entry.target_type ?? "-"}</td>
                      <td><small>{entry.target_id ?? "-"}</small></td>
                      <td>{entry.payload_summary ?? "-"}</td>
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
                    onClick={() => void loadAuditLog(auditPage - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {auditPage}</span>
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    disabled={auditPage * 100 >= (auditLog?.total ?? 0)}
                    onClick={() => void loadAuditLog(auditPage + 1)}
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
                  <p>Erase calculation and personal data for a user. This requires the deletion flag to be enabled.</p>
                </div>
              </div>
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
                  disabled={loading || deleteConfirm !== "DELETE"}
                >
                  Delete user data
                </button>
              </form>
              {deleteResult ? (
                <div className="admin-result admin-result--danger">
                  <span>Deleted at: {formatDateTimeLabel(deleteResult.deleted_at)}</span>
                  <span>Birth profiles: {numberLabel(deleteResult.birth_profiles_deleted)}</span>
                  <span>Charts: {numberLabel(deleteResult.charts_deleted)}</span>
                  <span>Family vaults: {numberLabel(deleteResult.family_vaults_deleted)}</span>
                  <span>Family members: {numberLabel(deleteResult.family_members_deleted)}</span>
                  <span>Daily scores: {numberLabel(deleteResult.family_daily_scores_deleted)}</span>
                </div>
              ) : null}
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
 * Deliberately narrow: it takes a password, exchanges it for a short-lived
 * elevation token, and reports success. It does not know which operation is
 * waiting on it, so it cannot leak what the operator was about to do into a
 * dialog that might be screenshotted or shoulder-read.
 *
 * Cancelling resolves `false` rather than leaving the request hanging — a
 * dialog that can be escaped into a stuck UI is its own bug.
 */
function ElevationDialog({ onResolve }: { onResolve: (ok: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const grant = await adminFetchJson<ElevationGrant>(
        "/api/v1/admin/elevate",
        { method: "POST", body: JSON.stringify({ password }) },
        // This endpoint is what satisfies elevation; it must never try to elevate
        // to reach itself.
        { allowElevationRetry: false },
      );
      rememberElevation(grant.token, grant.expires_in_seconds);
      setPassword("");
      onResolve(true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Could not confirm your password.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      label="Confirm your password to continue"
      onClose={() => onResolve(false)}
      overlayClassName="admin-elevate-overlay"
      panelClassName="admin-elevate-panel"
    >
      <form className="admin-elevate" onSubmit={submit}>
        <h2 className="admin-elevate__title">Confirm it&rsquo;s you</h2>
        <p className="admin-elevate__body">
          This action changes or removes data that people depend on. Re-enter your
          password to authorise it. The confirmation lasts a few minutes and is
          never stored.
        </p>
        <label className="admin-elevate__label" htmlFor="admin-elevation-password">
          Password
        </label>
        <input
          id="admin-elevation-password"
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
          <button className="admin-button" type="submit" disabled={busy || !password}>
            {busy ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

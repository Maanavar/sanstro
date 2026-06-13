"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { readErrorMessage } from "@/lib/api";
import { useSession } from "@/hooks/useSession";

type AdminStats = {
  total_users: number;
  total_birth_profiles: number;
  total_charts: number;
  total_family_vaults: number;
  total_family_members: number;
  as_of: string;
};

type FeedbackItem = {
  submitted_at: string;
  category: "bug" | "calculation" | "suggestion" | "other";
  rating: number | null;
  message: string;
  page_context: string | null;
  owner_user_id: string;
};

type FeedbackResponse = {
  total: number;
  items: FeedbackItem[];
};

type PeyarchiRefreshResult = {
  charts_refreshed: number;
  notifications_marked: number;
  run_at_utc: string;
};

type DataDeletionResult = {
  owner_user_id: string;
  deleted_at: string;
  birth_profiles_deleted: number;
  charts_deleted: number;
  family_vaults_deleted: number;
  family_members_deleted: number;
  family_daily_scores_deleted: number;
};

type AdminTab = "overview" | "feedback" | "operations" | "privacy";

const ADMIN_KEY_STORAGE = "vinaadi:admin-key";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "feedback", label: "Feedback" },
  { id: "operations", label: "Operations" },
  { id: "privacy", label: "Privacy" },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function numberLabel(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat().format(value);
}

async function adminFetchJson<T>(
  path: string,
  adminKey: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    try {
      const json = JSON.parse(text) as { detail?: unknown; message?: unknown };
      const detail =
        typeof json.detail === "string"
          ? json.detail
          : typeof json.message === "string"
            ? json.message
            : text;
      throw new Error(`${response.status}: ${detail}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith(`${response.status}:`)) {
        throw error;
      }
      throw new Error(text || `Request failed with status ${response.status}`);
    }
  }

  return (await response.json()) as T;
}

export function AdminConsole() {
  const { hydrated, userEmail, signOut } = useSession();
  const [adminKey, setAdminKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [status, setStatus] = useState("Enter the admin key to unlock operations.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshResult, setRefreshResult] = useState<PeyarchiRefreshResult | null>(null);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteResult, setDeleteResult] = useState<DataDeletionResult | null>(null);

  const isUnlocked = adminKey.trim().length > 0;

  useEffect(() => {
    const saved = window.sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
    if (saved) {
      setAdminKey(saved);
      setKeyDraft(saved);
      setStatus("Admin key restored for this browser session.");
    }
  }, []);

  const loadAdminData = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextFeedback] = await Promise.all([
        adminFetchJson<AdminStats>("/api/v1/admin/stats", key),
        adminFetchJson<FeedbackResponse>("/api/v1/feedback", key),
      ]);
      setStats(nextStats);
      setFeedback(nextFeedback);
      setStatus("Admin data refreshed.");
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("Admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    void loadAdminData(adminKey);
  }, [adminKey, loadAdminData]);

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKey = keyDraft.trim();
    if (!nextKey) {
      setError("Admin key is required.");
      return;
    }
    window.sessionStorage.setItem(ADMIN_KEY_STORAGE, nextKey);
    setAdminKey(nextKey);
    setStatus("Admin key accepted for this session.");
  }

  function lockConsole() {
    window.sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setKeyDraft("");
    setStats(null);
    setFeedback(null);
    setRefreshResult(null);
    setDeleteResult(null);
    setError(null);
    setStatus("Admin console locked.");
  }

  async function runPeyarchiRefresh() {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetchJson<PeyarchiRefreshResult>(
        "/api/v1/admin/run-peyarchi-refresh",
        adminKey,
        { method: "POST" },
      );
      setRefreshResult(result);
      setStatus("Peyarchi refresh completed.");
      await loadAdminData(adminKey);
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("Peyarchi refresh failed.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUserData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminKey) return;
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
        adminKey,
        { method: "DELETE" },
      );
      setDeleteResult(result);
      setDeleteConfirm("");
      setStatus("User data deletion completed.");
      await loadAdminData(adminKey);
    } catch (err) {
      setError(readErrorMessage(err));
      setStatus("User data deletion failed.");
    } finally {
      setLoading(false);
    }
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
          <p className="admin-subtitle">Monitor launch health, support users, and handle privacy requests.</p>
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
          <button className="admin-button admin-button--quiet" type="button" onClick={lockConsole}>Lock</button>
        ) : null}
      </section>

      {!isUnlocked ? (
        <section className="admin-unlock" aria-labelledby="admin-unlock-title">
          <div>
            <p className="admin-kicker">Protected Area</p>
            <h2 id="admin-unlock-title">Unlock admin operations</h2>
            <p>
              Use the production admin key only on trusted devices. The key is kept in session storage
              and cleared when you lock the console or close the browser session.
            </p>
          </div>
          <form className="admin-unlock__form" onSubmit={handleUnlock}>
            <label htmlFor="admin-key">Admin key</label>
            <input
              id="admin-key"
              className="admin-input"
              type="password"
              autoComplete="off"
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
            />
            <button className="admin-button admin-button--primary" type="submit">Unlock console</button>
          </form>
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
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => void loadAdminData(adminKey)}
                  disabled={loading}
                >
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
                <strong>{formatDateTime(stats?.as_of)}</strong>
              </div>
            </section>
          ) : null}

          {activeTab === "feedback" ? (
            <section className="admin-section" aria-labelledby="feedback-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="feedback-title">Feedback Inbox</h2>
                  <p>{numberLabel(feedback?.total)} submissions in the current backend feedback store.</p>
                </div>
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => void loadAdminData(adminKey)}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
              <div className="admin-feedback-list">
                {(feedback?.items ?? []).length > 0 ? feedback?.items.map((item, index) => (
                  <article className="admin-feedback" key={`${item.submitted_at}-${index}`}>
                    <div className="admin-feedback__meta">
                      <span className="admin-badge">{item.category}</span>
                      <span>{formatDateTime(item.submitted_at)}</span>
                      <span>{item.rating ? `${item.rating}/5` : "No rating"}</span>
                    </div>
                    <p>{item.message}</p>
                    <footer>
                      <span>User {item.owner_user_id}</span>
                      <span>{item.page_context ?? "No page context"}</span>
                    </footer>
                  </article>
                )) : (
                  <div className="admin-empty">No feedback yet.</div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "operations" ? (
            <section className="admin-section" aria-labelledby="operations-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="operations-title">Operational Jobs</h2>
                  <p>Run bounded admin actions that already exist in the backend.</p>
                </div>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Peyarchi refresh</h3>
                  <p>Refresh alert state and mark upcoming notifications for charts.</p>
                </div>
                <button
                  className="admin-button admin-button--primary"
                  type="button"
                  onClick={() => void runPeyarchiRefresh()}
                  disabled={loading}
                >
                  Run now
                </button>
              </div>
              {refreshResult ? (
                <div className="admin-result">
                  <span>Charts refreshed: {numberLabel(refreshResult.charts_refreshed)}</span>
                  <span>Notifications marked: {numberLabel(refreshResult.notifications_marked)}</span>
                  <span>Run at: {formatDateTime(refreshResult.run_at_utc)}</span>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "privacy" ? (
            <section className="admin-section" aria-labelledby="privacy-title">
              <div className="admin-section__header">
                <div>
                  <h2 id="privacy-title">Privacy Requests</h2>
                  <p>Erase calculation and personal data for a user. This action requires backend enablement.</p>
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
                  <span>Deleted at: {formatDateTime(deleteResult.deleted_at)}</span>
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
    </main>
  );
}

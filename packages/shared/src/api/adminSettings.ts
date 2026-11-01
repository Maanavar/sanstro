import { getApiClient } from "./client";

// Contract for app/api/admin.py (flag routes) and app/api/site_status.py.
//
// The admin console calls these paths through its own fetch so it can attach
// the elevation header; it imports the types and `adminSettingsPaths` from
// here, so a route or shape change has one place to land on the client side.

/** Where a flag's current value comes from. */
export type FlagSource = "default" | "persisted" | "process";

export interface FlagEntry {
  name: string;
  value: unknown;
  default: unknown;
  overridden: boolean;
  /** persisted = every worker, survives restart; process = this worker only (doctrine trials). */
  source: FlagSource;
  /** Doctrine flags are never persisted: a ruling changes the code default. */
  doctrine: boolean;
}

export interface FlagUpdateBody {
  value: unknown;
  /** Required for every non-doctrine change; stored with the history row. */
  reason: string;
}

export interface FlagChange {
  id: string;
  name: string;
  /** null = there was no override before this change. */
  old_value: unknown;
  /** null = this change reset the flag to its code default. */
  new_value: unknown;
  reason: string;
  actor_user_id: string | null;
  created_at: string;
}

export const adminSettingsPaths = {
  list: "/admin/flags",
  history: "/admin/flags/history",
  flag: (name: string) => `/admin/flags/${encodeURIComponent(name)}`,
  reset: (name: string, reason: string) =>
    `/admin/flags/${encodeURIComponent(name)}/reset?reason=${encodeURIComponent(reason)}`,
  rollback: (changeId: string) => `/admin/flags/changes/${encodeURIComponent(changeId)}/rollback`,
} as const;

/** Kill switches (app/services/kill_switch.py). A name listed in `SiteStatus.paused` is off. */
export type KillSwitch =
  | "enable_ask_vinaadi"
  | "enable_payments_checkout"
  | "enable_guest_charts"
  | "enable_signups";

export interface SiteStatus {
  maintenance: boolean;
  /** null when no banner is set; one language falls back to the other. */
  banner: { en: string; ta: string } | null;
  paused: KillSwitch[];
}

// Checked against app/api/site_status.py: GET "/site-status", public, no params.
export function getSiteStatus(): Promise<SiteStatus> {
  return getApiClient().get("/site-status") as Promise<SiteStatus>;
}

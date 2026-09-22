import { getApiClient } from "./client";

export interface LifeFocusMetrics {
  period: string;
  /** Measure 1 is a snapshot of saved preferences, not scoped to `period`. */
  adoption_as_of: string;
  total_users: number;
  non_balanced_users: number;
  non_balanced_share: number;
  mode_counts: Record<string, number>;
  first_run_decisions: number;
  /** First writes from the first-run picker: the Skip-rate base. */
  first_run_picker_decisions: number;
  first_run_skips: number;
  first_run_skip_rate: number | null;
  focus_change_count: number;
  focus_returning_users: number;
  focus_changes_per_returning_user: number | null;
}

// Checked against app/api/admin_analytics.py: GET
// "/admin/analytics/life-focus", optional `month` query parameter, no path
// params, and get_admin_user guards the route.
export function getLifeFocusMetrics(month?: string): Promise<LifeFocusMetrics> {
  return getApiClient().get(
    "/admin/analytics/life-focus",
    month ? { month } : undefined,
  ) as Promise<LifeFocusMetrics>;
}

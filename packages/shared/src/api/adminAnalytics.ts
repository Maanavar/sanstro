import { getApiClient } from "./client";

export interface LifeFocusMetrics {
  period: string;
  total_users: number;
  non_balanced_users: number;
  non_balanced_share: number;
  mode_counts: Record<string, number>;
  first_run_decisions: number;
  first_run_skips: number;
  first_run_skip_rate: number | null;
  focus_change_count: number;
  focus_active_users: number;
  focus_changes_per_active_user: number | null;
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

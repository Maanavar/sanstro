"use client";

import type { LifeFocusMetrics } from "@vinaadi/shared/api";
import { LIFE_MODE_ORDER, LIFE_MODE_TEXT } from "@vinaadi/shared/lifeFocus";
import type { LifeMode } from "@vinaadi/shared/types";

/**
 * Admin → Analytics → Life Focus (audit U7). `GET /admin/analytics/life-focus`
 * has been served since Phase 4 and nothing read it, so the Phase 4 measures
 * could only be seen by curling the endpoint.
 *
 * The one thing this screen must not do is let an operator read a snapshot as a
 * monthly figure. Adoption and the tuning table are **as of now**, whatever
 * month is selected; Skip rate and change rate are **for the selected month**.
 * Each block says which, next to the numbers, rather than once in a legend.
 *
 * Presentational: the console owns the fetch (it carries the elevation and MFA
 * handling every admin request needs). The response type is the shared
 * wrapper's, so the field-name contract guard covers this screen too.
 *
 * English only, like the rest of the console.
 */

function count(value: number | null | undefined): string {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat().format(value);
}

function percent(share: number | null | undefined): string {
  if (typeof share !== "number") return "-";
  return `${(share * 100).toFixed(1)}%`;
}

function ratio(value: number | null | undefined): string {
  if (typeof value !== "number") return "-";
  return value.toFixed(2);
}

function modeLabel(mode: string): string {
  return LIFE_MODE_TEXT[mode as LifeMode]?.label.en ?? mode;
}

/** Saved modes first in the canonical picker order, then anything unexpected. */
function orderedModes(metrics: LifeFocusMetrics): string[] {
  const known = LIFE_MODE_ORDER.filter(
    (mode) => mode in metrics.mode_counts || mode in metrics.offered_users,
  ) as string[];
  const extra = Object.keys({ ...metrics.mode_counts, ...metrics.offered_users })
    .filter((mode) => !known.includes(mode))
    .sort();
  return [...known, ...extra];
}

export function AdminLifeFocusPanel({
  metrics,
  month,
  onMonthChange,
  onRefresh,
  loading,
}: {
  metrics: LifeFocusMetrics | null;
  /** "YYYY-MM", or "" for the current month (what the endpoint defaults to). */
  month: string;
  onMonthChange: (next: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="admin-chart-section">
      <h3>Life Focus (Phase 4)</h3>
      <div className="admin-search-row">
        <label htmlFor="life-focus-month">Month</label>
        <input
          id="life-focus-month"
          className="admin-input"
          type="month"
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
        />
        <button className="admin-button" type="button" onClick={onRefresh} disabled={loading}>
          Load
        </button>
      </div>

      {!metrics ? (
        <p className="admin-empty">{loading ? "Loading Life Focus measures…" : "No Life Focus measures loaded."}</p>
      ) : (
        <>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span>Picked a focus</span>
              <strong>{count(metrics.non_balanced_users)}</strong>
              <small>of {count(metrics.total_users)} live accounts, as of now</small>
            </div>
            <div className="admin-metric">
              <span>Adoption</span>
              <strong>{percent(metrics.non_balanced_share)}</strong>
              <small>
                Snapshot, as of {new Date(metrics.adoption_as_of).toLocaleString()} — not the
                selected month
              </small>
            </div>
            <div className="admin-metric">
              <span>First-run Skip rate</span>
              <strong>{percent(metrics.first_run_skip_rate)}</strong>
              <small>
                {count(metrics.first_run_skips)} of {count(metrics.first_run_picker_decisions)}{" "}
                picker decisions in {metrics.period}
              </small>
            </div>
            <div className="admin-metric">
              <span>Changes per returning reader</span>
              <strong>{ratio(metrics.focus_changes_per_returning_user)}</strong>
              <small>
                {count(metrics.focus_change_count)} changes by {count(metrics.focus_returning_users)}{" "}
                readers in {metrics.period}
              </small>
            </div>
            <div className="admin-metric">
              <span>First choices, any surface</span>
              <strong>{count(metrics.first_run_decisions)}</strong>
              <small>
                In {metrics.period}. Only the first-run picker offers Skip, which is why the rate
                above counts {count(metrics.first_run_picker_decisions)}.
              </small>
            </div>
          </div>

          <table className="admin-table">
            <caption style={{ captionSide: "top", textAlign: "left", paddingBottom: "8px" }}>
              Per focus — saved choices and the tuning read. Both are snapshots as of now; a focus
              is scored only among the readers it is <em>offered</em> to, because the age and
              marital gates hide Love and Marriage from some readers.
            </caption>
            <thead>
              <tr>
                <th>Focus</th>
                <th>Saved as their focus</th>
                <th>Offered to</th>
                <th>Share of those offered</th>
                <th>Tuning</th>
              </tr>
            </thead>
            <tbody>
              {orderedModes(metrics).map((mode) => {
                const rare = metrics.rarely_picked.includes(mode);
                return (
                  <tr key={mode}>
                    <td>{modeLabel(mode)}</td>
                    <td>{count(metrics.mode_counts[mode] ?? 0)}</td>
                    <td>{count(metrics.offered_users[mode])}</td>
                    <td>{percent(metrics.offered_pick_share[mode])}</td>
                    <td>
                      {mode === "BALANCED" ? (
                        // BALANCED is what a reader has without choosing, so its
                        // count is not a measure of its popularity.
                        <span className="admin-badge">default</span>
                      ) : rare ? (
                        <span className="admin-badge admin-badge--warning">rarely picked</span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="admin-note">
            <strong>
              {metrics.rarely_picked.length > 0
                ? `Rarely-picked candidates: ${metrics.rarely_picked.map(modeLabel).join(", ")}`
                : "No rarely-picked candidates in this read."}
            </strong>
            <span>
              A candidate, not a verdict. The pre-registered rule (plan §5, fixed 2026-09-22 before
              any production data) asks for two reads at least 28 days apart before a focus is
              retired from the picker.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

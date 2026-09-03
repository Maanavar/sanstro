/**
 * Skeleton loading components — Vinaadi AI
 * Matches the exact shape of loaded content so perceived load feels instant.
 * Uses `.skel` (globals.css) for GPU-composited shimmer.
 * Layout classes live in skeleton.css — no inline styles.
 */
import "./skeleton.css";

/* ── SkeletonMetricStrip ─────────────────────────────────────
   Replaces the 4-column metric row on the dashboard hero.
   ─────────────────────────────────────────────────────────── */
export function SkeletonMetricStrip() {
  return (
    <div className="metric-strip" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skel-metric-cell">
          <span className="skel skel-metric-label" />
          <span className="skel skel-metric-value" />
          <span className="skel skel-metric-sub" />
        </div>
      ))}
    </div>
  );
}

/* ── SkeletonDashboardCard ───────────────────────────────────
   Replaces any content card (dasha, life areas, guidance).
   ─────────────────────────────────────────────────────────── */
interface SkeletonDashboardCardProps {
  lines?: number;
  showIcon?: boolean;
}
export function SkeletonDashboardCard({ lines = 3, showIcon = false }: SkeletonDashboardCardProps) {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel-card-header">
        {showIcon && <span className="skel skel-icon-circle" />}
        <div className="skel-card-header-text">
          <span className="skel skel-title" />
          <span className="skel skel-label-sm" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className={`skel ${i === lines - 1 ? "skel-line-short" : "skel-line-full"}`}
        />
      ))}
    </div>
  );
}

/* ── SkeletonDashaTimeline ───────────────────────────────────
   Replaces the Dasha period horizontal bar + period labels.
   ─────────────────────────────────────────────────────────── */
const DASHA_SEG_CLASSES = [
  ["skel-dasha-seg-first", "skel-dasha-w1"],
  ["skel-dasha-seg-mid",   "skel-dasha-w2"],
  ["skel-dasha-seg-mid",   "skel-dasha-w3"],
  ["skel-dasha-seg-mid",   "skel-dasha-w4"],
  ["skel-dasha-seg-mid",   "skel-dasha-w5"],
  ["skel-dasha-seg-last",  "skel-dasha-w6"],
] as const;

const DASHA_LBL_CLASSES = [
  "skel-dasha-lbl-1",
  "skel-dasha-lbl-2",
  "skel-dasha-lbl-3",
  "skel-dasha-lbl-4",
] as const;

export function SkeletonDashaTimeline() {
  return (
    <div className="skel-card" aria-hidden="true">
      <span className="skel skel-title" />

      <div className="skel-dasha-bar">
        {DASHA_SEG_CLASSES.map(([segClass, widthClass], i) => (
          <span key={i} className={`skel ${segClass} ${widthClass}`} />
        ))}
      </div>

      <div className="skel-dasha-labels">
        {DASHA_LBL_CLASSES.map((cls, i) => (
          <span key={i} className={`skel ${cls}`} />
        ))}
      </div>

      <div className="skel-dasha-detail">
        <span className="skel skel-dasha-detail-1" />
        <span className="skel skel-dasha-detail-2" />
      </div>
    </div>
  );
}

/* ── SkeletonChartPanel ──────────────────────────────────────
   Replaces the Jadhagam / birth chart grid placeholder.
   South-Indian chart: 4×4 grid, corners are inert cells.
   ─────────────────────────────────────────────────────────── */
const CORNER_CELLS = new Set([0, 3, 12, 15]);

export function SkeletonChartPanel() {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel-chart-header">
        <span className="skel skel-chart-title" />
        <span className="skel skel-chart-tab" />
      </div>

      <div className="skel-chart-grid">
        {Array.from({ length: 16 }).map((_, i) =>
          CORNER_CELLS.has(i) ? (
            <div key={i} className="skel-chart-corner" />
          ) : (
            <span key={i} className="skel skel-chart-cell" />
          )
        )}
      </div>
    </div>
  );
}

/* ── SkeletonTransitRow ──────────────────────────────────────
   Replaces the list of upcoming transits.
   ─────────────────────────────────────────────────────────── */
interface SkeletonTransitRowProps {
  count?: number;
}
export function SkeletonTransitRow({ count = 4 }: SkeletonTransitRowProps) {
  return (
    <div className="skel-transit-list" aria-hidden="true">
      <span className="skel skel-transit-section-title" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-transit-row">
          <span className="skel skel-transit-planet" />
          <div className="skel-transit-text">
            <span className="skel skel-transit-name" />
            <span className="skel skel-transit-sub" />
          </div>
          <span className="skel skel-transit-badge" />
        </div>
      ))}
    </div>
  );
}

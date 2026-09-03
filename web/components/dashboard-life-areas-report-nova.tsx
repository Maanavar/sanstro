"use client";

import type { Lang } from "@/lib/i18n";
import type { JadhagamReportData } from "@/lib/types";
import { JadhagamReportPanel } from "./dashboard-jadhagam-report-panel";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";

/**
 * Nova re-skin of dashboard-jadhagam-report-panel.tsx's JadhagamReportPanel —
 * the last of the 4 sub-tab panels deferred (Classic-styled) when Life Areas
 * Nova first shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8).
 *
 * Grepped every var(--...) reference in the Classic file first (405 lines,
 * read end to end) — unlike the other 3 deferred panels, this one turned out
 * to already be ~95% Nova-safe: Section/Row/StrengthBar/NatureBadge/
 * FocusBadge all read only core --color-*, --radius-*, --space-* tokens or
 * already-redirected Classic-named ones (the surface/planet/chart-cell
 * redirects). Two real issues found, not a wholesale rebuild:
 *
 * 1. One literal hardcoded `#7a3412` (no CSS variable at all) in the
 *    Remedies section's caution text — the exact same bug class Phase 9
 *    found and fixed in life-area-card.tsx's remedy box. Fixed directly in
 *    the Classic file (`var(--color-text)`, confirmed to resolve to the
 *    same dark ink Classic already uses — a no-op there, correct under
 *    Nova) — benefits Classic too, same precedent as every prior phase's
 *    "found while reading for Nova-compat reasons" fixes.
 * 2. The embedded Yogas & Doshams section reuses YogaDoshamPanel, which
 *    (unlike the rest of this file) IS Classic-token-heavy — confirmed
 *    already during Phase 5/8/9's research.
 *
 * Given how much of the file was already safe, duplicating all ~400 lines
 * for one swapped-out sub-component would be worse than the alternative:
 * added one optional `renderYogaDoshamPanel` prop to JadhagamReportPanel
 * (additive, Classic callers get identical behavior) so this file can be a
 * thin wrapper that reuses the Classic component verbatim and substitutes
 * only that one section's renderer with the fresh NovaYogaDoshamPanel this
 * same pass already built. Different in kind from the other 3 panels' "always
 * a fresh file" pattern, but that pattern was there because those files were
 * *entirely* unsafe — this one is a deliberate judgment call for a file that
 * mostly wasn't.
 */

type Props = {
  lang: Lang;
  report: JadhagamReportData | null;
  loading: boolean;
  onLoad: () => void;
};

export function NovaJadhagamReportPanel({ lang, report, loading, onLoad }: Props) {
  return (
    <JadhagamReportPanel
      lang={lang}
      report={report}
      loading={loading}
      onLoad={onLoad}
      renderYogaDoshamPanel={({ yogas, doshams }) => <NovaYogaDoshamPanel lang={lang} yogas={yogas} doshams={doshams} />}
    />
  );
}

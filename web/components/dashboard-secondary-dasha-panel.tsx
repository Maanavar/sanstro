"use client";

import type { ReactNode } from "react";

import type { AsyncState } from "@/hooks/useApiQuery";
import type { GlossaryKey } from "@/lib/glossary";
import type { Lang } from "@/lib/i18n";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";
import { AsyncSection, type BilingualText } from "./ui/async-section";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

/**
 * `<SecondaryDashaPanel>` — the shell the Yogini, Kalachakra and Ashtottari
 * panels were each rendering by hand.
 *
 * Those three were ~85% identical: the same `CollapsibleSection`, the same
 * `GlossaryTerm` subtitle carrying the same experimental caveat, the same
 * two-column "Current Mahadasha / Antardasha" card, and the same mahadasha list
 * with the current period highlighted — down to the same
 * `padding: var(--space-1_5) var(--space-3)` and the same
 * `{years} yrs · {startDate}` right-hand column.
 *
 * F2 removed their planet-name maps and F8 removed their fetch blocks, which is
 * why this is now a small component rather than a large one: what remained was
 * the presentation and four genuine differences (title, caveat, glossary key,
 * and how a period is named).
 *
 * DELIBERATELY NOT GENERIC OVER THE API TYPE. Each panel keeps its own
 * `useApiQuery` call and maps its own field names — `yogini`, `rasiName`, `lord`
 * — into the plain shape below. Threading three response types through a generic
 * selector would hide the one thing that actually differs between them behind
 * type machinery, and the fetch call is worth keeping visible in the panel that
 * owns it.
 *
 * CONDITIONAL DASHAS IS NOT ONE OF THESE, despite what
 * docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F9 says. Checked rather than assumed:
 * `dashboard-conditional-dashas-panel` renders a paksha line and a list of
 * per-system cards. It has no current-mahadasha/antardasha card and no
 * mahadasha list, so it shares the header and the async states with these three
 * and nothing below that. It keeps its own body.
 */

export type SecondaryDashaPeriod = {
  /** Stable list key. Start dates repeat across cycles, so callers suffix it. */
  key: string;
  name: ReactNode;
  years: number;
  startDate: string;
  isCurrent: boolean;
};

export type SecondaryDashaCurrent = {
  mahadasha: { name: ReactNode; startDate: string; endDate: string };
  antardasha: { name: ReactNode; startDate: string; endDate: string };
};

export function SecondaryDashaPanel({
  lang,
  title,
  glossaryTerm,
  caveat,
  error,
  state,
  onRetry,
  current,
  periods,
  header,
}: {
  lang: Lang;
  title: BilingualText;
  glossaryTerm: GlossaryKey;
  /** The "· Experimental, not used in any scoring path" tail after the term. */
  caveat: BilingualText;
  error: BilingualText;
  state: AsyncState;
  onRetry?: () => void;
  current?: SecondaryDashaCurrent;
  periods?: SecondaryDashaPeriod[];
  /** Ashtottari's classical-applicability card, above the current-period card. */
  header?: ReactNode;
}) {
  const isTamil = lang === "ta";
  const pick = (text: BilingualText) => (isTamil ? text.ta : text.en);

  return (
    <CollapsibleSection title={pick(title)} defaultOpen={false}>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0" }}>
        <GlossaryTerm term={glossaryTerm} lang={lang}>
          {isTamil ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை" : "Secondary/comparison dasha"}
        </GlossaryTerm>
        {pick(caveat)}
      </p>

      <AsyncSection state={state} lang={lang} onRetry={onRetry} error={error} />

      {current && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          {header}

          <Card
            variant="high"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "var(--space-2)",
              padding: "var(--space-2_5) var(--space-3)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {([
              ["var(--color-score-high)", isTamil ? "தற்போதைய மஹா தசை" : "Current Mahadasha", current.mahadasha],
              ["var(--color-faint)", isTamil ? "அந்தர் தசை" : "Antardasha", current.antardasha],
            ] as const).map(([color, label, period]) => (
              <div key={label} style={{ flex: 1 }}>
                <Kicker as="p" color={color} style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
                  {label}
                </Kicker>
                <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {period.name}
                </p>
                <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                  {period.startDate} – {period.endDate}
                </p>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {(periods ?? []).map((period) => (
              <Card
                key={period.key}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-1_5) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: period.isCurrent ? "var(--color-surface)" : "transparent",
                }}
              >
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {period.name}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                  {period.years} {isTamil ? "ஆண்டுகள்" : "yrs"} · {period.startDate}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

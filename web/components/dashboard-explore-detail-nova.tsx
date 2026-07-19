"use client";

import type { Lang } from "@/lib/i18n";

/**
 * Shared low-level pieces for Nova's Explore "detail" sub-screens
 * (`explore-moolam` / Phase 7, `explore-sevvai` / Phase 8 — see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.6/§6.7). §6.6 deliberately built
 * Phase 7 as a fully standalone screen because only one concrete instance
 * existed and a generalised shell would have had to guess Phase 8's needs.
 * Now that Phase 8 exists, the two screens' higher-level content cards
 * (What-it-means / In-your-chart / Pariharam / In-your-family, etc.) still
 * diverge too much in data shape to share — but the outer skeleton
 * (breadcrumb+prev/next row, hero shell, attribute band grid, the
 * two-column card layout, the "Ask Vinaadi" entry chip) turned out to be
 * byte-for-byte identical between the two mockups. Extracting only that
 * genuinely-generic, presentation-only layer here (and nothing with
 * business logic in it) avoids both the premature-abstraction trap §6.6
 * flagged and the duplication that would otherwise exist between the two
 * screen files.
 *
 * `NovaDetailBreadcrumb`'s middle "hub" crumb (e.g. "Natchathiram"/"Dosham")
 * is deliberately plain text, not a link — post-Phase-8 browser QA found it
 * wired to `target="_blank"` marketing-site URLs, which is surprising
 * breadcrumb behavior (a crumb should navigate within the app, not launch a
 * new tab). Neither screen has a real in-app "browse all N/browse all
 * doshams" destination for it to point to instead, so per user decision
 * it's a label, not a link; the screens' own prev/next arrows are the real
 * in-app browsing mechanism.
 */

export function NovaKicker({ children, color = "var(--color-accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color }}>
      {children}
    </p>
  );
}

export const novaDetailCardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

type BreadcrumbNavButton = { label: string; onClick: () => void };

export function NovaDetailBreadcrumb({
  onBack,
  backLabel,
  hubLabel,
  currentLabel,
  onPrev,
  onNext,
}: {
  onBack: () => void;
  backLabel: string;
  hubLabel: string;
  currentLabel: string;
  onPrev?: BreadcrumbNavButton;
  onNext?: BreadcrumbNavButton;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-faint)", flexWrap: "wrap" }}>
      <button type="button" onClick={onBack} style={{ color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        {backLabel}
      </button>
      <span>{"›"}</span>
      <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>{hubLabel}</span>
      <span>{"›"}</span>
      <span style={{ color: "var(--color-text)" }}>{currentLabel}</span>
      {(onPrev || onNext) && (
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev.onClick}
              style={{ fontSize: "12px", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "6px 14px", background: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              {"←"} {onPrev.label}
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext.onClick}
              style={{ fontSize: "12px", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "6px 14px", background: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              {onNext.label} {"→"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NovaDetailHero({
  kicker,
  badge,
  titleMain,
  titleSecondary,
  prose,
  rightSlot,
}: {
  kicker: React.ReactNode;
  badge?: React.ReactNode;
  titleMain: React.ReactNode;
  titleSecondary?: React.ReactNode;
  prose: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--color-surface-strong, var(--color-surface)), var(--color-surface))", border: "1px solid var(--color-border-strong)", borderRadius: "16px", padding: "26px 28px", display: "flex", gap: "26px", alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
            {kicker}
          </span>
          {badge}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1, color: "var(--color-text-strong)" }}>
            {titleMain}
          </span>
          {titleSecondary && (
            <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "18px", color: "var(--color-muted)" }}>{titleSecondary}</span>
          )}
        </div>
        <p style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "14.5px", lineHeight: 1.65, color: "var(--color-text)", maxWidth: "640px" }}>
          {prose}
        </p>
      </div>
      {rightSlot}
    </div>
  );
}

export function NovaAttributeBand({ facts }: { facts: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${facts.length}, 1fr)`, gap: "10px", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "12px", padding: "13px 20px" }}>
      {facts.map((fact, i) => (
        <div key={i}>
          <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "var(--color-accent-strong)", textTransform: "uppercase" }}>{fact.label}</div>
          <div style={{ fontSize: "13.5px", fontWeight: 600, marginTop: "2px" }}>{fact.value}</div>
        </div>
      ))}
    </div>
  );
}

export function NovaAskEntryChip({ label, ctaLabel, onOpenAskVinaadi }: { label: string; ctaLabel: string; onOpenAskVinaadi: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenAskVinaadi}
      style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary)", borderRadius: "999px", padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
    >
      <span style={{ flex: 1, fontSize: "12.5px", color: "var(--color-muted)" }}>{label}</span>
      <span style={{ background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", borderRadius: "999px", padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}>
        {ctaLabel}
      </span>
    </button>
  );
}

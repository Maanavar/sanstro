"use client";

import { Sparkles, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
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

export const novaDetailCardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5) var(--space-6)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
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
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-faint)", flexWrap: "wrap" }}>
      <button type="button" onClick={onBack} style={{ color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        {backLabel}
      </button>
      <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--color-faint)" }} />
      <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>{hubLabel}</span>
      <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--color-faint)" }} />
      <span style={{ color: "var(--color-text)" }}>{currentLabel}</span>
      {(onPrev || onNext) && (
        <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-2)" }}>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev.onClick}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-2) var(--space-4)", background: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" /> {onPrev.label}
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext.onClick}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-2) var(--space-4)", background: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              {onNext.label} <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
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
  prose,
  rightSlot,
}: {
  kicker: React.ReactNode;
  badge?: React.ReactNode;
  titleMain: React.ReactNode;
  prose: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--color-surface-strong, var(--color-surface)), var(--color-surface))", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "var(--space-7) var(--space-7)", display: "flex", gap: "var(--space-7)", alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-xs)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
            {kicker}
          </span>
          {badge}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1, color: "var(--color-text-strong)" }}>
            {titleMain}
          </span>
        </div>
        <p style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "var(--text-base)", lineHeight: 1.65, color: "var(--color-text)", maxWidth: "640px" }}>
          {prose}
        </p>
      </div>
      {rightSlot}
    </div>
  );
}

export function NovaAttributeBand({ facts }: { facts: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${facts.length}, 1fr)`, gap: "var(--space-3)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-5)" }}>
      {facts.map((fact, i) => (
        <div key={i}>
          <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", color: "var(--color-accent-strong)", textTransform: "uppercase" }}>{fact.label}</div>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, marginTop: "2px" }}>{fact.value}</div>
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
      style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary)", borderRadius: "var(--radius-pill)", padding: "var(--space-3) var(--space-4)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
    >
      <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{label}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", borderRadius: "var(--radius-pill)", padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
        {ctaLabel}
        <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
      </span>
    </button>
  );
}

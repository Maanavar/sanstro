"use client";

import type { PapaSamyamData } from "@vinaadi/shared";
import { papaSamyamView } from "@vinaadi/shared/papaSamyam";
import type { Lang } from "@/lib/i18n";

import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

/**
 * பாப சாம்யம் on the Porutham page (deferred-checks plan, item 3).
 *
 * The check was computed for the compatibility report since F-CI-03 but was
 * missing here, on a stale comment that said no such calculation existed. A
 * family comparing this page with a printed jathagam expects it.
 *
 * **Report only.** It is not in the porutham score, so this card:
 * - never uses the veto colour, and sits after the ten poruthams, not among them;
 * - always prints how it was counted, because the weights are not ratified;
 * - shows every point (reference, graha, house) so a jothidar can check it by hand.
 *
 * Words come from `@vinaadi/shared/papaSamyam` (mobile uses the same module).
 * Renders nothing when the payload has no block (non-marriage contexts).
 */
export function PapaSamyamCard({ data, lang }: { data: PapaSamyamData | null | undefined; lang: Lang }) {
  const view = papaSamyamView(data, lang === "ta" ? "ta" : "en");
  if (!view) return null;
  const tone = view.balanced ? "high" : "mid";

  return (
    <Card
      variant="soft"
      style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Kicker style={{ letterSpacing: "0.1em" }}>{view.heading}</Kicker>
        <span
          style={{
            fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
            color: `var(--color-${tone})`, background: `var(--color-${tone}-bg)`, border: `1px solid var(--color-${tone}-border)`,
          }}
        >
          {view.totals}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>{view.verdict}</p>
      {view.directionNote && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{view.directionNote}</p>
      )}
      <div className="nova-grid-2">
        {([[view.groomLabel, view.groom], [view.brideLabel, view.bride]] as const).map(([who, side]) => (
          <div key={who} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {who} · {side.total}
            </p>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "2px" }}>
              {side.lines.map((line) => (
                <li key={line.reference} style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)" }}>
                  <span style={{ color: "var(--color-text)" }}>{line.label}</span>
                  {line.points !== null ? ` (${line.points})` : ""}: {line.detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p
        style={{
          margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.55, color: "var(--color-faint)", fontStyle: "italic",
          borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2_5)",
        }}
      >
        {view.method}
      </p>
    </Card>
  );
}

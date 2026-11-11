"use client";

/**
 * FAA-30 on the single-chart marriage reading (Nova). Descriptive only: it
 * sits under the marriage card and never feeds its score. Copy lives in
 * lib/eighth-house-copy.ts, shared with the CI card and mirrored for the PDF.
 */
import type { EighthHouseReading } from "@vinaadi/shared";
import type { Lang } from "@/lib/i18n";
import {
  EIGHTH_HOUSE_INTRO,
  eighthHouseAlsoCounted,
  eighthHouseD9Note,
  eighthHouseGroupLabel,
  eighthHouseLine,
  eighthHouseNotApplied,
  eighthHouseTitle,
} from "@/lib/eighth-house-copy";

const REFS = ["LAGNA", "MOON", "D9_LAGNA"] as const;

export function EighthHouseBlock({ reading, lang }: { reading: EighthHouseReading; lang: Lang }) {
  const small = { margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 } as const;
  return (
    <section
      aria-label={eighthHouseTitle(reading, lang)}
      style={{
        marginTop: "var(--space-2)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--space-3)",
        border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontFamily: "var(--font-body)",
      }}
    >
      <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>
        {eighthHouseTitle(reading, lang)}
      </p>
      {reading.role === "NOT_APPLIED" ? (
        <p style={small}>{eighthHouseNotApplied(lang)}</p>
      ) : (
        <>
          <p style={{ ...small, marginBottom: "var(--space-2)" }}>{EIGHTH_HOUSE_INTRO[lang]}</p>
          {REFS.map((ref) => {
            const rows = reading.factors.filter((f) => f.reference === ref);
            if (!rows.length) return null;
            return (
              <div key={ref} style={{ marginBottom: "var(--space-2)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {eighthHouseGroupLabel(ref, lang)}
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {rows.map((f, i) => (
                    <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {eighthHouseLine(f, lang)}
                      {f.alsoCountedIn.length > 0 && <span style={{ ...small, display: "block" }}>{eighthHouseAlsoCounted(f, lang)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {eighthHouseD9Note(reading, lang) && <p style={small}>{eighthHouseD9Note(reading, lang)}</p>}
        </>
      )}
    </section>
  );
}

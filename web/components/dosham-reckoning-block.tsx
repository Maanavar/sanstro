"use client";

import type { CSSProperties } from "react";

import type { Lang } from "@/lib/i18n";
import type { ChartDoshamInsight } from "@/lib/types";
import {
  doshamBeforeAfterLine,
  doshamContextLines,
  doshamMeaning,
  doshamReferenceRows,
} from "@vinaadi/shared/doshamReckoning";
import { progenyCheckView, progenyHeading } from "@vinaadi/shared/progenyChecks";

/**
 * How a dosham was reckoned — the part of a dosham card a practitioner reads
 * first (DD-17, 2026-10-06): where it is counted from, what the protections
 * left behind, the context that weighs it, and what the placement tends to
 * bring in this chart.
 *
 * One component for every dosham card (the full panel used by the Astrologer
 * view and Family charts, Life Areas, Explore), so a fact cannot appear on one
 * card and be missing from its twin. Every line comes from
 * `@vinaadi/shared/doshamReckoning`, which mobile uses too. Renders nothing
 * for a payload that predates these fields.
 */
const KICKER: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-faint)",
};
// Tamil eyebrows drop the caps tracking (it pulls Tamil letter clusters apart).
const kicker = (lang: Lang): CSSProperties =>
  lang === "ta" ? { ...KICKER, letterSpacing: 0, textTransform: "none" } : KICKER;
const WINDOW_TONE: Record<string, string> = {
  AFFLICTION: "var(--color-low)",
  SUPPORT: "var(--color-high)",
  MIXED: "var(--color-mid)",
};
const BODY: CSSProperties = { margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 };
const ITEM: CSSProperties = { fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 };

export function DoshamReckoningBlock({ dosham, lang }: { dosham: ChartDoshamInsight; lang: Lang }) {
  if (!dosham.isPresent) return null;
  const rows = doshamReferenceRows(dosham, lang);
  const beforeAfter = doshamBeforeAfterLine(dosham, lang);
  const context = doshamContextLines(dosham, lang);
  const meaning = doshamMeaning(dosham, lang);
  const progeny = progenyCheckView(dosham, lang);
  if (rows.length === 0 && !beforeAfter && context.length === 0 && !meaning && !progeny) return null;

  return (
    <div data-testid="dosham-reckoning" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {rows.length > 0 && (
        <div>
          <p style={kicker(lang)}>{lang === "ta" ? "எங்கிருந்து கணக்கிடப்பட்டது" : "Counted From"}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {rows.map((row) => (
              <li key={row.reference} style={{ ...ITEM, display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
                {/* Decorative: the detail text already says whether it counts. */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0, alignSelf: "center",
                    background: row.counts ? "var(--color-low)" : "transparent",
                    border: `1.5px solid ${row.counts ? "var(--color-low)" : "var(--color-faint)"}`,
                  }}
                />
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.reference}</span>
                <span>{row.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {beforeAfter && (
        <div>
          <p style={kicker(lang)}>{lang === "ta" ? "மீதமுள்ளது" : "What Remains"}</p>
          <p style={BODY}>{beforeAfter}</p>
        </div>
      )}

      {context.length > 0 && (
        <div>
          <p style={kicker(lang)}>{lang === "ta" ? "சூழல்" : "Context"}</p>
          <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {context.map((line) => <li key={line} style={ITEM}>{line}</li>)}
          </ul>
        </div>
      )}

      {meaning && (
        <div>
          <p style={kicker(lang)}>{lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In Your Chart"}</p>
          <p style={BODY}>{meaning}</p>
        </div>
      )}

      {/* V1 §18 Q13 step three: the D7 and dasa checks, children's doshams
          only. Words from @vinaadi/shared/progenyChecks (mobile uses it too). */}
      {progeny && (
        <>
          <div data-testid="progeny-d7">
            <p style={kicker(lang)}>{progenyHeading("d7", lang)}</p>
            <p style={BODY}>{progeny.d7Finding}</p>
            <p style={{ ...BODY, marginTop: "var(--space-1)" }}>{progeny.d7Effect}</p>
          </div>
          <div data-testid="progeny-dasha">
            <p style={kicker(lang)}>{progenyHeading("dasha", lang)}</p>
            {progeny.dashaNow && <p style={BODY}>{progeny.dashaNow}</p>}
            {progeny.windows.length > 0 && (
              <ul style={{ margin: "var(--space-2) 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {progeny.windows.map((w) => (
                  <li key={`${w.period}-${w.dates}`} style={{ ...ITEM, display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, alignSelf: "center", background: WINDOW_TONE[w.kind] }} />
                    <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{w.period}</span>
                    <span>{w.dates}</span>
                    <span>· {w.meaning}{w.isCurrent ? (lang === "ta" ? " (இப்போது)" : " (now)") : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div data-testid="progeny-precautions">
            <p style={kicker(lang)}>{progenyHeading("precautions", lang)}</p>
            <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {progeny.precautions.map((line) => <li key={line} style={ITEM}>{line}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

// Ledgers for the Astrologer view (FTR-06). An expert scans a table faster than
// nine cards of prose, so the facts the tabs below spread across paragraphs are
// also laid out here as rows. Nothing new is computed: every cell reads a field
// the engine already returned, or a fixed classical table (sign lordship).

import { useState, type CSSProperties, type ReactNode } from "react";
import { FileDown } from "lucide-react";

import { RASI_LORDS, rasiDisplayName } from "@/lib/chart-utils";
import { tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { BiText, ChartExplanationAspect, ChartExplanationPlanet } from "@/lib/types";

import { DIGNITY_WORD } from "../dashboard-hybrid-parts";
import { downloadJadhagamPdf } from "../dashboard-personal-shared";
import { aspectTypeLabel, natureLabel } from "./reading-helpers";
import { GRAHA_ORDER, orderedPlanets } from "./reading-selectors";

const pick = (text: BiText, lang: Lang) => (lang === "ta" ? text.ta : text.en);

const cell: CSSProperties = {
  padding: "var(--space-1_5) var(--space-2)",
  borderBottom: "1px solid var(--color-border)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text)",
  textAlign: "left",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};
const head: CSSProperties = {
  ...cell,
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  color: "var(--color-faint)",
  borderBottom: "1px solid var(--color-border-strong)",
};

function Ledger({ caption, headers, children }: { caption: string; headers: string[]; children: ReactNode }) {
  return (
    // Scrolls sideways inside its own box on a phone; the page never does.
    // minWidth 0: as a grid item it would otherwise grow to the table's width
    // (measured: 281 px of page overflow at 375 px, 403 px in Tamil).
    // tabIndex + role/label: a sideways scroller must be reachable by keyboard
    // (axe scrollable-region-focusable at 375 px, chart-reading-a11y.spec.ts).
    <div role="region" aria-label={caption} tabIndex={0} style={{ overflowX: "auto", maxWidth: "100%", minWidth: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
        <caption style={{ textAlign: "left", padding: "0 0 var(--space-1_5)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {caption}
        </caption>
        <thead>
          <tr>
            {headers.map((label) => (
              <th key={label} scope="col" style={head}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const NODES = new Set(["RAHU", "KETU"]);

function flagsFor(planet: ChartExplanationPlanet, lang: Lang): string {
  const flags = [
    planet.isRetrograde && !NODES.has(planet.graha) ? (lang === "ta" ? "வக்" : "R") : null,
    planet.isCombust ? (lang === "ta" ? "அஸ்" : "C") : null,
    planet.isCazimi ? (lang === "ta" ? "கசி" : "Caz") : null,
    planet.isVargottama ? (lang === "ta" ? "வர்" : "Vg") : null,
    planet.isPlanetaryWar ? (lang === "ta" ? "யுத்" : "W") : null,
  ].filter(Boolean);
  return flags.join(" · ") || "—";
}

/** Graha · House · Rasi · Star-pada · D9 · Dignity · Role · Score · Flags. */
export function GrahaLedger({ lang, planets }: { lang: Lang; planets: ChartExplanationPlanet[] }) {
  const headers =
    lang === "ta"
      ? ["கிரகம்", "வீடு", "ராசி", "நட்சத்திரம்", "நவாம்சம்", "நிலை", "பங்கு", "பலம்", "குறிகள்"]
      : ["Graha", "House", "Rasi", "Star · pada", "D9", "Dignity", "Role", "Score", "Flags"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
      <Ledger caption={lang === "ta" ? "கிரக அட்டவணை" : "Graha ledger"} headers={headers}>
        {orderedPlanets(planets).map((p) => (
          <tr key={p.graha}>
            <th scope="row" style={{ ...cell, fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(p.graha, lang)}</th>
            <td style={cell}>{p.houseFromLagna}</td>
            <td style={cell}>{rasiDisplayName(p.rasi, lang)}</td>
            <td style={cell}>{tNakshatra(p.nakshatraName, lang)} · {p.pada}</td>
            <td style={cell}>{rasiDisplayName(p.d9Rasi, lang)}</td>
            <td style={cell}>{DIGNITY_WORD[p.dignity] ? pick(DIGNITY_WORD[p.dignity], lang) : "—"}</td>
            <td style={cell}>{natureLabel(p.functionalNature, lang)}</td>
            <td style={{ ...cell, fontWeight: 700 }}>{Math.round(p.strengthScore)}</td>
            <td style={cell}>{flagsFor(p, lang)}</td>
          </tr>
        ))}
      </Ledger>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {lang === "ta"
          ? "குறிகள்: வக் = வக்கிரம், அஸ் = அஸ்தம், கசி = கசிமி, வர் = வர்கோத்தமம், யுத் = கிரக யுத்தம். பலம் = நிலை பலம் (0–100)."
          : "Flags: R retrograde, C combust, Caz cazimi, Vg vargottama, W planetary war. Score = positional strength (0–100)."}
      </p>
    </div>
  );
}

/** Houses a graha rules from this Lagna, by fixed sign lordship. Nodes rule none. */
export function housesRuled(graha: string, lagnaRasi: number): number[] {
  return Object.entries(RASI_LORDS)
    .filter(([, lord]) => lord === graha)
    .map(([rasi]) => ((Number(rasi) - lagnaRasi + 12) % 12) + 1)
    .sort((a, b) => a - b);
}

/** Role · houses ruled · house occupied — what the old tab never said. */
export function LordshipLedger({
  lang,
  lagnaRasi,
  functionalNature,
  planets,
}: {
  lang: Lang;
  lagnaRasi: number;
  functionalNature: Record<string, string>;
  planets: { graha: string; houseFromLagna: number }[];
}) {
  const headers = lang === "ta" ? ["கிரகம்", "பங்கு", "ஆளும் வீடுகள்", "இருக்கும் வீடு"] : ["Graha", "Role for this Lagna", "Rules houses", "Sits in house"];
  const sits = new Map(planets.map((p) => [p.graha, p.houseFromLagna]));
  return (
    <Ledger caption={lang === "ta" ? "அதிபதி அட்டவணை" : "Lordship ledger"} headers={headers}>
      {GRAHA_ORDER.filter((g) => functionalNature[g] || sits.has(g)).map((graha) => {
        const ruled = housesRuled(graha, lagnaRasi);
        return (
          <tr key={graha}>
            <th scope="row" style={{ ...cell, fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(graha, lang)}</th>
            <td style={cell}>{functionalNature[graha] ? natureLabel(functionalNature[graha], lang) : "—"}</td>
            <td style={cell}>{ruled.length ? ruled.join(", ") : "—"}</td>
            <td style={cell}>{sits.get(graha) ?? "—"}</td>
          </tr>
        );
      })}
    </Ledger>
  );
}

/** Every natal aspect, uncapped (the chip list stopped at 18). */
export function DrishtiLedger({ lang, aspects }: { lang: Lang; aspects: ChartExplanationAspect[] }) {
  const headers = lang === "ta" ? ["பார்க்கும் கிரகம்", "பார்க்கப்படும் கிரகம்", "வீடு", "பார்வை"] : ["From", "To", "In house", "Aspect"];
  return (
    <Ledger caption={lang === "ta" ? "ஜாதகப் பார்வைகள்" : "Natal drishti"} headers={headers}>
      {aspects.map((aspect) => (
        <tr key={`${aspect.sourcePlanet}-${aspect.targetPlanet}-${aspect.aspectHouse}`}>
          <th scope="row" style={{ ...cell, fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(aspect.sourcePlanet, lang)}</th>
          <td style={cell}>{tPlanetLord(aspect.targetPlanet, lang)}</td>
          <td style={cell}>{aspect.targetHouse}</td>
          <td style={cell}>{aspectTypeLabel(aspect.aspectType, lang)}</td>
        </tr>
      ))}
    </Ledger>
  );
}

/**
 * FTR-22 — "share with my astrologer": these ledgers as a PDF a reader can hand
 * to their own jyotishi (`GET /charts/{id}/export/pdf?detail=astrologer`).
 * New Tamil, pending native review.
 */
export function ShareWithAstrologer({ lang, chartId }: { lang: Lang; chartId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
      <button
        type="button"
        className="ui-btn ui-btn--secondary"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const ok = await downloadJadhagamPdf(chartId, "", lang, "astrologer").catch(() => false);
          setState(ok ? "idle" : "failed");
        }}
        style={{ borderRadius: "var(--radius-pill)", minHeight: "36px" }}
      >
        <FileDown size={15} aria-hidden />
        {state === "busy"
          ? lang === "ta" ? "தயாராகிறது…" : "Preparing…"
          : lang === "ta" ? "உங்கள் ஜோதிடருக்கு PDF" : "PDF for your astrologer"}
      </button>
      <span aria-live="polite" style={{ fontSize: "var(--text-sm)", color: state === "failed" ? "var(--color-low)" : "var(--color-faint)" }}>
        {state === "failed"
          ? lang === "ta" ? "PDF உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Could not make the PDF. Please try again."
          : lang === "ta" ? "இந்த அட்டவணைகள் அனைத்தும், ஒரே கோப்பில்." : "Every ledger here, in one file."}
      </span>
    </div>
  );
}

/** The school before the reading: what an astrologer checks first. */
export function MethodNote({ lang, note }: { lang: Lang; note: BiText }) {
  return (
    <p
      style={{
        margin: 0,
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        fontSize: "var(--text-sm)",
        lineHeight: 1.5,
        color: "var(--color-muted)",
      }}
    >
      {pick(note, lang)}
    </p>
  );
}

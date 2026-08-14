"use client";

import { useMemo, useState } from "react";

import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  D1_RASI_NAMES,
  GRAHA_ABBR,
  rasiLabel,
} from "@/lib/chart-utils";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData } from "@/lib/types";
import type { RasiCellDetail } from "@/lib/chart-utils";

const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

export const RASI_NAMES = D1_RASI_NAMES;
export { GRAHA_ABBR };

// Nova only redirects 4 of the 9 --planet-* custom properties (lagna/saturn/
// nodes/other — see dashboard-nova.css); --planet-sun/-moon/-mars/-mercury/
// -jupiter/-venus/-rahu/-ketu fall through to Classic's globals.css values
// under the Nova theme and read wrong (same trap dashboard-plan-transits-nova
// and dashboard-life-areas-remedies-nova already hit and documented). So this
// reuses those files' Nova-safe workaround — 5 shared semantic tones, not a
// unique hue per graha. Some grahas share a tone with Lagna/Rahu/Ketu when
// they land in the same box; the Tamil abbreviation still disambiguates.
function occupantColor(graha: string): string {
  switch (graha) {
    case "Lagna": return "var(--planet-lagna)";
    case "SUN":
    case "JUPITER": return "var(--planet-lagna)"; // accent-strong (gold)
    case "MOON":
    case "VENUS": return "var(--planet-nodes)"; // accent-secondary (purple)
    case "MERCURY": return "var(--color-high, var(--planet-other))"; // green
    case "SATURN": return "var(--planet-saturn)"; // low (rust)
    case "RAHU":
    case "KETU": return "var(--planet-nodes)";
    default: return "var(--planet-other)"; // Mars + fallback
  }
}

/** `buildD1CellDetail` has no `lang`, so it labels the lagna "La" for every
 *  reader. In a Tamil kattam the marker is ல — and it sat next to Tamil graha
 *  abbreviations, so the Latin one was the only stray character in the grid. */
function occupantAbbr(occ: RasiCellDetail["occupants"][number], lang: Lang): string {
  if (occ.key === "Lagna" && lang === "ta") return "ல";
  return occ.abbr;
}

function occupantName(occ: RasiCellDetail["occupants"][number], lang: Lang): string {
  if (occ.key === "Lagna") return t("label_lagnam", lang);
  return occ.graha;
}

function occupantFlagLabels(
  occ: RasiCellDetail["occupants"][number],
  lang: Lang,
): string[] {
  const flags: string[] = [];
  if (occ.isRetrograde) flags.push(t("flag_vakra", lang));
  if (occ.isCombust) flags.push(t("flag_astam", lang));
  if (occ.isCazimi) flags.push(t("flag_cazimi", lang));
  if (occ.isVargottama) flags.push(t("flag_vargottamam", lang));
  return flags;
}

function ExplainPanel({
  title,
  subtitle,
  emptyText,
  houseLabel,
  detail,
  lang,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  houseLabel: string;
  detail: ReturnType<typeof buildD1CellDetail> | ReturnType<typeof buildD9CellDetail>;
  lang: Lang;
}) {
  return (
    <div style={{
      marginTop: "8px",
      border: "1px solid var(--chartgrid-border, var(--panel-tan))",
      borderRadius: "var(--radius-md)",
      padding: "10px",
      background: "var(--chartgrid-surface, var(--panel-cream))",
      width: "100%",
      maxWidth: "296px",
    }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </p>
      <p style={{ margin: "3px 0 0", fontSize: "0.875rem", color: "var(--chartgrid-ink, var(--panel-earth))", fontWeight: 600 }}>
        {rasiLabel(detail.rasi, lang)}
        {detail.isLagna ? ` • ${t("label_lagnam", lang)}` : ""}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--chartgrid-ink, var(--panel-earth))" }}>
        {subtitle}: {houseLabel} {detail.houseFromRef}
      </p>
      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {detail.occupants.length === 0 ? (
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{emptyText}</span>
        ) : (
          detail.occupants.map((occ) => {
            const nonRetroFlags = [
              occ.isCombust ? t("flag_astam", lang) : null,
              occ.isCazimi ? t("flag_cazimi", lang) : null,
              occ.isVargottama ? t("flag_vargottamam", lang) : null,
            ].filter(Boolean) as string[];
            return (
              <span key={occ.key} style={{
                fontSize: "0.75rem",
                border: "1px solid var(--chartgrid-border, var(--panel-tan))",
                borderRadius: "var(--radius-full)",
                padding: "3px 8px",
                background: "var(--chartgrid-surface, var(--panel-cream))",
                color: "var(--chartgrid-ink, var(--panel-earth))",
              }}>
                {occupantName(occ, lang)}{occ.isRetrograde ? " (R)" : ""}
                {nonRetroFlags.length ? ` — ${nonRetroFlags.join(", ")}` : ""}
                {occ.degreeInRasi !== null ? ` ${occ.degreeInRasi.toFixed(2)}°` : ""}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RasiChart({
  chart,
  label,
  showExplain = true,
  lang,
  selectedRasi: controlledRasi,
  onSelectRasi,
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  showExplain?: boolean;
  lang: Lang;
  /** Optional controlled selection. Supplied together with `onSelectRasi` when a
   *  caller shows D1 and D9 side by side and wants one rasi lit in both grids —
   *  the D1↔D9 comparison (vargottama, a graha's varga strength) is the whole
   *  point of reading the pair, and it only works if the two agree on which
   *  rasi is being looked at. Omit both and the chart keeps its own state. */
  selectedRasi?: number;
  onSelectRasi?: (rasi: number) => void;
}) {
  const [ownRasi, setOwnRasi] = useState<number>(chart.lagna.rasi);
  const selectedRasi = controlledRasi ?? ownRasi;
  const selectRasi = onSelectRasi ?? setOwnRasi;
  const selectedDetail = useMemo(() => buildD1CellDetail(chart, selectedRasi), [chart, selectedRasi]);
  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.875rem", color: "var(--color-faint)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1.5px solid var(--chartgrid-border, var(--panel-tan))",
        borderRadius: "8px",
        overflow: "hidden",
        background: "var(--chart-bg)",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const detail = buildD1CellDetail(chart, rasi);
          const isSelected = selectedRasi === rasi;
          return (
            <button
              key={rasi}
              type="button"
              onClick={() => selectRasi(rasi)}
              title={`${detail.rasiName} - ${t("chart_tap_to_explain", lang)}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                background: detail.isLagna
                  ? "var(--chart-d1-lagna-bg)"
                  : isSelected
                    ? "var(--chart-cell-selected)"
                    : "var(--chart-cell-default)",
                border: detail.isLagna
                  ? "1.5px solid var(--chart-d1-lagna-border)"
                  : isSelected
                    ? "1.5px solid var(--chart-d1-active)"
                    : "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
                padding: "5px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {/* lineHeight 1.15 rather than 1: a Tamil sign name is longer than
                  its transliteration and can take two lines in a 72px cell, and
                  at lineHeight 1 the two lines collide. */}
              <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", lineHeight: 1.15, display: "block" }}>
                {rasiLabel(rasi, lang)}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => {
                  const flagLabels = occupantFlagLabels(occ, lang);
                  return (
                    <span
                      key={occ.key}
                      title={flagLabels.length ? `${occ.graha} — ${flagLabels.join(", ")}` : occ.graha}
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: occupantColor(occ.key),
                        borderRadius: "3px",
                        padding: "1px 3px",
                        background: "var(--chartgrid-surface, var(--panel-cream))",
                        border: "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
                      }}>
                      {occupantAbbr(occ, lang)}
                      {occ.isRetrograde ? <sup style={{ fontSize: "0.625rem", color: "var(--chart-d1-active)" }}>R</sup> : null}
                      {occ.isCombust ? <sup style={{ fontSize: "0.625rem", color: "var(--color-low, var(--planet-saturn))" }}>C</sup> : null}
                      {occ.isCazimi ? <sup style={{ fontSize: "0.625rem", color: "var(--color-high, var(--chart-d9-active))" }}>✦</sup> : null}
                      {occ.isVargottama ? <sup style={{ fontSize: "0.625rem", color: "var(--color-high, var(--chart-d9-active))" }}>V</sup> : null}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
        <div style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
          background: "var(--chartgrid-surface, var(--panel-cream))",
          border: "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
              {rasiLabel(chart.lagna.rasi, lang)} {lang === "ta" ? "லக்னம்" : "La"}
            </span>
          </span>
        </div>
      </div>
      {showExplain ? (
        <ExplainPanel
          title={t("chart_tap_to_explain", lang)}
          subtitle={t("chart_from_d1_lagna", lang)}
          emptyText={t("chart_no_graha_in_rasi", lang)}
          houseLabel={t("chart_house_label", lang)}
          detail={selectedDetail}
          lang={lang}
        />
      ) : null}
    </div>
  );
}

export function NavamsaChart({
  chart,
  label,
  showExplain = true,
  lang,
  selectedRasi: controlledRasi,
  onSelectRasi,
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  showExplain?: boolean;
  lang: Lang;
  /** Optional controlled selection — see the note on `RasiChart`. */
  selectedRasi?: number;
  onSelectRasi?: (rasi: number) => void;
}) {
  const d9LagnaRasi = useMemo(() => computeD9LagnaRasi(chart.lagna.absoluteLongitude), [chart.lagna.absoluteLongitude]);
  const [ownRasi, setOwnRasi] = useState<number>(d9LagnaRasi);
  const selectedRasi = controlledRasi ?? ownRasi;
  const selectRasi = onSelectRasi ?? setOwnRasi;
  const selectedDetail = useMemo(() => buildD9CellDetail(chart, selectedRasi), [chart, selectedRasi]);
  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.875rem", color: "var(--color-faint)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1.5px solid var(--chartgrid-border, var(--panel-tan))",
        borderRadius: "8px",
        overflow: "hidden",
        background: "var(--chart-bg)",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const detail = buildD9CellDetail(chart, rasi);
          const isSelected = selectedRasi === rasi;
          return (
            <button
              key={rasi}
              type="button"
              onClick={() => selectRasi(rasi)}
              title={`${detail.rasiName} - ${t("chart_tap_to_explain", lang)}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                background: detail.isLagna
                  ? "var(--chart-d9-lagna-bg)"
                  : isSelected
                    ? "var(--chart-cell-selected)"
                    : "var(--chart-cell-default)",
                border: detail.isLagna
                  ? "1.5px solid var(--chart-d9-lagna-border)"
                  : isSelected
                    ? "1.5px solid var(--chart-d9-active)"
                    : "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {/* lineHeight 1.15 rather than 1: a Tamil sign name is longer than
                  its transliteration and can take two lines in a 72px cell, and
                  at lineHeight 1 the two lines collide. */}
              <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", lineHeight: 1.15, display: "block" }}>
                {rasiLabel(rasi, lang)}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => {
                  const flagLabels = occupantFlagLabels(occ, lang);
                  return (
                    <span
                      key={occ.key}
                      title={flagLabels.length ? `${occ.graha} — ${flagLabels.join(", ")}` : occ.graha}
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: occupantColor(occ.key),
                        borderRadius: "3px",
                        padding: "1px 3px",
                        background: "var(--chartgrid-surface, var(--panel-cream))",
                        border: "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
                      }}>
                      {occupantAbbr(occ, lang)}
                      {occ.isRetrograde ? <sup style={{ fontSize: "0.625rem", color: "var(--chart-d9-active)" }}>R</sup> : null}
                      {occ.isVargottama ? <sup style={{ fontSize: "0.625rem", color: "var(--color-high, var(--chart-d9-active))" }}>V</sup> : null}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
        <div style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
          background: "var(--chartgrid-surface, var(--panel-cream))",
          border: "1px solid var(--chartgrid-border-light, var(--panel-tan-light))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
              {t("navamsa_label", lang)} · {rasiLabel(d9LagnaRasi, lang)} {lang === "ta" ? "லக்னம்" : "La"}
            </span>
          </span>
        </div>
      </div>
      {showExplain ? (
        <ExplainPanel
          title={t("chart_tap_to_explain", lang)}
          subtitle={t("chart_from_d9_lagna", lang)}
          emptyText={t("chart_no_graha_in_rasi", lang)}
          houseLabel={t("chart_house_label", lang)}
          detail={selectedDetail}
          lang={lang}
        />
      ) : null}
    </div>
  );
}

export function JathagamKattam({
  chart,
  lang,
}: {
  chart: ChartCalculateResponseData;
  lang: Lang;
}) {
  const [view, setView] = useState<"D1" | "D9">("D1");

  return (
    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--chartgrid-ink-strong, var(--panel-earth-dark))", letterSpacing: "0.02em" }}>
          {t("label_jathagam_kattam", lang)}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "var(--color-faint)", lineHeight: 1.35 }}>
          {t("jathagam_kattam_hint", lang)}
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => setView("D1")}
          style={{
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            border: view === "D1" ? "1.5px solid var(--chart-d1-active)" : "1px solid var(--chartgrid-border, var(--panel-tan))",
            background: view === "D1" ? "var(--chart-d1-lagna-bg)" : "var(--chartgrid-surface, var(--panel-cream))",
            color: view === "D1" ? "var(--chart-d1-active-text)" : "var(--color-faint)",
          }}
        >
          {t("chart_view_d1", lang)}
        </button>
        <button
          type="button"
          onClick={() => setView("D9")}
          style={{
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            border: view === "D9" ? "1.5px solid var(--chart-d9-active)" : "1px solid var(--chartgrid-border, var(--panel-tan))",
            background: view === "D9" ? "var(--chart-d9-active-bg)" : "var(--chartgrid-surface, var(--panel-cream))",
            color: view === "D9" ? "var(--chart-d9-active-dark)" : "var(--color-faint)",
          }}
        >
          {t("chart_view_d9", lang)}
        </button>
      </div>

      {view === "D1" ? (
        <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} />
      ) : (
        <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} />
      )}
    </div>
  );
}

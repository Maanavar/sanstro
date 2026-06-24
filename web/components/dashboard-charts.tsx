"use client";

import { useMemo, useState } from "react";

import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  D1_RASI_NAMES,
  GRAHA_ABBR,
} from "@/lib/chart-utils";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData } from "@/lib/types";

const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];

export const RASI_NAMES = D1_RASI_NAMES;
export { GRAHA_ABBR };

function occupantColor(abbr: string): string {
  if (abbr === "La") return "var(--planet-lagna)";
  if (abbr === "Sa") return "var(--planet-saturn)";
  if (abbr === "Ra" || abbr === "Ke") return "var(--planet-nodes)";
  return "var(--planet-other)";
}

function ExplainPanel({
  title,
  subtitle,
  emptyText,
  houseLabel,
  detail,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  houseLabel: string;
  detail: ReturnType<typeof buildD1CellDetail> | ReturnType<typeof buildD9CellDetail>;
}) {
  return (
    <div style={{
      marginTop: "8px",
      border: "1px solid var(--panel-tan)",
      borderRadius: "var(--radius-md)",
      padding: "10px",
      background: "var(--panel-cream)",
      width: "100%",
      maxWidth: "296px",
    }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </p>
      <p style={{ margin: "3px 0 0", fontSize: "0.875rem", color: "var(--panel-earth)", fontWeight: 600 }}>
        {detail.rasiName} (Rasi {detail.rasi}) {detail.isLagna ? "• Lagna" : ""}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--panel-earth)" }}>
        {subtitle}: {houseLabel} {detail.houseFromRef}
      </p>
      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {detail.occupants.length === 0 ? (
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{emptyText}</span>
        ) : (
          detail.occupants.map((occ) => (
            <span key={occ.key} style={{
              fontSize: "0.75rem",
              border: "1px solid var(--panel-tan)",
              borderRadius: "var(--radius-full)",
              padding: "3px 8px",
              background: "var(--panel-cream)",
              color: "var(--panel-earth)",
            }}>
              {occ.graha}{occ.isRetrograde ? " (R)" : ""}
              {occ.degreeInRasi !== null ? ` ${occ.degreeInRasi.toFixed(2)}°` : ""}
            </span>
          ))
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
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  showExplain?: boolean;
  lang: Lang;
}) {
  const [selectedRasi, setSelectedRasi] = useState<number>(chart.lagna.rasi);
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
        border: "1.5px solid var(--panel-tan)",
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
              onClick={() => setSelectedRasi(rasi)}
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
                    : "1px solid var(--panel-tan-light)",
                padding: "5px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", lineHeight: 1, display: "block" }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => (
                  <span key={occ.key} style={{
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: occupantColor(occ.abbr),
                    borderRadius: "3px",
                    padding: "1px 3px",
                    background: "var(--panel-cream)",
                    border: "1px solid var(--panel-tan-light)",
                  }}>
                    {occ.abbr}{occ.isRetrograde ? <sup style={{ fontSize: "0.625rem", color: "var(--chart-d1-active)" }}>R</sup> : null}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        <div style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
          background: "var(--panel-cream)",
          border: "1px solid var(--panel-tan-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
              {RASI_NAMES[chart.lagna.rasi]} La
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
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  showExplain?: boolean;
  lang: Lang;
}) {
  const d9LagnaRasi = useMemo(() => computeD9LagnaRasi(chart.lagna.absoluteLongitude), [chart.lagna.absoluteLongitude]);
  const [selectedRasi, setSelectedRasi] = useState<number>(d9LagnaRasi);
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
        border: "1.5px solid var(--panel-tan)",
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
              onClick={() => setSelectedRasi(rasi)}
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
                    : "1px solid var(--panel-tan-light)",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", lineHeight: 1, display: "block" }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => (
                  <span key={occ.key} style={{
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: occupantColor(occ.abbr),
                    borderRadius: "3px",
                    padding: "1px 3px",
                    background: "var(--panel-cream)",
                    border: "1px solid var(--panel-tan-light)",
                  }}>
                    {occ.abbr}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        <div style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
          background: "var(--panel-cream)",
          border: "1px solid var(--panel-tan-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
              Navamsam · {RASI_NAMES[d9LagnaRasi]} La
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
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--panel-earth-dark)", letterSpacing: "0.02em" }}>
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
            border: view === "D1" ? "1.5px solid var(--chart-d1-active)" : "1px solid var(--panel-tan)",
            background: view === "D1" ? "var(--chart-d1-lagna-bg)" : "var(--panel-cream)",
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
            border: view === "D9" ? "1.5px solid var(--chart-d9-active)" : "1px solid var(--panel-tan)",
            background: view === "D9" ? "var(--chart-d9-active-bg)" : "var(--panel-cream)",
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

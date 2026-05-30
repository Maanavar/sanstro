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
  if (abbr === "La") return "#8c3e18";   /* terracotta-dark — Lagna */
  if (abbr === "Sa") return "#A8482F";   /* caution rust — Saturn */
  if (abbr === "Ra" || abbr === "Ke") return "#5a4880"; /* muted violet — nodes */
  return "#1e5a8c";                      /* deep blue — other planets */
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
      border: "1px solid #D4C8AE",
      borderRadius: "10px",
      padding: "10px",
      background: "#FAF5EA",
      width: "100%",
      maxWidth: "296px",
    }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "#7A6F5E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </p>
      <p style={{ margin: "3px 0 0", fontSize: "0.875rem", color: "#1A1612", fontWeight: 600 }}>
        {detail.rasiName} (Rasi {detail.rasi}) {detail.isLagna ? "• Lagna" : ""}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#5a4f42" }}>
        {subtitle}: {houseLabel} {detail.houseFromRef}
      </p>
      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {detail.occupants.length === 0 ? (
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{emptyText}</span>
        ) : (
          detail.occupants.map((occ) => (
            <span key={occ.key} style={{
              fontSize: "0.75rem",
              border: "1px solid #D4C8AE",
              borderRadius: "999px",
              padding: "3px 8px",
              background: "#FFFFFF",
              color: "#1A1612",
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
      {label ? <p style={{ fontSize: "0.875rem", color: "#7A6F5E", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1.5px solid #D4C8AE",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#E4DBC8",
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
                  ? "#F0D9C4"
                  : isSelected
                    ? "#EDE5D4"
                    : "#FFFFFF",
                border: detail.isLagna
                  ? "1.5px solid rgba(184,90,44,0.5)"
                  : isSelected
                    ? "1.5px solid #B85A2C"
                    : "1px solid #E4DBC8",
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
                    background: "#FAF5EA",
                    border: "1px solid #E4DBC8",
                  }}>
                    {occ.abbr}{occ.isRetrograde ? <sup style={{ fontSize: "0.625rem", color: "#B85A2C" }}>R</sup> : null}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        <div style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 4",
          background: "#FAF5EA",
          border: "1px solid #E4DBC8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#5a4f42", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
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
      {label ? <p style={{ fontSize: "0.875rem", color: "#7A6F5E", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1.5px solid #D4C8AE",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#E4DBC8",
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
                  ? "#DCE4D2"
                  : isSelected
                    ? "#EDE5D4"
                    : "#FFFFFF",
                border: detail.isLagna
                  ? "1.5px solid rgba(92,118,84,0.5)"
                  : isSelected
                    ? "1.5px solid #5C7654"
                    : "1px solid #E4DBC8",
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
                    background: "#FAF5EA",
                    border: "1px solid #E4DBC8",
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
          background: "#FAF5EA",
          border: "1px solid #E4DBC8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.75rem", color: "#5a4f42", textAlign: "center", padding: "4px", lineHeight: 1.4 }}>
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
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#1A1612", letterSpacing: "0.02em" }}>
          {t("label_jathagam_kattam", lang)}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#7A6F5E", lineHeight: 1.35 }}>
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
            border: view === "D1" ? "1.5px solid #B85A2C" : "1px solid #D4C8AE",
            background: view === "D1" ? "#F0D9C4" : "#FAF5EA",
            color: view === "D1" ? "#8c3e18" : "#7A6F5E",
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
            border: view === "D9" ? "1.5px solid #5C7654" : "1px solid #D4C8AE",
            background: view === "D9" ? "#DCE4D2" : "#FAF5EA",
            color: view === "D9" ? "#3a6b40" : "#7A6F5E",
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

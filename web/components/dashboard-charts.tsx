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
  if (abbr === "La") return "#e5b84d";
  if (abbr === "Sa") return "#f87171";
  if (abbr === "Ra" || abbr === "Ke") return "#a78bfa";
  return "#93c5fd";
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
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "10px",
      background: "rgba(255,255,255,0.03)",
      width: "100%",
      maxWidth: "296px",
    }}>
      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </p>
      <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>
        {detail.rasiName} (Rasi {detail.rasi}) {detail.isLagna ? "• Lagna" : ""}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.58)" }}>
        {subtitle}: {houseLabel} {detail.houseFromRef}
      </p>
      <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {detail.occupants.length === 0 ? (
          <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.45)" }}>{emptyText}</span>
        ) : (
          detail.occupants.map((occ) => (
            <span key={occ.key} style={{
              fontSize: "0.72rem",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "999px",
              padding: "3px 8px",
              background: "rgba(0,0,0,0.28)",
              color: "rgba(255,255,255,0.86)",
            }}>
              {occ.graha}
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
  lang,
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  lang: Lang;
}) {
  const [selectedRasi, setSelectedRasi] = useState<number>(chart.lagna.rasi);
  const selectedDetail = useMemo(() => buildD1CellDetail(chart, selectedRasi), [chart, selectedRasi]);
  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px",
        overflow: "hidden",
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
                  ? "rgba(229,184,77,0.12)"
                  : isSelected
                    ? "rgba(147,197,253,0.12)"
                    : "rgba(255,255,255,0.03)",
                border: isSelected ? "1px solid rgba(147,197,253,0.55)" : "1px solid rgba(255,255,255,0.08)",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", lineHeight: 1, display: "block" }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => (
                  <span key={occ.key} style={{
                    fontSize: "0.66rem",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: occupantColor(occ.abbr),
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "3px",
                    padding: "1px 3px",
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
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "4px", lineHeight: 1.3 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.6rem" }}>
              {RASI_NAMES[chart.lagna.rasi]} La
            </span>
          </span>
        </div>
      </div>
      <ExplainPanel
        title={t("chart_tap_to_explain", lang)}
        subtitle={t("chart_from_d1_lagna", lang)}
        emptyText={t("chart_no_graha_in_rasi", lang)}
        houseLabel={t("chart_house_label", lang)}
        detail={selectedDetail}
      />
    </div>
  );
}

export function NavamsaChart({
  chart,
  label,
  lang,
}: {
  chart: ChartCalculateResponseData;
  label?: string;
  lang: Lang;
}) {
  const d9LagnaRasi = useMemo(() => computeD9LagnaRasi(chart.lagna.absoluteLongitude), [chart.lagna.absoluteLongitude]);
  const [selectedRasi, setSelectedRasi] = useState<number>(d9LagnaRasi);
  const selectedDetail = useMemo(() => buildD9CellDetail(chart, selectedRasi), [chart, selectedRasi]);
  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        gap: `${gap}px`,
        border: "1px solid rgba(167,139,250,0.25)",
        borderRadius: "6px",
        overflow: "hidden",
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
                  ? "rgba(167,139,250,0.10)"
                  : isSelected
                    ? "rgba(147,197,253,0.10)"
                    : "rgba(255,255,255,0.02)",
                border: isSelected ? "1px solid rgba(147,197,253,0.5)" : "1px solid rgba(255,255,255,0.07)",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", lineHeight: 1, display: "block" }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {detail.occupants.map((occ) => (
                  <span key={occ.key} style={{
                    fontSize: "0.66rem",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: occ.abbr === "La" ? "#a78bfa" : occupantColor(occ.abbr),
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "3px",
                    padding: "1px 3px",
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
          background: "rgba(167,139,250,0.04)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "4px", lineHeight: 1.3 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.6rem" }}>
              Navamsam · {RASI_NAMES[d9LagnaRasi]} La
            </span>
          </span>
        </div>
      </div>
      <ExplainPanel
        title={t("chart_tap_to_explain", lang)}
        subtitle={t("chart_from_d9_lagna", lang)}
        emptyText={t("chart_no_graha_in_rasi", lang)}
        houseLabel={t("chart_house_label", lang)}
        detail={selectedDetail}
      />
    </div>
  );
}

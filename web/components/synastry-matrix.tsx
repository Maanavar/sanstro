"use client";

import { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, SynastryData } from "@/lib/types";

interface MatrixMember {
  memberId: string;
  displayName: string;
  chartId: string;
}

interface SynastryMatrixProps {
  lang: Lang;
  ownerChartId: string;
  members: MatrixMember[];
}

function scoreTone(score: number) {
  if (score >= 65) return { color: "#5C7654", bg: "#DCE4D2", border: "rgba(92,118,84,0.35)" };
  if (score >= 40) return { color: "#B85A2C", bg: "#F0D9C4", border: "rgba(184,90,44,0.3)" };
  return                  { color: "#A8482F", bg: "#F2D8CC", border: "rgba(168,72,47,0.3)" };
}

export function SynastryMatrix({ lang, ownerChartId, members }: SynastryMatrixProps) {
  const [scores, setScores]   = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded]   = useState(false);
  const [error, setError]     = useState("");

  async function loadAll() {
    if (!ownerChartId || members.length === 0) return;
    setLoaded(true);
    setError("");
    const busy: Record<string, boolean> = {};
    for (const m of members) busy[m.memberId] = true;
    setLoading(busy);

    await Promise.all(
      members.map(async (m) => {
        try {
          const res = await apiFetchJson<ApiEnvelope<SynastryData>>(
            `/charts/synastry?${toQuery({ chart_id: ownerChartId, member_chart_id: m.chartId })}`
          );
          setScores((prev) => ({ ...prev, [m.memberId]: res.data?.compatibilityScore ?? null }));
        } catch {
          setScores((prev) => ({ ...prev, [m.memberId]: null }));
        } finally {
          setLoading((prev) => ({ ...prev, [m.memberId]: false }));
        }
      })
    );
  }

  if (members.length === 0) return null;

  return (
    <div style={{ fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
          {lang === "ta" ? "பொருத்த சுருக்கம்" : "COMPATIBILITY OVERVIEW"}
        </p>
        {!loaded && (
          <button
            type="button"
            onClick={() => void loadAll()}
            style={{
              padding: "4px 14px", borderRadius: "999px",
              border: "1.5px solid #D4C8AE", background: "transparent",
              color: "#3D352B", fontSize: "0.76rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {lang === "ta" ? "ஏற்று" : "Load scores"}
          </button>
        )}
      </div>

      {error && (
        <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#A8482F" }}>{error}</p>
      )}

      {loaded && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {members.map((m) => {
            const score = scores[m.memberId] ?? null;
            const busy  = loading[m.memberId] ?? false;
            const tone  = score !== null ? scoreTone(score) : { color: "#A89D89", bg: "#FAF5EA", border: "#E4DBC8" };
            return (
              <div
                key={m.memberId}
                style={{
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  minWidth: "110px",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 5px", fontSize: "0.74rem", color: "#3D352B", fontWeight: 600 }}>
                  {m.displayName}
                </p>
                {busy ? (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#A89D89" }}>…</p>
                ) : score !== null ? (
                  <p style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: "1.6rem", fontWeight: 500, color: tone.color, lineHeight: 1 }}>
                    {score}
                    <span style={{ fontSize: "0.7rem", color: "#A89D89", fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 400 }}>/100</span>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#A89D89" }}>—</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  familyVaultId: string;
  members: MatrixMember[];
}

function scoreTone(score: number) {
  if (score >= 65) return { color: "var(--chart-d9-active)", bg: "var(--chart-d9-active-bg)", border: "rgba(92,118,84,0.35)" };
  if (score >= 40) return { color: "var(--synastry-accent, var(--panel-brand))", bg: "var(--chart-d1-lagna-bg)", border: "rgba(184,90,44,0.3)" };
  return                  { color: "var(--planet-saturn)", bg: "var(--panel-warm-tint)", border: "rgba(168,72,47,0.3)" };
}

export function SynastryMatrix({ lang, ownerChartId, familyVaultId, members }: SynastryMatrixProps) {
  const [scores, setScores]   = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded]   = useState(false);
  const [error, setError]     = useState("");

  async function loadAll() {
    if (!ownerChartId || !familyVaultId || members.length === 0) return;
    setLoaded(true);
    setError("");
    const busy: Record<string, boolean> = {};
    for (const m of members) busy[m.memberId] = true;
    setLoading(busy);

    await Promise.all(
      members.map(async (m) => {
        try {
          const res = await apiFetchJson<ApiEnvelope<SynastryData>>(
            `/api/v1/relationships/${m.memberId}/synastry${toQuery({ familyVaultId })}`
          );
          setScores((prev) => ({ ...prev, [m.memberId]: res.data?.compatibilityScore ?? null }));
        } catch (err) {
          setScores((prev) => ({ ...prev, [m.memberId]: null }));
          setError(readErrorMessage(err));
        } finally {
          setLoading((prev) => ({ ...prev, [m.memberId]: false }));
        }
      })
    );
  }

  if (members.length === 0) return null;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
          {lang === "ta" ? "பொருத்த சுருக்கம்" : "COMPATIBILITY OVERVIEW"}
        </p>
        {!loaded && (
          <button
            type="button"
            onClick={() => void loadAll()}
            style={{
              padding: "4px 14px", borderRadius: "999px",
              border: "1.5px solid var(--synastry-border, var(--panel-tan))", background: "transparent",
              color: "var(--synastry-ink, var(--panel-earth))", fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {lang === "ta" ? "ஏற்று" : "Load scores"}
          </button>
        )}
      </div>

      {error && (
        <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "var(--planet-saturn)" }}>{error}</p>
      )}

      {loaded && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {members.map((m) => {
            const score = scores[m.memberId] ?? null;
            const busy  = loading[m.memberId] ?? false;
            const tone  = score !== null ? scoreTone(score) : { color: "var(--color-faint)", bg: "var(--panel-cream)", border: "var(--synastry-border-light, var(--panel-tan-light))" };
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
                <p style={{ margin: "0 0 5px", fontSize: "0.75rem", color: "var(--synastry-ink, var(--panel-earth))", fontWeight: 600 }}>
                  {m.displayName}
                </p>
                {busy ? (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)" }}>…</p>
                ) : score !== null ? (
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500, color: tone.color, lineHeight: 1 }}>
                    {score}
                    <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", fontFamily: "var(--font-body)", fontWeight: 400 }}>/100</span>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)" }}>—</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

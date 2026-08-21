"use client";

import { useState } from "react";
import { readErrorMessage } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { getRelationshipSynastry } from "@vinaadi/shared/api/relationships";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

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
  if (score >= 65) return { color: "var(--chart-d9-active)", bg: "var(--chart-d9-active-bg)", border: "var(--color-high-border)" };
  if (score >= 40) return { color: "var(--color-mid-text)", bg: "var(--chart-d1-lagna-bg)", border: "var(--color-mid-border)" };
  return                  { color: "var(--planet-saturn)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" };
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
          const res = await getRelationshipSynastry(m.memberId, familyVaultId);
          setScores((prev) => ({ ...prev, [m.memberId]: res.data?.score ?? null }));
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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        <Kicker as="p" color="var(--color-faint)" style={{ margin: 0, fontSize: "var(--text-2xs)", letterSpacing: "0.1em" }}>
          {lang === "ta" ? "பொருத்த சுருக்கம்" : "COMPATIBILITY OVERVIEW"}
        </Kicker>
        {!loaded && (
          <button
            type="button"
            onClick={() => void loadAll()}
            style={{
              padding: "var(--space-1) var(--space-4)", borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--color-border)", background: "transparent",
              color: "var(--color-text)", fontSize: "var(--text-sm)", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {lang === "ta" ? "ஏற்று" : "Load scores"}
          </button>
        )}
      </div>

      {error && (
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-sm)", color: "var(--planet-saturn)" }}>{error}</p>
      )}

      {loaded && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {members.map((m) => {
            const score = scores[m.memberId] ?? null;
            const busy  = loading[m.memberId] ?? false;
            const tone  = score !== null ? scoreTone(score) : { color: "var(--color-faint)", bg: "var(--color-surface-2)", border: "var(--color-border)" };
            const variant: "default" | "high" | "mid" | "low" =
              score === null ? "default" : score >= 65 ? "high" : score >= 40 ? "mid" : "low";
            return (
              <Card
                key={m.memberId}
                variant={variant}
                style={{
                  display: "block",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  background: tone.bg,
                  minWidth: "110px",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 600 }}>
                  {m.displayName}
                </p>
                {busy ? (
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>…</p>
                ) : score !== null ? (
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 500, color: tone.color, lineHeight: 1 }}>
                    {score}
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", fontFamily: "var(--font-body)", fontWeight: 400 }}>/100</span>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>—</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

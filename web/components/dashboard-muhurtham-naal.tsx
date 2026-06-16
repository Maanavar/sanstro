"use client";

import { useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  fetchChartMuhurthamNaals,
  type MuhurthamNaalMatchItem,
  type MuhurthamNaalMatchContext,
} from "@/lib/muhurtham-naal";
import { Surface } from "./dashboard-ui";

const YEAR = 2026;

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  borderLt: "#E4DBC8",
  card: "#FFFFFF",
} as const;

const SCORE_COLOR = (s: number) => (s >= 75 ? "#5C7654" : s >= 55 ? "#B85A2C" : "#A8482F");

const QUALITY_LABEL: Record<string, { en: string; ta: string; color: string }> = {
  GOOD: { en: "Favourable", ta: "சாதகம்", color: "#5C7654" },
  NEUTRAL: { en: "Neutral", ta: "நடுநிலை", color: "#7A6F5E" },
  AVOID: { en: "Avoid", ta: "தவிர்க்க", color: "#A8482F" },
};

function formatDate(value: string, lang: Lang): string {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MatchCard({ m, lang }: { m: MuhurthamNaalMatchItem; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const q = QUALITY_LABEL[m.taraQuality] ?? QUALITY_LABEL.NEUTRAL;
  return (
    <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "10px", background: W.card }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <div style={{ textAlign: "center", minWidth: "44px" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: SCORE_COLOR(m.matchScore) }}>{m.matchScore}</div>
          <div style={{ fontSize: "10px", color: W.muted }}>{lang === "ta" ? "பொருத்தம்" : "match"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: W.inkMid }}>{formatDate(m.naal.date, lang)}</div>
          <div style={{ fontSize: "0.8125rem", color: "#B85A2C", fontWeight: 600 }}>
            {lang === "ta" ? `${m.naal.tamilMonth.ta} ${m.naal.tamilDay}` : `${m.naal.tamilMonth.en} ${m.naal.tamilDay}`}
            {" · "}
            {lang === "ta" ? m.naal.nakshatra.ta : m.naal.nakshatra.en}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: q.color }}>
            {lang === "ta" ? `${m.taraName.ta} · ${q.ta}` : `${m.taraName.en} · ${q.en}`}
          </span>
          {m.isChandrashtama && (
            <span style={{ fontSize: "0.68rem", color: "#A8482F", fontWeight: 600 }}>
              {lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}
            </span>
          )}
        </div>
        <span style={{ color: W.muted, fontSize: "0.75rem" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${W.borderLt}` }}>
          <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
            {m.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: "0.85rem", color: W.inkMid, marginBottom: "4px" }}>
                {lang === "ta" ? r.ta : r.en}
              </li>
            ))}
          </ul>
          {m.naal.nallaNeram.length > 0 && (
            <p style={{ fontSize: "0.8rem", color: W.muted, marginTop: "8px" }}>
              {lang === "ta" ? "நல்ல நேரம்: " : "Nalla neram: "}
              {m.naal.nallaNeram.map((w) => `${w.start}–${w.end}`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardMuhurthamNaal({ lang, chartId }: { lang: Lang; chartId: string | null }) {
  const [matches, setMatches] = useState<MuhurthamNaalMatchItem[]>([]);
  const [context, setContext] = useState<MuhurthamNaalMatchContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedOnly, setRecommendedOnly] = useState(true);

  useEffect(() => {
    if (!chartId) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchChartMuhurthamNaals(chartId, YEAR)
      .then((res) => {
        if (!active) return;
        setMatches(res.matches);
        setContext(res.context);
      })
      .catch((e) => {
        if (active) setError(readErrorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [chartId]);

  const shown = recommendedOnly ? matches.filter((m) => m.isRecommended) : matches;
  const title = lang === "ta" ? "2026 திருமண முகூர்த்த நாட்கள் — உங்கள் ஜாதகத்துக்கு" : "2026 Wedding Muhurtham Naal — matched to your chart";

  return (
    <Surface title={title}>
      <div className="surface__body">
        {!chartId && (
          <p style={{ fontSize: "0.875rem", color: W.muted, padding: "12px 0" }}>
            {lang === "ta" ? "ஜாதகம் தேர்ந்தெடுத்தால் பொருத்தம் காட்டப்படும்." : "Select a chart to see matched dates."}
          </p>
        )}

        {chartId && context && (
          <p style={{ fontSize: "0.85rem", color: W.inkMid, marginBottom: "10px" }}>
            {lang === "ta"
              ? `உங்கள் நட்சத்திரம் ${context.janmaNakshatra.ta} — 55 முகூர்த்த நாட்களில் ${context.recommendedCount} உங்களுக்கு ஏற்றவை (தாரா பலம் + சந்திராஷ்டமம் வைத்து).`
              : `Your star ${context.janmaNakshatra.en} — ${context.recommendedCount} of 55 almanac dates suit you (by Tara Bala + Chandrashtama).`}
          </p>
        )}

        {chartId && (
          <label style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "0.82rem", color: W.muted, marginBottom: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={recommendedOnly} onChange={(e) => setRecommendedOnly(e.target.checked)} />
            {lang === "ta" ? "ஏற்றவை மட்டும் காட்டு" : "Show recommended only"}
          </label>
        )}

        {loading && <p style={{ fontSize: "0.875rem", color: W.muted }}>{lang === "ta" ? "ஏற்றப்படுகிறது…" : "Loading…"}</p>}
        {error && <p style={{ fontSize: "0.875rem", color: "#A8482F" }}>{error}</p>}

        {!loading && !error && shown.map((m) => <MatchCard key={m.naal.date} m={m} lang={lang} />)}

        {!loading && !error && chartId && shown.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: W.muted, padding: "12px 0" }}>
            {lang === "ta" ? "காட்ட நாட்கள் இல்லை." : "No dates to show."}
          </p>
        )}
      </div>
    </Surface>
  );
}

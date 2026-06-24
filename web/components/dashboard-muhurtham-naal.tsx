"use client";

import { useEffect, useMemo, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  fetchChartMuhurthamNaals,
  fetchPublicMuhurthamNaals,
  type MuhurthamNaalMatchItem,
  type MuhurthamNaalMatchContext,
  type MuhurthamNaalItem,
} from "@/lib/muhurtham-naal";
import { Surface } from "./dashboard-ui";

const YEAR = 2026;

const W = {
  ink: "var(--panel-earth-dark)",
  inkMid: "var(--panel-earth)",
  muted: "var(--color-faint)",
  mutedLt: "var(--color-faint)",
  borderLt: "var(--panel-tan-light)",
  border: "var(--panel-tan)",
  card: "var(--chart-cell-default)",
  surface: "var(--panel-cream)",
  good: "var(--chart-d9-active)",
  goodBg: "#EEF5E8",
  avoid: "var(--planet-saturn)",
  avoidBg: "#F9EDEA",
  neutral: "var(--color-faint)",
  neutralBg: "var(--panel-hover)",
} as const;

const SCORE_COLOR = (s: number) => (s >= 75 ? W.good : s >= 55 ? "var(--panel-brand)" : W.avoid);

const QUALITY_META: Record<string, { label: { en: string; ta: string }; dot: string; bg: string }> = {
  GOOD: { label: { en: "Favourable", ta: "சாதகம்" }, dot: W.good, bg: W.goodBg },
  NEUTRAL: { label: { en: "Neutral", ta: "நடுநிலை" }, dot: W.neutral, bg: W.neutralBg },
  AVOID: { label: { en: "Avoid", ta: "தவிர்க்க" }, dot: W.avoid, bg: W.avoidBg },
};

const PIRAI_OPTIONS = [
  { value: "", en: "All phases", ta: "அனைத்தும்" },
  { value: "VALARPIRAI", en: "Valarpirai (waxing)", ta: "வளர்பிறை" },
  { value: "THEIPIRAI", en: "Theipirai (waning)", ta: "தேய்பிறை" },
];

const MONTH_LABELS: { value: number; en: string; ta: string }[] = [
  { value: 0, en: "All months", ta: "எல்லா மாதங்கள்" },
  { value: 1, en: "Jan", ta: "ஜன" },
  { value: 2, en: "Feb", ta: "பிப்" },
  { value: 3, en: "Mar", ta: "மார்" },
  { value: 4, en: "Apr", ta: "ஏப்" },
  { value: 5, en: "May", ta: "மே" },
  { value: 6, en: "Jun", ta: "ஜூன்" },
  { value: 7, en: "Jul", ta: "ஜூலை" },
  { value: 8, en: "Aug", ta: "ஆக" },
  { value: 9, en: "Sep", ta: "செப்" },
  { value: 10, en: "Oct", ta: "அக்" },
  { value: 11, en: "Nov", ta: "நவ்" },
  { value: 12, en: "Dec", ta: "டிச்" },
];

function formatDate(value: string, lang: Lang): string {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Merged row — panchangam info (always present) + optional chart match data
type MergedRow = {
  naal: MuhurthamNaalItem;
  match: MuhurthamNaalMatchItem | null;
};

function NaalRow({ row, lang, showMatchCol }: { row: MergedRow; lang: Lang; showMatchCol: boolean }) {
  const [open, setOpen] = useState(false);
  const { naal, match } = row;
  const q = match ? (QUALITY_META[match.taraQuality] ?? QUALITY_META.NEUTRAL) : null;
  const isChandrashtama = match?.isChandrashtama ?? false;
  const isRecommended = match?.isRecommended ?? false;

  const rowBg = isChandrashtama
    ? W.avoidBg
    : isRecommended
      ? W.goodBg
      : W.card;
  const rowBorder = isChandrashtama
    ? "rgba(168,72,47,0.3)"
    : isRecommended
      ? "rgba(92,118,84,0.3)"
      : W.borderLt;

  return (
    <div style={{ border: `1px solid ${rowBorder}`, borderRadius: "10px", marginBottom: "8px", background: rowBg, overflow: "hidden" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: showMatchCol ? "1fr auto" : "1fr", gap: "10px", padding: "12px 14px", cursor: match ? "pointer" : "default", alignItems: "center" }}
        onClick={() => match && setOpen((v) => !v)}
      >
        {/* Left: panchangam info */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,auto) minmax(0,1fr)", gap: "10px 16px", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: W.inkMid }}>
              {formatDate(naal.date, lang)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--panel-brand)", fontWeight: 600 }}>
              {lang === "ta" ? naal.weekday.ta : naal.weekday.en}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: W.inkMid, fontWeight: 600 }}>
              {lang === "ta" ? naal.tamilMonth.ta : naal.tamilMonth.en} {naal.tamilDay}
            </span>
            <span style={{ fontSize: "0.75rem", color: W.muted }}>·</span>
            <span style={{ fontSize: "0.8rem", color: W.inkMid }}>
              {lang === "ta" ? naal.nakshatra.ta : naal.nakshatra.en}
            </span>
            <span style={{ fontSize: "0.75rem", color: W.muted }}>·</span>
            <span style={{ fontSize: "0.75rem", color: W.muted }}>
              {lang === "ta" ? naal.pirai.ta : naal.pirai.en}
            </span>
            {naal.nallaNeram.length > 0 && (
              <>
                <span style={{ fontSize: "0.75rem", color: W.muted }}>·</span>
                <span style={{ fontSize: "0.72rem", color: W.good, fontWeight: 600 }}>
                  {lang === "ta" ? "நல்ல நேரம்: " : "Nalla neram: "}
                  {naal.nallaNeram.map((w) => `${w.start}–${w.end}`).join(", ")}
                </span>
              </>
            )}
            {isChandrashtama && (
              <span style={{ fontSize: "0.68rem", color: W.avoid, fontWeight: 700, padding: "1px 6px", background: W.avoidBg, borderRadius: "999px", border: "1px solid rgba(168,72,47,0.25)" }}>
                {lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}
              </span>
            )}
          </div>
        </div>

        {/* Right: chart match score */}
        {showMatchCol && match && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", minWidth: "80px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: SCORE_COLOR(match.matchScore), fontVariantNumeric: "tabular-nums" }}>
                {match.matchScore}
              </span>
              <span style={{ fontSize: "0.65rem", color: W.muted }}>/100</span>
              <span style={{ fontSize: "0.75rem", color: W.muted }}>{open ? "▲" : "▼"}</span>
            </div>
            {q && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: q.dot, padding: "1px 6px", background: q.bg, borderRadius: "999px", border: `1px solid ${q.dot}30`, whiteSpace: "nowrap" }}>
                {lang === "ta" ? q.label.ta : q.label.en}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded: reasons */}
      {open && match && match.reasons.length > 0 && (
        <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${W.borderLt}` }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: W.mutedLt }}>
            {lang === "ta" ? "பொருத்த காரணங்கள்" : "Match reasons"}
          </p>
          <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
            {match.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: "0.82rem", color: W.inkMid, marginBottom: "3px" }}>
                {lang === "ta" ? r.ta : r.en}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DashboardMuhurthamNaal({ lang, chartId }: { lang: Lang; chartId: string | null }) {
  const [allNaals, setAllNaals] = useState<MuhurthamNaalItem[]>([]);
  const [matches, setMatches] = useState<MuhurthamNaalMatchItem[]>([]);
  const [context, setContext] = useState<MuhurthamNaalMatchContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters (mirroring the public /muhurtham-naal page)
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterPirai, setFilterPirai] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const publicFetch = fetchPublicMuhurthamNaals(YEAR);
    const chartFetch = chartId ? fetchChartMuhurthamNaals(chartId, YEAR) : Promise.resolve(null);

    Promise.all([publicFetch, chartFetch])
      .then(([pub, chart]) => {
        if (!active) return;
        setAllNaals(pub.naals);
        if (chart) {
          setMatches(chart.matches);
          setContext(chart.context);
        }
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

  // Build a lookup from date → match item
  const matchByDate = useMemo(() => {
    const map = new Map<string, MuhurthamNaalMatchItem>();
    matches.forEach((m) => map.set(m.naal.date, m));
    return map;
  }, [matches]);

  // Merge + filter
  const rows = useMemo((): MergedRow[] => {
    return allNaals
      .map((naal) => ({ naal, match: matchByDate.get(naal.date) ?? null }))
      .filter(({ naal, match }) => {
        if (filterMonth !== 0) {
          const m = new Date(`${naal.date}T00:00:00`).getMonth() + 1;
          if (m !== filterMonth) return false;
        }
        if (filterPirai) {
          const piraiKey = filterPirai === "VALARPIRAI" ? "VALAR" : "THEI";
          if (naal.pirai.en.toUpperCase().indexOf(piraiKey) === -1) return false;
        }
        if (recommendedOnly && match && !match.isRecommended) return false;
        if (recommendedOnly && !match) return false;
        return true;
      });
  }, [allNaals, matchByDate, filterMonth, filterPirai, recommendedOnly]);

  const showMatchCol = chartId !== null && matches.length > 0;
  const title = lang === "ta" ? `${YEAR} திருமண முகூர்த்த நாட்கள்` : `${YEAR} Wedding Muhurtham Naal`;

  return (
    <Surface title={title}>
      <div className="surface__body">
        {/* Context bar (chart personalisation info) */}
        {chartId && context && (
          <div style={{ padding: "10px 12px", marginBottom: "12px", borderRadius: "8px", background: W.goodBg, border: "1px solid rgba(92,118,84,0.25)", fontSize: "0.85rem", color: W.inkMid }}>
            {lang === "ta"
              ? `உங்கள் நட்சத்திரம் ${context.janmaNakshatra.ta} — ${context.recommendedCount} நாட்கள் உங்களுக்கு ஏற்றவை (தாரா பலம் + சந்திராஷ்டமம் வைத்து).`
              : `Your star ${context.janmaNakshatra.en} — ${context.recommendedCount} of ${context.totalCount} dates suit you (Tara Bala + Chandrashtama).`}
          </div>
        )}

        {!chartId && (
          <p style={{ fontSize: "0.85rem", color: W.muted, marginBottom: "12px" }}>
            {lang === "ta"
              ? "ஜாதகம் தேர்ந்தெடுத்தால் ஒவ்வொரு நாளுக்கும் உங்கள் நட்சத்திர பொருத்தம் காட்டப்படும்."
              : "Select a chart to see personal star-match scores alongside each almanac date."}
          </p>
        )}

        {/* Filters row — mirrors the public /muhurtham-naal page */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.72rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {lang === "ta" ? "மாதம்" : "Month"}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              style={{ padding: "5px 8px", borderRadius: "8px", border: `1px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.82rem", fontFamily: "inherit" }}
            >
              {MONTH_LABELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {lang === "ta" ? m.ta : m.en}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.72rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {lang === "ta" ? "பிறை" : "Pirai"}
            <select
              value={filterPirai}
              onChange={(e) => setFilterPirai(e.target.value)}
              style={{ padding: "5px 8px", borderRadius: "8px", border: `1px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.82rem", fontFamily: "inherit" }}
            >
              {PIRAI_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {lang === "ta" ? p.ta : p.en}
                </option>
              ))}
            </select>
          </label>

          {showMatchCol && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: W.muted, marginLeft: "auto", cursor: "pointer" }}>
              <input type="checkbox" checked={recommendedOnly} onChange={(e) => setRecommendedOnly(e.target.checked)} />
              {lang === "ta" ? "ஏற்றவை மட்டும்" : "Recommended only"}
            </label>
          )}

          <span style={{ fontSize: "0.75rem", color: W.muted, marginLeft: showMatchCol ? "0" : "auto" }}>
            {lang === "ta" ? `${rows.length} நாட்கள்` : `${rows.length} dates`}
          </span>
        </div>

        {loading && (
          <p style={{ fontSize: "0.875rem", color: W.muted, padding: "16px 0" }}>
            {lang === "ta" ? "முகூர்த்த நாட்கள் ஏற்றப்படுகிறது…" : "Loading muhurtham dates…"}
          </p>
        )}
        {error && <p style={{ fontSize: "0.875rem", color: W.avoid }}>{error}</p>}

        {!loading && !error && rows.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: W.muted, padding: "12px 0" }}>
            {lang === "ta" ? "இந்த வடிகட்டலுக்கு நாட்கள் இல்லை." : "No dates for this filter."}
          </p>
        )}

        {!loading && !error && rows.map((row) => (
          <NaalRow key={row.naal.date} row={row} lang={lang} showMatchCol={showMatchCol} />
        ))}

        {/* Legend when chart match is active */}
        {showMatchCol && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px", padding: "10px 12px", borderRadius: "8px", background: W.surface, border: `1px solid ${W.borderLt}` }}>
            {[
              { dot: W.good, bg: W.goodBg, en: "Recommended (score ≥ 60)", ta: "சிறந்தது (மதிப்பு ≥ 60)" },
              { dot: W.avoid, bg: W.avoidBg, en: "Chandrashtama — avoid", ta: "சந்திராஷ்டமம் — தவிர்க்க" },
              { dot: W.neutral, bg: W.neutralBg, en: "Neutral / check further", ta: "நடுநிலை / மேலும் சரிபார்க்க" },
            ].map((item) => (
              <span key={item.en} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.72rem", color: W.muted }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.dot, flexShrink: 0, display: "inline-block" }} />
                {lang === "ta" ? item.ta : item.en}
              </span>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}

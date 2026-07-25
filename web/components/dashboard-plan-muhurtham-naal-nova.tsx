"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  fetchChartMuhurthamNaals,
  fetchPublicMuhurthamNaals,
  type MuhurthamNaalMatchItem,
  type MuhurthamNaalMatchContext,
  type MuhurthamNaalItem,
} from "@/lib/muhurtham-naal";
import { NovaSelect } from "./nova-select";
import { Card } from "./ui";

/**
 * Nova re-skin of dashboard-muhurtham-naal.tsx's DashboardMuhurthamNaal —
 * embedded inside Plan's "Best Dates & Muhurta" sub-tab (deferred,
 * Classic-styled, when Plan Nova first shipped — Phase 10,
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). Grepped every var(--...)
 * reference first: same reverted `W` token map as every other deferred
 * panel this pass, plus two literal hardcoded hex fallbacks (`#EEF5E8`
 * good-bg, `#F9EDEA` avoid-bg) with no CSS variable at all. Fresh
 * Nova-token rebuild, not a gap-fix. Same data/API calls (public almanac +
 * chart-personalised match), same filters, same behavior.
 */

const QUALITY_META: Record<string, { label: { en: string; ta: string }; dot: string; bg: string }> = {
  GOOD: { label: { en: "Favourable", ta: "சாதகம்" }, dot: "var(--color-high)", bg: "var(--color-high-bg)" },
  NEUTRAL: { label: { en: "Neutral", ta: "நடுநிலை" }, dot: "var(--color-faint)", bg: "var(--color-surface-soft)" },
  AVOID: { label: { en: "Avoid", ta: "தவிர்க்க" }, dot: "var(--color-low)", bg: "var(--color-low-bg)" },
};

const SCORE_COLOR = (s: number) => (s >= 75 ? "var(--color-high)" : s >= 55 ? "var(--color-mid)" : "var(--color-low)");

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
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type MergedRow = { naal: MuhurthamNaalItem; match: MuhurthamNaalMatchItem | null };

function NovaNaalRow({ row, lang, showMatchCol }: { row: MergedRow; lang: Lang; showMatchCol: boolean }) {
  const [open, setOpen] = useState(false);
  const { naal, match } = row;
  const q = match ? (QUALITY_META[match.taraQuality] ?? QUALITY_META.NEUTRAL) : null;
  const isChandrashtama = match?.isChandrashtama ?? false;
  const isRecommended = match?.isRecommended ?? false;

  const rowBg = isChandrashtama ? "var(--color-low-bg)" : isRecommended ? "var(--color-high-bg)" : "var(--color-surface)";
  const rowBorder = isChandrashtama ? "var(--color-low-border)" : isRecommended ? "var(--color-high-border)" : "var(--color-border)";

  return (
    <div style={{ border: `1px solid ${rowBorder}`, borderRadius: "var(--radius-md)", marginBottom: "8px", background: rowBg, overflow: "hidden" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: showMatchCol ? "1fr auto" : "1fr", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", cursor: match ? "pointer" : "default", alignItems: "center" }}
        onClick={() => match && setOpen((v) => !v)}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,auto) minmax(0,1fr)", gap: "var(--space-3) var(--space-4)", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text)" }}>{formatDate(naal.date, lang)}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-accent)", fontWeight: 600 }}>{lang === "ta" ? naal.weekday.ta : naal.weekday.en}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1) var(--space-3)", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-base)", color: "var(--color-text)", fontWeight: 600 }}>
              {lang === "ta" ? naal.tamilMonth.ta : naal.tamilMonth.en} {naal.tamilDay}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>·</span>
            <span style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}>{lang === "ta" ? naal.nakshatra.ta : naal.nakshatra.en}</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>·</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? naal.pirai.ta : naal.pirai.en}</span>
            {naal.nallaNeram.length > 0 && (
              <>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>·</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-high)", fontWeight: 600 }}>
                  {lang === "ta" ? "நல்ல நேரம்: " : "Nalla neram: "}
                  {naal.nallaNeram.map((w) => `${w.start}–${w.end}`).join(", ")}
                </span>
              </>
            )}
            {isChandrashtama && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-low)", fontWeight: 700, padding: "var(--space-1) var(--space-2)", background: "var(--color-low-bg)", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-low-border)" }}>
                {lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtama"}
              </span>
            )}
          </div>
        </div>

        {showMatchCol && match && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-1)", minWidth: "80px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: SCORE_COLOR(match.matchScore), fontVariantNumeric: "tabular-nums" }}>{match.matchScore}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>/100</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{open ? "▲" : "▼"}</span>
            </div>
            {q && (
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: q.dot, padding: "var(--space-1) var(--space-2)", background: q.bg, borderRadius: "var(--radius-pill)", border: `1px solid ${q.dot}30`, whiteSpace: "nowrap" }}>
                {lang === "ta" ? q.label.ta : q.label.en}
              </span>
            )}
          </div>
        )}
      </div>

      {open && match && match.reasons.length > 0 && (
        <div style={{ padding: "var(--space-3) var(--space-4) var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-faint)" }}>
            {lang === "ta" ? "பொருத்த காரணங்கள்" : "Match reasons"}
          </p>
          <ul style={{ margin: 0, paddingLeft: "var(--space-4)" }}>
            {match.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: "var(--text-base)", color: "var(--color-text)", marginBottom: "3px" }}>{lang === "ta" ? r.ta : r.en}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NovaMuhurthamNaal({ lang, chartId }: { lang: Lang; chartId: string | null }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [allNaals, setAllNaals] = useState<MuhurthamNaalItem[]>([]);
  const [matches, setMatches] = useState<MuhurthamNaalMatchItem[]>([]);
  const [context, setContext] = useState<MuhurthamNaalMatchContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterMonth, setFilterMonth] = useState(0);
  const [filterPirai, setFilterPirai] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const publicFetch = fetchPublicMuhurthamNaals(year);
    const chartFetch = chartId ? fetchChartMuhurthamNaals(chartId, year) : Promise.resolve(null);

    Promise.all([publicFetch, chartFetch])
      .then(([pub, chart]) => {
        if (!active) return;
        setAllNaals(pub.naals);
        if (chart) {
          setMatches(chart.matches);
          setContext(chart.context);
        }
      })
      .catch((e) => { if (active) setError(readErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [chartId, year]);

  const matchByDate = useMemo(() => {
    const map = new Map<string, MuhurthamNaalMatchItem>();
    matches.forEach((m) => map.set(m.naal.date, m));
    return map;
  }, [matches]);

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
  const title = lang === "ta" ? `${year} திருமண முகூர்த்த நாட்கள்` : `${year} Wedding Muhurtham Naal`;

  return (
    <Card style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "12px" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>{title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            aria-label={lang === "ta" ? "முந்தைய ஆண்டு" : "Previous year"}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", borderRadius: "var(--radius-sm)", width: "24px", height: "24px", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}
          >
            <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text)", minWidth: "38px", textAlign: "center" }}>{year}</span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            aria-label={lang === "ta" ? "அடுத்த ஆண்டு" : "Next year"}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", borderRadius: "var(--radius-sm)", width: "24px", height: "24px", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}
          >
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {chartId && context && (
        <Card variant="high" compact style={{ marginBottom: "12px", fontSize: "var(--text-base)", color: "var(--color-text)" }}>
          {lang === "ta"
            ? `உங்கள் நட்சத்திரம் ${context.janmaNakshatra.ta} — ${context.recommendedCount} நாட்கள் உங்களுக்கு ஏற்றவை (தாரா பலம் + சந்திராஷ்டமம் வைத்து).`
            : `Your star ${context.janmaNakshatra.en} — ${context.recommendedCount} of ${context.totalCount} dates suit you (Tara Bala + Chandrashtama).`}
        </Card>
      )}

      {!chartId && (
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", marginBottom: "12px" }}>
          {lang === "ta"
            ? "ஜாதகம் தேர்ந்தெடுத்தால் ஒவ்வொரு நாளுக்கும் உங்கள் நட்சத்திர பொருத்தம் காட்டப்படும்."
            : "Select a chart to see personal star-match scores alongside each almanac date."}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "14px", alignItems: "center" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {lang === "ta" ? "மாதம்" : "Month"}
          <NovaSelect
            value={String(filterMonth)}
            onChange={(v) => setFilterMonth(Number(v))}
            ariaLabel={lang === "ta" ? "மாதம்" : "Month"}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--text-base)" }}
            options={MONTH_LABELS.map((m) => ({ value: String(m.value), label: lang === "ta" ? m.ta : m.en }))}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {lang === "ta" ? "பிறை" : "Pirai"}
          <NovaSelect
            value={filterPirai}
            onChange={setFilterPirai}
            ariaLabel={lang === "ta" ? "பிறை" : "Pirai"}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--text-base)" }}
            options={PIRAI_OPTIONS.map((p) => ({ value: p.value, label: lang === "ta" ? p.ta : p.en }))}
          />
        </label>

        {showMatchCol && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-muted)", marginLeft: "auto", cursor: "pointer" }}>
            <input type="checkbox" checked={recommendedOnly} onChange={(e) => setRecommendedOnly(e.target.checked)} />
            {lang === "ta" ? "ஏற்றவை மட்டும்" : "Recommended only"}
          </label>
        )}

        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", marginLeft: showMatchCol ? "0" : "auto" }}>
          {lang === "ta" ? `${rows.length} நாட்கள்` : `${rows.length} dates`}
        </span>
      </div>

      {loading && <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", padding: "var(--space-4) 0" }}>{lang === "ta" ? "முகூர்த்த நாட்கள் ஏற்றப்படுகிறது…" : "Loading muhurtham dates…"}</p>}
      {error && <p style={{ fontSize: "var(--text-base)", color: "var(--color-low)" }}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", padding: "var(--space-3) 0" }}>
          {lang === "ta" ? "இந்த வடிகட்டலுக்கு நாட்கள் இல்லை." : "No dates for this filter."}
        </p>
      )}

      {!loading && !error && rows.map((row) => <NovaNaalRow key={row.naal.date} row={row} lang={lang} showMatchCol={showMatchCol} />)}

      {showMatchCol && !loading && (
        <Card variant="soft" compact style={{ flexDirection: "row", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "14px" }}>
          {[
            { dot: "var(--color-high)", en: "Recommended (score ≥ 60)", ta: "சிறந்தது (மதிப்பு ≥ 60)" },
            { dot: "var(--color-low)", en: "Chandrashtama — avoid", ta: "சந்திராஷ்டமம் — தவிர்க்க" },
            { dot: "var(--color-faint)", en: "Neutral / check further", ta: "நடுநிலை / மேலும் சரிபார்க்க" },
          ].map((item) => (
            <span key={item.en} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "var(--radius-pill)", background: item.dot, flexShrink: 0, display: "inline-block" }} />
              {lang === "ta" ? item.ta : item.en}
            </span>
          ))}
        </Card>
      )}
    </Card>
  );
}

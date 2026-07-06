"use client";

import { useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, MuhurtaSlot, MuhurtaResponseData } from "@/lib/types";
import { formatClockLabel, formatDateLabel, todayIso, addDays } from "@/lib/format";

/**
 * Nova re-skin of dashboard-muhurta-picker.tsx's DashboardMuhurtaPicker —
 * embedded inside Plan's "Best Dates & Muhurta" sub-tab (deferred,
 * Classic-styled, when Plan Nova first shipped — Phase 10,
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). Grepped every var(--...)
 * reference first: its own `W` token map is the same reverted 5-token set
 * as every other deferred panel this pass — fresh Nova-token rebuild, not a
 * gap-fix. Same data/API call, same behavior (including the
 * scroll-into-view sync when Step 1's "Get Muhurta →" click prefills a
 * date), only the JSX/styling is rebuilt.
 */

const ACTIVITIES: Array<{ id: string; en: string; ta: string }> = [
  { id: "JOB_START", en: "Job start / New role", ta: "வேலை தொடக்கம் / புதிய பதவி" },
  { id: "EXAM", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { id: "TRAVEL", en: "Travel / Journey start", ta: "பயண தொடக்கம்" },
  { id: "INVESTMENT", en: "Investment / Financial agreement", ta: "முதலீடு / நிதி ஒப்பந்தம்" },
  { id: "MEDICAL", en: "Medical procedure / Surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { id: "PURCHASE", en: "Property or major purchase", ta: "சொத்து / பெரிய கொள்முதல்" },
  { id: "SPIRITUAL", en: "Grihapravesh / Religious event", ta: "இல்லப்பிரவேசம் / மத நிகழ்வு" },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: "10px",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface-soft)",
  color: "var(--color-text)",
  fontSize: "14px",
  fontFamily: "inherit",
};

const SCORE_COLOR = (score: number) => (score >= 75 ? "var(--color-high)" : score >= 55 ? "var(--color-mid)" : "var(--color-faint)");

function formatMuhurtaDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function NovaMuhurtaCard({ slot, lang }: { slot: MuhurtaSlot; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = SCORE_COLOR(slot.score);

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", background: "var(--color-surface)" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", flexWrap: "wrap" }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: scoreColor }}>{Math.min(100, Math.round(slot.score))}</div>
          <div style={{ fontSize: "10px", color: "var(--color-faint)" }}>{t("muhurta_score", lang)}</div>
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>{formatMuhurtaDate(slot.date, lang)}</div>
          {slot.tamilDate && (
            <div style={{ fontSize: "13px", color: "var(--color-accent)", fontWeight: 600 }}>{lang === "ta" ? slot.tamilDate.ta : slot.tamilDate.en}</div>
          )}
          <div style={{ fontSize: "14px", color: "var(--color-muted)" }}>{formatClockLabel(slot.timeStart)} - {formatClockLabel(slot.timeEnd)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", fontSize: "14px", color: "var(--color-muted)", maxWidth: "200px", textAlign: "right" }}>
          <span>{lang === "ta" ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</span>
          <span style={{ color: "var(--color-faint)", fontSize: "12px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "தசை ஆதரவு" : "Dasha support"}
            </span>
            <p style={{ fontSize: "14px", marginTop: "2px", color: "var(--color-text)" }}>{lang === "ta" ? slot.dashaSupport.ta : slot.dashaSupport.en}</p>
          </div>

          {slot.cautions.length > 0 && (
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--color-mid)", letterSpacing: "0.05em" }}>
                {t("muhurta_cautions", lang)}
              </span>
              <ul style={{ margin: "4px 0 0 0", padding: "0 0 0 16px" }}>
                {slot.cautions.map((c, i) => (
                  <li key={i} style={{ fontSize: "14px", color: "var(--color-muted)", marginBottom: "2px" }}>{lang === "ta" ? c.ta : c.en}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  lang: Lang;
  chartId: string | null;
  initialActivity?: string;
  initialDateFrom?: string;
}

export function NovaMuhurtaPicker({ lang, chartId, initialActivity, initialDateFrom }: Props) {
  const today = todayIso();
  const [activity, setActivity] = useState(initialActivity ?? "");
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? today);
  const [dateTo, setDateTo] = useState(addDays(initialDateFrom ?? today, 30));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MuhurtaResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialActivity) setActivity(initialActivity);
  }, [initialActivity]);
  useEffect(() => {
    if (initialDateFrom) {
      setDateFrom(initialDateFrom);
      setDateTo(initialDateFrom);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialDateFrom]);

  async function handleSearch() {
    if (!chartId || !activity) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ activity, dateFrom, dateTo });
      const json = await apiFetchJson<ApiEnvelope<MuhurtaResponseData>>(`/api/v1/charts/${chartId}/muhurta?${params}`);
      setResult(json.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || (lang === "ta" ? "நெட்வொர்க் பிழை - மீண்டும் முயற்சிக்கவும்." : "Network error - please try again."));
    } finally {
      setLoading(false);
    }
  }

  const selectedActivity = ACTIVITIES.find((a) => a.id === activity);

  return (
    <div ref={rootRef} style={{ padding: "16px 18px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)", fontFamily: "var(--font-body)" }}>
      <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-accent)" }}>{t("muhurta_title", lang)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
            {t("muhurta_activity", lang)}
          </label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} style={fieldStyle}>
            <option value="">{lang === "ta" ? "-- பயன்பாடு தேர்ந்தெடுக்கவும் --" : "-- Select an activity --"}</option>
            {ACTIVITIES.map((a) => (
              <option key={a.id} value={a.id}>{lang === "ta" ? a.ta : a.en}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 130px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
            {t("muhurta_date_from", lang)}
          </label>
          <input type="date" value={dateFrom} min={today} onChange={(e) => setDateFrom(e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ flex: "1 1 130px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
            {t("muhurta_date_to", lang)}
          </label>
          <input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} style={fieldStyle} />
        </div>

        <button
          type="button"
          disabled={!chartId || !activity || loading}
          onClick={handleSearch}
          style={{
            flex: "0 0 auto",
            padding: "8px 20px",
            borderRadius: "10px",
            border: "1px solid var(--color-accent)",
            background: !chartId || !activity || loading ? "var(--color-surface-soft)" : "var(--color-accent)",
            color: !chartId || !activity || loading ? "var(--color-faint)" : "var(--color-on-accent)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: !chartId || !activity || loading ? "not-allowed" : "pointer",
            alignSelf: "flex-end",
            fontFamily: "inherit",
          }}
        >
          {loading ? t("muhurta_searching", lang) : t("muhurta_search", lang)}
        </button>
      </div>

      {!result && !loading && !error && <p style={{ fontSize: "14px", color: "var(--color-muted)", textAlign: "center", padding: "16px 0" }}>{t("muhurta_empty", lang)}</p>}

      {error && <p style={{ fontSize: "14px", color: "var(--color-low)", padding: "8px 0" }}>{error}</p>}

      {result && result.slots.length > 0 && (
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--color-text)" }}>
            {t("muhurta_results", lang)} {selectedActivity && <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>· {lang === "ta" ? selectedActivity.ta : selectedActivity.en}</span>}
          </p>
          {result.slots.map((slot, i) => <NovaMuhurtaCard key={`${slot.date}-${i}`} slot={slot} lang={lang} />)}
        </div>
      )}

      {result && result.slots.length === 0 && (
        <p style={{ fontSize: "14px", color: "var(--color-muted)", textAlign: "center", padding: "16px 0" }}>
          {lang === "ta" ? "இந்த வரம்பில் சுப நேரம் இல்லை. தேதி வரம்பை விரிவாக்கவும்." : "No auspicious slots found in this range. Try a wider date range."}
        </p>
      )}
    </div>
  );
}

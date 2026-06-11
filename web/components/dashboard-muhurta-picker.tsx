"use client";

import { useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, MuhurtaSlot, MuhurtaResponseData } from "@/lib/types";
import { formatClockLabel, formatDateLabel, todayIso, addDays } from "@/lib/format";
import { Surface } from "./dashboard-ui";

const ACTIVITIES: Array<{ id: string; en: string; ta: string }> = [
  { id: "JOB_START",   en: "Job start / New role",             ta: "வேலை தொடக்கம் / புதிய பதவி" },
  { id: "MARRIAGE",    en: "Marriage ceremony",                 ta: "திருமண நிகழ்ச்சி" },
  { id: "EXAM",        en: "Exam / Course start",              ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { id: "TRAVEL",      en: "Travel / Journey start",           ta: "பயண தொடக்கம்" },
  { id: "INVESTMENT",  en: "Investment / Financial agreement",  ta: "முதலீடு / நிதி ஒப்பந்தம்" },
  { id: "MEDICAL",     en: "Medical procedure / Surgery",       ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { id: "PURCHASE",    en: "Property or major purchase",        ta: "சொத்து / பெரிய கொள்முதல்" },
  { id: "SPIRITUAL",   en: "Grihapravesh / Religious event",    ta: "இல்லப்பிரவேசம் / மத நிகழ்வு" },
];

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
} as const;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: "10px",
  border: `1.5px solid ${W.borderLt}`,
  background: W.card,
  color: W.inkMid,
  fontSize: "0.875rem",
  fontFamily: "inherit",
};

const SCORE_COLOR = (score: number) => (score >= 75 ? "#5C7654" : score >= 55 ? "#B85A2C" : "#7A6F5E");

// Weekday + full date, e.g. "Mon, 8 Jun 2026" / "திங்கள், 8 ஜூன் 2026".
function formatMuhurtaDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DashboardMuhurtaPickerProps {
  lang: Lang;
  chartId: string | null;
  initialActivity?: string;
  initialDateFrom?: string;
}

function MuhurtaCard({ slot, lang }: { slot: MuhurtaSlot; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = SCORE_COLOR(slot.score);

  return (
    <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", background: W.card }}>
      <div className="cd-ranked-card" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div className="cd-ranked-card__score" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: scoreColor }}>{Math.min(100, Math.round(slot.score))}</div>
          <div style={{ fontSize: "10px", color: W.muted }}>{t("muhurta_score", lang)}</div>
        </div>
        <div className="cd-ranked-card__body">
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: W.inkMid }}>{formatMuhurtaDate(slot.date, lang)}</div>
          {slot.tamilDate && (
            <div style={{ fontSize: "0.8125rem", color: "#B85A2C", fontWeight: 600 }}>
              {lang === "ta" ? slot.tamilDate.ta : slot.tamilDate.en}
            </div>
          )}
          <div style={{ fontSize: "0.875rem", color: W.muted }}>{formatClockLabel(slot.timeStart)} - {formatClockLabel(slot.timeEnd)}</div>
        </div>
        <div className="cd-ranked-card__cta" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", fontSize: "0.875rem", color: W.muted, maxWidth: "200px", textAlign: "right" }}>
          <span>{lang === "ta" ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</span>
          <span style={{ color: W.muted, fontSize: "0.75rem", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${W.borderLt}` }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: W.mutedLt, letterSpacing: "0.05em" }}>
              {lang === "ta" ? "தசை ஆதரவு" : "Dasha support"}
            </span>
            <p style={{ fontSize: "0.875rem", marginTop: "2px", color: W.inkMid }}>{lang === "ta" ? slot.dashaSupport.ta : slot.dashaSupport.en}</p>
          </div>

          {slot.cautions.length > 0 && (
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#A8482F", letterSpacing: "0.05em" }}>
                {t("muhurta_cautions", lang)}
              </span>
              <ul style={{ margin: "4px 0 0 0", padding: "0 0 0 16px" }}>
                {slot.cautions.map((c, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: W.muted, marginBottom: "2px" }}>
                    {lang === "ta" ? c.ta : c.en}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardMuhurtaPicker({ lang, chartId, initialActivity, initialDateFrom }: DashboardMuhurtaPickerProps) {
  const today = todayIso();
  const [activity, setActivity] = useState(initialActivity ?? "");
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? today);
  const [dateTo, setDateTo] = useState(addDays(initialDateFrom ?? today, 30));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MuhurtaResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Sync when parent injects a pre-selected date (Best Dates click-through)
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
    <div ref={rootRef}>
    <Surface title={t("muhurta_title", lang)}>
      <div className="surface__body">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px", marginBottom: "14px", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
              {t("muhurta_activity", lang)}
            </label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} style={fieldStyle}>
              <option value="">{lang === "ta" ? "-- பயன்பாடு தேர்ந்தெடுக்கவும் --" : "-- Select an activity --"}</option>
              {ACTIVITIES.map((a) => (
                <option key={a.id} value={a.id}>
                  {lang === "ta" ? a.ta : a.en}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: "1 1 130px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
              {t("muhurta_date_from", lang)}
            </label>
            <input type="date" value={dateFrom} min={today} onChange={(e) => setDateFrom(e.target.value)} style={fieldStyle} />
          </div>

          <div style={{ flex: "1 1 130px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
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
              border: `1px solid ${W.ink}`,
              background: !chartId || !activity || loading ? W.borderLt : W.ink,
              color: !chartId || !activity || loading ? W.mutedLt : W.surfaceMd,
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: !chartId || !activity || loading ? "not-allowed" : "pointer",
              alignSelf: "flex-end",
            }}
          >
            {loading ? t("muhurta_searching", lang) : t("muhurta_search", lang)}
          </button>
        </div>

        {!result && !loading && !error && <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>{t("muhurta_empty", lang)}</p>}

        {error && <p style={{ fontSize: "0.875rem", color: "#A8482F", padding: "8px 0" }}>{error}</p>}

        {result && result.slots.length > 0 && (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "10px", color: W.inkMid }}>
              {t("muhurta_results", lang)} {selectedActivity && <span style={{ color: W.muted, fontWeight: 400 }}>· {lang === "ta" ? selectedActivity.ta : selectedActivity.en}</span>}
            </p>
            {result.slots.map((slot, i) => (
              <MuhurtaCard key={`${slot.date}-${i}`} slot={slot} lang={lang} />
            ))}
          </div>
        )}

        {result && result.slots.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>
            {lang === "ta" ? "இந்த வரம்பில் சுப நேரம் இல்லை. தேதி வரம்பை விரிவாக்கவும்." : "No auspicious slots found in this range. Try a wider date range."}
          </p>
        )}
      </div>
    </Surface>
    </div>
  );
}

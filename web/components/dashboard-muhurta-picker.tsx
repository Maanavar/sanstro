"use client";

import { useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, MuhurtaSlot, MuhurtaResponseData } from "@/lib/types";
import { formatClockLabel, formatDateLabel, todayIso, addDays } from "@/lib/format";
import { Surface } from "./dashboard-ui";

const ACTIVITIES: Array<{ id: string; en: string; ta: string }> = [
  { id: "JOB_START", en: "Job start / New role", ta: "???? ???????? / ????? ????????" },
  { id: "MARRIAGE", en: "Marriage ceremony", ta: "?????? ???????" },
  { id: "EXAM", en: "Exam / Course start", ta: "?????? / ??????? ????????" },
  { id: "TRAVEL", en: "Travel / Journey start", ta: "??? ????????" },
  { id: "INVESTMENT", en: "Investment / Financial agreement", ta: "??????? / ???? ?????????" },
  { id: "MEDICAL", en: "Medical procedure / Surgery", ta: "???????? ???????? / ?????" },
  { id: "PURCHASE", en: "Property or major purchase", ta: "?????? / ????? ???????" },
  { id: "SPIRITUAL", en: "Grihapravesh / Religious event", ta: "?????????????? / ?????????" },
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

interface DashboardMuhurtaPickerProps {
  lang: Lang;
  chartId: string | null;
}

function MuhurtaCard({ slot, lang }: { slot: MuhurtaSlot; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = SCORE_COLOR(slot.score);

  return (
    <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", background: W.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ textAlign: "center", minWidth: "48px" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: scoreColor }}>{Math.round(slot.score)}</div>
          <div style={{ fontSize: "10px", color: W.muted }}>{t("muhurta_score", lang)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: W.inkMid }}>{formatDateLabel(slot.date)}</div>
          <div style={{ fontSize: "0.875rem", color: W.muted }}>{formatClockLabel(slot.timeStart)} - {formatClockLabel(slot.timeEnd)}</div>
        </div>
        <div style={{ fontSize: "0.875rem", color: W.muted, maxWidth: "160px", textAlign: "right" }}>{lang === "ta" ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</div>
        <span style={{ color: W.muted, fontSize: "0.75rem" }}>{expanded ? "?" : "?"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${W.borderLt}` }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: W.mutedLt, letterSpacing: "0.05em" }}>
              {lang === "ta" ? "??? ?????" : "Dasha support"}
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

export function DashboardMuhurtaPicker({ lang, chartId }: DashboardMuhurtaPickerProps) {
  const today = todayIso();
  const [activity, setActivity] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(addDays(today, 30));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MuhurtaResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(msg || (lang === "ta" ? "??????? ???? � ???????? ????????." : "Network error � please try again."));
    } finally {
      setLoading(false);
    }
  }

  const selectedActivity = ACTIVITIES.find((a) => a.id === activity);

  return (
    <Surface title={t("muhurta_title", lang)}>
      <div className="surface__body">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px", marginBottom: "14px", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
              {t("muhurta_activity", lang)}
            </label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} style={fieldStyle}>
              <option value="">{lang === "ta" ? "� ?????? ????????? �" : "� Select �"}</option>
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
              {t("muhurta_results", lang)} {selectedActivity && <span style={{ color: W.muted, fontWeight: 400 }}>� {lang === "ta" ? selectedActivity.ta : selectedActivity.en}</span>}
            </p>
            {result.slots.map((slot, i) => (
              <MuhurtaCard key={`${slot.date}-${i}`} slot={slot} lang={lang} />
            ))}
          </div>
        )}

        {result && result.slots.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>
            {lang === "ta" ? "??????? ???????? ??? ????? ?????????????." : "No auspicious slots found in this range. Try a wider date range."}
          </p>
        )}
      </div>
    </Surface>
  );
}

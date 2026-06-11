"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData } from "@/lib/types";

import { Chip, Surface } from "./dashboard-ui";

const ACTIVITY_OPTIONS: Array<{ value: string; en: string; ta: string }> = [
  { value: "job_change", en: "Job change or new role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
  { value: "business_start", en: "Start a new business", ta: "புதிய தொழில் தொடங்குதல்" },
  { value: "marriage", en: "Marriage ceremony", ta: "திருமண நிகழ்வு" },
  { value: "education", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { value: "property", en: "Property purchase / registration", ta: "சொத்து வாங்கல் / பதிவு" },
  { value: "money", en: "Investment or major financial decision", ta: "முதலீடு / பெரிய பண முடிவு" },
  { value: "travel", en: "Travel abroad or long journey", ta: "வெளிநாடு / நீண்ட பயணம்" },
  { value: "health", en: "Medical procedure or surgery", ta: "மருத்துவ சிகிச்சை / அறுவைச் சிகிச்சை" },
  { value: "spiritual", en: "Grihapravesh or religious event", ta: "புதுமனை புகு விழா / ஆன்மிக நிகழ்வு" },
  { value: "child", en: "Child birth or naming ceremony", ta: "குழந்தை பிறப்பு / பெயர்சூட்டு" },
  { value: "other", en: "General auspicious day", ta: "பொது நல்ல நாள்" },
];

const fieldStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid #D4C8AE",
  background: "#FFFFFF",
  color: "#3D352B",
  fontSize: "0.875rem",
  padding: "var(--space-2) var(--space-2_5)",
  fontFamily: "inherit",
};

type DashboardActivityTimingCardProps = {
  chartId: string;
  lang: Lang;
  selectedDate: string;
  onDateChange?: (date: string) => void;
};

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatShortDate(value: string, lang: Lang) {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(
      lang === "ta" ? "ta-IN" : "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return value;
  }
}

function formatWeekday(value: string, lang: Lang) {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(
      lang === "ta" ? "ta-IN" : "en-IN",
      { weekday: "short" },
    );
  } catch {
    return "";
  }
}

function alignmentTone(alignment: string): "success" | "warning" | "neutral" {
  if (alignment === "SUPPORTS") return "success";
  if (alignment === "CAUTION") return "warning";
  return "neutral";
}

export function DashboardActivityTimingCard({
  chartId,
  lang,
  selectedDate,
  onDateChange,
}: DashboardActivityTimingCardProps) {
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => selectedDate.slice(0, 7) || currentMonthIso());
  const [result, setResult] = useState<ActivityTimingData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextMonth = selectedDate.slice(0, 7);
    if (nextMonth) {
      setActivityMonth(nextMonth);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!chartId || !activityMonth) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setBusy(true);
    setError(null);

    void apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
      `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
    )
      .then((response) => {
        if (!cancelled) {
          setResult(response.data ?? null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setResult(null);
          setError(readErrorMessage(fetchError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activityMonth, activityType, chartId]);

  return (
    <Surface title={t("activity_timing_label", lang)}>
      <div className="surface__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p className="surface__text" style={{ margin: 0 }}>
          {lang === "ta"
            ? "இந்த மாதத்தில் உங்கள் செயல் தொடக்கத்திற்கு ஏற்ற நாட்களை உடனே பார்க்கலாம். ஒரு தேதியைத் தேர்வு செய்தால் Personal பகுதி அந்த நாளைத் திறக்கும்."
            : "See the strongest dates for your chosen activity this month. Picking a date switches the Personal view to that day."}
        </p>

        <div className="cd-responsive-row" style={{ gap: "var(--space-2_5)", alignItems: "flex-end" }}>
          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>
              {t("activity_label", lang)}
            </span>
            <select
              style={{ ...fieldStyle, minWidth: "240px" }}
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {lang === "ta" ? option.ta : option.en}
                </option>
              ))}
            </select>
          </div>

          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>
              {t("activity_month_label", lang)}
            </span>
            <input
              style={{ ...fieldStyle, minWidth: "140px" }}
              type="month"
              value={activityMonth}
              onChange={(event) => setActivityMonth(event.target.value)}
            />
          </div>

          <div style={{ minWidth: "140px" }}>
            <Chip tone={busy ? "accent" : "neutral"}>
              {busy ? t("btn_finding", lang) : `${result?.topDates.length ?? 0} ${lang === "ta" ? "நாட்கள்" : "dates"}`}
            </Chip>
          </div>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#A8482F" }}>
            {error}
          </p>
        )}

        {!busy && result && result.topDates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {result.topDates.slice(0, 3).map((item, index) => {
              const isSelected = selectedDate === item.dateLocal;
              const weekday = formatWeekday(item.dateLocal, lang);
              const content = (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>
                      {index + 1}.
                    </span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1A1612" }}>
                      {formatShortDate(item.dateLocal, lang)}
                    </span>
                    {weekday && (
                      <span style={{ fontSize: "0.75rem", color: "#7A6F5E" }}>
                        {weekday}
                      </span>
                    )}
                    <Chip tone={alignmentTone(item.alignment)}>
                      {item.alignment}
                    </Chip>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5C7654" }}>
                      {item.score}/100
                    </span>
                    {isSelected && (
                      <Chip tone="accent">
                        {lang === "ta" ? "தற்போது பார்க்கப்படுகிறது" : "Viewing"}
                      </Chip>
                    )}
                  </div>
                  <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.8125rem", color: "#3D352B", lineHeight: 1.5 }}>
                    {lang === "ta" ? item.reasonTa : item.reasonEn}
                  </p>
                </>
              );

              if (!onDateChange) {
                return (
                  <div
                    key={item.dateLocal}
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${isSelected ? "rgba(92,118,84,0.45)" : "#E4DBC8"}`,
                      background: isSelected ? "#EEF6EA" : "#FFFFFF",
                    }}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={item.dateLocal}
                  type="button"
                  onClick={() => onDateChange(item.dateLocal)}
                  style={{
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${isSelected ? "rgba(92,118,84,0.45)" : "#E4DBC8"}`,
                    background: isSelected ? "#EEF6EA" : "#FFFFFF",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}

        {!busy && !error && result && result.topDates.length === 0 && (
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#7A6F5E" }}>
            {lang === "ta"
              ? "இந்த மாதத்திற்கு பொருத்தமான தேதிகள் கிடைக்கவில்லை."
              : "No matching dates were found for this month."}
          </p>
        )}
      </div>
    </Surface>
  );
}

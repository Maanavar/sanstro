"use client";

import { useEffect, useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { getChipsForMode } from "@/lib/ask-vinaadi-chips";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData, LifeMode } from "@/lib/types";

/**
 * Nova section 5 — "Ask + decide". Two halves:
 *  - Ask Vinaadi teaser: a compact preview (real quota + real suggested
 *    questions) that opens the existing FAB chat rather than duplicating it
 *    (resolution recorded in docs/DASHBOARD_UI_REVAMP_PLAN.md §6/§7).
 *  - Decide grid: today's real alignment for 4 activities, via the
 *    additive `dateResult` field on /api/v1/activity-timing.
 */

const DECIDE_ACTIVITIES: Array<{ activity: string; labelEn: string; labelTa: string }> = [
  { activity: "travel", labelEn: "Travel", labelTa: "பயணம்" },
  { activity: "property", labelEn: "Signing", labelTa: "ஒப்பந்தம் கையெழுத்து" },
  { activity: "money", labelEn: "Buy gold", labelTa: "தங்கம் வாங்குதல்" },
  { activity: "job_change", labelEn: "New job", labelTa: "புதிய வேலை" },
];

function alignmentDisplay(alignment: string, lang: Lang): { icon: string; color: string; bg: string; border: string; text: string } {
  if (alignment === "SUPPORTS") {
    return { icon: "✓", color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)", text: lang === "ta" ? "சாதகமானது" : "Favourable" };
  }
  if (alignment === "CAUTION") {
    return { icon: "✕", color: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)", text: lang === "ta" ? "எச்சரிக்கை" : "Use caution" };
  }
  return { icon: "~", color: "var(--color-mid)", bg: "var(--color-mid-bg)", border: "var(--color-mid-border)", text: lang === "ta" ? "வழக்கமானது" : "Routine" };
}

function DecideGrid({ lang, chartId, selectedDate }: { lang: Lang; chartId: string; selectedDate: string }) {
  const [results, setResults] = useState<Record<string, ActivityTimingData | null>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!chartId || !selectedDate) return;
    const controller = new AbortController();
    setBusy(true);
    const month = selectedDate.slice(0, 7);

    Promise.all(
      DECIDE_ACTIVITIES.map((a) =>
        apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
          `/api/v1/activity-timing${toQuery({ chartId, activity: a.activity, month, asOf: selectedDate })}`,
          { signal: controller.signal },
        )
          .then((res) => [a.activity, res.data ?? null] as const)
          .catch(() => [a.activity, null] as const),
      ),
    ).then((entries) => {
      if (controller.signal.aborted) return;
      setResults(Object.fromEntries(entries));
      setBusy(false);
    });

    return () => controller.abort();
  }, [chartId, selectedDate]);

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "13px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
          {lang === "ta" ? "இன்று இதற்கு ஏற்றதா…?" : "Is today right for…?"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
        {DECIDE_ACTIVITIES.map((a) => {
          const dateResult = results[a.activity]?.dateResult ?? null;
          const display = dateResult ? alignmentDisplay(dateResult.alignment, lang) : null;
          return (
            <div
              key={a.activity}
              title={dateResult ? (lang === "ta" ? dateResult.reasonTa : dateResult.reasonEn) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: display?.bg ?? "rgba(243,236,221,0.05)",
                border: `1px solid ${display?.border ?? "var(--color-border)"}`,
                borderRadius: "10px", padding: "11px 13px",
              }}
            >
              <span style={{
                flex: "none", width: "24px", height: "24px", borderRadius: "50%",
                background: display ? `color-mix(in srgb, ${display.color} 24%, transparent)` : "rgba(243,236,221,0.1)",
                display: "grid", placeItems: "center", fontSize: "13px",
                color: display?.color ?? "var(--color-faint)",
              }}>
                {busy ? "…" : (display?.icon ?? "?")}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-strong)" }}>{lang === "ta" ? a.labelTa : a.labelEn}</div>
                <div style={{ fontSize: "11px", color: display?.color ?? "var(--color-faint)" }}>
                  {busy ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Checking…") : (display?.text ?? (lang === "ta" ? "தரவு இல்லை" : "No data"))}
                </div>
                {!busy && dateResult && (
                  <div style={{
                    fontSize: "10.5px", color: "var(--color-faint)", lineHeight: 1.4, marginTop: "3px",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {lang === "ta" ? dateResult.reasonTa : dateResult.reasonEn}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5, background: "rgba(212,175,95,0.06)", borderRadius: "8px", padding: "9px 12px", marginTop: "auto" }}>
        {lang === "ta"
          ? "ஒவ்வொரு செயலும் உங்கள் இன்றைய பஞ்சாங்கத்திற்கு எதிராக மதிப்பிடப்படுகிறது."
          : "Each activity is scored against today's panchangam for your chart."}
      </div>
    </div>
  );
}

function AskVinaadiTeaser({
  lang,
  activeLifeMode,
  onOpenAskVinaadi,
}: {
  lang: Lang;
  activeLifeMode?: LifeMode;
  onOpenAskVinaadi: () => void;
}) {
  const [chipsRemaining, setChipsRemaining] = useState<number | null>(null);

  useEffect(() => {
    apiFetchJson<{ chipsRemaining: number | null; isPremium: boolean; dailyLimit: number }>("/api/v1/ask-vinaadi/daily-status")
      .then((s) => setChipsRemaining(s.isPremium ? null : s.chipsRemaining))
      .catch(() => {});
  }, []);

  const chips = getChipsForMode(activeLifeMode ?? "BALANCED");

  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(167,139,201,0.14), var(--color-surface) 60%)",
      border: "1px solid var(--color-accent-secondary-muted)", borderRadius: "var(--radius-lg)",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: "13px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary)", display: "grid", placeItems: "center", fontSize: "15px", color: "var(--color-accent-secondary)" }}>✦</span>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 600, color: "var(--color-accent-secondary)", lineHeight: 1 }}>
            {lang === "ta" ? "வினாடி கேளுங்கள்" : "Ask Vinaadi"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-faint)" }}>
            {lang === "ta" ? "உங்கள் ஜாதகத்திலிருந்து பதில்கள்" : "answers read from your chart"}
            {chipsRemaining !== null && (
              <> · <span style={{ color: "var(--color-high)" }}>{lang === "ta" ? `இன்று ${chipsRemaining} இலவசம்` : `${chipsRemaining} free today`}</span></>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {chips.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={onOpenAskVinaadi}
            style={{
              display: "flex", alignItems: "center", gap: "10px", textAlign: "left",
              background: "rgba(243,236,221,0.05)", border: "1px solid var(--color-accent-secondary-muted)",
              borderRadius: "10px", padding: "11px 13px", fontSize: "13px", color: "var(--color-text)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span style={{ color: "var(--color-accent-secondary)" }}>›</span>
            {lang === "ta" ? c.ta : c.en}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenAskVinaadi}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary)",
          borderRadius: "999px", padding: "10px 16px", marginTop: "auto", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", fontSize: "13px", color: "var(--color-faint)" }}>
          {lang === "ta" ? "உங்கள் நாள் பற்றி எதையும் கேளுங்கள்…" : "Ask anything about your day…"}
        </span>
        <span style={{ background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", borderRadius: "999px", padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}>
          {lang === "ta" ? "கேள் ✦" : "Ask ✦"}
        </span>
      </button>
    </div>
  );
}

export function DashboardTodayDecideNova({
  lang,
  chartId,
  selectedDate,
  activeLifeMode,
  onOpenAskVinaadi,
}: {
  lang: Lang;
  chartId: string | null;
  selectedDate: string;
  activeLifeMode?: LifeMode;
  onOpenAskVinaadi: () => void;
}) {
  return (
    <div className="nova-grid-2">
      <AskVinaadiTeaser lang={lang} activeLifeMode={activeLifeMode} onOpenAskVinaadi={onOpenAskVinaadi} />
      {chartId ? <DecideGrid lang={lang} chartId={chartId} selectedDate={selectedDate} /> : <div />}
    </div>
  );
}

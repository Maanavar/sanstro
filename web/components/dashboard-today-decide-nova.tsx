"use client";

import { useEffect, useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { formatClockLabel } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData, DailyGuidanceWindow } from "@/lib/types";

/**
 * Nova "Is today okay for…?" decision strip — a promoted, full-width row of
 * verdict pills for the user's frequent activities, using the same
 * `dateResult` field on /api/v1/activity-timing the old 2×2 grid read. The
 * old mid-page "Ask Vinaadi" teaser card that used to sit beside this grid
 * is retired here: Ask Vinaadi now has a single, permanent home in the
 * topbar (cd-ask-nav-btn, dashboard-hero.tsx) rather than a second entry
 * point competing for space on this page.
 */

const DECIDE_ACTIVITIES: Array<{ activity: string; labelEn: string; labelTa: string }> = [
  { activity: "travel", labelEn: "Travel", labelTa: "பயணம்" },
  { activity: "property", labelEn: "Signing", labelTa: "ஒப்பந்தம்" },
  { activity: "money", labelEn: "Buy gold", labelTa: "தங்கம் வாங்குதல்" },
  { activity: "job_change", labelEn: "New job", labelTa: "புதிய வேலை" },
];

function alignmentDisplay(alignment: string, hasBetterDate: boolean): { icon: string; color: string; bg: string; border: string } {
  if (alignment === "SUPPORTS") {
    return { icon: "✓", color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" };
  }
  if (alignment === "CAUTION") {
    return { icon: "✕", color: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" };
  }
  // NEUTRAL: a half-tone dot — filled further (◐) when we can point to a
  // concretely better date, since that reads as "waitable", not "wrong".
  return { icon: hasBetterDate ? "◐" : "~", color: "var(--color-mid)", bg: "var(--color-mid-bg)", border: "var(--color-mid-border)" };
}

/** The chip's short cause comes structured from the backend
 *  (shortReasonEn/Ta on /api/v1/activity-timing — the dominant Thirukanitham
 *  signal, named the way users know it: "Navami — rikta tithi", never a raw
 *  1-30 tithi index). This fallback only covers payloads from before that
 *  field existed: first clause of the full reason, word-boundary-truncated. */
function fallbackShort(reason: string | undefined): string | null {
  if (!reason) return null;
  const clause = reason.split(/[.;]/)[0]?.trim() ?? "";
  const words = clause.split(/\s+/).slice(0, 4).join(" ");
  return words.length < clause.length ? `${words}…` : words;
}

function shortHour(clock: string, lang: Lang): string {
  const [time, period] = formatClockLabel(clock).split(" ");
  const hour = time?.split(":")[0] ?? time;
  if (lang === "ta") return `${hour} ${period === "am" ? "காலை" : "மாலை"}`;
  return `${hour} ${period}`;
}

/** Plain-language qualifier for a SUPPORTS-aligned activity, framed against
 *  the day's one real best window rather than re-deriving a second,
 *  activity-specific window we don't have data for. */
function supportsQualifier(bestWindow: DailyGuidanceWindow | null, now: Date, isToday: boolean, lang: Lang): string {
  if (!bestWindow) return lang === "ta" ? "சாதகமான நாள்" : "favourable";
  if (!isToday) {
    return lang === "ta" ? `சிறந்த நேரம் ${shortHour(bestWindow.start, lang)}` : `best window ${shortHour(bestWindow.start, lang)}`;
  }
  const [sh, sm] = bestWindow.start.split(":").map(Number);
  const [eh, em] = bestWindow.end.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = (sh ?? 0) * 60 + (sm ?? 0);
  const endMin = (eh ?? 0) * 60 + (em ?? 0);
  if (nowMin < startMin) return lang === "ta" ? `${shortHour(bestWindow.start, lang)} இல் நல்லது` : `fine after ${shortHour(bestWindow.start, lang)}`;
  if (nowMin <= endMin) return lang === "ta" ? "சிறந்த நேரத்தில்" : "in best window";
  return lang === "ta" ? "இன்று நல்லது" : "fine today";
}

function shortDate(dateLocal: string, lang: Lang): string {
  return new Date(`${dateLocal}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short" });
}

export function DashboardTodayDecideNova({
  lang,
  chartId,
  selectedDate,
  bestWindow,
  now,
  isToday,
  onOpenAskVinaadi,
}: {
  lang: Lang;
  chartId: string | null;
  selectedDate: string;
  activeLifeMode?: string;
  bestWindow: DailyGuidanceWindow | null;
  now: Date;
  isToday: boolean;
  onOpenAskVinaadi: () => void;
}) {
  const [results, setResults] = useState<Record<string, ActivityTimingData | null>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!chartId || !selectedDate) {
      setBusy(false);
      return;
    }
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

  // Precompute every pill's verdict + short cause once, so we can detect when
  // the SAME dominant cause is about to repeat across several activities and
  // hoist it into a single shared subtitle instead of printing it N times.
  const pills = DECIDE_ACTIVITIES.map((a) => {
    const data = results[a.activity];
    const dateResult = data?.dateResult ?? null;
    const reason = dateResult ? (lang === "ta" ? dateResult.reasonTa : dateResult.reasonEn) : undefined;
    const short = dateResult
      ? ((lang === "ta" ? dateResult.shortReasonTa : dateResult.shortReasonEn) || fallbackShort(reason))
      : null;
    // Next date this month, after the selected one, where the same activity
    // actually SUPPORTS — lets a NEUTRAL/CAUTION verdict point to a concrete
    // "better" day instead of a vague caveat.
    const betterDate = (data?.topDates ?? [])
      .filter((d) => d.dateLocal > selectedDate && d.alignment === "SUPPORTS")
      .sort((x, y) => (x.dateLocal < y.dateLocal ? -1 : 1))[0] ?? null;
    const display = dateResult ? alignmentDisplay(dateResult.alignment, Boolean(betterDate)) : null;
    return { a, data, dateResult, reason, short, betterDate, display };
  });

  // The one cause carried by the most pills. Only hoisted when ≥2 activities
  // would otherwise print the identical short reason ("Navami — rikta tithi"
  // three times over) — the exact repetition users flagged. A pill "repeats"
  // its cause only when its qualifier would actually show that short text
  // (CAUTION, or a NEUTRAL with no concrete better day to point at instead).
  const causeCounts = new Map<string, number>();
  for (const p of pills) {
    const showsCause = p.dateResult
      && (p.dateResult.alignment === "CAUTION" || (p.dateResult.alignment === "NEUTRAL" && !p.betterDate));
    if (showsCause && p.short) causeCounts.set(p.short, (causeCounts.get(p.short) ?? 0) + 1);
  }
  let sharedCause: string | null = null;
  for (const [cause, count] of causeCounts) {
    if (count >= 2 && count > (sharedCause ? (causeCounts.get(sharedCause) ?? 0) : 1)) sharedCause = cause;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "14px 20px" }}>
      <div style={{ flex: "none" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700, whiteSpace: "nowrap" }}>
          {lang === "ta" ? "இன்று நல்ல நாளா…?" : "Is today okay for…?"}
        </div>
        {!busy && sharedCause && (
          <div style={{ fontSize: "11px", color: "var(--color-mid)", marginTop: "3px", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }}>
            <span aria-hidden="true">◑</span>
            <span>{lang === "ta" ? "இன்று: " : "Today: "}{sharedCause}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", minWidth: 0 }}>
        {chartId && pills.map(({ a, dateResult, reason, short, betterDate, display }) => {
          let q: string | null = null;
          if (dateResult) {
            if (dateResult.alignment === "SUPPORTS") {
              q = supportsQualifier(bestWindow, now, isToday, lang);
            } else if (dateResult.alignment === "CAUTION") {
              // Drop the cause from the pill when it's already stated once in the
              // shared subtitle — the pill just reads "✕ Travel · defer".
              const ownCause = short && short !== sharedCause;
              q = ownCause ? `${lang === "ta" ? "ஒத்திவை" : "defer"} · ${short}` : (lang === "ta" ? "ஒத்திவை" : "defer");
            } else if (betterDate) {
              q = lang === "ta" ? `சிறந்தது ${shortDate(betterDate.dateLocal, lang)}` : `better ${shortDate(betterDate.dateLocal, lang)}`;
            } else {
              q = short && short !== sharedCause ? short : null;
            }
          }

          // Tooltip carries the full chart-derived sentence, plus the concrete
          // better day when the verdict says wait.
          const tooltip = reason && dateResult && dateResult.alignment !== "SUPPORTS" && betterDate
            ? `${reason} ${lang === "ta" ? `இந்த மாதம் சிறந்த நாள்: ${shortDate(betterDate.dateLocal, lang)}.` : `Better day this month: ${shortDate(betterDate.dateLocal, lang)}.`}`
            : reason;
          return (
            <span
              key={a.activity}
              title={tooltip}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12.5px",
                background: display?.bg ?? "rgba(243,236,221,0.05)",
                border: `1px solid ${display?.border ?? "var(--color-border)"}`,
                borderRadius: "999px", padding: "7px 13px", whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: display?.color ?? "var(--color-faint)", fontWeight: 700 }}>
                {busy ? "…" : (display?.icon ?? "?")}
              </span>
              <span style={{ color: "var(--color-text-strong)", fontWeight: 600 }}>{lang === "ta" ? a.labelTa : a.labelEn}</span>
              {!busy && q && <span style={{ color: "var(--color-faint)" }}>· {q}</span>}
            </span>
          );
        })}
        <button
          type="button"
          onClick={onOpenAskVinaadi}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--color-accent-secondary)",
            background: "none", border: "1px dashed var(--color-accent-secondary-muted)", borderRadius: "999px",
            padding: "7px 13px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
          }}
        >
          + {lang === "ta" ? "உங்கள் கேள்வி" : "Ask your own"}
        </button>
      </div>
    </div>
  );
}

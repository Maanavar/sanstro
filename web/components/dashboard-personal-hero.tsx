"use client";

import { formatClockLabel, getScoreBand, scoreColor, SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import { gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { DailyGuidanceData, ChartSummaryData, PanchangamDailyResponseData, PanchangamTimingsData } from "@/lib/types";
function kalamSlotKey(
  slot: PanchangamDailyResponseData["kalam"]["nallaNeram"][number],
  index: number,
): string {
  return `${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${index}`;
}

/* ── Score ring SVG ─────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: "block" }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--panel-tan-light)" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 55 55)"
      />
    </svg>
  );
}

/* ── Day timeline bar ───────────────────────────────────── */
function DayTimeline({
  bestStart, bestEnd, holdStart, holdEnd,
}: {
  bestStart?: string; bestEnd?: string;
  holdStart?: string; holdEnd?: string;
}) {
  /* Convert "HH:MM:SS" or "HH:MM" to hours-from-6am (0..12) → x offset (px, 20..300) */
  function toX(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0] ?? "0", 10);
    const m = parseInt(parts[1] ?? "0", 10);
    const hoursFrom6 = (h + m / 60) - 6;
    if (hoursFrom6 < 0 || hoursFrom6 > 12) return null;
    return 20 + (hoursFrom6 / 12) * 280;
  }

  const bx1 = toX(bestStart);
  const bx2 = toX(bestEnd);
  const hx1 = toX(holdStart);
  const hx2 = toX(holdEnd);

  /* Sun x at current local time (clamped 6am–6pm) */
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  const sunHoursFrom6 = Math.max(0, Math.min(12, nowHours - 6));
  const sunX = 20 + (sunHoursFrom6 / 12) * 280;
  /* Sun y on arc: y = 82 - 2t(1-t)·64, t = sunHoursFrom6/12 */
  const t = sunHoursFrom6 / 12;
  const sunY = 82 - 2 * t * (1 - t) * 64;

  return (
    <div style={{ marginTop: "var(--space-2)" }}>
      <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
        {/* Arc */}
        <path d="M20,82 Q160,18 300,82" fill="none" stroke="var(--panel-tan)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Horizon bar */}
        <rect x="20" y="79" width="280" height="5" rx="2.5" fill="var(--panel-tan-light)" />
        {/* Best window */}
        {bx1 !== null && bx2 !== null && (
          <rect x={bx1} y="78" width={Math.max(bx2 - bx1, 6)} height="7" rx="3.5" fill={SCORE_HIGH} />
        )}
        {/* Hold window */}
        {hx1 !== null && hx2 !== null && (
          <rect x={hx1} y="78" width={Math.max(hx2 - hx1, 6)} height="7" rx="3.5" fill={SCORE_LOW} />
        )}
        {/* Tick marks */}
        {[20, 90, 160, 230, 300].map((x) => (
          <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="var(--color-faint)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {/* Sun dot */}
        <circle cx={sunX} cy={sunY} r="6" fill={SCORE_MID} />
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "0 calc(20/320*100%)", marginTop: "var(--space-0_5)" }}>
        {["6 am", "9 am", "12 pm", "3 pm", "6 pm"].map((h) => (
          <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--color-faint)", textAlign: "center" }}>{h}</span>
        ))}
      </div>
    </div>
  );
}

type HeroProps = {
  lang: Lang;
  displayName: string;
  dateLabel: string;
  guidanceHeadline: string;
  score: number | null;
  personalScoreBand: ReturnType<typeof getScoreBand> | null;
  personalDailyGuidance: import("@/lib/types").DailyGuidanceData | null;
  bestWindow: import("@/lib/types").DailyGuidanceData["bestWindows"][number] | null;
  avoidWindow: import("@/lib/types").DailyGuidanceData["cautionWindows"][number] | null;
  panchangam: import("@/lib/types").PanchangamDailyResponseData | null;
  panchangamTimings: import("@/lib/types").PanchangamTimingsData | null;
  personalChartSummary: import("@/lib/types").ChartSummaryData | null;
  astroText: (v: string) => string;
};

export function PersonalHero({
  lang, displayName, dateLabel, guidanceHeadline, score, personalScoreBand,
  personalDailyGuidance, bestWindow, avoidWindow, panchangam, personalChartSummary, astroText,
}: HeroProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "var(--space-7)", alignItems: "start" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--panel-brand)" }}>
          {dateLabel}
        </p>
        {personalDailyGuidance ? (
          <>
            <h1 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--panel-earth-dark)" }}>
              Today is{" "}
              <em style={{ fontStyle: "italic", color: "var(--color-faint)" }}>
                {personalDailyGuidance.label.toLowerCase()}.
              </em>
              <br />
              {guidanceHeadline && !guidanceHeadline.includes("Today") ? guidanceHeadline : "Move step by step."}
            </h1>
            <p style={{ margin: "0 0 var(--space-5)", fontSize: "1rem", lineHeight: 1.7, color: "var(--panel-earth)", maxWidth: "52ch" }}>
              {lang === "ta" ? personalDailyGuidance.text.ta : personalDailyGuidance.text.en}
            </p>
          </>
        ) : (
          <h1 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--panel-earth-dark)" }}>
            {displayName ? `${displayName}'s day` : "Your day"}
          </h1>
        )}
        {personalDailyGuidance && (
          <DayTimeline
            bestStart={bestWindow?.start}
            bestEnd={bestWindow?.end}
            holdStart={avoidWindow?.start}
            holdEnd={avoidWindow?.end}
          />
        )}
      </div>

      {personalDailyGuidance && (
        <div className="cd-card--lg">
          <p className="cd-kicker">{t("personal_today", lang)}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 500, lineHeight: 1, color: "var(--panel-earth-dark)" }}>
                {score}
                <span style={{ fontSize: "1.25rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/100</span>
              </p>
              <span
                className="cd-score-pill"
                style={{
                  marginTop: "var(--space-2)",
                  background: score !== null && score >= 65 ? "var(--chart-d9-active-bg)" : score !== null && score >= 45 ? "var(--chart-d1-lagna-bg)" : "var(--panel-warm-tint)",
                  color: score !== null ? scoreColor(score) : SCORE_MID,
                }}
              >
                {personalDailyGuidance.label}
              </span>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ScoreRing score={score ?? 0} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: score !== null ? scoreColor(score) : SCORE_MID }}>
                {score}
              </div>
            </div>
          </div>

          <div className="cd-window-grid">
            <div className="cd-time-slot">
              <p className="cd-kicker">{lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram"}</p>
              {(panchangam?.kalam?.nallaNeram?.length ?? 0) > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                  {panchangam!.kalam.nallaNeram.map((w, idx) => {
                    const lbl = gowriPeriodLabel(w.period, lang);
                    const category = gowriCategoryLabel(w.name, lang);
                    const purpose = gowriPurposeLabel(w.name, lang);
                    return (
                      <div key={kalamSlotKey(w, idx)} style={{ display: "grid", gap: "2px" }}>
                        <div>{[lbl, category].filter(Boolean).map((part) => <span key={part} style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-faint)", marginRight: "4px" }}>{part}</span>)}</div>
                        <span className="cd-time-value" style={{ fontSize: "0.9rem" }}>{formatClockLabel(w.start)} – {formatClockLabel(w.end)}</span>
                        {purpose && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-muted)" }}>{purpose}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : bestWindow ? (
                <p className="cd-time-value">{formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}</p>
              ) : <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>—</p>}
            </div>
            <div className="cd-time-slot">
              <p className="cd-kicker">{lang === "ta" ? "யமகண்டம்" : "Yamagandam"}</p>
              {panchangam?.kalam?.yamagandam ? (
                <p className="cd-time-value">{formatClockLabel(panchangam.kalam.yamagandam.start)} – {formatClockLabel(panchangam.kalam.yamagandam.end)}</p>
              ) : <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>—</p>}
            </div>
            <div className="cd-time-slot" style={{ background: "var(--chart-d9-active-bg)", border: "1px solid rgba(92,118,84,0.3)" }}>
              <p className="cd-kicker" style={{ color: SCORE_HIGH }}>
                {panchangam?.kalam?.kuligai ? (lang === "ta" ? "குளிகை" : "Kuligai") : t("action_best_window", lang)}
              </p>
              <p className="cd-time-value" style={{ color: SCORE_HIGH }}>
                {panchangam?.kalam?.kuligai ? `${formatClockLabel(panchangam.kalam.kuligai.start)} – ${formatClockLabel(panchangam.kalam.kuligai.end)}` : bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
              </p>
            </div>
            <div className="cd-time-slot" style={{ background: "var(--panel-warm-tint)", border: "1px solid rgba(168,72,47,0.3)" }}>
              <p className="cd-kicker" style={{ color: SCORE_LOW }}>{lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}</p>
              <p className="cd-time-value" style={{ color: SCORE_LOW }}>
                {panchangam?.kalam?.rahuKalam ? `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}` : avoidWindow ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}` : "—"}
              </p>
            </div>
          </div>

          {personalChartSummary && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2_5)", borderTop: "1px solid var(--panel-tan-light)", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>
                {personalChartSummary.lagnaRasi} {t("label_lagnam", lang)} · {astroText(personalChartSummary.janmaNakshatra)} ☉ {personalChartSummary.moonRasi}
              </span>
              <span className="cd-kicker--inline">D1 · D9 ready</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
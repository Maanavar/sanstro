"use client";

import { getScoreBand, scoreColor, SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import { SCORE_THRESHOLDS } from "@vinaadi/shared/utils/score";
import { ThirukanithamBadge } from "@/components/thirukanitham-badge";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { DailyGuidanceData, ChartSummaryData, PanchangamDailyResponseData, PanchangamTimingsData } from "@/lib/types";

const SCORE_CHIP_KEYS = ["moonTransit", "gocharSupport", "dashaSupport", "panchangam", "personalCautions", "remedialActionSupport"] as const;
type ScoreChipKey = typeof SCORE_CHIP_KEYS[number];
const SCORE_CHIP_META: Record<ScoreChipKey, { max: number; labelEn: string; labelTa: string; descEn: string; descTa: string }> = {
  moonTransit:           { max: 28, labelEn: "Moon transit",    labelTa: "சந்திர நகர்வு",          descEn: "Moon's position relative to your natal Moon today",                                           descTa: "இன்று சந்திரன் உங்கள் ஜாதக சந்திரனிலிருந்து எந்த இடத்தில் உள்ளார்" },
  gocharSupport:         { max: 24, labelEn: "Gochar transits", labelTa: "கோசார ஆதரவு",            descEn: "Today's transiting planets interacting with your chart",                                      descTa: "இன்றைய கோசார கிரகங்கள் உங்கள் ஜாதகத்தை எவ்வாறு பாதிக்கின்றன" },
  dashaSupport:          { max: 19, labelEn: "Dasa support",    labelTa: "தசை ஆதரவு",             descEn: "Current Mahadasha & Antardasha lord strength",                                                descTa: "நடப்பு மகாதசை மற்றும் அந்தர்தசை ஆதரவு" },
  panchangam:            { max: 14, labelEn: "Panchangam",      labelTa: "பஞ்சாங்கம்",             descEn: "Tithi, Yoga & Karana quality today",                                                          descTa: "இன்றைய திதி, யோகம், கரணம் தரம்" },
  personalCautions:      { max:  9, labelEn: "Personal safety", labelTa: "தனிப்பட்ட பாதுகாப்பு",   descEn: "Lower when Saturn cycle, Chandrashtama or combustion is active",                              descTa: "சனி சுழற்சி, சந்திராஷ்டமம் அல்லது கிரக அஸ்தமனம் உள்ளபோது குறையும்" },
  remedialActionSupport: { max:  6, labelEn: "Remedial",        labelTa: "பரிகார ஆதரவு",           descEn: "Bonus when a personal hora window is available today",                                        descTa: "தனிப்பட்ட ஹோரா சாளரம் கிடைக்கும்போது கூடுதல் மதிப்பெண்" },
};

/* ── Score ring SVG ─────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ display: "block" }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--panel-tan-light)" strokeWidth="8" />
      <circle
        cx="65" cy="65" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 65 65)"
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
  lang, displayName, dateLabel, guidanceHeadline, score,
  personalDailyGuidance, bestWindow, avoidWindow, personalChartSummary, astroText,
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-2)" }}>
            <p className="cd-kicker" style={{ margin: 0 }}>{t("personal_today", lang)}</p>
            <ThirukanithamBadge size="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
            <div>
              <p style={{
                margin: "0 0 var(--space-1_5)",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: score !== null ? scoreColor(score) : SCORE_MID,
              }}>
                {personalDailyGuidance.label}
              </p>
              <p style={{
                margin: 0,
                fontSize: "0.675rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-faint)",
              }}>
                {lang === "ta" ? "திருக்கணித மதிப்பெண்" : "Thirukanitham score"}
              </p>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ScoreRing score={score ?? 0} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500, lineHeight: 1, color: score !== null ? scoreColor(score) : SCORE_MID }}>
                  {score}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.625rem", color: "var(--color-faint)", lineHeight: 1 }}>
                  /100
                </span>
              </div>
            </div>
          </div>

          {personalDailyGuidance.scoreBreakdown && (
            <div className="cd-score-chip-grid">
              {SCORE_CHIP_KEYS.map((k) => {
                const value = (personalDailyGuidance.scoreBreakdown as Record<string, number>)[k] ?? 0;
                const meta = SCORE_CHIP_META[k];
                const pct = Math.round(Math.max(0, value) / meta.max * 100);
                const color = scoreColor(value / meta.max * 100);
                return (
                  <div key={k} className="cd-score-chip">
                    <p className="cd-kicker">{lang === "ta" ? meta.labelTa : meta.labelEn}</p>
                    <div className="cd-score-chip__value-row">
                      <span className="cd-score-chip__value" style={{ color }}>{value}</span>
                      <span className="cd-score-chip__max">/ {meta.max}</span>
                    </div>
                    <div className="cd-score-chip__bar-track">
                      <div className="cd-score-chip__bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="cd-score-chip__desc">{lang === "ta" ? meta.descTa : meta.descEn}</p>
                  </div>
                );
              })}
            </div>
          )}

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
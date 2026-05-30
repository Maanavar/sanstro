"use client";

import { formatClockLabel, formatDateLabel, getScoreBand } from "@/lib/format";
import { t, tLang, tTithi, tNakshatra, tWeekday, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  AmbientAlertItem,
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  FamilyAggregateData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  PeyarchiReportData,
  SaniCycleData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

import { GRAHA_ABBR, JathagamKattam, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { DashboardDailySnapshot } from "./dashboard-daily-snapshot";
import { PeyarchiBanner } from "./peyarchi-banner";
import { Button, Chip, Metric, Surface } from "./dashboard-ui";
import { DayStrip } from "./day-strip";
import { MemberChip } from "./member-chip";
import { AlertBanner } from "./alert-banner";
import { CollapsibleSection } from "./collapsible-section";

type DashboardPersonalTabProps = {
  lang: Lang;
  birthDisplayName: string;
  selectedDate: string;
  todayDate: string;
  personalViewId: string | null;
  birthProfileId: string;
  busyPersonal: boolean;
  memberCharts: Array<{ memberId: string; displayName: string }>;
  onSelectPersonalView: (memberId: string | null) => void;
  onOpenEditProfile: () => void;
  onRefreshPersonal: () => void;
  onDateChange?: (date: string) => void;

  personalMemberChart: { displayName: string } | null;
  personalChart: ChartCalculateResponseData | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  weekAhead: WeekAheadData | null;
  familyAggregate: FamilyAggregateData | null;

  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;

  ambientAlerts: AmbientAlertItem[];
  formatScoreLabel: (score: number) => string;
  nakshatraCard: NakshatraCardData | null;
  peyarchiReport: PeyarchiReportData | null;
  onGoToFamily?: () => void;
};

/* ── Score ring SVG ─────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 65 ? "#5C7654" : score >= 45 ? "#B85A2C" : "#A8482F";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: "block" }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#E4DBC8" strokeWidth="8" />
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
    <div style={{ marginTop: "8px" }}>
      <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
        {/* Arc */}
        <path d="M20,82 Q160,18 300,82" fill="none" stroke="#D4C8AE" strokeWidth="1.5" strokeLinecap="round" />
        {/* Horizon bar */}
        <rect x="20" y="79" width="280" height="5" rx="2.5" fill="#E4DBC8" />
        {/* Best window */}
        {bx1 !== null && bx2 !== null && (
          <rect x={bx1} y="78" width={Math.max(bx2 - bx1, 6)} height="7" rx="3.5" fill="#5C7654" />
        )}
        {/* Hold window */}
        {hx1 !== null && hx2 !== null && (
          <rect x={hx1} y="78" width={Math.max(hx2 - hx1, 6)} height="7" rx="3.5" fill="#A8482F" />
        )}
        {/* Tick marks */}
        {[20, 90, 160, 230, 300].map((x) => (
          <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#A89D89" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {/* Sun dot */}
        <circle cx={sunX} cy={sunY} r="6" fill="#B85A2C" />
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "0 calc(20/320*100%)", marginTop: "2px" }}>
        {["6a", "9a", "12p", "3p", "6p"].map((h) => (
          <span key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "#A89D89", textAlign: "center" }}>{h}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardPersonalTab({
  lang,
  birthDisplayName,
  selectedDate,
  todayDate,
  personalViewId,
  birthProfileId,
  busyPersonal,
  memberCharts,
  onSelectPersonalView,
  onOpenEditProfile,
  onRefreshPersonal,
  onDateChange,
  personalMemberChart,
  personalChart,
  personalChartSummary,
  personalDailyGuidance,
  dailyGuidanceRange,
  weekAhead,
  familyAggregate,
  personalTransit,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  panchangamTimings,
  ambientAlerts,
  formatScoreLabel,
  nakshatraCard,
  peyarchiReport,
  onGoToFamily,
}: DashboardPersonalTabProps) {
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const isChandrashtama = personalTransit?.isChandrashtama ?? false;
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const avoidWindow = personalDailyGuidance?.cautionWindows[0] ?? null;
  const score = personalDailyGuidance?.score ?? null;
  const personalScoreBand = score !== null ? getScoreBand(score) : null;

  /* Date label */
  const dateLabel = selectedDate === todayDate
    ? new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase()
    : formatDateLabel(selectedDate).toUpperCase();

  /* Guidance headline — first sentence */
  const guidanceHeadline = personalDailyGuidance
    ? tLang(personalDailyGuidance.text, lang).split(".")[0] + "."
    : "";
  const guidanceRest = personalDailyGuidance
    ? tLang(personalDailyGuidance.text, lang).split(".").slice(1).join(".").trim()
    : "";

  /* Dasha info */
  const dashaText = personalChartSummary
    ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}`
    : null;
  const dashaBhuktiText = personalChartSummary
    ? `${personalChartSummary.currentAntardasha} ${t("bhukti_word", lang)}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif", color: "#3D352B" }}>

      {/* ── Panchangam drop (above alerts) ── */}
      {panchangam && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", border: "1px solid #E4DBC8", background: "#FAF5EA" }}>
          <CollapsibleSection
            title={
              <span style={{ fontSize: "0.88rem", color: "#3D352B" }}>
                {t("today_panchangam", lang)}
                {" — "}
                <span style={{ color: "#7A6F5E", fontWeight: 400, fontSize: "0.8rem" }}>
                  {tWeekday(panchangam.vara.weekday, lang)} · {tNakshatra(panchangam.nakshatra.name, lang)} · {tTithi(panchangam.tithi.name, lang)}
                </span>
              </span>
            }
            defaultOpen={false}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px" }}>
              <div className="chip-row">
                <Chip tone="accent">{t("label_rahu_kalam", lang)} {formatClockLabel(panchangam.kalam.rahuKalam.start)}–{formatClockLabel(panchangam.kalam.rahuKalam.end)}</Chip>
                <Chip tone="warning">{t("label_yamagandam", lang)} {formatClockLabel(panchangam.kalam.yamagandam.start)}–{formatClockLabel(panchangam.kalam.yamagandam.end)}</Chip>
                <Chip>{t("label_kuligai", lang)} {formatClockLabel(panchangam.kalam.kuligai.start)}–{formatClockLabel(panchangam.kalam.kuligai.end)}</Chip>
                {panchangam.kalam.mandhi && <Chip>{t("label_mandhi", lang)} {formatClockLabel(panchangam.kalam.mandhi.start)}–{formatClockLabel(panchangam.kalam.mandhi.end)}</Chip>}
                {panchangam.kalam.nallaNeram?.map((w) => (
                  <Chip key={`${w.start}-${w.end}`} tone="success">{t("label_nalla_neram", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>
                ))}
                {panchangamTimings && !panchangam.abhijit.isRestrictedByWeekday && (
                  <Chip tone="success">{t("label_abhijit", lang)} {formatClockLabel(panchangam.abhijit.start)}–{formatClockLabel(panchangam.abhijit.end)}</Chip>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                {[
                  { label: t("label_tithi", lang), value: `${panchangam.tithi.number} ${tTithi(panchangam.tithi.name, lang)}`, hint: `${t("label_ends_at", lang)} ${formatClockLabel(panchangam.tithi.endsAt)}` },
                  { label: t("label_nakshatra", lang), value: `${tNakshatra(panchangam.nakshatra.name, lang)} ${t("label_padam", lang)} ${panchangam.nakshatra.pada}`, hint: formatClockLabel(panchangam.nakshatra.endsAt) },
                  { label: t("label_sunrise", lang), value: formatClockLabel(panchangam.sunrise), hint: "" },
                  { label: t("label_sunset", lang), value: formatClockLabel(panchangam.sunset), hint: "" },
                ].map((row) => (
                  <div key={row.label}>
                    <p style={{ margin: "0 0 2px", fontSize: "0.62rem", color: "#A89D89", textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#1A1612" }}>{row.value}{row.hint && <span style={{ color: "#A89D89", fontSize: "0.72rem" }}> {row.hint}</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ── Alerts ── */}
      {(isChandrashtama || ambientAlerts.length > 0 || peyarchiUpcoming.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {isChandrashtama && (
            <AlertBanner variant="critical" message={t("chandrashtama_warning", lang)} dismissible={false} />
          )}
          {ambientAlerts.slice(0, 2).map((alert) => (
            <AlertBanner key={alert.alertId} variant="caution"
              message={tLang(alert.title, lang) + " — " + tLang(alert.message, lang)} />
          ))}
          <PeyarchiBanner events={peyarchiUpcoming} lang={lang} peyarchiReport={peyarchiReport} />
        </div>
      )}

      {/* ── Member switcher (if family members exist) ── */}
      {memberCharts.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onSelectPersonalView(null)}
            style={{
              padding: "5px 14px", borderRadius: "999px", border: "1.5px solid",
              borderColor: personalViewId === null ? "#1A1612" : "#D4C8AE",
              background: personalViewId === null ? "#1A1612" : "transparent",
              color: personalViewId === null ? "#F4EEE2" : "#7A6F5E",
              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {birthDisplayName || t("personal_you", lang)}
          </button>
          {memberCharts.map((mc) => (
            <button
              key={mc.memberId}
              type="button"
              onClick={() => onSelectPersonalView(mc.memberId)}
              style={{
                padding: "5px 14px", borderRadius: "999px", border: "1.5px solid",
                borderColor: personalViewId === mc.memberId ? "#1A1612" : "#D4C8AE",
                background: personalViewId === mc.memberId ? "#1A1612" : "transparent",
                color: personalViewId === mc.memberId ? "#F4EEE2" : "#7A6F5E",
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {mc.displayName}
            </button>
          ))}
          {!personalViewId && (
            <button
              type="button"
              onClick={() => onRefreshPersonal()}
              disabled={!birthProfileId || busyPersonal}
              style={{
                marginLeft: "auto", padding: "5px 12px", borderRadius: "999px",
                border: "1px solid #D4C8AE", background: "transparent",
                color: "#7A6F5E", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh", lang)}
            </button>
          )}
        </div>
      )}

      {/* ── HERO: Left headline + Right score card ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px,420px)", gap: "28px", alignItems: "start" }}>

        {/* Left: Big headline */}
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
            {dateLabel}
          </p>

          {personalDailyGuidance ? (
            <>
              <h1 style={{
                margin: "0 0 16px",
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#1A1612",
              }}>
                Today is{" "}
                <em style={{ fontStyle: "italic", color: "#7A6F5E" }}>
                  {personalDailyGuidance.label.toLowerCase()}.
                </em>
                <br />
                {guidanceHeadline && !guidanceHeadline.includes("Today") ? guidanceHeadline : "Move step by step."}
              </h1>

              <p style={{ margin: "0 0 20px", fontSize: "0.95rem", lineHeight: 1.7, color: "#3D352B", maxWidth: "52ch" }}>
                {tLang(personalDailyGuidance.text, lang)}
              </p>
            </>
          ) : (
            <h1 style={{
              margin: "0 0 16px",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#1A1612",
            }}>
              {displayName ? `${displayName}'s day` : "Your day"}
            </h1>
          )}

          {/* Day timeline */}
          {personalDailyGuidance && (
            <DayTimeline
              bestStart={bestWindow?.start}
              bestEnd={bestWindow?.end}
              holdStart={avoidWindow?.start}
              holdEnd={avoidWindow?.end}
            />
          )}
        </div>

        {/* Right: Score card */}
        {personalDailyGuidance && (
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E4DBC8",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 4px 24px rgba(60,40,20,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            {/* TODAY label */}
            <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
              {t("personal_today", lang)}
            </p>

            {/* Score + ring */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: "3.5rem", fontWeight: 500, lineHeight: 1, color: "#1A1612" }}>
                  {score}
                  <span style={{ fontSize: "1.2rem", color: "#A89D89", fontFamily: "'Inter',system-ui,sans-serif" }}>/100</span>
                </p>
                <span style={{
                  display: "inline-block", marginTop: "8px",
                  padding: "3px 10px", borderRadius: "999px",
                  background: score !== null && score >= 65 ? "#DCE4D2" : score !== null && score >= 45 ? "#F0D9C4" : "#F2D8CC",
                  color: score !== null && score >= 65 ? "#5C7654" : score !== null && score >= 45 ? "#B85A2C" : "#A8482F",
                  fontSize: "0.75rem", fontWeight: 600,
                }}>
                  {personalDailyGuidance.label}
                </span>
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={score ?? 0} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.4rem", fontWeight: 500,
                  color: score !== null && score >= 65 ? "#5C7654" : score !== null && score >= 45 ? "#B85A2C" : "#A8482F",
                }}>
                  {score}
                </div>
              </div>
            </div>

            {/* Nalla Neram / Rahu Kalam windows */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Nalla Neram (best window) */}
              <div style={{
                borderRadius: "12px",
                border: `1.5px solid #E4DBC8`,
                padding: "12px",
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
                  {lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram"}
                </p>
                {panchangam?.kalam?.nallaNeram?.[0] ? (
                  <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: "#1A1612" }}>
                    {formatClockLabel(panchangam.kalam.nallaNeram[0].start)} – {formatClockLabel(panchangam.kalam.nallaNeram[0].end)}
                  </p>
                ) : bestWindow ? (
                  <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: "#1A1612" }}>
                    {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}
                  </p>
                ) : <p style={{ margin: 0, color: "#A89D89", fontSize: "0.85rem" }}>—</p>}
              </div>

              {/* Yamagandam */}
              <div style={{
                borderRadius: "12px",
                border: "1.5px solid #E4DBC8",
                padding: "12px",
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
                  {lang === "ta" ? "யமகண்டம்" : "Yamagandam"}
                </p>
                {panchangam?.kalam?.yamagandam ? (
                  <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: "#1A1612" }}>
                    {formatClockLabel(panchangam.kalam.yamagandam.start)} – {formatClockLabel(panchangam.kalam.yamagandam.end)}
                  </p>
                ) : <p style={{ margin: 0, color: "#A89D89", fontSize: "0.85rem" }}>—</p>}
              </div>

              {/* Best Window */}
              <div style={{
                borderRadius: "12px",
                background: "#DCE4D2",
                border: "1px solid rgba(92,118,84,0.3)",
                padding: "12px",
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C7654" }}>
                  {panchangam?.kalam?.kuligai ? (lang === "ta" ? "குளிகை" : "Kuligai") : t("action_best_window", lang)}
                </p>
                <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: "#3a6b40" }}>
                  {panchangam?.kalam?.kuligai
                    ? `${formatClockLabel(panchangam.kalam.kuligai.start)} – ${formatClockLabel(panchangam.kalam.kuligai.end)}`
                    : bestWindow
                      ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}`
                      : "—"}
                </p>
              </div>

              {/* Rahu Kalam */}
              <div style={{
                borderRadius: "12px",
                background: "#F2D8CC",
                border: "1px solid rgba(168,72,47,0.3)",
                padding: "12px",
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A8482F" }}>
                  {lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}
                </p>
                <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 500, color: "#A8482F" }}>
                  {panchangam?.kalam?.rahuKalam
                    ? `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}`
                    : avoidWindow
                      ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}`
                      : "—"}
                </p>
              </div>
            </div>

            {/* Lagna / Nakshatra / D9 footer */}
            {personalChartSummary && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #E4DBC8", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "#7A6F5E" }}>
                  {personalChartSummary.lagnaRasi} {t("label_lagnam", lang)} · {personalChartSummary.janmaNakshatra} ☉ {personalChartSummary.moonRasi}
                </span>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#A89D89" }}>D1 · D9 ready</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Three info cards: Dasa | Nakshatra | Week Ahead ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "16px" }}>

        {/* Dasa card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "16px", padding: "20px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
            {lang === "ta" ? "தசை" : "Dasa"}
          </p>
          <p style={{ margin: "0 0 2px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.5rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
            {dashaText ?? "—"}
          </p>
          {dashaBhuktiText && (
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#7A6F5E" }}>
              {dashaBhuktiText}
            </p>
          )}
          {personalDailyGuidance?.scoreBreakdown && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E4DBC8" }}>
              <span style={{ fontSize: "0.68rem", color: "#A89D89" }}>
                {lang === "ta" ? "கருப்பொருள்" : "Theme"}
              </span>
              {personalDailyGuidance.emotionalWeather?.bestUseOfDay && (
                <span style={{ fontSize: "0.78rem", color: "#3D352B", fontWeight: 500 }}>
                  {personalDailyGuidance.emotionalWeather.bestUseOfDay}
                </span>
              )}
            </div>
          )}
          {personalDailyGuidance?.scoreBreakdown && (
            <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
              {(["moonTransit", "dashaSupport", "panchangam"] as const).map((k) => (
                <span key={k} style={{
                  padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem",
                  background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E",
                }}>
                  {t(`reason_${k}` as Parameters<typeof t>[0], lang)}: {personalDailyGuidance.scoreBreakdown[k]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Nakshatra card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "16px", padding: "20px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
            {lang === "ta" ? "நட்சத்திரம்" : "Nakshatra"}
          </p>
          <p style={{ margin: "0 0 4px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.5rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
            {panchangam ? tNakshatra(panchangam.nakshatra.name, lang) : (nakshatraCard ? (lang === "ta" ? nakshatraCard.nameTa : nakshatraCard.nameEn) : "—")}
            {panchangam && (
              <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.78rem", color: "#A89D89", fontWeight: 400, marginLeft: "6px" }}>
                · {lang === "ta" ? "பாதம்" : "root"} · {lang === "ta" ? "பாதம் தகவல்" : "pAdham info"}
              </span>
            )}
          </p>
          {nakshatraCard && (
            <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "#3D352B", lineHeight: 1.5 }}>
              {lang === "ta" ? nakshatraCard.profile.ta : nakshatraCard.profile.en}
            </p>
          )}
          {nakshatraCard && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {nakshatraCard.strengths.slice(0, 2).map((s) => (
                <span key={s.en} style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "0.72rem", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.3)", color: "#5C7654" }}>
                  {lang === "ta" ? s.ta : s.en}
                </span>
              ))}
              {nakshatraCard.cautions.slice(0, 1).map((c) => (
                <span key={c.en} style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "0.72rem", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
                  {lang === "ta" ? c.ta : c.en}
                </span>
              ))}
              {nakshatraCard.rulingPlanet && (
                <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "0.72rem", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
                  {tPlanetLord(nakshatraCard.rulingPlanet, lang)} {lang === "ta" ? "ஆளும்" : "ruled"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Week ahead card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "16px", padding: "20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
            {t("today_week_ahead", lang)}
          </p>
          {weekAhead && weekAhead.days.length > 0 ? (
            <>
              {/* Mini spark line */}
              <svg viewBox={`0 0 ${weekAhead.days.length * 32} 40`} style={{ width: "100%", height: "40px", display: "block", marginBottom: "6px" }}>
                {weekAhead.days.map((day, i) => {
                  const x = i * 32 + 16;
                  const y = 36 - (day.score / 100) * 30;
                  const next = weekAhead.days[i + 1];
                  const nx = (i + 1) * 32 + 16;
                  const ny = next ? 36 - (next.score / 100) * 30 : y;
                  const isToday = day.dateLocal === selectedDate;
                  return (
                    <g key={day.dateLocal}>
                      {next && (
                        <line x1={x} y1={y} x2={nx} y2={ny} stroke="#D4C8AE" strokeWidth="1.5" />
                      )}
                      <circle
                        cx={x} cy={y} r={isToday ? 5 : 3.5}
                        fill={day.score >= 65 ? "#5C7654" : day.score >= 45 ? "#B85A2C" : "#A8482F"}
                        stroke={isToday ? "#1A1612" : "none"}
                        strokeWidth={isToday ? 1.5 : 0}
                      />
                    </g>
                  );
                })}
              </svg>
              {/* Day labels */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {weekAhead.days.map((day) => (
                  <span key={day.dateLocal} style={{ fontSize: "0.62rem", color: "#A89D89", textAlign: "center", flex: 1 }}>
                    {new Date(day.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" })}
                  </span>
                ))}
              </div>
              {/* Best/easiest annotation */}
              {weekAhead.days.length > 0 && (() => {
                const sorted = [...weekAhead.days].sort((a, b) => b.score - a.score);
                const best = sorted[0];
                const easiest = sorted[sorted.length - 1];
                const label = (d: typeof best) => new Date(d.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                return (
                  <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#3D352B", lineHeight: 1.4 }}>
                    {lang === "ta" ? "சிறந்த நாள்" : "Best day"}{" "}
                    <strong style={{ color: "#5C7654" }}>{label(best)}</strong>
                    {" · "}
                    {lang === "ta" ? "எளிமையான மாலை" : "Easiest evening"}{" "}
                    <strong style={{ color: "#7A6F5E" }}>{label(easiest)}</strong>
                  </p>
                );
              })()}
            </>
          ) : (
            <p style={{ margin: 0, color: "#A89D89", fontSize: "0.82rem" }}>{t("guidance_empty", lang)}</p>
          )}
        </div>
      </div>

      {/* ── Remedy strip ── */}
      {personalDailyGuidance?.remedy && (
        <div style={{
          padding: "18px 24px",
          borderRadius: "14px",
          background: "#F0D9C4",
          border: "1px solid rgba(184,90,44,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
              {lang === "ta" ? "பரிகாரம் · இன்று" : "Remedy · Today"}
            </p>
            <p style={{ margin: 0, fontSize: "1rem", color: "#1A1612", fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}>
              {tLang(personalDailyGuidance.remedy, lang)}
            </p>
          </div>
          <button
            type="button"
            style={{
              padding: "9px 20px", borderRadius: "999px", border: "1.5px solid #1A1612",
              background: "#FFFFFF", color: "#1A1612", fontSize: "0.84rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              transition: "background 150ms ease",
            }}
          >
            {lang === "ta" ? "நினைவூட்டல் சேமி →" : "Save reminder →"}
          </button>
        </div>
      )}

      {/* ── Existing detailed sections (Snapshot, Chart, Guidance, Planets, Nakshatra) ── */}
      {/* Override dark-theme CSS vars so all Surface/Chip/Metric children read properly on cream */}
      <div style={{
        "--color-surface": "#FFFFFF",
        "--color-surface-2": "#FAF5EA",
        "--color-surface-3": "#EDE5D4",
        "--color-border": "#D4C8AE",
        "--color-text": "#1A1612",
        "--color-muted": "#5a4f42",
        "--color-accent": "#B85A2C",
        "--color-accent-muted": "rgba(184,90,44,0.12)",
        "--color-accent-secondary": "#5C7654",
        "--color-alert-critical": "#A8482F",
        "--color-alert-caution": "#B85A2C",
        "--color-positive": "#3a6b40",
        "background": "transparent",
        "display": "contents",
      } as React.CSSProperties}>

      {/* Daily snapshot (score breakdown, action) */}
      <DashboardDailySnapshot
        lang={lang}
        guidance={personalDailyGuidance}
        transit={personalTransit}
        sani={personalSani}
        panchangam={panchangam}
        birthProfile={personalChart?.birthProfile ?? null}
      />

      {/* Chart + Guidance two-column */}
      <div className="two-col">
        <Surface title={t("surface_chart_context", lang)}>
          {personalChart ? (
            <div className="surface__body">
              <div className="surface__headline">
                <span>{personalChartSummary?.displayName ?? personalChart.birthProfile.displayName}</span>
                <Chip tone="accent">
                  {personalChartSummary ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}` : personalChart.calculationVersion}
                </Chip>
              </div>
              <p className="surface__text">
                {personalChartSummary
                  ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${personalChartSummary.janmaNakshatra} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`
                  : t("chart_loading", lang)}
              </p>
              <div className="surface__metrics">
                <Metric label={t("label_birth_date", lang)} value={personalChart.birthProfile.birthDateLocal} hint={personalChart.birthProfile.birthPlace ?? personalChart.birthProfile.birthProfileId.slice(0, 8)} />
                <Metric label={t("label_lagnam", lang)} value={personalChart.lagna.rasiName ?? `Raasi ${personalChart.lagna.rasi}`} hint={`${personalChart.lagna.degreeInRasi.toFixed(2)}° · ${personalChart.lagna.nakshatraName} ${t("label_padam", lang)} ${personalChart.lagna.pada}`} tone="high" />
              </div>
              <JathagamKattam chart={personalChart} lang={lang} />
            </div>
          ) : (
            <p className="empty-state">{t("chart_no_profile", lang)}</p>
          )}
        </Surface>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Surface title={t("surface_guidance", lang)}>
            {personalDailyGuidance ? (
              <div className="surface__body">
                {personalDailyGuidance.tithiCard && (
                  <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(251,191,36,0.22)" }}>
                    <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕉 {t("tithi_card_label", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.tithiCard, lang)}</p>
                  </div>
                )}
                {personalDailyGuidance.contextInsight && (
                  <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>
                    <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 {t("context_insight_label", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.contextInsight, lang)}</p>
                  </div>
                )}
                <div className="surface__headline">
                  <span>{formatScoreLabel(personalDailyGuidance.score)}</span>
                  <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>{personalDailyGuidance.label}</Chip>
                </div>
                <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>
                <div className="surface__metrics">
                  <Metric label={t("label_best_time", lang)} value={bestWindow ? formatClockLabel(bestWindow.start) : ""} hint={bestWindow ? formatClockLabel(bestWindow.end) : ""} tone="high" />
                  <Metric label={t("label_caution_time", lang)} value={avoidWindow ? formatClockLabel(avoidWindow.start) : ""} hint={avoidWindow ? formatClockLabel(avoidWindow.end) : ""} tone="low" />
                  <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />
                </div>
                {personalDailyGuidance.reasons && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("why_this_prediction", lang)}</p>
                    {(["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const).map((key) => (
                      <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--color-muted)", minWidth: "84px", paddingTop: "2px" }}>{t(`reason_${key}` as Parameters<typeof t>[0], lang)}</span>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.4 }}>{tLang(personalDailyGuidance.reasons[key], lang)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!personalViewId && dailyGuidanceRange && (
                  <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("label_next_3_days", lang)}</p>
                    <div className="chip-row">
                      {dailyGuidanceRange.items.map((item) => {
                        const band = getScoreBand(item.score);
                        return (
                          <Chip key={item.dateLocal} tone={band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}>
                            {formatDateLabel(item.dateLocal)} {item.score}/100
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">{t("guidance_empty", lang)}</p>
            )}
          </Surface>

          <Surface title={t("surface_gochar", lang)}>
            {personalTransit && personalSani && panchangam ? (
              <div className="stack">
                <div className="surface__metrics">
                  <Metric label={t("label_chandrashtamam", lang)} value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)} hint={personalSani.confirmationSentence} tone={personalTransit.isChandrashtama ? "low" : "rest"} />
                  {personalSani.moonBasedCycle.isActive && <Metric label={t("label_sani_cycle", lang)} value={personalSani.moonBasedCycle.type ?? ""} hint={personalSani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />}
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{t("label_gochar_pos", lang)}</p>
                  <p className="surface__text">{t("label_janma_rasi_short", lang)} {personalTransit.janmaRasi} · {t("label_lagnam", lang)} {personalTransit.lagnaRasi}</p>
                  <div className="chip-row">
                    {personalTransit.transits.slice(0, 5).map((item) => (
                      <Chip key={item.graha}>{item.graha} · {item.currentRasi}</Chip>
                    ))}
                  </div>
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{t("label_panchangam", lang)}</p>
                  <p className="surface__text">{tWeekday(panchangam.vara.weekday, lang)} · {t("label_tithi", lang)} {panchangam.tithi.number} {tTithi(panchangam.tithi.name, lang)} · {tNakshatra(panchangam.nakshatra.name, lang)}</p>
                </div>
              </div>
            ) : <p className="empty-state">{t("gochar_empty", lang)}</p>}
          </Surface>
        </div>
      </div>

      {/* Planet table */}
      <Surface title={t("surface_planets", lang)}>
        {personalChart ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("col_graha", lang)}</th><th>{t("col_rasi", lang)}</th><th>{t("col_degree", lang)}</th>
                  <th>{t("col_nakshatra", lang)}</th><th>{t("col_pada", lang)}</th><th>{t("col_house", lang)}</th>
                  <th>{t("col_d9_rasi", lang)}</th><th>{t("col_special", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {personalChart.planets.map((planet) => (
                  <tr key={planet.graha}>
                    <td style={{ fontWeight: 600 }}><span style={{ color: DASHA_COLORS[planet.graha] ?? "#93c5fd", marginRight: "4px" }}>{GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}</span>{planet.graha}</td>
                    <td>{planet.rasiName}</td>
                    <td>{planet.degreeInRasi.toFixed(2)}°</td>
                    <td>{planet.nakshatraName}</td>
                    <td style={{ textAlign: "center" }}>{planet.pada}</td>
                    <td style={{ textAlign: "center" }}>{planet.houseFromLagna}</td>
                    <td>{RASI_NAMES[planet.d9Rasi] ?? planet.d9Rasi}</td>
                    <td className="table__flags">
                      {planet.isRetrograde ? <Chip tone="warning">{t("flag_vakra", lang)}</Chip> : null}
                      {planet.isCombust ? <Chip tone="warning">{t("flag_astam", lang)}</Chip> : null}
                      {planet.isVargottama ? <Chip tone="success">{t("flag_vargottamam", lang)}</Chip> : null}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid rgba(255,255,255,0.12)", opacity: 0.75 }}>
                  <td style={{ fontWeight: 600 }}><span style={{ color: "#e5b84d", marginRight: "4px" }}>ல</span>{t("label_lagnam", lang)}</td>
                  <td>{personalChart.lagna.rasiName}</td>
                  <td>{personalChart.lagna.degreeInRasi.toFixed(2)}°</td>
                  <td>{personalChart.lagna.nakshatraName}</td>
                  <td style={{ textAlign: "center" }}>{personalChart.lagna.pada}</td>
                  <td style={{ textAlign: "center" }}>1</td>
                  <td>–</td><td />
                </tr>
              </tbody>
            </table>
          </div>
        ) : <p className="empty-state">{t("planets_empty", lang)}</p>}
      </Surface>

      {/* Nakshatra card */}
      {nakshatraCard && (
        <Surface title={t("nakshatra_card_label", lang)}>
          <div className="surface__body">
            <div className="surface__headline">
              <span>{lang === "ta" ? nakshatraCard.nameTa : nakshatraCard.nameEn}</span>
              <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(nakshatraCard.rulingPlanet, lang)}</Chip>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "var(--color-muted)" }}>
              <span style={{ marginRight: "12px" }}>{t("nakshatra_deity", lang)}: <strong style={{ color: "var(--color-text)" }}>{lang === "ta" ? nakshatraCard.deityTa : nakshatraCard.deityEn}</strong></span>
              <span>{t("nakshatra_symbol", lang)}: <strong style={{ color: "var(--color-text)" }}>{lang === "ta" ? nakshatraCard.symbolTa : nakshatraCard.symbolEn}</strong></span>
            </p>
            <p className="surface__text">{lang === "ta" ? nakshatraCard.profile.ta : nakshatraCard.profile.en}</p>
            {nakshatraCard.strengths.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <p style={{ margin: "0 0 5px", fontSize: "0.68rem", fontWeight: 700, color: "#5C7654", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_strengths", lang)}</p>
                <div className="chip-row">{nakshatraCard.strengths.map((s) => <Chip key={s.en} tone="success">{lang === "ta" ? s.ta : s.en}</Chip>)}</div>
              </div>
            )}
            {nakshatraCard.cautions.length > 0 && (
              <div>
                <p style={{ margin: "0 0 5px", fontSize: "0.68rem", fontWeight: 700, color: "#B85A2C", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_cautions", lang)}</p>
                <div className="chip-row">{nakshatraCard.cautions.map((c) => <Chip key={c.en} tone="warning">{lang === "ta" ? c.ta : c.en}</Chip>)}</div>
              </div>
            )}
          </div>
        </Surface>
      )}

      </div>{/* end css-var override wrapper */}
    </div>
  );
}

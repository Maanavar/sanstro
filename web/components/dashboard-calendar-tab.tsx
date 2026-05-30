"use client";

import { useMemo, useState } from "react";

import { formatClockLabel, formatDateLabel, getScoreBand } from "@/lib/format";
import { t, tKarana, tLang, tNakshatra, tPlanetLord, tTithi, tWeekday, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyCalendarData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  SaniCycleData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

import { DASHA_COLORS, DashaTimeline } from "./dashboard-dasha";
import { DashboardDashaScrubber } from "./dashboard-dasha-scrubber";
import { DashboardLifeEvents } from "./dashboard-life-events";
import { Surface } from "./dashboard-ui";

type CalendarView = "panchangam" | "personal" | "family";

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "#A89D89",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  rust: "#A8482F",
  sage: "#5C7654",
} as const;

const RASI_NAMES_EN = ["", "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam"];
const NAKSHATRA_ORDER = [
  "ASWINI", "BHARANI", "KARTHIGAI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI",
  "PUNARPOOSAM", "POOSAM", "AYILYAM", "MAGAM", "POORAM", "UTHIRAM", "HASTHAM",
  "CHITHIRAI", "SWATHI", "VISAKAM", "ANUSHAM", "KETTAI", "MOOLAM", "POORADAM",
  "UTHIRADAM", "THIRUVONAM", "AVITTAM", "SADAYAM", "POORATTATHI", "UTHIRATTATHI", "REVATHI",
];

function bandTone(score: number) {
  const band = getScoreBand(score).tone;
  return {
    tone: band,
    color: band === "high" ? W.sage : band === "low" ? W.rust : W.terracotta,
    bg: band === "high" ? "#DCE4D2" : band === "low" ? "#F2D8CC" : "#F0D9C4",
  };
}

function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function moonRasiFromNakshatra(name: string): number {
  const idx = NAKSHATRA_ORDER.indexOf(name.toUpperCase());
  if (idx < 0) return 0;
  return Math.floor(idx / 2.25) + 1;
}

function chandrastamaRasi(moonRasi: number): number {
  if (!moonRasi) return 0;
  return ((moonRasi - 1 + 7) % 12) + 1;
}

function formatHeaderDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MiniScoreDial({ score, color }: { score: number; color: string }) {
  const size = 62;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx="31" cy="31" r={r} fill="none" stroke="#DDD5C4" strokeWidth="6" />
      <circle
        cx="31"
        cy="31"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 31 31)"
      />
      <text x="31" y="35" textAnchor="middle" style={{ fill: color, fontSize: "11px", fontWeight: 700, fontFamily: "'Inter',system-ui,sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

function DayTimeline({
  bestStart,
  bestEnd,
  avoidStart,
  avoidEnd,
}: {
  bestStart?: string;
  bestEnd?: string;
  avoidStart?: string;
  avoidEnd?: string;
}) {
  function toX(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const hrs = (h + (m ?? 0) / 60) - 6;
    if (hrs < 0 || hrs > 12) return null;
    return 40 + (hrs / 12) * 520;
  }

  const bx1 = toX(bestStart);
  const bx2 = toX(bestEnd);
  const ax1 = toX(avoidStart);
  const ax2 = toX(avoidEnd);

  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const t = Math.max(0, Math.min(1, (nowH - 6) / 12));
  const sunX = 40 + t * 520;
  const sunY = 160 - 2 * t * (1 - t) * 118;

  return (
    <div style={{ marginTop: "12px" }}>
      <svg viewBox="0 0 600 210" style={{ width: "100%", height: "auto", display: "block" }}>
        <path d="M40,160 Q300,40 560,160" fill="none" stroke={W.border} strokeWidth="2" />
        <rect x="40" y="157" width="520" height="4" rx="2" fill={W.borderLt} />
        {bx1 !== null && bx2 !== null && <rect x={Math.min(bx1, bx2)} y="154" width={Math.max(Math.abs(bx2 - bx1), 8)} height="9" rx="5" fill={W.sage} opacity={0.9} />}
        {ax1 !== null && ax2 !== null && <rect x={Math.min(ax1, ax2)} y="154" width={Math.max(Math.abs(ax2 - ax1), 8)} height="9" rx="5" fill={W.terracotta} opacity={0.88} />}
        {[40, 170, 300, 430, 560].map((x) => <line key={x} x1={x} y1="161" x2={x} y2="169" stroke={W.mutedLt} strokeWidth="2" />)}
        <circle cx={sunX} cy={sunY} r="8" fill={W.terracotta} />
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", marginTop: "4px", padding: "0 8px" }}>
        {["6a", "9a", "12p", "3p", "6p"].map((label) => (
          <span key={label} style={{ textAlign: "center", fontSize: "0.76rem", color: W.mutedLt, fontFamily: "'JetBrains Mono', monospace" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HoraRow({
  hora,
  lang,
  nowMinutes,
}: {
  hora: { index: number; lord: string; start: string; end: string };
  lang: Lang;
  nowMinutes: number;
}) {
  const color = DASHA_COLORS[hora.lord.toUpperCase()] ?? W.mutedLt;
  const start = parseHmToMinutes(hora.start);
  const end = parseHmToMinutes(hora.end);
  const running = nowMinutes >= start && nowMinutes < end;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "8px",
        padding: "9px 12px",
        borderRadius: "10px",
        background: running ? "#F8E4D2" : W.surface,
        border: `1px solid ${running ? "rgba(184,90,44,0.35)" : W.borderLt}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: "0.9rem", color: W.inkMid, fontWeight: running ? 700 : 600 }}>{tPlanetLord(hora.lord, lang)} {t("hora_word", lang)}</span>
      </div>
      <span style={{ fontSize: "0.82rem", color: W.muted }}>{formatClockLabel(hora.start)} - {formatClockLabel(hora.end)}</span>
    </div>
  );
}

export function CalendarTab({
  selectedDate,
  todayDate,
  panchangam,
  panchangamTimings,
  dailyGuidance,
  dailyGuidanceRange,
  familyCalendar,
  familyAggregate,
  chartSummary,
  chartData,
  transit,
  sani,
  dasha,
  dashaMaha,
  dashaAntar,
  chartId,
  hasBirthProfile,
  hasVault,
  lang,
  weekAhead,
  mode = "BALANCED",
  birthDisplayName,
  memberCharts,
  selectedMemberId,
  onSelectMember,
}: {
  selectedDate: string;
  todayDate: string;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  dailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  familyCalendar: FamilyCalendarData | null;
  familyAggregate: FamilyAggregateData | null;
  chartSummary: ChartSummaryData | null;
  chartData: ChartCalculateResponseData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  dasha: DashaTimelineResponseData | null;
  dashaMaha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  chartId: string | null;
  hasBirthProfile: boolean;
  hasVault: boolean;
  lang: Lang;
  weekAhead: WeekAheadData | null;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  birthDisplayName: string;
  memberCharts: Array<{ memberId: string; displayName: string }>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
}) {
  const [view, setView] = useState<CalendarView>("panchangam");
  const headerDate = formatHeaderDate(selectedDate, lang);
  const currentNowMinutes = selectedDate === todayDate ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  const tithiPaksha = panchangam
    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`
    : null;

  const panchangamMeta = panchangam
    ? `${tWeekday(panchangam.vara.weekday, lang)} · ${tithiPaksha ?? ""} · ${tNakshatra(panchangam.nakshatra.name, lang)}`
    : t("panja_empty", lang);

  const moonRasi = panchangam ? moonRasiFromNakshatra(panchangam.nakshatra.name) : 0;
  const chandrashtama = chandrastamaRasi(moonRasi);
  const moonRasiName = moonRasi ? RASI_NAMES_EN[moonRasi] : "";
  const chandraName = chandrashtama ? RASI_NAMES_EN[chandrashtama] : "";

  const significanceText = useMemo(() => {
    if (!panchangam) return "";
    return panchangam.festivals?.[0]?.name || panchangam.subhaMuhurtham?.reason || (lang === "ta" ? "இன்று அமைதியாக முன்னேறுங்கள்." : "Move steadily and keep the day intentional.");
  }, [panchangam, lang]);

  const dailyTone = dailyGuidance ? bandTone(dailyGuidance.score) : null;
  const familyTone = familyAggregate ? bandTone(familyAggregate.familyScore) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif", color: W.inkMid }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: W.terracotta }}>
            {lang === "ta" ? "கோசாரம் & நிகழ்வுகள்" : "Transits & Events"}
          </p>
          <h1 style={{ margin: "0 0 8px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 500, lineHeight: 1.05, color: W.ink, letterSpacing: "-0.03em" }}>
            {headerDate} — {lang === "ta" ? "Transits, Dasha & Events" : "Transits, Dasha & Events"}
          </h1>
          <p style={{ margin: 0, fontSize: "1.02rem", lineHeight: 1.6, color: W.muted, maxWidth: "70ch" }}>{panchangamMeta}</p>
        </div>

        <div style={{ display: "inline-flex", padding: "6px", borderRadius: "999px", background: W.surface, border: `1px solid ${W.border}` }}>
          {([
            ["panchangam", t("cal_panchangam", lang)],
            ["personal", t("cal_personal", lang)],
            ["family", t("cal_family", lang)],
          ] as [CalendarView, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "999px",
                padding: "10px 20px",
                background: view === key ? W.card : "transparent",
                color: view === key ? W.ink : W.muted,
                fontSize: "1.02rem",
                fontWeight: view === key ? 700 : 600,
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "panchangam" && (
        <>
          {!panchangam ? (
            <p className="empty-state">{t("panja_empty", lang)}</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
              <div style={{ borderRadius: "24px", border: `1px solid ${W.borderLt}`, background: W.card, padding: "22px 24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                  Day At A Glance
                </p>
                <h2 style={{ margin: "0 0 6px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.9rem, 3vw, 3rem)", color: W.ink, letterSpacing: "-0.025em", lineHeight: 1.08 }}>
                  {tTithi(panchangam.tithi.name, lang)}. {tNakshatra(panchangam.nakshatra.name, lang)}. {tYoga(panchangam.yoga.name, lang)}.
                </h2>
                <p style={{ margin: 0, fontSize: "1rem", color: W.muted }}>
                  Sunrise {formatClockLabel(panchangam.sunrise)}, sunset {formatClockLabel(panchangam.sunset)}.
                </p>

                <DayTimeline
                  bestStart={panchangam.kalam.nallaNeram?.[0]?.start}
                  bestEnd={panchangam.kalam.nallaNeram?.[0]?.end}
                  avoidStart={panchangam.kalam.rahuKalam.start}
                  avoidEnd={panchangam.kalam.rahuKalam.end}
                />

                <div style={{ marginTop: "14px", borderTop: `1px solid ${W.borderLt}`, paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Mandhi", tone: "warn", start: panchangam.kalam.mandhi.start, end: panchangam.kalam.mandhi.end },
                    { label: t("label_abhijit", lang), tone: "good", start: panchangam.abhijit.start, end: panchangam.abhijit.end },
                    ...(panchangam.kalam.nallaNeram ?? []).map((w) => ({ label: t("label_nalla_neram", lang), tone: "good", start: w.start, end: w.end })),
                    { label: t("label_yamagandam", lang), tone: "warn", start: panchangam.kalam.yamagandam.start, end: panchangam.kalam.yamagandam.end },
                    { label: t("label_kuligai", lang), tone: "warn", start: panchangam.kalam.kuligai.start, end: panchangam.kalam.kuligai.end },
                    { label: t("label_rahu_kalam", lang), tone: "warn", start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end },
                  ].map((row, idx) => (
                    <div
                      key={`${row.label}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "16px",
                        border: `1px solid ${W.borderLt}`,
                        background: row.tone === "good" ? "#DCE4D2" : "#F2D8CC",
                        color: row.tone === "good" ? W.sage : W.rust,
                        fontSize: "0.98rem",
                        fontWeight: 600,
                      }}
                    >
                      <span>{row.label}</span>
                      <span>{formatClockLabel(row.start)} - {formatClockLabel(row.end)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ borderRadius: "24px", border: `1px solid ${W.borderLt}`, background: W.card, padding: "22px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                    Panchangam · Five Limbs
                  </p>
                  {[
                    { key: "Vara", value: tWeekday(panchangam.vara.weekday, lang), hint: `${tPlanetLord(panchangam.vara.lord, lang)} ${t("lord_word", lang)}` },
                    { key: "Tithi", value: tTithi(panchangam.tithi.name, lang), hint: `${tithiPaksha ?? ""} · ${formatClockLabel(panchangam.tithi.endsAt)} ${t("until_word", lang)}` },
                    { key: "Nakshatra", value: tNakshatra(panchangam.nakshatra.name, lang), hint: `${t("label_padam", lang)} ${panchangam.nakshatra.pada} · ${formatClockLabel(panchangam.nakshatra.endsAt)} ${t("until_word", lang)}` },
                    { key: "Yoga", value: tYoga(panchangam.yoga.name, lang), hint: `Yoga ${panchangam.yoga.number}` },
                    { key: "Karana", value: tKarana(panchangam.karana.name, lang), hint: "—" },
                  ].map((row) => (
                    <div key={row.key} style={{ borderRadius: "22px", border: `1px solid ${W.border}`, background: W.surface, padding: "14px 18px", display: "grid", gridTemplateColumns: "120px 1fr auto", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.9rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>{row.key}</span>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "2rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{row.value}</p>
                        <p style={{ margin: 0, color: W.muted, fontSize: "0.98rem" }}>{row.hint}</p>
                      </div>
                      <span style={{ color: W.mutedLt, fontSize: "1rem", fontWeight: 700 }}>5L</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderRadius: "24px", border: `1px solid rgba(184,90,44,0.2)`, background: "#F8E4D2", padding: "20px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.terracotta, fontWeight: 700 }}>
                    Today's Significance
                  </p>
                  <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: W.inkMid }}>{significanceText}</p>
                  {chandraName && moonRasiName && (
                    <p style={{ margin: "10px 0 0", fontSize: "0.98rem", color: W.rust }}>
                      Chandrastamam today: {chandraName} (Moon in {moonRasiName}).
                    </p>
                  )}
                </div>

                {panchangam.hora.length > 0 && (
                  <div style={{ borderRadius: "24px", border: `1px solid ${W.borderLt}`, background: W.card, padding: "20px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>
                      Hora Table
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "330px", overflowY: "auto", paddingRight: "2px" }}>
                      {panchangam.hora.map((h) => (
                        <HoraRow key={h.index} hora={h} lang={lang} nowMinutes={currentNowMinutes} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {view === "personal" && (
        <>
          {!hasBirthProfile ? (
            <p className="empty-state">{t("cal_no_profile", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {memberCharts.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onSelectMember(null)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "999px",
                      border: "1.5px solid",
                      borderColor: selectedMemberId === null ? "#1A1612" : W.border,
                      background: selectedMemberId === null ? "#1A1612" : "transparent",
                      color: selectedMemberId === null ? "#F4EEE2" : W.muted,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    {birthDisplayName || "You"}
                  </button>
                  {memberCharts.map((mc) => (
                    <button
                      key={mc.memberId}
                      type="button"
                      onClick={() => onSelectMember(mc.memberId)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "999px",
                        border: "1.5px solid",
                        borderColor: selectedMemberId === mc.memberId ? "#1A1612" : W.border,
                        background: selectedMemberId === mc.memberId ? "#1A1612" : "transparent",
                        color: selectedMemberId === mc.memberId ? "#F4EEE2" : W.muted,
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      {mc.displayName}
                    </button>
                  ))}
                </div>
              )}

              {weekAhead && (
                <Surface title={t("week_ahead_label", lang)}>
                  <div className="surface__body">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontSize: "0.95rem", color: W.muted }}>
                        <span style={{ color: W.mutedLt }}>{t("week_dasha_theme", lang)}: </span>
                        {lang === "ta" ? weekAhead.dashaThemeTa : weekAhead.dashaThemeEn}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.95rem", color: W.muted }}>
                        {t("week_best_day", lang)} <strong style={{ color: W.sage }}>{formatDateLabel(weekAhead.bestDay)} · {weekAhead.bestDayScore}</strong>
                      </p>
                    </div>
                    <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(110px, 1fr))", gap: "10px", minWidth: "790px" }}>
                        {weekAhead.days.map((day) => {
                          const palette = bandTone(day.score);
                          const isBest = day.dateLocal === weekAhead.bestDay;
                          const wd = new Date(`${day.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                          const dn = new Date(`${day.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric" });
                          return (
                            <div key={day.dateLocal} style={{ borderRadius: "16px", border: `1px solid ${isBest ? `${W.sage}77` : W.border}`, background: isBest ? "#DCE4D2" : W.surface, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <p style={{ margin: 0, fontSize: "0.72rem", letterSpacing: "0.12em", color: W.mutedLt, textTransform: "uppercase", fontWeight: 700 }}>{wd}</p>
                              <p style={{ margin: 0, fontSize: "2.1rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{dn}</p>
                              <MiniScoreDial score={day.score} color={palette.color} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Surface>
              )}

              {dashaMaha && (
                <DashboardDashaScrubber
                  lang={lang}
                  mode={mode}
                  dashaMaha={dashaMaha}
                  todayDate={todayDate}
                />
              )}

              {dasha && (
                <Surface title={t("surface_dasha", lang)}>
                  <div className="surface__body">
                    <DashaTimeline
                      dasha={dashaMaha ?? dasha}
                      dashaAntar={dashaAntar}
                      today={selectedDate}
                      dashaSupport={dailyGuidance ? Math.min(100, Math.round(dailyGuidance.scoreBreakdown.dashaSupport / 0.2)) : 50}
                      lang={lang}
                      birthDateLocal={chartData?.birthProfile.birthDateLocal}
                      currentPeriodAction={dailyGuidance ? tLang(dailyGuidance.actionSuggestion, lang) : undefined}
                      currentPeriodCaution={dailyGuidance ? tLang(dailyGuidance.cautionSuggestion, lang) : undefined}
                      mode={mode}
                    />
                  </div>
                </Surface>
              )}

              <DashboardLifeEvents lang={lang} chartId={chartId} yearsAhead={5} />

              {dailyGuidance && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
                  <div style={{ borderRadius: "18px", border: `1px solid ${W.borderLt}`, background: "#E7D3BE", padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 5px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: W.terracotta }}>
                      {chartSummary?.displayName ?? t("personal_kicker", lang)} · {headerDate}
                    </p>
                    <p style={{ margin: "0 0 2px", fontSize: "4.1rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>
                      {dailyGuidance.score}<span style={{ fontSize: "1.8rem", color: W.muted }}>/100</span>
                    </p>
                    <p style={{ margin: "0 0 8px", fontSize: "0.95rem", color: dailyTone?.color, fontWeight: 700 }}>{dailyGuidance.label}</p>
                    <p style={{ margin: "0 0 10px", fontSize: "0.98rem", lineHeight: 1.55, color: W.inkMid }}>{tLang(dailyGuidance.text, lang)}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {dailyGuidance.bestWindows.slice(0, 2).map((w, idx) => (
                        <div key={`${w.start}-${idx}`} style={{ borderRadius: "999px", padding: "7px 12px", background: "#DCE4D2", color: W.sage, fontSize: "0.84rem", fontWeight: 600 }}>
                          Best {formatClockLabel(w.start)} - {formatClockLabel(w.end)}
                        </div>
                      ))}
                      {dailyGuidance.cautionWindows.slice(0, 1).map((w, idx) => (
                        <div key={`${w.start}-${idx}`} style={{ borderRadius: "999px", padding: "7px 12px", background: "#F2D8CC", color: W.rust, fontSize: "0.84rem", fontWeight: 600 }}>
                          Caution {formatClockLabel(w.start)} - {formatClockLabel(w.end)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderRadius: "18px", border: `1px solid ${W.borderLt}`, background: W.card, padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: W.mutedLt }}>
                      Score Breakdown
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {[
                        [t("label_moon_transit", lang), dailyGuidance.scoreBreakdown.moonTransit],
                        [t("label_dasha_support", lang), dailyGuidance.scoreBreakdown.dashaSupport],
                        [t("label_panchangam", lang), dailyGuidance.scoreBreakdown.panchangam],
                        [t("label_gochar_pos", lang), dailyGuidance.scoreBreakdown.gocharSupport],
                      ].map(([label, value]) => (
                        <div key={String(label)} style={{ borderRadius: "12px", border: `1px solid ${W.border}`, background: W.surface, padding: "10px 12px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: W.mutedLt, fontWeight: 700 }}>{label}</p>
                          <p style={{ margin: 0, fontSize: "2.2rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: W.mutedLt, fontWeight: 700 }}>
                          {t("cal_action", lang)}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.94rem", color: W.inkMid, lineHeight: 1.5 }}>{tLang(dailyGuidance.actionSuggestion, lang)}</p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: W.terracotta, fontWeight: 700 }}>
                          {t("cal_caution_sugg", lang)}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.94rem", color: W.inkMid, lineHeight: 1.5 }}>{tLang(dailyGuidance.cautionSuggestion, lang)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dailyGuidance?.reasons && (
                <div style={{ borderRadius: "18px", border: `1px solid ${W.borderLt}`, background: W.card, padding: "16px 18px" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: W.mutedLt }}>
                    {t("why_this_prediction", lang)}
                  </p>
                  {(["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const).map((key) => (
                    <div key={key} style={{ borderTop: `1px solid ${W.borderLt}`, padding: "9px 0", display: "grid", gridTemplateColumns: "minmax(130px, 170px) 1fr", gap: "10px" }}>
                      <p style={{ margin: 0, color: W.muted, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                        {t(`reason_${key}` as Parameters<typeof t>[0], lang)}
                      </p>
                      <p style={{ margin: 0, color: W.inkMid, fontSize: "0.92rem", lineHeight: 1.5 }}>
                        {tLang(dailyGuidance.reasons[key], lang)}
                      </p>
                    </div>
                  ))}
                  {dailyGuidance.remedy && (
                    <div style={{ marginTop: "10px", borderRadius: "12px", border: "1px solid rgba(184,90,44,0.25)", background: "#F8E4D2", padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: W.terracotta }}>
                        {t("remedy_label", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.92rem", color: W.inkMid, lineHeight: 1.55 }}>{tLang(dailyGuidance.remedy, lang)}</p>
                    </div>
                  )}
                </div>
              )}

              {dailyGuidanceRange && (
                <Surface title={t("cal_3days", lang)}>
                  <div className="surface__body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
                    {dailyGuidanceRange.items.map((item) => {
                      const palette = bandTone(item.score);
                      return (
                        <div key={item.dateLocal} style={{ borderRadius: "14px", border: `1px solid ${W.borderLt}`, background: W.surface, padding: "12px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.muted }}>{formatDateLabel(item.dateLocal)}</p>
                          <p style={{ margin: "0 0 2px", fontSize: "2rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{item.score}<span style={{ fontSize: "1rem", color: W.muted }}>/100</span></p>
                          <p style={{ margin: 0, fontSize: "0.82rem", color: palette.color, fontWeight: 700 }}>{item.label}</p>
                          {item.bestWindows[0] && <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: W.muted }}>Best {formatClockLabel(item.bestWindows[0].start)} - {formatClockLabel(item.bestWindows[0].end)}</p>}
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              )}

              {sani?.moonBasedCycle.isActive && (
                <Surface title={t("cal_sani", lang)}>
                  <div className="surface__body">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "10px" }}>
                      <div style={{ borderRadius: "12px", border: `1px solid rgba(168,72,47,0.25)`, background: "#F2D8CC", padding: "10px 12px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: W.rust, fontWeight: 700 }}>{t("cal_sani_pos", lang)}</p>
                        <p style={{ margin: "0 0 2px", fontSize: "1.3rem", fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{sani.moonBasedCycle.type ?? "—"}</p>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: W.muted }}>{sani.moonBasedCycle.supportiveLabel ?? ""}</p>
                      </div>
                      <div style={{ borderRadius: "12px", border: `1px solid rgba(168,72,47,0.25)`, background: "#FAF5EA", padding: "10px 12px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: W.muted, fontWeight: 700 }}>{t("cal_sani_rasi", lang)}</p>
                        <p style={{ margin: "0 0 2px", fontSize: "1.3rem", fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{sani.saturnRasi}</p>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: W.muted }}>Moon {sani.positionFromMoon}th house</p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: W.muted }}>{sani.confirmationSentence}</p>
                  </div>
                </Surface>
              )}
            </div>
          )}
        </>
      )}

      {view === "family" && (
        <>
          {!hasVault ? (
            <p className="empty-state">{t("cal_no_vault", lang)}</p>
          ) : !familyAggregate ? (
            <p className="empty-state">{t("cal_loading", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderRadius: "24px", border: `1px solid ${W.borderLt}`, background: "#E7D3BE", padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: W.terracotta }}>
                    {(chartSummary?.displayName ?? birthDisplayName)} family · {headerDate}
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: "5rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>
                    {familyAggregate.familyScore}<span style={{ fontSize: "2rem", color: W.muted }}>/100</span>
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: "1rem", color: familyTone?.color, fontWeight: 700 }}>{familyAggregate.familyLabel}</p>
                  <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: W.inkMid }}>{tLang(familyAggregate.summary, lang)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "290px" }}>
                  {familyAggregate.bestFamilyWindows.slice(0, 1).map((w) => (
                    <div key={`${w.start}-${w.end}`} style={{ borderRadius: "999px", background: "#DCE4D2", color: W.sage, padding: "10px 14px", fontSize: "0.95rem", fontWeight: 700 }}>
                      {tPlanetLord("VENUS", lang)} Hora {formatClockLabel(w.start)} - {formatClockLabel(w.end)}
                    </div>
                  ))}
                  {familyAggregate.avoidForFamilyDecisions.slice(0, 1).map((w) => (
                    <div key={`${w.start}-${w.end}`} style={{ borderRadius: "999px", background: "#F2D8CC", color: W.rust, padding: "10px 14px", fontSize: "0.95rem", fontWeight: 700 }}>
                      Avoid {formatClockLabel(w.start)} - {formatClockLabel(w.end)}
                    </div>
                  ))}
                </div>
              </div>

              <Surface title="Family Score Breakdown">
                <div className="surface__body">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
                    {[
                      ["Mean score", familyAggregate.aggregateBreakdown.meanScore.toFixed(0), "/100"],
                      ["Support need", `${familyAggregate.aggregateBreakdown.supportNeedIndex}`, "0-100"],
                      ["Decision readiness", `${familyAggregate.aggregateBreakdown.decisionReadinessIndex}`, "0-100"],
                      ["Members", `${familyAggregate.members.length}`, "in vault"],
                    ].map(([label, value, hint]) => (
                      <div key={label} style={{ borderRadius: "18px", border: `1px solid ${W.border}`, background: W.surface, padding: "16px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>{label}</p>
                        <p style={{ margin: "0 0 2px", fontSize: "3.8rem", lineHeight: 1, fontFamily: "'Fraunces', Georgia, serif", color: W.ink }}>{value}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: W.muted }}>{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Surface>

              <Surface title={t("cal_member_scores", lang)}>
                <div className="surface__body">
                  {familyAggregate.members.map((m) => {
                    const palette = bandTone(m.individualScore);
                    const initial = (m.displayName || "M").trim().charAt(0).toUpperCase();
                    const rel = chartData?.birthProfile.displayName === m.displayName ? "Self" : "";
                    return (
                      <div key={m.familyMemberId} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "5px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#EACBA9", color: W.terracotta, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                              {initial}
                            </span>
                            <div>
                              <p style={{ margin: 0, fontSize: "1.05rem", color: W.ink, fontWeight: 700 }}>{m.displayName} {rel ? <span style={{ color: W.muted, letterSpacing: "0.16em", fontWeight: 600, fontSize: "0.86rem", textTransform: "uppercase" }}>{rel}</span> : null}</p>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: "2.1rem", fontFamily: "'Fraunces', Georgia, serif", color: palette.color, lineHeight: 1 }}>{m.individualScore}/100</p>
                        </div>
                        <div style={{ height: "10px", borderRadius: "999px", background: "#DDD5C4", overflow: "hidden" }}>
                          <div style={{ width: `${m.individualScore}%`, height: "100%", background: palette.color, borderRadius: "999px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Surface>

              {familyCalendar && (
                <Surface title={t("cal_7days", lang)}>
                  <div className="surface__body">
                    <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: "10px", minWidth: "860px" }}>
                        {familyCalendar.items.map((item) => {
                          const palette = bandTone(item.familyScore);
                          const wd = new Date(`${item.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                          const dn = new Date(`${item.dateLocal}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric" });
                          const isSelected = item.dateLocal === selectedDate;
                          return (
                            <div key={item.dateLocal} style={{ borderRadius: "22px", border: `2px solid ${isSelected ? palette.color : W.border}`, background: W.surface, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <p style={{ margin: 0, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: W.muted, fontWeight: 700 }}>{wd}</p>
                              <p style={{ margin: "0 0 2px", fontSize: "3rem", fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1, color: W.ink }}>{dn}</p>
                              <MiniScoreDial score={item.familyScore} color={palette.color} />
                              <p style={{ margin: 0, fontSize: "0.8rem", color: palette.color, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{item.familyLabel}</p>
                              {item.bestFamilyWindows[0] && (
                                <p style={{ margin: 0, fontSize: "0.8rem", color: W.muted }}>Best {formatClockLabel(item.bestFamilyWindows[0].start)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Surface>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

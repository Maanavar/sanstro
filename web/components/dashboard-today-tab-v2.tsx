"use client";

// ── Today tab V2 — "Daily briefing" redesign ─────────────────────────────
// Preview lives at /dashboard/v2 (classic stays at /dashboard).
// Same props contract as DashboardPersonalTab; every v1 section is preserved,
// reorganised into three altitude bands:
//   1. Briefing  — greeting, verdict, live "right now" window, do/don't, day timeline
//   2. Your world — family pulse, life areas, panchangam, remedy, week ahead, dasa
//   3. Deep dive — chart & planets, score snapshot, vargas, classical timing, birth star

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SkeletonDashboardCard, SkeletonDashaTimeline, SkeletonChartPanel, SkeletonMetricStrip } from "@/components/skeleton";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { formatClockLabel, formatDateLabel, scoreColor, SCORE_HIGH, SCORE_MID } from "@/lib/format";
import { gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t, tLang, tTithi, tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  CharaDashaData,
  DailyGuidanceData,
  KalamSlot,
  LifeAreaData,
  NotificationPreferenceData,
  PanchangamDailyResponseData,
  SolarReturnData,
} from "@/lib/types";

import { GRAHA_ABBR, JathagamKattam, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { PeyarchiBanner } from "./peyarchi-banner";
import { Button, Chip, ConfidenceBadge, Metric, Surface } from "./dashboard-ui";
import { AlertBanner } from "./alert-banner";
import { DashboardActivityTimingCard } from "./dashboard-activity-timing-card";
import { CollapsibleSection } from "./collapsible-section";
import { VargasPanel } from "./dashboard-vargas-panel";
import { MorningGuidanceCard } from "./morning-guidance-card";
import { PrasnaWidget } from "./dashboard-prasna-widget";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { ShareCardButton } from "./dashboard-share-card";
import { ThirukanithamBadge } from "./thirukanitham-badge";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { ChandrashtamaCard, type DashboardPersonalTabProps } from "./dashboard-personal-tab";
import { useStreak } from "@/hooks/useStreak";

// ── Score factor metadata (mirrors PersonalHero breakdown) ──
const SCORE_CHIP_KEYS = ["moonTransit", "gocharSupport", "dashaSupport", "panchangam", "personalCautions", "remedialActionSupport"] as const;
type ScoreChipKey = typeof SCORE_CHIP_KEYS[number];
const SCORE_CHIP_META: Record<ScoreChipKey, { max: number; labelEn: string; labelTa: string; descEn: string; descTa: string }> = {
  moonTransit:           { max: 28, labelEn: "Moon transit",    labelTa: "சந்திர நகர்வு",        descEn: "Moon's position relative to your natal Moon today",              descTa: "இன்று சந்திரன் உங்கள் ஜாதக சந்திரனிலிருந்து எந்த இடத்தில் உள்ளார்" },
  gocharSupport:         { max: 24, labelEn: "Gochar transits", labelTa: "கோசார ஆதரவு",          descEn: "Today's transiting planets interacting with your chart",         descTa: "இன்றைய கோசார கிரகங்கள் உங்கள் ஜாதகத்தை எவ்வாறு பாதிக்கின்றன" },
  dashaSupport:          { max: 19, labelEn: "Dasa support",    labelTa: "தசை ஆதரவு",            descEn: "Current Mahadasha & Antardasha lord strength",                    descTa: "நடப்பு மகாதசை மற்றும் அந்தர்தசை ஆதரவு" },
  panchangam:            { max: 14, labelEn: "Panchangam",      labelTa: "பஞ்சாங்கம்",           descEn: "Tithi, Yoga & Karana quality today",                              descTa: "இன்றைய திதி, யோகம், கரணம் தரம்" },
  personalCautions:      { max:  9, labelEn: "Personal safety", labelTa: "தனிப்பட்ட பாதுகாப்பு",  descEn: "Lower when Saturn cycle, Chandrashtama or combustion is active", descTa: "சனி சுழற்சி, சந்திராஷ்டமம் அல்லது கிரக அஸ்தமனம் உள்ளபோது குறையும்" },
  remedialActionSupport: { max:  6, labelEn: "Remedial",        labelTa: "பரிகார ஆதரவு",         descEn: "Bonus when a personal hora window is available today",           descTa: "தனிப்பட்ட ஹோரா சாளரம் கிடைக்கும்போது கூடுதல் மதிப்பெண்" },
};

const GUIDANCE_REASON_KEYS = ["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const;

// ── Time helpers ─────────────────────────────────────────────

/** "HH:MM[:SS]" → minutes from midnight, or null. */
function toMin(time: string | null | undefined): number | null {
  if (!time) return null;
  const parts = time.split(":");
  const h = Number.parseInt(parts[0] ?? "", 10);
  const m = Number.parseInt(parts[1] ?? "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** true when now ∈ [start, end), tolerating windows that cross midnight. */
function inWindow(startMin: number, endMin: number, now: number): boolean {
  if (endMin >= startMin) return now >= startMin && now < endMin;
  return now >= startMin || now < endMin;
}

function untilLabel(minutes: number, lang: Lang): string {
  const mins = Math.max(1, minutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (lang === "ta") {
    if (h <= 0) return `${m} நிமிடத்தில்`;
    return m > 0 ? `${h} மணி ${m} நிமி.` : `${h} மணி நேரத்தில்`;
  }
  if (h <= 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

type WindowTone = "good" | "caution" | "neutral";

type DayWindow = {
  key: string;
  tone: WindowTone;
  /** Personal windows (from daily guidance) rank above panchangam windows. */
  personal: boolean;
  labelTa: string;
  labelEn: string;
  detail?: string;
  startMin: number;
  endMin: number;
  start: string;
  end: string;
};

function buildDayWindows(
  panchangam: PanchangamDailyResponseData | null,
  guidance: DailyGuidanceData | null,
  lang: Lang,
): DayWindow[] {
  const windows: DayWindow[] = [];
  const push = (
    key: string, tone: WindowTone, personal: boolean,
    labelTa: string, labelEn: string,
    start: string | undefined, end: string | undefined, detail?: string,
  ) => {
    const s = toMin(start); const e = toMin(end);
    if (s === null || e === null) return;
    windows.push({ key, tone, personal, labelTa, labelEn, detail, startMin: s, endMin: e, start: start!, end: end! });
  };

  if (panchangam) {
    push("rahu", "caution", false, "ராகு காலம்", "Rahu Kalam", panchangam.kalam.rahuKalam.start, panchangam.kalam.rahuKalam.end);
    push("yama", "caution", false, "எமகண்டம்", "Yamagandam", panchangam.kalam.yamagandam.start, panchangam.kalam.yamagandam.end);
    push("kuligai", "neutral", false, "குளிகை", "Kuligai", panchangam.kalam.kuligai.start, panchangam.kalam.kuligai.end);
    panchangam.kalam.nallaNeram?.forEach((slot: KalamSlot, idx: number) => {
      const periodLabel = gowriPeriodLabel(slot.period, lang);
      const category = gowriCategoryLabel(slot.name, lang);
      const purpose = gowriPurposeLabel(slot.name, lang);
      const detail = [periodLabel, category, purpose].filter(Boolean).join(" · ");
      push(`nalla-${idx}`, "good", false, "நல்ல நேரம்", "Nalla Neram", slot.start, slot.end, detail || undefined);
    });
    if (!panchangam.abhijit.isRestrictedByWeekday) {
      push("abhijit", "good", false, "அபிஜித் முகூர்த்தம்", "Abhijit Muhurtham", panchangam.abhijit.start, panchangam.abhijit.end);
    }
  }
  if (guidance) {
    guidance.bestWindows.forEach((w, idx) => {
      push(`best-${idx}`, "good", true, "உங்கள் சிறந்த நேரம்", "Your best window", w.start, w.end);
    });
    guidance.cautionWindows.forEach((w, idx) => {
      push(`avoid-${idx}`, "caution", true, "கவனம் தேவை", "Personal caution", w.start, w.end);
    });
  }
  return windows.sort((a, b) => a.startMin - b.startMin);
}

/** Highest-priority active window: personal > caution > good > neutral. */
function pickActiveWindow(windows: DayWindow[], now: number): DayWindow | null {
  const active = windows.filter((w) => inWindow(w.startMin, w.endMin, now));
  if (active.length === 0) return null;
  const rank = (w: DayWindow) =>
    (w.personal ? 8 : 0) + (w.tone === "caution" ? 4 : w.tone === "good" ? 2 : 1);
  return active.sort((a, b) => rank(b) - rank(a))[0] ?? null;
}

function greetingFor(hour: number, lang: Lang): string {
  if (lang === "ta") {
    if (hour < 4) return "இரவு வணக்கம்";
    if (hour < 12) return "காலை வணக்கம்";
    if (hour < 16) return "மதிய வணக்கம்";
    if (hour < 19) return "மாலை வணக்கம்";
    return "இரவு வணக்கம்";
  }
  if (hour < 4) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 16) return "Good afternoon";
  if (hour < 19) return "Good evening";
  return "Good night";
}

function daypartFor(hour: number): "dawn" | "day" | "dusk" | "night" {
  if (hour >= 5 && hour < 10) return "dawn";
  if (hour >= 10 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "dusk";
  return "night";
}

// ── Big score ring ──────────────────────────────────────────
function ScoreRingXL({ score }: { score: number }) {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" className="t2-ring" aria-hidden="true">
      <circle cx="74" cy="74" r={r} fill="none" stroke="var(--panel-tan-light)" strokeWidth="9" />
      <circle
        cx="74" cy="74" r={r}
        fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 74 74)"
      />
    </svg>
  );
}

// ── Day timeline (segmented bar, 06:00 → 21:00 so the six hour
//    labels land exactly on the space-between grid) ────────────
const BAR_START = 6 * 60;
const BAR_END = 21 * 60;

function pct(min: number): number {
  const clamped = Math.min(Math.max(min, BAR_START), BAR_END);
  return ((clamped - BAR_START) / (BAR_END - BAR_START)) * 100;
}

function DayTimelineBar({ windows, isToday, lang }: { windows: DayWindow[]; isToday: boolean; lang: Lang }) {
  const now = nowMinutes();
  return (
    <div className="t2-timeline">
      <div className="t2-timeline__track">
        {windows.map((w) => {
          const left = pct(w.startMin);
          const width = Math.max(pct(w.endMin) - left, 0.8);
          return (
            <span
              key={w.key}
              className={`t2-timeline__seg t2-timeline__seg--${w.tone}${w.personal ? " t2-timeline__seg--personal" : ""}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${lang === "ta" ? w.labelTa : w.labelEn} ${formatClockLabel(w.start)}–${formatClockLabel(w.end)}`}
            />
          );
        })}
        {isToday && now >= BAR_START && now <= BAR_END && (
          <span className="t2-timeline__now" style={{ left: `${pct(now)}%` }} aria-hidden="true" />
        )}
      </div>
      <div className="t2-timeline__hours" aria-hidden="true">
        {["6", "9", "12", "3", "6", "9"].map((h, i) => (
          <span key={`${h}-${i}`}>{h}{i < 3 ? (i === 2 ? " pm" : " am") : " pm"}</span>
        ))}
      </div>
      <div className="t2-timeline__legend">
        <span><i className="t2-dot t2-dot--good" />{lang === "ta" ? "நல்ல நேரம்" : "Good time"}</span>
        <span><i className="t2-dot t2-dot--personal" />{lang === "ta" ? "உங்கள் சிறந்த நேரம்" : "Your best window"}</span>
        <span><i className="t2-dot t2-dot--caution" />{lang === "ta" ? "தவிர்க்கவும்" : "Avoid"}</span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────

type TodayTabV2Props = DashboardPersonalTabProps & {
  onGoToCalendar?: () => void;
};

export function DashboardTodayTabV2({
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
  personalChartExplanation,
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
  nakshatraCard,
  peyarchiReport,
  lifeAreas,
  onGoToFamily,
  onGoToJournal,
  onGoToCalendar,
  onOpenPrasna,
  showPrasna = false,
  onClosePrasna,
  dasha,
  dashaMaha = null,
  dashaAntar,
}: TodayTabV2Props) {
  const { days: streakDays } = useStreak();
  const isTa = lang === "ta";
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const isChandrashtama = personalTransit?.isChandrashtama ?? false;
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const avoidWindow = personalDailyGuidance?.cautionWindows[0] ?? null;
  const score = personalDailyGuidance?.score ?? null;
  const activeChartId = personalChart?.chartId ?? personalChartSummary?.chartId ?? "";
  const isToday = selectedDate === todayDate;
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  // Live clock — re-evaluates the "right now" window every 30s
  const [nowMin, setNowMin] = useState(() => nowMinutes());
  useEffect(() => {
    const id = setInterval(() => setNowMin(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dayWindows = useMemo(
    () => buildDayWindows(panchangam, personalDailyGuidance, lang),
    [panchangam, personalDailyGuidance, lang],
  );
  const activeWindow = isToday ? pickActiveWindow(dayWindows, nowMin) : null;
  const nextWindow = isToday ? dayWindows.find((w) => w.startMin > nowMin) ?? null : null;
  const currentHora = useMemo(() => {
    if (!isToday || !panchangam?.hora?.length) return null;
    return panchangam.hora.find((h) => {
      const s = toMin(h.start); const e = toMin(h.end);
      return s !== null && e !== null && inWindow(s, e, nowMin);
    }) ?? null;
  }, [isToday, panchangam, nowMin]);

  const hour = new Date().getHours();
  const greeting = greetingFor(hour, lang);
  const daypart = daypartFor(hour);

  // Chara dasha + solar return (same lazy fetch as classic)
  const [charaDasha, setCharaDasha] = useState<CharaDashaData | null>(null);
  const [solarReturn, setSolarReturn] = useState<SolarReturnData | null>(null);
  useEffect(() => {
    if (!activeChartId) {
      setCharaDasha(null);
      setSolarReturn(null);
      return;
    }
    const returnYear = Number.parseInt((selectedDate || "").slice(0, 4), 10) || new Date().getFullYear();
    const controller = new AbortController();
    const { signal } = controller;
    void apiFetchJson<{ success: boolean; data: CharaDashaData }>(`/api/v1/charts/${activeChartId}/chara-dasha`, { signal })
      .then((res) => { if (!signal.aborted) setCharaDasha(res.data ?? null); })
      .catch(() => { if (!signal.aborted) setCharaDasha(null); });
    void apiFetchJson<{ success: boolean; data: SolarReturnData }>(
      `/api/v1/charts/${activeChartId}/solar-return?year=${returnYear}`, { signal }
    )
      .then((res) => { if (!signal.aborted) setSolarReturn(res.data ?? null); })
      .catch(() => { if (!signal.aborted) setSolarReturn(null); });
    return () => controller.abort();
  }, [activeChartId, selectedDate]);

  // Morning reminder (same behaviour as classic remedy strip)
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  async function handleSaveReminder() {
    if (savingReminder) return;
    setSavingReminder(true);
    setReminderMessage(null);
    try {
      const current = await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications");
      const nextChannel = current.data.notification_channel === "none" ? "both" : current.data.notification_channel;
      const nextTime = current.data.morningAlertTime || "06:00";
      await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationChannel: nextChannel,
          morningAlertEnabled: true,
          morningAlertTime: nextTime,
        }),
      });
      setReminderMessage(isTa ? "காலை நினைவூட்டல் சேமிக்கப்பட்டது." : "Morning reminder saved.");
    } catch (error) {
      const message = readErrorMessage(error);
      setReminderMessage(isTa ? `சேமிக்க முடியவில்லை: ${message}` : `Could not save reminder: ${message}`);
    } finally {
      setSavingReminder(false);
    }
  }

  async function downloadPersonalChartPdf() {
    if (!activeChartId) return;
    const asOf = selectedDate || new Date().toISOString().slice(0, 10);
    const response = await fetch(`/api/backend/api/v1/charts/${activeChartId}/export/pdf?asOf=${asOf}&lang=${lang}`, {
      credentials: "include",
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jadhagam-${activeChartId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const chandrashtamaWindowsSummary = (() => {
    const windows = panchangam?.chandrashtamamToday?.janmaNakshatraWindows ?? [];
    if (!windows.length) return "";
    return windows
      .map((w) => `${tNakshatra(w.name, lang)} ${formatClockLabel(w.start)}–${formatClockLabel(w.end)}`)
      .join(", ");
  })();

  const dateLabel = isToday
    ? new Date().toLocaleDateString(isTa ? "ta-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })
    : formatDateLabel(selectedDate);

  const guidanceHeadline = personalDailyGuidance
    ? tLang(personalDailyGuidance.text, lang).split(".")[0] + "."
    : "";

  const validationStatus = personalChartSummary?.chartValidationStatus ?? null;

  if (busyPersonal && !personalDailyGuidance && !personalChart) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <SkeletonMetricStrip />
        <SkeletonDashboardCard lines={4} showIcon />
        <SkeletonDashaTimeline />
        <SkeletonChartPanel />
      </div>
    );
  }

  // Owner score substitution for family pulse (mirrors household strip logic)
  const ownerBpId = personalChart?.birthProfile.birthProfileId ?? null;

  return (
    <div className="t2-root" data-daypart={daypart}>

      {/* Panchangam glance — collapsed by default, tap to expand */}
      {panchangam && (
        <div className="t2-card t2-panchangam t2-panchangam--top">
          <CollapsibleSection
            title={
              <span className="t2-panchangam__title">
                {t("today_panchangam", lang)}
                <span className="t2-panchangam__title-hint">
                  {" · "}{tNakshatra(panchangam.nakshatra.name, lang)} · {tTithi(panchangam.tithi.name, lang)}
                </span>
              </span>
            }
            defaultOpen={false}
          >
            <div className="t2-panchangam__body">
              <div className="t2-panchangam__facts">
                {[
                  { label: t("label_tithi", lang), value: `${panchangam.tithi.number} ${tTithi(panchangam.tithi.name, lang)}`, hint: `${t("label_ends_at", lang)} ${formatClockLabel(panchangam.tithi.endsAt)}` },
                  { label: t("label_nakshatra", lang), value: `${tNakshatra(panchangam.nakshatra.name, lang)} ${t("label_padam", lang)} ${panchangam.nakshatra.pada}`, hint: `${t("label_ends_at", lang)} ${formatClockLabel(panchangam.nakshatra.endsAt)}` },
                  { label: isTa ? "யோகம்" : "Yogam", value: astroText(panchangam.yoga.name), hint: `${t("label_ends_at", lang)} ${formatClockLabel(panchangam.yoga.endsAt)}` },
                  { label: isTa ? "கரணம்" : "Karanam", value: astroText(panchangam.karana.name), hint: "" },
                  { label: t("label_sunrise", lang), value: formatClockLabel(panchangam.sunrise), hint: "" },
                  { label: t("label_sunset", lang), value: formatClockLabel(panchangam.sunset), hint: "" },
                  { label: isTa ? "சூலம்" : "Soolam", value: astroText(panchangam.soolam.direction), hint: astroText(panchangam.soolam.parigaram) },
                  { label: isTa ? "சந்திர நிலை" : "Moon phase", value: astroText(panchangam.moonPhaseLabel), hint: "" },
                ].map((row) => (
                  <div key={row.label} className="t2-fact">
                    <span className="t2-fact__label">{row.label}</span>
                    <span className="t2-fact__value">{row.value}</span>
                    {row.hint && <span className="t2-fact__hint">{row.hint}</span>}
                  </div>
                ))}
              </div>
              <div className="t2-panchangam__chips">
                <Chip tone="accent">{t("label_rahu_kalam", lang)} {formatClockLabel(panchangam.kalam.rahuKalam.start)}–{formatClockLabel(panchangam.kalam.rahuKalam.end)}</Chip>
                <Chip tone="warning">{t("label_yamagandam", lang)} {formatClockLabel(panchangam.kalam.yamagandam.start)}–{formatClockLabel(panchangam.kalam.yamagandam.end)}</Chip>
                <Chip>{t("label_kuligai", lang)} {formatClockLabel(panchangam.kalam.kuligai.start)}–{formatClockLabel(panchangam.kalam.kuligai.end)}</Chip>
                {panchangam.kalam.nallaNeram?.map((w, idx) => {
                  const periodLabel = gowriPeriodLabel(w.period, lang);
                  const category = gowriCategoryLabel(w.name, lang);
                  const purpose = gowriPurposeLabel(w.name, lang);
                  const detail = [periodLabel, category, purpose].filter(Boolean).join(" · ");
                  return (
                    <Chip key={`${w.slot}-${w.start}-${idx}`} tone="success">
                      {t("label_nalla_neram", lang)}{detail ? ` (${detail})` : ""} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}
                    </Chip>
                  );
                })}
                {panchangamTimings && !panchangam.abhijit.isRestrictedByWeekday && (
                  <Chip tone="success">{t("label_abhijit", lang)} {formatClockLabel(panchangam.abhijit.start)}–{formatClockLabel(panchangam.abhijit.end)}</Chip>
                )}
              </div>
              {personalDailyGuidance?.tithiCard && (
                <p className="t2-panchangam__tithi-card">
                  <span className="t2-kicker">🕉 {t("tithi_card_label", lang)}</span>
                  {tLang(personalDailyGuidance.tithiCard, lang)}
                </p>
              )}
              {onGoToCalendar && (
                <button type="button" className="t2-link-btn" onClick={onGoToCalendar}>
                  {isTa ? "முழு நாட்காட்டி →" : "Full calendar →"}
                </button>
              )}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ══ Band 1 · Briefing ══════════════════════════════════ */}

      {/* Greeting header */}
      <header className="t2-greet">
        <div className="t2-greet__main">
          <p className="t2-greet__hello">
            {greeting}{displayName ? `, ${displayName}` : ""}
          </p>
          <p className="t2-greet__date">
            {dateLabel}
            {panchangam?.tamilDate && (
              <span className="t2-greet__tamil-date"> · {tLang(panchangam.tamilDate, lang)}</span>
            )}
            {panchangam && (
              <span className="t2-greet__pnch">
                {" · "}{tNakshatra(panchangam.nakshatra.name, lang)} · {tTithi(panchangam.tithi.name, lang)}
              </span>
            )}
          </p>
        </div>
        <div className="t2-greet__side">
          {streakDays > 1 && (
            <span className="t2-streak" title={isTa ? "தொடர்ச்சியான நாட்கள்" : "Daily streak"}>
              <span aria-hidden="true">🔥</span> {isTa ? `${streakDays} நாள்` : `${streakDays} days`}
            </span>
          )}
          {memberCharts.length > 0 && (
            <div className="t2-member-switch" role="group" aria-label={isTa ? "யாருடைய நாள்" : "Whose day"}>
              <button
                type="button"
                className={`t2-member-switch__chip${!personalViewId ? " is-active" : ""}`}
                onClick={() => onSelectPersonalView(null)}
              >
                {isTa ? "நீங்கள்" : "You"}
              </button>
              {memberCharts.map((mc) => (
                <button
                  key={mc.memberId}
                  type="button"
                  className={`t2-member-switch__chip${personalViewId === mc.memberId ? " is-active" : ""}`}
                  onClick={() => onSelectPersonalView(mc.memberId)}
                >
                  {mc.displayName}
                </button>
              ))}
            </div>
          )}
          <Link href="/dashboard" className="t2-preview-pill" title={isTa ? "பழைய வடிவமைப்பு" : "Back to classic design"}>
            {isTa ? "புதிய முகப்பு · முன்னோட்டம்" : "New Today · preview"}
          </Link>
        </div>
      </header>

      {/* Alerts float to the top when active */}
      {(isChandrashtama || ambientAlerts.length > 0 || peyarchiUpcoming.length > 0) && (
        <div className="t2-alerts">
          {isChandrashtama && (
            <ChandrashtamaCard
              lang={lang}
              chandrashtamaEnds={personalDailyGuidance?.chandrashtamaEnds ?? null}
              descriptionTa={null}
              descriptionEn={null}
              windowsSummary={chandrashtamaWindowsSummary}
            />
          )}
          {ambientAlerts.slice(0, 2).map((alert) => (
            <AlertBanner key={alert.alertId} variant="caution"
              message={tLang(alert.title, lang) + " — " + tLang(alert.message, lang)} />
          ))}
          <PeyarchiBanner events={peyarchiUpcoming} lang={lang} peyarchiReport={peyarchiReport} />
        </div>
      )}

      {/* Hero briefing */}
      {personalDailyGuidance ? (
        <section className="t2-hero" aria-label={isTa ? "இன்றைய சுருக்கம்" : "Today's briefing"}>
          <div className="t2-hero__verdict">
            <div className="t2-hero__score">
              <div className="t2-hero__ring-wrap">
                <ScoreRingXL score={score ?? 0} />
                <div className="t2-hero__ring-num">
                  <span className="t2-hero__ring-value" style={{ color: score !== null ? scoreColor(score) : SCORE_MID }}>{score}</span>
                  <span className="t2-hero__ring-max">/100</span>
                </div>
              </div>
              <div className="t2-hero__verdict-copy">
                <div className="t2-hero__badge-row">
                  <ThirukanithamBadge size="sm" />
                  {personalDailyGuidance.confidence && (
                    <ConfidenceBadge level={personalDailyGuidance.confidence} reason={personalDailyGuidance.confidenceReason} lang={lang} />
                  )}
                </div>
                <h1 className="t2-hero__label" style={{ color: score !== null ? scoreColor(score) : SCORE_MID }}>
                  {personalDailyGuidance.label}
                </h1>
                <p className="t2-hero__headline">{guidanceHeadline}</p>
              </div>
            </div>
            <p className="t2-hero__text">{tLang(personalDailyGuidance.text, lang)}</p>
            {personalDailyGuidance.contextInsight && (
              <p className="t2-hero__context">
                <span className="t2-kicker">📋 {t("context_insight_label", lang)}</span>
                {tLang(personalDailyGuidance.contextInsight, lang)}
              </p>
            )}
            {personalDailyGuidance.nakshatraPerspective && (
              <p className="t2-hero__nak-note">{astroText(tLang(personalDailyGuidance.nakshatraPerspective, lang))}</p>
            )}

            {/* Why this score — full breakdown + reasons, one tap away */}
            <div className="t2-hero__why">
              <CollapsibleSection title={<span className="t2-why-title">{t("why_this_prediction", lang)}</span>} defaultOpen={false}>
                <div className="t2-why-grid">
                  {personalDailyGuidance.scoreBreakdown && SCORE_CHIP_KEYS.map((k) => {
                    const value = (personalDailyGuidance.scoreBreakdown as Record<string, number>)[k] ?? 0;
                    const meta = SCORE_CHIP_META[k];
                    const pctVal = Math.round(Math.max(0, value) / meta.max * 100);
                    const color = scoreColor(value / meta.max * 100);
                    return (
                      <div key={k} className="t2-why-chip">
                        <p className="t2-kicker">{isTa ? meta.labelTa : meta.labelEn}</p>
                        <p className="t2-why-chip__value"><span style={{ color }}>{value}</span> <span>/ {meta.max}</span></p>
                        <div className="t2-why-chip__track"><div style={{ width: `${pctVal}%`, background: color }} /></div>
                        <p className="t2-why-chip__desc">{isTa ? meta.descTa : meta.descEn}</p>
                      </div>
                    );
                  })}
                </div>
                {personalDailyGuidance.reasons && (
                  <div className="t2-why-reasons">
                    {GUIDANCE_REASON_KEYS.map((key) => (
                      <div key={key} className="t2-why-reason">
                        <span>{t(`reason_${key}` as Parameters<typeof t>[0], lang)}</span>
                        <p>{tLang(personalDailyGuidance.reasons[key], lang)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {personalDailyGuidance.pratyantarNarrative && (
                  <div className="t2-why-reason t2-why-reason--pratyantar">
                    <span>{isTa ? "பிரத்யந்தர தசை" : "Pratyantar signal"}</span>
                    <p>{tLang(personalDailyGuidance.pratyantarNarrative, lang)}</p>
                  </div>
                )}
              </CollapsibleSection>
            </div>
          </div>

          {/* Right now panel */}
          <div className="t2-now">
            {isToday ? (
              <>
                <p className="t2-now__kicker">
                  <span className={`t2-now__dot t2-now__dot--${activeWindow?.tone ?? "neutral"}`} aria-hidden="true" />
                  {isTa ? "இப்போது" : "Right now"}
                </p>
                {activeWindow ? (
                  <>
                    <p className={`t2-now__title t2-now__title--${activeWindow.tone}`}>
                      {isTa ? activeWindow.labelTa : activeWindow.labelEn}
                    </p>
                    <p className="t2-now__sub">
                      {activeWindow.tone === "caution"
                        ? (isTa ? "முக்கிய காரியங்களை தள்ளிப்போடுங்கள்" : "Hold important starts")
                        : activeWindow.tone === "good"
                          ? (isTa ? "முக்கிய காரியங்களுக்கு ஏற்ற நேரம்" : "A good stretch to act")
                          : (isTa ? "சாதாரண நேரம்" : "Neutral period")}
                      {" · "}
                      {formatClockLabel(activeWindow.end)} {isTa ? "வரை" : "ends"} ({untilLabel(activeWindow.endMin - nowMin, lang)})
                    </p>
                    {activeWindow.detail && <p className="t2-now__detail">{activeWindow.detail}</p>}
                  </>
                ) : (
                  <>
                    <p className="t2-now__title t2-now__title--neutral">
                      {isTa ? "பொது நேரம்" : "Open time"}
                    </p>
                    <p className="t2-now__sub">
                      {isTa ? "சிறப்பு சாளரம் எதுவும் இல்லை — வழக்கம் போல் தொடருங்கள்" : "No special window active — carry on as usual"}
                    </p>
                  </>
                )}
                {nextWindow && (
                  <p className="t2-now__next">
                    <span className="t2-kicker">{isTa ? "அடுத்து" : "Next"}</span>
                    <span className={`t2-now__next-label t2-now__next-label--${nextWindow.tone}`}>
                      {isTa ? nextWindow.labelTa : nextWindow.labelEn}
                    </span>
                    {formatClockLabel(nextWindow.start)} ({untilLabel(nextWindow.startMin - nowMin, lang)})
                  </p>
                )}
                {currentHora && (
                  <p className="t2-now__hora">
                    <span className="t2-kicker">{isTa ? "தற்போதைய ஹோரா" : "Current hora"}</span>
                    <strong style={{ color: DASHA_COLORS[currentHora.lord] ?? "var(--panel-brand)" }}>
                      {tPlanetLord(currentHora.lord, lang)}
                    </strong>
                    <span className="t2-now__hora-until">{formatClockLabel(currentHora.end)} {isTa ? "வரை" : "until"}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="t2-now__kicker">
                  <span className="t2-now__dot t2-now__dot--neutral" aria-hidden="true" />
                  {formatDateLabel(selectedDate)}
                </p>
                <p className="t2-now__title t2-now__title--neutral">
                  {isTa ? "நாள் திட்டம்" : "Day plan"}
                </p>
                <p className="t2-now__sub">
                  {isTa ? "இந்த நாளுக்கான நேர சாளரங்கள் கீழே" : "Time windows for this day, below"}
                </p>
                {isToday === false && onDateChange && (
                  <button type="button" className="t2-link-btn" onClick={() => onDateChange(todayDate)}>
                    {isTa ? "இன்றுக்கு திரும்பு →" : "Back to today →"}
                  </button>
                )}
              </>
            )}

            {/* Do / Don't */}
            <div className="t2-dodont">
              <div className="t2-dodont__row t2-dodont__row--do">
                <span className="t2-dodont__mark" aria-hidden="true">✓</span>
                <div>
                  <p className="t2-dodont__text">{tLang(personalDailyGuidance.actionSuggestion, lang)}</p>
                  {bestWindow && (
                    <p className="t2-dodont__time">{formatClockLabel(bestWindow.start)}–{formatClockLabel(bestWindow.end)}</p>
                  )}
                </div>
              </div>
              <div className="t2-dodont__row t2-dodont__row--dont">
                <span className="t2-dodont__mark" aria-hidden="true">✕</span>
                <div>
                  <p className="t2-dodont__text">{tLang(personalDailyGuidance.cautionSuggestion, lang)}</p>
                  {avoidWindow && (
                    <p className="t2-dodont__time">{formatClockLabel(avoidWindow.start)}–{formatClockLabel(avoidWindow.end)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Day timeline spans both columns */}
          <div className="t2-hero__timeline">
            <DayTimelineBar windows={dayWindows} isToday={isToday} lang={lang} />
          </div>
        </section>
      ) : (
        <section className="t2-hero t2-hero--empty">
          <div>
            <h1 className="t2-hero__label" style={{ color: "var(--panel-earth-dark)" }}>
              {displayName ? (isTa ? `${displayName} — உங்கள் நாள்` : `${displayName}'s day`) : (isTa ? "உங்கள் நாள்" : "Your day")}
            </h1>
            <p className="t2-hero__text">{t("guidance_empty", lang)}</p>
            {!birthProfileId && (
              <Button variant="primary" onClick={onOpenEditProfile}>
                {isTa ? "ஜாதக விவரம் சேர்" : "Add birth details"}
              </Button>
            )}
          </div>
        </section>
      )}

      {/* ══ Band 2 · Your world ════════════════════════════════ */}
      <div className="t2-section-head">
        <h2>{isTa ? "உங்கள் உலகம்" : "Your world"}</h2>
        <span className="t2-section-head__rule" aria-hidden="true" />
      </div>

      <div className="t2-world-grid">
        {/* Family pulse */}
        {familyAggregate && familyAggregate.members.length > 0 && (() => {
          const fs = familyAggregate.familyScore;
          const membersWithScores = familyAggregate.members.map((m) => {
            const isOwner = ownerBpId !== null && m.birthProfileId === ownerBpId;
            const displayScore = isOwner && !personalViewId && personalDailyGuidance?.score != null
              ? personalDailyGuidance.score
              : m.individualScore;
            return { ...m, displayScore, isOwner };
          });
          const needsCare = [...membersWithScores].sort((a, b) => a.displayScore - b.displayScore)[0];
          return (
            <div className="t2-card t2-family">
              <div className="t2-card__head">
                <p className="t2-kicker">{isTa ? "குடும்பம் இன்று" : "Family today"}</p>
                <span className="t2-family__score" style={{ color: scoreColor(fs) }}>{fs}</span>
              </div>
              <div className="t2-family__members">
                {membersWithScores.map((m) => (
                  <span key={m.familyMemberId} className="t2-family__member">
                    <span className="t2-family__member-name">{m.isOwner ? (isTa ? "நீங்கள்" : "You") : m.displayName}</span>
                    <span className="t2-family__member-score" style={{ color: scoreColor(m.displayScore) }}>{m.displayScore}</span>
                  </span>
                ))}
              </div>
              {needsCare && needsCare.displayScore < 50 && (
                <p className="t2-family__care">
                  <span aria-hidden="true">♥</span>{" "}
                  {isTa
                    ? `${needsCare.isOwner ? "உங்களுக்கு" : `${needsCare.displayName}க்கு`} இன்று கூடுதல் அன்பு தேவை`
                    : `${needsCare.isOwner ? "You" : needsCare.displayName} may need extra care today`}
                </p>
              )}
              {familyAggregate.summary && (
                <p className="t2-family__summary">{tLang(familyAggregate.summary, lang)}</p>
              )}
              {onGoToFamily && (
                <button type="button" className="t2-link-btn" onClick={onGoToFamily}>
                  {isTa ? "குடும்ப பக்கம் →" : "Family view →"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Life-area pulse */}
        {lifeAreas?.areas && lifeAreas.areas.length > 0 && (
          <div className="t2-card">
            <p className="t2-kicker">{isTa ? "வாழ்க்கை பகுதிகள்" : "Life areas"}</p>
            <div className="t2-areas">
              {lifeAreas.areas.slice(0, 5).map((area: LifeAreaData) => {
                const areaScore = Math.round(area.score);
                return (
                  <div key={area.area} className="t2-area">
                    <span className="t2-area__label">{isTa ? area.label.ta : area.label.en}</span>
                    <div className="t2-area__track">
                      <div style={{ width: `${areaScore}%`, background: scoreColor(areaScore) }} />
                    </div>
                    <span className="t2-area__score" style={{ color: scoreColor(areaScore) }}>{areaScore}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week ahead — clickable days */}
        <div className="t2-card">
          <p className="t2-kicker">{t("today_week_ahead", lang)}</p>
          {weekAhead && weekAhead.days.length > 0 ? (
            <>
              <div className="t2-week">
                {weekAhead.days.map((day) => {
                  const isSelected = day.dateLocal === selectedDate;
                  const dayName = new Date(day.dateLocal + "T12:00:00").toLocaleDateString(isTa ? "ta-IN" : "en-IN", { weekday: "short" });
                  return (
                    <button
                      key={day.dateLocal}
                      type="button"
                      className={`t2-week__day${isSelected ? " is-selected" : ""}`}
                      onClick={() => onDateChange?.(day.dateLocal)}
                      title={`${formatDateLabel(day.dateLocal)} · ${day.score}/100`}
                    >
                      <span className="t2-week__dayname">{dayName}</span>
                      <span className="t2-week__score" style={{ color: scoreColor(day.score) }}>{day.score}</span>
                      <span className="t2-week__bar"><i style={{ height: `${Math.max(day.score, 8)}%`, background: scoreColor(day.score) }} /></span>
                      {day.isChandrashtama && <span className="t2-week__flag" title="Chandrashtama">☾</span>}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const sorted = [...weekAhead.days].sort((a, b) => b.score - a.score);
                const best = sorted[0];
                if (!best) return null;
                const label = new Date(best.dateLocal + "T12:00:00").toLocaleDateString(isTa ? "ta-IN" : "en-IN", { weekday: "long" });
                return (
                  <p className="t2-week__note">
                    {isTa ? "சிறந்த நாள்" : "Best day"}: <strong style={{ color: SCORE_HIGH }}>{label}</strong>
                    {weekAhead.dashaThemeEn || weekAhead.dashaThemeTa
                      ? <> · {isTa ? weekAhead.dashaThemeTa : weekAhead.dashaThemeEn}</>
                      : null}
                  </p>
                );
              })()}
              {!personalViewId && dailyGuidanceRange && dailyGuidanceRange.items.length > 0 && (
                <div className="t2-week__range">
                  <span className="t2-kicker">{t("label_next_3_days", lang)}</span>
                  {dailyGuidanceRange.items.map((item) => (
                    <span key={item.dateLocal} className="t2-week__range-chip" style={{ color: scoreColor(item.score) }}>
                      {formatDateLabel(item.dateLocal)} {item.score}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="t2-empty">{t("guidance_empty", lang)}</p>
          )}
        </div>

        {/* Dasa position + emotional weather */}
        <div className="t2-card">
          <p className="t2-kicker">{isTa ? "தசை நிலை" : "Dasa position"}</p>
          {personalChartSummary ? (
            <>
              <div className="t2-dasa">
                {[
                  { label: isTa ? "தசை" : "Dasa", value: personalChartSummary.currentMahadasha },
                  { label: isTa ? "புக்தி" : "Bhukti", value: personalChartSummary.currentAntardasha },
                  { label: isTa ? "அந்தரம்" : "Antaram", value: dashaMaha?.current?.pratyantardasha?.lord ?? null },
                ].map(({ label, value }) => value && (
                  <div key={label} className="t2-dasa__cell">
                    <span className="t2-dasa__label">{label}</span>
                    <span className="t2-dasa__value" style={{ color: DASHA_COLORS[value] ?? "var(--panel-earth-dark)" }}>
                      {tPlanetLord(value, lang)}
                    </span>
                  </div>
                ))}
              </div>
              {personalDailyGuidance?.emotionalWeather && (
                <div className="t2-weather">
                  {([
                    { labelTa: "உணர்வு நிலை", labelEn: "Emotional tone", key: "toneText" as const },
                    { labelTa: "உடல் போக்கு", labelEn: "Physical tendency", key: "physicalTendencyText" as const },
                    { labelTa: "சிறந்த பயன்பாடு", labelEn: "Best use of day", key: "bestUseOfDayText" as const },
                  ]).map((field) => {
                    const value = personalDailyGuidance.emotionalWeather?.[field.key];
                    if (!value) return null;
                    return (
                      <div key={field.key} className="t2-weather__row">
                        <span>{isTa ? field.labelTa : field.labelEn}</span>
                        <p>{tLang(value, lang)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="t2-empty">{t("chart_loading", lang)}</p>
          )}
        </div>
      </div>

      {/* Remedy of the day */}
      {personalDailyGuidance?.remedy && (
        <div className="t2-remedy">
          <div className="t2-remedy__copy">
            <p className="t2-kicker t2-kicker--brand">{isTa ? "பரிகாரம் · இன்று" : "Remedy · Today"}</p>
            <p className="t2-remedy__text">{tLang(personalDailyGuidance.remedy, lang)}</p>
          </div>
          <div className="t2-remedy__action">
            <button
              type="button"
              className="t2-btn-solid"
              onClick={() => void handleSaveReminder()}
              disabled={savingReminder}
            >
              {savingReminder
                ? (isTa ? "சேமிக்கிறது…" : "Saving…")
                : (isTa ? "நினைவூட்டல் சேமி" : "Save reminder")}
            </button>
            {reminderMessage && (
              <p className="t2-remedy__msg" style={{ color: reminderMessage.includes("Could not") || reminderMessage.includes("முடியவில்லை") ? "var(--planet-saturn)" : "var(--chart-d9-active)" }}>
                {reminderMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="t2-quick">
        {onGoToJournal && (
          <button type="button" className="t2-btn-solid" onClick={onGoToJournal}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {isTa ? "தருணம் பதிவு" : "Log moment"}
          </button>
        )}
        {onOpenPrasna && (
          <Button variant="ghost" onClick={onOpenPrasna}>
            {isTa ? "ப்ரஸ்ன கேள்வி கேளுங்கள்" : "Ask a horary question"}
          </Button>
        )}
        {activeChartId && (
          <>
            <ShareCardButton chartId={activeChartId} cardType="NAKSHATRA" lang={lang} label={isTa ? "நட்சத்திர அட்டை பகிர்" : "Share Birth Star Card"} />
            <ShareCardButton chartId={activeChartId} cardType="DAILY_VIBE" lang={lang} date={selectedDate} label={isTa ? "இன்றைய வைப் பகிர்" : "Share Today's Vibe"} />
          </>
        )}
      </div>

      {/* ══ Band 3 · Deep dive ═════════════════════════════════ */}
      <div className="t2-section-head">
        <h2>{isTa ? "ஆழ்ந்த பார்வை" : "Deep dive"}</h2>
        <span className="t2-section-head__rule" aria-hidden="true" />
        <div className="t2-section-head__tools">
          {validationStatus && (() => {
            const { confidence, matchCount, totalChecked } = validationStatus;
            const color = confidence === "HIGH" ? "var(--chart-d9-active)" : confidence === "MEDIUM" ? "var(--panel-brand)" : confidence === "LOW" ? "var(--planet-saturn)" : "var(--color-faint)";
            const icon = confidence === "HIGH" ? "✓" : confidence === "UNVALIDATED" ? "—" : "⚠";
            const label = confidence === "HIGH"
              ? (isTa ? `உயர் நம்பகம் — ${matchCount}/${totalChecked}` : `High confidence — ${matchCount}/${totalChecked}`)
              : confidence === "MEDIUM"
              ? (isTa ? `நடுத்தர நம்பகம் — ${matchCount}/${totalChecked}` : `Moderate — ${matchCount}/${totalChecked}`)
              : confidence === "LOW"
              ? (isTa ? `குறைவான நம்பகம் — ${matchCount}/${totalChecked}` : `Low confidence — ${matchCount}/${totalChecked}`)
              : (isTa ? "நிகழ்வுகள் பதிவு இல்லை" : "No life events on record");
            return (
              <span className="t2-validation" style={{ color, background: `color-mix(in srgb, ${color} 10%, transparent)`, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                <span aria-hidden="true">{icon}</span> {label}
              </span>
            );
          })()}
          <button
            type="button"
            onClick={() => onRefreshPersonal()}
            disabled={!birthProfileId || busyPersonal}
            className="t2-btn-quiet"
          >
            {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh", lang)}
          </button>
          {activeChartId && (
            <button type="button" className="t2-btn-quiet" onClick={() => void downloadPersonalChartPdf()}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {isTa ? "PDF பதிவிறக்கம்" : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Cream-surface variable override for Surface/Chip/Metric children */}
      <div className="t2-deep" style={{
        "--color-surface": "var(--chart-cell-default)",
        "--color-surface-2": "var(--panel-cream)",
        "--color-surface-3": "var(--chart-cell-selected)",
        "--color-border": "var(--panel-tan)",
        "--color-text": "var(--panel-earth-dark)",
        "--color-muted": "var(--panel-mid-earth)",
        "--color-accent": "var(--panel-brand)",
        "--color-accent-muted": "var(--ring-brand)",
        "--color-accent-secondary": "var(--chart-d9-active)",
        "--color-alert-critical": "var(--planet-saturn)",
        "--color-alert-caution": "var(--panel-brand)",
        "--color-positive": "var(--chart-d9-active-dark)",
      } as React.CSSProperties}>

        {/* Timing details */}
        <CollapsibleSection
          title={<span className="t2-deep-title">{isTa ? "நேர விவரங்கள் & கோச்சாரம்" : "Timing & transits"}</span>}
          defaultOpen={false}
        >
          <div className="t2-deep-body">
            {activeChartId && (
              <DashboardActivityTimingCard
                chartId={activeChartId}
                lang={lang}
                selectedDate={selectedDate}
                onDateChange={onDateChange}
              />
            )}
            {personalTransit && personalSani && panchangam && (
              <Surface title={t("surface_gochar", lang)}>
                <div className="stack">
                  <div className="surface__metrics">
                    <Metric
                      label={t("label_chandrashtamam", lang)}
                      value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)}
                      hint={personalTransit.isChandrashtama && chandrashtamaWindowsSummary
                        ? chandrashtamaWindowsSummary
                        : personalSani.confirmationSentence}
                      tone={personalTransit.isChandrashtama ? "low" : "rest"}
                    />
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
                </div>
              </Surface>
            )}
          </div>
        </CollapsibleSection>

        {/* Chart & planets */}
        <CollapsibleSection
          title={<span className="t2-deep-title">{isTa ? "ஜாதக கட்டம் & கிரகங்கள்" : "Birth chart & planets"}</span>}
          defaultOpen={false}
        >
          <div className="t2-deep-body">
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
                      ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${astroText(personalChartSummary.janmaNakshatra)} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`
                      : t("chart_loading", lang)}
                  </p>
                  <div className="surface__metrics">
                    <Metric label={t("label_birth_date", lang)} value={personalChart.birthProfile.birthDateLocal} hint={personalChart.birthProfile.birthPlace ?? personalChart.birthProfile.birthProfileId.slice(0, 8)} />
                    <Metric label={t("label_lagnam", lang)} value={personalChart.lagna.rasiName ?? `Raasi ${personalChart.lagna.rasi}`} hint={`${personalChart.lagna.degreeInRasi.toFixed(2)}° · ${astroText(personalChart.lagna.nakshatraName)} ${t("label_padam", lang)} ${personalChart.lagna.pada}`} tone="high" />
                  </div>
                  <JathagamKattam chart={personalChart} lang={lang} />
                </div>
              ) : (
                <p className="empty-state">{t("chart_no_profile", lang)}</p>
              )}
            </Surface>

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
                          <td style={{ fontWeight: 600 }}><span style={{ color: DASHA_COLORS[planet.graha] ?? "var(--color-accent-secondary)", marginRight: "var(--space-1)" }}>{GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}</span>{planet.graha}</td>
                          <td>{planet.rasiName}</td>
                          <td>{planet.degreeInRasi.toFixed(2)}°</td>
                          <td>{astroText(planet.nakshatraName)}</td>
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
                      <tr style={{ borderTop: "1px solid var(--veil-white-12)", opacity: 0.75 }}>
                        <td style={{ fontWeight: 600 }}><span style={{ color: "var(--chart-amber)", marginRight: "var(--space-1)" }}>ல</span>{t("label_lagnam", lang)}</td>
                        <td>{personalChart.lagna.rasiName}</td>
                        <td>{personalChart.lagna.degreeInRasi.toFixed(2)}°</td>
                        <td>{astroText(personalChart.lagna.nakshatraName)}</td>
                        <td style={{ textAlign: "center" }}>{personalChart.lagna.pada}</td>
                        <td style={{ textAlign: "center" }}>1</td>
                        <td>–</td><td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : <p className="empty-state">{t("planets_empty", lang)}</p>}

              {personalChart && (
                <div style={{ marginTop: "var(--space-4)" }}>
                  <ChartExplanationPanel
                    lang={lang}
                    chart={personalChart}
                    explanation={personalChartExplanation}
                    summary={personalChartSummary}
                    transit={personalTransit}
                    sani={personalSani}
                    peyarchiUpcoming={peyarchiUpcoming}
                    dasha={dasha}
                    dashaAntar={dashaAntar}
                  />
                </div>
              )}
            </Surface>
          </div>
        </CollapsibleSection>

        {/* Divisional charts */}
        {personalChart && (
          <CollapsibleSection
            title={<span className="t2-deep-title">{isTa ? "வர்க்க கட்டங்கள் (D1–D60)" : "Divisional charts (D1–D60)"}</span>}
            defaultOpen={false}
          >
            <div className="t2-deep-body t2-deep-body--panel">
              <VargasPanel
                lang={lang}
                vargas={personalChart.vargas}
                d1Planets={Object.fromEntries(personalChart.planets.map(p => [p.graha, p.rasi]))}
                bhavaChalit={personalChart.bhavaChalit}
                vargaReliability={personalChart.vargaReliability}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Classical timing */}
        {(charaDasha || solarReturn) && (
          <CollapsibleSection
            title={<span className="t2-deep-title">{isTa ? "பாரம்பரிய கால நிர்ணயம்" : "Classical timing"}</span>}
            defaultOpen={false}
          >
            <div className="t2-deep-body">
              {charaDasha && (
                <div className="t2-classical">
                  <p className="t2-kicker">{isTa ? "ஜைமினி சார தசை" : "Jaimini Chara Dasha"}</p>
                  <p className="t2-classical__desc">
                    {isTa
                      ? "இது ராசி அடிப்படையிலான தசை. திருமணம், தொழில் மாற்றம் போன்ற நிகழ்வுகளின் நேரச் சிக்னலை காட்டும்."
                      : "This sign-based dasha is used to time life-event periods such as marriage and career transitions."}
                  </p>
                  {charaDasha.currentPeriod && (
                    <div className="t2-classical__current">
                      <span className="t2-kicker">{isTa ? "தற்போதைய சார தசை" : "Current Chara Dasha"}</span>
                      <strong>{charaDasha.currentPeriod.rasi_name}</strong>
                      <span>{charaDasha.currentPeriod.start_date} – {charaDasha.currentPeriod.end_date}</span>
                    </div>
                  )}
                  <div className="t2-classical__list">
                    {charaDasha.periods.map((period) => (
                      <div key={`${period.rasi}-${period.start_date}`} className={`t2-classical__row${charaDasha.currentPeriod?.rasi === period.rasi ? " is-current" : ""}`}>
                        <span>{period.rasi_name}</span>
                        <span>{period.years} {isTa ? "ஆண்டுகள்" : "yrs"} · {period.start_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {solarReturn && (
                <div className="t2-classical">
                  <p className="t2-kicker">{isTa ? `${solarReturn.returnYear} ஆண்டு தாஜகா` : `${solarReturn.returnYear} Annual chart`}</p>
                  <div className="t2-classical__grid">
                    <div className="t2-fact">
                      <span className="t2-fact__label">{isTa ? "வருட லக்னம்" : "SR Lagna"}</span>
                      <span className="t2-fact__value">
                        {solarReturn.srLagnaRasiName}
                        {solarReturn.lagnaMatchesNatal && <em className="t2-fact__tag">{isTa ? "நட்டாள்போல்" : "Same as natal"}</em>}
                      </span>
                    </div>
                    <div className="t2-fact">
                      <span className="t2-fact__label">{isTa ? "முந்தா" : "Muntha"}</span>
                      <span className="t2-fact__value">{solarReturn.munthaRasiName}</span>
                      <span className="t2-fact__hint">{isTa ? "சூரிய நீளம்" : "Sun longitude"}: {solarReturn.sunLongAtReturn.toFixed(4)}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Birth star */}
        {nakshatraCard && (
          <CollapsibleSection
            title={<span className="t2-deep-title">{t("nakshatra_card_label", lang)} — {isTa ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}</span>}
            defaultOpen={false}
          >
            <div className="t2-deep-body">
              <Surface title={t("nakshatra_card_label", lang)}>
                <div className="surface__body">
                  <div className="surface__headline">
                    <span>{isTa ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}</span>
                    <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(nakshatraCard.rulingPlanet, lang)}</Chip>
                  </div>
                  <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    <span style={{ marginRight: "var(--space-3)" }}>{t("nakshatra_deity", lang)}: <strong style={{ color: "var(--color-text)" }}>{isTa ? nakshatraCard.deityTa : nakshatraCard.deityEn}</strong></span>
                    <span>{t("nakshatra_symbol", lang)}: <strong style={{ color: "var(--color-text)" }}>{isTa ? nakshatraCard.symbolTa : nakshatraCard.symbolEn}</strong></span>
                  </p>
                  <p className="surface__text">{isTa ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}</p>
                  {nakshatraCard.strengths.length > 0 && (
                    <div style={{ marginBottom: "var(--space-2)" }}>
                      <p className="t2-kicker" style={{ color: "var(--chart-d9-active)" }}>{t("nakshatra_strengths", lang)}</p>
                      <div className="chip-row">{nakshatraCard.strengths.map((s) => <Chip key={s.en} tone="success">{isTa ? s.ta : astroText(s.en)}</Chip>)}</div>
                    </div>
                  )}
                  {nakshatraCard.cautions.length > 0 && (
                    <div>
                      <p className="t2-kicker" style={{ color: "var(--panel-brand)" }}>{t("nakshatra_cautions", lang)}</p>
                      <div className="chip-row">{nakshatraCard.cautions.map((c) => <Chip key={c.en} tone="warning">{isTa ? c.ta : astroText(c.en)}</Chip>)}</div>
                    </div>
                  )}
                </div>
              </Surface>
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Morning guidance opt-in */}
      <MorningGuidanceCard lang={lang} />

      {onClosePrasna && personalChart && (
        <PrasnaWidget
          lang={lang}
          open={showPrasna}
          onClose={onClosePrasna}
          timezone={personalChart.birthProfile.birthTimezone ?? "Asia/Kolkata"}
          latitude={personalChart.birthProfile.birthLatitude ?? 13.0827}
          longitude={personalChart.birthProfile.birthLongitude ?? 80.2707}
        />
      )}
    </div>
  );
}

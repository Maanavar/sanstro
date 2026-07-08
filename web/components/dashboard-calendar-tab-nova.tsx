"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { formatClockLabel } from "@/lib/format";
import { bestGowriSlot, gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t, tKarana, tNakshatra, tPlanetLord, tTithi, tWeekday, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { rasiGlyph } from "@/lib/astro-symbols";
import { useMonthlyPanchangam } from "@/hooks/useMonthlyPanchangam";
import { PlaceCombobox } from "./place-combobox";
import { DrawerPanel } from "./drawer-panel";
import type {
  PanchangamDailyResponseData,
  PanchangamFestival,
  PanchangamTimingsData,
} from "@/lib/types";

import { DASHA_COLORS } from "./dashboard-dasha";
import {
  activeLimb,
  chandrashtamaAffectedNatalRasi,
  DayTimeline,
  festivalIcon,
  festivalTags,
  formatChandrashtamaWindowSummary,
  formatHeaderDate,
  getTamilMonthDate,
  LunarTithiBadge,
  moonRasiFromNakshatra,
  parseHmToMinutes,
  rasiName,
  timeWindowsOverlap,
} from "./dashboard-calendar-tab";
import type { CalendarView } from "./dashboard-calendar-tab";
import { MonthlyCalendarViewNova } from "./dashboard-calendar-monthly-nova";

/**
 * Nova "Calendar" tab, daily Panchangam view — Phase 2 of the dashboard
 * revamp (mockup data-screen="cal-panch", see docs/DASHBOARD_UI_REVAMP_PLAN.md
 * §6/§8 Phase 2). Re-skin, not a rewrite: every field and calculation below
 * comes from the same PanchangamDailyResponseData Classic's CalendarTab
 * (dashboard-calendar-tab.tsx) already receives — the pure derivation
 * helpers (activeLimb promotion, chandrashtamam rasi math, header/tamil
 * date formatting, festival tag extraction, the Hora/DayTimeline SVG
 * component) are imported from that file rather than reimplemented, since
 * they already read exclusively from var(--color-*) tokens Nova redefines.
 *
 * The "Monthly" toggle (screen 3, mockup data-screen="cal-monthly") was
 * originally deferred to a later phase, then pulled forward in this same
 * session after the user flagged Classic-styled colors leaking through —
 * see `dashboard-calendar-monthly-nova.tsx` for that screen's own re-skin
 * (`MonthlyCalendarViewNova`) and `DayDetailDrawerNova` below for its
 * day-click preview drawer.
 */

export type DashboardCalendarTabNovaProps = {
  selectedDate: string;
  todayDate: string;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  lang: Lang;
  locationLabel?: string | null;
  onSelectDate?: (date: string) => void;
};

function novaFestivalTagLabel(tag: string, lang: Lang): string {
  const labels: Record<string, { en: string; ta: string }> = {
    hindu: { en: "Hindu", ta: "இந்து" },
    muslim: { en: "Muslim", ta: "இஸ்லாம்" },
    christian: { en: "Christian", ta: "கிறித்தவம்" },
    indian_govt: { en: "Indian Govt", ta: "இந்திய அரசு" },
    tamilnadu_govt: { en: "Tamil Nadu Govt", ta: "தமிழ்நாடு அரசு" },
    observance: { en: "Observance", ta: "உலக தினம்" },
  };
  return labels[tag]?.[lang] ?? tag.replaceAll("_", " ");
}

function novaFestivalTagTone(tag: string): { bg: string; border: string; color: string } {
  if (tag === "hindu") return { bg: "var(--color-accent-muted)", border: "var(--color-border-strong)", color: "var(--color-accent-strong)" };
  if (tag === "muslim") return { bg: "var(--color-high-bg)", border: "var(--color-high-border)", color: "var(--color-high)" };
  if (tag === "christian") return { bg: "var(--color-accent-secondary-muted)", border: "var(--color-border-strong)", color: "var(--color-accent-secondary)" };
  return { bg: "var(--color-surface-soft)", border: "var(--color-border)", color: "var(--color-muted)" };
}

function NovaFestivalRow({ festival, lang }: { festival: PanchangamFestival; lang: Lang }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-accent-muted)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "11px 15px" }}>
      <span aria-hidden="true" style={{ color: "var(--color-accent-strong)" }}>{festivalIcon(festival.name)}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, flex: 1, color: "var(--color-text-strong)" }}>{festival.name}</span>
      <span style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {festivalTags(festival).map((tag) => {
          const tone = novaFestivalTagTone(tag);
          return (
            <span key={tag} style={{ fontSize: "10.5px", fontWeight: 700, color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: "5px", padding: "2px 8px", whiteSpace: "nowrap" }}>
              {novaFestivalTagLabel(tag, lang)}
            </span>
          );
        })}
      </span>
    </div>
  );
}

function NovaAuspiciousCard({
  title,
  slots,
  lang,
}: {
  title: string;
  slots: PanchangamDailyResponseData["kalam"]["nallaNeram"];
  lang: Lang;
}) {
  if (!slots || slots.length === 0) return null;
  return (
    <div style={{ background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "10px", padding: "12px 15px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-strong)" }}>{title}</div>
      {slots.map((slot, idx) => (
        <div key={`${slot.period ?? "slot"}-${slot.start}-${idx}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--color-text)" }}>
          <span>{gowriPeriodLabel(slot.period, lang) || `#${idx + 1}`}</span>
          <span style={{ fontWeight: 600, color: "var(--color-high)" }}>{formatClockLabel(slot.start)} – {formatClockLabel(slot.end)}</span>
        </div>
      ))}
    </div>
  );
}

function NovaAvoidRow({ label, slot }: { label: string; slot: { start: string; end: string } }) {
  return (
    <div style={{ background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "10px", padding: "11px 15px", display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
      <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--color-low)" }}>{formatClockLabel(slot.start)} – {formatClockLabel(slot.end)}</span>
    </div>
  );
}

function NovaGowriDetailGrid({
  slots,
  avoidSlots,
  lang,
}: {
  slots: NonNullable<PanchangamDailyResponseData["kalam"]["gowriPanchangam"]>;
  avoidSlots: Array<{ label: string; start: string; end: string }>;
  lang: Lang;
}) {
  if (slots.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700 }}>
        {lang === "ta" ? "கௌரி நல்ல நேரம் விவரம்" : "Gowri Nalla Neram Details"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
        {slots.map((slot, idx) => {
          const overlapping = avoidSlots.filter((avoid) => timeWindowsOverlap(slot, avoid));
          const isBad = slot.isGood === false || overlapping.length > 0;
          const period = gowriPeriodLabel(slot.period, lang);
          const category = gowriCategoryLabel(slot.name, lang);
          const purpose = gowriPurposeLabel(slot.name, lang);
          const tone = isBad
            ? { bg: "var(--color-low-bg)", border: "var(--color-low-border)", color: "var(--color-low)" }
            : { bg: "var(--color-high-bg)", border: "var(--color-high-border)", color: "var(--color-high)" };
          return (
            <div key={`${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${idx}`} style={{ borderRadius: "9px", border: `1px solid ${tone.border}`, background: tone.bg, padding: "9px 11px", minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-strong)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[period, category].filter(Boolean).join(" · ") || `Slot ${slot.slot}`}</span>
                <span style={{ whiteSpace: "nowrap" }}>{formatClockLabel(slot.start)} – {formatClockLabel(slot.end)}</span>
              </div>
              {purpose && <div style={{ fontSize: "10.5px", color: "var(--color-muted)", marginTop: "3px", lineHeight: 1.4 }}>{purpose}</div>}
              {overlapping.length > 0 && (
                <div style={{ fontSize: "10px", color: tone.color, marginTop: "3px", fontWeight: 700 }}>
                  {lang === "ta" ? "தவிர்க்கும் நேரம்" : "Overlaps"}: {overlapping.map((o) => o.label).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NovaHoraRow({
  hora,
  lang,
  nowMinutes,
}: {
  hora: PanchangamDailyResponseData["hora"][number];
  lang: Lang;
  nowMinutes: number;
}) {
  const start = parseHmToMinutes(hora.start);
  const end = parseHmToMinutes(hora.end);
  const running = nowMinutes >= start && nowMinutes < end;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running || !rowRef.current) return;
    const container = rowRef.current.parentElement;
    if (!container) return;
    const rowTop = rowRef.current.offsetTop;
    const rowBottom = rowTop + rowRef.current.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (rowTop < visibleTop) { container.scrollTop = rowTop; return; }
    if (rowBottom > visibleBottom) container.scrollTop = rowBottom - container.clientHeight;
  }, [running]);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 13px", borderRadius: "8px",
        background: running ? "var(--color-accent-muted)" : "transparent",
        border: running ? "1px solid var(--color-border-strong)" : "1px solid transparent",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "12.5px", fontWeight: running ? 700 : 500, color: running ? "var(--color-text-strong)" : "var(--color-text)" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: DASHA_COLORS[hora.lord.toUpperCase()] ?? "var(--color-faint)", flexShrink: 0 }} />
        {tPlanetLord(hora.lord, lang)} {t("hora_word", lang)}
      </span>
      <span style={{ fontSize: "12px", color: running ? "var(--color-accent-strong)" : "var(--color-faint)", fontWeight: running ? 600 : 500 }}>
        {formatClockLabel(hora.start)} – {formatClockLabel(hora.end)}
      </span>
    </div>
  );
}

/**
 * Nova version of Classic's `DayDetailDrawer` (the month-grid day-click
 * preview). Classic's version pulls in `AuspiciousSlotGroup` and inline
 * "avoid" rows that read Classic-only literal-hex tokens (--panel-warm-tint,
 * --chart-d9-active-bg) — reusing it verbatim would put cream-tinted badges
 * on a dark drawer panel. Rebuilt with the same Nova cards already defined
 * above (NovaAuspiciousCard/NovaAvoidRow/NovaFestivalRow) instead; the
 * underlying data/fields are identical to Classic's drawer.
 */
function DayDetailDrawerNova({
  date,
  data,
  loading,
  error,
  lang,
  onClose,
  onOpenFull,
}: {
  date: string;
  data: PanchangamDailyResponseData | null;
  loading: boolean;
  error: string | null;
  lang: Lang;
  onClose: () => void;
  onOpenFull: () => void;
}) {
  const headerDate = formatHeaderDate(date, lang);
  const tamilDate = getTamilMonthDate(date, lang);
  const tithiPaksha = data ? `${data.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${data.tithi.number}` : "";

  return (
    <DrawerPanel title={`${headerDate}${tamilDate ? ` · ${tamilDate}` : ""}`} onClose={onClose}>
      {loading && <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>{t("cal_monthly_loading", lang)}</p>}
      {error && !loading && <p className="empty-state">{error}</p>}
      {data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "13.5px", color: "var(--color-text)" }}>
              {tWeekday(data.vara.weekday, lang)} · {tithiPaksha} · {tNakshatra(data.nakshatra.name, lang)}
            </p>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)" }}>
              {lang === "ta" ? "சூர்யோதயம்" : "Sunrise"} {formatClockLabel(data.sunrise)} · {lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"} {formatClockLabel(data.sunset)}
            </p>
            {data.specialTithiDay && (
              <div style={{ marginTop: "8px" }}>
                <LunarTithiBadge value={data.specialTithiDay.name} lang={lang} />
              </div>
            )}
          </div>

          {(data.kalam.nallaNeram?.length ?? 0) > 0 && (
            <NovaAuspiciousCard title={t("label_nalla_neram", lang)} slots={data.kalam.nallaNeram ?? []} lang={lang} />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-low)", fontWeight: 700 }}>
              {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
            </p>
            <NovaAvoidRow label={t("label_rahu_kalam", lang)} slot={data.kalam.rahuKalam} />
            <NovaAvoidRow label={t("label_yamagandam", lang)} slot={data.kalam.yamagandam} />
            <NovaAvoidRow label={t("label_kuligai", lang)} slot={data.kalam.kuligai} />
          </div>

          {data.festivals.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
                {t("label_festivals", lang)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.festivals.map((f) => <NovaFestivalRow key={f.name} festival={f} lang={lang} />)}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenFull}
            style={{ alignSelf: "flex-start", padding: "10px 18px", borderRadius: "999px", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {lang === "ta" ? "முழு நாள் விவரம் →" : "Open full day view →"}
          </button>
        </div>
      )}
    </DrawerPanel>
  );
}

export function DashboardCalendarTabNova({
  selectedDate,
  todayDate,
  panchangam: defaultPanchangam,
  lang,
  locationLabel,
  onSelectDate,
}: DashboardCalendarTabNovaProps) {
  const [view, setView] = useState<CalendarView>("panchangam");

  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<PanchangamDailyResponseData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const [monthlyYear, setMonthlyYear] = useState(() => selectedDateObj.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(() => selectedDateObj.getMonth() + 1);
  const { monthlyPanchangam, isMonthlyPanchangamLoading, monthlyPanchangamError, fetchMonthlyPanchangam } = useMonthlyPanchangam();

  const [overrideLocation, setOverrideLocation] = useState<{ lat: number; lng: number; timezone: string; label: string } | null>(null);
  const [overridePanchangam, setOverridePanchangam] = useState<PanchangamDailyResponseData | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const panchangam = overridePanchangam ?? defaultPanchangam;
  const monthlyLocation = panchangam?.location ?? null;

  useEffect(() => {
    if (view !== "monthly" || !monthlyLocation) return;
    fetchMonthlyPanchangam(monthlyYear, monthlyMonth, monthlyLocation);
  }, [view, monthlyYear, monthlyMonth, monthlyLocation, fetchMonthlyPanchangam]);

  useEffect(() => {
    if (!detailDate) return;
    if (detailDate === selectedDate && panchangam) {
      setDetailData(panchangam);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }
    if (!monthlyLocation) {
      setDetailError(t("panja_empty", lang));
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    const params = new URLSearchParams({
      date: detailDate,
      lat: String(monthlyLocation.lat),
      lng: String(monthlyLocation.lng),
      timezone: monthlyLocation.timezone,
    });
    apiFetchJson<{ data: PanchangamDailyResponseData }>(`/api/v1/panchangam/daily?${params.toString()}`, { signal: controller.signal })
      .then((res) => setDetailData(res.data))
      .catch((err) => { if (!controller.signal.aborted) setDetailError(readErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailDate, selectedDate, panchangam, monthlyLocation, lang]);

  useEffect(() => {
    if (!overrideLocation) { setOverrideLoading(false); return; }
    const controller = new AbortController();
    setOverrideLoading(true);
    setOverridePanchangam(null);
    const params = new URLSearchParams({
      date: selectedDate,
      lat: String(overrideLocation.lat),
      lng: String(overrideLocation.lng),
      timezone: overrideLocation.timezone,
    });
    apiFetchJson<{ data: PanchangamDailyResponseData }>(`/api/v1/panchangam/daily?${params.toString()}`, { signal: controller.signal })
      .then((res) => setOverridePanchangam(res.data))
      .catch((err) => { if (!controller.signal.aborted) console.error("Location override fetch:", readErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setOverrideLoading(false); });
    return () => controller.abort();
  }, [overrideLocation, selectedDate]);

  const goToAdjacentMonth = (delta: number) => {
    const next = new Date(monthlyYear, monthlyMonth - 1 + delta, 1);
    setMonthlyYear(next.getFullYear());
    setMonthlyMonth(next.getMonth() + 1);
  };

  const headerDate = formatHeaderDate(selectedDate, lang);
  const tamilHeaderDate = getTamilMonthDate(selectedDate, lang);
  const currentNowMinutes = selectedDate === todayDate ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  const tithiActive = panchangam ? activeLimb(panchangam.tithi.name, panchangam.tithi.endsAt, panchangam.tithi.nextName, currentNowMinutes) : null;
  const nakActive = panchangam ? activeLimb(panchangam.nakshatra.name, panchangam.nakshatra.endsAt, panchangam.nakshatra.nextName, currentNowMinutes) : null;

  const tithiPaksha = panchangam
    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`
    : null;

  const panchangamMeta = panchangam
    ? `${tWeekday(panchangam.vara.weekday, lang)} · ${tithiPaksha ?? ""} · ${tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}`
    : t("panja_empty", lang);

  const bestNallaSlot = bestGowriSlot(panchangam?.kalam.nallaNeram);

  const fallbackMoonRasi = panchangam ? moonRasiFromNakshatra(panchangam.nakshatra.name, panchangam.nakshatra.pada) : 0;
  const moonRasi = panchangam?.chandrashtamamToday.moonRasiNumber || fallbackMoonRasi;
  const chandrashtama = panchangam?.chandrashtamamToday.affectedJanmaRasiNumber || chandrashtamaAffectedNatalRasi(moonRasi);
  const moonRasiName = moonRasi ? rasiName(moonRasi, lang) : "";
  const chandraName = chandrashtama ? rasiName(chandrashtama, lang) : "";
  const chandraNakshatraWindows = panchangam?.chandrashtamamToday.janmaNakshatraWindows ?? [];
  const chandraNakshatraWindowSummary = panchangam ? formatChandrashtamaWindowSummary(chandraNakshatraWindows, panchangam.dateLocal, lang) : "";
  const todayMoonNakshatra = panchangam ? panchangam.nakshatra.name : "";
  const observanceFestivals = panchangam?.festivals.filter((f) => festivalTags(f).includes("observance")) ?? [];
  const dailyFestivalEvents = panchangam?.festivals.filter((f) => !festivalTags(f).includes("observance")) ?? [];

  const significanceText = useMemo(() => {
    if (!panchangam) return "";
    return panchangam.festivals?.[0]?.name || panchangam.subhaMuhurtham?.reason || (lang === "ta" ? "இன்று அமைதியாக முன்னேறுங்கள்." : "Move steadily and keep the day intentional.");
  }, [panchangam, lang]);

  const fiveLimbRows = panchangam
    ? [
        { key: lang === "ta" ? "வாரம்" : "Vara", value: tWeekday(panchangam.vara.weekday, lang), hint: `${tPlanetLord(panchangam.vara.lord, lang)} ${t("lord_word", lang)}` },
        {
          key: lang === "ta" ? "திதி" : "Tithi",
          value: tTithi(tithiActive?.activeName ?? panchangam.tithi.name, lang),
          hint: tithiActive?.rolledOver
            ? `${formatClockLabel(panchangam.tithi.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${tithiPaksha ?? ""} · ${formatClockLabel(panchangam.tithi.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tTithi(panchangam.tithi.nextName, lang)}`,
        },
        {
          key: lang === "ta" ? "நட்சத்திரம்" : "Nakshatra",
          value: tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang),
          hint: nakActive?.rolledOver
            ? `${formatClockLabel(panchangam.nakshatra.endsAt)} ${lang === "ta" ? "முதல் தற்போது செயலில்" : "active since"}`
            : `${t("label_padam", lang)} ${panchangam.nakshatra.pada} · ${formatClockLabel(panchangam.nakshatra.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${tNakshatra(panchangam.nakshatra.nextName, lang)}`,
        },
        { key: lang === "ta" ? "யோகம்" : "Yoga", value: tYoga(panchangam.yoga.name, lang), hint: `${lang === "ta" ? "யோகம்" : "Yoga"} ${panchangam.yoga.number}` },
        { key: lang === "ta" ? "கரணம்" : "Karana", value: tKarana(panchangam.karana.name, lang), hint: "—" },
        { key: lang === "ta" ? "சந்திரன்" : "Moon", value: panchangam.moonPhaseLabel, hint: lang === "ta" ? "சந்திர கலை" : "Moon phase" },
        { key: lang === "ta" ? "சூலம்" : "Soolam", value: panchangam.soolam.direction, hint: `${lang === "ta" ? "பரிகாரம்" : "Parigaram"}: ${panchangam.soolam.parigaram}` },
        { key: lang === "ta" ? "லக்னம்" : "Lagnam", value: panchangam.lagnam.rasiName, hint: `${lang === "ta" ? "இருப்பு" : "Remaining"} ${panchangam.lagnam.nazhigai} ${lang === "ta" ? "நாழிகை" : "nazhigai"} ${panchangam.lagnam.vinadi} ${lang === "ta" ? "விநாடி" : "vinadi"} · ${formatClockLabel(panchangam.lagnam.endsAt)} ${t("until_word", lang)}` },
        { key: lang === "ta" ? "நேத்திரம்" : "Nethiram", value: panchangam.nethiram, hint: lang === "ta" ? "இன்று முழுவதும்" : "Throughout today" },
        { key: lang === "ta" ? "ஜீவன்" : "Jeevan", value: panchangam.jeevan, hint: lang === "ta" ? "இன்று முழுவதும்" : "Throughout today" },
        { key: lang === "ta" ? "அமிர்தாதி யோகம்" : "Amirdhadhi Yogam", value: panchangam.amirdhadhiYogam.name, hint: `${formatClockLabel(panchangam.amirdhadhiYogam.endsAt)} ${t("until_word", lang)} · ${lang === "ta" ? "பின்பு" : "then"} ${panchangam.amirdhadhiYogam.nextName}` },
      ]
    : [];

  const avoidSlotsForOverlap = panchangam
    ? [
        { label: t("label_rahu_kalam", lang), start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end },
        { label: t("label_yamagandam", lang), start: panchangam.kalam.yamagandam.start, end: panchangam.kalam.yamagandam.end },
        { label: t("label_kuligai", lang), start: panchangam.kalam.kuligai.start, end: panchangam.kalam.kuligai.end },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* ===== Page header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700 }}>
            {lang === "ta" ? "கிரகநகர்வு & நிகழ்வுகள்" : "Transits & Events"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem, 3.2vw, 2.1rem)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.1 }}>
              {headerDate}
            </div>
            {tamilHeaderDate && (
              <div style={{ fontSize: "15px", color: "var(--color-accent-strong)", fontWeight: 600 }}>{tamilHeaderDate}</div>
            )}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "2px" }}>{panchangamMeta}</div>
        </div>

        <div style={{ display: "inline-flex", gap: "4px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border-strong)", borderRadius: "11px", padding: "5px" }}>
          {([["panchangam", t("cal_panchangam", lang)], ["monthly", t("cal_monthly", lang)]] as [CalendarView, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                border: "none", cursor: "pointer", borderRadius: "8px",
                padding: "8px 16px", fontSize: "12.5px", fontWeight: view === key ? 700 : 600,
                background: view === key ? "var(--color-accent)" : "transparent",
                color: view === key ? "var(--color-on-accent)" : "var(--color-text)",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "panchangam" && (
        !panchangam ? (
          <p className="empty-state">{t("panja_empty", lang)}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px", alignItems: "start" }}>
            {/* ===== LEFT: Day at a glance ===== */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "24px 26px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                  {lang === "ta" ? "இன்று — ஒரு பார்வையில்" : "Day at a glance"}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, lineHeight: 1.25, color: "var(--color-text-strong)" }}>
                  {tTithi(tithiActive?.activeName ?? panchangam.tithi.name, lang)}. {tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}. {tYoga(panchangam.yoga.name, lang)}.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", fontSize: "12.5px", color: "var(--color-muted)", flexWrap: "wrap" }}>
                  <span>
                    {lang === "ta" ? "சூர்யோதயம்" : "Sunrise"} {formatClockLabel(panchangam.sunrise)} · {lang === "ta" ? "சூர்யாஸ்தமனம்" : "Sunset"} {formatClockLabel(panchangam.sunset)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker((v) => !v)}
                    style={{ border: "1px solid var(--color-border-strong)", background: showLocationPicker ? "var(--color-surface-soft)" : "transparent", borderRadius: "999px", padding: "3px 10px", fontSize: "11.5px", color: "var(--color-accent-strong)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    📍 {overrideLoading ? (lang === "ta" ? "ஏற்றுகிறது…" : "Loading…") : (overrideLocation?.label ?? locationLabel ?? (lang === "ta" ? "இடம்" : "Location"))} ▾
                  </button>
                </div>
                {showLocationPicker && (
                  <div style={{ marginTop: "10px", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--color-muted)", fontWeight: 600 }}>
                      {lang === "ta" ? "வேறு இடத்திற்கான பஞ்சாங்கம் காண்க" : "View panchangam for another location"}
                    </p>
                    <PlaceCombobox
                      value={overrideLocation?.label ?? ""}
                      onChange={(city) => {
                        if (city) {
                          setOverrideLocation({ lat: parseFloat(city.lat), lng: parseFloat(city.lng), timezone: city.timezone, label: city.name });
                          setShowLocationPicker(false);
                        }
                      }}
                      placeholder={lang === "ta" ? "நகரம் தேடுங்கள்…" : "Search city…"}
                    />
                    {overrideLocation && (
                      <button
                        type="button"
                        onClick={() => { setOverrideLocation(null); setOverridePanchangam(null); setOverrideLoading(false); setShowLocationPicker(false); }}
                        style={{ marginTop: "8px", display: "block", fontSize: "12px", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                      >
                        {lang === "ta" ? "↩ பொதுவான இடத்திற்கு திரும்பு" : "↩ Reset to profile location"}
                      </button>
                    )}
                  </div>
                )}
                {panchangam.specialTithiDay && (
                  <div style={{ marginTop: "8px" }}>
                    <LunarTithiBadge value={panchangam.specialTithiDay.name} lang={lang} />
                  </div>
                )}
              </div>

              <DayTimeline
                bestStart={bestNallaSlot?.start}
                bestEnd={bestNallaSlot?.end}
                avoidStart={panchangam.kalam.rahuKalam.start}
                avoidEnd={panchangam.kalam.rahuKalam.end}
              />

              {/* ── Auspicious ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-high)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "நல்ல நேரங்கள்" : "Auspicious"}
                </div>
                <NovaAuspiciousCard title={t("label_nalla_neram", lang)} slots={panchangam.kalam.nallaNeram ?? []} lang={lang} />
                <NovaAuspiciousCard title={t("label_gowri_nalla_neram", lang)} slots={panchangam.kalam.gowriNallaNeram ?? []} lang={lang} />
              </div>

              {/* ── Avoid ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-low)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
                </div>
                <NovaAvoidRow label={t("label_rahu_kalam", lang)} slot={panchangam.kalam.rahuKalam} />
                <NovaAvoidRow label={t("label_yamagandam", lang)} slot={panchangam.kalam.yamagandam} />
                <NovaAvoidRow label={t("label_kuligai", lang)} slot={panchangam.kalam.kuligai} />
              </div>

              {/* ── Today's Nakshatra ── */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "இன்றைய நட்சத்திரம்" : "Today's Nakshatra"}
                </div>
                <div style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "10px", padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--color-text-strong)" }}>
                    {tNakshatra(nakActive?.activeName ?? panchangam.nakshatra.name, lang)}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    {t("label_padam", lang)} {panchangam.nakshatra.pada} · {t("until_word", lang)} {formatClockLabel(panchangam.nakshatra.endsAt)}
                  </span>
                </div>
              </div>

              {/* ── Chandrashtamam ── */}
              {chandraName && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-low)", textTransform: "uppercase", fontWeight: 700 }}>
                    {t("label_chandrashtamam", lang)}
                  </div>
                  <div style={{ background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                      <span style={{ color: "var(--color-muted)" }}>{lang === "ta" ? "பாதிக்கப்படும் ராசி" : "Affected Rasi"}</span>
                      <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{rasiGlyph(chandrashtama)} {chandraName}</span>
                    </div>
                    {chandraNakshatraWindowSummary && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}>
                        <span style={{ color: "var(--color-muted)" }}>{lang === "ta" ? "இன்றைய ஜன்ம நட்சத்திர நேரங்கள்" : "Today's Janma Nakshatra Windows"}</span>
                        <span style={{ color: "var(--color-low)", fontWeight: 600, textAlign: "right", lineHeight: 1.45 }}>{chandraNakshatraWindowSummary}</span>
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-muted)", lineHeight: 1.55, fontStyle: "italic", borderTop: "1px solid var(--color-low-border)", paddingTop: "8px" }}>
                      {lang === "ta"
                        ? `சந்திரன் இன்று ${todayMoonNakshatra ? tNakshatra(todayMoonNakshatra, lang) + " நட்சத்திரத்தில் " : ""}${moonRasiName} ராசியில் சஞ்சரிக்கிறது. ${chandraName} ஜன்ம ராசி உடையோருக்கு சந்திராஷ்டமம்.${chandraNakshatraWindowSummary ? ` குறிப்பாக ${chandraNakshatraWindowSummary} நேரத்தில் இருக்கும் ஜன்ம நட்சத்திரங்கள் கவனமாக இருக்கவும்.` : ""}`
                        : `Moon transits ${moonRasiName} today${todayMoonNakshatra ? ` (in ${tNakshatra(todayMoonNakshatra, "en")} nakshatra)` : ""}. Natives born with ${chandraName} as their Janma Rasi are in Chandrashtamam.${chandraNakshatraWindowSummary ? ` Specifically, the Janma Nakshatra windows are ${chandraNakshatraWindowSummary}.` : ""}`}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Today's Events ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "இன்றைய நிகழ்வுகள்" : "Today's Events"}
                </div>
                {observanceFestivals.length === 0 && dailyFestivalEvents.length === 0 ? (
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{t("label_no_festivals", lang)}</span>
                ) : (
                  <>
                    {observanceFestivals.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "10.5px", letterSpacing: "0.1em", color: "var(--color-faint)", textTransform: "uppercase" }}>
                          {lang === "ta" ? "உலக தினங்கள்" : "World Observance"}
                        </div>
                        {observanceFestivals.map((festival) => <NovaFestivalRow key={festival.name} festival={festival} lang={lang} />)}
                      </div>
                    )}
                    {dailyFestivalEvents.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "10.5px", letterSpacing: "0.1em", color: "var(--color-faint)", textTransform: "uppercase" }}>
                          {lang === "ta" ? "திருவிழாக்கள்" : "Festivals"}
                        </div>
                        {dailyFestivalEvents.map((festival) => <NovaFestivalRow key={festival.name} festival={festival} lang={lang} />)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Gowri Nalla Neram Details ── */}
              <NovaGowriDetailGrid slots={panchangam.kalam.gowriPanchangam ?? []} avoidSlots={avoidSlotsForOverlap} lang={lang} />

              {/* ── Today's Significance ── */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700 }}>
                  {lang === "ta" ? "இன்றைய சிறப்பு" : "Today's Significance"}
                </div>
                <div style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "12px 15px", fontSize: "12.5px", color: "var(--color-text)" }}>
                  {significanceText}
                </div>
              </div>
            </div>

            {/* ===== RIGHT column ===== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "20px 22px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700, marginBottom: "12px" }}>
                  {lang === "ta" ? "பஞ்சாங்கம் · ஐந்து அங்கங்கள்" : "Panchangam · Five Limbs"}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {fiveLimbRows.map((row) => (
                    <div key={row.key} className="cd-detail-spec-row">
                      <span className="cd-detail-spec-row__label">{row.key}</span>
                      <div className="cd-detail-spec-row__body">
                        <p>{row.value}</p>
                        <p>{row.hint}</p>
                      </div>
                      <span className="cd-detail-spec-row__tag">5L</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11.5px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "இந்த நேரங்கள் திருக்கணிதம் (எபிமெரிஸ் அடிப்படையிலான வானியல்) முறையில், லாஹிரி அயனாம்சத்தில் கணக்கிடப்படுகின்றன. வாக்கிய முறையைப் பின்பற்றும் உங்கள் ஊர் பஞ்சாங்கம் அல்லது குருவின் கணக்கீட்டில் திதி/நட்சத்திர மாற்ற நேரங்களில் சிறிது வேறுபாடு இருக்கலாம்."
                      : "These times use Drik-ganita (ephemeris-based) astronomy with Lahiri ayanamsa. If your local almanac or purohit follows the traditional Vakya method, tithi/nakshatra boundary times may differ slightly."}
                  </p>
                  <Link href="/trust/methodology#panchangam" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-accent)", textDecoration: "none" }}>
                    {lang === "ta" ? "எங்கள் கணக்கீட்டு முறையைப் பார்க்க →" : "See our calculation methodology →"}
                  </Link>
                </div>
              </div>

              {panchangam.hora.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "20px 22px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--color-accent)", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>
                    {lang === "ta" ? "ஹோரை அட்டவணை" : "Hora Table"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "330px", overflowY: "auto", paddingRight: "4px" }}>
                    {panchangam.hora.map((h) => (
                      <NovaHoraRow key={h.index} hora={h} lang={lang} nowMinutes={currentNowMinutes} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {view === "monthly" && (
        <MonthlyCalendarViewNova
          lang={lang}
          year={monthlyYear}
          month={monthlyMonth}
          monthly={monthlyPanchangam}
          isLoading={isMonthlyPanchangamLoading}
          error={monthlyPanchangamError}
          hasLocation={Boolean(monthlyLocation)}
          selectedDate={selectedDate}
          todayDate={todayDate}
          onPrevMonth={() => goToAdjacentMonth(-1)}
          onNextMonth={() => goToAdjacentMonth(1)}
          onSelectDate={(date) => setDetailDate(date)}
        />
      )}

      {detailDate && (
        <DayDetailDrawerNova
          date={detailDate}
          data={detailData}
          loading={detailLoading}
          error={detailError}
          lang={lang}
          onClose={() => setDetailDate(null)}
          onOpenFull={() => {
            onSelectDate?.(detailDate);
            setView("panchangam");
            setDetailDate(null);
          }}
        />
      )}
    </div>
  );
}

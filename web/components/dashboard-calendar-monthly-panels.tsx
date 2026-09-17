"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowUpRight, CalendarDays, Moon, Sparkles } from "lucide-react";
import { t, tLang, tNakshatra, tTithi, type Lang } from "@/lib/i18n";
import { moonPhaseFromTithi } from "@/lib/lunar";
import type { PanchangamMonthDayEntry } from "@/lib/types";
import type { AgendaDay } from "./dashboard-calendar-monthly-nova";
import { MiniMoonGlyph } from "./celestial-glyph-nova";
import { Button, Card } from "./ui";

type DayActions = {
  lang: Lang;
  onSelectDate?: (date: string) => void;
  formatDate: (date: string) => string;
};

/** Decorative, responsive artwork; the date's actual moon phase is separate. */
export function MonthlyCalendarLandscape({ priority = false }: { priority?: boolean }) {
  return <div className="nova-cal-landscape" aria-hidden="true"><Image src="/calendar/moonlit-temple.png" alt="" fill sizes="(max-width: 960px) 100vw, 1100px" priority={priority} /></div>;
}

export function MonthlyCalendarSidebar({
  lang, monthLabel, agendaDays, observanceCount, onSelectDate, formatDate,
  expanded, onToggleExpanded, children,
}: DayActions & {
  monthLabel: string;
  agendaDays: AgendaDay[];
  observanceCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  children: ReactNode;
}) {
  const [allObservances, setAllObservances] = useState(false);
  const featured = agendaDays.filter((day) => day.major.length);
  const preview = (featured.length ? featured : agendaDays).slice(0, 4);
  const grouped = new Map<string, AgendaDay[]>();
  agendaDays.forEach((day) => day.routine.forEach((name) => {
    grouped.set(name, [...(grouped.get(name) ?? []), day]);
  }));
  const observances = Array.from(grouped);
  const muhurtham = agendaDays.filter((day) => day.muhurtham);
  const others = agendaDays.filter((day) => day.civic.length || day.karinaal);

  return (
    <aside className="nova-cal-sidebar" aria-label={t("cal_monthly_monthly_overview", lang)}>
      <Card as="section" className="nova-cal-rail-panel">
        <div className="nova-cal-panel-heading">
          <h2><CalendarDays size={16} aria-hidden="true" />{t("cal_monthly_this_month", lang)}</h2>
          <Button size="sm" variant="ghost" aria-expanded={expanded} aria-controls="monthly-agenda" onClick={onToggleExpanded}>
            {expanded ? (t("cal_monthly_show_less", lang)) : (t("cal_monthly_view_all", lang))}
          </Button>
        </div>
        <p className="nova-cal-rail-meta">{monthLabel} · <span>{lang === "ta" ? `${observanceCount} நிகழ்வுகள்` : `${observanceCount} ${observanceCount === 1 ? "observance" : "observances"}`}</span></p>
        {!expanded && <div className="nova-cal-featured">
          {preview.map((day) => (
            <button type="button" key={day.dateLocal} onClick={() => onSelectDate?.(day.dateLocal)} disabled={!onSelectDate}>
              <span className={`nova-cal-event-dot${day.major.length ? "" : day.muhurtham ? " nova-cal-event-dot--muhurtham" : day.karinaal && !day.routine.length && !day.civic.length ? " nova-cal-event-dot--karinaal" : " nova-cal-event-dot--routine"}`} aria-hidden="true" />
              <span>
                <strong>{(day.major.length ? day.major : [...day.routine, ...day.civic]).join(" · ") || (day.muhurtham ? (t("cal_monthly_muhurtham", lang)) : (t("cal_monthly_karinaal", lang)))}</strong>
                <small>{formatDate(day.dateLocal)} · {day.meta}</small>
              </span>
            </button>
          ))}
          {!preview.length && <p className="nova-cal-rail-meta">{t("cal_monthly_nothing_matches_the_selected_filters", lang)}</p>}
        </div>}
        <section id="monthly-agenda" hidden={!expanded} aria-label={t("cal_monthly_events_festivals", lang)}>
          {children}
        </section>
      </Card>

      <Card as="section" className="nova-cal-rail-panel" aria-label={t("cal_monthly_monthly_observances", lang)}>
        <div className="nova-cal-panel-heading">
          <h2><Moon size={16} aria-hidden="true" />{t("cal_monthly_monthly_observances", lang)}</h2>
          {observances.length > 8 && <Button size="sm" variant="ghost" aria-expanded={allObservances} onClick={() => setAllObservances(!allObservances)}>{allObservances ? (t("cal_monthly_less", lang)) : (t("cal_monthly_view_all", lang))}</Button>}
        </div>
        {/* One line per observance: name on the left, its dates as small chips
            on the right, so a month of fortnightly vrathams reads as a table. */}
        <ul className="nova-cal-observances">
          {(allObservances ? observances : observances.slice(0, 8)).map(([name, days]) => (
            <li className="nova-cal-observance" key={name}>
              <span className="nova-cal-observance__name">{name}</span>
              <span className="nova-cal-observance__dates">{days.map((day) => <button type="button" className="nova-cal-chip" key={day.dateLocal} aria-label={`${name} · ${formatDate(day.dateLocal)}`} onClick={() => onSelectDate?.(day.dateLocal)} disabled={!onSelectDate}>{day.dayNumber}</button>)}</span>
            </li>
          ))}
          {!observances.length && <li className="nova-cal-rail-meta">{t("cal_monthly_no_matching_observances", lang)}</li>}
        </ul>
        <div className="nova-cal-rail-section">
          <h3 className="nova-cal-muhurtham-heading">{t("cal_monthly_tamil_muhurtham_days_almanac", lang)}</h3>
          <div className="nova-cal-date-links">{muhurtham.map((day) => <button type="button" key={day.dateLocal} className="nova-cal-chip nova-cal-chip--high" onClick={() => onSelectDate?.(day.dateLocal)} disabled={!onSelectDate}><Sparkles size={11} aria-hidden="true" />{formatDate(day.dateLocal)}</button>)}</div>
          {!muhurtham.length && <p className="nova-cal-rail-meta">{t("cal_monthly_no_matching_days_this_month", lang)}</p>}
        </div>
        {others.length > 0 && <div className="nova-cal-rail-section">
          <h3>{t("cal_monthly_also_this_month", lang)}</h3>
          <div className="nova-cal-other-days">{others.map((day) => <button type="button" key={day.dateLocal} onClick={() => onSelectDate?.(day.dateLocal)} disabled={!onSelectDate}><span>{formatDate(day.dateLocal)}</span><span>{[...day.civic, ...(day.karinaal ? [t("cal_monthly_karinaal", lang)] : [])].join(" · ")}</span></button>)}</div>
        </div>}
        <a className="nova-cal-full-link" href="/tamil-calendar" target="_blank" rel="noreferrer">{t("cal_monthly_open_the_full_tamil_calendar", lang)}</a>
      </Card>
    </aside>
  );
}

export function MonthlyCalendarInsights({ lang, entry, todayDate, onSelectDate, formatDate }: DayActions & {
  entry?: PanchangamMonthDayEntry;
  todayDate: string;
}) {
  if (!entry) return null;
  const festivals = [...new Set(entry.festivals.map((f) => f.name))];
  return (
    <Card as="section" className="nova-cal-insights" aria-label={t("cal_monthly_selected_day_insights", lang)}>
      <div className="nova-cal-panel-heading">
        <h2><Moon size={18} aria-hidden="true" />{t("cal_monthly_insights_for", lang)} {formatDate(entry.dateLocal)} {entry.dateLocal.slice(0, 4)}</h2>
        {entry.dateLocal === todayDate && <span className="nova-cal-today-label">{t("cal_monthly_today", lang)}</span>}
      </div>
      <div className="nova-cal-insights__body">
        <div className="nova-cal-insights__date">
          <MiniMoonGlyph phase={moonPhaseFromTithi(entry.tithiNumber, entry.tithiPaksha)} size={54} />
          <div>
            <h3>{[entry.tamilDate && tLang(entry.tamilDate, lang), tTithi(entry.tithiName, lang)].filter(Boolean).join(" · ")}</h3>
            <p>{entry.tithiPaksha === "SHUKLA" ? (t("cal_monthly_waxing_moon", lang)) : (t("cal_monthly_waning_moon", lang))} · {tNakshatra(entry.nakshatraName, lang)}</p>
            <Button size="sm" variant="ghost" onClick={() => onSelectDate?.(entry.dateLocal)} disabled={!onSelectDate}>{t("cal_monthly_timings_day_details", lang)}<ArrowUpRight size={14} aria-hidden="true" /></Button>
          </div>
        </div>
        <div className="nova-cal-insights__fact">
          <h3><CalendarDays size={15} aria-hidden="true" />{t("cal_monthly_observances", lang)}</h3>
          <p>{festivals.length ? festivals.join(" · ") : (t("cal_monthly_no_listed_observances", lang))}</p>
        </div>
        <div className={`nova-cal-insights__fact ${entry.isKarinaal ? "nova-cal-insights__fact--caution" : entry.isTamilMuhurthamDay ? "nova-cal-insights__fact--high" : ""}`}>
          <h3>{entry.isKarinaal ? <AlertTriangle size={15} aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />}{t("cal_monthly_almanac_note", lang)}</h3>
          <p>{entry.isKarinaal
            ? (t("cal_monthly_karinaal_consider_another_day_for_auspicious_ceremonies", lang))
            : entry.isTamilMuhurthamDay
              ? (t("cal_monthly_almanac_muhurtham_day_check_personalised_timings_before_planning", lang))
              : (t("cal_monthly_not_listed_as_a_muhurtham_day_explore_the_day_s_timings", lang))}</p>
        </div>
      </div>
    </Card>
  );
}

"use client";





import { useState } from "react";





import { formatClockLabel, formatDateLabel, getScoreBand } from "@/lib/format";


import { t, tLang, tTithi, tNakshatra, tWeekday, tPlanetLord, tYoga, tKarana } from "@/lib/i18n";


import type { Lang } from "@/lib/i18n";


import type {


  ChartSummaryData,


  DailyGuidanceData,


  DailyGuidanceRangeData,


  FamilyAggregateData,


  FamilyCalendarData,


  PanchangamDailyResponseData,


  PanchangamTimingsData,


  SaniCycleData,


  TransitSnapshotData,

  WeekAheadData,

} from "@/lib/types";





import { DASHA_COLORS } from "./dashboard-dasha";


import { Chip, Metric, Surface } from "./dashboard-ui";


type CalendarView = "panchangam" | "personal" | "family";





function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function HoraRow({ hora, lang, nowMinutes }: { hora: { index: number; lord: string; start: string; end: string }; lang: Lang; nowMinutes: number }) {


  const color = DASHA_COLORS[hora.lord.toUpperCase()] ?? "#94a3b8";
  const startM = parseHM(hora.start);
  const endM = parseHM(hora.end);
  const isRunning = nowMinutes >= startM && nowMinutes < endM;
  const isCompleted = nowMinutes >= endM;


  return (


    <div style={{


      display: "flex", alignItems: "center", gap: "8px",


      padding: "4px 8px", borderRadius: "6px",


      background: isRunning ? `${color}28` : `${color}12`,
      border: isRunning ? `1px solid ${color}88` : `1px solid ${color}33`,
      opacity: isCompleted ? 0.38 : 1,
      boxShadow: isRunning ? `0 0 0 1.5px ${color}55` : undefined,


    }}>


      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isRunning ? color : (isCompleted ? "rgba(255,255,255,0.2)" : color), flexShrink: 0 }} />


      <span style={{ fontSize: "0.72rem", fontWeight: isRunning ? 700 : 600, color: isCompleted ? "rgba(255,255,255,0.3)" : color, minWidth: "68px" }}>{tPlanetLord(hora.lord, lang)} {t("hora_word", lang)}</span>


      <span style={{ fontSize: "0.67rem", color: isCompleted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)" }}>{formatClockLabel(hora.start)}–{formatClockLabel(hora.end)}</span>

      {isRunning && <span style={{ fontSize: "0.6rem", fontWeight: 700, color, marginLeft: "auto", background: `${color}22`, padding: "1px 5px", borderRadius: "4px" }}>▶</span>}


    </div>


  );


}





export function CalendarTab({


  selectedDate, panchangam, panchangamTimings,


  dailyGuidance, dailyGuidanceRange, familyCalendar, familyAggregate,


  chartSummary, transit, sani, hasBirthProfile, hasVault, lang, weekAhead,
  birthDisplayName, memberCharts, selectedMemberId, onSelectMember,


}: {


  selectedDate: string;


  panchangam: PanchangamDailyResponseData | null;


  panchangamTimings: PanchangamTimingsData | null;


  dailyGuidance: DailyGuidanceData | null;


  dailyGuidanceRange: DailyGuidanceRangeData | null;


  familyCalendar: FamilyCalendarData | null;


  familyAggregate: FamilyAggregateData | null;


  chartSummary: ChartSummaryData | null;


  transit: TransitSnapshotData | null;


  sani: SaniCycleData | null;


  hasBirthProfile: boolean;


  hasVault: boolean;


  lang: Lang;

  weekAhead: WeekAheadData | null;

  birthDisplayName: string;
  memberCharts: Array<{ memberId: string; displayName: string }>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;

}) {


  const [view, setView] = useState<CalendarView>("panchangam");

  const nowMinutes = (() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (selectedDate !== todayStr) return -1;
    return now.getHours() * 60 + now.getMinutes();
  })();





  const tithiPaksha = panchangam


    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`


    : null;





  return (


    <div className="tab-section">


      {/* Header */}


      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>


        <div>


          <p className="section-kicker">{t("calendar_kicker", lang)}</p>


          <h2 className="section-title">{formatDateLabel(selectedDate)} — {t("calendar_title", lang)}</h2>


          <p className="section-description">


            {panchangam ? `${tWeekday(panchangam.vara.weekday, lang)} · ${t("label_tithi2", lang)} ${tithiPaksha} · ${tNakshatra(panchangam.nakshatra.name, lang)} ${t("label_nakshatra2", lang)}` : t("label_tithi2", lang)}


          </p>


        </div>


        {/* View toggle */}


        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "4px" }}>


          {([


            ["panchangam", t("cal_panchangam", lang)],


            ["personal",   t("cal_personal", lang)],


            ["family",     t("cal_family", lang)],


          ] as [CalendarView, string][]).map(([v, label]) => (


            <button key={v} type="button" onClick={() => setView(v)}


              style={{


                padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer",


                fontSize: "0.8rem", fontWeight: view === v ? 700 : 400,


                background: view === v ? "rgba(255,255,255,0.12)" : "transparent",


                color: view === v ? "#fff" : "rgba(255,255,255,0.5)",


                transition: "all 0.15s",


              }}>


              {label}


            </button>


          ))}


        </div>


      </div>





      {/* ”¬”¬ PANCHANGAM VIEW ”¬”¬ */}


      {/* Member selector — only shown on personal view; panchangam is shared, family shows all members */}
      {memberCharts.length > 0 && view === "personal" && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", margin: "12px 0" }}>
          <button
            type="button"
            onClick={() => onSelectMember(null)}
            style={{
              padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: selectedMemberId === null ? 700 : 400,
              background: selectedMemberId === null ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",
              color: selectedMemberId === null ? "#e5b84d" : "rgba(255,255,255,0.55)",
              outline: selectedMemberId === null ? "1px solid rgba(229,184,77,0.5)" : "1px solid transparent",
            }}
          >
            &#9676; {birthDisplayName || "You"}
          </button>
          {memberCharts.map((mc) => (
            <button
              key={mc.memberId}
              type="button"
              onClick={() => onSelectMember(mc.memberId)}
              style={{
                padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: selectedMemberId === mc.memberId ? 700 : 400,
                background: selectedMemberId === mc.memberId ? "rgba(147,197,253,0.2)" : "rgba(255,255,255,0.06)",
                color: selectedMemberId === mc.memberId ? "#93c5fd" : "rgba(255,255,255,0.5)",
                outline: selectedMemberId === mc.memberId ? "1px solid rgba(147,197,253,0.4)" : "1px solid transparent",
              }}
            >
              {mc.displayName}
            </button>
          ))}
        </div>
      )}

      {view === "panchangam" && (


        <div className="two-col two-col--wide">


          {/* Left: Five limbs */}


          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


            <Surface title={t("surface_panja", lang)}>


              {panchangam ? (


                <div className="stack">


                  {/* Vara */}


                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>


                    <span style={{ fontSize: "1.4rem" }}>🌄</span>


                    <div>


                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_vaaram", lang)}</p>


                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{tWeekday(panchangam.vara.weekday, lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{tPlanetLord(panchangam.vara.lord, lang)} {t("lord_word", lang)}</p>


                    </div>


                  </div>


                  {/* Tithi */}


                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>


                    <span style={{ fontSize: "1.4rem" }}>🌙</span>


                    <div style={{ flex: 1 }}>


                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_tithi2", lang)}</p>


                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{tTithi(panchangam.tithi.name, lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{tithiPaksha} · {formatClockLabel(panchangam.tithi.endsAt)} {t("until_word", lang)}</p>


                    </div>


                  </div>


                  {/* Nakshatra */}


                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>


                    <span style={{ fontSize: "1.4rem" }}>⭐</span>


                    <div style={{ flex: 1 }}>


                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_nakshatra2", lang)}</p>


                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{tNakshatra(panchangam.nakshatra.name, lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{t("label_padam", lang)} {panchangam.nakshatra.pada} · {formatClockLabel(panchangam.nakshatra.endsAt)} {t("until_word", lang)}</p>


                    </div>


                  </div>


                  {/* Yoga */}


                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>


                    <span style={{ fontSize: "1.4rem" }}>✦</span>


                    <div>


                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_yogam", lang)}</p>


                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{tYoga(panchangam.yoga.name, lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{t("label_yogam", lang)} {panchangam.yoga.number}</p>


                    </div>


                  </div>


                  {/* Karana */}


                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>


                    <span style={{ fontSize: "1.4rem" }}>◑</span>


                    <div>


                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_karanam", lang)}</p>


                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{tKarana(panchangam.karana.name, lang)}</p>


                    </div>


                  </div>


                  {/* Sunrise / Sunset */}


                  <div style={{ display: "flex", gap: "8px" }}>


                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>


                      <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{t("label_sunrise", lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#fbbf24" }}>{formatClockLabel(panchangam.sunrise)}</p>


                    </div>


                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>


                      <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{t("label_sunset", lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#a78bfa" }}>{formatClockLabel(panchangam.sunset)}</p>


                    </div>


                  </div>


                </div>


              ) : (


                <p className="empty-state">{t("panja_empty", lang)}</p>


              )}


            </Surface>


            {/* Inauspicious periods */}


            <Surface title={t("surface_kala", lang)}>


              {panchangam ? (


                <div className="stack">


                  <div style={{


                    padding: "12px 16px", borderRadius: "8px",


                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(248,113,113,0.3)",


                  }}>


                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#f87171", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_rahu_kalam", lang)}</p>


                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>


                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>


                        {formatClockLabel(panchangam.kalam.rahuKalam.start)} – {formatClockLabel(panchangam.kalam.rahuKalam.end)}


                      </span>


                      <Chip tone="warning">{t("label_rahu_avoid", lang)}</Chip>


                    </div>


                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.rahuKalam.slot}/8</p>


                  </div>


                  <div style={{


                    padding: "12px 16px", borderRadius: "8px",


                    background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)",


                  }}>


                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#fbbf24", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_yamagandam", lang)}</p>


                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fbbf24" }}>


                      {formatClockLabel(panchangam.kalam.yamagandam.start)} – {formatClockLabel(panchangam.kalam.yamagandam.end)}


                    </span>


                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.yamagandam.slot}/8</p>


                  </div>


                  <div style={{


                    padding: "12px 16px", borderRadius: "8px",


                    background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.2)",


                  }}>


                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_kuligai", lang)}</p>


                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#94a3b8" }}>


                      {formatClockLabel(panchangam.kalam.kuligai.start)} – {formatClockLabel(panchangam.kalam.kuligai.end)}


                    </span>


                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.kuligai.slot}/8</p>


                  </div>


                  {/* Nalla Neram */}


                  {panchangam.kalam.nallaNeram && (
                  <div style={{


                    padding: "12px 16px", borderRadius: "8px",


                    background: "rgba(74,222,128,0.09)", border: "1px solid rgba(74,222,128,0.3)",


                  }}>


                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#4ade80", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_nalla_neram", lang)}</p>


                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4ade80" }}>


                      {formatClockLabel(panchangam.kalam.nallaNeram.start)} – {formatClockLabel(panchangam.kalam.nallaNeram.end)}


                    </span>


                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.nallaNeram.slot}/8</p>


                  </div>
                  )}


                  {/* Abhijit */}


                  <div style={{


                    padding: "12px 16px", borderRadius: "8px",


                    background: panchangam.abhijit.isRestrictedByWeekday


                      ? "rgba(148,163,184,0.04)"


                      : "rgba(74,222,128,0.07)",


                    border: panchangam.abhijit.isRestrictedByWeekday


                      ? "1px solid rgba(148,163,184,0.15)"


                      : "1px solid rgba(74,222,128,0.25)",


                  }}>


                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: panchangam.abhijit.isRestrictedByWeekday ? "#94a3b8" : "#4ade80", fontWeight: 700, letterSpacing: "0.05em" }}>


                      {t("label_abhijit", lang)} {panchangam.abhijit.isRestrictedByWeekday ? t("label_restricted", lang) : "✓"}


                    </p>


                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: panchangam.abhijit.isRestrictedByWeekday ? "#94a3b8" : "#4ade80" }}>


                      {formatClockLabel(panchangam.abhijit.start)} – {formatClockLabel(panchangam.abhijit.end)}


                    </span>


                  </div>


                </div>


              ) : (


                <p className="empty-state">{t("kala_empty", lang)}</p>


              )}


            </Surface>


          </div>





          {/* Right: Horas */}


          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


            {/* Hora table */}


            {panchangam && panchangam.hora.length > 0 && (


              <Surface title={t("surface_hora", lang)}>


                <div className="stack" style={{ maxHeight: "320px", overflowY: "auto" }}>


                  {panchangam.hora.map((h) => <HoraRow key={h.index} hora={h} lang={lang} nowMinutes={nowMinutes} />)}


                </div>


              </Surface>


            )}


          </div>


        </div>


      )}





      {/* ”¬”¬ PERSONAL FORTUNE VIEW ”¬”¬ */}


      {view === "personal" && (


        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


          {!hasBirthProfile ? (


            <div style={{ textAlign: "center", padding: "48px" }}>


              <p className="empty-state">{t("cal_no_profile", lang)}</p>


            </div>


          ) : (


            <>


              {/* FEATURE-07: Week Ahead Digest */}

              {weekAhead && (

                <Surface key={`wa-${selectedMemberId ?? "owner"}`} title={t("week_ahead_label", lang)}>

                  <div style={{ marginBottom: "10px" }}>

                    <p style={{ margin: "0 0 3px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>

                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{t("week_dasha_theme", lang)}: </span>

                      {lang === "ta" ? weekAhead.dashaThemeTa : weekAhead.dashaThemeEn}

                    </p>

                    <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>

                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{t("week_best_day", lang)}: </span>

                      <strong style={{ color: "#4ade80" }}>{formatDateLabel(weekAhead.bestDay)}</strong> — {weekAhead.bestDayScore}/100

                    </p>

                  </div>

                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>

                    {weekAhead.days.map((day) => {

                      const isBest = day.dateLocal === weekAhead.bestDay;

                      const isChandrashtama = day.isChandrashtama;

                      const isSpecial = !!day.specialTithi;

                      const scoreBand = getScoreBand(day.score);

                      return (

                        <div key={day.dateLocal} style={{

                          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",

                          padding: "8px 10px", borderRadius: "8px", minWidth: "52px",

                          background: isBest ? "rgba(74,222,128,0.08)" : isSpecial ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.025)",

                          border: `1px solid ${isBest ? "rgba(74,222,128,0.3)" : isChandrashtama ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.06)"}`,

                        }}>

                          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>

                            {new Date(day.dateLocal + "T00:00:00Z").toLocaleDateString("en", { weekday: "short" })}

                          </span>

                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: scoreBand.tone === "high" ? "#4ade80" : scoreBand.tone === "low" ? "#f87171" : "rgba(255,255,255,0.7)" }}>

                            {day.score}

                          </span>

                          {isBest && <span style={{ fontSize: "0.65rem", color: "#4ade80" }}>★</span>}

                          {isChandrashtama && <span style={{ fontSize: "0.65rem", color: "#fbbf24" }}>⚠</span>}

                          {isSpecial && !isChandrashtama && <span style={{ fontSize: "0.65rem", color: "#f59e0b" }}>●</span>}

                        </div>

                      );

                    })}

                  </div>

                </Surface>

              )}


              {/* Today's score card */}


              {dailyGuidance && (


                <div style={{


                  padding: "20px 24px", borderRadius: "12px",


                  background: `linear-gradient(135deg, ${getScoreBand(dailyGuidance.score).tone === "high" ? "rgba(74,222,128,0.12)" : getScoreBand(dailyGuidance.score).tone === "low" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.10)"} 0%, rgba(255,255,255,0.02) 100%)`,


                  border: `1px solid ${getScoreBand(dailyGuidance.score).tone === "high" ? "rgba(74,222,128,0.3)" : getScoreBand(dailyGuidance.score).tone === "low" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`,


                }}>


                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>


                    <div>


                      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>


                        {chartSummary?.displayName ?? t("personal_kicker", lang)} — {formatDateLabel(selectedDate)}


                      </p>


                      <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>


                        {dailyGuidance.score}<span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/100</span>


                      </p>


                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>{dailyGuidance.label}</p>


                    </div>


                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>


                      {dailyGuidance.bestWindows.slice(0, 2).map((w) => (


                        <Chip key={w.start} tone="success">✓ {t("best_time", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


                      ))}


                      {dailyGuidance.cautionWindows.slice(0, 1).map((w) => (


                        <Chip key={w.start} tone="warning">⚠ {t("caution_time", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


                      ))}


                    </div>


                  </div>


                  <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{tLang(dailyGuidance.text, lang)}</p>


                  {transit?.isChandrashtama && (


                    <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(248,113,113,0.4)" }}>


                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#f87171", fontWeight: 600 }}>


                        {t("chandrashtama_warning", lang)}


                      </p>


                    </div>


                  )}


                </div>


              )}





              {/* Score breakdown */}


              {dailyGuidance && (


                <Surface title={t("cal_score_label", lang)}>


                  <div className="surface__metrics">


                    <Metric label={t("label_moon_transit", lang)} value={`${dailyGuidance.scoreBreakdown.moonTransit}`} tone="mid" />


                    <Metric label={t("label_dasha_support", lang)} value={`${dailyGuidance.scoreBreakdown.dashaSupport}`} tone="mid" />


                    <Metric label={t("label_panchangam", lang)} value={`${dailyGuidance.scoreBreakdown.panchangam}`} tone="mid" />


                    <Metric label={t("label_gochar_pos", lang)} value={`${dailyGuidance.scoreBreakdown.gocharSupport}`} tone="mid" />


                  </div>


                  {tLang(dailyGuidance.actionSuggestion, lang) && (


                    <div className="surface__textBlock">


                      <p className="surface__subhead">{t("cal_action", lang)}</p>


                      <p className="surface__text">{tLang(dailyGuidance.actionSuggestion, lang)}</p>


                    </div>


                  )}


                  {tLang(dailyGuidance.cautionSuggestion, lang) && (


                    <div className="surface__textBlock">


                      <p className="surface__subhead">{t("cal_caution_sugg", lang)}</p>


                      <p className="surface__text">{tLang(dailyGuidance.cautionSuggestion, lang)}</p>


                    </div>


                  )}


                  {dailyGuidance.reasons && (


                    <div className="surface__textBlock" style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px" }}>


                      <p className="surface__subhead" style={{ marginBottom: "8px" }}>{t("why_this_prediction", lang)}</p>


                      {(["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const).map((key) => (


                        <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>


                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", minWidth: "90px", paddingTop: "2px" }}>


                            {t(`reason_${key}` as any, lang)}


                          </span>


                          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>


                            {tLang(dailyGuidance.reasons[key], lang)}


                          </p>


                        </div>


                      ))}


                    </div>


                  )}


                  {dailyGuidance.remedy && (


                    <div className="surface__textBlock" style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>


                      <p className="surface__subhead" style={{ color: "#fbbf24", marginBottom: "4px" }}>{t("remedy_label", lang)}</p>


                      <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{tLang(dailyGuidance.remedy, lang)}</p>


                    </div>


                  )}


                </Surface>


              )}





              {/* 3-day range */}


              {dailyGuidanceRange && (


                <Surface title={t("cal_3days", lang)}>


                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>


                    {dailyGuidanceRange.items.map((item) => {


                      const band = getScoreBand(item.score);


                      return (


                        <div key={item.dateLocal} style={{


                          padding: "14px", borderRadius: "10px",


                          background: band.tone === "high" ? "rgba(74,222,128,0.08)" : band.tone === "low" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",


                          border: `1px solid ${band.tone === "high" ? "rgba(74,222,128,0.25)" : band.tone === "low" ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.1)"}`,


                        }}>


                          <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{formatDateLabel(item.dateLocal)}</p>


                          <p style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 800 }}>{item.score}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/100</span></p>


                          <p style={{ margin: 0, fontSize: "0.72rem", color: band.tone === "high" ? "#4ade80" : band.tone === "low" ? "#f87171" : "#fbbf24" }}>{item.label}</p>


                          {item.bestWindows[0] && (


                            <p style={{ margin: "6px 0 0", fontSize: "0.67rem", color: "rgba(255,255,255,0.35)" }}>


                              {t("best_time", lang)} {formatClockLabel(item.bestWindows[0].start)}–{formatClockLabel(item.bestWindows[0].end)}


                            </p>


                          )}


                        </div>


                      );


                    })}


                  </div>


                </Surface>


              )}





              {/* Sani cycle */}


              {sani?.moonBasedCycle.isActive && (


                <Surface title={t("cal_sani", lang)}>


                  <div className="surface__metrics">


                    <Metric label={t("cal_sani_pos", lang)} value={sani.moonBasedCycle.type ?? "—"} hint={sani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />


                    <Metric label={t("cal_sani_rasi", lang)} value={sani.saturnRasi} hint={`Moon ${sani.positionFromMoon}th house`} tone="low" />


                  </div>


                  <p className="surface__text" style={{ marginTop: "8px" }}>{sani.confirmationSentence}</p>


                </Surface>


              )}


            </>


          )}


        </div>


      )}





      {/* ”¬”¬ FAMILY FORTUNE VIEW ”¬”¬ */}


      {view === "family" && (


        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


          {!hasVault ? (


            <div style={{ textAlign: "center", padding: "48px" }}>


              <p className="empty-state">{t("cal_no_vault", lang)}</p>


            </div>


          ) : !familyAggregate ? (


            <p className="empty-state">{t("cal_loading", lang)}</p>


          ) : (


            <>


              {/* Family score card */}


              <div style={{


                padding: "20px 24px", borderRadius: "12px",


                background: `linear-gradient(135deg, ${getScoreBand(familyAggregate.familyScore).tone === "high" ? "rgba(74,222,128,0.12)" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.10)"} 0%, rgba(255,255,255,0.02) 100%)`,


                border: `1px solid ${getScoreBand(familyAggregate.familyScore).tone === "high" ? "rgba(74,222,128,0.3)" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`,


              }}>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>


                  <div>


                    <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>


                      {t("cal_fam_title", lang)} — {formatDateLabel(selectedDate)}


                    </p>


                    <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>


                      {familyAggregate.familyScore}<span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/100</span>


                    </p>


                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>{familyAggregate.familyLabel}</p>


                  </div>


                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>


                    {familyAggregate.bestFamilyWindows.slice(0, 2).map((w) => (


                      <Chip key={`${w.type}-${w.start}`} tone="success">✓ {w.type} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


                    ))}


                    {familyAggregate.avoidForFamilyDecisions.slice(0, 1).map((w) => (


                      <Chip key={`${w.type}-${w.start}`} tone="warning">⚠ {t("cal_avoid_fam", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


                    ))}


                    {familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (


                      <Chip tone="warning">⚠ {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}</Chip>


                    )}


                  </div>


                </div>


                <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{tLang(familyAggregate.summary, lang)}</p>


              </div>





              {/* Aggregate breakdown */}


              <Surface title={t("cal_breakdown", lang)}>


                <div className="surface__metrics">


                  <Metric label={t("cal_mean_score", lang)} value={`${familyAggregate.aggregateBreakdown.meanScore.toFixed(0)}`} tone="mid" />


                  <Metric label={t("support_need", lang)} value={`${familyAggregate.aggregateBreakdown.supportNeedIndex}`} hint="0–100" tone="low" />


                  <Metric label={t("decision_ready", lang)} value={`${familyAggregate.aggregateBreakdown.decisionReadinessIndex}`} hint="0–100" tone="high" />


                  <Metric label={t("members_label_pl", lang)} value={`${familyAggregate.members.length}`} hint={`${familyAggregate.aggregateBreakdown.lowScoreCount}`} tone="rest" />


                </div>


              </Surface>





              {/* Member scores */}


              <Surface title={t("cal_member_scores", lang)}>


                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>


                  {familyAggregate.members.map((m) => {


                    const band = getScoreBand(m.individualScore);


                    const barColor = band.tone === "high" ? "#4ade80" : band.tone === "low" ? "#f87171" : "#fbbf24";


                    return (


                      <div key={m.familyMemberId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>


                        <span style={{ fontSize: "0.8rem", minWidth: "100px", color: "rgba(255,255,255,0.7)" }}>{m.displayName}</span>


                        <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>


                          <div style={{ width: `${m.individualScore}%`, height: "100%", borderRadius: "999px", background: barColor }} />


                        </div>


                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: barColor, minWidth: "44px", textAlign: "right" }}>{m.individualScore}/100</span>


                      </div>


                    );


                  })}


                </div>


              </Surface>





              {/* 7-day family fortune calendar */}


              {familyCalendar && (


                <Surface title={t("cal_7days", lang)}>


                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>


                    {/* Week header strip */}


                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" }}>


                      {familyCalendar.items.map((item) => {


                        const band = getScoreBand(item.familyScore);


                        const accentColor = band.tone === "high" ? "#4ade80" : band.tone === "low" ? "#f87171" : band.tone === "mid" ? "#fbbf24" : "#94a3b8";


                        const bgColor = band.tone === "high" ? "rgba(74,222,128,0.07)" : band.tone === "low" ? "rgba(248,113,113,0.07)" : band.tone === "mid" ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)";


                        const dayAbbr = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(item.dateLocal + "T00:00:00Z"));


                        const dayNum = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" }).format(new Date(item.dateLocal + "T00:00:00Z"));


                        return (


                          <div key={item.dateLocal} style={{


                            display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",


                            padding: "12px 6px", borderRadius: "12px",


                            background: bgColor,


                            border: `1px solid ${accentColor}33`,


                          }}>


                            {/* Day label */}


                            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{dayAbbr}</span>


                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{dayNum}</span>


                            {/* Score ring */}


                            <div style={{


                              width: "46px", height: "46px", borderRadius: "50%",


                              border: `3px solid ${accentColor}66`,


                              background: `${accentColor}12`,


                              display: "flex", alignItems: "center", justifyContent: "center",


                              boxShadow: `0 0 12px ${accentColor}22`,


                            }}>


                              <span style={{ fontSize: "0.88rem", fontWeight: 900, color: accentColor, lineHeight: 1 }}>{item.familyScore}</span>


                            </div>


                            {/* Score bar */}


                            <div style={{ width: "100%", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>


                              <div style={{ width: `${item.familyScore}%`, height: "100%", borderRadius: "999px", background: accentColor }} />


                            </div>


                            {/* Label */}


                            <span style={{ fontSize: "0.58rem", color: accentColor, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{item.familyLabel}</span>


                            {/* Best window */}


                            {item.bestFamilyWindows[0] && (


                              <span style={{ fontSize: "0.55rem", color: "rgba(74,222,128,0.7)", textAlign: "center", lineHeight: 1.3 }}>


                                {t("best_time", lang)} {formatClockLabel(item.bestFamilyWindows[0].start)}


                              </span>


                            )}


                          </div>


                        );


                      })}


                    </div>


                    {/* Summary row */}


                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>


                      {familyCalendar.items.filter((item) => getScoreBand(item.familyScore).tone === "high").slice(0, 2).map((item) => (


                        <div key={item.dateLocal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>


                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", whiteSpace: "nowrap" }}>


                            {formatDateLabel(item.dateLocal)} · {item.familyScore}


                          </span>


                          <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{tLang(item.summary, lang)}</p>


                        </div>


                      ))}


                    </div>


                  </div>


                </Surface>


              )}


            </>


          )}


        </div>


      )}


    </div>


  );


}






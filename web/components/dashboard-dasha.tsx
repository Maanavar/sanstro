"use client";



import { t, tPlanetLord } from "@/lib/i18n";

import type { Lang } from "@/lib/i18n";

import type { DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";

export const DASHA_COLORS: Record<string, string> = {


  SUN: "#f59e0b", MOON: "#93c5fd", MARS: "#f87171", MERCURY: "#34d399",


  JUPITER: "#fbbf24", VENUS: "#f0abfc", SATURN: "#94a3b8", RAHU: "#a78bfa", KETU: "#6b7280",


};





export function dashaStatus(startDate: string, endDate: string, today: string): "past" | "active" | "upcoming" {

  if (endDate < today) return "past";


  if (startDate <= today && endDate >= today) return "active";


  return "upcoming";


}





function dashaScore(lord: string, dashaSupport: number): number {


  // Rough lord-based baseline score (0-100); active period overrides with real dashaSupport


  const BASE: Record<string, number> = {


    JUPITER: 78, VENUS: 72, MERCURY: 65, MOON: 62, SUN: 58,


    MARS: 52, SATURN: 48, RAHU: 44, KETU: 42,


  };


  return BASE[lord] ?? 55;


}





function ageAtDate(birthDateLocal: string | undefined, targetDate: string): number | null {
  if (!birthDateLocal) return null;
  const birth = new Date(birthDateLocal);
  const target = new Date(targetDate);
  let age = target.getFullYear() - birth.getFullYear();
  if (target.getMonth() < birth.getMonth() || (target.getMonth() === birth.getMonth() && target.getDate() < birth.getDate())) age--;
  return age;
}
export function DashaTimeline({

  dasha,


  dashaAntar,


  today,


  dashaSupport,


  lang,

  birthDateLocal,

  currentPeriodCaution,

  currentPeriodAction,

}: {


  dasha: DashaTimelineResponseData;


  dashaAntar: DashaTimelineItem[];


  today: string;


  dashaSupport: number;


  lang: Lang;

  birthDateLocal?: string;

  currentPeriodCaution?: string;

  currentPeriodAction?: string;

}) {


  const currentMahaDasa = dasha.current.mahadasha.lord;


  const currentBhukti = dasha.current.antardasha.lord;





  return (


    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>


      {dasha.timeline.map((period) => {


        const status = dashaStatus(String(period.startDate), String(period.endDate), today);


        const isCurrentDasa = period.lord === currentMahaDasa && status === "active";


        const color = DASHA_COLORS[period.lord] ?? "#94a3b8";


        const score = isCurrentDasa ? dashaSupport : dashaScore(period.lord, dashaSupport);


        const isPast = status === "past";





        return (


          <div key={`${period.lord}-${period.startDate}`} style={{


            borderRadius: "10px",


            border: isCurrentDasa


              ? `2px solid ${color}99`


              : isPast


                ? "1px solid rgba(255,255,255,0.05)"


                : "1px solid rgba(255,255,255,0.07)",


            background: isCurrentDasa


              ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`


              : isPast


                ? "rgba(255,255,255,0.01)"


                : "rgba(255,255,255,0.02)",


            overflow: "hidden",


          }}>


            {/* Running Dasa glow bar */}


            {isCurrentDasa && (


              <div style={{ height: "3px", background: `linear-gradient(90deg, ${color}, ${color}44)`, borderRadius: "10px 10px 0 0" }} />


            )}





            {/* Maha Dasa row */}


            <div style={{


              display: "flex", alignItems: "center", gap: "10px",


              padding: isCurrentDasa ? "10px 14px 8px" : "7px 12px",


            }}>


              <div style={{


                width: isCurrentDasa ? "12px" : "8px",


                height: isCurrentDasa ? "12px" : "8px",


                borderRadius: "50%", background: color, flexShrink: 0,


                boxShadow: isCurrentDasa ? `0 0 8px ${color}` : "none",


              }} />


              <span style={{


                fontSize: isCurrentDasa ? "0.92rem" : "0.82rem",


                fontWeight: isCurrentDasa ? 800 : isPast ? 400 : 500,


                color: isCurrentDasa ? color : isPast ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.65)",


                minWidth: "90px",


              }}>


                {tPlanetLord(period.lord, lang)} {t("dasha_word", lang)}


              </span>


              <span style={{ fontSize: "0.72rem", color: isPast ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)", flex: 1 }}>


                {String(period.startDate)} → {String(period.endDate)}


              </span>


              <span style={{


                fontSize: "0.68rem", fontWeight: 700, padding: "2px 10px", borderRadius: "999px",


                background: isCurrentDasa ? color + "33" : isPast ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.04)",


                color: isCurrentDasa ? color : isPast ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)",


                border: `1px solid ${isCurrentDasa ? color + "77" : "rgba(255,255,255,0.07)"}`,


              }}>


                {isCurrentDasa ? t("status_active", lang) : isPast ? t("status_past", lang) : t("status_upcoming", lang)}


              </span>


              <span style={{


                fontSize: "0.75rem", fontWeight: 700, minWidth: "52px", textAlign: "right",


                color: isCurrentDasa


                  ? (score >= 65 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#f87171")


                  : isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",


              }}>


                {isCurrentDasa || !isPast ? `${score}/100` : "—"}


              </span>


            </div>





            {/* Bhukti rows — only under current running Dasa */}


            {isCurrentDasa && dashaAntar.length > 0 && (


              <div style={{


                margin: "0 10px 10px 34px",


                borderLeft: `2px solid ${color}44`,


                paddingLeft: "12px",


                display: "flex", flexDirection: "column", gap: "2px",


              }}>


                {dashaAntar.map((bhukti) => {


                  const bhuktiStatus = dashaStatus(String(bhukti.startDate), String(bhukti.endDate), today);


                  const isCurrentBhukti = bhukti.lord === currentBhukti && bhuktiStatus === "active";


                  const bhuktiColor = DASHA_COLORS[bhukti.lord] ?? "#94a3b8";


                  const bhuktiScore = isCurrentBhukti ? Math.round(dashaSupport * 0.9) : dashaScore(bhukti.lord, dashaSupport);


                  const bhuktiPast = bhuktiStatus === "past";


                  return (


                    <div key={`bhukti-${bhukti.lord}-${bhukti.startDate}`}>


                      <div style={{


                        display: "flex", alignItems: "center", gap: "8px",


                        padding: isCurrentBhukti ? "6px 10px" : "4px 8px",


                        borderRadius: "7px",


                        background: isCurrentBhukti ? `${bhuktiColor}22` : "transparent",


                        border: isCurrentBhukti


                          ? `1px solid ${bhuktiColor}66`


                          : bhuktiPast


                            ? "1px solid rgba(255,255,255,0.04)"


                            : "1px solid rgba(255,255,255,0.05)",


                      }}>


                        <div style={{


                          width: isCurrentBhukti ? "8px" : "5px",


                          height: isCurrentBhukti ? "8px" : "5px",


                          borderRadius: "50%", background: bhuktiColor, flexShrink: 0,


                          boxShadow: isCurrentBhukti ? `0 0 6px ${bhuktiColor}` : "none",


                        }} />


                        <span style={{


                          fontSize: isCurrentBhukti ? "0.82rem" : "0.75rem",


                          fontWeight: isCurrentBhukti ? 700 : bhuktiPast ? 300 : 400,


                          color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",


                          minWidth: "80px",


                        }}>


                          {tPlanetLord(bhukti.lord, lang)} {t("bhukti_word", lang)}


                        </span>


                        <span style={{ fontSize: "0.67rem", color: bhuktiPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)", flex: 1 }}>


                          {String(bhukti.startDate)} → {String(bhukti.endDate)}
                          {(() => { const age = ageAtDate(birthDateLocal, String(bhukti.startDate)); return age !== null ? <span style={{ marginLeft: "4px", fontSize: "0.58rem", opacity: 0.5 }}>({age}yr)</span> : null; })()}


                        </span>


                        <span style={{


                          fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",


                          background: isCurrentBhukti ? `${bhuktiColor}33` : bhuktiPast ? "rgba(255,255,255,0.04)" : "transparent",


                          color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)",


                          border: `1px solid ${isCurrentBhukti ? bhuktiColor + "66" : "rgba(255,255,255,0.06)"}`,


                        }}>


                          {isCurrentBhukti ? t("status_active", lang) : bhuktiPast ? t("status_past", lang) : t("status_upcoming", lang)}


                        </span>


                        <span style={{


                          fontSize: "0.7rem", fontWeight: 700, minWidth: "44px", textAlign: "right",


                          color: isCurrentBhukti


                            ? (bhuktiScore >= 65 ? "#4ade80" : bhuktiScore >= 45 ? "#fbbf24" : "#f87171")


                            : bhuktiPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.3)",


                        }}>


                          {isCurrentBhukti || !bhuktiPast ? `${bhuktiScore}/100` : "—"}


                        </span>


                      </div>





                      {/* Antaram — only under current running Bhukti */}


                      {isCurrentBhukti && (


                        <div style={{ marginLeft: "20px", marginTop: "2px", borderLeft: `2px solid ${bhuktiColor}33`, paddingLeft: "10px" }}>


                          {[dasha.current.pratyantardasha].map((antaram) => {


                            const antaramColor = DASHA_COLORS[antaram.lord] ?? "#94a3b8";


                            return (


                              <div key={`antaram-${antaram.lord}`} style={{


                                display: "flex", alignItems: "center", gap: "6px",


                                padding: "4px 8px", borderRadius: "5px",


                                background: `${antaramColor}18`,


                                border: `1px solid ${antaramColor}55`,


                              }}>


                                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: antaramColor, flexShrink: 0, boxShadow: `0 0 4px ${antaramColor}` }} />


                                <span style={{ fontSize: "0.73rem", fontWeight: 700, color: antaramColor, minWidth: "72px" }}>


                                  {tPlanetLord(antaram.lord, lang)} {t("antaram_word", lang)}


                                </span>


                                <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.25)", flex: 1 }}>


                                  {String(antaram.startDate)} → {String(antaram.endDate)}


                                </span>


                                <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px", background: `${antaramColor}33`, color: antaramColor, border: `1px solid ${antaramColor}66` }}>


                                  {t("status_active", lang)}


                                </span>


                              </div>


                            );


                          })}


                        </div>


                      )}


                    </div>


                  );


                })}


              </div>


            )}

            {isCurrentDasa && (currentPeriodCaution || currentPeriodAction) && (
              <div style={{ margin: "0 0 10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {currentPeriodAction && (
                  <div style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
                    <span style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{currentPeriodAction}</span>
                  </div>
                )}
                {currentPeriodCaution && (
                  <div style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "7px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <span style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: 700, flexShrink: 0 }}>&#9888;</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{currentPeriodCaution}</span>
                  </div>
                )}
              </div>
            )}


          </div>


        );


      })}


    </div>


  );


}






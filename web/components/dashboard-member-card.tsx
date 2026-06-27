"use client";





import { getScoreBand, formatClockLabel } from "@/lib/format";


import { t, tPlanetLord } from "@/lib/i18n";


import type { Lang } from "@/lib/i18n";


import type {


  ChartCalculateResponseData,


  ChartSummaryData,


  DailyGuidanceData,


  DashaTimelineItem,


  DashaTimelineResponseData,


  FamilyAggregateMember,


  TransitSnapshotData,


} from "@/lib/types";





import { NavamsaChart, RasiChart } from "./dashboard-charts";


import { DASHA_COLORS, dashaStatus } from "./dashboard-dasha";


import { Chip, ConfidenceBadge } from "./dashboard-ui";





type MemberChartData = {


  memberId: string;


  displayName: string;


  chart: ChartCalculateResponseData;


  summary: ChartSummaryData | null;


  transit: TransitSnapshotData | null;


  dailyGuidance: DailyGuidanceData | null;


  dasha: DashaTimelineResponseData | null;


  dashaAntar: DashaTimelineItem[];


};


export function MemberCard({


  member, memberChart, onDelete, onEdit, deletingId, today, lang,


}: {


  member: FamilyAggregateMember;


  memberChart: MemberChartData | undefined;


  onDelete: (memberId: string, name: string) => void;


  onEdit: (member: FamilyAggregateMember) => void;


  deletingId: string;


  today: string;


  lang: Lang;


}) {


  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;


  const band = getScoreBand(member.individualScore);





  return (


    <div style={{


      border: `1px solid ${isChandrashtama ? "var(--member-alert-border)" : "var(--veil-white-08)"}`,


      borderRadius: "12px",


      background: isChandrashtama


        ? "var(--member-alert-bg)"


        : "var(--veil-white-025)",


      padding: "16px",


      display: "flex", flexDirection: "column", gap: "12px",


    }}>


      {/* Header row */}


      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>


        <div style={{ flex: 1 }}>


          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>


            <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}>{member.displayName}</p>


            {isChandrashtama && (


              <span style={{


                fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",


                background: "var(--panel-warm-tint)", color: "var(--color-accent-strong, var(--planet-saturn))",


                border: "1px solid var(--cl-rust-edge)", animation: "pulse 2s infinite",


              }}>


                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}><svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "11px", height: "11px" }}><path d="M12 3l9 17H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="17" r="1.2" fill="currentColor" /></svg> {t("label_chandrashtamam", lang)}</span>


              </span>


            )}


          </div>


          <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "var(--veil-white-45)" }}>


            {member.individualScore}/100 · weight {member.memberWeight.toFixed(2)}


          </p>

          {memberChart?.dailyGuidance?.confidence && memberChart.dailyGuidance.confidenceReason && (
            <ConfidenceBadge
              level={memberChart.dailyGuidance.confidence as "HIGH" | "MEDIUM" | "LOW"}
              reason={memberChart.dailyGuidance.confidenceReason}
              lang={lang}
            />
          )}


        </div>


        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>


          <button type="button" className="button button--ghost"


            style={{ fontSize: "0.75rem", padding: "3px 10px" }}


            onClick={() => onEdit(member)} title="Edit member">


            Edit


          </button>


          <button type="button" className="button button--ghost"


            style={{ fontSize: "0.75rem", padding: "3px 10px", opacity: 0.6, color: "var(--color-accent-strong, var(--planet-saturn))" }}


            disabled={deletingId === member.familyMemberId}


            onClick={() => onDelete(member.familyMemberId, member.displayName)} title="Remove member">


            {deletingId === member.familyMemberId ? "…" : "Remove"}


          </button>


        </div>


      </div>





      {/* Score + cycle tags */}


      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>


        <span className={`chip chip--${band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}`}>


          {member.individualScore}/100 {band.label}


        </span>


        {memberChart?.dailyGuidance?.scoreBreakdown && (


          <span style={{ fontSize: "0.625rem", padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--chart-d1-lagna-bg)", border: "1px solid var(--cl-brand-edge)", color: "var(--color-accent, var(--panel-brand))", fontWeight: 600 }}>


            {t("dasha_word", lang)} {memberChart.dailyGuidance.scoreBreakdown.dashaSupport}/100


          </span>


        )}


        {member.activeCycleTags.map((tag) => (


          <Chip key={tag} tone={tag.includes("SANI") ? "warning" : "neutral"}>{tag}</Chip>


        ))}


      </div>





      {/* D1 + D9 charts */}


      {memberChart?.chart ? (


        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>


          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} lang={lang} />


          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} lang={lang} />


        </div>


      ) : (


        <p style={{ fontSize: "0.875rem", color: "var(--veil-white-30)", margin: 0 }}>


          {t("chart_loading", lang)}


        </p>


      )}





      {/* Identity line */}


      {memberChart?.summary ? (


        <p style={{ fontSize: "0.875rem", color: "var(--veil-white-55)", margin: 0 }}>


          {memberChart.summary.lagnaRasi} {t("label_lagnam", lang)} · {memberChart.summary.moonRasi} {t("identity_janma", lang)} · {memberChart.summary.janmaNakshatra}


        </p>


      ) : null}





      {/* Dasha / Bhukti verification strip */}


      {memberChart?.dasha ? (() => {


        const d = memberChart.dasha;


        const dashaColor = DASHA_COLORS[d.current.mahadasha.lord] ?? "var(--color-faint)";


        const bhuktiColor = DASHA_COLORS[d.current.antardasha.lord] ?? "var(--color-faint)";


        const antaramColor = DASHA_COLORS[d.current.pratyantardasha.lord] ?? "var(--color-faint)";


        return (


          <div style={{


            borderRadius: "8px", border: `1px solid ${dashaColor}55`,


            background: `${dashaColor}0d`, padding: "10px 12px",


            display: "flex", flexDirection: "column", gap: "6px",


          }}>


            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--veil-white-35)", fontWeight: 600, letterSpacing: "0.05em" }}>


              {t("dasha_bhukti_antaram", lang)}


            </p>


            {/* Maha Dasa */}


            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>


              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: dashaColor, flexShrink: 0 }} />


              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: dashaColor, minWidth: "90px" }}>


                {tPlanetLord(d.current.mahadasha.lord, lang)} {t("dasha_word", lang)}


              </span>


              <span style={{ fontSize: "0.75rem", color: "var(--veil-white-35)" }}>


                {d.current.mahadasha.startDate} → {d.current.mahadasha.endDate}


              </span>


            </div>


            {/* Bhukti */}


            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>


              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: bhuktiColor, flexShrink: 0 }} />


              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: bhuktiColor, minWidth: "82px" }}>


                {tPlanetLord(d.current.antardasha.lord, lang)} {t("bhukti_word", lang)}


              </span>


              <span style={{ fontSize: "0.625rem", color: "var(--veil-white-30)" }}>


                {d.current.antardasha.startDate} → {d.current.antardasha.endDate}


              </span>


            </div>


            {/* Antaram */}


            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "32px" }}>


              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: antaramColor, flexShrink: 0 }} />


              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: antaramColor, minWidth: "74px" }}>


                {tPlanetLord(d.current.pratyantardasha.lord, lang)} {t("antaram_word", lang)}


              </span>


              <span style={{ fontSize: "0.625rem", color: "var(--veil-white-25)" }}>


                {d.current.pratyantardasha.startDate} → {d.current.pratyantardasha.endDate}


              </span>


            </div>


            {/* All Bhukti periods for current Dasa — compact inline */}


            {memberChart.dashaAntar.length > 0 && (


              <div style={{ marginTop: "4px", borderTop: "1px solid var(--veil-white-06)", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>


                <p style={{ margin: "0 0 4px", fontSize: "0.625rem", color: "var(--veil-white-30)", letterSpacing: "0.04em" }}>


                  {tPlanetLord(d.current.mahadasha.lord, lang)} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}


                </p>


                {memberChart.dashaAntar.map((bh) => {


                  const bst = dashaStatus(String(bh.startDate), String(bh.endDate), today);


                  const isRunning = bh.lord === d.current.antardasha.lord && bst === "active";


                  const bc = DASHA_COLORS[bh.lord] ?? "var(--color-faint)";


                  return (


                    <div key={`mb-${bh.lord}-${bh.startDate}`} style={{


                      display: "flex", alignItems: "center", gap: "6px",


                      padding: isRunning ? "3px 6px" : "1px 4px",


                      borderRadius: "4px",


                      background: isRunning ? `${bc}1a` : "transparent",


                      border: isRunning ? `1px solid ${bc}44` : "1px solid transparent",


                      opacity: bst === "past" ? 0.4 : 1,


                    }}>


                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: bc, flexShrink: 0 }} />


                      <span style={{ fontSize: "0.75rem", fontWeight: isRunning ? 700 : 400, color: isRunning ? bc : "var(--veil-white-50)", minWidth: "70px" }}>


                        {tPlanetLord(bh.lord, lang)} {t("bhukti_word", lang)}


                      </span>


                      <span style={{ fontSize: "0.625rem", color: "var(--veil-white-25)", flex: 1 }}>


                        {String(bh.startDate)} → {String(bh.endDate)}


                      </span>


                      <span style={{


                        fontSize: "0.625rem", fontWeight: 600, padding: "1px 5px", borderRadius: "999px",


                        background: isRunning ? `${bc}33` : bst === "past" ? "var(--veil-white-04)" : "transparent",


                        color: isRunning ? bc : bst === "past" ? "var(--veil-white-20)" : "var(--veil-white-30)",


                        border: `1px solid ${isRunning ? bc + "55" : "var(--veil-white-06)"}`,


                      }}>


                        {isRunning ? t("status_active", lang) : bst === "past" ? t("status_past", lang) : t("status_upcoming", lang)}


                      </span>


                    </div>


                  );


                })}


              </div>


            )}


          </div>


        );


      })() : null}





      {/* Today's windows */}


      {memberChart?.dailyGuidance ? (


        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>


          {memberChart.dailyGuidance.bestWindows.slice(0, 2).map((w) => (


            <Chip key={w.start} tone="success">{t("best_time", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


          ))}


          {memberChart.dailyGuidance.cautionWindows.slice(0, 1).map((w) => (


            <Chip key={w.start} tone="warning">{t("caution_time", lang)} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>


          ))}


        </div>


      ) : null}


    </div>


  );


}






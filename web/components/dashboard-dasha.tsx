"use client";

import type { ReactNode } from "react";
import { t, tPlanetLord } from "@/lib/i18n";
import { plainLangDashaLord } from "@/lib/plainlang";
import type { Mode } from "@/lib/plainlang";
import type { Lang } from "@/lib/i18n";
import type { DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";

export const DASHA_COLORS: Record<string, string> = {
  SUN: "#B85A2C",
  MOON: "#1e5a8c",
  MARS: "#A8482F",
  MERCURY: "#5C7654",
  JUPITER: "#3a6b40",
  VENUS: "#7a4880",
  SATURN: "#7A6F5E",
  RAHU: "#5a4880",
  KETU: "#8c7a6e",
};

const SCORE_HIGH = "var(--color-score-high, #5C7654)";
const SCORE_MID = "var(--color-score-mid, #B85A2C)";
const SCORE_LOW = "var(--color-score-low, #A8482F)";

function scoreColor(score: number): string {
  if (score >= 65) return SCORE_HIGH;
  if (score >= 45) return SCORE_MID;
  return SCORE_LOW;
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function CheckGlyph() {
  return (
    <Glyph>
      <path d="M5 12.5L10 17L19 8" stroke={SCORE_HIGH} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  );
}

function AlertGlyph() {
  return (
    <Glyph>
      <path d="M12 3L21 20H3L12 3Z" stroke={SCORE_MID} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9V13.8" stroke={SCORE_MID} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="1.2" fill={SCORE_MID} />
    </Glyph>
  );
}

export function dashaStatus(startDate: string, endDate: string, today: string): "past" | "active" | "upcoming" {
  if (endDate < today) return "past";
  if (startDate <= today && endDate >= today) return "active";
  return "upcoming";
}

function dashaScore(lord: string): number {
  const base: Record<string, number> = {
    JUPITER: 78,
    VENUS: 72,
    MERCURY: 65,
    MOON: 62,
    SUN: 58,
    MARS: 52,
    SATURN: 48,
    RAHU: 44,
    KETU: 42,
  };
  return base[lord] ?? 55;
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
  mode = "BALANCED",
}: {
  dasha: DashaTimelineResponseData;
  dashaAntar: DashaTimelineItem[];
  today: string;
  dashaSupport: number;
  lang: Lang;
  birthDateLocal?: string;
  currentPeriodCaution?: string;
  currentPeriodAction?: string;
  mode?: Mode;
}) {
  const currentMahaDasa = dasha.current.mahadasha.lord;
  const currentBhukti = dasha.current.antardasha.lord;

  const allPeriods = dasha.timeline;
  const barStartMs = allPeriods[0]?.startDate ? new Date(String(allPeriods[0].startDate)).getTime() : 0;
  const barEndMs = allPeriods[allPeriods.length - 1]?.endDate
    ? new Date(String(allPeriods[allPeriods.length - 1].endDate)).getTime()
    : 1;
  const totalMs = Math.max(barEndMs - barStartMs, 1);
  const nowPct = Math.max(0, Math.min(100, ((new Date(today).getTime() - barStartMs) / totalMs) * 100));

  function pct(dateStr: string) {
    return Math.max(0, Math.min(100, ((new Date(String(dateStr)).getTime() - barStartMs) / totalMs) * 100));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <div
          style={{
            position: "relative",
            height: "36px",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--color-border, #E4DBC8)",
            border: "1px solid var(--color-border-strong, #D4C8AE)",
          }}
        >
          {allPeriods.map((period) => {
            const status = dashaStatus(String(period.startDate), String(period.endDate), today);
            const isActive = period.lord === currentMahaDasa && status === "active";
            const isPast = status === "past";
            const color = DASHA_COLORS[period.lord] ?? "var(--color-faint, #7A6F5E)";
            const left = pct(String(period.startDate));
            const segWidth = pct(String(period.endDate)) - left;
            return (
              <div
                key={`bar-${period.lord}-${period.startDate}`}
                title={`${period.lord} ${String(period.startDate).slice(0, 4)}-${String(period.endDate).slice(0, 4)}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  width: `${segWidth}%`,
                  top: 0,
                  bottom: 0,
                  background: isActive ? `linear-gradient(180deg, ${color}cc 0%, ${color}88 100%)` : isPast ? `${color}33` : `${color}55`,
                  borderRight: "1px solid rgba(212,200,174,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {segWidth > 6 && (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      color: isActive ? "var(--color-bg, #F4EEE2)" : isPast ? "var(--color-faint, #7A6F5E)" : color,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      padding: "0 var(--space-1)",
                    }}
                  >
                    {mode === "BEGINNER" ? plainLangDashaLord(period.lord, "BEGINNER", lang) : tPlanetLord(period.lord, lang)}
                  </span>
                )}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: `${nowPct}%`, top: 0, bottom: 0, width: "2px", background: "var(--color-text-strong, #1A1612)", zIndex: 2 }} />
        </div>

        <div style={{ position: "relative", height: "16px", marginTop: "var(--space-1)" }}>
          {allPeriods.map((period, i) => {
            const left = pct(String(period.startDate));
            if (i > 0 && left < 5) return null;
            return (
              <span
                key={`yr-${i}`}
                style={{ position: "absolute", left: `${left}%`, transform: "translateX(-50%)", fontSize: "0.625rem", color: "var(--color-faint, #7A6F5E)", whiteSpace: "nowrap" }}
              >
                {String(period.startDate).slice(0, 4)}
              </span>
            );
          })}
        </div>

        <div style={{ position: "relative", height: "24px" }}>
          <div style={{ position: "absolute", left: `${nowPct}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-0_5)" }}>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "6px solid var(--color-accent, #B85A2C)" }} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-accent, #B85A2C)", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
              {lang === "ta"
                ? `நீங்கள் இங்கே - ${tPlanetLord(currentMahaDasa, lang)} (${String(dasha.current.mahadasha.startDate).slice(0, 4)}-${String(dasha.current.mahadasha.endDate).slice(0, 4)})`
                : `YOU ARE HERE - ${currentMahaDasa} (${String(dasha.current.mahadasha.startDate).slice(0, 4)}-${String(dasha.current.mahadasha.endDate).slice(0, 4)})`}
            </span>
          </div>
        </div>
      </div>

      {(() => {
        const activePeriod = allPeriods.find((p) => p.lord === currentMahaDasa && dashaStatus(String(p.startDate), String(p.endDate), today) === "active");
        if (!activePeriod) return null;
        const color = DASHA_COLORS[activePeriod.lord] ?? "var(--color-faint, #7A6F5E)";
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-sm)", background: `${color}12`, border: `1px solid ${color}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color }}>
                {mode === "BEGINNER" ? plainLangDashaLord(activePeriod.lord, "BEGINNER", lang) : tPlanetLord(activePeriod.lord, lang)} {t("dasha_word", lang)}
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted, #675b4b)" }}>
              {String(activePeriod.startDate)} → {String(activePeriod.endDate)}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, marginLeft: "auto", color: scoreColor(dashaSupport) }}>
              {dashaSupport}/100
            </span>
          </div>
        );
      })()}

      {dashaAntar.length > 0 && (
        <div style={{ marginLeft: "var(--space-3)", borderLeft: `2px solid ${(DASHA_COLORS[currentMahaDasa] ?? "var(--color-faint, #7A6F5E)")}44`, paddingLeft: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-muted, #675b4b)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("bhukti_word", lang)}
          </p>
          {dashaAntar.map((bhukti) => {
            const bhuktiStatus = dashaStatus(String(bhukti.startDate), String(bhukti.endDate), today);
            const isCurrentBhukti = bhukti.lord === currentBhukti && bhuktiStatus === "active";
            const bhuktiColor = DASHA_COLORS[bhukti.lord] ?? "var(--color-faint, #7A6F5E)";
            const bhuktiScore = isCurrentBhukti ? Math.round(dashaSupport * 0.9) : dashaScore(bhukti.lord);
            const bhuktiPast = bhuktiStatus === "past";

            return (
              <div key={`bhukti-${bhukti.lord}-${bhukti.startDate}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: isCurrentBhukti ? "7px var(--space-3)" : "var(--space-1) var(--space-2)",
                    borderRadius: "var(--radius-sm)",
                    background: isCurrentBhukti ? `${bhuktiColor}22` : "transparent",
                    border: isCurrentBhukti ? `1px solid ${bhuktiColor}55` : "1px solid transparent",
                  }}
                >
                  <div style={{ width: isCurrentBhukti ? "8px" : "5px", height: isCurrentBhukti ? "8px" : "5px", borderRadius: "50%", background: bhuktiColor, flexShrink: 0, boxShadow: isCurrentBhukti ? `0 0 5px ${bhuktiColor}` : "none" }} />
                  <span style={{ fontSize: isCurrentBhukti ? "0.875rem" : "0.75rem", fontWeight: isCurrentBhukti ? 700 : bhuktiPast ? 300 : 400, color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "var(--color-faint, #7A6F5E)" : "var(--color-text, #3D352B)", minWidth: "80px" }}>
                    {mode === "BEGINNER" ? plainLangDashaLord(bhukti.lord, "BEGINNER", lang) : tPlanetLord(bhukti.lord, lang)}
                  </span>
                  <span style={{ fontSize: "0.625rem", color: "var(--color-muted, #675b4b)", flex: 1 }}>
                    {String(bhukti.startDate)} → {String(bhukti.endDate)}
                    {(() => {
                      const age = ageAtDate(birthDateLocal, String(bhukti.startDate));
                      return age !== null ? <span style={{ marginLeft: "var(--space-1)", fontSize: "0.625rem", opacity: 0.5 }}>({age}yr)</span> : null;
                    })()}
                  </span>
                  {isCurrentBhukti && (
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "1px var(--space-2)", borderRadius: "var(--radius-pill)", background: `${bhuktiColor}33`, color: bhuktiColor, border: `1px solid ${bhuktiColor}66` }}>
                      ● {lang === "ta" ? "இப்போது" : "NOW"}
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, minWidth: "40px", textAlign: "right", color: isCurrentBhukti ? scoreColor(bhuktiScore) : "var(--color-border-strong, #D4C8AE)" }}>
                    {isCurrentBhukti || !bhuktiPast ? `${bhuktiScore}/100` : "—"}
                  </span>
                </div>

                {isCurrentBhukti && (
                  <div style={{ marginLeft: "var(--space-5)", marginTop: "var(--space-1)", marginBottom: "var(--space-1)", borderLeft: `2px solid ${bhuktiColor}33`, paddingLeft: "var(--space-2)" }}>
                    {[dasha.current.pratyantardasha].map((antaram) => {
                      const antaramColor = DASHA_COLORS[antaram.lord] ?? "var(--color-faint, #7A6F5E)";
                      return (
                        <div key={`antaram-${antaram.lord}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-xs)", background: `${antaramColor}18`, border: `1px solid ${antaramColor}44` }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: antaramColor, flexShrink: 0, boxShadow: `0 0 4px ${antaramColor}` }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: antaramColor, minWidth: "72px" }}>
                            {mode === "BEGINNER" ? plainLangDashaLord(antaram.lord, "BEGINNER", lang) : tPlanetLord(antaram.lord, lang)} {t("antaram_word", lang)}
                          </span>
                          <span style={{ fontSize: "0.625rem", color: "var(--color-muted, #675b4b)", flex: 1 }}>
                            {String(antaram.startDate)} → {String(antaram.endDate)}
                          </span>
                          <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "1px var(--space-2)", borderRadius: "var(--radius-pill)", background: `${antaramColor}33`, color: antaramColor, border: `1px solid ${antaramColor}66` }}>
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

      {(currentPeriodCaution || currentPeriodAction) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {currentPeriodAction && (
            <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.35)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckGlyph /></span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-strong, #1A1612)", lineHeight: 1.4 }}>{currentPeriodAction}</span>
            </div>
          )}
          {currentPeriodCaution && (
            <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.35)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertGlyph /></span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-strong, #1A1612)", lineHeight: 1.4 }}>{currentPeriodCaution}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { CheckGlyph, AlertGlyph } from "./icons";
import { t, tPlanetLord } from "@/lib/i18n";
import { plainLangDashaLord, plainLangBiText } from "@/lib/plainlang";
import type { Mode } from "@/lib/plainlang";
import type { Lang } from "@/lib/i18n";
import type { DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";
import { scoreColor, SCORE_HIGH, SCORE_MID } from "@/lib/format";
import { GlossaryTerm } from "./glossary-term";

/**
 * A dasha lord's name, styled per mode (T12, UX_BLINDSPOT_HANDOFF_2026-08-23.md).
 *
 * BEGINNER prints the friendly gloss inline ("Saturn (discipline planet)").
 * TRADITIONAL prints the bare canonical name. BALANCED used to also print the
 * bare name — silently dropping the promise `mode_balanced_desc` makes to the
 * reader ("Some terms, with tooltips"): the canonical name, but tap-to-explain.
 * `plainLangBiText` is the same dictionary BEGINNER reads from; this just
 * surfaces it as a tooltip instead of inlining it, via `GlossaryTerm`'s
 * `definition` prop rather than its `term` lookup — dasha lords aren't in
 * `GLOSSARY`, which is concept-level (dasha, bhukti, …), not per-planet.
 *
 * Exported for `HyBhuktiTimeline` (dashboard-hybrid-parts.tsx), the dasha
 * panel actually rendered on Family & Charts — this file's own `DashaTimeline`
 * is unused there (only the Porutham/Jadhagam-generator tools render it). One
 * definition, so the two panels can't drift on what BALANCED mode means for a
 * planet name.
 *
 * `suppressGloss` — OWNER RULING 2026-08-24. The first bhukti of every
 * mahadasha carries its own lord, so a running stack repeats the name at two
 * levels one time in nine, and BEGINNER printed the parenthetical twice:
 * "Moon (mind planet) Mahadasha · Moon (mind planet) Bhukti". The ruling keeps
 * both period names — "Moon Bhukti" is correct and meaningful, not a
 * duplicate — and drops only the second gloss. **BEGINNER only.** In BALANCED
 * the gloss is a tap target, not inline text: suppressing the repeat would
 * leave one dotted word and one plain word for the same term, so the reader
 * who taps the word in front of them would find nothing. */
export function DashaLordLabel({ lord, mode, lang, suppressGloss = false }: { lord: string; mode: Mode; lang: Lang; suppressGloss?: boolean }) {
  if (mode === "BEGINNER") {
    return <>{suppressGloss ? tPlanetLord(lord, lang) : plainLangDashaLord(lord, "BEGINNER", lang)}</>;
  }
  const name = tPlanetLord(lord, lang);
  if (mode !== "BALANCED") return <>{name}</>;
  const biText = plainLangBiText(lord);
  // All nine grahas carry a role gloss as of 2026-08-24, so no real lord trips
  // the guard below any more — keep it anyway. `graha()` with no gloss arg
  // returns the canonical name AS the BiText, so a row added bare later would
  // otherwise render a tooltip repeating its own trigger word: a dead tap
  // target. Comparing the ACTIVE-language string, not just null-checking
  // `biText`, is what catches that — `biText` is truthy in that case too.
  // `lib/plainlang.test.ts` pins that no graha row is bare; this is the
  // runtime half of the same contract.
  const gloss = lang === "ta" ? biText?.ta : biText?.en;
  if (!biText || !gloss || gloss === name) return <>{name}</>;
  return (
    <GlossaryTerm definition={biText} lang={lang}>
      {name}
    </GlossaryTerm>
  );
}

/* Every entry must be a themed token, never a literal: these are read as a
   `color:` on prose (the dasha lord in the deep-dive paragraph, the graha cell
   in the family table), not only as dot fills, so each value owes 4.5:1 on
   both palettes. Venus and Ketu were the last two literals — audit 2026-08-21
   F6 — and both failed that bar on dark (2.41 and 4.02). Their slots now live
   beside --planet-lagna/-saturn/-nodes/-other in dashboard-nova.css.
   dashboard-share-card.tsx keeps its own literal copy on purpose: a <canvas>
   can't read custom properties and a shared image shouldn't follow the
   viewer's theme. */
export const DASHA_COLORS: Record<string, string> = {
  SUN: "var(--panel-brand)",
  MOON: "var(--planet-other)",
  MARS: "var(--planet-saturn)",
  MERCURY: "var(--chart-d9-active)",
  JUPITER: "var(--chart-d9-active-dark)",
  VENUS: "var(--planet-venus)",
  SATURN: "var(--color-faint)",
  RAHU: "var(--planet-nodes)",
  KETU: "var(--planet-ketu)",
};



export function dashaStatus(startDate: string, endDate: string, today: string): "past" | "active" | "upcoming" {
  if (endDate < today) return "past";
  if (startDate <= today && endDate >= today) return "active";
  return "upcoming";
}

export function dashaScore(lord: string): number {
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

export function ageAtDate(birthDateLocal: string | undefined, targetDate: string): number | null {
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

  // Anchor bar at birth date (or first period start), end at birth + 90 years.
  // Using birth date prevents the pre-birth balance dasha period from
  // pushing today's marker erroneously toward center.
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const birthMs = birthDateLocal
    ? new Date(birthDateLocal).getTime()
    : dasha.timeline[0]?.startDate
    ? new Date(String(dasha.timeline[0].startDate)).getTime()
    : 0;
  const cutoffMs = birthMs + 90 * MS_PER_YEAR;

  const allPeriods = dasha.timeline.filter((p) => {
    const start = new Date(String(p.startDate)).getTime();
    return start < cutoffMs;
  });

  const barStartMs = birthMs;
  const barEndMs = Math.min(
    allPeriods[allPeriods.length - 1]?.endDate
      ? new Date(String(allPeriods[allPeriods.length - 1].endDate)).getTime()
      : cutoffMs,
    cutoffMs,
  );
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
            background: "var(--color-border, var(--panel-tan-light))",
            border: "1px solid var(--color-border-strong, var(--panel-tan))",
          }}
        >
          {allPeriods.map((period) => {
            const status = dashaStatus(String(period.startDate), String(period.endDate), today);
            const isActive = period.lord === currentMahaDasa && status === "active";
            const isPast = status === "past";
            const color = DASHA_COLORS[period.lord] ?? "var(--color-faint, var(--color-faint))";
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
                  // Not `<DashaLordLabel>` here: `pointerEvents: "none"` deliberately
                  // routes clicks through to the bar segment (which carries its own
                  // native `title`), and `textOverflow: "ellipsis"` needs a plain text
                  // run — a nested `<button>` (inline-block by default) would break
                  // both. The rows below are where a BALANCED reader actually reads
                  // names; this compact bar is a visual overview, not a tap target.
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      color: isActive ? "var(--color-bg, var(--panel-hover))" : isPast ? "var(--color-faint, var(--color-faint))" : color,
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
          <div style={{ position: "absolute", left: `${nowPct}%`, top: 0, bottom: 0, width: "2px", background: "var(--color-text-strong, var(--panel-earth-dark))", zIndex: 2 }} />
        </div>

        <div style={{ position: "relative", height: "16px", marginTop: "var(--space-1)" }}>
          {allPeriods.map((period, i) => {
            const left = pct(String(period.startDate));
            if (i > 0 && left < 5) return null;
            return (
              <span
                key={`yr-${i}`}
                style={{ position: "absolute", left: `${left}%`, transform: "translateX(-50%)", fontSize: "0.625rem", color: "var(--color-faint, var(--color-faint))", whiteSpace: "nowrap" }}
              >
                {String(period.startDate).slice(0, 4)}
              </span>
            );
          })}
        </div>

        <div style={{ position: "relative", height: "24px" }}>
          <div style={{ position: "absolute", left: `${nowPct}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-0_5)" }}>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "6px solid var(--color-accent, var(--panel-brand))" }} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-accent, var(--panel-brand))", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
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
        const color = DASHA_COLORS[activePeriod.lord] ?? "var(--color-faint, var(--color-faint))";
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-sm)", background: `${color}12`, border: `1px solid ${color}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color }}>
                <DashaLordLabel lord={activePeriod.lord} mode={mode} lang={lang} /> {t("dasha_word", lang)}
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted, var(--panel-mid-earth))" }}>
              {String(activePeriod.startDate)} → {String(activePeriod.endDate)}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, marginLeft: "auto", color: scoreColor(dashaSupport) }}>
              {dashaSupport}/100
            </span>
          </div>
        );
      })()}

      {dashaAntar.length > 0 && (
        <div style={{ marginLeft: "var(--space-3)", borderLeft: `2px solid ${(DASHA_COLORS[currentMahaDasa] ?? "var(--color-faint, var(--color-faint))")}44`, paddingLeft: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <p className="cd-kicker" style={{ marginBottom: "var(--space-2)", color: "var(--color-muted)", letterSpacing: "0.08em" }}>
            {t("bhukti_word", lang)}
          </p>
          {dashaAntar.map((bhukti) => {
            const bhuktiStatus = dashaStatus(String(bhukti.startDate), String(bhukti.endDate), today);
            const isCurrentBhukti = bhukti.lord === currentBhukti && bhuktiStatus === "active";
            const bhuktiColor = DASHA_COLORS[bhukti.lord] ?? "var(--color-faint, var(--color-faint))";
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
                  <span style={{ fontSize: isCurrentBhukti ? "0.875rem" : "0.75rem", fontWeight: isCurrentBhukti ? 700 : bhuktiPast ? 300 : 400, color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "var(--color-faint, var(--color-faint))" : "var(--color-text, var(--panel-earth))", minWidth: "80px" }}>
                    <DashaLordLabel lord={bhukti.lord} mode={mode} lang={lang} />
                  </span>
                  <span style={{ fontSize: "0.625rem", color: "var(--color-muted, var(--panel-mid-earth))", flex: 1 }}>
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
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, minWidth: "40px", textAlign: "right", color: isCurrentBhukti ? scoreColor(bhuktiScore) : "var(--color-border-strong, var(--panel-tan))" }}>
                    {isCurrentBhukti || !bhuktiPast ? `${bhuktiScore}/100` : "—"}
                  </span>
                </div>

                {isCurrentBhukti && (
                  <div style={{ marginLeft: "var(--space-5)", marginTop: "var(--space-1)", marginBottom: "var(--space-1)", borderLeft: `2px solid ${bhuktiColor}33`, paddingLeft: "var(--space-2)" }}>
                    {[dasha.current.pratyantardasha].map((antaram) => {
                      const antaramColor = DASHA_COLORS[antaram.lord] ?? "var(--color-faint, var(--color-faint))";
                      return (
                        <div key={`antaram-${antaram.lord}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-xs)", background: `${antaramColor}18`, border: `1px solid ${antaramColor}44` }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: antaramColor, flexShrink: 0, boxShadow: `0 0 4px ${antaramColor}` }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: antaramColor, minWidth: "72px" }}>
                            {/* Nested directly under its parent bhukti row, whose
                                lord it shares for the first antaram of every
                                bhukti — same repeated parenthetical the owner
                                ruling removes from the hybrid panel's hero. The
                                bhukti LIST above keeps every gloss: those are
                                nine different lords, not one repeated. */}
                            <DashaLordLabel lord={antaram.lord} mode={mode} lang={lang} suppressGloss={antaram.lord === bhukti.lord} /> {t("antaram_word", lang)}
                          </span>
                          <span style={{ fontSize: "0.625rem", color: "var(--color-muted, var(--panel-mid-earth))", flex: 1 }}>
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
            <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--chart-d9-active-bg)", border: "1px solid rgba(92,118,84,0.35)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckGlyph /></span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-strong, var(--panel-earth-dark))", lineHeight: 1.4 }}>{currentPeriodAction}</span>
            </div>
          )}
          {currentPeriodCaution && (
            <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--chart-d1-lagna-bg)", border: "1px solid rgba(184,90,44,0.35)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertGlyph /></span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-strong, var(--panel-earth-dark))", lineHeight: 1.4 }}>{currentPeriodCaution}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

import { scoreColor } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  DailyGuidanceData,
  DashaStoryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  JournalCorrelationData,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { ageAtDate, dashaScore } from "./dashboard-dasha";
import { novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { NovaProgressBar, NovaReveal } from "./dashboard-ui-nova";

/**
 * Nova "Transit & Dashas" tab (docs/DASHBOARD_UI_REVAMP_PLAN.md §6.10,
 * nav id `"transits"`) — a standalone top-level nav destination rendered
 * directly by dashboard-workspace.tsx. (This used to be a second view
 * toggled inside the Plan/Goals tab rather than its own destination; split
 * back out into a real tab, with its own page header below, so it could be
 * promoted to the top nav strip.)
 *
 * Reuses the exact same data/derivations as the old Classic
 * dashboard-transits-tab.tsx (deleted 2026-07-13, DASH-17 — this view is its
 * sole successor) but rebuilt fresh with Nova tokens rather than gap-fixed: its
 * `W`/`PLANET_COLORS`/`DASHA_COLORS` palettes read Classic-only custom
 * properties (`--panel-earth-dark`, `--planet-sun`, `--chart-cell-default`,
 * etc., confirmed via grep to be defined at bare `:root` with no
 * `[data-ui="nova"]` override) — the same class of token the 2026-07-06
 * browser QA round found unsafe to redirect at shared scope (conflicting
 * roles across 50+ components).
 */

const PLANET_TONE: Record<string, string> = {
  SUN: "var(--color-accent-strong)",
  MOON: "var(--color-accent-secondary)",
  MARS: "var(--color-low)",
  MERCURY: "var(--color-high)",
  JUPITER: "var(--color-accent-strong)",
  VENUS: "var(--color-accent-secondary)",
  SATURN: "var(--planet-other)",
  RAHU: "var(--color-text)",
  KETU: "var(--color-text)",
};

function breakdownToneColor(tag: "STRONG" | "NEUTRAL" | "WEAK"): string {
  if (tag === "STRONG") return "var(--color-score-high)";
  if (tag === "WEAK") return "var(--color-score-low)";
  return "var(--color-score-mid)";
}

function interpretationLabel(key: string, lang: Lang): string {
  const text = key.replaceAll("_", " ");
  if (lang === "ta") return `விளக்கம்: ${text}`;
  return `Interpretation: ${text}`;
}

function StatPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warn" | "good" }) {
  const color = tone === "good" ? "var(--color-high)" : tone === "warn" ? "var(--color-low)" : "var(--color-muted)";
  return (
    <div style={{ padding: "5px 14px", borderRadius: "999px", border: "1px solid var(--color-border)", display: "inline-flex", gap: "8px", alignItems: "baseline" }}>
      <span style={{ fontSize: "11.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-muted)" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function FlagTag({ label, tone }: { label: string; tone: "warn" | "danger" | "focus" | "soft" }) {
  const color =
    tone === "danger" ? "var(--color-low)" : tone === "focus" ? "var(--color-accent-secondary)" : tone === "soft" ? "var(--color-high)" : "var(--color-mid)";
  return (
    <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color, background: `${color}22`, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 7px" }}>
      {label}
    </span>
  );
}

function dashaElapsedPct(startDate: string, endDate: string, today: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date(today).getTime();
  if (!(end > start)) return 0;
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

function dashaStatus(startDate: string, endDate: string, today: string): "past" | "active" | "upcoming" {
  if (endDate < today) return "past";
  if (startDate <= today && endDate >= today) return "active";
  return "upcoming";
}

type NovaTransitsViewProps = {
  lang: Lang;
  selectedDate: string;
  personalChart: ChartCalculateResponseData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  personalDasha: DashaTimelineResponseData | null;
  personalDashaMaha: DashaTimelineResponseData | null;
  personalDashaAntar: DashaTimelineItem[];
  dashaStory: DashaStoryData | null;
  journalCorrelations: JournalCorrelationData | null;
  birthDisplayName: string;
  memberCharts: Array<{ memberId: string; displayName: string }>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  onGoToJournal: () => void;
};

export function NovaTransitsView({
  lang,
  selectedDate,
  personalChart,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  personalDasha,
  personalDashaMaha,
  personalDashaAntar,
  dashaStory,
  journalCorrelations,
  birthDisplayName,
  memberCharts,
  selectedMemberId,
  onSelectMember,
  onGoToJournal,
}: NovaTransitsViewProps) {
  const [dashaStoryExpanded, setDashaStoryExpanded] = useState(false);

  const hasTransitSnapshot = Boolean(personalTransit && personalTransit.transits.length > 0);
  const flaggedCount = personalTransit
    ? personalTransit.transits.filter((item) => item.isRetrograde || item.isCombust || item.isGandanta || item.isSandhi).length
    : 0;
  const activeSaniCycles = personalSani
    ? Number(personalSani.moonBasedCycle.isActive) + Number(personalSani.lagnaBasedCycle.isActive)
    : 0;
  const dashaSupportScore = personalDailyGuidance
    ? Math.min(100, Math.round(personalDailyGuidance.scoreBreakdown.dashaSupport / 0.19))
    : null;

  const dasha = personalDashaMaha ?? personalDasha;
  const elapsedPct = dasha ? dashaElapsedPct(String(dasha.current.mahadasha.startDate), String(dasha.current.mahadasha.endDate), selectedDate) : 0;
  const birthDateLocal = personalChart?.birthProfile.birthDateLocal;

  // Cap the timeline at birth + 90 years, matching Classic's shared DashaTimeline
  // (dashboard-dasha.tsx) — Vimshottari's own cycle runs to 120 years, so without
  // this cap "upcoming mahadashas" can list periods well past a realistic lifespan.
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const birthMs = birthDateLocal
    ? new Date(birthDateLocal).getTime()
    : dasha?.timeline[0]?.startDate
    ? new Date(String(dasha.timeline[0].startDate)).getTime()
    : 0;
  const cutoffMs = birthMs + 90 * MS_PER_YEAR;

  const upcomingMaha = dasha
    ? dasha.timeline.filter((p) =>
        p.level === "maha"
        && dashaStatus(String(p.startDate), String(p.endDate), selectedDate) !== "past"
        && p.lord !== dasha.current.mahadasha.lord
        && new Date(String(p.startDate)).getTime() < cutoffMs)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <div>
        <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
          {t("tab_transits", lang)}
        </p>
        <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1.15, color: "var(--color-text-strong)" }}>
          {t("tab_transits", lang)}
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "60ch" }}>
          {t("transits_tab_desc", lang)}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatPill label={lang === "ta" ? "நகர்வுகள்" : "Transits"} value={hasTransitSnapshot ? `${personalTransit?.transits.length}` : "0"} />
        <StatPill label={lang === "ta" ? "கவனிக்க" : "Flagged"} value={`${flaggedCount}`} tone={flaggedCount > 0 ? "warn" : "good"} />
        <StatPill label={lang === "ta" ? "sani cycles" : "Sani cycles"} value={personalSani ? `${activeSaniCycles} active` : "N/A"} tone={activeSaniCycles > 0 ? "warn" : "good"} />
        <StatPill label={lang === "ta" ? "dasa support" : "Dasa support"} value={dashaSupportScore === null ? "N/A" : `${dashaSupportScore}/100`} tone={dashaSupportScore !== null && dashaSupportScore >= 65 ? "good" : "neutral"} />
      </div>

      {memberCharts.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onSelectMember(null)}
            style={{
              padding: "6px 15px", borderRadius: "999px", border: "1px solid",
              borderColor: selectedMemberId === null ? "var(--color-accent)" : "var(--color-border)",
              background: selectedMemberId === null ? "var(--color-accent)" : "transparent",
              color: selectedMemberId === null ? "var(--color-on-accent)" : "var(--color-muted)",
              fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {birthDisplayName || (lang === "ta" ? "நான்" : "You")}
          </button>
          {memberCharts.map((mc) => (
            <button
              key={mc.memberId}
              type="button"
              onClick={() => onSelectMember(mc.memberId)}
              style={{
                padding: "6px 15px", borderRadius: "999px", border: "1px solid",
                borderColor: selectedMemberId === mc.memberId ? "var(--color-accent)" : "var(--color-border)",
                background: selectedMemberId === mc.memberId ? "var(--color-accent)" : "transparent",
                color: selectedMemberId === mc.memberId ? "var(--color-on-accent)" : "var(--color-muted)",
                fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {mc.displayName}
            </button>
          ))}
        </div>
      )}

      {/* ===== Planetary positions ===== */}
      <NovaReveal>
      {hasTransitSnapshot && personalTransit ? (
        <div style={novaDetailCardStyle}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
              {lang === "ta" ? "இன்றைய கிரக நிலைகள்" : "Planetary positions today"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>
              {lang === "ta" ? `உங்கள் பிறப்பு ராசி ${personalTransit.janmaRasi}` : `H = house from your ${personalTransit.janmaRasi} Moon`}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            {personalTransit.transits.map((tr) => {
              const hasFlag = tr.isRetrograde || tr.isCombust || tr.isGandanta || tr.isSandhi;
              const planetColor = PLANET_TONE[tr.graha] ?? "var(--color-muted)";
              const natalPlanet = personalChart?.planets.find((p) => p.graha === tr.graha);
              return (
                <div
                  key={`${tr.graha}-${tr.currentRasi}`}
                  style={{
                    padding: "15px 17px",
                    borderRadius: "var(--radius-md, 11px)",
                    background: "rgba(243, 236, 221, 0.03)",
                    border: `1px solid ${hasFlag ? "var(--color-low-border)" : "var(--color-border)"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: planetColor }}>{tPlanetLord(tr.graha, lang)}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-faint)" }}>H{tr.houseFromMoon}</span>
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, lineHeight: 1, color: "var(--color-text-strong)" }}>
                    {tr.currentRasi}
                  </p>
                  {typeof natalPlanet?.strengthScore === "number" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-muted)" }}>
                        <span>{lang === "ta" ? "நடப்பு சக்தி" : "Natal strength"}</span>
                        <b style={{ color: "var(--color-text)" }}>{natalPlanet.strengthScore}/95</b>
                      </div>
                      <NovaProgressBar value={natalPlanet.strengthScore} max={95} tone="accent" />
                      {natalPlanet.strengthBreakdown && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                          {(Object.entries(natalPlanet.strengthBreakdown) as Array<[string, "STRONG" | "NEUTRAL" | "WEAK"]>).map(([key, value]) => (
                            <span key={`${tr.graha}-${key}`} style={{ fontSize: "9.5px", borderRadius: "999px", border: "1px solid var(--color-border)", padding: "1px 6px", color: breakdownToneColor(value) }}>
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {hasFlag && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {tr.isRetrograde && <FlagTag tone="warn" label={lang === "ta" ? "Vakra" : "Retro"} />}
                      {tr.isCombust && <FlagTag tone="danger" label={lang === "ta" ? "Astham" : "Combust"} />}
                      {tr.isGandanta && <FlagTag tone="focus" label="Gandanta" />}
                      {tr.isSandhi && <FlagTag tone="soft" label="Sandhi" />}
                    </div>
                  )}
                  {tr.interpretationKey && (
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--color-faint)", lineHeight: 1.4 }}>{interpretationLabel(tr.interpretationKey, lang)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ ...novaDetailCardStyle, border: "1px dashed var(--color-border-strong)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>{t("gochar_empty", lang)}</p>
        </div>
      )}
      </NovaReveal>

      {/* ===== Saturn cycle status ===== */}
      {personalSani && (
        <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {([
            { label: lang === "ta" ? "Sani cycle · from Moon" : "Sani cycle · from Moon", cycle: personalSani.moonBasedCycle },
            { label: lang === "ta" ? "Sani cycle · from Lagna" : "Sani cycle · from Lagna", cycle: personalSani.lagnaBasedCycle },
          ] as const).map(({ label, cycle }) => (
            <div
              key={label}
              style={{
                background: cycle.isActive ? "var(--color-low-bg)" : "var(--color-surface)",
                border: `1px solid ${cycle.isActive ? "var(--color-low-border)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: cycle.isActive ? "var(--color-low)" : "var(--color-accent)", fontWeight: 700 }}>{label}</span>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, color: cycle.isActive ? "var(--color-low)" : "var(--color-high)", lineHeight: 1.1 }}>
                {cycle.type ?? (lang === "ta" ? "Normal" : "Normal")}
              </p>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                {cycle.supportiveLabel ?? (lang === "ta" ? "செயலில் சனி அழுத்த சுழற்சி இல்லை." : "No named Saturn-pressure cycle is active.")}
              </p>
            </div>
          ))}
        </div>
      )}
      {personalSani && (
        <p style={{ margin: "-10px 0 0", fontSize: "12.5px", color: "var(--color-faint)", fontStyle: "italic" }}>{personalSani.confirmationSentence}</p>
      )}

      {/* ===== Dasa · Bhukti · Antaram ===== */}
      <NovaReveal>
      {dasha ? (
        <div style={novaDetailCardStyle}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
              {t("surface_dasha", lang)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>{lang === "ta" ? "விம்சோத்தரி — 120 ஆண்டு சுழற்சி" : "Vimshottari — 120-year cycle"}</span>
          </div>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.55 }}>
            {lang === "ta"
              ? "உங்கள் தற்போதைய மகாதசை, புக்தி, அந்தரம் அதிபதிகள் உங்கள் தினசரி மதிப்பெண் மற்றும் வாழ்க்கை பகுதிகளின் விளைவுகளை நேரடியாக பாதிக்கின்றன."
              : "Your current Mahadasha and Antardasha lords directly influence your daily score and outcomes across life areas."}
          </p>

          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            {[
              { label: t("dasha_word", lang), lord: dasha.current.mahadasha.lord },
              { label: t("bhukti_word", lang), lord: dasha.current.antardasha.lord },
              { label: t("antaram_word", lang), lord: dasha.current.pratyantardasha.lord },
            ].map((row, i) => (
              <div key={row.label} style={i > 0 ? { borderLeft: "1px solid var(--color-border)", paddingLeft: "18px" } : undefined}>
                <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--color-faint)", textTransform: "uppercase" }}>{row.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, marginTop: "2px", color: i === 2 ? "var(--color-accent-strong)" : "var(--color-text-strong)" }}>
                  {tPlanetLord(row.lord, lang)}
                </div>
              </div>
            ))}
          </div>
          <NovaProgressBar value={elapsedPct} tone="accent" />
          <div style={{ fontSize: "11px", color: "var(--color-faint)" }}>
            {tPlanetLord(dasha.current.mahadasha.lord, lang)} {t("dasha_word", lang)} · {String(dasha.current.mahadasha.startDate).slice(0, 4)} → {String(dasha.current.mahadasha.endDate).slice(0, 4)} · {Math.round(elapsedPct)}% {lang === "ta" ? "முடிந்தது" : "elapsed"}
          </div>

          {(personalDailyGuidance?.actionSuggestion || personalDailyGuidance?.cautionSuggestion) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {personalDailyGuidance?.actionSuggestion && (
                <div style={{ background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "11px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-text)" }}>
                  <b style={{ color: "var(--color-high)" }}>{lang === "ta" ? "✓ இந்த காலம். " : "✓ This window. "}</b>
                  {tLang(personalDailyGuidance.actionSuggestion, lang)}
                </div>
              )}
              {personalDailyGuidance?.cautionSuggestion && (
                <div style={{ background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "11px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-text)" }}>
                  <b style={{ color: "var(--color-low)" }}>{lang === "ta" ? "⚠ கவனம். " : "⚠ Watch. "}</b>
                  {tLang(personalDailyGuidance.cautionSuggestion, lang)}
                </div>
              )}
            </div>
          )}

          {personalDashaAntar.length > 0 && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("bhukti_word", lang)}</span>
              {personalDashaAntar.map((bhukti) => {
                const bhuktiStatus = dashaStatus(String(bhukti.startDate), String(bhukti.endDate), selectedDate);
                const isCurrent = bhuktiStatus === "active";
                const bhuktiPast = bhuktiStatus === "past";
                const bhuktiScore = isCurrent ? Math.round((dashaSupportScore ?? 50) * 0.9) : dashaScore(bhukti.lord);
                const age = ageAtDate(birthDateLocal, String(bhukti.startDate));
                return (
                  <div key={`${bhukti.lord}-${bhukti.startDate}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: isCurrent ? "7px 11px" : "4px 8px", borderRadius: "8px", background: isCurrent ? "var(--color-accent-muted)" : "transparent", border: isCurrent ? "1px solid var(--color-border-strong)" : "1px solid transparent" }}>
                    <span style={{ fontSize: isCurrent ? "13px" : "12px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--color-accent-strong)" : "var(--color-text)", minWidth: "80px" }}>
                      {tPlanetLord(bhukti.lord, lang)}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-faint)", flex: 1 }}>
                      {String(bhukti.startDate)} → {String(bhukti.endDate)}
                      {age !== null && <span style={{ marginLeft: "4px", opacity: 0.6 }}>({age}{lang === "ta" ? "வ" : "yr"})</span>}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 8px", borderRadius: "999px", background: "var(--color-accent)", color: "var(--color-on-accent)" }}>
                        {t("status_active", lang)}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "40px", textAlign: "right", color: isCurrent ? scoreColor(bhuktiScore) : "var(--color-faint)" }}>
                      {isCurrent || !bhuktiPast ? `${bhuktiScore}/100` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {upcomingMaha.length > 0 && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "அடுத்த மகாதசைகள்" : "Upcoming mahadashas"}
              </span>
              {upcomingMaha.map((p) => (
                <div key={`${p.lord}-${p.startDate}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text)", padding: "3px 0" }}>
                  <span>{tPlanetLord(p.lord, lang)}</span>
                  <span style={{ color: "var(--color-faint)" }}>{String(p.startDate).slice(0, 4)} – {String(p.endDate).slice(0, 4)}</span>
                </div>
              ))}
            </div>
          )}

          {dashaStory && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
              <button
                type="button"
                onClick={() => setDashaStoryExpanded((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-muted)", fontSize: "11.5px", fontWeight: 700, fontFamily: "inherit" }}
              >
                <span style={{ display: "inline-block", transition: "transform 0.2s", transform: dashaStoryExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                {dashaStoryExpanded ? t("btn_collapse_dasha_story", lang) : t("btn_expand_dasha_story", lang)}
              </button>
              {dashaStoryExpanded && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
                  {dashaStory.periods.map((period) => (
                    <div key={`${period.lord}-${period.startDate}`} style={{ padding: "8px 12px", borderRadius: "9px", background: period.isCurrent ? "var(--color-accent-muted)" : "var(--color-surface)", border: `1px solid ${period.isCurrent ? "var(--color-border-strong)" : "var(--color-border)"}` }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "3px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: period.isCurrent ? "var(--color-accent-strong)" : "var(--color-muted)", minWidth: "80px" }}>{tPlanetLord(period.lord, lang)}</span>
                        <span style={{ fontSize: "10px", color: "var(--color-faint)" }}>
                          {period.startDate.slice(0, 4)}-{period.endDate.slice(0, 4)} | {t("dasha_story_age", lang)} {period.ageStart}-{period.ageEnd}
                        </span>
                        {period.isCurrent && (
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 8px", borderRadius: "999px", background: "var(--color-accent)", color: "var(--color-on-accent)" }}>{t("status_active", lang)}</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45, fontStyle: "italic" }}>
                        {lang === "ta" ? period.themeTa : period.themeEn}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...novaDetailCardStyle, border: "1px dashed var(--color-border-strong)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>{t("chart_no_profile", lang)}</p>
        </div>
      )}
      </NovaReveal>

      {/* ===== Journal patterns ===== */}
      {journalCorrelations && (
        <div style={novaDetailCardStyle}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>{t("journal_patterns_label", lang)}</span>
          {!journalCorrelations.hasSufficientData ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text)" }}>
                <span>{journalCorrelations.entryCount} / {journalCorrelations.minimumEntriesRequired} {t("journal_entries_progress", lang)}</span>
                <button type="button" onClick={onGoToJournal} style={{ background: "none", border: "none", padding: 0, color: "var(--color-accent-strong)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                  {lang === "ta" ? "பதிவு தொடங்கு →" : "Start journalling →"}
                </button>
              </div>
              <NovaProgressBar value={journalCorrelations.entryCount} max={journalCorrelations.minimumEntriesRequired} tone="accent" />
              <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>{t("journal_keep_going", lang)}</p>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {journalCorrelations.correlations.map((corr, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: "9px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "12.5px", color: "var(--color-text)", lineHeight: 1.45 }}>{lang === "ta" ? corr.descriptionTa : corr.descriptionEn}</p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--color-faint)" }}>
                    {t("journal_mood_avg", lang)}: {corr.avgMood.toFixed(1)} | {corr.sampleCount} {t("journal_sample_count", lang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

"use client";

import { formatClockLabel, getScoreBand, getScoreVerdict, scoreColorAlpha, scoreColorScale } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  BiText,
  ChartSummaryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  LifeAreasResponseData,
  PeyarchiEvent,
  SaniCycleData,
} from "@/lib/types";

/**
 * Nova "collapsed one-liners" row (Coming up + Remedy, never taller than one
 * line each) and the Family / Dasa chapter / Life areas glance row. All real
 * data, reused from the same hooks the Classic Today tab already consumes.
 */

// Chart-independent read on the current antardasha (sub-period) lord —
// natural benefics vs. natural malefics — used only as a fallback when the
// chart's Lagna-dependent functional nature (below) isn't available (e.g.
// older cached chart summaries). Deliberately three-way and weather-framed
// (never fatalist), matching getScoreVerdict's tone elsewhere in this app.
const _DASHA_BENEFIC = new Set(["JUPITER", "VENUS"]);
const _DASHA_CHALLENGING = new Set(["SATURN", "MARS", "RAHU", "KETU"]);

// Lagna-dependent functional-nature bands, matching the doctrine the backend
// uses everywhere else (dasha service, daily-guidance modifiers, remedies,
// adhipathi report) — see app/calculations/functional_nature.py.
const _NATURE_SUPPORTIVE = new Set(["YOGAKARAKA", "LAGNA_LORD", "TRIKONA"]);
const _NATURE_STEADY = new Set(["KENDRA", "NEUTRAL"]);
const _NATURE_TESTING = new Set(["MARAKA", "DUSTHANA"]);
// DASH-10.2 ruling (2026-07-16): Upachaya houses (3/6/10/11) classically
// improve with effort/time rather than warranting caution — bucketing them
// with Maraka/Dusthana's "go gently" copy was a miscalibration. Split out
// with its own "grows with effort" framing; reuses the neutral --color-mid
// tone (not --color-low, which reads as a warning) rather than adding a new
// color token for a single category.
const _NATURE_GROWTH = new Set(["UPACHAYA"]);

function dashaSentiment(
  antardashaLord: string,
  functionalNature: string | undefined,
  lang: Lang,
): { label: string; color: string } {
  if (functionalNature) {
    if (_NATURE_SUPPORTIVE.has(functionalNature)) {
      return { label: lang === "ta" ? "ஆதரவான காலம்" : "supportive period", color: "var(--color-high)" };
    }
    if (_NATURE_GROWTH.has(functionalNature)) {
      // New `ta` string — pending native review, matching this repo's
      // convention for newly added Tamil copy.
      return { label: lang === "ta" ? "முயற்சியால் வளரும் காலம்" : "grows with effort", color: "var(--color-mid)" };
    }
    if (_NATURE_TESTING.has(functionalNature)) {
      return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
    }
    if (_NATURE_STEADY.has(functionalNature)) {
      return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid)" };
    }
  }
  // Fallback: natural benefic/malefic split (no chart-specific data yet).
  if (_DASHA_BENEFIC.has(antardashaLord)) {
    return { label: lang === "ta" ? "ஆதரவான காலம்" : "supportive period", color: "var(--color-high)" };
  }
  if (_DASHA_CHALLENGING.has(antardashaLord)) {
    return { label: lang === "ta" ? "சவாலான காலம் · மெதுவாக செல்லுங்கள்" : "testing period · go gently", color: "var(--color-low)" };
  }
  return { label: lang === "ta" ? "நடுநிலையான காலம்" : "steady, mixed period", color: "var(--color-mid)" };
}

function daysAwayLabel(days: number, lang: Lang): string {
  if (days < 60) return lang === "ta" ? `${days} நாட்களில்` : `in ${days} days`;
  const months = Math.round(days / 30);
  return lang === "ta" ? `${months} மாதங்களில்` : `in ${months} mo`;
}

export function DashboardTodayOneLinersNova({
  lang,
  peyarchiUpcoming,
  personalSani,
  remedy,
  savingReminder,
  reminderMessage,
  onSaveReminder,
  onGoToCalendar,
}: {
  lang: Lang;
  peyarchiUpcoming: PeyarchiEvent[];
  personalSani: SaniCycleData | null;
  remedy: BiText | null;
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToCalendar?: () => void;
}) {
  const primary = peyarchiUpcoming[0] ?? null;
  const isNear = primary ? primary.daysFromToday <= 3 : false;
  const saniActive = personalSani?.moonBasedCycle.isActive ?? false;

  return (
    <div className="nova-grid-2">
      <button
        type="button"
        onClick={onGoToCalendar}
        style={{
          display: "flex", alignItems: "center", gap: "11px", textAlign: "left", cursor: onGoToCalendar ? "pointer" : "default",
          width: "100%", minWidth: 0, boxSizing: "border-box",
          background: isNear || saniActive ? "linear-gradient(135deg, var(--color-accent-muted), rgba(212,175,95,0.03))" : "rgba(243,236,221,0.03)",
          border: `1px solid ${isNear || saniActive ? "var(--color-border-strong)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-lg)", padding: "13px 18px", fontFamily: "inherit",
        }}
      >
        <span style={{ color: isNear || saniActive ? "var(--color-accent-strong)" : "var(--color-high)", fontSize: "14px", flex: "none" }}>
          {isNear || saniActive ? "◆" : "✓"}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: "12.5px", color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? "வரவிருப்பது" : "Coming up"}</b>
          {" — "}
          {primary
            ? <>{lang === "ta" ? primary.labelTa : primary.labelEn} · {daysAwayLabel(primary.daysFromToday, lang)}</>
            : (lang === "ta" ? "இந்த வாரம் பெரிய மாற்றம் இல்லை." : "No major transit shifts this week.")}
          {saniActive && (
            <> · <span style={{ color: "var(--color-low)" }}>{personalSani?.moonBasedCycle.supportiveLabel ?? personalSani?.moonBasedCycle.type}</span></>
          )}
        </span>
      </button>

      <div style={{
        display: "flex", alignItems: "center", gap: "11px",
        background: "linear-gradient(135deg, var(--color-accent-muted), rgba(212,175,95,0.03))",
        border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "13px 18px",
      }}>
        <span style={{ color: "var(--color-accent-strong)", fontSize: "14px", flex: "none" }}>🪔</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: "12.5px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <b style={{ color: "var(--color-accent-strong)" }}>{lang === "ta" ? "பரிகாரம்" : "Remedy"}</b>
          {" — "}
          {remedy ? tLang(remedy, lang) : (lang === "ta" ? "இன்று குறிப்பிட்ட பரிகாரம் இல்லை." : "No specific remedy today.")}
        </span>
        <button
          type="button"
          onClick={onSaveReminder}
          disabled={savingReminder}
          title={reminderMessage ?? undefined}
          style={{
            flex: "none", fontSize: "11.5px", fontWeight: 700,
            background: "var(--color-accent)", color: "var(--color-on-accent)",
            border: "none", borderRadius: "7px", padding: "6px 12px",
            cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit",
          }}
        >
          {savingReminder
            ? (lang === "ta" ? "…" : "Saving…")
            : (lang === "ta" ? "நினைவூட்டல்" : "Save reminder")}
        </button>
      </div>
    </div>
  );
}

export function DashboardTodayGlanceRowNova({
  lang,
  familyAggregate,
  personalChartSummary,
  dasha,
  dashaAntar,
  selectedDate,
  lifeAreas,
  onGoToFamily,
  onGoToTransits,
  onGoToLifeAreas,
}: {
  lang: Lang;
  familyAggregate: FamilyAggregateData | null;
  personalChartSummary: ChartSummaryData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  selectedDate: string;
  lifeAreas?: LifeAreasResponseData | null;
  onGoToFamily?: () => void;
  onGoToTransits?: () => void;
  onGoToLifeAreas?: () => void;
}) {
  const currentAntarIdx = dashaAntar.findIndex((item) => item.startDate <= selectedDate && selectedDate <= item.endDate);
  const nextAntar = currentAntarIdx >= 0 ? dashaAntar[currentAntarIdx + 1] : null;

  const maha = dasha?.current.mahadasha ?? null;
  let elapsedPct: number | null = null;
  let yearsLeft: number | null = null;
  if (maha) {
    const start = new Date(maha.startDate).getTime();
    const end = new Date(maha.endDate).getTime();
    const now = new Date(selectedDate).getTime();
    if (end > start) {
      elapsedPct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
      yearsLeft = Math.max(0, (end - now) / (365.25 * 24 * 3600 * 1000));
    }
  }

  return (
    <div className="nova-grid-today-glance nova-stagger">
      {/* Family today: avatars + status dots — never progress bars (design 8a §6). */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "இன்று குடும்பம்" : "Family today"}
          </span>
          {onGoToFamily && (
            <button type="button" onClick={onGoToFamily} style={{ marginLeft: "auto", fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "குடும்பம் →" : "Family →"}
            </button>
          )}
        </div>
        {familyAggregate && familyAggregate.members.length > 0 ? (
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              {familyAggregate.members.slice(0, 3).map((m) => {
                const band = getScoreBand(m.individualScore);
                const color = scoreColorScale(m.individualScore);
                return (
                  <div key={m.familyMemberId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: color, color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "14px" }}>
                        {m.displayName.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ position: "absolute", right: "-1px", bottom: "-1px", width: "12px", height: "12px", borderRadius: "50%", background: color, border: "2.5px solid var(--color-surface)" }} title={band.label} />
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text)" }}>
                      {m.displayName} · <b style={{ color }}>{m.individualScore}</b>
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const needsCare = familyAggregate.members.find((m) => getScoreBand(m.individualScore).tone === "low");
              const shared = familyAggregate.bestFamilyWindows[0];
              if (!needsCare && !shared) return null;
              const memberCount = familyAggregate.members.length;
              return (
                <div
                  title={shared
                    ? (lang === "ta"
                      ? `இன்று குடும்ப உறுப்பினர்கள் ${memberCount} பேரின் நல்ல நேரங்களும் ஒன்று சேரும் நேரம் — கூட்டு முடிவுகள், குடும்ப பேச்சு, ஒன்றாக செல்லும் வேலைகளுக்கு ஏற்றது.`
                      : `When all ${memberCount} family members' favourable windows overlap today, from each person's own chart — a good slot for joint decisions, family talks or doing things together.`)
                    : undefined}
                  style={{
                    flex: 1, minWidth: "150px", fontSize: "11.5px", lineHeight: 1.45, color: "var(--color-muted)",
                    background: needsCare ? "var(--color-low-bg)" : "var(--color-accent-muted)",
                    border: `1px solid ${needsCare ? "var(--color-low-border)" : "var(--color-border)"}`,
                    borderRadius: "9px", padding: "9px 11px",
                  }}
                >
                  {needsCare && <><b style={{ color: "var(--color-low)" }}>{needsCare.displayName}</b> {lang === "ta" ? "— மென்மையான நாள்" : "— gentle day"}{shared ? "; " : "."}</>}
                  {shared && <>{lang === "ta" ? `${memberCount} பேருக்கும் நல்ல நேரம்` : `good time for all ${memberCount}`} <b style={{ color: "var(--color-accent-strong)" }}>{formatClockLabel(shared.start)}–{formatClockLabel(shared.end)}</b></>}
                </div>
              );
            })()}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை" : "No family members yet"}</p>
        )}
      </div>

      {/* Life areas: 4 stat tiles in a row — never progress bars (design 8a §6). */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "வாழ்க்கைத் துறைகள்" : "Life areas"}
          </span>
          {onGoToLifeAreas && (
            <button type="button" onClick={onGoToLifeAreas} style={{ marginLeft: "auto", fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "அனைத்தும் →" : "All areas →"}
            </button>
          )}
        </div>
        {lifeAreas?.areas && lifeAreas.areas.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
              {lifeAreas.areas.slice(0, 4).map((area) => {
                const score = Math.round(area.score);
                const color = scoreColorScale(score);
                const band = getScoreBand(score);
                // UXD-14 — pair the band colour with its verdict word so the tile
                // is readable without relying on hue (colour-blind safe).
                const verdictWord = getScoreVerdict(score, lang).verdict;
                return (
                  <div
                    key={area.area}
                    title={`${band.label} · ${score}/100`}
                    style={{ position: "relative", textAlign: "center", background: "rgba(243,236,221,0.04)", border: `1px solid ${scoreColorAlpha(color, 30)}`, borderRadius: "10px", padding: "11px 4px" }}
                  >
                    <span style={{ position: "absolute", top: "7px", right: "7px", width: "6px", height: "6px", borderRadius: "50%", background: color }} />
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-faint)", marginTop: "4px" }}>{lang === "ta" ? area.label.ta : area.label.en}</div>
                    <div style={{ fontSize: "9.5px", fontWeight: 700, color, marginTop: "2px", lineHeight: 1.15 }}>{verdictWord}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("guidance_empty", lang)}</p>
        )}
      </div>

      {/* Dasa chapter */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "தசை அத்தியாயம்" : "Dasa chapter"}
          </span>
          {onGoToTransits && (
            <button type="button" onClick={onGoToTransits} style={{ marginLeft: "auto", fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "திற →" : "Open →"}
            </button>
          )}
        </div>
        {personalChartSummary ? (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {tPlanetLord(personalChartSummary.currentMahadasha, lang)} <span style={{ color: "var(--color-faint)" }}>→</span> <span style={{ color: "var(--color-accent-strong)" }}>{tPlanetLord(personalChartSummary.currentAntardasha, lang)}</span>
            </div>
            {(() => {
              const sentiment = dashaSentiment(
                personalChartSummary.currentAntardasha,
                personalChartSummary.functionalNature?.[personalChartSummary.currentAntardasha],
                lang,
              );
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: sentiment.color, fontWeight: 600 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sentiment.color, flex: "none" }} />
                  {sentiment.label}
                </div>
              );
            })()}
            {/* Two different clocks, so label each: the sub-period (antardasha,
                the "→ X" above) ends on nextAntar.startDate — often months
                out — while yearsLeft is how much of the whole mahadasha
                *chapter* remains (typically years). Joining them with a bare
                "·" read as a contradiction ("until Jan 2027 · 9.7 yrs left").
                The progress bar below tracks the chapter, so it sits with the
                chapter line. */}
            {nextAntar && (
              <div style={{ fontSize: "11.5px", color: "var(--color-muted)" }}>
                {lang === "ta" ? "உட் தசை " : "Sub-period until "}
                {new Date(nextAntar.startDate).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" })}
                {lang === "ta" ? " வரை" : ""}
              </div>
            )}
            {yearsLeft !== null && (
              <div style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
                {lang === "ta" ? "அத்தியாயம் · " : "Chapter · "}{yearsLeft.toFixed(1)} {lang === "ta" ? "ஆண்டுகள் மீதம்" : "yrs left"}
              </div>
            )}
            {elapsedPct !== null && (
              <div style={{ marginTop: "2px", height: "5px", borderRadius: "3px", background: "rgba(243,236,221,0.12)", overflow: "hidden" }}>
                <div style={{ width: `${elapsedPct}%`, height: "100%", background: "var(--color-accent)" }} />
              </div>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("chart_no_profile", lang)}</p>
        )}
      </div>
    </div>
  );
}

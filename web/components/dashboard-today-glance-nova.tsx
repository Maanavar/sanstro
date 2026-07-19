"use client";

import { formatClockLabel, getScoreBand, getScoreVerdict, getScoreVerdictFromGuidance, scoreColorAlpha, scoreColorScale } from "@/lib/format";
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

import { ScoreRing } from "./dashboard-family-shared";

/**
 * Today-tab glance sections (homepage redesign 2026-07-18):
 *   - Life Areas + Dasa Chapter row (nova-grid-la-dasa)
 *   - Family Today + Remedy For You row (nova-grid-2)
 *   - "Coming up" one-liner strip
 * All real data, reused from the same hooks the Today tab already consumes.
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

/** Shared section header: title (in the active language only) + trailing link. */
function GlanceHeader({
  lang,
  title,
  titleTa,
  linkLabel,
  onLink,
}: {
  lang: Lang;
  title: string;
  titleTa: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {lang === "ta" ? titleTa : title}
      </span>
      {onLink && linkLabel && (
        <button
          type="button"
          onClick={onLink}
          style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, whiteSpace: "nowrap" }}
        >
          {linkLabel}
        </button>
      )}
      {!onLink && <span style={{ marginLeft: "auto" }} />}
    </div>
  );
}

const TREND_META: Record<"UP" | "DOWN" | "STABLE", { arrow: string; color: string }> = {
  UP: { arrow: "↑", color: "var(--color-high)" },
  DOWN: { arrow: "↓", color: "var(--color-low)" },
  STABLE: { arrow: "→", color: "var(--color-mid)" },
};

/** Life Areas (five stat tiles with trend arrows) + Dasa Chapter. */
export function DashboardTodayLifeAreasDasaRowNova({
  lang,
  personalChartSummary,
  dasha,
  dashaAntar,
  selectedDate,
  lifeAreas,
  onGoToTransits,
  onGoToLifeAreas,
}: {
  lang: Lang;
  personalChartSummary: ChartSummaryData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  selectedDate: string;
  lifeAreas?: LifeAreasResponseData | null;
  onGoToTransits?: () => void;
  onGoToLifeAreas?: () => void;
}) {
  const currentAntarIdx = dashaAntar.findIndex((item) => item.startDate <= selectedDate && selectedDate <= item.endDate);
  const nextAntar = currentAntarIdx >= 0 ? dashaAntar[currentAntarIdx + 1] : null;

  const maha = dasha?.current.mahadasha ?? null;
  let elapsedPct: number | null = null;
  let yearsLeft: number | null = null;
  let mahaStartYear: number | null = null;
  let mahaEndYear: number | null = null;
  if (maha) {
    const start = new Date(maha.startDate).getTime();
    const end = new Date(maha.endDate).getTime();
    const now = new Date(selectedDate).getTime();
    if (end > start) {
      elapsedPct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
      yearsLeft = Math.max(0, (end - now) / (365.25 * 24 * 3600 * 1000));
      mahaStartYear = new Date(maha.startDate).getFullYear();
      mahaEndYear = new Date(maha.endDate).getFullYear();
    }
  }

  return (
    <div className="nova-grid-la-dasa nova-stagger">
      {/* Life areas: stat tiles with trend arrows. No sparklines — the API
          exposes today's score + trend direction, not a history series, so a
          curve would be invented data. */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
        <GlanceHeader
          lang={lang}
          title="Life Areas"
          titleTa="வாழ்க்கைத் துறைகள்"
          linkLabel={lang === "ta" ? "அனைத்தும் →" : "All areas →"}
          onLink={onGoToLifeAreas}
        />
        {lifeAreas?.areas && lifeAreas.areas.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: "10px" }}>
            {lifeAreas.areas.slice(0, 5).map((area) => {
              const score = Math.round(area.score);
              const color = scoreColorScale(score);
              const band = getScoreBand(score);
              // UXD-14 — pair the band colour with its verdict word so the tile
              // is readable without relying on hue (colour-blind safe).
              const verdictWord = getScoreVerdict(score, lang).verdict;
              const trend = TREND_META[area.trend] ?? TREND_META.STABLE;
              return (
                <div
                  key={area.area}
                  title={`${band.label} · ${score}/100`}
                  style={{ background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: `1px solid ${scoreColorAlpha(color, 30)}`, borderRadius: "12px", padding: "12px 12px" }}
                >
                  <div style={{ fontSize: "11.5px", color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lang === "ta" ? area.label.ta : area.label.en}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "6px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--color-text-strong)", lineHeight: 1 }}>{score}</span>
                    <span aria-hidden="true" style={{ fontSize: "13px", color: trend.color }}>{trend.arrow}</span>
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color, marginTop: "6px", lineHeight: 1.15 }}>{verdictWord}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("guidance_empty", lang)}</p>
        )}
      </div>

      {/* Dasa chapter */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column" }}>
        <GlanceHeader
          lang={lang}
          title="Dasa Chapter"
          titleTa="தசா"
          linkLabel={lang === "ta" ? "திற →" : "Open →"}
          onLink={onGoToTransits}
        />
        {personalChartSummary ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                {tPlanetLord(personalChartSummary.currentMahadasha, lang)} <span style={{ color: "var(--color-faint)" }}>→</span> {tPlanetLord(personalChartSummary.currentAntardasha, lang)}
              </div>
              {(() => {
                const sentiment = dashaSentiment(
                  personalChartSummary.currentAntardasha,
                  personalChartSummary.functionalNature?.[personalChartSummary.currentAntardasha],
                  lang,
                );
                return (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: sentiment.color, background: "color-mix(in srgb, currentColor 10%, transparent)", border: "1px solid color-mix(in srgb, currentColor 30%, transparent)", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>
                    {sentiment.label}
                  </span>
                );
              })()}
            </div>
            {/* Two different clocks, both labeled: the sub-period (antardasha)
                ends on nextAntar.startDate — often months out — while
                yearsLeft is how much of the whole mahadasha *chapter*
                remains. "in chapter" keeps the second from reading as a
                contradiction of the first. */}
            {(nextAntar || yearsLeft !== null) && (
              <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "10px" }}>
                {nextAntar && (
                  <>
                    {lang === "ta" ? "உட் தசை " : "Sub-period until "}
                    {new Date(nextAntar.startDate).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" })}
                    {lang === "ta" ? " வரை" : ""}
                  </>
                )}
                {nextAntar && yearsLeft !== null && " · "}
                {yearsLeft !== null && (
                  <>{yearsLeft.toFixed(1)} {lang === "ta" ? "ஆண்டுகள் மீதம் (அத்தியாயம்)" : "yrs left in chapter"}</>
                )}
              </div>
            )}
            <div style={{ flex: 1 }} />
            {elapsedPct !== null && (
              <>
                <div style={{ position: "relative", height: "5px", borderRadius: "3px", background: "color-mix(in srgb, var(--color-text-strong) 10%, transparent)", marginTop: "16px" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${elapsedPct}%`, background: "linear-gradient(90deg, var(--color-accent-secondary), var(--color-accent))", borderRadius: "3px" }} />
                  <span style={{ position: "absolute", left: `${elapsedPct}%`, top: "50%", transform: "translate(-50%, -50%)", width: "11px", height: "11px", borderRadius: "50%", background: "var(--color-text-strong)", border: "2px solid var(--color-surface)" }} />
                </div>
                <div style={{ position: "relative", fontSize: "11px", color: "var(--color-faint)", marginTop: "8px", height: "15px" }}>
                  {mahaStartYear !== null && <span style={{ position: "absolute", left: 0 }}>{mahaStartYear}</span>}
                  <span style={{ position: "absolute", left: `${Math.max(8, Math.min(92, elapsedPct))}%`, transform: "translateX(-50%)", color: "var(--color-text)", fontWeight: 600 }}>
                    {lang === "ta" ? "இப்போது" : "Now"}
                  </span>
                  {mahaEndYear !== null && <span style={{ position: "absolute", right: 0 }}>{mahaEndYear}</span>}
                </div>
              </>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("chart_no_profile", lang)}</p>
        )}
      </div>
    </div>
  );
}

/** Family Today (member star tiles + shared-window strip) + Remedy For You. */
export function DashboardTodayFamilyRemedyRowNova({
  lang,
  familyAggregate,
  remedy,
  savingReminder,
  reminderMessage,
  onSaveReminder,
  onGoToFamily,
  onGoToLifeAreas,
}: {
  lang: Lang;
  familyAggregate: FamilyAggregateData | null;
  remedy: BiText | null;
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void;
  onGoToFamily?: () => void;
  onGoToLifeAreas?: () => void;
}) {
  return (
    <div className="nova-grid-2 nova-stagger">
      {/* Family today: one score ring per member, same ScoreRing the Family
          tab uses (dashboard-family-shared.tsx) — exact score + colour, so
          two members in the same coarse verdict band (e.g. both "Balanced")
          still read as visibly different rather than looking duplicated.
          The verdict word below is looked up through getScoreVerdictFromGuidance
          (was: the raw backend label token printed as-is, unlocalised, and
          identical for every score in that label's band). */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
        <GlanceHeader
          lang={lang}
          title="Family Today"
          titleTa="குடும்பம்"
          linkLabel={lang === "ta" ? "குடும்பம் →" : "Family →"}
          onLink={onGoToFamily}
        />
        {familyAggregate && familyAggregate.members.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "10px" }}>
              {familyAggregate.members.slice(0, 3).map((m) => {
                const verdict = getScoreVerdictFromGuidance(m.label, m.individualScore, lang);
                return (
                  <div
                    key={m.familyMemberId}
                    role="group"
                    aria-label={`${m.displayName} — ${verdict.verdict}, ${m.individualScore} / 100`}
                    title={`${verdict.verdict} · ${m.individualScore}/100`}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px",
                      background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", border: "1px solid var(--color-border)",
                      borderRadius: "12px", padding: "14px 10px", minWidth: 0,
                    }}
                  >
                    <ScoreRing score={m.individualScore} size={44} />
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {m.displayName}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: verdict.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {verdict.verdict}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* This glance card only ever shows the first 3 members (full
                roster lives one click away in Family), but silently dropping
                the rest with no count read as the list being complete. */}
            {familyAggregate.members.length > 3 && (
              <button
                type="button"
                onClick={onGoToFamily}
                style={{
                  display: "block", width: "100%", textAlign: "left", fontFamily: "inherit",
                  background: "none", border: "none", padding: 0, marginTop: "9px", cursor: onGoToFamily ? "pointer" : "default",
                  fontSize: "11.5px", fontWeight: 600, color: "var(--color-accent-secondary)",
                }}
              >
                {lang === "ta"
                  ? `+ மேலும் ${familyAggregate.members.length - 3} பேர் →`
                  : `+${familyAggregate.members.length - 3} more →`}
              </button>
            )}
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
                    fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)",
                    background: needsCare ? "var(--color-low-bg)" : "var(--color-accent-muted)",
                    border: `1px solid ${needsCare ? "var(--color-low-border)" : "var(--color-border)"}`,
                    borderRadius: "10px", padding: "10px 13px", marginTop: "10px",
                  }}
                >
                  {needsCare && <><b style={{ color: "var(--color-low)" }}>{needsCare.displayName}</b> {lang === "ta" ? "— மென்மையான நாள்" : "— gentle day"}{shared ? "; " : "."}</>}
                  {shared && <>{lang === "ta" ? `${memberCount} பேருக்கும் நல்ல நேரம்` : `good time for all ${memberCount}`} <b style={{ color: "var(--color-high)" }}>{formatClockLabel(shared.start)} – {formatClockLabel(shared.end)}</b></>}
                </div>
              );
            })()}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை" : "No family members yet"}</p>
        )}
      </div>

      {/* Remedy for you — promoted from a one-liner to its own card. */}
      <div style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-secondary) 12%, transparent), color-mix(in srgb, var(--color-text-strong) 2%, transparent))", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 30%, transparent)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div aria-hidden="true" style={{ width: "34px", height: "34px", borderRadius: "50%", background: "color-mix(in srgb, var(--color-accent-secondary) 16%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent-secondary)", fontSize: "15px", flex: "none" }}>❋</div>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "உங்களுக்கான பரிகாரம்" : "Remedy For You"}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "20px", marginTop: "14px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px", fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "14.5px", lineHeight: 1.7, color: "var(--color-text)" }}>
            {remedy ? tLang(remedy, lang) : (lang === "ta" ? "இன்று குறிப்பிட்ட பரிகாரம் இல்லை." : "No specific remedy today.")}
          </div>
          {remedy && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "none" }}>
              <button
                type="button"
                onClick={onSaveReminder}
                disabled={savingReminder}
                title={reminderMessage ?? undefined}
                style={{ fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {savingReminder
                  ? (lang === "ta" ? "…" : "Saving…")
                  : (lang === "ta" ? "நினைவூட்டல்" : "Save reminder")}
              </button>
              {onGoToLifeAreas && (
                <button
                  type="button"
                  onClick={onGoToLifeAreas}
                  style={{ fontSize: "12px", fontWeight: 600, background: "transparent", color: "var(--color-accent-secondary)", border: "1px solid color-mix(in srgb, var(--color-accent-secondary) 35%, transparent)", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  {lang === "ta" ? "மேலும் பரிகாரங்கள்" : "More remedies"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Coming up" — still a one-liner, now full width. */
export function DashboardTodayComingUpNova({
  lang,
  peyarchiUpcoming,
  personalSani,
  onGoToCalendar,
}: {
  lang: Lang;
  peyarchiUpcoming: PeyarchiEvent[];
  personalSani: SaniCycleData | null;
  onGoToCalendar?: () => void;
}) {
  const primary = peyarchiUpcoming[0] ?? null;
  const isNear = primary ? primary.daysFromToday <= 3 : false;
  const saniActive = personalSani?.moonBasedCycle.isActive ?? false;

  return (
    <button
      type="button"
      onClick={onGoToCalendar}
      style={{
        display: "flex", alignItems: "center", gap: "11px", textAlign: "left", cursor: onGoToCalendar ? "pointer" : "default",
        width: "100%", minWidth: 0, boxSizing: "border-box",
        background: isNear || saniActive ? "linear-gradient(135deg, var(--color-accent-muted), rgba(212,175,95,0.03))" : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)",
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
  );
}

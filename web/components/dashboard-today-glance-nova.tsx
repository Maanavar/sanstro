"use client";

import { formatClockLabel, getScoreBand, scoreColor } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  LifeAreasResponseData,
  PeyarchiEvent,
  SaniCycleData,
  WeekAheadData,
} from "@/lib/types";

/**
 * Nova sections 6 + 7 — "Coming up" / "Week ahead" and the
 * Family / Dasa chapter / Life areas glance row. All real data,
 * reused from the same hooks the Classic Today tab already consumes.
 */

/** Continuous low->mid->high gradient for a 0-100 score, rather than the coarse
 *  3-band scoreColor() tone. Needed because Nova's --color-score-mid equals its
 *  accent gold, so any run of days clustered in the "mid" band (the common
 *  case week to week) rendered as identical bars in the Week Ahead chart. */
function weekBarColor(score: number): string {
  if (score <= 50) {
    const t = Math.round(Math.max(0, Math.min(1, score / 50)) * 100);
    return `color-mix(in srgb, var(--color-score-mid) ${t}%, var(--color-score-low) ${100 - t}%)`;
  }
  const t = Math.round(Math.max(0, Math.min(1, (score - 50) / 50)) * 100);
  return `color-mix(in srgb, var(--color-score-high) ${t}%, var(--color-score-mid) ${100 - t}%)`;
}

function daysAwayLabel(days: number, lang: Lang): string {
  if (days < 60) return lang === "ta" ? `${days} நாட்களில்` : `${days} days away`;
  const months = Math.round(days / 30);
  return lang === "ta" ? `${months} மாதங்களில்` : `${months} mo away`;
}

export function DashboardTodayAnticipationRowNova({
  lang,
  peyarchiUpcoming,
  personalSani,
  weekAhead,
  selectedDate,
  onGoToCalendar,
}: {
  lang: Lang;
  peyarchiUpcoming: PeyarchiEvent[];
  personalSani: SaniCycleData | null;
  weekAhead: WeekAheadData | null;
  selectedDate: string;
  onGoToCalendar?: () => void;
}) {
  const primary = peyarchiUpcoming[0] ?? null;
  const secondaryChips = peyarchiUpcoming.slice(1, 3);

  return (
    <div className="nova-grid-anticipation">
      {/* Coming up */}
      <div style={{ background: "linear-gradient(120deg, var(--color-surface-soft), var(--color-surface))", border: "1px solid var(--color-accent-secondary-muted)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
            {lang === "ta" ? "பெயர்ச்சி & முக்கிய மாற்றங்கள்" : "Coming up · Peyarchi & big shifts"}
          </span>
        </div>
        {primary ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ flex: "none", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "44px", fontWeight: 700, lineHeight: 1, color: "var(--color-accent-strong)" }}>
                  {primary.daysFromToday}
                </div>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.1em", color: "var(--color-faint)", textTransform: "uppercase" }}>
                  {lang === "ta" ? "நாட்கள்" : "days"}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? primary.labelTa : primary.labelEn}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {secondaryChips.map((ev) => (
                <span key={ev.alertId} style={{ fontSize: "11.5px", color: "var(--color-text)", background: "rgba(243,236,221,0.05)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "5px 12px" }}>
                  {tPlanetLord(ev.planet, lang)} {lang === "ta" ? "இல்" : "in"} {ev.toRasi} · {daysAwayLabel(ev.daysFromToday, lang)}
                </span>
              ))}
              {personalSani?.moonBasedCycle.isActive && (
                <span style={{ fontSize: "11.5px", color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "999px", padding: "5px 12px" }}>
                  {personalSani.moonBasedCycle.supportiveLabel ?? personalSani.moonBasedCycle.type}
                </span>
              )}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>
            {lang === "ta" ? "அருகில் பெரிய பெயர்ச்சி இல்லை." : "No major transit shift coming up soon."}
          </p>
        )}
      </div>

      {/* Week ahead */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {t("today_week_ahead", lang)}
          </span>
          {onGoToCalendar && (
            <button type="button" onClick={onGoToCalendar} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "நாட்காட்டி →" : "Calendar →"}
            </button>
          )}
        </div>
        {weekAhead && weekAhead.days.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekAhead.days.length}, 1fr)`, gap: "8px", alignItems: "end", height: "70px" }}>
              {weekAhead.days.map((day) => (
                <div
                  key={day.dateLocal}
                  title={`${day.dateLocal}: ${day.score}/100`}
                  style={{
                    height: `${Math.max(14, (day.score / 100) * 70)}px`,
                    borderRadius: "5px 5px 2px 2px",
                    background: weekBarColor(day.score),
                    opacity: day.dateLocal === selectedDate ? 1 : 0.82,
                    boxShadow: day.dateLocal === selectedDate ? "0 0 0 2px var(--color-accent-strong)" : "none",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekAhead.days.length}, 1fr)`, gap: "8px", textAlign: "center", fontSize: "10.5px", color: "var(--color-faint)" }}>
              {weekAhead.days.map((day) => (
                <span key={day.dateLocal} style={{ color: day.dateLocal === selectedDate ? "var(--color-accent-strong)" : undefined, fontWeight: day.dateLocal === selectedDate ? 700 : 400 }}>
                  {new Date(`${day.dateLocal}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" })}
                </span>
              ))}
            </div>
            {(() => {
              const sorted = [...weekAhead.days].sort((a, b) => b.score - a.score);
              const best = sorted[0];
              const easiest = sorted[sorted.length - 1];
              const wd = (d: typeof best) => new Date(`${d.dateLocal}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });
              return (
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)", background: "rgba(212,175,95,0.07)", borderRadius: "9px", padding: "9px 12px" }}>
                  {lang === "ta" ? "சிறந்த நாள்" : "Best day"} <b style={{ color: "var(--color-high)" }}>{wd(best)}</b> · {lang === "ta" ? "கவனம்" : "caution"} <b style={{ color: "var(--color-low)" }}>{wd(easiest)}</b>
                </p>
              );
            })()}
          </>
        ) : (
          <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "13px" }}>{t("guidance_empty", lang)}</p>
        )}
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
    <div className="nova-grid-3">
      {/* Family */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "இன்று குடும்பம்" : "Family today"}
          </span>
          {onGoToFamily && (
            <button type="button" onClick={onGoToFamily} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "திற →" : "Open →"}
            </button>
          )}
        </div>
        {familyAggregate && familyAggregate.members.length > 0 ? (
          <>
            {familyAggregate.members.slice(0, 3).map((m) => {
              const band = getScoreBand(m.individualScore);
              const needsCare = band.tone === "low";
              const color = scoreColor(m.individualScore);
              return (
                <div key={m.familyMemberId} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700 }}>
                    {m.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-strong)" }}>
                      {m.displayName}
                      {needsCare && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "5px", padding: "1px 6px", marginLeft: "4px" }}>
                          {lang === "ta" ? "கவனம்" : "care"}
                        </span>
                      )}
                    </div>
                    <div style={{ height: "5px", borderRadius: "3px", background: "rgba(243,236,221,0.12)", marginTop: "5px" }}>
                      <div style={{ width: `${m.individualScore}%`, height: "100%", borderRadius: "3px", background: color }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color }}>{m.individualScore}</div>
                </div>
              );
            })}
            {familyAggregate.bestFamilyWindows[0] && (
              <p style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--color-muted)", background: "rgba(212,175,95,0.06)", borderRadius: "8px", padding: "8px 11px", marginTop: "auto" }}>
                {lang === "ta" ? "பொதுவான நேரம்" : "Shared window"}{" "}
                <b style={{ color: "var(--color-accent-strong)" }}>{formatClockLabel(familyAggregate.bestFamilyWindows[0].start)}–{formatClockLabel(familyAggregate.bestFamilyWindows[0].end)}</b>
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை" : "No family members yet"}</p>
        )}
      </div>

      {/* Dasa chapter */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "உங்கள் தசை அத்தியாயம்" : "Your dasa chapter"}
          </span>
          {onGoToTransits && (
            <button type="button" onClick={onGoToTransits} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "திற →" : "Open →"}
            </button>
          )}
        </div>
        {personalChartSummary ? (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
              {tPlanetLord(personalChartSummary.currentMahadasha, lang)} · {tPlanetLord(personalChartSummary.currentAntardasha, lang)}{" "}
              <span style={{ fontSize: "13px", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{lang === "ta" ? "அந்தர்" : "antar"}</span>
            </div>
            {elapsedPct !== null && (
              <div>
                <div style={{ height: "6px", borderRadius: "3px", background: "rgba(243,236,221,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${elapsedPct}%`, height: "100%", background: "var(--color-accent)" }} />
                </div>
                {yearsLeft !== null && (
                  <div style={{ fontSize: "10.5px", color: "var(--color-faint)", marginTop: "5px" }}>
                    {lang === "ta" ? `${yearsLeft.toFixed(1)} ஆண்டுகள் மீதம்` : `${yearsLeft.toFixed(1)} yrs left`}
                  </div>
                )}
              </div>
            )}
            {nextAntar && (
              <p style={{ fontSize: "11.5px", color: "var(--color-muted)", background: "rgba(212,175,95,0.06)", borderRadius: "8px", padding: "8px 11px", marginTop: "auto" }}>
                {lang === "ta" ? "அடுத்தது" : "Next"}: <b style={{ color: "var(--color-accent-strong)" }}>{tPlanetLord(personalChartSummary.currentMahadasha, lang)} · {tPlanetLord(nextAntar.lord, lang)}</b> {lang === "ta" ? "முதல்" : "from"} {new Date(nextAntar.startDate).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" })}
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("chart_no_profile", lang)}</p>
        )}
      </div>

      {/* Life areas */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "11px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "வாழ்க்கைத் துறைகள்" : "Life areas"}
          </span>
          {onGoToLifeAreas && (
            <button type="button" onClick={onGoToLifeAreas} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {lang === "ta" ? "திற →" : "Open →"}
            </button>
          )}
        </div>
        {lifeAreas?.areas && lifeAreas.areas.length > 0 ? (
          lifeAreas.areas.slice(0, 4).map((area) => {
            const color = scoreColor(area.score);
            return (
              <div key={area.area}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{lang === "ta" ? area.label.ta : area.label.en}</span>
                  <span style={{ color, fontWeight: 700 }}>{Math.round(area.score)}</span>
                </div>
                <div style={{ height: "5px", borderRadius: "3px", background: "rgba(243,236,221,0.12)", marginTop: "5px" }}>
                  <div style={{ width: `${area.score}%`, height: "100%", borderRadius: "3px", background: color }} />
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>{t("guidance_empty", lang)}</p>
        )}
      </div>
    </div>
  );
}

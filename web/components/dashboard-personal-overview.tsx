"use client";

import { formatDateLabel, getScoreBand, scoreColor, SCORE_HIGH } from "@/lib/format";
import { t, tLang, tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartSummaryData, DailyGuidanceData, NakshatraCardData, PanchangamDailyResponseData, WeekAheadData } from "@/lib/types";

const EMOTIONAL_WEATHER_FIELDS = [
  { labelTa: "உணர்வு நிலை", labelEn: "Emotional tone", key: "toneText" as const },
  { labelTa: "உடல் போக்கு", labelEn: "Physical tendency", key: "physicalTendencyText" as const },
  { labelTa: "சிறந்த பயன்பாடு", labelEn: "Best use of day", key: "bestUseOfDayText" as const },
] as const;

const SCORE_CHIP_KEYS = ["moonTransit", "dashaSupport", "panchangam"] as const;

type PersonalOverviewProps = {
  lang: Lang;
  selectedDate: string;
  dashaText: string | null;
  dashaBhuktiText: string | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  panchangam: PanchangamDailyResponseData | null;
  nakshatraCard: NakshatraCardData | null;
  weekAhead: WeekAheadData | null;
  savingReminder: boolean;
  reminderMessage: string | null;
  onSaveReminder: () => void | Promise<void>;
  astroText: (value: string) => string;
};

export function PersonalOverview({
  lang,
  selectedDate,
  dashaText,
  dashaBhuktiText,
  personalChartSummary,
  personalDailyGuidance,
  panchangam,
  nakshatraCard,
  weekAhead,
  savingReminder,
  reminderMessage,
  onSaveReminder,
  astroText,
}: PersonalOverviewProps) {
  return (
    <>      {/* ── Three info cards: Dasa | Nakshatra | Week Ahead ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-4)" }}>

        {/* Dasa card */}
        <div style={{ background: "var(--chart-cell-default)", border: "1px solid var(--panel-tan-light)", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "தசை" : "Dasa"}
          </p>
          <p style={{ margin: "0 0 var(--space-0_5)", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "var(--panel-earth-dark)", lineHeight: 1.1 }}>
            {dashaText ?? "—"}
          </p>
          {dashaBhuktiText && (
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", color: "var(--color-faint)" }}>
              {dashaBhuktiText}
            </p>
          )}
          {personalDailyGuidance?.emotionalWeather && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-2)", marginTop: "var(--space-2_5)" }}>
              {EMOTIONAL_WEATHER_FIELDS.map((field) => ({
                labelTa: field.labelTa,
                labelEn: field.labelEn,
                value: lang === "ta"
                  ? personalDailyGuidance.emotionalWeather![field.key]?.ta
                  : personalDailyGuidance.emotionalWeather![field.key]?.en,
              })).filter((row) => row.value).map((row) => (
                <div key={row.labelEn} style={{
                  padding: "var(--space-2_5) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-soft)",
                  border: "1px solid var(--color-border)",
                }}>
                  <p style={{
                    margin: "0 0 var(--space-0_5)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "var(--color-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-body)",
                  }}>
                    {lang === "ta" ? row.labelTa : row.labelEn}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-strong)",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.4,
                  }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          )}
          {personalDailyGuidance?.scoreBreakdown && (
            <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
              {SCORE_CHIP_KEYS.map((k) => (
                <span key={k} style={{
                  padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.625rem",
                  background: "var(--panel-cream)", border: "1px solid var(--panel-tan-light)", color: "var(--color-faint)",
                }}>
                  {t(`reason_${k}` as Parameters<typeof t>[0], lang)}: {personalDailyGuidance.scoreBreakdown[k]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Nakshatra card */}
        <div style={{ background: "var(--chart-cell-default)", border: "1px solid var(--panel-tan-light)", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "இன்றைய நட்சத்திரம்" : "Today's Birth Star"}
          </p>
          <p style={{ margin: "0 0 var(--space-1)", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "var(--panel-earth-dark)", lineHeight: 1.1 }}>
            {panchangam ? tNakshatra(panchangam.nakshatra.name, lang) : (nakshatraCard ? (lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)) : "—")}
            {panchangam && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-faint)", fontWeight: 400, marginLeft: "var(--space-1_5)" }}>
                · {lang === "ta" ? "பாதம்" : "root"} · {lang === "ta" ? "பாதம் தகவல்" : "pAdham info"}
              </span>
            )}
          </p>
          {nakshatraCard && (
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", color: "var(--panel-earth)", lineHeight: 1.5 }}>
              {lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}
            </p>
          )}
          {nakshatraCard && (
            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
              {nakshatraCard.strengths.slice(0, 2).map((s) => (
                <span key={s.en} style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "var(--chart-d9-active-bg)", border: "1px solid rgba(92,118,84,0.3)", color: "var(--chart-d9-active)" }}>
                  {lang === "ta" ? s.ta : s.en}
                </span>
              ))}
              {nakshatraCard.cautions.slice(0, 1).map((c) => (
                <span key={c.en} style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "var(--panel-cream)", border: "1px solid var(--panel-tan-light)", color: "var(--color-faint)" }}>
                  {lang === "ta" ? c.ta : c.en}
                </span>
              ))}
              {nakshatraCard.rulingPlanet && (
                <span style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "var(--panel-cream)", border: "1px solid var(--panel-tan-light)", color: "var(--color-faint)" }}>
                  {tPlanetLord(nakshatraCard.rulingPlanet, lang)} {lang === "ta" ? "ஆளும்" : "ruled"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Week ahead card */}
        <div style={{ background: "var(--chart-cell-default)", border: "1px solid var(--panel-tan-light)", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {t("today_week_ahead", lang)}
          </p>
          {weekAhead && weekAhead.days.length > 0 ? (
            <>
              {/* Mini spark line */}
              <svg viewBox={`0 0 ${weekAhead.days.length * 32} 40`} style={{ width: "100%", height: "40px", display: "block", marginBottom: "var(--space-1_5)" }}>
                {weekAhead.days.map((day, i) => {
                  const x = i * 32 + 16;
                  const y = 36 - (day.score / 100) * 30;
                  const next = weekAhead.days[i + 1];
                  const nx = (i + 1) * 32 + 16;
                  const ny = next ? 36 - (next.score / 100) * 30 : y;
                  const isToday = day.dateLocal === selectedDate;
                  return (
                    <g key={day.dateLocal}>
                      {next && (
                        <line x1={x} y1={y} x2={nx} y2={ny} stroke="var(--panel-tan)" strokeWidth="1.5" />
                      )}
                      <circle
                        cx={x} cy={y} r={isToday ? 5 : 3.5}
                        fill={scoreColor(day.score)}
                        stroke={isToday ? "var(--panel-earth-dark)" : "none"}
                        strokeWidth={isToday ? 1.5 : 0}
                      />
                    </g>
                  );
                })}
              </svg>
              {/* Day labels */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {weekAhead.days.map((day) => (
                  <span key={day.dateLocal} style={{ fontSize: "0.625rem", color: "var(--color-faint)", textAlign: "center", flex: 1 }}>
                    {new Date(day.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" })}
                  </span>
                ))}
              </div>
              {/* Best/easiest annotation */}
              {weekAhead.days.length > 0 && (() => {
                const sorted = [...weekAhead.days].sort((a, b) => b.score - a.score);
                const best = sorted[0];
                const easiest = sorted[sorted.length - 1];
                const label = (d: typeof best) => new Date(d.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                return (
                  <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.75rem", color: "var(--panel-earth)", lineHeight: 1.4 }}>
                    {lang === "ta" ? "சிறந்த நாள்" : "Best day"}{" "}
                    <strong style={{ color: SCORE_HIGH }}>{label(best)}</strong>
                    {" · "}
                    {lang === "ta" ? "எளிமையான மாலை" : "Easiest evening"}{" "}
                    <strong style={{ color: "var(--color-faint)" }}>{label(easiest)}</strong>
                  </p>
                );
              })()}
            </>
          ) : (
            <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("guidance_empty", lang)}</p>
          )}
        </div>
      </div>

      {/* ── Remedy strip ── */}
      {personalDailyGuidance?.remedy && (
        <div style={{
          padding: "var(--space-4_5) var(--space-6)",
          borderRadius: "var(--radius-md)",
          background: "var(--chart-d1-lagna-bg)",
          border: "1px solid rgba(184,90,44,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--panel-brand)" }}>
              {lang === "ta" ? "பரிகாரம் · இன்று" : "Remedy · Today"}
            </p>
            <p style={{ margin: 0, fontSize: "1rem", color: "var(--panel-earth-dark)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
              {tLang(personalDailyGuidance.remedy, lang)}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => void onSaveReminder()}
              disabled={savingReminder}
              style={{
                padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--panel-earth-dark)",
                background: savingReminder ? "var(--panel-tan-light)" : "var(--panel-earth-dark)", color: savingReminder ? "var(--color-faint)" : "var(--panel-hover)", fontSize: "0.875rem", fontWeight: 600,
                cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {savingReminder
                ? (lang === "ta" ? "சேமிக்கிறது…" : "Saving…")
                : (lang === "ta" ? "நினைவூட்டல் சேமி" : "Save reminder")}
            </button>
            {reminderMessage && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: reminderMessage.includes("Could not") || reminderMessage.includes("முடியவில்லை") ? "var(--planet-saturn)" : "var(--chart-d9-active)" }}>
                {reminderMessage}
              </p>
            )}
          </div>
        </div>
      )}    </>
  );
}
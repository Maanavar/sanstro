"use client";

import { useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData } from "@/lib/types";
import { ACTIVITY_OPTIONS, ACTIVITY_TO_MUHURTA } from "./dashboard-plan-shared";
import { NovaMuhurtaPicker } from "./dashboard-plan-muhurta-picker-nova";
import { NovaMuhurthamNaal } from "./dashboard-plan-muhurtham-naal-nova";
import { NovaSelect } from "./nova-select";

/**
 * Nova re-skin of dashboard-plan-tab.tsx's PlanMuhurtaPanel — the last of
 * Plan's 4 sub-tab panels deferred (Classic-styled) when Plan Nova first
 * shipped (Phase 10, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). No mockup to
 * build against — extrapolation per §3.1's policy.
 *
 * This panel's own "Step 1" quick month-scan JSX and the two heavier
 * embedded widgets it wraps (`DashboardMuhurtaPicker` for Step 2's hour-
 * level search, `DashboardMuhurthamNaal` for the published almanac wedding
 * dates) all read the same reverted Classic `W` token set — none Nova-safe
 * — so all three got fresh Nova-token rebuilds this pass (the two widgets
 * as `NovaMuhurtaPicker`/`NovaMuhurthamNaal`, this file for the wrapper's
 * own Step-1 scan and the "how the two steps fit together" overview card).
 * Same data/API calls, same activityType→muhurta-activity mapping, same
 * click-to-prefill interaction between Step 1 and Step 2.
 */

const fieldStyle: React.CSSProperties = {
  borderRadius: "10px",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface-soft)",
  color: "var(--color-text)",
  fontSize: "14px",
  padding: "8px 10px",
  fontFamily: "inherit",
};

type Props = { lang: Lang; chartId: string };

export function NovaPlanMuhurtaPanel({ lang, chartId }: Props) {
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activityTimingResult, setActivityTimingResult] = useState<ActivityTimingData | null>(null);
  const [activityTimingBusy, setActivityTimingBusy] = useState(false);
  const [muhurtaPresetDate, setMuhurtaPresetDate] = useState<string | undefined>(undefined);
  const [muhurtaPresetActivity, setMuhurtaPresetActivity] = useState<string | undefined>(undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "var(--font-body)" }}>
      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "சிறந்த நாள் & முஹூர்த்தம்" : "Best Dates & Muhurta"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 9px", borderRadius: "999px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", color: "var(--color-high)", fontSize: "11px", fontWeight: 700 }}>
            ★ {lang === "ta" ? "உங்கள் ஜாதகத்திற்கு ஏற்ப — பொதுவானது அல்ல" : "Personalised to your jadhagam — not generic"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {lang === "ta"
            ? "இரண்டு படிகள் ஒன்றாக வேலை செய்கின்றன: படி 1 உங்கள் தசை + கிரகநகர்வைக் கொண்டு சிறந்த நாட்களைக் கண்டறிகிறது → ஒரு நாளைக் கிளிக் செய்தால், படி 2 அந்த நாளுக்குள் சரியான நேரத்தை (முஹூர்த்தம்) காட்டுகிறது."
            : "The two steps work together: Step 1 finds the best days from your Dasa + transits → click a day, and Step 2 finds the exact auspicious hour within that day."}
        </p>
      </div>

      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "16px 18px" }}>
        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "படி 1 — சிறந்த நாட்கள் கண்டறிய (விரைவு மாத கண்ணோட்டம்)" : "Step 1 — Find Best Dates (quick month scan)"}
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "மாதம் முழுவதையும் விரைவாக ஆராய்ந்து, தசை + கிரகநகர்வு + பஞ்சாங்க தினத்தன்மை கொண்டு சிறந்த நாட்களைத் தேர்ந்தெடுக்கிறது. தேர்ந்த நாளை கிளிக் செய்யுங்கள் — படி 2 தானாக நிரம்பும்; அங்கே சரியான நேரத்தை கண்டறியலாம்."
            : "Scans the whole month and picks the days with the best dasha + transit + day-quality alignment for your activity. Click any date to prefill Step 2, where you find the exact auspicious hour within that day."}
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "11.5px", color: "var(--color-muted)", lineHeight: 1.45, padding: "8px 10px", borderRadius: "8px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
          {lang === "ta"
            ? "படி 1 — 'எந்த நாள் நல்லது?' என்று சொல்கிறது. படி 2 — 'அந்த நாளில் எந்த நேரம் சிறந்தது?' என்று கண்டறிகிறது. இரண்டும் வேறு அளவீடுகளை பயன்படுத்துவதால் வெவ்வேறு தேதி/மதிப்பெண் காட்டலாம் — இது சரியானதே."
            : "Step 1 answers 'which days are good?' Step 2 answers 'what is the best hour on a given day?' They use different criteria (day-level vs hour-level panchangam), so their scores and top dates will not always match — that is expected and correct."}
        </p>

        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 220px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_label", lang)}</span>
            <NovaSelect
              value={activityType}
              onChange={(v) => { setActivityType(v); setActivityTimingResult(null); }}
              ariaLabel={t("activity_label", lang)}
              containerStyle={{ minWidth: "min(240px, 100%)" }}
              options={ACTIVITY_OPTIONS.map((opt) => ({ value: opt.value, label: lang === "ta" ? opt.ta : opt.en }))}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 130px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_month_label", lang)}</span>
            <input style={{ ...fieldStyle, minWidth: "min(140px, 100%)" }} type="month" value={activityMonth} onChange={(e) => { setActivityMonth(e.target.value); setActivityTimingResult(null); }} />
          </div>
          <button
            type="button"
            disabled={activityTimingBusy}
            onClick={() => {
              setActivityTimingBusy(true);
              apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
                `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
              )
                .then((r) => setActivityTimingResult(r.data))
                .catch(() => {})
                .finally(() => setActivityTimingBusy(false));
            }}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "1px solid var(--color-accent)",
              cursor: activityTimingBusy ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "14px",
              background: activityTimingBusy ? "var(--color-surface-soft)" : "var(--color-accent)",
              color: activityTimingBusy ? "var(--color-faint)" : "var(--color-on-accent)",
              fontFamily: "inherit",
            }}
          >
            {activityTimingBusy ? t("btn_finding", lang) : t("btn_find_best_dates", lang)}
          </button>
        </div>

        {activityTimingResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--color-muted)" }}>
              {lang === "ta"
                ? "ஒரு தேதியை கிளிக் செய்யுங்கள் — படி 2 அந்த நாள் மட்டும் சரிபார்த்து சரியான நேரம் (முஹூர்த்தம்) காட்டும்."
                : "Click a date to search only that day in Step 2 and find the best auspicious hour within it."}
            </p>
            {activityTimingResult.topDates.map((item, i) => {
              const isSelected = muhurtaPresetDate === item.dateLocal;
              const alignColor = item.alignment === "SUPPORTS" ? "var(--color-high)" : item.alignment === "CAUTION" ? "var(--color-mid)" : "var(--color-low)";
              const alignBg = item.alignment === "SUPPORTS" ? "var(--color-high-bg)" : item.alignment === "CAUTION" ? "var(--color-mid-bg)" : "var(--color-low-bg)";
              const scoreColor = item.score >= 70 ? "var(--color-high)" : item.score >= 50 ? "var(--color-mid)" : "var(--color-low)";
              let weekday = "";
              try { weekday = new Date(item.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" }); } catch { /**/ }
              let shortDate = "";
              try { shortDate = new Date(item.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { shortDate = item.dateLocal; }
              return (
                <div
                  key={item.dateLocal}
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderRadius: "10px", background: isSelected ? "var(--color-high-bg)" : "var(--color-surface)", border: `1.5px solid ${isSelected ? "var(--color-high-border)" : "var(--color-border)"}`, cursor: "pointer", transition: "all 0.12s" }}
                  onClick={() => {
                    setMuhurtaPresetDate(item.dateLocal);
                    setMuhurtaPresetActivity(ACTIVITY_TO_MUHURTA[activityType] ?? "");
                  }}
                >
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)" }}>{i + 1}.</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{item.score}</span>
                    <span style={{ display: "block", fontSize: "8px", fontWeight: 600, color: "var(--color-faint)" }}>/100</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: scoreColor }}>{shortDate}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)" }}>{weekday}</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: alignBg, color: alignColor, border: `1px solid ${alignColor}44` }}>
                        {item.alignment}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? item.reasonTa : item.reasonEn}</p>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "var(--color-high)" : "var(--color-muted)", flexShrink: 0 }}>
                    {lang === "ta" ? "முஹூர்த்தம் →" : "Get Muhurta →"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "படி 2 — சரியான நேரம் கண்டறிய (முஹூர்த்தம்)" : "Step 2 — Find the right hour (Muhurta)"}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {muhurtaPresetDate
            ? (lang === "ta" ? "படி 1-ல் தேர்ந்த நாள் கீழே நிரப்பப்பட்டுள்ளது. நேர-அளவிலான மதிப்பெண் காட்டப்படும்." : "The day you picked in Step 1 is filled in below. Scores here are hour-level for that day.")
            : (lang === "ta" ? "உங்கள் ஜாதகத்தின்படி ஒரு நாளுக்குள் சிறந்த நேரத்தைக் காட்டுகிறது." : "Shows the best hour within a day, personalised to your jadhagam.")}
        </p>
        <NovaMuhurtaPicker lang={lang} chartId={chartId || null} initialDateFrom={muhurtaPresetDate} initialActivity={muhurtaPresetActivity} />
      </div>

      <div>
        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "திருமணம் — 2027 முகூர்த்த நாட்கள்" : "Marriage — 2027 muhurtham dates"}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "வெளியிடப்பட்ட பஞ்சாங்க முகூர்த்த நாட்கள், உங்கள் நட்சத்திரத்துக்கு தாரா பலம் + சந்திராஷ்டமம் வைத்து வரிசைப்படுத்தப்பட்டவை."
            : "Published almanac wedding dates, ranked for your birth star by Tara Bala and Chandrashtama."}
        </p>
        <NovaMuhurthamNaal lang={lang} chartId={chartId || null} />
      </div>
    </div>
  );
}

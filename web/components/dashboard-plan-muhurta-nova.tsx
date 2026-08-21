"use client";

import { useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData } from "@/lib/types";
import { ACTIVITY_OPTIONS, ACTIVITY_TO_MUHURTA } from "./dashboard-plan-shared";
import { MuhurtaPanchangamOverlay, NovaMuhurtaPicker } from "./dashboard-plan-muhurta-picker-nova";
import { NovaMuhurthamNaal } from "./dashboard-plan-muhurtham-naal-nova";
import { NovaSelect } from "./nova-select";
import { Card } from "./ui";
import { Field, FieldShell, Input } from "./ui/field";

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
 * Same data/API calls, same activityType -> muhurta-activity mapping, same
 * click-to-prefill interaction between Step 1 and Step 2.
 */

type Props = { lang: Lang; chartId: string };

export function NovaPlanMuhurtaPanel({ lang, chartId }: Props) {
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activityTimingResult, setActivityTimingResult] = useState<ActivityTimingData | null>(null);
  const [activityTimingBusy, setActivityTimingBusy] = useState(false);
  const activityTimingElapsed = useElapsedSeconds(activityTimingBusy);
  const [muhurtaPresetDate, setMuhurtaPresetDate] = useState<string | undefined>(undefined);
  const [muhurtaPresetActivity, setMuhurtaPresetActivity] = useState<string | undefined>(undefined);
  const [panchangamDate, setPanchangamDate] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)" }}>
      <Card variant="soft" compact>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
            {lang === "ta" ? "உங்கள் ஜாதகத்திற்கு ஏற்ப" : "Personalised to your jadhagam"}
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
            {lang === "ta" ? "விரைவு தேதி தேடல் ஒரு குறுகிய பட்டியலைத் தரும். விரிவான முகூர்த்த தேடல் எந்தத் தேதிக்கும் முழு ஆய்வைத் தரும்." : "The quick scan gives you a shortlist. The detailed search gives any date a full muhurta assessment."}
          </p>
        </div>
      </Card>

      <Card>
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
            {lang === "ta" ? "விரைவு தேதி தேடல்" : "Quick date scan"}
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
            {lang === "ta" ? "உங்கள் செயலுக்கு ஒரு மாதத்தில் ஏற்ற நாட்களைத் தேடுங்கள். தேதியைத் தேர்ந்தெடுத்தால், அது கீழே உள்ள விரிவான தேடலுக்குத் தயாராகும்." : "Find supportive days for your activity in a month. Selecting one prepares it in the detailed search below."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
          <FieldShell label={t("activity_label", lang)} style={{ flex: "1 1 220px" }}>
            <NovaSelect
              value={activityType}
              onChange={(v) => { setActivityType(v); setActivityTimingResult(null); }}
              ariaLabel={t("activity_label", lang)}
              containerStyle={{ minWidth: "min(240px, 100%)" }}
              options={ACTIVITY_OPTIONS.map((opt) => ({ value: opt.value, label: lang === "ta" ? opt.ta : opt.en }))}
            />
          </FieldShell>
          <Field label={t("activity_month_label", lang)} style={{ flex: "1 1 130px" }}>
            <Input type="month" value={activityMonth} onChange={(e) => { setActivityMonth(e.target.value); setActivityTimingResult(null); }} style={{ minWidth: "min(140px, 100%)" }} />
          </Field>
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
              padding: "var(--space-2) var(--space-5)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-accent)",
              cursor: activityTimingBusy ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "var(--text-base)",
              background: activityTimingBusy ? "var(--color-surface-soft)" : "var(--color-accent)",
              color: activityTimingBusy ? "var(--color-faint)" : "var(--color-on-accent)",
              fontFamily: "inherit",
            }}
          >
            {activityTimingBusy ? `${t("btn_finding", lang)} ${activityTimingElapsed}s` : t("btn_find_best_dates", lang)}
          </button>
        </div>

        {activityTimingResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <p style={{ margin: "0 0 6px", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              {lang === "ta" ? "ஒரு தேதியைத் தேர்ந்தெடுத்து அதன் முழு முகூர்த்த ஆய்வை கீழே பார்க்கவும்." : "Select a date to check its full muhurta assessment below."}
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
                <Card
                  key={item.dateLocal}
                  variant={isSelected ? "high" : "default"}
                  compact
                  style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-4)", cursor: "pointer", transition: "all 0.12s" }}
                  onClick={() => {
                    setMuhurtaPresetDate(item.dateLocal);
                    setMuhurtaPresetActivity(ACTIVITY_TO_MUHURTA[activityType] ?? "");
                  }}
                >
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)" }}>{i + 1}.</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{item.score}</span>
                    <span style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--color-faint)" }}>/100</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      {activityTimingResult.dailyLocation ? (
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); setPanchangamDate(item.dateLocal); }}
                          aria-label={`${t("label_panchangam", lang)} · ${shortDate}`}
                          style={{ padding: 0, border: 0, background: "transparent", font: "inherit", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-accent)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
                        >
                          {shortDate}
                        </button>
                      ) : (
                        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: scoreColor }}>{shortDate}</span>
                      )}
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-muted)" }}>{weekday}</span>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-pill)", background: alignBg, color: alignColor, border: `1px solid ${alignColor}44` }}>
                        {item.alignment}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? item.reasonTa : item.reasonEn}</p>
                  </div>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: isSelected ? "var(--color-high)" : "var(--color-muted)", flexShrink: 0 }}>
                    {lang === "ta" ? "விரிவாகச் சரிபார்க்க" : "Check in detail"}
                  </span>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div>
        <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "விரிவான முகூர்த்த தேடல்" : "Detailed muhurta search"}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {muhurtaPresetDate
            ? (lang === "ta" ? "தேர்ந்தெடுத்த தேதி தயாராக உள்ளது. செயல்பாடு, பஞ்சாங்கம் மற்றும் தனிப்பட்ட காரணிகளைச் சரிபார்க்கவும்." : "Your selected date is ready. Check its activity rules, Panchangam, and personal factors.")
            : (lang === "ta" ? "எந்தத் தேதி அல்லது தேதி வரம்பிற்கும் உங்கள் ஜாதகத்தின்படி முழு முகூர்த்தத் தேடலை இயக்கவும்." : "Run a full, chart-personalised muhurta search for any date or date range.")}
        </p>
        <NovaMuhurtaPicker lang={lang} chartId={chartId || null} initialDateFrom={muhurtaPresetDate} initialActivity={muhurtaPresetActivity} />
      </div>

      <div>
        <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "திருமணம் · வெளியிடப்பட்ட முகூர்த்த நாட்கள்" : "Marriage · published muhurtham dates"}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "வெளியிடப்பட்ட பஞ்சாங்க முகூர்த்த நாட்கள், உங்கள் நட்சத்திரத்துக்கு தாரா பலம் + சந்திராஷ்டமம் வைத்து வரிசைப்படுத்தப்பட்டவை."
            : "Published almanac wedding dates, ranked for your birth star by Tara Bala and Chandrashtama."}
        </p>
        <NovaMuhurthamNaal
          lang={lang}
          chartId={chartId || null}
          onCheckInPlanner={(date) => {
            setMuhurtaPresetDate(date);
            setMuhurtaPresetActivity("MARRIAGE");
          }}
        />
      </div>

      {panchangamDate && activityTimingResult?.dailyLocation && (
        <MuhurtaPanchangamOverlay
          date={panchangamDate}
          location={activityTimingResult.dailyLocation}
          lang={lang}
          onClose={() => setPanchangamDate(null)}
        />
      )}
    </div>
  );
}

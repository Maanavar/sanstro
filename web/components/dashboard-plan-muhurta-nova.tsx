"use client";

import { useEffect, useRef, useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { CULTURAL_CONTEXT, dt } from "@/lib/dashboard-i18n";
import type { ActivityTimingData } from "@/lib/types";
import { focusPreselect } from "@/lib/life-focus";
import { ACTIVITY_OPTIONS, ACTIVITY_TO_MUHURTA } from "./dashboard-plan-shared";
import {
  MuhurtaDayDetailDrawer,
  NovaMuhurtaPicker,
  type MuhurtaDayDrawerComponent,
} from "./dashboard-plan-muhurta-picker-nova";
import { NovaMuhurthamNaal } from "./dashboard-plan-muhurtham-naal-nova";
import {
  INITIAL_WEDDING_CHOICE,
  WeddingPartnerControl,
  coupleFromChoice,
  defaultRoleFor,
  scanWeddingParams,
  suggestedPartner,
  useSavedProfiles,
} from "./dashboard-plan-wedding-partner";
import type { WeddingChoice } from "./dashboard-plan-wedding-partner";
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

type Props = {
  lang: Lang;
  chartId: string;
  /** Life focus, Phase 3: the quick scan opens on the focus's first activity.
   *  Empty for a family member's chart (D4). */
  focusActivities?: readonly string[];
  DayDrawer: MuhurtaDayDrawerComponent;
};

export function NovaPlanMuhurtaPanel({ lang, chartId, focusActivities = [], DayDrawer }: Props) {
  // Null until the reader picks, so the default can follow a focus change
  // made elsewhere without overriding a choice made here.
  const [chosenActivityType, setActivityType] = useState<string | null>(null);
  const activityType = chosenActivityType
    ?? focusPreselect(focusActivities, ACTIVITY_OPTIONS.map((opt) => opt.value))
    ?? ACTIVITY_OPTIONS[0].value;
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

  // One answer to "whose charts decide a wedding?" for both surfaces below.
  const { profiles, failed: profilesFailed } = useSavedProfiles();
  const [wedding, setWedding] = useState<WeddingChoice>(INITIAL_WEDDING_CHOICE);
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    // Seeded once per open chart, from what that chart's profile already says:
    // its saved gender for the role, and a timed spouse as the partner. A spouse
    // on file makes "both charts" the starting answer, as it is in the Tools
    // finder; a reader's own later choice is never overwritten.
    if (!profiles || seededFor.current === chartId) return;
    seededFor.current = chartId;
    const active = profiles.find((profile) => profile.chartId === chartId);
    const partner = suggestedPartner(profiles, chartId);
    setWedding({
      mode: partner ? "couple" : "solo",
      subjectRole: defaultRoleFor(active),
      partnerChartId: partner,
    });
  }, [profiles, chartId]);
  const activeProfile = profiles?.find((profile) => profile.chartId === chartId) ?? null;
  // Unknown until profiles load; the backend is the final check either way.
  const activeTimed = activeProfile ? Boolean(activeProfile.birthTimeLocal) : true;
  const couple = coupleFromChoice(wedding, activeTimed);
  const partnerName = couple ? (profiles?.find((profile) => profile.chartId === couple.partnerChartId)?.displayName ?? null) : null;
  const isWeddingScan = activityType === "marriage";
  const scanCouple = scanWeddingParams(activityType, couple);
  // A shortlist ranked for one couple must not stay on screen under another.
  const scanCoupleKey = `${scanCouple.partnerChartId ?? ""}:${scanCouple.subjectRole ?? ""}`;
  useEffect(() => { setActivityTimingResult(null); }, [scanCoupleKey]);
  // Covers the focus-driven default too: a shortlist never outlives its activity.
  useEffect(() => { setActivityTimingResult(null); }, [activityType]);
  const quickScanDay = panchangamDate
    ? activityTimingResult?.topDates.find((day) => day.dateLocal === panchangamDate) ?? null
    : null;
  const quickScanActivity = ACTIVITY_OPTIONS.find((option) => option.value === activityType) ?? ACTIVITY_OPTIONS[0];

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

      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {dt(CULTURAL_CONTEXT.muhurta, lang)}
      </p>

      {/* Above all three surfaces it governs — the quick scan, the detailed
          search and the published dates — so it is answered before any of them
          is read, and "above" in their status lines is true. */}
      <WeddingPartnerControl
        lang={lang}
        chartId={chartId || null}
        profiles={profiles}
        failed={profilesFailed}
        value={wedding}
        onChange={setWedding}
      />

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
                `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth, ...scanCouple })}`,
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

        {/* Whose charts a wedding shortlist reads, stated where it is run — the
            same line the detailed search carries, for the same reason. */}
        {isWeddingScan && (
          <p style={{ margin: "-6px 0 14px", fontSize: "var(--text-sm)", color: couple ? "var(--color-text)" : "var(--color-muted)", lineHeight: 1.5 }}>
            {couple
              ? (lang === "ta"
                ? `இரு ஜாதகங்களுக்கும் சரிபார்க்கப்படுகிறது — இந்த ஜாதகம்${partnerName ? ` மற்றும் ${partnerName}` : ""}. ஒவ்வொரு நாளுக்கும் இருவரில் குறைவான மதிப்பெண்ணும் பலவீனமான தாராவுமே கணக்கில் எடுக்கப்படும்.`
                : `Checked for both charts — this chart${partnerName ? ` and ${partnerName}` : " and your partner's"}. Each day takes the lower of the two day scores and the weaker Tara.`)
              : (lang === "ta"
                ? "இந்த ஜாதகத்துக்கு மட்டுமே சரிபார்க்கப்படுகிறது. இருவருக்கும் சரிபார்க்க, மேலே \"மணமகள் & மணமகன்\" என்பதைத் தேர்ந்தெடுக்கவும்."
                : "Checked for this chart only. Choose \"Bride and groom\" above to check both of you.")}
          </p>
        )}

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
            : (lang === "ta" ? "ஆங்கில மாதம், தமிழ் மாதம் அல்லது தேதி வரம்பு — எதைத் தேர்ந்தெடுத்தாலும் உங்கள் ஜாதகத்தின்படி முழு முகூர்த்தத் தேடலை இயக்கவும்." : "Run a full, chart-personalised muhurta search by English month, Tamil month, or an explicit date range.")}
        </p>
        <NovaMuhurtaPicker
          lang={lang}
          chartId={chartId || null}
          DayDrawer={DayDrawer}
          initialDateFrom={muhurtaPresetDate}
          initialActivity={muhurtaPresetActivity}
          wedding={{ couple, subjectRole: wedding.subjectRole, partnerName }}
        />
      </div>

      <div>
        <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {lang === "ta" ? "திருமணம் · வெளியிடப்பட்ட முகூர்த்த நாட்கள்" : "Marriage · published muhurtham dates"}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {couple
            ? (lang === "ta"
              ? "வெளியிடப்பட்ட பஞ்சாங்க முகூர்த்த நாட்கள், இருவரின் நட்சத்திரங்களுக்கும் தாரா பலம் + சந்திராஷ்டமம் வைத்து வரிசைப்படுத்தப்பட்டவை — இருவரில் பலவீனமானதே முடிவு செய்யும்."
              : "Published almanac wedding dates, ranked for both birth stars by Tara Bala and Chandrashtama — the weaker of the two decides.")
            : (lang === "ta"
              ? "வெளியிடப்பட்ட பஞ்சாங்க முகூர்த்த நாட்கள், உங்கள் நட்சத்திரத்துக்கு தாரா பலம் + சந்திராஷ்டமம் வைத்து வரிசைப்படுத்தப்பட்டவை."
              : "Published almanac wedding dates, ranked for your birth star by Tara Bala and Chandrashtama.")}
        </p>
        <NovaMuhurthamNaal
          lang={lang}
          chartId={chartId || null}
          DayDrawer={DayDrawer}
          couple={couple}
          onCheckInPlanner={(date) => {
            setMuhurtaPresetDate(date);
            setMuhurtaPresetActivity("MARRIAGE");
          }}
        />
      </div>

      {panchangamDate && quickScanDay && activityTimingResult?.dailyLocation && (
        <MuhurtaDayDetailDrawer
          date={panchangamDate}
          location={activityTimingResult.dailyLocation}
          resultDates={activityTimingResult.topDates.map((day) => day.dateLocal)}
          lang={lang}
          lead={(
            <section style={{ padding: "var(--space-4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)" }}>
              <p style={{ margin: "0 0 6px", color: "var(--color-text-accent)", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {lang === "ta" ? `விரைவு மாதத் தேடல் · ${quickScanActivity.ta}` : `Quick month scan · ${quickScanActivity.en}`}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <strong style={{ color: quickScanDay.score >= 70 ? "var(--color-high)" : quickScanDay.score >= 50 ? "var(--color-mid)" : "var(--color-low)", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)" }}>
                  {quickScanDay.score}<span style={{ fontSize: "var(--text-sm)" }}>/100</span>
                </strong>
                <span style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)", fontWeight: 700 }}>{quickScanDay.alignment}</span>
              </div>
              <p style={{ margin: "6px 0 0", color: "var(--color-text)", lineHeight: 1.55 }}>
                {lang === "ta" ? quickScanDay.reasonTa : quickScanDay.reasonEn}
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--color-muted)", fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "இது தினவழிகாட்டல் + தாரா அடிப்படையிலான விரைவு வரிசை. நேரத்தைத் தேர்வதற்கு கீழுள்ள விரிவான முகூர்த்தத் தேடலை இயக்கவும்."
                  : "This is the daily-guidance + Tara quick ranking. Run the detailed election below before choosing a time."}
              </p>
            </section>
          )}
          onDateChange={setPanchangamDate}
          onClose={() => setPanchangamDate(null)}
          DayDrawer={DayDrawer}
        />
      )}
    </div>
  );
}

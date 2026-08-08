"use client";

import { bandPhrase, bandTone, readingPhrase, readingTone } from "@/lib/reasoning";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { WhatIfData } from "@/lib/types";
import { verdictKey, strengthKey, WHATIF_OPTIONS } from "./dashboard-plan-shared";
import { NovaSelect } from "./nova-select";
import { Card } from "./ui";
import { Field, FieldShell, Input } from "./ui/field";

/**
 * Nova re-skin of dashboard-plan-tab.tsx's PlanWhatIfPanel — one of Plan's 4
 * sub-tab panels deferred (Classic-styled) when Plan Nova first shipped
 * (Phase 10, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). No mockup to build
 * against — extrapolation per §3.1's policy.
 *
 * Grepped every var(--...) reference in the Classic file's PlanWhatIfPanel
 * first: its `W` token map is the same reverted (not redirected) warm-parchment
 * set as every other deferred panel this pass, plus a handful of Classic-only
 * sage/brand tint tokens — none Nova-redirected. Fresh Nova-token rebuild,
 * not a gap-fix.
 *
 * Reuses `bandTone`/`bandPhrase` (Nova-safe after this pass's §6.8.1 CSS
 * fix) and the Classic file's own `verdictKey`/`strengthKey` (pure i18n-key
 * lookups, no color — safe to reuse as-is); `verdictColor`/`strengthColor`
 * are NOT reused since they resolve to Classic-only warm-parchment / planet
 * colours for two of three bands — replaced with a local
 * Nova-token equivalent using the same high/mid/low semantic triplet every
 * other panel in this pass uses. All state stays lifted in
 * dashboard-workspace.tsx exactly as Classic's own component requires (the
 * What-If form is a controlled component, same props as `PlanWhatIfPanel`).
 */

function novaVerdictColor(v: string): string {
  return v === "FAVOURABLE" ? "var(--color-high)" : v === "CAUTION" ? "var(--color-low)" : "var(--color-mid)";
}

function novaStrengthColor(s: string): string {
  return s === "STRONG" ? "var(--color-high)" : s === "WEAK" ? "var(--color-low)" : "var(--color-mid)";
}

type Props = {
  lang: Lang;
  whatIfScenario: string;
  whatIfDate: string;
  whatIfResult: WhatIfData | null;
  whatIfBusy: boolean;
  whatIfError: string;
  onWhatIfScenarioChange: (v: string) => void;
  onWhatIfDateChange: (v: string) => void;
  onRunWhatIf: () => void;
};

export function NovaPlanWhatIfPanel({
  lang,
  whatIfScenario,
  whatIfDate,
  whatIfResult,
  whatIfBusy,
  whatIfError,
  onWhatIfScenarioChange,
  onWhatIfDateChange,
  onRunWhatIf,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>
          {t("whatif_panel_title", lang)}
        </p>
        <p style={{ margin: "0 0 10px", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5 }}>{t("whatif_panel_desc", lang)}</p>
        <Card variant="soft" compact>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--color-text)" }}>
              {lang === "ta" ? "இந்த மதிப்பெண் என்ன காட்டுகிறது:" : "What this score measures:"}
            </strong>
            {" "}
            {lang === "ta"
              ? "நீங்கள் தேர்ந்தெடுத்த குறிப்பிட்ட தேதிக்கு மூன்று-உறுதிப்படுத்தல் பகுப்பாய்வு — பிறப்பு ஜாதக வாக்குறுதி + தசை ஆதரவு + கிரகநகர்வு நிலை ஒரே நேரத்தில் சரிபார்க்கப்படும். இது 'Goals' தாவலில் உள்ள மதிப்பெண்ணிலிருந்து வேறுபடும் — அது பல மாத தசை ஆதரவை அளவிடுகிறது; இது ஒரு குறிப்பிட்ட நாளை அளவிடுகிறது."
              : "Triple-confirmation analysis for the exact date you chose — natal promise, Dasa support, and transit positions are all checked simultaneously. This will naturally differ from Goals window scores because Goals measures multi-month Dasa alignment, while What-If measures one specific day."}
          </p>
        </Card>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <FieldShell label={t("whatif_scenario", lang)} style={{ flex: "1 1 220px" }}>
          <NovaSelect
            value={whatIfScenario}
            onChange={onWhatIfScenarioChange}
            ariaLabel={t("whatif_scenario", lang)}
            containerStyle={{ minWidth: "min(220px, 100%)" }}
            options={WHATIF_OPTIONS.map((opt) => ({ value: opt.value, label: lang === "ta" ? opt.ta : opt.en }))}
          />
        </FieldShell>

        <Field label={t("whatif_date", lang)} style={{ flex: "1 1 140px" }}>
          <Input type="date" value={whatIfDate} onChange={(e) => onWhatIfDateChange(e.target.value)} />
        </Field>

        <button
          type="button"
          onClick={onRunWhatIf}
          disabled={whatIfBusy || !whatIfDate}
          style={{
            padding: "var(--space-2) var(--space-6)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-accent)",
            cursor: whatIfBusy || !whatIfDate ? "not-allowed" : "pointer",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            background: whatIfBusy || !whatIfDate ? "var(--color-surface-soft)" : "var(--color-accent)",
            color: whatIfBusy || !whatIfDate ? "var(--color-faint)" : "var(--color-on-accent)",
            fontFamily: "inherit",
          }}
        >
          {whatIfBusy ? t("whatif_running", lang) : t("whatif_run", lang)}
        </button>
      </div>

      {whatIfError && <p role="alert" style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-low)" }}>{whatIfError}</p>}

      {whatIfResult && (() => {
        const r = whatIfResult;
        const vc = novaVerdictColor(r.verdict);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: "var(--text-2xl)", fontWeight: 900, color: vc, lineHeight: 1 }}>{r.overallScore}</p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>/100</p>
              </div>
              <div style={{ padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-sm)", background: `${vc}18`, border: `1px solid ${vc}55` }}>
                <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 800, color: vc }}>{t(verdictKey(r.verdict) as Parameters<typeof t>[0], lang)}</p>
              </div>
              {r.band && (() => {
                const bt = bandTone(r.band);
                return (
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: bt.bg, color: bt.text, border: `1px solid ${bt.border}` }}>
                    {bandPhrase(r.band, lang)}
                  </span>
                );
              })()}
              {r.reading && (() => {
                const rt = readingTone(r.reading);
                return (
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: rt.bg, color: rt.text, border: `1px solid ${rt.border}` }}>
                    {readingPhrase(r.reading, lang)}
                  </span>
                );
              })()}
            </div>

            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.6 }}>{lang === "ta" ? r.summary.ta : r.summary.en}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("whatif_result_title", lang)}
              </p>
              {([
                [t("whatif_natal", lang), r.tripleConfirmation.natalPromise, r.tripleConfirmation.natalPromiseStrength],
                [t("whatif_dasha", lang), r.tripleConfirmation.dashaSupport, r.tripleConfirmation.dashaSupportStrength],
                [t("whatif_gochar", lang), r.tripleConfirmation.gocharSupport, r.tripleConfirmation.gocharSupportStrength],
              ] as [string, string, string][]).map(([label, text, strength]) => (
                <Card key={label} variant="soft" compact>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)" }}>{label}</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: novaStrengthColor(strength) }}>
                      {t(strengthKey(strength) as Parameters<typeof t>[0], lang)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>{text}</p>
                </Card>
              ))}
            </div>

            <Card variant="high" compact>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-high)" }}>{t("whatif_best_period", lang)}</p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? r.bestPeriodInWindow.ta : r.bestPeriodInWindow.en}</p>
            </Card>

            <Card variant="mid" compact>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-mid)" }}>{t("whatif_caution", lang)}</p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? r.cautionNote.ta : r.cautionNote.en}</p>
            </Card>

            <Card variant="mid" compact>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-mid)" }}>{t("whatif_remedy", lang)}</p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? r.remedy.ta : r.remedy.en}</p>
            </Card>

            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5, fontStyle: "italic" }}>
              {t("whatif_disclaimer", lang)}: {lang === "ta" ? r.disclaimer.ta : r.disclaimer.en}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

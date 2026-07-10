"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, DecisionBriefData } from "@/lib/types";
import { SCENARIO_GROUPS } from "./dashboard-plan-shared";
import { NovaSelect } from "./nova-select";

/**
 * Nova re-skin of dashboard-decision-panel.tsx's DecisionPanel (plus the
 * thin `PlanDecisionsPanel` wrapper from dashboard-plan-tab.tsx) — one of
 * Plan's 4 sub-tab panels deferred (Classic-styled) when Plan Nova first
 * shipped (Phase 10, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). No mockup to
 * build against (the mockup's static export never expands past "Goals",
 * per §6.9's own finding) — extrapolation per §3.1's policy.
 *
 * Grepped every var(--...) reference in the Classic file first: its own `W`
 * token map (ink/inkMid/border/borderLt/surface/surfaceMd) reads the exact
 * same 5 custom properties (--panel-earth-dark/-earth/-tan/-tan-light/
 * -hover) the 2026-07-06 browser-QA round reverted after they broke
 * selected-pill text app-wide (same finding as Journal §6.11, Remedies
 * §6.8.1), plus several literal hardcoded `#F9ECE7`/rgba(168,72,47,...)
 * values with no CSS variable at all for the caution/risk boxes. So this is
 * a fresh Nova-token rebuild, not a gap-fix — same class of decision as
 * every other deferred panel re-skinned this pass.
 *
 * All pure data (the 7 `SCENARIO_GROUPS`) and the API call are reused
 * unchanged; only the JSX/styling layer and the two color-mapping functions
 * (`verdictColor`/`strengthColor` in the Classic file) are rebuilt with
 * Nova's own high/mid/low semantic triplet.
 */

function novaVerdictColor(verdict: string): string {
  if (verdict === "A" || verdict === "FAVOURABLE") return "var(--color-high)";
  if (verdict === "B" || verdict === "CAUTION") return "var(--color-low)";
  return "var(--color-mid)";
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "10px",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface-soft)",
  color: "var(--color-text)",
  fontSize: "14px",
  fontFamily: "inherit",
};

type Props = {
  lang: Lang;
  chartId: string;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
};

export function NovaPlanDecisionsPanel({ lang, chartId, mode = "BALANCED" }: Props) {
  const [priority, setPriority] = useState("career");
  const [scenarioLabel, setScenarioLabel] = useState(SCENARIO_GROUPS[0].options[0].en);
  const [targetDate, setTargetDate] = useState("");
  const [optionALabel, setOptionALabel] = useState("");
  const [optionADescription, setOptionADescription] = useState("");
  const [optionBLabel, setOptionBLabel] = useState("");
  const [optionBDescription, setOptionBDescription] = useState("");
  const [result, setResult] = useState<DecisionBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (mode === "BEGINNER") return null;

  const isFormValid =
    !!chartId &&
    !!targetDate &&
    optionALabel.trim().length > 0 &&
    optionADescription.trim().length > 0 &&
    optionBLabel.trim().length > 0 &&
    optionBDescription.trim().length > 0;

  async function analyse() {
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await apiFetchJson<ApiEnvelope<DecisionBriefData>>("/api/v1/decisions/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartId,
          targetDate,
          priority,
          optionA: { label: optionALabel.trim(), description: optionADescription.trim() },
          optionB: { label: optionBLabel.trim(), description: optionBDescription.trim() },
        }),
      });
      setResult(r.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "var(--font-body)" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          {t("decision_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)" }}>{t("decision_panel_desc", lang)}</p>
      </div>

      <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
        <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          {lang === "ta" ? "எதை எப்போது பயன்படுத்துவது?" : "When to use which tool?"}
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5 }}>
          <strong>Decision Support:</strong>{" "}
          {lang === "ta"
            ? "A vs B போன்ற இரண்டு விருப்பங்களை ஒப்பிட்டு, இப்போது எது சிறந்தது என்பதை தெரிந்துகொள்ள."
            : "Compare Option A vs Option B when you need a recommendation for a specific decision date."}
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5 }}>
          <strong>What-If:</strong>{" "}
          {lang === "ta"
            ? "ஒரே முடிவிற்கு வேறு தேதிகளை முயன்று, எந்த காலம் சிறந்தது என்பதை பார்க்க (Planning tab)."
            : "Simulate a single scenario across timing windows to find better periods (Planning tab)."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-faint)", marginBottom: "4px" }}>
              {t("decision_scenario", lang)}
            </label>
            <NovaSelect
              value={scenarioLabel}
              onChange={(v) => {
                const allOptions = SCENARIO_GROUPS.flatMap((g) => g.options);
                const found = allOptions.find((o) => o.en === v);
                if (found) {
                  setPriority(found.value);
                  setScenarioLabel(found.en);
                }
              }}
              ariaLabel={t("decision_scenario", lang)}
              options={SCENARIO_GROUPS.flatMap((group) =>
                group.options.map((opt) => ({
                  value: opt.en,
                  label: lang === "ta" ? opt.ta : opt.en,
                  group: lang === "ta" ? group.groupTa : group.groupEn,
                })),
              )}
            />
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-faint)", marginBottom: "4px" }}>
              {t("decision_target_date", lang)} *
            </label>
            <input style={fieldStyle} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-faint)", marginBottom: "4px" }}>
              {t("decision_option_a", lang)}
            </label>
            <input
              style={fieldStyle}
              type="text"
              value={optionALabel}
              onChange={(e) => setOptionALabel(e.target.value)}
              placeholder={lang === "ta" ? "விருப்பம் A தலைப்பு" : "Option A label"}
            />
            <textarea
              style={{ ...fieldStyle, marginTop: "6px", resize: "vertical" }}
              value={optionADescription}
              onChange={(e) => setOptionADescription(e.target.value)}
              rows={2}
              placeholder={lang === "ta" ? "விருப்பம் A விளக்கம்" : "Option A description"}
            />
          </div>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-faint)", marginBottom: "4px" }}>
              {t("decision_option_b", lang)}
            </label>
            <input
              style={fieldStyle}
              type="text"
              value={optionBLabel}
              onChange={(e) => setOptionBLabel(e.target.value)}
              placeholder={lang === "ta" ? "விருப்பம் B தலைப்பு" : "Option B label"}
            />
            <textarea
              style={{ ...fieldStyle, marginTop: "6px", resize: "vertical" }}
              value={optionBDescription}
              onChange={(e) => setOptionBDescription(e.target.value)}
              rows={2}
              placeholder={lang === "ta" ? "விருப்பம் B விளக்கம்" : "Option B description"}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void analyse()}
          disabled={loading || !isFormValid}
          style={{
            alignSelf: "flex-start",
            padding: "8px 22px",
            borderRadius: "10px",
            border: "1px solid var(--color-accent)",
            cursor: loading || !isFormValid ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 700,
            background: loading || !isFormValid ? "var(--color-surface-soft)" : "var(--color-accent)",
            color: loading || !isFormValid ? "var(--color-faint)" : "var(--color-on-accent)",
            fontFamily: "inherit",
          }}
        >
          {loading ? t("decision_analysing", lang) : t("decision_analyse", lang)}
        </button>
        {error && <p style={{ margin: 0, fontSize: "12px", color: "var(--color-low)" }}>{error}</p>}
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "18px 20px", borderRadius: "12px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--color-faint)" }}>{t("decision_recommended", lang)}</p>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: novaVerdictColor(result.recommended) }}>
                {result.recommended === "DEFER" ? t("decision_defer", lang) : result.recommended}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--color-faint)" }}>{t("decision_confidence", lang)}</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: novaVerdictColor(result.recommended) }}>{result.confidence}%</p>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--color-faint)" }}>{t("decision_reasoning", lang)}</p>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(result.reasoning, lang)}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "12px" }}>
            {[
              { key: "A" as const, data: result.optionA, isRecommended: result.recommended === "A" },
              { key: "B" as const, data: result.optionB, isRecommended: result.recommended === "B" },
            ].map(({ key, data, isRecommended }) => {
              const isDefer = result.recommended === "DEFER";
              const accentColor = isRecommended ? "var(--color-high)" : isDefer ? "var(--color-mid)" : "var(--color-low)";
              const bgColor = isRecommended ? "var(--color-high-bg)" : isDefer ? "var(--color-surface-soft)" : "var(--color-low-bg)";
              const borderColor = isRecommended ? "var(--color-high-border)" : isDefer ? "var(--color-border)" : "var(--color-low-border)";
              return (
                <div key={key} style={{ padding: "14px 16px", borderRadius: "12px", background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: accentColor }}>
                        {t(`decision_option_${key.toLowerCase()}` as Parameters<typeof t>[0], lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--color-text)" }}>{data.label}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: accentColor, lineHeight: 1 }}>{data.score}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-faint)", marginTop: "2px" }}>/100</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                      {isRecommended ? "Recommended" : isDefer ? "Defer" : "Weaker option"}
                    </span>
                  </div>

                  {data.alignmentNotes.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", color: isRecommended ? "var(--color-high)" : "var(--color-faint)" }}>
                        {isRecommended ? "Why this is stronger" : "Limiting factors"}
                      </p>
                      <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
                        {data.alignmentNotes.map((note) => (
                          <li key={note} style={{ fontSize: "12px", color: isRecommended ? "var(--color-text)" : "var(--color-muted)", lineHeight: 1.4, marginBottom: "2px" }}>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.riskFactors.length > 0 && (
                    <div style={{ padding: "6px 8px", borderRadius: "6px", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", marginBottom: "6px" }}>
                      <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-low)" }}>
                        {lang === "ta" ? "கவனிக்க வேண்டியவை" : "Watch out for"}
                      </p>
                      {data.riskFactors.map((rf, i) => (
                        <p key={rf} style={{ margin: i > 0 ? "2px 0 0" : 0, fontSize: "12px", color: "var(--color-low)", lineHeight: 1.4 }}>
                          ! {rf}
                        </p>
                      ))}
                    </div>
                  )}

                  {data.optimalWindow && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-mid)" }}>
                      {t("decision_optimal_window", lang)}: {data.optimalWindow}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {result.caution && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--color-low)" }}>{t("decision_caution", lang)}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(result.caution, lang)}</p>
            </div>
          )}

          {/* High-stakes risk framing — money/immigration decisions leaned on
              astrology carry blame/liability if they "go wrong" (#32). */}
          <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-muted)", lineHeight: 1.5, display: "flex", gap: "6px" }}>
            <span aria-hidden="true">⚖</span>
            <span>{t("safeguard_decision", lang)}</span>
          </p>
        </div>
      )}

      {!result && !loading && <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)" }}>{t("decision_empty", lang)}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, DecisionBriefData } from "@/lib/types";

const SCENARIO_GROUPS: Array<{ groupEn: string; groupTa: string; options: Array<{ value: string; en: string; ta: string }> }> = [
  {
    groupEn: "Career & Work",
    groupTa: "தொழில் & வேலை",
    options: [
      { value: "career", en: "Job change / New role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
      { value: "career", en: "Promotion / Raise", ta: "பதவி உயர்வு / சம்பள உயர்வு" },
      { value: "career", en: "Start own business", ta: "சொந்த தொழில் தொடங்குதல்" },
      { value: "career", en: "Resign / Quit", ta: "வேலை விட்டு வெளியேறுதல்" },
    ],
  },
  {
    groupEn: "Money & Property",
    groupTa: "பணம் & சொத்து",
    options: [
      { value: "money", en: "Investment decision", ta: "முதலீட்டு முடிவு" },
      { value: "money", en: "Buy / Sell property", ta: "சொத்து வாங்குதல் / விற்பனை" },
      { value: "money", en: "Take a loan", ta: "கடன் வாங்குதல்" },
      { value: "money", en: "Start savings / SIP", ta: "சேமிப்பு / SIP தொடங்குதல்" },
    ],
  },
  {
    groupEn: "Relationships",
    groupTa: "உறவு",
    options: [
      { value: "relationship", en: "Marriage / Engagement", ta: "திருமணம் / நிச்சயதார்த்தம்" },
      { value: "relationship", en: "Start a relationship", ta: "புதிய உறவு தொடங்குதல்" },
      { value: "relationship", en: "Resolve family conflict", ta: "குடும்ப பிரச்சினை தீர்க்குதல்" },
      { value: "family", en: "Children / Family planning", ta: "குழந்தை / குடும்ப திட்டம்" },
    ],
  },
  {
    groupEn: "Health & Wellbeing",
    groupTa: "உடல்நலம்",
    options: [
      { value: "health", en: "Medical procedure / Surgery", ta: "மருத்துவ சிகிச்சை / அறுவை சிகிச்சை" },
      { value: "health", en: "Start new health routine", ta: "புதிய உடல்நல திட்டம் தொடங்குதல்" },
      { value: "health", en: "Mental health / Therapy", ta: "மன நலம் / சிகிச்சை" },
    ],
  },
  {
    groupEn: "Education & Learning",
    groupTa: "கல்வி",
    options: [
      { value: "education", en: "Higher education / Abroad study", ta: "உயர் கல்வி / வெளிநாட்டு படிப்பு" },
      { value: "education", en: "New course / Certification", ta: "புதிய படிப்பு / சான்றிதழ்" },
      { value: "education", en: "Competitive exam", ta: "போட்டித் தேர்வு" },
    ],
  },
  {
    groupEn: "Relocation & Travel",
    groupTa: "இடம் மாற்றம் & பயணம்",
    options: [
      { value: "career", en: "Relocate to new city", ta: "புதிய நகரத்திற்கு இடம் பெயர்தல்" },
      { value: "career", en: "Move abroad / Emigrate", ta: "வெளிநாடு செல்லுதல்" },
      { value: "spiritual", en: "Pilgrimage / Sacred travel", ta: "யாத்திரை / புண்ணிய பயணம்" },
    ],
  },
  {
    groupEn: "Spiritual & Personal",
    groupTa: "ஆன்மீகம் & தனிப்பட்டது",
    options: [
      { value: "spiritual", en: "Spiritual initiation / Diksha", ta: "ஆன்மீக தீக்ஷை / துவக்கம்" },
      { value: "spiritual", en: "Start meditation / Sadhana", ta: "தியானம் / சாதனா தொடங்குதல்" },
      { value: "career", en: "Major life direction change", ta: "வாழ்க்கை திசை மாற்றம்" },
    ],
  },
];

type Props = {
  lang: Lang;
  chartId: string;
};

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  sage: "#5C7654",
  rust: "#A8482F",
} as const;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2) var(--space-2_5)",
  borderRadius: "var(--radius-md)",
  border: `1.5px solid ${W.borderLt}`,
  background: W.card,
  color: W.inkMid,
  fontSize: "0.875rem",
  fontFamily: "inherit",
};

function verdictColor(verdict: string): string {
  if (verdict === "A" || verdict === "FAVOURABLE") return W.sage;
  if (verdict === "B" || verdict === "CAUTION") return W.rust;
  return W.terracotta;
}

export function DecisionPanel({ lang, chartId }: Props) {
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
          optionA: {
            label: optionALabel.trim(),
            description: optionADescription.trim(),
          },
          optionB: {
            label: optionBLabel.trim(),
            description: optionBDescription.trim(),
          },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("decision_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>{t("decision_panel_desc", lang)}</p>
      </div>

      <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: "#EEF1F8" }}>
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {lang === "ta" ? "எதை எப்போது பயன்படுத்துவது?" : "When to use which tool?"}
        </p>
        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.5 }}>
          <strong>{lang === "ta" ? "Decision Support:" : "Decision Support:"}</strong>{" "}
          {lang === "ta"
            ? "A vs B போன்ற இரண்டு விருப்பங்களை ஒப்பிட்டு, இப்போது எது சிறந்தது என்பதை தெரிந்துகொள்ள."
            : "Compare Option A vs Option B when you need a recommendation for a specific decision date."}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.5 }}>
          <strong>{lang === "ta" ? "What-If:" : "What-If:"}</strong>{" "}
          {lang === "ta"
            ? "ஒரே முடிவிற்கு வேறு தேதிகளை முயன்று, எந்த காலம் சிறந்தது என்பதை பார்க்க (Planning tab)."
            : "Simulate a single scenario across timing windows to find better periods (Planning tab)."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)", padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: W.surface, border: `1px solid ${W.borderLt}` }}>
        <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
              {t("decision_scenario", lang)}
            </label>
            <select
              style={fieldStyle}
              value={scenarioLabel}
              onChange={(e) => {
                const allOptions = SCENARIO_GROUPS.flatMap((g) => g.options);
                const found = allOptions.find((o) => o.en === e.target.value);
                if (found) {
                  setPriority(found.value);
                  setScenarioLabel(found.en);
                }
              }}
            >
              {SCENARIO_GROUPS.map((group) => (
                <optgroup key={group.groupEn} label={lang === "ta" ? group.groupTa : group.groupEn}>
                  {group.options.map((opt) => (
                    <option key={`${opt.value}-${opt.en}`} value={opt.en}>
                      {lang === "ta" ? opt.ta : opt.en}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
              {t("decision_target_date", lang)} *
            </label>
            <input style={fieldStyle} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
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
              style={{ ...fieldStyle, marginTop: "var(--space-1_5)", resize: "vertical" }}
              value={optionADescription}
              onChange={(e) => setOptionADescription(e.target.value)}
              rows={2}
              placeholder={lang === "ta" ? "விருப்பம் A விளக்கம்" : "Option A description"}
            />
          </div>

          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, marginBottom: "var(--space-1)", textTransform: "uppercase" }}>
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
              style={{ ...fieldStyle, marginTop: "var(--space-1_5)", resize: "vertical" }}
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
            padding: "var(--space-2) var(--space-4_5)",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${W.ink}`,
            cursor: loading || !isFormValid ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 700,
            background: loading || !isFormValid ? W.borderLt : W.ink,
            color: loading || !isFormValid ? W.mutedLt : W.surfaceMd,
          }}
        >
          {loading ? t("decision_analysing", lang) : t("decision_analyse", lang)}
        </button>
        {error && <p style={{ margin: 0, fontSize: "0.75rem", color: W.rust }}>{error}</p>}
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderRadius: "var(--radius-md)",
              background: W.card,
              border: `1px solid ${W.borderLt}`,
              display: "flex",
              gap: "var(--space-5)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>{t("decision_recommended", lang)}</p>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: verdictColor(result.recommended) }}>
                {result.recommended === "DEFER" ? t("decision_defer", lang) : result.recommended}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>{t("decision_confidence", lang)}</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: verdictColor(result.recommended) }}>{result.confidence}%</p>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase" }}>{t("decision_reasoning", lang)}</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.5 }}>{tLang(result.reasoning, lang)}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            {[
              { key: "A" as const, data: result.optionA, isRecommended: result.recommended === "A" },
              { key: "B" as const, data: result.optionB, isRecommended: result.recommended === "B" },
            ].map(({ key, data, isRecommended }) => {
              const isDefer = result.recommended === "DEFER";
              const accentColor = isRecommended ? W.sage : isDefer ? W.terracotta : W.rust;
              const bgColor = isRecommended ? "#EEF6EA" : isDefer ? W.surface : "#F9ECE7";
              const borderColor = isRecommended ? "rgba(92,118,84,0.3)" : isDefer ? W.borderLt : "rgba(168,72,47,0.2)";
              return (
                <div key={key} style={{ padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <div>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t(`decision_option_${key.toLowerCase()}` as Parameters<typeof t>[0], lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: W.inkMid }}>{data.label}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "var(--space-2)" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: accentColor, lineHeight: 1 }}>{data.score}</div>
                      <div style={{ fontSize: "0.625rem", color: W.muted, marginTop: "var(--space-0_5)" }}>/100</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "var(--space-2_5)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}>
                      {isRecommended
                        ? lang === "ta"
                          ? "Recommended"
                          : "Recommended"
                        : isDefer
                        ? lang === "ta"
                          ? "Defer"
                          : "Defer"
                        : lang === "ta"
                        ? "Weaker option"
                        : "Weaker option"}
                    </span>
                  </div>

                  {data.alignmentNotes.length > 0 && (
                    <div style={{ marginBottom: "var(--space-2)" }}>
                      <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: isRecommended ? W.sage : W.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {lang === "ta" ? (isRecommended ? "Why this is stronger" : "Limiting factors") : isRecommended ? "Why this is stronger" : "Limiting factors"}
                      </p>
                      <ul style={{ margin: 0, padding: "0 0 0 var(--space-3_5)" }}>
                        {data.alignmentNotes.map((note) => (
                          <li key={note} style={{ fontSize: "0.75rem", color: isRecommended ? W.inkMid : W.muted, lineHeight: 1.4, marginBottom: "var(--space-0_5)" }}>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.riskFactors.length > 0 && (
                    <div style={{ padding: "var(--space-1_5) var(--space-2)", borderRadius: "5px", background: "#F9ECE7", border: "1px solid rgba(168,72,47,0.2)", marginBottom: "var(--space-1_5)" }}>
                      <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: W.rust, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {lang === "ta" ? "Watch out for" : "Watch out for"}
                      </p>
                      {data.riskFactors.map((rf, i) => (
                        <p key={rf} style={{ margin: i > 0 ? "2px 0 0" : 0, fontSize: "0.75rem", color: W.rust, lineHeight: 1.4 }}>
                          ! {rf}
                        </p>
                      ))}
                    </div>
                  )}

                  {data.optimalWindow && (
                    <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.75rem", color: W.terracotta }}>
                      {t("decision_optimal_window", lang)}: {data.optimalWindow}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {result.caution && (
            <div style={{ padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: "#F9ECE7", border: "1px solid rgba(168,72,47,0.22)" }}>
              <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: W.rust, textTransform: "uppercase" }}>{t("decision_caution", lang)}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.inkMid, lineHeight: 1.5 }}>{tLang(result.caution, lang)}</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted }}>{t("decision_empty", lang)}</p>}
    </div>
  );
}

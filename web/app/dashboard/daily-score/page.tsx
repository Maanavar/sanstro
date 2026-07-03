"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, toQuery } from "@/lib/api";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { todayIso } from "@/lib/format";
import { scoreColor } from "@/lib/format";
import type { ApiEnvelope, BirthProfileSnapshot, DailyGuidanceData } from "@/lib/types";

type ProfileResponse = { data: BirthProfileSnapshot };

const SCORE_SIGNALS = [
  { key: "moonTransit",           max: 28, labelEn: "Moon transit",      labelTa: "சந்திர நகர்வு" },
  { key: "gocharSupport",         max: 24, labelEn: "Gochar transits",   labelTa: "கோசார கிரகங்கள்" },
  { key: "dashaSupport",          max: 19, labelEn: "Dasha support",     labelTa: "தசை ஆதரவு" },
  { key: "panchangam",            max: 14, labelEn: "Panchangam quality", labelTa: "பஞ்சாங்க தரம்" },
  { key: "personalCautions",      max:  9, labelEn: "Personal safety",   labelTa: "தனிப்பட்ட பாதுகாப்பு" },
  { key: "remedialActionSupport", max:  6, labelEn: "Remedial actions",  labelTa: "பரிகார உதவி" },
] as const;

const SIGNAL_DESC: Record<string, { en: string; ta: string }> = {
  moonTransit:           { en: "The Moon's position in your chart today. When the Moon transits a supportive house (e.g. 11th, 3rd) relative to your natal Moon sign, this score is high.", ta: "இன்று சந்திரன் உங்கள் ஜாதகத்தில் எந்த இடத்தில் இருக்கிறார். 11ஆம், 3ஆம் இடங்களில் இருக்கும்போது மதிப்பெண் அதிகம்." },
  dashaSupport:          { en: "Your current Mahadasha and Antardasha period quality. Jupiter and Venus dashas tend to score high; Saturn and Rahu periods are more variable.", ta: "நடப்பு மகாதசை மற்றும் அந்தர் தசையின் தரம். குரு, சுக்கிர தசைகள் பொதுவாக அதிக மதிப்பெண் பெறும்." },
  panchangam:            { en: "The inherent quality of today based on Tithi, Nakshatra, Yoga, and Karana — independent of your personal chart.", ta: "தினத்தின் பஞ்சாங்க தரம் — திதி, நட்சத்திரம், யோகம், கரணம் ஆகியவை அடிப்படையில்." },
  gocharSupport:         { en: "How today's planetary positions interact with the sensitive points in your birth chart (gochar influences).", ta: "இன்றைய கிரக நிலைகள் உங்கள் ஜாதகத்தின் முக்கிய இடங்களை எவ்வாறு பாதிக்கின்றன." },
  personalCautions:      { en: "Personal safety score (0–10). Starts high on clear days; drops when Saturn cycle (Ezhara Sani / Ashtama Sani), Chandrashtamam, or planetary combustion is active.", ta: "தனிப்பட்ட பாதுகாப்பு மதிப்பெண் (0–10). சனி சுழற்சி, சந்திராஷ்டமம் அல்லது கிரக அஸ்தமனம் இல்லாத நாளில் அதிகமாக இருக்கும்." },
  remedialActionSupport: { en: "Bonus points when you have completed remedial actions (pariharam) relevant to your chart.", ta: "உங்கள் ஜாதகத்திற்கு உரிய பரிகாரங்கள் செய்யும்போது கூடுதல் மதிப்பெண்." },
};

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="55" y="58" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "inherit", fontSize: "1.6rem", fontWeight: 800, fill: color }}>{score}</text>
      <text x="55" y="74" textAnchor="middle" style={{ fontFamily: "inherit", fontSize: "0.6rem", fill: "var(--text-secondary)" }}>/100</text>
    </svg>
  );
}

function BreakdownBar({ value, max, label, labelTa, desc, descTa, ta }: {
  value: number; max: number; label: string; labelTa: string;
  desc: string; descTa: string; ta: boolean;
}) {
  const pct = max > 0 ? Math.max(0, value) / max : 0;
  const isNegative = value < 0;
  const color = isNegative ? "var(--color-score-low, #A8482F)" : scoreColor(value >= 0 ? 70 : 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "14px", borderRadius: "10px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{ta ? labelTa : label}</span>
        <span style={{ fontWeight: 800, fontSize: "1rem", color: isNegative ? "var(--color-score-low, #A8482F)" : "var(--color-text)" }}>
          {value}
          {max > 0 && <span style={{ fontWeight: 400, fontSize: "0.72rem", color: "var(--text-secondary)", marginLeft: "2px" }}>/{max}</span>}
        </span>
      </div>
      {max > 0 && (
        <div style={{ height: "5px", borderRadius: "3px", background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "3px", width: `${Math.round(pct * 100)}%`, background: color, transition: "width 0.5s ease" }} />
        </div>
      )}
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
        {ta ? descTa : desc}
      </p>
    </div>
  );
}

export default function DailyScorePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [guidance, setGuidance] = useState<DailyGuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ta = lang === "ta";

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as Lang);

    void (async () => {
      try {
        // Fetch default profile to get chartId
        const profile = await apiFetchJson<ProfileResponse>("/api/v1/birth-profiles/me/latest");
        const chartId = profile.data.chartId;
        if (!chartId) throw new Error("No chart found. Please complete your birth profile.");

        // Fetch today's daily guidance
        const today = todayIso();
        const g = await apiFetchJson<ApiEnvelope<DailyGuidanceData>>(
          `/api/v1/charts/${chartId}/daily-guidance${toQuery({ date: today, language: "ta-en" })}`
        );
        setGuidance(g.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load score";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("not authenticated")) {
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const score = guidance?.score ?? 0;
  const breakdown = guidance?.scoreBreakdown;
  const today = todayIso();

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)", color: "var(--color-text)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--text-secondary)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← {ta ? "திரும்பு" : "Back"}
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {ta ? "இன்றைய மதிப்பெண்" : "Today's Score"}
            </h1>
            <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{today}</p>
          </div>
        </div>

        {loading && (
          <div style={{ height: "200px", borderRadius: "14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {ta ? "ஏற்றுகிறது…" : "Loading…"}
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", borderRadius: "10px", background: "var(--panel-warm-tint)", border: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {error}
          </div>
        )}

        {guidance && breakdown && (
          <>
            {/* Score hero */}
            <div style={{ padding: "28px 24px", borderRadius: "16px", background: "var(--panel-earth-dark)", color: "var(--panel-hover)", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
              <ScoreRing score={score} />
              <div style={{ flex: 1, minWidth: "160px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", opacity: 0.78, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {ta ? "பல சமிக்ஞை தினசரி மதிப்பெண்" : "Multi-signal daily score"}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700 }}>
                  {guidance.label}
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.8, lineHeight: 1.6 }}>
                  {ta ? guidance.text.ta : guidance.text.en}
                </p>
                {guidance.isChandrashtama && (
                  <p style={{ margin: "10px 0 0", fontSize: "0.75rem", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    ⚠ {ta ? "சந்திராஷ்டமம் செயல்பாட்டில் உள்ளது" : "Chandrashtamam active"}
                  </p>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "0.9rem" }}>
                {ta ? "மதிப்பெண் விவரம்" : "Score Breakdown"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {SCORE_SIGNALS.map((sig) => {
                  const value = breakdown[sig.key as keyof typeof breakdown] ?? 0;
                  const desc = SIGNAL_DESC[sig.key];
                  return (
                    <BreakdownBar
                      key={sig.key}
                      value={value}
                      max={sig.max}
                      label={sig.labelEn}
                      labelTa={sig.labelTa}
                      desc={desc?.en ?? ""}
                      descTa={desc?.ta ?? ""}
                      ta={ta}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action + caution */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "12px" }}>
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-score-high, #5C7654)", textTransform: "uppercase" }}>
                  {ta ? "நடவடிக்கை ஆலோசனை" : "Action suggestion"}
                </p>
                <p style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.6, color: "var(--color-text)" }}>
                  {ta ? guidance.actionSuggestion.ta : guidance.actionSuggestion.en}
                </p>
              </div>
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-score-low, #A8482F)", textTransform: "uppercase" }}>
                  {ta ? "எச்சரிக்கை ஆலோசனை" : "Caution suggestion"}
                </p>
                <p style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.6, color: "var(--color-text)" }}>
                  {ta ? guidance.cautionSuggestion.ta : guidance.cautionSuggestion.en}
                </p>
              </div>
            </div>

            {/* Remedy */}
            {(guidance.remedy.en || guidance.remedy.ta) && (
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--panel-warm-tint)", border: "1px solid var(--panel-golden, var(--color-border))" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, color: "var(--panel-earth, var(--color-text))", textTransform: "uppercase" }}>
                  {ta ? "பரிகாரம்" : "Remedy"}
                </p>
                <p style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.6 }}>
                  {ta ? guidance.remedy.ta : guidance.remedy.en}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

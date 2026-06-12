"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { AskVinaadiResponseData, ConfidenceTier, LifeMode } from "@/lib/types";
import { getChipsForMode } from "@/lib/ask-vinaadi-chips";
import { ConfidenceBadge } from "./dashboard-ui";

type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;

interface DailyStatus {
  chipsUsed: number;
  chipsRemaining: number | null;
  isPremium: boolean;
  dailyLimit: number;
}

interface DashboardAskVinaadiProps {
  lang: Lang;
  chartId: string | null;
  goalTrack?: GoalTrack;
  activeLifeMode?: LifeMode;
  onUpgrade?: () => void;
}

const SUGGESTED_QUESTIONS: Record<NonNullable<GoalTrack> | "DEFAULT", { ta: string; en: string }[]> = {
  CAREER: [
    { ta: "இந்த வாரம் தொழிலுக்கு எப்படி?", en: "How is this week for my career?" },
    { ta: "புதிய வேலைக்கு நல்ல நேரம் எது?", en: "When is a good time to start a new job?" },
  ],
  EXAM: [
    { ta: "படிப்பில் கவனம் அதிகரிக்க நல்ல நேரம் எது?", en: "When is a good time to focus on studies?" },
    { ta: "தேர்வில் வெற்றி பெற என்ன செய்யலாம்?", en: "What does my chart say about exam success?" },
  ],
  RELATIONSHIP: [
    { ta: "இந்த மாதம் உறவில் எப்படி?", en: "How is this month for relationships?" },
    { ta: "குடும்ப நல்லிணக்கம் எப்போது வரும்?", en: "When will family harmony improve?" },
  ],
  FINANCIAL: [
    { ta: "இந்த மாதம் பணவரவு எப்படி?", en: "How is this month for finances?" },
    { ta: "முதலீட்டிற்கு நல்ல நேரம் எது?", en: "When is a good time for investments?" },
  ],
  DEFAULT: [
    { ta: "இன்று எனக்கு எப்படி?", en: "How does today look for me?" },
    { ta: "இந்த வாரம் என்ன கவனிக்க வேண்டும்?", en: "What should I be mindful of this week?" },
  ],
};

function SignalChip({ signal }: { signal: string }) {
  return <span style={{ display: "inline-block", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(184,90,44,0.12)", color: "var(--color-accent, #B85A2C)", margin: "2px 3px", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>{signal}</span>;
}

function QuotaBar({ used, limit, lang }: { used: number; limit: number; lang: Lang }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? "var(--color-score-low, #A8482F)" : pct >= 60 ? "var(--color-score-mid, #B85A2C)" : "var(--color-score-high, #5C7654)";
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ fontSize: "12px", color: "var(--color-faint)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
        <span>{lang === "ta" ? `இன்று ${used} / ${limit} கேள்விகள் பயன்படுத்தப்பட்டன` : `${used} of ${limit} questions used today`}</span>
      </div>
      <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "2px", transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

function AnswerCard({ entry, lang }: { entry: { question: string; data: AskVinaadiResponseData }; lang: Lang }) {
  const { question, data } = entry;
  return (
    <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
        <p style={{ fontSize: "13px", color: "var(--color-faint)", margin: 0, fontStyle: "italic" }}>{question}</p>
        <ConfidenceBadge level={data.confidence as ConfidenceTier} reason={{ ta: "", en: data.confidence }} lang={lang} />
      </div>
      <p style={{ fontSize: "15px", lineHeight: "1.65", margin: "0 0 10px 0", color: "var(--color-text, #3D352B)" }}>{lang === "ta" ? data.answer.ta : data.answer.en}</p>
      {data.caveat && <p style={{ fontSize: "12px", color: "var(--color-muted, #675b4b)", margin: "0 0 10px 0", padding: "8px 10px", borderLeft: "3px solid var(--color-score-low, #A8482F)", borderRadius: "0 4px 4px 0" }}>⚠ {lang === "ta" ? data.caveat.ta : data.caveat.en}</p>}
      <div style={{ marginTop: "8px" }}>{data.signalsUsed.map((s) => <SignalChip key={s} signal={s} />)}</div>
    </div>
  );
}

export function DashboardAskVinaadi({ lang, chartId, goalTrack, activeLifeMode = "BALANCED", onUpgrade }: DashboardAskVinaadiProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; data: AskVinaadiResponseData }>>([]);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Feature 3 — daily chip status (free users get a limited number per day).
  useEffect(() => {
    apiFetchJson<DailyStatus>("/api/v1/ask-vinaadi/daily-status")
      .then(setStatus)
      .catch(() => {});
  }, []);

  const isPremium = status?.isPremium ?? false;
  const chipsRemaining = status?.chipsRemaining ?? null;
  const limitReached = !isPremium && chipsRemaining !== null && chipsRemaining <= 0;

  const modeChips = getChipsForMode(activeLifeMode);
  const suggestions = SUGGESTED_QUESTIONS[goalTrack ?? "DEFAULT"];

  function goUpgrade() {
    if (onUpgrade) onUpgrade();
    else if (typeof window !== "undefined") window.location.href = "/#pricing";
  }

  async function submit(q: string, isChip = false) {
    if (!chartId || !q.trim() || loading) return;
    const trimmed = q.trim();
    if (trimmed.length > 500) {
      setError(lang === "ta" ? "கேள்வி 500 எழுத்துகளுக்குள் இருக்க வேண்டும்." : "Question must be under 500 characters.");
      return;
    }
    // Free-tier daily limit — show the upgrade interstitial instead of asking.
    if (limitReached) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const json = await apiFetchJson<{ success: boolean; data: AskVinaadiResponseData }>(`/api/v1/charts/${chartId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, lang, isChipQuestion: isChip }),
      });
      const data = json.data;
      setHistory((prev) => [{ question: trimmed, data }, ...prev]);
      setQuota({ used: data.questionsUsedToday, limit: data.dailyLimit });
      if (data.chipsRemaining !== null && data.chipsRemaining !== undefined) {
        setStatus((prev) => (prev ? { ...prev, chipsRemaining: data.chipsRemaining ?? prev.chipsRemaining } : prev));
      }
      setQuestion("");
    } catch (e) {
      const msg = String((e as Error)?.message ?? "");
      if (msg.includes("429") || msg.includes("DAILY_LIMIT_REACHED")) {
        setStatus((prev) => (prev ? { ...prev, chipsRemaining: 0 } : prev));
        setShowUpgrade(true);
      } else {
        setError(lang === "ta" ? "பதில் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Could not get a response. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!chartId) return null;

  return (
    <div style={{ borderRadius: "16px", background: "var(--color-surface, #FFFFFF)", border: "1px solid var(--color-border, #E4DBC8)", padding: "20px", marginTop: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "20px" }}>✨</span>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--color-text, #3D352B)" }}>{lang === "ta" ? "வினாடி கேளுங்கள்" : "Ask Vinaadi"}</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted, #675b4b)" }}>{lang === "ta" ? "உங்கள் ஜாதகம் சார்ந்த கேள்விகளை கேளுங்கள்" : "Ask natural-language questions about your chart"}</p>
        </div>
      </div>

      {!isPremium && chipsRemaining !== null && (
        <p style={{ fontSize: "12px", color: chipsRemaining > 0 ? "var(--color-muted, #675b4b)" : "var(--color-score-low, #A8482F)", margin: "0 0 10px", fontWeight: 600 }}>
          {chipsRemaining > 0
            ? (lang === "ta" ? `இன்று ${chipsRemaining} கேள்விகள் மீதம்` : `${chipsRemaining} question${chipsRemaining === 1 ? "" : "s"} left today`)
            : (lang === "ta" ? "இன்றைய இலவச கேள்விகள் முடிந்தன" : "You've used today's free questions")}
        </p>
      )}

      {history.length === 0 && (
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: "var(--color-muted, #675b4b)", marginBottom: "8px" }}>{lang === "ta" ? "விரைவு கேள்விகள்:" : "Quick questions:"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {modeChips.map((s, i) => (
              <button
                key={`chip-${i}`}
                disabled={limitReached}
                onClick={() => void submit(lang === "ta" ? s.ta : s.en, true)}
                style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(184,90,44,0.35)", background: limitReached ? "rgba(184,90,44,0.05)" : "rgba(184,90,44,0.12)", color: "var(--color-accent, #B85A2C)", cursor: limitReached ? "not-allowed" : "pointer", opacity: limitReached ? 0.5 : 1 }}
              >
                {lang === "ta" ? s.ta : s.en}
              </button>
            ))}
            {suggestions.map((s, i) => (
              <button key={`sug-${i}`} onClick={() => { setQuestion(lang === "ta" ? s.ta : s.en); setTimeout(() => inputRef.current?.focus(), 50); }} style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "20px", border: "1px solid var(--color-border, #E4DBC8)", background: "transparent", color: "var(--color-muted, #675b4b)", cursor: "pointer" }}>
                {lang === "ta" ? s.ta : s.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {showUpgrade && (
        <div style={{ borderRadius: "12px", background: "rgba(184,90,44,0.08)", border: "1px solid rgba(184,90,44,0.3)", padding: "16px", marginBottom: "14px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.5, color: "var(--color-text, #3D352B)" }}>
            {lang === "ta"
              ? "இன்று உங்கள் 3 இலவச கேள்விகளைப் பயன்படுத்திவிட்டீர்கள். வரம்பற்ற தினசரி வழிகாட்டுதலுக்கு மேம்படுத்துங்கள்."
              : "You've used your 3 free questions today. Upgrade for unlimited daily guidance."}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={goUpgrade} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "var(--color-accent, #B85A2C)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {lang === "ta" ? "மேம்படுத்து" : "Upgrade"}
            </button>
            <button onClick={() => setShowUpgrade(false)} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--color-border, #E4DBC8)", background: "transparent", color: "var(--color-muted, #675b4b)", fontSize: "13px", cursor: "pointer" }}>
              {lang === "ta" ? "நாளை முயற்சிக்கவும்" : "Try again tomorrow"}
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit(question);
            }
          }}
          placeholder={lang === "ta" ? "உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்…" : "Type your question here…"}
          disabled={loading || limitReached}
          rows={2}
          maxLength={500}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 80px 10px 14px", borderRadius: "10px", border: "1px solid var(--color-border, #E4DBC8)", background: "var(--color-surface-soft, #FAF5EA)", color: "var(--color-text, #3D352B)", fontSize: "14px", resize: "vertical", outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={() => void submit(question)} disabled={loading || !question.trim() || limitReached} style={{ position: "absolute", right: "8px", bottom: "8px", padding: "6px 14px", borderRadius: "8px", border: "none", background: loading ? "var(--color-faint, #7A6F5E)" : "var(--color-accent, #B85A2C)", color: "var(--color-on-accent, #fff)", fontSize: "13px", cursor: loading ? "wait" : "pointer" }}>
          {loading ? "…" : (lang === "ta" ? "கேள்" : "Ask")}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
        <span style={{ fontSize: "11px", color: "var(--color-faint, #7A6F5E)" }}>{question.length}/500</span>
        {quota && <QuotaBar used={quota.used} limit={quota.limit} lang={lang} />}
      </div>

      {error && <p style={{ fontSize: "13px", color: "#f87171", marginTop: "8px", padding: "8px 12px", background: "rgba(248,113,113,0.08)", borderRadius: "8px" }}>{error}</p>}

      {history.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          {history.map((entry, i) => <AnswerCard key={i} entry={entry} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { AskVinaadiResponseData, ConfidenceTier } from "@/lib/types";
import { ConfidenceBadge } from "./dashboard-ui";

type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;

interface DashboardAskVinaadiProps {
  lang: Lang;
  chartId: string | null;
  goalTrack?: GoalTrack;
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
  return <span style={{ display: "inline-block", fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", margin: "2px 3px", fontFamily: "monospace", letterSpacing: "0.02em" }}>{signal}</span>;
}

function QuotaBar({ used, limit, lang }: { used: number; limit: number; lang: Lang }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? "#f87171" : pct >= 60 ? "#facc15" : "#4ade80";
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
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
        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{question}</p>
        <ConfidenceBadge level={data.confidence as ConfidenceTier} reason={{ ta: "", en: data.confidence }} lang={lang} />
      </div>
      <p style={{ fontSize: "15px", lineHeight: "1.65", margin: "0 0 10px 0", color: "#e2e8f0" }}>{lang === "ta" ? data.answer.ta : data.answer.en}</p>
      {data.caveat && <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px 0", padding: "8px 10px", borderLeft: "3px solid #334155", borderRadius: "0 4px 4px 0" }}>⚠ {lang === "ta" ? data.caveat.ta : data.caveat.en}</p>}
      <div style={{ marginTop: "8px" }}>{data.signalsUsed.map((s) => <SignalChip key={s} signal={s} />)}</div>
    </div>
  );
}

export function DashboardAskVinaadi({ lang, chartId, goalTrack }: DashboardAskVinaadiProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; data: AskVinaadiResponseData }>>([]);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = SUGGESTED_QUESTIONS[goalTrack ?? "DEFAULT"];

  async function submit(q: string) {
    if (!chartId || !q.trim() || loading) return;
    const trimmed = q.trim();
    if (trimmed.length > 500) {
      setError(lang === "ta" ? "கேள்வி 500 எழுத்துகளுக்குள் இருக்க வேண்டும்." : "Question must be under 500 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const json = await apiFetchJson<{ success: boolean; data: AskVinaadiResponseData }>(`/api/v1/charts/${chartId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, lang }),
      });
      const data = json.data;
      setHistory((prev) => [{ question: trimmed, data }, ...prev]);
      setQuota({ used: data.questionsUsedToday, limit: data.dailyLimit });
      setQuestion("");
    } catch {
      setError(lang === "ta" ? "பதில் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Could not get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!chartId) return null;

  return (
    <div style={{ borderRadius: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", padding: "20px", marginTop: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "20px" }}>✨</span>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#e2e8f0" }}>{lang === "ta" ? "வினாடி கேளுங்கள்" : "Ask Vinaadi"}</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{lang === "ta" ? "உங்கள் ஜாதகம் சார்ந்த கேள்விகளை கேளுங்கள்" : "Ask natural-language questions about your chart"}</p>
        </div>
      </div>

      {history.length === 0 && (
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>{lang === "ta" ? "பரிந்துரைக்கப்பட்ட கேள்விகள்:" : "Suggested questions:"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setQuestion(lang === "ta" ? s.ta : s.en); setTimeout(() => inputRef.current?.focus(), 50); }} style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", cursor: "pointer" }}>
                {lang === "ta" ? s.ta : s.en}
              </button>
            ))}
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
          disabled={loading || (quota !== null && quota.used >= quota.limit)}
          rows={2}
          maxLength={500}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 80px 10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "14px", resize: "vertical", outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={() => void submit(question)} disabled={loading || !question.trim() || (quota !== null && quota.used >= quota.limit)} style={{ position: "absolute", right: "8px", bottom: "8px", padding: "6px 14px", borderRadius: "8px", border: "none", background: loading ? "#334155" : "rgba(99,102,241,0.8)", color: "var(--color-on-accent, #fff)", fontSize: "13px", cursor: loading ? "wait" : "pointer" }}>
          {loading ? "…" : (lang === "ta" ? "கேள்" : "Ask")}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
        <span style={{ fontSize: "11px", color: "#475569" }}>{question.length}/500</span>
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

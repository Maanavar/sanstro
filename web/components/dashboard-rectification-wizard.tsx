"use client";

import { useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

interface RectificationEvent {
  eventType: "MARRIAGE" | "CAREER_BREAK" | "RELOCATION" | "HEALTH_MAJOR" | "PARENT_BIRTH";
  eventYear: number;
  eventMonth?: number;
}

interface CandidateWindow {
  timeLocal: string;
  lagnaRasi: number;
  lagnaRasiName: string;
  probabilityWeight: number;
  matchingEvents: number;
}

interface RectificationResult {
  candidates: CandidateWindow[];
  recommendedTime: string;
  confidenceNote: string;
  disclaimer: string;
}

interface Props {
  lang: Lang;
  birthProfileId: string;
  onApply: (time: string) => void;
  onClose: () => void;
}

const EVENT_QUESTIONS: Array<{
  key: RectificationEvent["eventType"];
  labelEn: string;
  labelTa: string;
  hintEn: string;
  hintTa: string;
}> = [
  {
    key: "MARRIAGE",
    labelEn: "Year you got married (or first major relationship)",
    labelTa: "திருமணம் (அல்லது முதல் முக்கிய உறவு) நடந்த ஆண்டு",
    hintEn: "Leave blank if not applicable",
    hintTa: "பொருந்தவில்லை என்றால் காலியாக விடவும்",
  },
  {
    key: "CAREER_BREAK",
    labelEn: "Year of a major career change or job loss",
    labelTa: "முக்கிய தொழில் மாற்றம் அல்லது வேலை இழந்த ஆண்டு",
    hintEn: "Leave blank if not applicable",
    hintTa: "பொருந்தவில்லை என்றால் காலியாக விடவும்",
  },
  {
    key: "RELOCATION",
    labelEn: "Year you moved city or country",
    labelTa: "நகரம் அல்லது நாடு மாறிய ஆண்டு",
    hintEn: "Leave blank if not applicable",
    hintTa: "பொருந்தவில்லை என்றால் காலியாக விடவும்",
  },
  {
    key: "HEALTH_MAJOR",
    labelEn: "Year of a major health event or surgery",
    labelTa: "முக்கிய உடல்நல நிகழ்வு அல்லது அறுவை சிகிச்சை நடந்த ஆண்டு",
    hintEn: "Leave blank if not applicable",
    hintTa: "பொருந்தவில்லை என்றால் காலியாக விடவும்",
  },
  {
    key: "PARENT_BIRTH",
    labelEn: "Your mother's birth year",
    labelTa: "உங்கள் அம்மாவின் பிறந்த ஆண்டு",
    hintEn: "Leave blank if unknown",
    hintTa: "தெரியாவிட்டால் காலியாக விடவும்",
  },
];

type Step = "questions" | "results" | "applied";

export function RectificationWizard({ lang, birthProfileId, onApply, onClose }: Props) {
  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RectificationResult | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const handleSubmit = async () => {
    const events: RectificationEvent[] = [];
    for (const q of EVENT_QUESTIONS) {
      const val = answers[q.key]?.trim();
      if (val) {
        const yr = parseInt(val, 10);
        if (yr >= 1900 && yr <= 2100) {
          events.push({ eventType: q.key, eventYear: yr });
        }
      }
    }
    if (events.length === 0) {
      setError(lang === "ta" ? "குறைந்தது ஒரு நிகழ்வு தேவை." : "At least one event is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = await apiFetchJson<{ success: boolean; data: RectificationResult }>(`/api/v1/birth-profiles/${birthProfileId}/rectify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      setResult(body.data);
      setSelectedTime(body.data.recommendedTime);
      setStep("results");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTime) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetchJson(`/api/v1/birth-profiles/${birthProfileId}/rectify/apply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTime }),
      });
      setStep("applied");
      onApply(selectedTime);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rectification-wizard-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rectification-wizard-modal">
        <button className="rectification-wizard-close" onClick={onClose}>✕</button>

        <h2 className="rectification-wizard-title">
          {lang === "ta" ? "பிறந்த நேரம் கண்டுபிடி" : "Find Your Birth Time"}
        </h2>

        <p className="rectification-wizard-subtitle">
          {lang === "ta"
            ? "உங்கள் வாழ்க்கை நிகழ்வுகளின் அடிப்படையில் தோராயமான பிறந்த நேரம் கண்டுபிடிக்கப்படும்."
            : "We'll estimate your birth time using your life events. This is a heuristic — not classical rectification."}
        </p>

        {step === "questions" && (
          <div className="rectification-questions">
            {EVENT_QUESTIONS.map((q) => (
              <div key={q.key} className="rectification-question">
                <label className="rectification-question-label">
                  {lang === "ta" ? q.labelTa : q.labelEn}
                  <span className="rectification-question-hint">
                    &nbsp;({lang === "ta" ? q.hintTa : q.hintEn})
                  </span>
                </label>
                <input
                  className="input"
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder={lang === "ta" ? "ஆண்டு" : "Year"}
                  value={answers[q.key] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                />
              </div>
            ))}

            {error && <p className="rectification-error">{error}</p>}

            <div className="rectification-actions">
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                {lang === "ta" ? "ரத்து" : "Cancel"}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? (lang === "ta" ? "கணக்கிடுகிறது..." : "Calculating...")
                  : (lang === "ta" ? "நேரம் கண்டுபிடி" : "Find Time")}
              </button>
            </div>
          </div>
        )}

        {step === "results" && result && (
          <div className="rectification-results">
            <p className="rectification-confidence-note">{result.confidenceNote}</p>

            <div className="rectification-candidates">
              {result.candidates.map((c, i) => (
                <button
                  key={i}
                  className={`rectification-candidate${selectedTime === c.timeLocal ? " selected" : ""}`}
                  onClick={() => setSelectedTime(c.timeLocal)}
                >
                  <span className="rectification-candidate-time">{c.timeLocal}</span>
                  <span className="rectification-candidate-lagna">
                    {lang === "ta" ? `லக்னம்: ${c.lagnaRasiName}` : `Lagna: ${c.lagnaRasiName}`}
                  </span>
                  <span className="rectification-candidate-score">
                    {c.matchingEvents} {lang === "ta" ? "நிகழ்வு பொருத்தம்" : "event match(es)"}
                  </span>
                  {i === 0 && (
                    <span className="rectification-recommended-badge">
                      {lang === "ta" ? "பரிந்துரை" : "Recommended"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p className="rectification-disclaimer">{result.disclaimer}</p>

            {error && <p className="rectification-error">{error}</p>}

            <div className="rectification-actions">
              <button className="btn btn-secondary" onClick={() => setStep("questions")} disabled={loading}>
                {lang === "ta" ? "திரும்பு" : "Back"}
              </button>
              <button className="btn btn-primary" onClick={handleApply} disabled={loading || !selectedTime}>
                {loading
                  ? (lang === "ta" ? "சேமிக்கிறது..." : "Saving...")
                  : (lang === "ta" ? `${selectedTime} நேரமாக அமை` : `Set time to ${selectedTime}`)}
              </button>
            </div>
          </div>
        )}

        {step === "applied" && (
          <div className="rectification-applied">
            <p className="rectification-success">
              {lang === "ta"
                ? `பிறந்த நேரம் ${selectedTime} ஆக அமைக்கப்பட்டது.`
                : `Birth time set to ${selectedTime}.`}
            </p>
            <p className="rectification-disclaimer">
              {lang === "ta"
                ? "லக்னம் சார்ந்த விளக்கங்கள் ±1 ராசி மாறுபடலாம்."
                : "Lagna-dependent interpretations may vary by ±1 rasi."}
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              {lang === "ta" ? "மூடு" : "Close"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

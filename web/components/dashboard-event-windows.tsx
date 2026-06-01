"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { EventWindowItem } from "@/lib/types";

type EventType = "MARRIAGE" | "CAREER" | "FINANCE";

type EventWindowsProps = {
  lang: Lang;
  chartId: string;
};

const EVENT_LABELS: Record<EventType, { ta: string; en: string }> = {
  MARRIAGE: { ta: "திருமணம்", en: "Marriage" },
  CAREER: { ta: "தொழில்", en: "Career" },
  FINANCE: { ta: "நிதி", en: "Finance" },
};

function scoreTone(score: number) {
  if (score >= 65) return { color: "var(--color-score-high)", bg: "rgba(92,118,84,0.15)" };
  if (score >= 45) return { color: "var(--color-score-mid)", bg: "rgba(184,90,44,0.15)" };
  return { color: "var(--color-score-low)", bg: "rgba(168,72,47,0.15)" };
}

export function EventWindowsPanel({ lang, chartId }: EventWindowsProps) {
  const [event, setEvent] = useState<EventType>("MARRIAGE");
  const [windows, setWindows] = useState<EventWindowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();

  async function load(evt: EventType) {
    setLoading(true);
    setError("");
    setEvent(evt);
    try {
      const res = await apiFetchJson<{ data: { windows: EventWindowItem[] } }>(
        `/api/v1/charts/${chartId}/event-windows?event=${evt}&fromYear=${currentYear}&toYear=${currentYear + 20}`
      );
      setWindows(res.data?.windows ?? []);
    } catch (err) {
      setWindows([]);
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {(["MARRIAGE", "CAREER", "FINANCE"] as EventType[]).map((evt) => (
          <button
            key={evt}
            type="button"
            onClick={() => void load(evt)}
            style={{
              padding: "var(--space-1_5) var(--space-3)",
              borderRadius: "var(--radius-pill)",
              border: `1px solid ${event === evt ? "var(--color-accent)" : "var(--color-border)"}`,
              background: event === evt ? "var(--color-accent)" : "var(--color-surface)",
              color: event === evt ? "var(--color-surface)" : "var(--color-text)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tLang(EVENT_LABELS[evt], lang)}
          </button>
        ))}
      </div>

      {!loaded && (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "மேலே ஒரு வகையைத் தேர்ந்தெடுக்கவும்." : "Select an event type above."}
        </p>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-score-low)" }}>
          {error}
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "கணக்கிடுகிறோம்..." : "Calculating..."}
        </p>
      )}

      {!loading && loaded && windows.length === 0 && (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "குறிப்பிடத்தக்க நேரங்கள் இல்லை." : "No notable windows in this range."}
        </p>
      )}

      {!loading &&
        windows.map((w, i) => {
          const tone = scoreTone(w.score);
          return (
            <div
              key={`${w.start_date}-${w.end_date}-${i}`}
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                padding: "var(--space-3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {w.start_date} - {w.end_date}
                </p>
                <span
                  style={{
                    padding: "var(--space-0_5) var(--space-2)",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--color-border)",
                    background: tone.bg,
                    color: tone.color,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {w.score}/100
                </span>
              </div>
              {w.reasons.length > 0 && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  {w.reasons.map((r, idx) => (
                    <p key={`${r}-${idx}`} style={{ margin: "var(--space-0_5) 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      · {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

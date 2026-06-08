"use client";

import { useEffect, useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { EventWindowItem } from "@/lib/types";

type EventType = "MARRIAGE" | "CAREER" | "FINANCE";

type EventWindowsProps = {
  lang: Lang;
  chartId: string;
  isMarried?: boolean;
  /** Restrict the panel to a single event type (hides the type tabs). */
  onlyEvent?: EventType;
  /** Auto-load windows on mount instead of waiting for a tab click. */
  autoLoad?: boolean;
};

const EVENT_LABELS: Record<EventType, { ta: string; en: string }> = {
  MARRIAGE: { ta: "திருமணம்", en: "Marriage" },
  CAREER: { ta: "தொழில்", en: "Career" },
  FINANCE: { ta: "நிதி", en: "Finance" },
};

// For already-married users the 7th-house windows still matter, but they mean
// relationship renewal / harmony rather than a wedding. Relabel accordingly.
const MARRIED_MARRIAGE_LABEL = { ta: "உறவு & இணக்கம்", en: "Relationship & Harmony" };

// Humanise the raw engine reason codes — users should never see tokens like
// `7th_lord_dasha_active`.
const REASON_LABELS: Record<string, { ta: string; en: string }> = {
  "7th_lord_dasha_active": { ta: "தசை: உறவு/திருமணத்தை குறிக்கும் 7-ம் வீட்டு அதிபதி செயல்படுகிறார்", en: "Dasha: the 7th-house lord for marriage/partnership is active" },
  venus_dasha_active: { ta: "தசை: உறவு/திருமண காரகனான சுக்கிரன் செயல்படுகிறார்", en: "Dasha: Venus, the marriage/relationship significator, is active" },
  jupiter_supports_7th: { ta: "கோசாரம்: குரு 7-ம் வீட்டை பார்க்கிறார் அல்லது அங்கே இருக்கிறார்", en: "Transit: Jupiter occupies or aspects the 7th house" },
  venus_transits_7th: { ta: "குறுகிய கோசாரம்: சுக்கிரன் 7-ம் வீட்டில் இருக்கிறார்", en: "Short-term transit: Venus is in the 7th house" },
  "10th_lord_dasha_active": { ta: "தசை: தொழிலை குறிக்கும் 10-ம் வீட்டு அதிபதி செயல்படுகிறார்", en: "Dasha: the 10th-house lord for career is active" },
  sun_dasha_active: { ta: "தசை: பதவி/அதிகார காரகனான சூரியன் செயல்படுகிறார்", en: "Dasha: Sun, a status/career significator, is active" },
  mercury_dasha_active: { ta: "தசை: வேலை/வாணிப திறனை குறிக்கும் புதன் செயல்படுகிறார்", en: "Dasha: Mercury, a work/business significator, is active" },
  jupiter_supports_10th: { ta: "கோசாரம்: குரு 10-ம் வீட்டை பார்க்கிறார் அல்லது அங்கே இருக்கிறார்", en: "Transit: Jupiter occupies or aspects the 10th house" },
  sun_transits_10th: { ta: "குறுகிய கோசாரம்: சூரியன் 10-ம் வீட்டில் இருக்கிறார்", en: "Short-term transit: Sun is in the 10th house" },
  "2nd_lord_dasha_active": { ta: "தசை: வருமானம்/சேமிப்பை குறிக்கும் 2-ம் வீட்டு அதிபதி செயல்படுகிறார்", en: "Dasha: the 2nd-house lord for income/savings is active" },
  "11th_lord_dasha_active": { ta: "தசை: லாபத்தை குறிக்கும் 11-ம் வீட்டு அதிபதி செயல்படுகிறார்", en: "Dasha: the 11th-house lord for gains is active" },
  jupiter_dasha_active: { ta: "தசை: செல்வ காரகனான குரு செயல்படுகிறார்", en: "Dasha: Jupiter, a wealth significator, is active" },
  jupiter_supports_2nd: { ta: "கோசாரம்: குரு 2-ம் வீட்டை ஆதரிக்கிறார்", en: "Transit: Jupiter supports the 2nd house of income/savings" },
  jupiter_supports_11th: { ta: "கோசாரம்: குரு 11-ம் வீட்டை ஆதரிக்கிறார்", en: "Transit: Jupiter supports the 11th house of gains" },
};

function humaniseReason(code: string, lang: Lang): string {
  const m = REASON_LABELS[code];
  if (m) return tLang(m, lang);
  // Fallback: turn snake_case into readable words rather than showing the token.
  return code.replace(/_/g, " ");
}

function scoreTone(score: number) {
  if (score >= 65) return { color: "var(--color-score-high)", bg: "rgba(92,118,84,0.15)" };
  if (score >= 45) return { color: "var(--color-score-mid)", bg: "rgba(184,90,44,0.15)" };
  return { color: "var(--color-score-low)", bg: "rgba(168,72,47,0.15)" };
}

export function EventWindowsPanel({ lang, chartId, isMarried = false, onlyEvent, autoLoad = false }: EventWindowsProps) {
  const eventLabel = (evt: EventType) =>
    evt === "MARRIAGE" && isMarried ? tLang(MARRIED_MARRIAGE_LABEL, lang) : tLang(EVENT_LABELS[evt], lang);
  const [event, setEvent] = useState<EventType>(onlyEvent ?? "MARRIAGE");
  const [windows, setWindows] = useState<EventWindowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();
  const eventTabs: EventType[] = onlyEvent ? [onlyEvent] : ["MARRIAGE", "CAREER", "FINANCE"];

  // Auto-load on mount / when the locked event or chart changes.
  useEffect(() => {
    if (autoLoad && chartId) void load(onlyEvent ?? event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, chartId, onlyEvent]);

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
      <div style={{ display: onlyEvent ? "none" : "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {eventTabs.map((evt) => (
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
            {eventLabel(evt)}
          </button>
        ))}
      </div>

      {event === "MARRIAGE" && isMarried && loaded && (
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "நீங்கள் ஏற்கனவே திருமணமானவர் — கீழே உள்ள நேரங்கள் உறவில் இணக்கம், புதுப்பித்தல் மற்றும் முக்கிய குடும்ப முடிவுகளுக்கான ஆதரவான காலங்களைக் குறிக்கின்றன."
            : "You're already married — the windows below indicate supportive periods for relationship harmony, renewal, and major shared decisions (not a new wedding)."}
        </p>
      )}

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

      {!loading && loaded && windows.length > 0 && (
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.72rem", color: "var(--color-muted)", lineHeight: 1.5, padding: "var(--space-1_5) var(--space-2_5)", borderRadius: "var(--radius-sm)", background: "rgba(122,111,94,0.07)", border: "1px solid rgba(122,111,94,0.15)" }}>
          {lang === "ta"
            ? "இந்த சாளரம் தசை மற்றும் கோசார ஆதரவு சேரும் போது மட்டும் தோன்றும். இது திட்டமிட உதவும் சிக்னல்; நிகழ்வு உறுதி அல்ல. சூரியன்/சுக்கிரன் போன்ற வேகமான கோள்கள் அந்த பெரிய சாளரத்துக்குள் குறுகிய தூண்டுதலாக மட்டும் படிக்கப்பட வேண்டும்."
            : "A window appears when dasha timing and transit support overlap. Treat it as a planning signal, not a guaranteed event. Fast Sun/Venus signals are short-term triggers inside the wider window."}
        </p>
      )}

      {!loading &&
        windows.map((w, i) => {
          const tone = scoreTone(w.score);
          const fmt = (d: string) => {
            if (!d) return "";
            try {
              return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            } catch { return d; }
          };
          return (
            <div
              key={`${w.startDate}-${w.endDate}-${i}`}
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                padding: "var(--space-3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {fmt(w.startDate)} – {fmt(w.endDate)}
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
                      · {humaniseReason(r, lang)}
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

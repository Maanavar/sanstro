"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import {
  getPropensities,
  type PropensityBundle,
  type PropensityCard,
  type PropensityCategory,
} from "@vinaadi/shared/api/propensities";
import { CollapsibleSection } from "./collapsible-section";

/**
 * "Chances & Cautions" — the life-propensity panel (a Life Areas sub-panel).
 * Additive, self-fetching (same pattern as the Shadbala/Yogini deep-dive
 * panels), consuming the shared `getPropensities` wrapper. Backend is gated
 * by the `propensity_insights` flag (404 → graceful "being finalised").
 *
 * Doctrine, mirrored from app/reasoning: levels are ORDINAL, never a
 * percentage; a QUIET card is silence, not denial; caution cards read as
 * "be mindful", never as doom, and always carry their disclaimer +
 * (for wellbeing) a reach-out block.
 */

const W = {
  ink: "var(--deepdive-ink, var(--panel-earth-dark))",
  muted: "var(--color-faint)",
  border: "var(--deepdive-border, var(--panel-tan))",
  borderLt: "var(--deepdive-border-light, var(--panel-tan-light))",
  surface: "var(--deepdive-surface, var(--panel-cream))",
  surfaceMd: "var(--deepdive-surface-strong, var(--panel-hover))",
  good: "#2E7D32",
  warn: "#B8860B",
  care: "var(--deepdive-accent, var(--panel-brand))",
  info: "#3A6EA5",
} as const;

const CATEGORY_ORDER: PropensityCategory[] = [
  "RELATIONSHIPS",
  "MARRIAGE",
  "EDUCATION",
  "CAREER",
  "WEALTH",
  "LIFE_PATH",
  "WELLBEING",
];

const CATEGORY_LABEL: Record<PropensityCategory, { en: string; ta: string }> = {
  RELATIONSHIPS: { en: "Love & Relationships", ta: "காதல் & உறவுகள்" },
  MARRIAGE: { en: "Marriage & Partnership", ta: "திருமணம் & கூட்டாண்மை" },
  EDUCATION: { en: "Education", ta: "கல்வி" },
  CAREER: { en: "Career & Work", ta: "தொழில் & வேலை" },
  WEALTH: { en: "Wealth", ta: "செல்வம்" },
  LIFE_PATH: { en: "Life Path", ta: "வாழ்க்கை பாதை" },
  WELLBEING: { en: "Wellbeing & Temperament", ta: "நலம் & இயல்பு" },
};

// Level → { label, tone }. Tone drives the chip colour. Kept soft on purpose.
const LEVEL_META: Record<string, { en: string; ta: string; tone: keyof typeof TONES }> = {
  // CHANCE
  STRONG: { en: "Strong", ta: "வலு", tone: "good" },
  PROMISING: { en: "Promising", ta: "நம்பிக்கை", tone: "good" },
  MIXED: { en: "Mixed", ta: "கலவை", tone: "warn" },
  LIMITED: { en: "Limited", ta: "குறைவு", tone: "muted" },
  // CAUTION
  STEADY: { en: "Steady", ta: "நிலையானது", tone: "good" },
  WATCHFUL: { en: "Stay mindful", ta: "கவனம்", tone: "warn" },
  EXTRA_CARE: { en: "Extra care", ta: "கூடுதல் கவனம்", tone: "care" },
  // career directional
  ENTERPRISE_LEANING: { en: "Enterprise-leaning", ta: "சுயமுயற்சி", tone: "info" },
  SALARIED_LEANING: { en: "Salaried-leaning", ta: "நிலையான வேலை", tone: "info" },
  BALANCED: { en: "Balanced", ta: "சமநிலை", tone: "info" },
  // Swabhava — a descriptive profile card, not a graded level.
  PROFILE: { en: "Profile", ta: "சுயவிவரம்", tone: "info" },
  // shared
  QUIET: { en: "Quiet", ta: "அமைதி", tone: "muted" },
};

const TONES = {
  good: { fg: W.good, bg: "rgba(46,125,50,0.12)" },
  warn: { fg: W.warn, bg: "rgba(184,134,11,0.13)" },
  care: { fg: W.care, bg: "rgba(198,40,40,0.10)" },
  info: { fg: W.info, bg: "rgba(58,110,165,0.12)" },
  muted: { fg: W.muted, bg: "var(--deepdive-surface-strong, var(--panel-hover))" },
} as const;

type Props = {
  lang: Lang;
  chartId: string;
};

export function DashboardPropensitiesPanelNova({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [bundle, setBundle] = useState<PropensityBundle | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "unavailable">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getPropensities(chartId)
      .then((res) => {
        if (cancelled) return;
        setBundle(res);
        setState("idle");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 404 = feature flag off → "being finalised" rather than an error.
        const msg = String((err as { message?: string })?.message ?? err);
        setState(/404|not available/i.test(msg) ? "unavailable" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  const title = isTamil ? "வாய்ப்புகள் & எச்சரிக்கைகள்" : "Chances & Cautions";
  const intro = isTamil
    ? "உங்கள் ஜாதகம் சாய்கின்ற போக்குகள் — வாய்ப்புகளும், கவனம் தேவைப்படும் காலங்களும். இவை நிச்சயங்கள் அல்ல; உங்கள் தேர்வுகளே முடிவை வடிவமைக்கும்."
    : "Tendencies your chart leans toward — both opportunities and seasons to be mindful. These are not certainties; your choices shape the outcome most.";

  return (
    <CollapsibleSection title={title} defaultOpen>
      <p style={{ color: W.muted, fontSize: 12.5, margin: "0 0 var(--space-3) 0", lineHeight: 1.55 }}>
        {intro}
      </p>

      {state === "loading" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>{isTamil ? "ஏற்றுகிறது…" : "Loading…"}</p>
      )}
      {state === "error" && (
        <p style={{ color: W.care, fontSize: 13, margin: 0 }}>
          {isTamil ? "தகவலை ஏற்ற முடியவில்லை." : "Could not load this section."}
        </p>
      )}
      {state === "unavailable" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>
          {isTamil ? "இந்த பகுதி இறுதி செய்யப்படுகிறது." : "This section is being finalised."}
        </p>
      )}

      {bundle && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {CATEGORY_ORDER.map((cat) => {
            const cards = bundle.results.filter((r) => r.category === cat);
            if (cards.length === 0) return null;
            return (
              <div key={cat}>
                <h4
                  style={{
                    color: W.ink,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    margin: "0 0 var(--space-2) 0",
                  }}
                >
                  {isTamil ? CATEGORY_LABEL[cat].ta : CATEGORY_LABEL[cat].en}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
                  {cards.map((c) => (
                    <PropensityCardView key={c.key} card={c} isTamil={isTamil} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}

function PropensityCardView({ card, isTamil }: { card: PropensityCard; isTamil: boolean }) {
  const [open, setOpen] = useState(false);
  const meta = LEVEL_META[card.level] ?? { en: card.level, ta: card.level, tone: "muted" as const };
  const tone = TONES[meta.tone];

  return (
    <div
      style={{
        border: `1px solid ${W.borderLt}`,
        borderRadius: "var(--radius-md)",
        background: W.surface,
        padding: "var(--space-3) var(--space-3_5)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          all: "unset",
          cursor: "pointer",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
        aria-expanded={open}
      >
        <strong style={{ color: W.ink, fontSize: 14.5 }}>
          {isTamil ? card.title.ta : card.title.en}
        </strong>
        {!card.deferred && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tone.fg,
              background: tone.bg,
              borderRadius: 999,
              padding: "2px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {isTamil ? meta.ta : meta.en}
          </span>
        )}
      </button>

      {card.deferred ? (
        <p style={{ color: W.muted, fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.5 }}>
          {card.deferredReason ? (isTamil ? card.deferredReason.ta : card.deferredReason.en) : ""}
        </p>
      ) : (
        <p style={{ color: W.ink, fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.55 }}>
          {isTamil ? card.summary.ta : card.summary.en}
        </p>
      )}

      {!card.deferred && open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)", marginTop: "var(--space-3)" }}>
          {card.factors.length > 0 && (
            <div>
              <div style={{ color: W.muted, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                {isTamil ? "ஏன்" : "Why"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                {card.factors.map((f, i) => (
                  <li key={`${f.key}-${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span
                      aria-hidden
                      style={{
                        marginTop: 5,
                        flex: "0 0 auto",
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background:
                          f.status === "SUPPORT" ? W.good : f.status === "CAUTION" ? W.warn : W.muted,
                      }}
                    />
                    <span style={{ color: W.ink, fontSize: 12.5, lineHeight: 1.5 }}>
                      {isTamil ? f.detail.ta : f.detail.en}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.windowNote && (
            <div
              style={{
                background: W.surfaceMd,
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-2) var(--space-2_5)",
                fontSize: 12,
                color: W.ink,
                lineHeight: 1.5,
              }}
            >
              <div>🗓️ {isTamil ? card.windowNote.ta : card.windowNote.en}</div>
              {card.timingWindowStart && card.timingWindowEnd && (
                <div style={{ marginTop: 4, fontWeight: 600, color: W.ink }}>
                  {card.timingWindowStart} – {card.timingWindowEnd}
                </div>
              )}
            </div>
          )}

          {card.whatHelps.length > 0 && (
            <div>
              <div style={{ color: W.muted, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                {isTamil ? "என்ன உதவும்" : "What helps"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {card.whatHelps.map((h, i) => (
                  <li key={i} style={{ color: W.ink, fontSize: 12.5, lineHeight: 1.5 }}>
                    {isTamil ? h.ta : h.en}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.showSupportResources && (
            <div
              style={{
                background: "rgba(58,110,165,0.08)",
                border: `1px solid rgba(58,110,165,0.25)`,
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-2_5)",
                fontSize: 12,
                color: W.ink,
                lineHeight: 1.55,
              }}
            >
              💙{" "}
              {isTamil
                ? "நீங்கள் தனியாக இதைச் சுமக்க வேண்டியதில்லை. நம்பகமான நண்பர், குடும்பம், அல்லது மனநல நிபுணரிடம் பேசுங்கள். கடினமாக இருந்தால், உங்கள் பகுதியிலுள்ள உதவி எண்ணை அணுகவும்."
                : "You don't have to carry this alone. Talk to a trusted friend, family member, or a mental-health professional. If things feel heavy, reaching a local support helpline is a strong, wise step."}
            </div>
          )}

          {card.disclaimer && (
            <p style={{ color: W.muted, fontSize: 11.5, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
              {isTamil ? card.disclaimer.ta : card.disclaimer.en}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

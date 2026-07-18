"use client";

import { useState } from "react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartYogaInsight, ChartDoshamInsight } from "@/lib/types";
import { getDoshamGuideForEngineName, getYogaGuideForEngineName, type BiText } from "@/lib/guide-detail-content";
import { CollapsibleSection } from "./collapsible-section";
import {
  displayName,
  markerLabel,
  getWhat,
  buildWhyText,
  strengthBand,
  doshamSeverityScore,
  getDoshamPowerContext,
  getYogaPowerContext,
  resolveYogaKey,
  YOGA_OUTCOMES,
  YOGA_HOW_TO,
  YOGA_REMEDIES,
  DOSHAM_OUTCOMES,
  DOSHAM_HOW_TO,
  DOSHAM_REMEDIES,
} from "./dashboard-yoga-dosham-panel";

/**
 * Nova re-skin of dashboard-yoga-dosham-panel.tsx's YogaDoshamPanel — one of
 * the 4 sub-tab panels deferred (Classic-styled) when Life Areas Nova first
 * shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). Grepped every
 * var(--...) reference in the Classic file's (unexported) YogaCard/DoshamCard
 * first: unlike dashboard-prediction-panel.tsx, this one is not a near-miss —
 * it reads --panel-earth-dark/--panel-tan/--panel-cream/--chart-cell-default
 * and several literal inline rgba(...) values with no var() at all, the same
 * class of Classic-only styling as Phase 2/3/11's from-scratch rebuilds. So
 * this file rebuilds the JSX/styling layer fresh with Nova tokens, reusing
 * every piece of pure data/logic via the additive exports already made for
 * this file across Phases 5/8/9 (YOGA_DISPLAY, displayName, markerLabel,
 * getWhat, buildWhyText, strengthBand, doshamSeverityScore,
 * getDoshamPowerContext) plus 4 more made for this pass (getYogaPowerContext,
 * YOGA_OUTCOMES/YOGA_HOW_TO/YOGA_REMEDIES — the yoga-side siblings of the
 * already-exported DOSHAM_OUTCOMES/DOSHAM_HOW_TO/DOSHAM_REMEDIES).
 */

function NovaChevron({ open }: { open: boolean }) {
  return (
    <span style={{ color: "var(--color-faint)", flexShrink: 0 }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" width="12" height="12" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}>
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Yogam sibling of `DoshamFullGuideInline` below — nests the same
 * marketing-grade guide content (see that component's comment) behind its
 * own collapsed toggle inside NovaYogaCard's open panel. Renders nothing
 * when no guide exists for this yoga (all yoga types except the 5 in
 * YOGA_ENGINE_NAME_TO_GUIDE_SLUG today).
 */
function YogaFullGuideInline({ engineName, lang }: { engineName: string; lang: Lang }) {
  const content = getYogaGuideForEngineName(engineName);
  if (!content) return null;
  const text = (v: BiText) => (lang === "ta" ? v.ta : v.en);

  return (
    <CollapsibleSection title={lang === "ta" ? "முழுமையான யோக வழிகாட்டி" : "Full yogam guide"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {content.sections.map((section, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {text(section.heading)}
            </p>
            {section.body.map((p, j) => (
              <p key={j} style={{ margin: j > 0 ? "6px 0 0" : 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{text(p)}</p>
            ))}
          </div>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}
            </p>
            {content.bringCards.map((cat, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {cat.items.map((item, j) => (
                    <li key={j} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{text(item)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {content.faq && content.faq.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}
            </p>
            {content.faq.map((item, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item.a)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function NovaYogaCard({ yoga, lang }: { yoga: ChartYogaInsight; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const color = yoga.isPresent
    ? yoga.strength === "STRONG" ? "var(--color-high)"
    : yoga.strength === "PARTIAL" ? "var(--color-mid)"
    : "var(--color-faint)"
    : "var(--color-faint)";

  const whyText = buildWhyText(yoga.conditionsMet, yoga.cancellationFactors, yoga.isPresent, false, yoga.dashaActivated, lang);
  const powerText = yoga.isPresent ? getYogaPowerContext(yoga.name, yoga.strength, yoga.dashaActivated, lang) : null;

  const cardBg = yoga.isPresent
    ? yoga.strength === "STRONG" ? "var(--color-high-bg)"
    : yoga.strength === "PARTIAL" ? "var(--color-mid-bg)"
    : "var(--color-surface-soft)"
    : "var(--color-surface-soft)";
  const cardBorder = yoga.isPresent
    ? yoga.strength === "STRONG" ? "var(--color-high-border)"
    : yoga.strength === "PARTIAL" ? "var(--color-mid-border)"
    : "var(--color-border)"
    : "var(--color-border)";

  const outcomes = resolveYogaKey(YOGA_OUTCOMES, yoga.name);
  const howTo = resolveYogaKey(YOGA_HOW_TO, yoga.name);
  const remedies = resolveYogaKey(YOGA_REMEDIES, yoga.name);

  return (
    <div style={{ borderRadius: "12px", border: `1px solid ${cardBorder}`, background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "14px 18px", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", fontFamily: "inherit" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "14px", color }}>{yoga.isPresent ? "★" : "○"}</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: yoga.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
            {displayName(yoga.name, lang)}
          </span>
          {yoga.isPresent && yoga.dashaActivated && (
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-mid)", border: "1px solid var(--color-mid-border)", borderRadius: "999px", padding: "2px 8px" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {yoga.isPresent ? (
            <span
              title={lang === "ta" ? "ஜாதக பலம் (நேட்டல் சார்ட்)" : "Natal chart strength — how strong this yoga is in your birth chart"}
              style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <span style={{ fontWeight: 700, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "9px" }}>{lang === "ta" ? "ஜாதகம்" : "Chart"}</span>
              {strengthBand(yoga.strength, yoga.isPresent, lang)}
            </span>
          ) : (
            <span style={{ fontSize: "10px", color: "var(--color-faint)" }}>{t("yoga_absent", lang)}</span>
          )}
          {yoga.isPresent && typeof yoga.activationScore === "number" && (
            <span
              title={lang === "ta" ? "இன்றைய செயல்பாட்டு மதிப்பெண் (தசை + கிரகநகர்வு)" : "Today's activation score — how strongly Dasha and transits are triggering this yoga now"}
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                background: yoga.isCurrentlyActive ? "var(--color-high-bg)" : "var(--color-surface-soft)",
                color: yoga.isCurrentlyActive ? "var(--color-high)" : "var(--color-faint)",
                border: `1px solid ${yoga.isCurrentlyActive ? "var(--color-high-border)" : "var(--color-border)"}`,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontWeight: 700, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "9px" }}>{lang === "ta" ? "இன்று" : "Today"}</span>
              {`${yoga.activationScore}/100`}
            </span>
          )}
          <NovaChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>
              {getWhat(yoga.name, true, lang, { ta: yoga.descriptionTa, en: yoga.descriptionEn }, { ta: yoga.effectTa, en: yoga.effectEn })}
            </p>
          </div>

          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{whyText}</p>
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {Array.isArray(yoga.cancellationFactors) && yoga.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
                </p>
                {yoga.cancellationFactors.map((factor) => (
                  <p key={factor} style={{ margin: "3px 0", fontSize: "13px", color: "var(--color-muted)" }}>
                    {"· "}{markerLabel(factor, lang)}
                  </p>
                ))}
              </div>
            )}
          </div>

          {yoga.isPresent && (
            <>
              {outcomes && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "வாழ்க்கையில் என்ன தரும்" : "What This Brings"}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? outcomes.ta : outcomes.en}</p>
                </div>
              )}
              {howTo && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "யோகத்தை பலப்படுத்துவது எப்படி" : "How to Strengthen This Yoga"}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? howTo.ta : howTo.en}</p>
                </div>
              )}
              {remedies && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{lang === "ta" ? remedies.ta : remedies.en}</p>
                </div>
              )}
            </>
          )}
          {yoga.isPresent && powerText && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color }}>
                {lang === "ta" ? "இப்போது என்ன செய்யலாம்" : "What It Can Do Now"}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{powerText}</p>
            </div>
          )}

          <YogaFullGuideInline engineName={yoga.name} lang={lang} />
        </div>
      )}
    </div>
  );
}

/**
 * The quick-status accordion here only ever carried 1-2 sentence engine
 * blurbs (DOSHAM_OUTCOMES/DOSHAM_HOW_TO/etc.) — much thinner than the
 * marketing-grade guide already live for some dosham types (see
 * dashboard-explore-dosham-nova.tsx's DoshamFullGuide for the fuller
 * write-up). Rather than duplicate that much text inside this already-dense
 * accordion row, this nests it behind its own collapsed toggle so a curious
 * user can go deeper without the common "just checking my status" case
 * having to scroll past it. Renders nothing when no guide exists for this
 * dosham (Rahu-Ketu, Badhaka, Marana Karaka Sthana today).
 */
function DoshamFullGuideInline({ engineName, lang }: { engineName: string; lang: Lang }) {
  const content = getDoshamGuideForEngineName(engineName);
  if (!content) return null;
  const text = (v: BiText) => (lang === "ta" ? v.ta : v.en);

  return (
    <CollapsibleSection title={lang === "ta" ? "முழுமையான தோஷ வழிகாட்டி" : "Full dosham guide"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {content.sections.map((section, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {text(section.heading)}
            </p>
            {section.body.map((p, j) => (
              <p key={j} style={{ margin: j > 0 ? "6px 0 0" : 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{text(p)}</p>
            ))}
          </div>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}
            </p>
            {content.bringCards.map((cat, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {cat.items.map((item, j) => (
                    <li key={j} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{text(item)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {content.faq && content.faq.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}
            </p>
            {content.faq.map((item, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item.a)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function NovaDoshamCard({ dosham, lang }: { dosham: ChartDoshamInsight; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isActiveAndPresent = dosham.isPresent && !dosham.isCancelled;
  const isCancelledAndPresent = dosham.isPresent && dosham.isCancelled;
  const color = isActiveAndPresent ? "var(--color-low)" : isCancelledAndPresent ? "var(--color-high)" : "var(--color-faint)";
  const severityScore = doshamSeverityScore(dosham);

  const statusLabel = !dosham.isPresent
    ? (lang === "ta" ? "இல்லை" : "Absent")
    : dosham.isCancelled
    ? (lang === "ta" ? "நிவர்த்தி" : "Mitigated")
    : (lang === "ta" ? "கவனம்" : "Active");

  const whyText = buildWhyText(dosham.conditionsMet, dosham.cancellationFactors, dosham.isPresent, dosham.isCancelled, dosham.dashaActivated, lang);
  const powerText = getDoshamPowerContext(dosham, lang);

  const annotationMarkers = new Set(["female_high_attention_house", "male_high_attention_house", "rahu_ketu_upachaya"]);
  const triggerBullets = dosham.conditionsMet.filter((c) => !annotationMarkers.has(c));
  const attentionBullets = dosham.conditionsMet.filter((c) => annotationMarkers.has(c));

  const cardBg = isActiveAndPresent ? "var(--color-low-bg)" : isCancelledAndPresent ? "var(--color-high-bg)" : "var(--color-surface-soft)";
  const cardBorder = isActiveAndPresent ? "var(--color-low-border)" : isCancelledAndPresent ? "var(--color-high-border)" : "var(--color-border)";

  const key = dosham.name.toUpperCase();
  const outcomes = DOSHAM_OUTCOMES[key];
  const howTo = DOSHAM_HOW_TO[key];
  const remedies = DOSHAM_REMEDIES[key];

  return (
    <div style={{ borderRadius: "12px", border: `1px solid ${cardBorder}`, background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "14px 18px", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", fontFamily: "inherit" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ color }} aria-hidden="true">
            {isActiveAndPresent
              ? <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17" r="1" fill="currentColor" /></svg>
              : dosham.isCancelled
              ? <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" /></svg>}
          </span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: dosham.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
            {displayName(dosham.name, lang)}
          </span>
          {dosham.isPresent && (dosham.variantEn || dosham.variantTa) && (
            <span
              title={lang === "ta" ? "இந்த ஜாதகத்தின் குறிப்பிட்ட காலசர்ப்ப வகை" : "The specific Kala Sarpa naga for this chart"}
              style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-accent-secondary)", border: "1px solid var(--color-accent-secondary)", borderRadius: "999px", padding: "2px 8px" }}
            >
              {lang === "ta" ? dosham.variantTa : `${dosham.variantEn} Kala Sarpa`}
            </span>
          )}
          {dosham.isPresent && dosham.dashaActivated && (
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-mid)", border: "1px solid var(--color-mid-border)", borderRadius: "999px", padding: "2px 8px" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 10px" }}>{statusLabel}</span>
          {severityScore !== null && (
            <span
              title={lang === "ta" ? "தீவிரம் — ஜாதக பலம் + தசை செயல்பாடு ஆகியவற்றின் அடிப்படையில்" : "Severity — based on natal strength + current Dasha activation"}
              style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: `${color}14`, color, border: `1px solid ${color}40`, flexShrink: 0 }}
            >
              {severityScore}/100
            </span>
          )}
          <NovaChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>
              {getWhat(dosham.name, false, lang, { ta: dosham.explanationWhatTa || dosham.descriptionTa, en: dosham.explanationWhatEn || dosham.descriptionEn })}
            </p>
          </div>

          <div>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{whyText}</p>

            {triggerBullets.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "கிரக நிலைகள்" : "Planet Positions"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {triggerBullets.map((c, i) => <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {dosham.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                  {lang === "ta" ? "பாதுகாப்பு காரணங்கள்" : "Protective Factors"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {dosham.cancellationFactors.map((c, i) => <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {attentionBullets.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-mid)" }}>
                  {lang === "ta" ? "கவன குறிப்பு" : "Attention Note"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {attentionBullets.map((c, i) => <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {outcomes && dosham.isPresent && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "வாழ்க்கையில் என்ன ஆகலாம்" : "How This May Affect You"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? outcomes.ta : outcomes.en}</p>
              </div>
            )}
            {howTo && dosham.isPresent && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                  {lang === "ta" ? "தாக்கத்தை குறைப்பது எப்படி" : "How to Reduce Impact"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? howTo.ta : howTo.en}</p>
              </div>
            )}
            {remedies && dosham.isPresent && (
              <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{lang === "ta" ? remedies.ta : remedies.en}</p>
              </div>
            )}

            {dosham.missingData && dosham.missingData.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--color-mid)", fontStyle: "italic", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "குறிப்பு: பிறந்த நேரம் இல்லாததால் இந்த மதிப்பீடு தோராயமானது."
                  : "Note: this assessment is estimated because exact birth time is unavailable."}
              </p>
            )}
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "10px", background: cardBg, border: `1px solid ${cardBorder}` }}>
            <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color }}>
              {lang === "ta" ? "இப்போது என்ன பொருள்" : "What This Means For You Now"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{powerText}</p>
          </div>

          <DoshamFullGuideInline engineName={dosham.name} lang={lang} />
        </div>
      )}
    </div>
  );
}

type Props = {
  lang: Lang;
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
};

export function NovaYogaDoshamPanel({ lang, yogas, doshams }: Props) {
  if (yogas.length === 0 && doshams.length === 0) {
    return <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("yogas_empty", lang)}</p>;
  }

  const presentYogas = yogas.filter((y) => y.isPresent);
  const absentYogas = yogas.filter((y) => !y.isPresent);
  // Doshams: "present" (Active or Mitigated) stay in the open list; only the
  // ones that don't apply to this chart get tucked into the collapsed group.
  const presentDoshams = doshams.filter((d) => d.isPresent);
  const absentDoshams = doshams.filter((d) => !d.isPresent);

  const absentTitle = (n: number) =>
    lang === "ta" ? `உங்கள் ஜாதகத்தில் இல்லாதவை (${n})` : `Not present in your chart (${n})`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "var(--font-body)" }}>
      {yogas.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: "var(--color-text-strong)" }}>{t("yogas_title", lang)}</p>
            {presentYogas.length > 0 && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-high)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "999px", padding: "2px 8px" }}>
                {presentYogas.length} {t("yoga_present", lang)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {presentYogas.map((y, i) => <NovaYogaCard key={`present-${y.name}-${i}`} yoga={y} lang={lang} />)}
            {absentYogas.length > 0 && (
              <CollapsibleSection title={absentTitle(absentYogas.length)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {absentYogas.map((y, i) => <NovaYogaCard key={`absent-${y.name}-${i}`} yoga={y} lang={lang} />)}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      )}

      {doshams.length > 0 && (
        <div>
          <p style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: "var(--color-text-strong)" }}>{t("doshams_title", lang)}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {presentDoshams.map((d) => <NovaDoshamCard key={d.name} dosham={d} lang={lang} />)}
            {absentDoshams.length > 0 && (
              <CollapsibleSection title={absentTitle(absentDoshams.length)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {absentDoshams.map((d) => <NovaDoshamCard key={d.name} dosham={d} lang={lang} />)}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

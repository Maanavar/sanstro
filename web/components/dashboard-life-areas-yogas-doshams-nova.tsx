"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartYogaInsight, ChartDoshamInsight } from "@/lib/types";
import { yogaActivationState } from "@vinaadi/shared/yogaDisplay";
import { getDoshamGuideForEngineName, getYogaGuideForEngineName, type BiText } from "@/lib/guide-detail-content";
import { CollapsibleSection } from "./collapsible-section";
import { DoshamReckoningBlock } from "./dosham-reckoning-block";
import { doshamAnchorId, useDoshamCardRequest } from "@/lib/dosham-deep-link";
import {
  displayName,
  markerLabel,
  getWhat,
  buildWhyText,
  strengthBand,
  yogaCardTone,
  yogaReadingStatus,
  yogaReadingStatusLabel,
  yogaFactorHeading,
  doshamSeverityBand,
  doshamPresenceLabel,
  getDoshamPowerContext,
  getYogaPowerContext,
  resolveYogaKey,
  YOGA_OUTCOMES,
  YOGA_HOW_TO,
  YOGA_REMEDIES,
  DOSHAM_OUTCOMES,
  DOSHAM_HOW_TO,
  getDoshamRemedies,
  doshamMeaningCoversMarkers,
} from "./dashboard-yoga-dosham-panel";

/**
 * Nova re-skin of dashboard-yoga-dosham-panel.tsx's YogaDoshamPanel — one of
 * the 4 sub-tab panels deferred (Classic-styled) when Life Areas Nova first
 * shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). Grepped every
 * var(--...) reference in the Classic file's (unexported) YogaCard/DoshamCard
 * first: unlike dashboard-prediction-panel.tsx, this one is not a near-miss —
 * it reads the legacy Classic warm-parchment palette and the chart-cell
 * default, plus several literal inline rgba(...) values with no var() at all,
 * the same
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
      <svg viewBox="0 0 24 24" fill="none" width="12" height="12" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms var(--ease-nova)" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {content.sections.map((section, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {text(section.heading)}
            </p>
            {section.body.map((p, j) => (
              <p key={j} style={{ margin: j > 0 ? "6px 0 0" : 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{text(p)}</p>
            ))}
          </div>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}
            </p>
            {content.bringCards.map((cat, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {cat.items.map((item, j) => (
                    <li key={j} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{text(item)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {content.faq && content.faq.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}
            </p>
            {content.faq.map((item, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item.a)}</p>
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const anchorTop = useRef<number | null>(null);

  // Toggling this card changes document height below it, and native scroll
  // anchoring can pick the wrong anchor for a block this large — pin the
  // trigger's own viewport position across the toggle instead (see
  // collapsible-section.tsx's identical fix for the same symptom).
  useLayoutEffect(() => {
    if (anchorTop.current === null || !triggerRef.current) return;
    const drift = triggerRef.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorTop.current = null;
  }, [open]);

  function toggle() {
    anchorTop.current = triggerRef.current?.getBoundingClientRect().top ?? null;
    setOpen((v) => !v);
  }

  // Valence before strength — see `yogaCardTone`'s docstring. Shared with the
  // Classic panel so the two cannot drift on which yogas read as a warning.
  const status = yogaReadingStatus(yoga);
  const tone = yogaCardTone(yoga.name, status, yoga.strength);
  const color = tone.fg;
  const activationState = yogaActivationState(yoga);

  // Present: the conditions are listed below. Absent: the factor list is.
  const whyText = buildWhyText(yoga.conditionsMet, yoga.cancellationFactors, yoga.isPresent, false, false, lang, { listsShown: yoga.isPresent || (yoga.cancellationFactors?.length ?? 0) > 0 });
  const powerText = yoga.isPresent ? getYogaPowerContext(yoga.name, yoga.strength, activationState, lang) : null;

  const cardBg = tone.bg;
  const cardBorder = tone.border;
  // The pill sits on the card's own translucent tint, so a translucent pill
  // doubles it (low ink on doubled low-bg measured 4.31:1). The `-bg-solid`
  // twins are the audited opaque grounds for exactly this.
  const pillBg = tone.pillBg.replace(/^var\(--color-(high|mid|low)-bg\)$/, "var(--color-$1-bg-solid)");

  const outcomes = resolveYogaKey(YOGA_OUTCOMES, yoga.name);
  const howTo = resolveYogaKey(YOGA_HOW_TO, yoga.name);
  const remedies = resolveYogaKey(YOGA_REMEDIES, yoga.name);

  return (
    <div style={{ borderRadius: "var(--space-3)", border: `1px solid ${cardBorder}`, background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        // flexWrap + minWidth 0: at 375 px the pills could not wrap under the
        // name and the row pushed the page 115 px wide (chart-reading-a11y.spec.ts).
        style={{ width: "100%", padding: "var(--space-4) var(--space-5)", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", fontFamily: "inherit", overflowAnchor: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: "1 1 180px", minWidth: 0 }}>
          <span aria-hidden="true" style={{ fontSize: "var(--text-base)", color }}>{tone.glyph}</span>
          <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: yoga.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
              {lang === "ta" ? yoga.effectTa : yoga.effectEn}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{displayName(yoga.name, lang)}</span>
          </span>
          {yoga.isPresent && yoga.dashaActivated && (
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid-text)", border: "1px solid var(--color-mid-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginLeft: "auto" }}>
          {yoga.isPresent ? (
            <span
              title={lang === "ta" ? "ஜாதக பலம் (நேட்டல் சார்ட்)" : "Natal chart strength — how strong this yoga is in your birth chart"}
              style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: pillBg, border: `1px solid ${tone.border}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}
            >
              {/* No opacity on the micro-label: 0.65 put it at 2.5:1. Case and
                  tracking already set it apart from the value. */}
              <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "var(--text-xs)" }}>{lang === "ta" ? "ஜாதகம்" : "Chart"}</span>
              {strengthBand(yoga.strength, yoga.isPresent, lang)}
            </span>
          ) : (
            <span style={{ fontSize: "var(--text-xs)", color: status === "CANCELLED" ? "var(--color-mid-text)" : "var(--color-faint)" }}>
              {status === "CANCELLED" ? yogaReadingStatusLabel(status, lang) : t("yoga_absent", lang)}
            </span>
          )}
          {yoga.isPresent && typeof yoga.activationScore === "number" && (
            <span
              // Dasha only — this score takes no gochara input. See yoga_activation.py.
              title={lang === "ta" ? "இன்றைய செயல்பாட்டு மதிப்பெண் (தசை அடிப்படையில்)" : "Today's activation score — how strongly your running Dasha is triggering this yoga"}
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-pill)",
                // Tone, not the high tokens — an activated adverse yoga is a
                // warning that is live, not a score to celebrate.
                background: yoga.isCurrentlyActive ? pillBg : "var(--color-surface-soft)",
                color: yoga.isCurrentlyActive ? tone.fg : "var(--color-faint)",
                border: `1px solid ${yoga.isCurrentlyActive ? tone.border : "var(--color-border)"}`,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
              }}
            >
              <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "var(--text-xs)" }}>{lang === "ta" ? "இன்று" : "Today"}</span>
              {`${yoga.activationScore}/100`}
            </span>
          )}
          <NovaChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "var(--space-3)", overflowAnchor: "none" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
              {getWhat(yoga.name, true, lang, { ta: yoga.descriptionTa, en: yoga.descriptionEn }, { ta: yoga.effectTa, en: yoga.effectEn })}
            </p>
          </div>

          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            {whyText && <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{whyText}</p>}
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {Array.isArray(yoga.cancellationFactors) && yoga.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {yogaFactorHeading(yoga.cancellationFactors, lang)}
                </p>
                {yoga.cancellationFactors.map((factor) => (
                  <p key={factor} style={{ margin: "3px 0", fontSize: "var(--text-base)", color: "var(--color-muted)" }}>
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
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "வாழ்க்கையில் என்ன தரும்" : "What This Brings"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? outcomes.ta : outcomes.en}</p>
                </div>
              )}
              {howTo && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "யோகத்தை பலப்படுத்துவது எப்படி" : "How to Strengthen This Yoga"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? howTo.ta : howTo.en}</p>
                </div>
              )}
              {remedies && (
                <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--space-3)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                    {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{lang === "ta" ? remedies.ta : remedies.en}</p>
                </div>
              )}
            </>
          )}
          {yoga.isPresent && powerText && (
            <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--space-3)", background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color }}>
                {lang === "ta" ? "இப்போது என்ன செய்யலாம்" : "What It Can Do Now"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{powerText}</p>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {content.sections.map((section, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {text(section.heading)}
            </p>
            {section.body.map((p, j) => (
              <p key={j} style={{ margin: j > 0 ? "6px 0 0" : 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{text(p)}</p>
            ))}
          </div>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}
            </p>
            {content.bringCards.map((cat, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {cat.items.map((item, j) => (
                    <li key={j} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{text(item)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {content.faq && content.faq.length > 0 && (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}
            </p>
            {content.faq.map((item, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item.a)}</p>
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const anchorTop = useRef<number | null>(null);

  // Same scroll-anchor-drift fix as NovaYogaCard above.
  useLayoutEffect(() => {
    if (anchorTop.current === null || !triggerRef.current) return;
    const drift = triggerRef.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorTop.current = null;
  }, [open]);

  function toggle() {
    anchorTop.current = triggerRef.current?.getBoundingClientRect().top ?? null;
    setOpen((v) => !v);
  }

  const cardRef = useRef<HTMLDivElement | null>(null);
  useDoshamCardRequest(dosham.name, () => setOpen(true), cardRef);

  const isActiveAndPresent = dosham.isPresent && !dosham.isCancelled;
  const isCancelledAndPresent = dosham.isPresent && dosham.isCancelled;
  const color = isActiveAndPresent ? "var(--color-low)" : isCancelledAndPresent ? "var(--color-high)" : "var(--color-faint)";
  const severityBand = doshamSeverityBand(dosham, lang);

  const statusLabel = doshamPresenceLabel(dosham, lang);

  const whyText = buildWhyText(dosham.conditionsMet, dosham.cancellationFactors, dosham.isPresent, dosham.isCancelled, dosham.dashaActivated, lang, { listsShown: true, kind: "dosham" });
  const powerText = getDoshamPowerContext(dosham, lang);
  // "In your chart" already names every marker for these doshams; the bullets
  // would print the same facts a second time (owner report, 2026-10-06).
  const listsInMeaning = doshamMeaningCoversMarkers(dosham);

  const annotationMarkers = new Set(["female_high_attention_house", "male_high_attention_house", "rahu_ketu_upachaya"]);
  const triggerBullets = listsInMeaning ? [] : dosham.conditionsMet.filter((c) => !annotationMarkers.has(c));
  const protectiveBullets = listsInMeaning ? [] : dosham.cancellationFactors;
  const showWhy = whyText !== "" || triggerBullets.length > 0 || protectiveBullets.length > 0;
  // DD-05: gender markers are never voiced on a consumer card, even from an old payload.
  const attentionBullets = dosham.conditionsMet.filter((c) => annotationMarkers.has(c) && !c.endsWith("_high_attention_house"));

  const cardBg = isActiveAndPresent ? "var(--color-low-bg)" : isCancelledAndPresent ? "var(--color-high-bg)" : "var(--color-surface-soft)";
  const cardBorder = isActiveAndPresent ? "var(--color-low-border)" : isCancelledAndPresent ? "var(--color-high-border)" : "var(--color-border)";

  const key = dosham.name.toUpperCase();
  const outcomes = DOSHAM_OUTCOMES[key];
  const howTo = DOSHAM_HOW_TO[key];
  const remedies = getDoshamRemedies(dosham, lang);

  return (
    <div ref={cardRef} id={doshamAnchorId(dosham.name)} style={{ borderRadius: "var(--space-3)", border: `1px solid ${cardBorder}`, background: "var(--color-surface)", overflow: "hidden", fontFamily: "var(--font-body)", scrollMarginTop: "72px" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        // flexWrap + minWidth 0: at 375 px the pills could not wrap under the
        // name and the row pushed the page 115 px wide (chart-reading-a11y.spec.ts).
        style={{ width: "100%", padding: "var(--space-4) var(--space-5)", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", fontFamily: "inherit", overflowAnchor: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: "1 1 180px", minWidth: 0 }}>
          <span style={{ color }} aria-hidden="true">
            {isActiveAndPresent
              ? <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17" r="1" fill="currentColor" /></svg>
              : dosham.isCancelled
              ? <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" /></svg>}
          </span>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: dosham.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
            {displayName(dosham.name, lang)}
          </span>
          {dosham.isPresent && (dosham.variantEn || dosham.variantTa) && (
            <span
              title={dosham.name === "KALASARPA"
                ? (lang === "ta" ? "இந்த ஜாதகத்தின் குறிப்பிட்ட காலசர்ப்ப வகை" : "The specific Kala Sarpa naga for this chart")
                : (lang === "ta" ? "இந்த ஜாதகத்தில் இந்த தோஷம் அமைந்த விதம்" : "How this dosham is placed in this chart")}
              style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent-secondary)", border: "1px solid var(--color-accent-secondary)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)" }}
            >
              {/* The "Kala Sarpa" suffix belongs to the naga only; the Rahu–Ketu
                  axis variant ("2/8 axis") reads as it is. */}
              {lang === "ta" ? dosham.variantTa : dosham.name === "KALASARPA" ? `${dosham.variantEn} Kala Sarpa` : dosham.variantEn}
            </span>
          )}
          {dosham.isPresent && dosham.dashaActivated && (
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid-text)", border: "1px solid var(--color-mid-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginLeft: "auto" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>{statusLabel}</span>
          {severityBand !== null && (
            <span
              title={lang === "ta" ? "இந்த ஜாதகத்தின் நிவர்த்திகளுக்குப் பிறகு மீதமுள்ள தாக்கம்" : "What remains after this chart's protections"}
              style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-pill)", background: `${color}14`, color, border: `1px solid ${color}40`, flexShrink: 0 }}
            >
              {severityBand}
            </span>
          )}
          <NovaChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "var(--space-3)", overflowAnchor: "none" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
              {getWhat(dosham.name, false, lang, { ta: dosham.explanationWhatTa || dosham.descriptionTa, en: dosham.explanationWhatEn || dosham.descriptionEn })}
            </p>
          </div>

          <DoshamReckoningBlock dosham={dosham} lang={lang} />

          <div>
            {showWhy && (
              <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
              </p>
            )}
            {whyText && <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{whyText}</p>}

            {triggerBullets.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "கிரக நிலைகள்" : "Planet Positions"}
                </p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {triggerBullets.map((c, i) => <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {protectiveBullets.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                  {lang === "ta" ? "பாதுகாப்பு காரணங்கள்" : "Protective Factors"}
                </p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {protectiveBullets.map((c, i) => <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {attentionBullets.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-mid-text)" }}>
                  {lang === "ta" ? "கவன குறிப்பு" : "Attention Note"}
                </p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {attentionBullets.map((c, i) => <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>)}
                </ul>
              </div>
            )}

            {outcomes && dosham.isPresent && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "வாழ்க்கையில் என்ன ஆகலாம்" : "How This May Affect You"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? outcomes.ta : outcomes.en}</p>
              </div>
            )}
            {howTo && dosham.isPresent && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-high)" }}>
                  {lang === "ta" ? "தாக்கத்தை குறைப்பது எப்படி" : "How to Reduce Impact"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>{lang === "ta" ? howTo.ta : howTo.en}</p>
              </div>
            )}
            {remedies && dosham.isPresent && (
              <div style={{ marginTop: "10px", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--space-3)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-low)" }}>
                  {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{remedies}</p>
              </div>
            )}

            {dosham.missingData && dosham.missingData.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-sm)", color: "var(--color-mid-text)", fontStyle: "italic", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "குறிப்பு: பிறந்த நேரம் இல்லாததால் இந்த மதிப்பீடு தோராயமானது."
                  : "Note: this assessment is estimated because exact birth time is unavailable."}
              </p>
            )}
          </div>

          <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--space-3)", background: cardBg, border: `1px solid ${cardBorder}` }}>
            <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color }}>
              {lang === "ta" ? "இப்போது என்ன பொருள்" : "What This Means For You Now"}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-strong)", lineHeight: 1.55 }}>{powerText}</p>
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
    return <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("yogas_empty", lang)}</p>;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7)", fontFamily: "var(--font-body)" }}>
      {yogas.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "12px" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text-strong)" }}>{t("yogas_title", lang)}</p>
            {presentYogas.length > 0 && (
              // Neutral — a count is not a verdict; the cards carry the valence.
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-strong)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)" }}>
                {presentYogas.length} {t("yoga_present", lang)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {presentYogas.map((y, i) => <NovaYogaCard key={`present-${y.name}-${i}`} yoga={y} lang={lang} />)}
            {absentYogas.length > 0 && (
              <CollapsibleSection title={absentTitle(absentYogas.length)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "8px" }}>
                  {absentYogas.map((y, i) => <NovaYogaCard key={`absent-${y.name}-${i}`} yoga={y} lang={lang} />)}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      )}

      {doshams.length > 0 && (
        <div>
          <p style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text-strong)" }}>{t("doshams_title", lang)}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {presentDoshams.map((d) => <NovaDoshamCard key={d.name} dosham={d} lang={lang} />)}
            {absentDoshams.length > 0 && (
              <CollapsibleSection title={absentTitle(absentDoshams.length)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "8px" }}>
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

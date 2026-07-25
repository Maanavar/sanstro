"use client";

import { ArrowLeft } from "lucide-react";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type { ChartDoshamInsight } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";
import { getDoshamGuideForEngineName, type BiText } from "@/lib/guide-detail-content";
import { CollapsibleSection } from "./collapsible-section";

import {
  buildWhyText,
  displayName,
  DOSHAM_REMEDIES,
  getDoshamPowerContext,
  getWhat,
  markerLabel,
  strengthBand,
} from "./dashboard-yoga-dosham-panel";
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { Card, Kicker } from "./ui";

/**
 * Signed-in users looking at a dosham present in their OWN chart used to get
 * only a 1-2 sentence engine-authored "what/why" blurb (DOSHAM_WHAT et al in
 * dashboard-yoga-dosham-panel.tsx) — far less than the marketing-grade,
 * multi-section guide already live for some doshams at /dosham/[slug]
 * (web/lib/guide-detail-content.ts: what-it-is, calculation method,
 * how-to-read-your-chart, cancellation rules, categorised "what it can
 * bring", FAQ). Only 5 of the 8 dosham types the engine computes have that
 * deep content today (see DOSHAM_ENGINE_NAME_TO_GUIDE_SLUG's own comment for
 * which) — Rahu-Ketu, Badhaka and Marana Karaka Sthana don't yet, so this
 * renders nothing for those rather than a wrong or empty-looking guide.
 * Kept as an additive "full guide" card alongside the existing personalised
 * cards, not a replacement — the existing Pariharam card above already
 * covers remedies, so this omits the guide's own (largely overlapping)
 * remedies block to avoid showing two redundant pariharam sections.
 */
function DoshamFullGuide({ engineName, lang }: { engineName: string; lang: Lang }) {
  const content = getDoshamGuideForEngineName(engineName);
  if (!content) return null;
  const text = (v: BiText) => (lang === "ta" ? v.ta : v.en);

  return (
    <Card>
      <Kicker>{lang === "ta" ? "முழுமையான தோஷ வழிகாட்டி" : "Full dosham guide"}</Kicker>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        {content.sections.map((section, i) => (
          <CollapsibleSection key={i} title={text(section.heading)} defaultOpen={i === 0}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {section.body.map((p, j) => (
                <p key={j} style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "var(--text-base)", lineHeight: 1.7, color: "var(--color-text)" }}>
                  {text(p)}
                </p>
              ))}
            </div>
          </CollapsibleSection>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <CollapsibleSection title={lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {content.bringCards.map((cat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</div>
                  <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {content.faq && content.faq.length > 0 && (
          <CollapsibleSection title={lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {content.faq.map((item, i) => (
                <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none", paddingTop: i > 0 ? "12px" : 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(item.a)}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </Card>
  );
}

/**
 * Nova personalised Dosham profile screen — Phase 8 of the dashboard
 * revamp, mapped from the mockup's `explore-sevvai` screen (Sevvai was
 * just that mockup's example dosham; this component is fully generic —
 * it renders whichever entry of the viewer's own `personalChart.doshams`
 * is being browsed). See docs/DASHBOARD_UI_REVAMP_PLAN.md §6.7 for the
 * full gap/mapping table.
 *
 * Unlike Nakshatram (Phase 7), there is no dosham "encyclopedia" endpoint
 * independent of a chart — `ChartDoshamInsight` is inherently chart-relative
 * (isPresent/conditionsMet/etc. only exist for a specific birth chart), so
 * "browsing" here cycles through the 8 dosham types the engine always
 * computes for the signed-in user's own chart (`personalChart.doshams`,
 * in the engine's own fixed order — Sevvai, Rahu-Ketu, Pitru, Kalathra,
 * Putra Sarpa, Marana Karaka Sthana, Badhaka, Kalasarpa), not any-of-N
 * independent of the viewer the way nakshatra numbers 1-27 are. That means
 * there is no separate "In your chart" vs "browsing someone else's" split
 * the way the Nakshatram screen has — every dosham viewed here is already
 * about the signed-in user's own chart.
 *
 * Content notes (verified against Sevvai, Pitru, Kalasarpa and Badhaka —
 * four structurally different dosham types, not just the mockup's Sevvai
 * example — before assuming anything generalises):
 * - "What it means", "why it triggered/cancelled" and "what this means for
 *   you now" all reuse the engine-authored `explanationWhat/Why/How` text
 *   and the existing `DOSHAM_WHAT`/marker-label maps already shipping in
 *   Classic's `YogaDoshamPanel` — nothing here is newly authored prose.
 * - The mockup's "Trigger houses" attribute-band fact does NOT generalise:
 *   Sevvai has a fixed house set, Rahu-Ketu has two different house sets
 *   depending on category, Pitru/Kalasarpa aren't house-based at all, and
 *   Kalathra/Badhaka are about a *lord's* placement, not a fixed house list
 *   from Lagna — and the exact house number that triggered a dosham isn't
 *   returned by the API in any case (only used internally to decide
 *   is_present/strength). Replaced with a `category`-derived "mainly
 *   touches" fact (a small presentation-only label over an existing,
 *   already-computed enum field) plus a Dasha-activation fact instead.
 * - The mockup's "Pariharam" card turned out to be mostly real, not a
 *   stub: `DOSHAM_REMEDIES` (dashboard-yoga-dosham-panel.tsx) already has
 *   real per-dosham remedy prose — including the exact same temple
 *   ("Vaitheeswaran Koil") and day ("Tuesday") the mockup names for Sevvai
 *   — for 7 of the 8 types, already shipping in Classic's panel. Shown as
 *   flowing prose (as authored) rather than reproducing the mockup's exact
 *   3-row temple/day/mantra layout, which would over-imply a structure the
 *   underlying content doesn't have. The one type with no remedy entry
 *   (Marana Karaka Sthana) gets no Pariharam card at all — same precedent
 *   Classic's own `DoshamCard` already follows (`remedies && isPresent`).
 * - "Related — Porutham matching" is only shown for the two dosham types
 *   `marriage_service.py` actually factors into its compatibility scoring
 *   (Sevvai, Rahu-Ketu) — verified by grep, not assumed from the mockup's
 *   copy, which shows the same link under its one example (Sevvai) without
 *   implying it for every dosham type.
 * - Post-Phase-8 browser QA (2026-07-06) found the breadcrumb's hub crumb
 *   and every "Pariharam"/"Related" CTA opened the marketing site in a new
 *   tab — surprising for a breadcrumb, and redundant with the Explore hub's
 *   own library tiles for the content cards. Per user decision, all
 *   marketing link-outs were removed from this screen: the breadcrumb hub
 *   crumb is now plain text, and Pariharam/Related render as informational
 *   text with no outbound link (or are omitted when they'd have nothing
 *   left to show).
 */

// Presentation-only label over the engine's existing `category` field
// (MARRIAGE/MARRIAGE_PERSONAL/NODES/SARPA_NAGA/PITRU/CHILDREN/
// LONGEVITY_CAUTION/OBSTACLES/KALA_SARPA — confirmed via grep of every
// detect_*_dosham() call site) — not a new astrological claim.
const DOSHAM_CATEGORY_LABEL: Record<string, { en: string; ta: string }> = {
  MARRIAGE: { en: "Marriage & partnership", ta: "திருமணம் & இணைவு" },
  MARRIAGE_PERSONAL: { en: "Marriage & partnership", ta: "திருமணம் & இணைவு" },
  NODES: { en: "Karmic & emotional patterns", ta: "கர்ம & உணர்ச்சி தொடர்பு" },
  SARPA_NAGA: { en: "Sarpa / Naga sensitivity", ta: "சர்ப்ப / நாக உணர்திறன்" },
  PITRU: { en: "Family & ancestry", ta: "குடும்பம் & முன்னோர்" },
  CHILDREN: { en: "Children & creativity", ta: "சந்ததி & படைப்பாற்றல்" },
  LONGEVITY_CAUTION: { en: "Dasha timing caution", ta: "தசை காலக் கவனம்" },
  OBSTACLES: { en: "Delays & obstacles", ta: "தாமதம் & தடைகள்" },
  KALA_SARPA: { en: "Life focus & intensity", ta: "வாழ்க்கை கவனம் & தீவிரம்" },
};

// Verified via grep of app/services/marriage_service.py — only these two
// dosham labels actually feed the Porutham compatibility scoring today.
const POROUTHAM_RELEVANT = new Set(["SEVVAI_DOSHAM", "RAHU_KETU_DOSHAM"]);

const ANNOTATION_ONLY_MARKERS = new Set(["female_high_attention_house", "male_high_attention_house", "rahu_ketu_upachaya"]);

function wrapIndex(i: number, length: number): number {
  return ((i % length) + length) % length;
}

export function doshamStatusLabel(d: ChartDoshamInsight, lang: Lang): string {
  if (!d.isPresent) return lang === "ta" ? "இல்லை" : "Absent";
  if (d.isCancelled) return lang === "ta" ? "நிவர்த்தி" : "Mitigated";
  return lang === "ta" ? "கவனம்" : "Active";
}

export function doshamStatusColor(d: ChartDoshamInsight): string {
  if (!d.isPresent) return "var(--color-faint)";
  if (d.isCancelled) return "var(--color-high)";
  return "var(--color-low)";
}

/**
 * List-first index for the Dosham library — Explore hub's "Dosham" tile
 * used to jump straight into ONE dosham's detail screen (the strongest
 * active one, or index 0) with no way to scan all 8 first except the detail
 * screen's prev/next arrows. Unlike Nakshatram, every dosham here is already
 * about the signed-in user's own chart (see the main component's own
 * comment), so the list itself doubles as a status summary — each row shows
 * its current isPresent/isCancelled/strength badge via the same
 * doshamStatusLabel/doshamStatusColor helpers the detail screen uses,
 * rather than being a bare menu of names.
 */
export function DashboardExploreDoshamListNova({
  lang,
  doshams,
  onSelect,
  onBack,
}: {
  lang: Lang;
  doshams: ChartDoshamInsight[];
  onSelect: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "தோஷம்" : "Dosham"}
        currentLabel={lang === "ta" ? "அனைத்து தோஷங்களும்" : "All doshams"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {doshams.map((d, i) => {
          const color = doshamStatusColor(d);
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => onSelect(i)}
              style={{
                ...novaDetailCardStyle,
                gap: "var(--space-2)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: d.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
                {displayName(d.name, lang)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                {d.isPresent && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                    {strengthBand(d.strength, true, lang)}
                  </span>
                )}
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                  {doshamStatusLabel(d, lang)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardExploreDoshamNovaProps {
  lang: Lang;
  doshams: ChartDoshamInsight[];
  initialIndex: number;
  memberCharts: MemberChart[];
  onBack: () => void;
  onOpenAskVinaadi: () => void;
  onNavigateToday: () => void;
}

export function DashboardExploreDoshamNova({
  lang,
  doshams,
  initialIndex,
  memberCharts,
  onBack,
  onOpenAskVinaadi,
  onNavigateToday,
}: DashboardExploreDoshamNovaProps) {
  const [viewedIndex, setViewedIndex] = useState(() => wrapIndex(initialIndex, Math.max(doshams.length, 1)));
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  if (doshams.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <><ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "var(--space-1)" }} />{lang === "ta" ? "ஆராய்வுக்குத் திரும்பு" : "Back to Explore"}</>
        </button>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {lang === "ta" ? "தோஷ தரவு இல்லை." : "No dosham data available."}
        </p>
      </div>
    );
  }

  const dosham = doshams[wrapIndex(viewedIndex, doshams.length)];
  const prevDosham = doshams[wrapIndex(viewedIndex - 1, doshams.length)];
  const nextDosham = doshams[wrapIndex(viewedIndex + 1, doshams.length)];

  const key = dosham.name.toUpperCase();
  const remedy = DOSHAM_REMEDIES[key];
  const categoryLabel = DOSHAM_CATEGORY_LABEL[dosham.category];

  const whatText = getWhat(dosham.name, false, lang, {
    ta: dosham.explanationWhatTa || dosham.descriptionTa,
    en: dosham.explanationWhatEn || dosham.descriptionEn,
  });
  const whyText = buildWhyText(dosham.conditionsMet, dosham.cancellationFactors, dosham.isPresent, dosham.isCancelled, dosham.dashaActivated, lang);
  const triggerBullets = dosham.conditionsMet.filter((c) => !ANNOTATION_ONLY_MARKERS.has(c));
  const powerText = getDoshamPowerContext(dosham, lang);

  const ownStatusLabel = doshamStatusLabel(dosham, lang);
  const ownStatusColor = doshamStatusColor(dosham);

  const familyRows = memberCharts
    .map((mc) => ({ mc, entry: mc.chart?.doshams?.find((d) => d.name === dosham.name) ?? null }))
    .filter((row): row is { mc: MemberChart; entry: ChartDoshamInsight } => row.entry !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Breadcrumb + dosham nav ===== */}
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "தோஷம்" : "Dosham"}
        currentLabel={displayName(dosham.name, lang)}
        onPrev={{
          label: displayName(prevDosham.name, lang),
          onClick: () => setViewedIndex((i) => wrapIndex(i - 1, doshams.length)),
        }}
        onNext={{
          label: displayName(nextDosham.name, lang),
          onClick: () => setViewedIndex((i) => wrapIndex(i + 1, doshams.length)),
        }}
      />

      {/* ===== Hero ===== */}
      <NovaDetailHero
        kicker={lang === "ta" ? "தோஷ நூலகம்" : "Dosham library"}
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: 700, color: ownStatusColor, background: `${ownStatusColor}18`, border: `1px solid ${ownStatusColor}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
            {dosham.isPresent
              ? `${lang === "ta" ? "உங்கள் ஜாதகத்தில் உள்ளது" : "Present in your chart"} · ${strengthBand(dosham.strength, true, lang)}`
              : (lang === "ta" ? "உங்கள் ஜாதகத்தில் இல்லை" : "Not present in your chart")}
          </span>
        }
        titleMain={displayName(dosham.name, lang)}
        prose={astroText(whatText)}
      />

      {/* ===== Attribute band ===== */}
      <NovaAttributeBand
        facts={[
          {
            label: lang === "ta" ? "முதன்மையாக தொடுவது" : "Mainly touches",
            value: categoryLabel ? (lang === "ta" ? categoryLabel.ta : categoryLabel.en) : dosham.category.replaceAll("_", " "),
          },
          { label: lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart", value: ownStatusLabel },
          { label: lang === "ta" ? "தீவிரம்" : "Severity", value: strengthBand(dosham.strength, dosham.isPresent, lang) },
          {
            label: lang === "ta" ? "தசை" : "Dasha",
            value: dosham.dashaActivated
              ? (lang === "ta" ? "இப்போது செயல்பாட்டில்" : "Active now")
              : (lang === "ta" ? "இப்போது செயல்படவில்லை" : "Not active now"),
          },
        ]}
      />

      {/* ===== Two column body ===== */}
      <div className="nova-grid-detail" style={{ alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Card>
            <Kicker>{lang === "ta" ? "இது உண்மையில் என்ன பொருள்" : "What it actually means"}</Kicker>
            <p style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "var(--text-base)", lineHeight: 1.7, color: "var(--color-text)" }}>
              {astroText(whatText)}
            </p>
            <Card variant="high" compact style={{ flexDirection: "row", gap: "var(--space-3)" }}>
              <span style={{ flex: "none", color: "var(--color-high)", fontSize: "var(--text-md)" }}>{"☘"}</span>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>
                {astroText(lang === "ta" ? dosham.explanationHowTa || "" : dosham.explanationHowEn || "")}
              </p>
            </Card>
          </Card>

          <Card>
            <Kicker>{lang === "ta" ? "ஏன் தூண்டப்படுகிறது / குறைகிறது" : "Why it triggers or softens"}</Kicker>
            <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(whyText)}</p>
            {triggerBullets.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {triggerBullets.map((c, i) => (
                  <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {dosham.cancellationFactors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {dosham.cancellationFactors.map((c, i) => (
                  <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-high)", lineHeight: 1.5 }}>{"✓ "}{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
          </Card>

          {dosham.isPresent && (
            <Card variant="accent" style={{ background: "linear-gradient(120deg, var(--color-accent-muted), transparent)" }}>
              <Kicker color="var(--color-accent-strong)">{lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart"}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(powerText)}</p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                  {lang === "ta" ? "தீவிரம்" : "Severity"} · {strengthBand(dosham.strength, true, lang)}
                </span>
                {dosham.dashaActivated && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                    {lang === "ta" ? "தசையால் செயல்படுத்தப்பட்டது" : "Activated by current Dasha"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onNavigateToday}
                  style={{ marginLeft: "auto", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  {lang === "ta" ? "உங்கள் ஜாதகத்தில் காண்க" : "See it in your chart"}
                </button>
              </div>
            </Card>
          )}

          <DoshamFullGuide engineName={dosham.name} lang={lang} />
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {remedy && (
            <Card>
              <Kicker>{lang === "ta" ? "பரிகாரம்" : "Pariharam"}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-muted)" }}>
                {astroText(lang === "ta" ? remedy.ta : remedy.en)}
              </p>
            </Card>
          )}

          <Card>
            <Kicker color="var(--color-accent-secondary)">{lang === "ta" ? "உங்கள் குடும்பத்தில்" : "Check your family"}</Kicker>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-pill)", background: "var(--color-accent)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0 }}>
                  {lang === "ta" ? "நீ" : "Y"}
                </span>
                <span>{lang === "ta" ? "நீங்கள்" : "You"}</span>
              </div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: ownStatusColor, background: `${ownStatusColor}18`, border: `1px solid ${ownStatusColor}55`, borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}>
                {ownStatusLabel}
              </span>
            </div>
            {familyRows.map(({ mc, entry }) => {
              const color = doshamStatusColor(entry);
              return (
                <div key={mc.memberId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0 }}>
                      {mc.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span>{mc.displayName}</span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}>
                    {doshamStatusLabel(entry, lang)}
                  </span>
                </div>
              );
            })}
            {familyRows.length === 0 && (
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {lang === "ta" ? "வேறு குடும்ப ஜாதக தரவு இல்லை." : "No other family chart data available."}
              </p>
            )}
          </Card>

          {POROUTHAM_RELEVANT.has(key) && (
            <Card variant="dashed">
              <Kicker>{lang === "ta" ? "தொடர்புடையவை" : "Related"}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "இந்த தோஷம் பொருத்த பொருத்தத்திலும் கணக்கில் எடுத்துக்கொள்ளப்படுகிறது."
                  : "This dosham also factors into Porutham (marriage) compatibility matching."}
              </p>
            </Card>
          )}

          <NovaAskEntryChip
            label={lang === "ta" ? `${displayName(dosham.name, lang)} பற்றி கேளுங்கள்…` : `Ask about ${displayName(dosham.name, "en")}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள்" : "Ask"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>
    </div>
  );
}

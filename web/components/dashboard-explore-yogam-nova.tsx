"use client";

import { ArrowLeft } from "lucide-react";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type { ChartYogaInsight } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";
import { getYogaGuideForEngineName, type BiText } from "@/lib/guide-detail-content";
import { CollapsibleSection } from "./collapsible-section";

import {
  buildWhyText,
  displayName,
  getWhat,
  getYogaPowerContext,
  markerLabel,
  resolveYogaKey,
  strengthBand,
  YOGA_REMEDIES,
  yogaReadingStatus,
  yogaReadingStatusLabel,
} from "./dashboard-yoga-dosham-panel";
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { Card, Kicker } from "./ui";

/**
 * Nova personalised Yogam profile screen — mirrors
 * `dashboard-explore-dosham-nova.tsx`'s structure closely (same breadcrumb+
 * prev/next, hero, attribute band, two-column body, "check your family" rail
 * and Ask-entry chip) so the two feel like one system, not two designs.
 * Before this screen existed, the Yogam hub tile only opened the
 * chart-independent library viewer (`DashboardExploreGuideNova`, kind
 * "yogam") — no "present in your chart" framing at all, unlike Nakshatram
 * and Dosham which both already had a personalised detail screen. This
 * closes that gap: `personalChart.yogas` (every yoga the engine always
 * computes, present or not) drives both the list and detail screens here,
 * the same way `personalChart.doshams` drives the Dosham screens.
 *
 * Differences from Dosham's screen, driven by real shape differences in
 * `ChartYogaInsight` vs `ChartDoshamInsight`, not by choice:
 * - No `category` field on yogas, so there is no "mainly touches" attribute
 *   fact — replaced with a "Today's activation" fact using the engine's own
 *   `activationScore` (already shown as a badge in Classic's `YogaCard`).
 * - No `isCancelled` / `explanationWhat/Why/HowTa/En` fields on yogas (only
 *   `descriptionTa/En`), so there is no separate highlighted "how" callout
 *   box the way Dosham's screen has — the "What it actually means" card is
 *   a single paragraph from `getWhat`.
 * - `cancellationFactors` on a yoga means something that *weakens* an
 *   auspicious combination — the opposite polarity of a dosham's
 *   cancellation factors (which are good news, styled with a green
 *   checkmark on the Dosham screen). Styled here as a plain neutral list,
 *   matching Classic's own `YogaCard` treatment of the same field, not
 *   copied from Dosham's green styling.
 * - The "Remedies" rail card reuses `YOGA_REMEDIES` (dashboard-yoga-dosham-
 *   panel.tsx) exactly like Dosham's "Pariharam" card reuses
 *   `DOSHAM_REMEDIES` — and for the same reason, `YogamFullGuide` below
 *   omits the guide's own `remedies` block (heading "How to strengthen it")
 *   to avoid showing two overlapping remedy sections.
 * - There is no Porutham-relevant equivalent for yogas (that card on the
 *   Dosham screen reflects a real, grep-verified fact about
 *   `marriage_service.py` that has no yoga analogue) — omitted rather than
 *   invented.
 */

function YogamFullGuide({ engineName, lang }: { engineName: string; lang: Lang }) {
  const content = getYogaGuideForEngineName(engineName);
  if (!content) return null;
  const text = (v: BiText) => (lang === "ta" ? v.ta : v.en);

  return (
    <Card>
      <Kicker>{lang === "ta" ? "முழுமையான யோக வழிகாட்டி" : "Full yogam guide"}</Kicker>
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

function wrapIndex(i: number, length: number): number {
  return ((i % length) + length) % length;
}

export function yogaStatusLabel(y: ChartYogaInsight, lang: Lang): string {
  return yogaReadingStatusLabel(yogaReadingStatus(y), lang);
}

export function yogaStatusColor(y: ChartYogaInsight): string {
  const status = yogaReadingStatus(y);
  if (status === "ABSENT") return "var(--color-faint)";
  // Cancelled reads closer to absent than to present — the yoga formed, but
  // bhanga annulled it, so it must not carry a live yoga's colour weight.
  if (status === "CANCELLED") return "var(--color-muted)";
  if (y.strength === "STRONG") return "var(--color-high)";
  if (y.strength === "PARTIAL") return "var(--color-accent-strong)";
  return "var(--color-muted)";
}

/**
 * List-first index for the Yogam library — mirrors
 * `DashboardExploreDoshamListNova`. Every yoga here is already about the
 * signed-in user's own chart (`personalChart.yogas` is always the full,
 * fixed set the engine computes, present or not — never any-of-N
 * independent of the viewer), so the list doubles as a status summary
 * exactly like the Dosham list does.
 */
export function DashboardExploreYogamListNova({
  lang,
  yogas,
  onSelect,
  onBack,
}: {
  lang: Lang;
  yogas: ChartYogaInsight[];
  onSelect: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "யோகம்" : "Yogam"}
        currentLabel={lang === "ta" ? "அனைத்து யோகங்களும்" : "All yogas"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {yogas.map((y, i) => {
          const color = yogaStatusColor(y);
          return (
            <button
              key={y.name}
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
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: y.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
                {displayName(y.name, lang)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                {y.isPresent && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                    {strengthBand(y.strength, true, lang)}
                  </span>
                )}
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                  {yogaStatusLabel(y, lang)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardExploreYogamNovaProps {
  lang: Lang;
  yogas: ChartYogaInsight[];
  initialIndex: number;
  memberCharts: MemberChart[];
  onBack: () => void;
  onOpenAskVinaadi: () => void;
  onNavigateToday: () => void;
}

export function DashboardExploreYogamNova({
  lang,
  yogas,
  initialIndex,
  memberCharts,
  onBack,
  onOpenAskVinaadi,
  onNavigateToday,
}: DashboardExploreYogamNovaProps) {
  const [viewedIndex, setViewedIndex] = useState(() => wrapIndex(initialIndex, Math.max(yogas.length, 1)));
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  if (yogas.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <><ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "var(--space-1)" }} />{lang === "ta" ? "ஆராய்வுக்குத் திரும்பு" : "Back to Explore"}</>
        </button>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {lang === "ta" ? "யோக தரவு இல்லை." : "No yogam data available."}
        </p>
      </div>
    );
  }

  const yoga = yogas[wrapIndex(viewedIndex, yogas.length)];
  const prevYoga = yogas[wrapIndex(viewedIndex - 1, yogas.length)];
  const nextYoga = yogas[wrapIndex(viewedIndex + 1, yogas.length)];

  // A cancelled yoga is not an operating yoga: its remedies, its "what it can
  // do for you now" context and its "Present in your chart" badge must all go
  // quiet, or the page contradicts the cancellation it just printed.
  const readingStatus = yogaReadingStatus(yoga);
  const operating = readingStatus === "PRESENT";

  const remedy = operating ? resolveYogaKey(YOGA_REMEDIES, yoga.name) : undefined;

  const whatText = getWhat(
    yoga.name,
    true,
    lang,
    { ta: yoga.descriptionTa, en: yoga.descriptionEn },
    { ta: yoga.effectTa, en: yoga.effectEn },
  );
  const whyText = buildWhyText(yoga.conditionsMet, yoga.cancellationFactors, yoga.isPresent, false, yoga.dashaActivated, lang);
  const powerText = operating ? getYogaPowerContext(yoga.name, yoga.strength, yoga.dashaActivated, lang) : null;

  const ownStatusLabel = yogaStatusLabel(yoga, lang);
  const ownStatusColor = yogaStatusColor(yoga);

  const familyRows = memberCharts
    .map((mc) => ({ mc, entry: mc.chart?.yogas?.find((y) => y.name === yoga.name) ?? null }))
    .filter((row): row is { mc: MemberChart; entry: ChartYogaInsight } => row.entry !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Breadcrumb + yoga nav ===== */}
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "யோகம்" : "Yogam"}
        currentLabel={displayName(yoga.name, lang)}
        onPrev={{
          label: displayName(prevYoga.name, lang),
          onClick: () => setViewedIndex((i) => wrapIndex(i - 1, yogas.length)),
        }}
        onNext={{
          label: displayName(nextYoga.name, lang),
          onClick: () => setViewedIndex((i) => wrapIndex(i + 1, yogas.length)),
        }}
      />

      {/* ===== Hero ===== */}
      <NovaDetailHero
        kicker={lang === "ta" ? "யோக நூலகம்" : "Yogam library"}
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: 700, color: ownStatusColor, background: `${ownStatusColor}18`, border: `1px solid ${ownStatusColor}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
            {readingStatus === "PRESENT"
              ? `${lang === "ta" ? "உங்கள் ஜாதகத்தில் உள்ளது" : "Present in your chart"} · ${strengthBand(yoga.strength, true, lang)}`
              : readingStatus === "CANCELLED"
                ? (lang === "ta" ? "அமைந்தது; நிவர்த்தியால் பலனற்றது" : "Formed, but cancelled by bhanga")
                : (lang === "ta" ? "உங்கள் ஜாதகத்தில் இல்லை" : "Not present in your chart")}
          </span>
        }
        titleMain={displayName(yoga.name, lang)}
        prose={astroText(whatText)}
      />

      {/* ===== Attribute band ===== */}
      <NovaAttributeBand
        facts={[
          { label: lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart", value: ownStatusLabel },
          { label: lang === "ta" ? "பலம்" : "Strength", value: strengthBand(yoga.strength, yoga.isPresent, lang) },
          {
            label: lang === "ta" ? "தசை" : "Dasha",
            value: yoga.dashaActivated
              ? (lang === "ta" ? "இப்போது செயல்பாட்டில்" : "Active now")
              : (lang === "ta" ? "இப்போது செயல்படவில்லை" : "Not active now"),
          },
          {
            label: lang === "ta" ? "இன்றைய செயல்பாடு" : "Today's activation",
            value: `${yoga.activationScore}/100`,
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
          </Card>

          <Card>
            <Kicker>{lang === "ta" ? "ஏன் உங்கள் ஜாதகத்தில் உள்ளது" : "Why your chart has this"}</Kicker>
            <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(whyText)}</p>
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {yoga.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
                </p>
                <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {yoga.cancellationFactors.map((c, i) => (
                    <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{markerLabel(c, lang)}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {yoga.isPresent && powerText && (
            <Card variant="accent" style={{ background: "linear-gradient(120deg, var(--color-accent-muted), transparent)" }}>
              <Kicker color="var(--color-accent-strong)">{lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart"}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(powerText)}</p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                  {lang === "ta" ? "பலம்" : "Strength"} · {strengthBand(yoga.strength, true, lang)}
                </span>
                {yoga.dashaActivated && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                    {lang === "ta" ? "இப்போது செயலில் உள்ளது (உங்கள் தற்போதைய கிரக காலம் இதைத் தூண்டுகிறது)" : "Active right now (your current planetary period is triggering it)"}
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

          <YogamFullGuide engineName={yoga.name} lang={lang} />
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {remedy && (
            <Card>
              <Kicker>{lang === "ta" ? "யோகத்தை பலப்படுத்துவது எப்படி" : "How to strengthen this"}</Kicker>
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
              const color = yogaStatusColor(entry);
              return (
                <div key={mc.memberId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0 }}>
                      {mc.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span>{mc.displayName}</span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}>
                    {yogaStatusLabel(entry, lang)}
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

          <NovaAskEntryChip
            label={lang === "ta" ? `${displayName(yoga.name, lang)} பற்றி கேளுங்கள்…` : `Ask about ${displayName(yoga.name, "en")}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள்" : "Ask"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>
    </div>
  );
}

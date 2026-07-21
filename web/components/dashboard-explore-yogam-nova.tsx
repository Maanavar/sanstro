"use client";

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
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, NovaKicker, novaDetailCardStyle } from "./dashboard-explore-detail-nova";

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
    <div style={cardStyle}>
      <NovaKicker>{lang === "ta" ? "முழுமையான யோக வழிகாட்டி" : "Full yogam guide"}</NovaKicker>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {content.sections.map((section, i) => (
          <CollapsibleSection key={i} title={text(section.heading)} defaultOpen={i === 0}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {section.body.map((p, j) => (
                <p key={j} style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "13px", lineHeight: 1.7, color: "var(--color-text)" }}>
                  {text(p)}
                </p>
              ))}
            </div>
          </CollapsibleSection>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <CollapsibleSection title={lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {content.bringCards.map((cat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {content.faq && content.faq.length > 0 && (
          <CollapsibleSection title={lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {content.faq.map((item, i) => (
                <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none", paddingTop: i > 0 ? "12px" : 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(item.a)}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
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

const cardStyle = novaDetailCardStyle;

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
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "யோகம்" : "Yogam"}
        currentLabel={lang === "ta" ? "அனைத்து யோகங்களும்" : "All yogas"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {yogas.map((y, i) => {
          const color = yogaStatusColor(y);
          return (
            <button
              key={y.name}
              type="button"
              onClick={() => onSelect(i)}
              style={{
                ...cardStyle,
                gap: "6px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600, color: y.isPresent ? "var(--color-text-strong)" : "var(--color-faint)" }}>
                {displayName(y.name, lang)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {y.isPresent && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 10px" }}>
                    {strengthBand(y.strength, true, lang)}
                  </span>
                )}
                <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 10px" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {lang === "ta" ? "← ஆராய்வுக்குத் திரும்பு" : "← Back to Explore"}
        </button>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: 700, color: ownStatusColor, background: `${ownStatusColor}18`, border: `1px solid ${ownStatusColor}55`, borderRadius: "999px", padding: "5px 12px" }}>
            {readingStatus === "PRESENT"
              ? `${lang === "ta" ? "உங்கள் ஜாதகத்தில் உள்ளது" : "Present in your chart"} · ${strengthBand(yoga.strength, true, lang)}`
              : readingStatus === "CANCELLED"
                ? (lang === "ta" ? "அமைந்தது; நிவர்த்தியால் பலனற்றது" : "Formed, but cancelled by bhanga")
                : (lang === "ta" ? "உங்கள் ஜாதகத்தில் இல்லை" : "Not present in your chart")}
          </span>
        }
        titleMain={displayName(yoga.name, "en")}
        titleSecondary={displayName(yoga.name, "ta")}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <NovaKicker>{lang === "ta" ? "இது உண்மையில் என்ன பொருள்" : "What it actually means"}</NovaKicker>
            <p style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "13.5px", lineHeight: 1.7, color: "var(--color-text)" }}>
              {astroText(whatText)}
            </p>
          </div>

          <div style={cardStyle}>
            <NovaKicker>{lang === "ta" ? "ஏன் உங்கள் ஜாதகத்தில் உள்ளது" : "Why your chart has this"}</NovaKicker>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(whyText)}</p>
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {yoga.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "10.5px", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {yoga.cancellationFactors.map((c, i) => (
                    <li key={i} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{markerLabel(c, lang)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {yoga.isPresent && powerText && (
            <div style={{ ...cardStyle, background: "linear-gradient(120deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)" }}>
              <NovaKicker color="var(--color-accent-strong)">{lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart"}</NovaKicker>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--color-text)" }}>{astroText(powerText)}</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "5px 12px" }}>
                  {lang === "ta" ? "பலம்" : "Strength"} · {strengthBand(yoga.strength, true, lang)}
                </span>
                {yoga.dashaActivated && (
                  <span style={{ fontSize: "11.5px", color: "var(--color-text)", background: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "5px 12px" }}>
                    {lang === "ta" ? "தசையால் செயல்படுத்தப்பட்டது" : "Activated by current Dasha"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onNavigateToday}
                  style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  {lang === "ta" ? "உங்கள் ஜாதகத்தில் காண்க →" : "See it in your chart →"}
                </button>
              </div>
            </div>
          )}

          <YogamFullGuide engineName={yoga.name} lang={lang} />
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {remedy && (
            <div style={cardStyle}>
              <NovaKicker>{lang === "ta" ? "யோகத்தை பலப்படுத்துவது எப்படி" : "How to strengthen this"}</NovaKicker>
              <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-muted)" }}>
                {astroText(lang === "ta" ? remedy.ta : remedy.en)}
              </p>
            </div>
          )}

          <div style={cardStyle}>
            <NovaKicker color="var(--color-accent-secondary)">{lang === "ta" ? "உங்கள் குடும்பத்தில்" : "Check your family"}</NovaKicker>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, flexShrink: 0 }}>
                  {lang === "ta" ? "நீ" : "Y"}
                </span>
                <span>{lang === "ta" ? "நீங்கள்" : "You"}</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: ownStatusColor, background: `${ownStatusColor}18`, border: `1px solid ${ownStatusColor}55`, borderRadius: "5px", padding: "2px 8px" }}>
                {ownStatusLabel}
              </span>
            </div>
            {familyRows.map(({ mc, entry }) => {
              const color = yogaStatusColor(entry);
              return (
                <div key={mc.memberId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, flexShrink: 0 }}>
                      {mc.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span>{mc.displayName}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "5px", padding: "2px 8px" }}>
                    {yogaStatusLabel(entry, lang)}
                  </span>
                </div>
              );
            })}
            {familyRows.length === 0 && (
              <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {lang === "ta" ? "வேறு குடும்ப ஜாதக தரவு இல்லை." : "No other family chart data available."}
              </p>
            )}
          </div>

          <NovaAskEntryChip
            label={lang === "ta" ? `${displayName(yoga.name, lang)} பற்றி கேளுங்கள்…` : `Ask about ${displayName(yoga.name, "en")}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள் ✦" : "Ask ✦"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

// Chapter 2 · Your nine planets (FTR-11, FTR-12). Today's "Where your planets
// are placed" tab printed 10-13 labelled paragraphs per planet, all open — 80%
// of the whole reading's words. Here each planet is a tile (glyph, one strength
// word, one domain), and a tapped planet reads meaning → at most two "why"
// lines → everything else behind one more tap. Its aspects draw on the chart.

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartExplanationFacet, ChartExplanationPlanet } from "@/lib/types";

import { GRAHA_DOMAIN, ORB_GRADIENTS, strengthReassurance, strengthVerdict } from "../dashboard-hybrid-parts";
import { GlossaryTerm } from "../glossary-term";
import { Disclosure, SouthGrid, StrengthMeter, ToneBadge } from "./graphics";
import { ScoreBreakdown } from "./reading-atoms";
import { aspectLinesFor, houseOrdinal, houseTheme, isActiveNow, orderedPlanets, whyFacets } from "./reading-selectors";
import { SeeAlso, StoryCard, bodyText, quietText, srOnly, type StoryProps } from "./story-parts";

const pick = (text: { en: string; ta: string }, lang: Lang) => (lang === "ta" ? text.ta : text.en);

function FacetLine({ facet, lang }: { facet: ChartExplanationFacet; lang: Lang }) {
  const Icon = facet.tone === "CAUTION" ? AlertTriangle : facet.tone === "BOOST" ? CheckCircle2 : Sparkles;
  const color = facet.tone === "CAUTION" ? "var(--color-low)" : facet.tone === "BOOST" ? "var(--color-high)" : "var(--color-mid)";
  return (
    <li style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: "var(--space-2)", alignItems: "start" }}>
      <Icon size={16} strokeWidth={2.25} aria-hidden style={{ color, marginTop: "3px" }} />
      <span style={quietText}>
        <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{pick(facet.label, lang)}: </span>
        {pick(facet.value, lang)}
      </span>
    </li>
  );
}

export function ChapterPlanets({ lang, chart, explanation, onOpenSection }: StoryProps) {
  const planets: ChartExplanationPlanet[] = orderedPlanets(explanation?.planets ?? []);
  const [selected, setSelected] = useState<string | null>(null);

  if (planets.length === 0) {
    return (
      <p style={quietText}>
        {lang === "ta" ? "இந்த ஜாதகத்துக்கான கிரக விளக்கம் இப்போது கிடைக்கவில்லை." : "The planet reading isn't available for this chart right now."}
      </p>
    );
  }

  const planet = planets.find((p) => p.graha === selected) ?? null;
  const lines = aspectLinesFor(selected, explanation?.aspects ?? [], planets);
  const mutual = lines.filter((l) => l.mutual).map((l) => tPlanetLord(l.to, lang));
  const looksAt = lines.filter((l) => l.from === selected && !l.mutual).map((l) => tPlanetLord(l.to, lang));
  const lookedAtBy = lines.filter((l) => l.to === selected).map((l) => tPlanetLord(l.from, lang));
  const why = planet ? whyFacets(planet, explanation?.story) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(132px, 100%), 1fr))", gap: "var(--space-2)" }}>
        {planets.map((p) => {
          const active = isActiveNow(p, explanation?.story);
          const on = p.graha === selected;
          const grad = ORB_GRADIENTS[p.graha];
          return (
            <div role="listitem" key={p.graha} style={{ display: "flex", minWidth: 0 }}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(on ? null : p.graha)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "var(--space-1)",
                  padding: "var(--space-2_5) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${on ? "var(--color-text-strong)" : "var(--color-border)"}`,
                  background: on ? "var(--color-surface-soft)" : "var(--color-surface)",
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%" }}>
                  <span aria-hidden style={{ width: "20px", height: "20px", borderRadius: "50%", background: grad?.orb, boxShadow: grad ? `0 0 8px ${grad.glow}` : undefined, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(p.graha, lang)}</span>
                  {active && (
                    <>
                      <span
                        aria-hidden
                        className="nova-pulse-dot"
                        style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-high)" }}
                      />
                      <span style={srOnly}>{lang === "ta" ? "இப்போது இயங்குகிறது" : "Active now"}</span>
                    </>
                  )}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.35 }}>
                  {GRAHA_DOMAIN[p.graha] ? pick(GRAHA_DOMAIN[p.graha], lang) : ""}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1) var(--space-1_5)", flexWrap: "wrap" }}>
                  <StrengthMeter score={p.strengthScore} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text)" }}>{strengthVerdict(p.strengthScore, lang)}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {!planet ? (
        <p style={quietText}>
          {lang === "ta"
            ? "ஒரு கிரகத்தைத் தொட்டால், அது உங்களுக்கு என்ன செய்கிறது, ஏன், யாரைப் பார்க்கிறது என்று தெரியும். பச்சைப் புள்ளி = இப்போது நடக்கும் தசையை நடத்தும் கிரகம்."
            : "Tap a planet to see what it does for you, why, and who it looks at. A green dot marks a planet running one of your current periods."}
        </p>
      ) : (
        <div className="cr-rise" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)", alignItems: "start" }}>
          <StoryCard>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {tPlanetLord(planet.graha, lang)}
              </span>
              {isActiveNow(planet, explanation?.story) && <ToneBadge tone="good">{lang === "ta" ? "இப்போது இயங்குகிறது" : "Active now"}</ToneBadge>}
            </div>
            <p style={bodyText}>
              {lang === "ta"
                ? `உங்கள் ${planet.houseFromLagna}-ஆம் வீட்டின் வழியாகச் செயல்படும் — ${houseTheme(planet.houseFromLagna, lang)}.`
                : `Works through your ${houseOrdinal(planet.houseFromLagna, lang)} — ${houseTheme(planet.houseFromLagna, lang)}.`}{" "}
              {strengthReassurance(planet.strengthScore, lang)}
            </p>
            {why.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {why.map((facet) => (
                  <FacetLine key={facet.key} facet={facet} lang={lang} />
                ))}
              </ul>
            )}
            <Disclosure
              label={lang === "ta" ? `எல்லா விவரங்களும் (${planet.facets?.length ?? 0})` : `All ${planet.facets?.length ?? 0} details`}
              openLabel={lang === "ta" ? "விவரங்களை மூடு" : "Hide details"}
            >
              <dl style={{ margin: 0, display: "grid", gap: "var(--space-2)" }}>
                {(planet.facets ?? []).map((facet) => (
                  <div key={facet.key}>
                    <dt style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)" }}>{pick(facet.label, lang)}</dt>
                    <dd style={{ margin: 0, ...quietText }}>{pick(facet.value, lang)}</dd>
                  </div>
                ))}
              </dl>
              <ScoreBreakdown planet={planet} lang={lang} />
            </Disclosure>
            <SeeAlso
              label={lang === "ta" ? "கிரக நிலைகள் பகுதியில் முழு அட்டை" : "Full card in Planet positions"}
              onClick={onOpenSection ? () => onOpenSection("planets") : undefined}
            />
          </StoryCard>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <SouthGrid
              lang={lang}
              lagnaRasi={chart.lagna.rasi}
              planets={planets}
              highlightGraha={planet.graha}
              lines={lines}
              ariaLabel={
                lang === "ta"
                  ? `${tPlanetLord(planet.graha, lang)} பார்க்கும் கிரகங்கள், ஜாதகக் கட்டத்தில்`
                  : `${tPlanetLord(planet.graha, lang)}'s aspects, drawn on the chart`
              }
            />
            {/* The legend sits under the map, not in its centre, where the
                aspect lines run straight through it. */}
            <p style={{ ...quietText, fontSize: "var(--text-xs)" }}>
              <GlossaryTerm term="drishti" lang={lang}>{lang === "ta" ? "பார்வை" : "Drishti"}</GlossaryTerm>
              {lang === "ta" ? ": — பார்க்கிறது · - - பார்க்கப்படுகிறது · ↔ ஒன்றையொன்று" : ": — looks at · - - looked at by · ↔ mutual"}
            </p>
            <p style={quietText}>
              {looksAt.length === 0 && lookedAtBy.length === 0 && mutual.length === 0
                ? lang === "ta"
                  ? "இந்தக் கிரகத்துக்கு வேறு கிரகத்துடன் நேரடிப் பார்வைத் தொடர்பு இல்லை."
                  : "No direct aspect links with another planet."
                : [
                    mutual.length ? `${lang === "ta" ? "ஒன்றையொன்று பார்க்கின்றன" : "Mutual aspect with"}: ${mutual.join(", ")}` : null,
                    looksAt.length ? `${lang === "ta" ? "பார்க்கிறது" : "Looks at"}: ${looksAt.join(", ")}` : null,
                    lookedAtBy.length ? `${lang === "ta" ? "பார்க்கப்படுகிறது" : "Looked at by"}: ${lookedAtBy.join(", ")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

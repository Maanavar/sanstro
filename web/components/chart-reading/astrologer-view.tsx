"use client";

// The Astrologer view (FTR-05/06): every field the engine computes, laid out
// for a reader who already knows the vocabulary. The ten mechanism tabs were
// the whole Full technical reading until the Story view took the default
// slot; they moved here unchanged and gained the ledgers at the top of the
// positions, functional and drishti tabs.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { rasiDisplayName } from "@/lib/chart-utils";
import { useRequestedDosham } from "@/lib/dosham-deep-link";
import { tNakshatra } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartDoshamInsight,
  ChartExplanationData,
  ChartSummaryData,
  ChartYogaInsight,
  DashaTimelineItem,
  DashaTimelineResponseData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { YogaDoshamPanel } from "../dashboard-yoga-dosham-panel";
import { Card } from "../ui/card";
import { Kicker } from "../ui/kicker";
import {
  type SectionId,
  KENDRA_HOUSES,
  TRIKONA_HOUSES,
  DUSTHANA_HOUSES,
  HOUSE_MEANING,
  HOUSE_GROUP_COPY,
  SECTION_META,
} from "../dashboard-chart-explanation-data";
import {
  tx,
  rasiName,
  ordinalHouse,
  displayPlanet,
  aspectTypeLabel,
  normalizePlanet,
  strengthColor,
  strengthLabel,
  dignityFor,
  planetFlags,
  relationshipBetween,
  relationshipLabel,
  relationshipColor,
  periodLevelLabel,
  activationToneLabel,
  activationToneColor,
  signalTypeLabel,
  NODES,
  conjunctionGroups,
  mutualSeventhAspects,
  aspectHousesFromHouse,
  transitAspectSummary,
  touchedPlanetMeaning,
  houseGroupLabel,
  planetHouseMeaning,
  natureLabel,
  natureNote,
  classifySaniFromMoon,
  classifyKandakaFromMoon,
  guruMoonQuality,
  guruQualityCopy,
  formatPeyarchiDate,
  saniCycleLabel,
  findTransit,
  transitBindus,
  binduReading,
  strongestPlanet,
  weakestPlanet,
} from "./reading-helpers";
import { DrishtiLedger, GrahaLedger, LordshipLedger, MethodNote, ShareWithAstrologer } from "./astrologer-ledgers";
import { Chip, DetailRow, ScoreBreakdown } from "./reading-atoms";

export type AstrologerViewProps = {
  lang: Lang;
  chart: ChartCalculateResponseData;
  explanation?: ChartExplanationData | null;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  renderYogaDoshamPanel?: (props: { lang: Lang; yogas: ChartYogaInsight[]; doshams: ChartDoshamInsight[] }) => ReactNode;
};

export function AstrologerView({
  lang,
  chart,
  explanation,
  summary,
  transit,
  sani,
  peyarchiUpcoming,
  dasha,
  dashaAntar,
  renderYogaDoshamPanel,
}: AstrologerViewProps) {
  // Sticky-tab redesign: only one section's content shows at a time (picked from
  // the tab strip) instead of a 10-deep vertical accordion stack where sections
  // were easy to miss and hard to jump between.
  const [activeSection, setActiveSection] = useState<SectionId>("basics");
  // "See the full reckoning" for a dosham lands on the Yogas & Doshams section
  // (lib/dosham-deep-link); the card then opens itself.
  const requestedDosham = useRequestedDosham();
  useEffect(() => {
    if (requestedDosham) setActiveSection("yogas");
  }, [requestedDosham]);

  // Same scroll-anchoring workaround as collapsible-section.tsx: swapping a
  // section unmounts a large block, and the browser's native anchoring can
  // land the viewport somewhere unrelated. Pin the clicked control's
  // viewport position across the state change.
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const anchorEl = useRef<HTMLElement | null>(null);
  const anchorTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (anchorTop.current === null || !anchorEl.current) return;
    const drift = anchorEl.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorEl.current = null;
    anchorTop.current = null;
  }, [activeSection]);
  function pinTo(el: HTMLElement | null) {
    anchorEl.current = el;
    anchorTop.current = el ? el.getBoundingClientRect().top : null;
  }

  const backend = explanation ?? null;

  const derived = useMemo(() => {
    const moon = chart.planets.find((planet) => normalizePlanet(planet.graha) === "MOON") ?? null;
    const conjunctions = conjunctionGroups(chart);
    const seventhAspects = mutualSeventhAspects(chart.planets);
    const strong = strongestPlanet(chart.planets);
    const weak = weakestPlanet(chart.planets);
    const kendraPlanets = chart.planets.filter((planet) => KENDRA_HOUSES.has(planet.houseFromLagna));
    const trikonaPlanets = chart.planets.filter((planet) => TRIKONA_HOUSES.has(planet.houseFromLagna));
    const dusthanaPlanets = chart.planets.filter((planet) => DUSTHANA_HOUSES.has(planet.houseFromLagna));
    const jupiterTransit = findTransit(transit, "JUPITER");
    const saturnTransit = findTransit(transit, "SATURN");
    const saturnFromMoon = sani?.positionFromMoon ?? saturnTransit?.houseFromMoon ?? null;
    const saturnFromLagna = sani?.positionFromLagna ?? saturnTransit?.houseFromLagna ?? null;
    const saniStage = classifySaniFromMoon(saturnFromMoon);
    const kandakaStage = classifyKandakaFromMoon(saturnFromMoon);
    return {
      moon,
      conjunctions,
      seventhAspects,
      strong,
      weak,
      kendraPlanets,
      trikonaPlanets,
      dusthanaPlanets,
      jupiterTransit,
      saturnTransit,
      saturnFromMoon,
      saturnFromLagna,
      saniStage,
      kandakaStage,
    };
  }, [chart, transit, sani]);

  const dashaLabel = dasha
    ? `${displayPlanet(dasha.current.mahadasha.lord, lang)} ${lang === "ta" ? "தசை" : "Dasa"} / ${displayPlanet(dasha.current.antardasha.lord, lang)} ${lang === "ta" ? "புக்தி" : "Bhukti"}`
    : summary
      ? `${displayPlanet(summary.currentMahadasha, lang)} / ${displayPlanet(summary.currentAntardasha, lang)}`
      : lang === "ta"
        ? "தசை தரவு இல்லை"
        : "Dasa data unavailable";

  const currentAntar = dasha?.current.pratyantardasha.lord ?? dashaAntar.find((item) => item.level === "antar")?.lord ?? null;
  const guruEvent = peyarchiUpcoming.find((event) => event.planet === "JUPITER") ?? null;
  const saniEvent = peyarchiUpcoming.find((event) => event.planet === "SATURN") ?? null;
  const rahuEvent = peyarchiUpcoming.find((event) => event.planet === "RAHU") ?? null;
  const ketuEvent = peyarchiUpcoming.find((event) => event.planet === "KETU") ?? null;
  const coreIdentity = backend?.coreIdentity ?? null;
  const backendPlanets = backend?.planets ?? null;
  const backendConjunctions = backend?.conjunctions ?? null;
  const backendAspects = backend?.aspects ?? null;
  const backendHouseGroups = backend?.houseGroups ?? null;
  const backendFunctionalNature = backend?.functionalNature ?? null;
  const backendYogaDosham = backend?.yogaDosham ?? null;
  const backendCurrentActivation = backend?.currentActivation ?? null;
  const backendSummary = backend?.summary ?? null;
  const backendPeyarchi = backend?.peyarchi ?? null;
  const functionalNatureEntries = Object.entries(backendFunctionalNature ?? summary?.functionalNature ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", overflowAnchor: "none" }}>
      {/* The school before the reading (FTR-06): house system, node aspects. */}
      {backend?.methodNote && <MethodNote lang={lang} note={backend.methodNote} />}
      {backend?.chartId && <ShareWithAstrologer lang={lang} chartId={backend.chartId} />}
      {/* Sticky section tab strip — horizontally scrollable on narrow widths */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={lang === "ta" ? "விளக்கப் பிரிவுகள்" : "Reading sections"}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          display: "flex",
          gap: "var(--space-1_5)",
          overflowX: "auto",
          padding: "var(--space-1_5) 0",
          background: "var(--color-surface-soft)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {SECTION_META.map((section) => {
          const active = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                pinTo(tablistRef.current);
                setActiveSection(section.id);
              }}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                padding: "var(--space-1_5) var(--space-3)",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid",
                borderColor: active ? "var(--color-text-strong)" : "var(--color-border)",
                background: active ? "var(--color-text-strong)" : "transparent",
                color: active ? "var(--color-bg)" : "var(--color-muted)",
                fontSize: "var(--text-base)",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {tx(section.title, lang)}
            </button>
          );
        })}
      </div>
      {/* Active section content — one section at a time */}
      {SECTION_META.filter((section) => section.id === activeSection).map((section) => (
        <div key={section.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.35 }}>
            {tx(section.hint, lang)}
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
          {section.id === "basics" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-muted)" }}>
                {coreIdentity
                  ? tx(coreIdentity.explanation, lang)
                  : lang === "ta"
                    ? "இந்த D1 ஜாதகம் லக்னத்தை மையமாக வைத்து 12 வீடுகள், சந்திர ராசி, கிரக நிலைகள், நட்சத்திரங்கள் ஆகியவற்றை காட்டுகிறது. D9 நவாம்சம் கிரகத்தின் உள்ளார்ந்த பலத்தை கூடுதல் அடுக்காக பார்க்க உதவும்."
                    : "This D1 chart reads the 12 houses from the Lagna and shows the Moon sign, planets, and nakshatras. D9 Navamsa adds a second layer for deeper planetary strength."}
              </p>
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <DetailRow
                  label={lang === "ta" ? "லக்னம்" : "Lagna"}
                  value={coreIdentity
                    ? rasiDisplayName(coreIdentity.lagnaRasi, lang)
                    : `${rasiName(chart.lagna.rasi, lang)} - ${tNakshatra(chart.lagna.nakshatraName, lang)} ${lang === "ta" ? "பாதம்" : "Pada"} ${chart.lagna.pada}`}
                />
                {[coreIdentity?.lagnaEdgeNote, coreIdentity?.navamsaLagnaEdgeNote].map((note, index) =>
                  note ? (
                    <p
                      key={index}
                      role="note"
                      style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-text)" }}
                    >
                      {tx(note, lang)}
                    </p>
                  ) : null,
                )}
                <DetailRow
                  label={lang === "ta" ? "சந்திரன்" : "Moon"}
                  value={
                    coreIdentity
                      ? `${rasiDisplayName(coreIdentity.moonRasi, lang)} - ${tNakshatra(coreIdentity.janmaNakshatra, lang)} ${lang === "ta" ? "பாதம்" : "Pada"} ${coreIdentity.janmaPada}`
                      : derived.moon
                      ? `${rasiName(derived.moon.rasi, lang)} - ${tNakshatra(derived.moon.nakshatraName, lang)} ${lang === "ta" ? "பாதம்" : "Pada"} ${derived.moon.pada}`
                      : (lang === "ta" ? "சந்திர தரவு இல்லை" : "Moon data unavailable")
                  }
                />
                <DetailRow
                  label={lang === "ta" ? "நடப்பு தசை" : "Current Dasa"}
                  value={coreIdentity
                    ? `${displayPlanet(coreIdentity.currentMahadasha, lang)} / ${displayPlanet(coreIdentity.currentAntardasha, lang)}`
                    : dashaLabel}
                />
                <DetailRow
                  label={lang === "ta" ? "நடப்பு அந்தரம்" : "Current Antaram"}
                  value={coreIdentity
                    ? displayPlanet(coreIdentity.currentPratyantardasha, lang)
                    : currentAntar ? displayPlanet(currentAntar, lang) : (lang === "ta" ? "தரவு இல்லை" : "Unavailable")}
                />
              </div>
            </div>
          )}

          {section.id === "activation" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {backendCurrentActivation ? (
                <>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-muted)" }}>
                    {tx(backendCurrentActivation.explanation, lang)}
                  </p>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <DetailRow
                      label={lang === "ta" ? "தசைச் சங்கிலி" : "Dasa chain"}
                      value={tx(backendCurrentActivation.periodSummary, lang)}
                    />
                    <DetailRow
                      label={lang === "ta" ? "கோச்சார நிலை" : "Transit status"}
                      value={tx(backendCurrentActivation.transitSummary, lang)}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    {backendCurrentActivation.activeLords.map((item) => (
                      <Card key={`${item.level}-${item.lord}`} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)", flexWrap: "wrap" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {periodLevelLabel(item.level, lang)} - {displayPlanet(item.lord, lang)}
                            </p>
                            <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.45 }}>
                              {formatPeyarchiDate(item.startDate)} - {formatPeyarchiDate(item.endDate)}
                            </p>
                          </div>
                          <Chip color={activationToneColor(item.periodTone)}>{activationToneLabel(item.periodTone, lang)}</Chip>
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", margin: "var(--space-2) 0" }}>
                          <Chip>{lang === "ta" ? "பிறப்பு" : "Natal"}: {ordinalHouse(item.natalHouseFromLagna, lang)}</Chip>
                          <Chip>{lang === "ta" ? "சந்திரனிலிருந்து" : "From Moon"}: {ordinalHouse(item.natalHouseFromMoon, lang)}</Chip>
                          <Chip>{natureLabel(item.functionalNature, lang)}</Chip>
                          <Chip>{Math.round(item.natalStrengthScore)}/100</Chip>
                          <Chip>{lang === "ta" ? "கோச்சாரம்" : "Transit"}: {ordinalHouse(item.transitHouseFromLagna, lang)}</Chip>
                          {item.transitIsRetrograde && <Chip>{lang === "ta" ? "வக்கிரம்" : "Retrograde"}</Chip>}
                        </div>
                        <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {tx(item.explanation, lang)}
                        </p>
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          {item.transitSignals.length > 0
                            ? item.transitSignals.map((signal, index) => (
                                <Chip key={`${item.level}-${item.lord}-${signal.sourcePlanet}-${signal.signalType}-${index}`}>
                                  {displayPlanet(signal.sourcePlanet, lang)}: {signalTypeLabel(signal.signalType, lang)}
                                </Chip>
                              ))
                            : <Chip>{lang === "ta" ? "நேரடி பெரிய கோச்சார தொடுதல் இல்லை" : "No direct major transit contact"}</Chip>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  <DetailRow label={lang === "ta" ? "நடப்பு தசை" : "Current Dasa"} value={dashaLabel} />
                  <DetailRow
                    label={lang === "ta" ? "நடப்பு அந்தரம்" : "Current Antaram"}
                    value={currentAntar ? displayPlanet(currentAntar, lang) : (lang === "ta" ? "தரவு இல்லை" : "Unavailable")}
                  />
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta"
                      ? "இந்த ஜாதகத்துக்கான விரிவான தசை விளக்கம் இப்போது கிடைக்கவில்லை."
                      : "The detailed period reading isn't available for this chart right now."}
                  </p>
                </div>
              )}
            </div>
          )}

          {section.id === "positions" && (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {backendPlanets && <GrahaLedger lang={lang} planets={backendPlanets} />}
              {backendPlanets ? (
                backendPlanets.map((planet) => {
                  const color = strengthColor(planet.strengthScore);
                  const flags = [
                    // Rahu and Ketu are retrograde every day of their
                    // existence, so the badge distinguishes nothing on them
                    // and reads as noise. The backend already excludes them
                    // (PlanetPosition.showRetrogradeBadge); this is the
                    // client-side half of the same rule.
                    planet.isRetrograde && !NODES.has(planet.graha)
                      ? (lang === "ta" ? "வக்கிரம்" : "Retrograde")
                      : null,
                    planet.isCazimi ? (lang === "ta" ? "கசிமி" : "Cazimi") : null,
                    planet.isCombust ? (lang === "ta" ? "அஸ்தம்" : "Combust") : null,
                    planet.isVargottama ? (lang === "ta" ? "வர்கோத்தமம்" : "Vargottama") : null,
                    planet.isPlanetaryWar
                      ? (lang === "ta" ? "கிரக யுத்தம்" : "Graha yuddham")
                      : null,
                  ].filter(Boolean) as string[];
                  return (
                    <Card
                      key={planet.graha}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(92px, 0.7fr) minmax(0, 2fr)",
                        gap: "var(--space-3)",
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div>
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                          {displayPlanet(planet.graha, lang)}
                        </p>
                        <Chip color={color}>{Math.round(planet.strengthScore)}/100</Chip>
                        <ScoreBreakdown planet={planet} lang={lang} />
                      </div>
                      <div style={{ display: "grid", gap: "var(--space-1_5)" }}>
                        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>
                          {ordinalHouse(planet.houseFromLagna, lang)} - {rasiName(planet.rasi, lang)} - {tNakshatra(planet.nakshatraName, lang)}{" "}
                          {lang === "ta" ? "பாதம்" : "Pada"} {planet.pada}
                        </p>
                        {/* Prefer the labelled facet lines. The single
                            paragraph concatenated placement + dignity +
                            role + dasha + transit + conditions and tacked
                            "D9: <rasi>." on the end, which is accurate and
                            close to unscannable. Falls back to that
                            paragraph for responses that predate facets. */}
                        {planet.facets && planet.facets.length > 0 ? (
                          <dl style={{ margin: 0, display: "grid", gap: "var(--space-1)" }}>
                            {planet.facets.map((facet) => (
                              <div key={facet.key} style={{ display: "grid", gap: "var(--space-1)" }}>
                                <dt
                                  style={{
                                    fontSize: "var(--text-xs)",
                                    fontWeight: 700,
                                    letterSpacing: "0.03em",
                                    textTransform: "uppercase",
                                    color:
                                      facet.tone === "BOOST"
                                        ? "var(--color-high)"
                                        : facet.tone === "CAUTION"
                                          ? "var(--color-mid)"
                                          : "var(--color-faint)",
                                  }}
                                >
                                  {tx(facet.label, lang)}
                                </dt>
                                <dd style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                                  {tx(facet.value, lang)}
                                </dd>
                              </div>
                            ))}
                            <div style={{ display: "grid", gap: "var(--space-1)" }}>
                              <dt style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                                {lang === "ta" ? "நவாம்சம் (D9)" : "Navamsa (D9)"}
                              </dt>
                              <dd style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                                {rasiName(planet.d9Rasi, lang)}
                              </dd>
                            </div>
                          </dl>
                        ) : (
                          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                            {tx(planet.explanation, lang)} D9: {rasiName(planet.d9Rasi, lang)}.
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          <Chip color={color}>{strengthLabel(planet.strengthScore, lang)}</Chip>
                          <Chip>{houseGroupLabel(planet.houseGroup, lang)}</Chip>
                          <Chip>{natureLabel(planet.functionalNature, lang)}</Chip>
                          {flags.length > 0
                            ? flags.map((flag) => <Chip key={flag}>{flag}</Chip>)
                            : <Chip>{lang === "ta" ? "சிறப்பு குறி இல்லை" : "No special flag"}</Chip>}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                chart.planets.map((planet) => {
                  const color = strengthColor(planet.strengthScore);
                  const flags = planetFlags(planet, lang);
                  return (
                    <Card
                      key={planet.graha}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(92px, 0.7fr) minmax(0, 2fr)",
                        gap: "var(--space-3)",
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div>
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                          {displayPlanet(planet.graha, lang)}
                        </p>
                        <Chip color={color}>
                          {planet.strengthScore !== undefined ? `${Math.round(planet.strengthScore)}/100` : strengthLabel(undefined, lang)}
                        </Chip>
                      </div>
                      <div style={{ display: "grid", gap: "var(--space-1_5)" }}>
                        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.5 }}>
                          {ordinalHouse(planet.houseFromLagna, lang)} - {rasiName(planet.rasi, lang)} - {tNakshatra(planet.nakshatraName, lang)}{" "}
                          {lang === "ta" ? "பாதம்" : "Pada"} {planet.pada}
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                          {dignityFor(planet, lang)}. D9: {rasiName(planet.d9Rasi, lang)}.
                        </p>
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          <Chip color={color}>{strengthLabel(planet.strengthScore, lang)}</Chip>
                          {flags.length > 0
                            ? flags.map((flag) => <Chip key={flag}>{flag}</Chip>)
                            : <Chip>{lang === "ta" ? "சிறப்பு குறி இல்லை" : "No special flag"}</Chip>}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {section.id === "conjunctions" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {backendConjunctions ? (
                backendConjunctions.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta"
                      ? "ஒரே ராசியில் இரண்டு அல்லது அதற்கு மேற்பட்ட கிரகங்கள் இல்லை. அதனால் பெரிய கூட்ட அழுத்தம் குறைவு."
                      : "No sign has two or more planets together, so there is no major conjunction cluster."}
                  </p>
                ) : (
                  backendConjunctions.map((group) => {
                    const color = relationshipColor(group.relationshipTone);
                    return (
                      <Card key={group.rasi} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                            {rasiName(group.rasi, lang)} - {ordinalHouse(group.houseFromLagna, lang)}
                          </p>
                          <Chip color={color}>{relationshipLabel(group.relationshipTone, lang)}</Chip>
                        </div>
                        <p style={{ margin: "var(--space-2) 0", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                          {tx(group.explanation, lang)}
                        </p>
                        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          {group.pairs.map((pair) => (
                            <Chip key={`${group.rasi}-${pair.planetA}-${pair.planetB}`} color={relationshipColor(pair.relationship)}>
                              {displayPlanet(pair.planetA, lang)} / {displayPlanet(pair.planetB, lang)}: {relationshipLabel(pair.relationship, lang)}
                            </Chip>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                )
              ) : derived.conjunctions.length === 0 ? (
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  {lang === "ta"
                    ? "ஒரே ராசியில் இரண்டு அல்லது அதற்கு மேற்பட்ட கிரகங்கள் இல்லை. அதனால் பெரிய கூட்ட அழுத்தம் குறைவு."
                    : "No sign has two or more planets together, so there is no major conjunction cluster."}
                </p>
              ) : (
                derived.conjunctions.map((group) => {
                  const color = relationshipColor(group.tone);
                  return (
                    <Card key={group.rasi} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          {rasiName(group.rasi, lang)}
                        </p>
                        <Chip color={color}>{relationshipLabel(group.tone, lang)}</Chip>
                      </div>
                      <p style={{ margin: "var(--space-2) 0", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                        {group.planets.map((planet) => displayPlanet(planet.graha, lang)).join(" + ")}
                      </p>
                      <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                        {group.planets.flatMap((planet, index) =>
                          group.planets.slice(index + 1).map((other) => {
                            const tone = relationshipBetween(planet.graha, other.graha);
                            return (
                              <Chip key={`${planet.graha}-${other.graha}`} color={relationshipColor(tone)}>
                                {displayPlanet(planet.graha, lang)} / {displayPlanet(other.graha, lang)}: {relationshipLabel(tone, lang)}
                              </Chip>
                            );
                          }),
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {section.id === "drishti" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? "ஜாதக திருஷ்டி" : "Natal Drishti"}
                </p>
                {backendAspects ? (
                  backendAspects.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? "இந்த கணக்கில் நேரடி கிரக திருஷ்டி தொடுதல்கள் இல்லை."
                        : "No direct natal drishti contacts were found in this calculation."}
                    </p>
                  ) : (
                    // Every aspect, as rows — the chip list stopped at 18 (FTR-06).
                    <DrishtiLedger lang={lang} aspects={backendAspects} />
                  )
                ) : derived.seventhAspects.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta"
                      ? "எளிய 7-ஆம் பார்வையில் முக்கிய கிரக ஜோடி இல்லை."
                      : "No major planet pair is in a simple mutual 7th-house aspect."}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
                    {derived.seventhAspects.map(({ a, b }) => (
                      <Chip key={`${a.graha}-${b.graha}`}>
                        {displayPlanet(a.graha, lang)} {lang === "ta" ? "பார்க்கிறது" : "looks at"} {displayPlanet(b.graha, lang)}
                      </Chip>
                    ))}
                  </div>
                )}

                {/*
                  Nodal drishti is a school choice, not settled doctrine
                  (see ASPECT_HOUSES in app/calculations/aspects.py). Shown
                  only when a nodal aspect is actually in the list, so the
                  caveat appears where it applies instead of as blanket
                  boilerplate. Raised in the 2026-07-18 astrologer review.
                */}
                {backendAspects?.some(
                  (a) => a.aspectType.startsWith("RAHU_") || a.aspectType.startsWith("KETU_"),
                ) && (
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "குறிப்பு: ராகு/கேதுவுக்கு 5, 7, 9 பார்வை தரும் மரபை இங்கு பின்பற்றுகிறோம். இது ஒரு மரபு சார்ந்த கருத்து; வேறு மரபுகள் வேறாகக் கொள்ளலாம் — சில ஆசிரியர்கள் நிழல் கிரகங்களுக்கு 7-ஆம் பார்வை மட்டுமே தருகிறார்கள், சிலர் தனிப் பார்வையே இல்லை என்கிறார்கள்."
                      : "Note: we follow the tradition that gives Rahu/Ketu 5th, 7th and 9th aspects. This is one school's doctrine — some authorities give the shadow grahas the 7th aspect only, and others hold that they aspect solely through their dispositor."}
                  </p>
                )}
              </div>

              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? "இன்றைய குரு / சனி கோச்சாரப் பார்வை" : "Guru / Sani — Current Transit Aspects"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.45 }}>
                  {lang === "ta"
                    ? "இது இன்றைய வானத்தில் குரு/சனி எங்கே சஞ்சரிக்கிறார்கள் என்பதைக் காட்டுகிறது — உங்கள் பிறப்பு ஜாதக நிலை அல்ல."
                    : "This shows where Guru/Sani are moving in today's sky — not their positions in your birth chart."}
                </p>
                {[derived.jupiterTransit, derived.saturnTransit].filter(Boolean).length === 0 ? (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta" ? "கோச்சார குரு/சனி தரவு இல்லை." : "Transit Guru/Sani data is unavailable."}
                  </p>
                ) : (
                  [derived.jupiterTransit, derived.saturnTransit].filter(Boolean).map((item) => {
                    const graha = normalizePlanet(item!.graha);
                    const offsets = graha === "JUPITER" ? [4, 6, 8] : [2, 6, 9];
                    const houses = aspectHousesFromHouse(item!.houseFromLagna, offsets);
                    const touched = chart.planets.filter((planet) => houses.includes(planet.houseFromLagna));
                    const bindus = transitBindus(chart, graha, item!.houseFromLagna);
                    return (
                      <Card key={graha} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {transitAspectSummary(graha, item!.houseFromLagna, item!.houseFromMoon ?? null, houses, lang)}
                        </p>
                        {/*
                          Two Tamil corrections here, 2026-07-18:

                          1. The sentence is built nominative + verb
                             ("{graha} … பெற்றுள்ளார்") specifically to AVOID the
                             dative case. It previously appended a hardcoded
                             "வுக்கு" to the graha name, which is only correct for
                             u-final names — "குருவுக்கு" is right but "சனிவுக்கு" is
                             not (it must be "சனிக்கு"). Since Tamil dative
                             attachment varies by the final phoneme, the fix is to
                             phrase around it rather than build a suffix table.
                             Do not reintroduce an inflected graha name here.

                          2. "விந்து" (a transliteration of Sanskrit bindu) was
                             replaced with "பரல்", the native Tamil almanac term for
                             Ashtakavarga dots. In modern Tamil, விந்து reads
                             primarily as "semen" — not usable in product copy.
                        */}
                        {bindus !== null && (
                          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                            {lang === "ta"
                              ? `அஷ்டகவர்க்கம்: ${displayPlanet(graha, lang)} இந்த ராசியில் ${bindus}/8 பரல்கள் பெற்றுள்ளார் — ${binduReading(bindus, lang)}. பரல்கள் அதிகம் இருந்தால் இந்தப் பெயர்ச்சியின் பலன் எளிதாக வெளிப்படும்; குறைவாக இருந்தால் அதே பெயர்ச்சி மெதுவாகவே பலன் தரும்.`
                              : `Ashtakavarga: ${displayPlanet(graha, lang)} holds ${bindus}/8 bindus in this rasi — ${binduReading(bindus, lang)}. More bindus let a peyarchi deliver its results more easily; fewer bindus mean the same transit works slowly.`}
                          </p>
                        )}
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.4 }}>
                          {touched.length > 0
                            ? (lang === "ta" ? "இந்தப் பார்வையில் வரும் உங்கள் கிரகங்கள்:" : "Your natal planets under this aspect:")
                            : (lang === "ta" ? "இந்தப் பார்வையில் நேரடியாக எந்த ஜாதக கிரகமும் வரவில்லை." : "No natal planet falls directly under this aspect right now.")}
                        </p>
                        {touched.length > 0 && (
                          <div style={{ display: "grid", gap: "var(--space-2)" }}>
                            {touched.map((planet) => (
                              <div key={`${graha}-${planet.graha}`} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-1_5)" }}>
                                <Chip>{displayPlanet(planet.graha, lang)} - {ordinalHouse(planet.houseFromLagna, lang)}</Chip>
                                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                                  {touchedPlanetMeaning(graha as "JUPITER" | "SATURN", planet.graha, lang)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {section.id === "houses" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {backendHouseGroups ? (
                backendHouseGroups.map((group) => (
                  <Card key={group.group} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                    <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {houseGroupLabel(group.group, lang)}
                    </p>
                    <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {tx(group.explanation, lang)}
                    </p>
                    <div style={{ display: "grid", gap: "var(--space-1)" }}>
                      {group.planets.length > 0
                        ? group.planets.map((planet) => {
                            const h = (backendPlanets ?? chart.planets).find((p) => normalizePlanet(p.graha) === normalizePlanet(planet))?.houseFromLagna;
                            return (
                              <p key={`${group.group}-${planet}`} style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                                {h ? planetHouseMeaning(planet, h, lang) : displayPlanet(planet, lang)}
                              </p>
                            );
                          })
                        : <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? "இங்கு கிரகம் இல்லை" : "No planet here"}</p>}
                    </div>
                  </Card>
                ))
              ) : (
                (["kendra", "trikona", "dusthana"] as const).map((group) => {
                  const planets =
                    group === "kendra"
                      ? derived.kendraPlanets
                      : group === "trikona"
                        ? derived.trikonaPlanets
                        : derived.dusthanaPlanets;
                  return (
                    <Card key={group} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                      <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                        {houseGroupLabel(group, lang)}
                      </p>
                      <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {tx(HOUSE_GROUP_COPY[group], lang)}
                      </p>
                      <div style={{ display: "grid", gap: "var(--space-1)" }}>
                        {planets.length > 0
                          ? planets.map((planet) => (
                              <p key={`${group}-${planet.graha}`} style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                                {planetHouseMeaning(planet.graha, planet.houseFromLagna, lang)}
                              </p>
                            ))
                          : <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? "இங்கு கிரகம் இல்லை" : "No planet here"}</p>}
                      </div>
                    </Card>
                  );
                })
              )}
              <div style={{ display: "grid", gap: "var(--space-1)" }}>
                <Kicker as="p" color="var(--color-faint)" style={{ margin: "var(--space-1) 0 0", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "எல்லா கிரகங்களும் — வீடு வாரியாக" : "All planets — by house"}
                </Kicker>
                {(backendPlanets ?? chart.planets).map((planet) => (
                  <p key={`house-${planet.graha}`} style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                    {planetHouseMeaning(planet.graha, planet.houseFromLagna, lang)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {section.id === "functional" && (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {/* The houses each graha rules — what this tab is opened for. */}
              <LordshipLedger
                lang={lang}
                lagnaRasi={chart.lagna.rasi}
                functionalNature={Object.fromEntries(functionalNatureEntries)}
                planets={backendPlanets ?? chart.planets}
              />
              {functionalNatureEntries.length > 0 ? (
                functionalNatureEntries.map(([planet, nature]) => (
                  <Card key={planet} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                        {displayPlanet(planet, lang)}
                      </p>
                      <Chip>{natureLabel(nature, lang)}</Chip>
                    </div>
                    <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {natureNote(nature, lang)}
                    </p>
                  </Card>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  {lang === "ta"
                    ? "இந்த சுருக்கத்தில் செயல்பாட்டு தன்மை தரவு இல்லை."
                    : "Functional nature data was not included in this summary."}
                </p>
              )}
            </div>
          )}

          {section.id === "yogas" && (
            // minmax(0, 1fr): an implicit `auto` column grew to the yoga panel's
            // min-content and pushed the page 31 px wide at 375 px in Tamil.
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "var(--space-3)" }}>
              {backendYogaDosham && (
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  {tx(backendYogaDosham.explanation, lang)}
                </p>
              )}
              {renderYogaDoshamPanel
                ? renderYogaDoshamPanel({
                    lang,
                    yogas: backendYogaDosham?.yogas ?? chart.yogas ?? [],
                    doshams: backendYogaDosham?.doshams ?? chart.doshams ?? [],
                  })
                : (
                  <YogaDoshamPanel
                    lang={lang}
                    yogas={backendYogaDosham?.yogas ?? chart.yogas ?? []}
                    doshams={backendYogaDosham?.doshams ?? chart.doshams ?? []}
                  />
                )}
            </div>
          )}

          {section.id === "summary" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                {/*
                  Both rows name the axis explicitly ("by position") and
                  carry their score. The labels used to read "Strongest
                  planet" / "Planet needing support" over a bare graha name,
                  which invited two misreadings at once: that the score
                  measured auspiciousness, and — because no number was shown
                  — that these picks could not be checked against the
                  per-planet cards. Both were flagged in review (2026-07-18).
                */}
                <DetailRow
                  label={lang === "ta" ? "கிரக பலத்தில் முதலிடம்" : "Strongest by position"}
                  value={
                    backendSummary?.strongestPlanet
                      ? `${displayPlanet(backendSummary.strongestPlanet, lang)}${
                          backendSummary.strongestPlanetScore != null
                            ? ` - ${backendSummary.strongestPlanetScore}/100`
                            : ""
                        }`
                      : derived.strong
                      ? `${displayPlanet(derived.strong.graha, lang)} - ${Math.round(derived.strong.strengthScore ?? 0)}/100 - ${dignityFor(derived.strong, lang)}`
                      : (lang === "ta" ? "பலம் மதிப்பெண் இல்லை" : "No strength scores available")
                  }
                />
                <DetailRow
                  label={lang === "ta" ? "கிரக பலத்தில் கடைசி இடம்" : "Lowest by position"}
                  value={
                    backendSummary?.weakestPlanet
                      ? `${displayPlanet(backendSummary.weakestPlanet, lang)}${
                          backendSummary.weakestPlanetScore != null
                            ? ` - ${backendSummary.weakestPlanetScore}/100`
                            : ""
                        }`
                      : derived.weak
                      ? `${displayPlanet(derived.weak.graha, lang)} - ${Math.round(derived.weak.strengthScore ?? 0)}/100 - ${dignityFor(derived.weak, lang)}`
                      : (lang === "ta" ? "பலம் மதிப்பெண் இல்லை" : "No strength scores available")
                  }
                />
              </div>

              {backendSummary?.strongestPlanetCaveat && (
                <p
                  style={{
                    margin: 0,
                    padding: "var(--space-2) var(--space-2_5)",
                    borderRadius: "var(--radius-2, 8px)",
                    background: "var(--color-accent-muted)",
                    border: "1px solid var(--color-border-strong)",
                    fontSize: "var(--text-base)",
                    lineHeight: 1.6,
                    color: "var(--color-text)",
                  }}
                >
                  {tx(backendSummary.strongestPlanetCaveat, lang)}
                </p>
              )}

              {backendSummary?.scoreScaleNote && (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-muted)" }}>
                  {tx(backendSummary.scoreScaleNote, lang)}
                </p>
              )}
              <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "grid", gap: "var(--space-1_5)" }}>
                {backendSummary ? (
                  [...backendSummary.positives, ...backendSummary.cautions].map((item, index) => (
                    <li key={`${tx(item, "en")}-${index}`} style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {tx(item, lang)}
                    </li>
                  ))
                ) : (
                  <>
                    <li style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? `${derived.kendraPlanets.length} கேந்திர கிரகங்கள் வாழ்க்கையின் வெளிப்படைத் துறைகளை சுறுசுறுப்பாக்கும். இதை திட்டமிட்ட செயலில் பயன்படுத்தலாம்.`
                        : `${derived.kendraPlanets.length} Kendra planets make the visible life areas more active. Use this through planned action.`}
                    </li>
                    <li style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? `${derived.dusthanaPlanets.length} துஷ்டான கிரகங்கள் கவனமும் ஒழுங்கும் கேட்கும். ஓய்வு, பழக்கம், கால மேலாண்மை உதவும்.`
                        : `${derived.dusthanaPlanets.length} Dusthana planets ask for care and refinement. Rest, routines, and time management help.`}
                    </li>
                    <li style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? `நடப்பு ${dashaLabel} இந்த விளக்கத்தின் செயல்படும் அடுக்கு. அந்த கிரகங்களின் வீடு மற்றும் பலத்தை முன்னுரிமையாக பார்க்கவும்.`
                        : `The current ${dashaLabel} is the active layer of this reading. Prioritize those planets' houses and strength.`}
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {section.id === "peyarchi" && (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {backendPeyarchi ? (
                <>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {tx(backendPeyarchi.explanation, lang)}
                  </p>
                  {backendPeyarchi.events.length > 0 ? (
                    backendPeyarchi.events.map((event) => (
                      <Card key={`${event.planet}-${event.eventDate}`} style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          {displayPlanet(event.planet, lang)} - {formatPeyarchiDate(event.eventDate)}
                        </p>
                        <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                          {rasiDisplayName(event.fromRasi, lang)} → {rasiDisplayName(event.toRasi, lang)}; {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(event.houseFromMoon, lang)},{" "}
                          {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"} {ordinalHouse(event.houseFromLagna, lang)}.
                        </p>
                        {event.saniCycleAfter && (
                          <div style={{ margin: "0 0 var(--space-2)", display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                            <Chip>{saniCycleLabel(event.saniCycleAfter, lang)}</Chip>
                          </div>
                        )}
                        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                          {tx(event.explanation, lang)}
                        </p>
                      </Card>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta" ? "இந்த காலச்சாளரத்தில் பெரிய பெயர்ச்சி நிகழ்வு இல்லை." : "No major peyarchi event in this window."}
                    </p>
                  )}
                  {backend?.methodNote && (
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.55 }}>
                      {tx(backend.methodNote, lang)}
                    </p>
                  )}
                </>
              ) : (
                <>
              <Card style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? "சனி" : "Sani / Saturn"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  {tx(derived.saniStage, lang)}
                  {derived.kandakaStage ? ` ${tx(derived.kandakaStage, lang)}` : ""}
                </p>
                {saniEvent && (
                  <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                    {formatPeyarchiDate(saniEvent.peyarchiDateLocal)}: {rasiDisplayName(saniEvent.fromRasi, lang)} → {rasiDisplayName(saniEvent.toRasi, lang)};{" "}
                    {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(saniEvent.impactFromMoon, lang)},{" "}
                    {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"} {ordinalHouse(saniEvent.impactFromLagna, lang)}.
                  </p>
                )}
              </Card>

              <Card style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? "குரு" : "Guru / Jupiter"}
                </p>
                {guruEvent ? (
                  <>
                    <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {formatPeyarchiDate(guruEvent.peyarchiDateLocal)}: {rasiDisplayName(guruEvent.fromRasi, lang)} → {rasiDisplayName(guruEvent.toRasi, lang)};{" "}
                      {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"} {ordinalHouse(guruEvent.impactFromMoon, lang)}.{" "}
                      {guruQualityCopy(guruMoonQuality(guruEvent.impactFromMoon), lang)}
                    </p>
                    <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {lang === "ta" ? "லக்னத்திலிருந்து இது தொடும் துறை" : "Life area from Lagna"}:{" "}
                      {ordinalHouse(guruEvent.impactFromLagna, lang)} - {tx(HOUSE_MEANING[guruEvent.impactFromLagna], lang)}.
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta" ? "அடுத்த பெயர்ச்சி தரவு இந்த சாளரத்தில் இல்லை." : "No upcoming Jupiter peyarchi in this window."}
                  </p>
                )}
              </Card>

              <Card style={{ borderRadius: "var(--radius-sm)", padding: "var(--space-3)" }}>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? "ராகு / கேது" : "Rahu / Ketu"}
                </p>
                {rahuEvent || ketuEvent ? (
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    {rahuEvent && (
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {formatPeyarchiDate(rahuEvent.peyarchiDateLocal)}: {lang === "ta" ? "ராகு பெரிதாக்கும் பகுதி" : "Rahu amplifies"} -{" "}
                        {ordinalHouse(rahuEvent.impactFromMoon, lang)} {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"},{" "}
                        {ordinalHouse(rahuEvent.impactFromLagna, lang)} {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"}.
                      </p>
                    )}
                    {ketuEvent && (
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                        {formatPeyarchiDate(ketuEvent.peyarchiDateLocal)}: {lang === "ta" ? "கேது விடுவிக்கும் பகுதி" : "Ketu releases"} -{" "}
                        {ordinalHouse(ketuEvent.impactFromMoon, lang)} {lang === "ta" ? "சந்திரனிலிருந்து" : "from Moon"},{" "}
                        {ordinalHouse(ketuEvent.impactFromLagna, lang)} {lang === "ta" ? "லக்னத்திலிருந்து" : "from Lagna"}.
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? "இந்த அச்சு ஆசை மற்றும் விடுவிப்பு ஆகிய இரண்டையும் ஒன்றாக இயக்கும். முடிவுகளை மெதுவாக சரிபார்த்து எடுப்பது உதவும்."
                        : "This axis activates both amplification and release. Slower verification before decisions is helpful."}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                    {lang === "ta" ? "ராகு/கேது பெயர்ச்சி தரவு இந்த சாளரத்தில் இல்லை." : "No Rahu/Ketu peyarchi in this window."}
                  </p>
                )}
              </Card>
                </>
              )}
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  );
}

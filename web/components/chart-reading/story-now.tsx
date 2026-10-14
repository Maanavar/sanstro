"use client";

// Chapter 3 · Running now (FTR-13). The dasa chain as three bars with a
// "today" playhead, Guru and Sani in today's sky read from the Janma Rasi
// (Tamil peyarchi practice, T-38/T-39) with their parals drawn as the dots they
// count, and the yogas this period switches on — the *timing* axis, which is
// the only thing "Active" means app-wide.

import { formatDateLabel } from "@/lib/format";
import { saniCycleName } from "@/lib/family-flags";
import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

import { GlossaryTerm } from "../glossary-term";
import { Disclosure, ParalDots, PeriodBar, ToneBadge, type Tone } from "./graphics";
import {
  aspectHousesFromHouse,
  binduReading,
  findTransit,
  ordinalSuffix,
  periodLevelLabel,
  touchedPlanetMeaning,
  transitAspectSummary,
  transitBindus,
} from "./reading-helpers";
import { guruTone, houseOrdinal, houseTheme, periodProgress, runningYogas, saniTone, touchedByTransit } from "./reading-selectors";
import { SeeAlso, StoryCard, StoryKicker, quietText, type StoryProps } from "./story-parts";

const pick = (text: { en: string; ta: string }, lang: Lang) => (lang === "ta" ? text.ta : text.en);

const PERIOD_TONE: Record<string, Tone> = { SUPPORT: "good", STEADY: "steady", CAUTION: "care" };

// New Tamil, pending native review.
const TONE_WORD: Record<Tone, { en: string; ta: string }> = {
  good: { en: "Supportive", ta: "ஆதரவு" },
  steady: { en: "Mixed", ta: "கலந்த நிலை" },
  care: { en: "Needs care", ta: "கவனம் தேவை" },
};

const LEVEL_TERM = { MAHADASHA: "dasha", BHUKTI: "bhukti", ANTARAM: "antaram" } as const;

export function ChapterNow({ lang, chart, explanation, transit, sani, today, onOpenSection }: StoryProps) {
  const lords = explanation?.currentActivation?.activeLords ?? [];
  const planets = explanation?.planets?.length ? explanation.planets : chart.planets;
  const running = runningYogas(explanation?.yogaDosham?.yogas ?? chart.yogas ?? [], lang, explanation?.story);

  const sky = (["JUPITER", "SATURN"] as const).flatMap((graha) => {
    const item = findTransit(transit, graha);
    if (!item) return [];
    const tone = graha === "JUPITER" ? guruTone(item.houseFromMoon) : saniTone(item.houseFromMoon);
    const bindus = transitBindus(chart, graha, item.houseFromLagna);
    const touched = touchedByTransit(graha, item.houseFromLagna, planets);
    const cycle = graha === "SATURN" && sani?.moonBasedCycle?.isActive && sani.moonBasedCycle.type ? saniCycleName(sani.moonBasedCycle.type, lang) : null;
    const offsets = graha === "JUPITER" ? [4, 6, 8] : [2, 6, 9];
    return [{ graha, item, tone, bindus, touched, cycle, houses: aspectHousesFromHouse(item.houseFromLagna, offsets) }];
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {lords.length > 0 ? (
        <StoryCard>
          <StoryKicker>{lang === "ta" ? "உங்கள் தசைச் சங்கிலி — இன்று" : "Your dasa chain — today"}</StoryKicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {lords.map((lord, index) => {
              const tone = PERIOD_TONE[lord.periodTone] ?? "steady";
              // The same lord (or two lords in one house) gives the same line;
              // printing it three times reads like a bug, so say it once.
              const repeatsAbove = index > 0 && lords[index - 1].natalHouseFromLagna === lord.natalHouseFromLagna;
              const name = tPlanetLord(lord.lord, lang);
              const level = periodLevelLabel(lord.level, lang);
              return (
                <li key={`${lord.level}-${lord.lord}`} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", minWidth: "5.5em" }}>
                      <GlossaryTerm term={LEVEL_TERM[lord.level]} lang={lang}>{level}</GlossaryTerm>
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{name}</span>
                    <ToneBadge tone={tone}>{pick(TONE_WORD[tone], lang)}</ToneBadge>
                    <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                      {lang === "ta" ? `${formatDateLabel(lord.endDate.slice(0, 10))} வரை` : `until ${formatDateLabel(lord.endDate.slice(0, 10))}`}
                    </span>
                  </div>
                  <PeriodBar
                    progress={periodProgress(lord.startDate, lord.endDate, today)}
                    tone={tone}
                    label={lang === "ta" ? `${level} ${name} — கடந்த பகுதி` : `${level} ${name} — share elapsed`}
                  />
                  {!repeatsAbove && (
                    <p style={quietText}>
                      {lang === "ta"
                        ? `பிறப்பில் ${lord.natalHouseFromLagna}-ஆம் வீடு — ${houseTheme(lord.natalHouseFromLagna, lang)}.`
                        : `From your ${houseOrdinal(lord.natalHouseFromLagna, lang)} — ${houseTheme(lord.natalHouseFromLagna, lang)}.`}
                    </p>
                  )}
                  <Disclosure label={lang === "ta" ? "ஏன் இந்த நிலை?" : "Why this tone?"} openLabel={lang === "ta" ? "மூடு" : "Hide"}>
                    <p style={quietText}>{pick(lord.explanation, lang)}</p>
                  </Disclosure>
                </li>
              );
            })}
          </ul>
          <SeeAlso
            label={lang === "ta" ? "முழு தசை காலவரிசை" : "Full dasa timeline"}
            onClick={onOpenSection ? () => onOpenSection("dasha") : undefined}
          />
        </StoryCard>
      ) : (
        <p style={quietText}>
          {lang === "ta" ? "இந்த ஜாதகத்துக்கான தசை விளக்கம் இப்போது கிடைக்கவில்லை." : "The period reading isn't available for this chart right now."}
        </p>
      )}

      {sky.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
          {sky.map(({ graha, item, tone, bindus, touched, cycle, houses }) => (
            <StoryCard key={graha}>
              <StoryKicker>
                {graha === "JUPITER"
                  ? lang === "ta" ? "இன்றைய வானில் குரு" : "Guru in today's sky"
                  : lang === "ta" ? "இன்றைய வானில் சனி" : "Sani in today's sky"}
              </StoryKicker>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? `ஜென்ம ராசியிலிருந்து ${item.houseFromMoon}-ஆம் இடம்` : `${ordinalSuffix(item.houseFromMoon)} from your Moon sign`}
                </span>
                <ToneBadge tone={tone}>{pick(TONE_WORD[tone], lang)}</ToneBadge>
                {cycle && <ToneBadge tone="care">{cycle}</ToneBadge>}
              </div>
              {bindus !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <ParalDots bindus={bindus} tone={bindus >= 5 ? "good" : bindus === 4 ? "steady" : "care"} />
                  <span style={quietText}>
                    {bindus}/8 <GlossaryTerm term="paral" lang={lang}>{lang === "ta" ? "பரல்" : "parals"}</GlossaryTerm> · {binduReading(bindus, lang)}
                  </span>
                </div>
              )}
              <p style={quietText}>
                {touched.length > 0
                  ? `${lang === "ta" ? "பார்வை விழும் உங்கள் கிரகங்கள்" : "Its aspect touches your"}: ${touched.map((g) => tPlanetLord(g, lang)).join(", ")}`
                  : lang === "ta" ? "இப்போது உங்கள் எந்தக் கிரகத்தின் மீதும் நேரடிப் பார்வை இல்லை." : "Its aspect touches none of your planets right now."}
              </p>
              <Disclosure label={lang === "ta" ? "இதன் பொருள்" : "What this means"} openLabel={lang === "ta" ? "மூடு" : "Hide"}>
                <p style={quietText}>{transitAspectSummary(graha, item.houseFromLagna, item.houseFromMoon ?? null, houses, lang)}</p>
                {touched.map((g) => (
                  <p key={g} style={{ ...quietText, marginTop: "var(--space-1_5)" }}>
                    {touchedPlanetMeaning(graha, g, lang)}
                  </p>
                ))}
              </Disclosure>
            </StoryCard>
          ))}
        </div>
      )}

      {running.length > 0 && (
        <p style={quietText}>
          <span style={{ fontWeight: 700, color: "var(--color-text)" }}>
            {lang === "ta" ? "இந்தக் காலம் இயக்கும் யோகங்கள்: " : "Yogas this period switches on: "}
          </span>
          {running.join(", ")}
        </p>
      )}
    </div>
  );
}

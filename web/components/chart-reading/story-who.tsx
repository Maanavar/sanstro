"use client";

// Chapter 1 · Who you are (FTR-10). The three anchors of the chart with their
// artwork, where the Lagna's own lord sits, and the twelve houses as the South
// Indian square a Tamil reader already knows — tinted by house group, tap a
// house to read it.

import { useState } from "react";

import { rasiDisplayName } from "@/lib/chart-utils";
import { tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

import { GlossaryTerm } from "../glossary-term";
import { NakshatraBadge } from "../nakshatra-badge";
import { ZodiacBadge } from "../zodiac-badge";
import { PILLAR_MEANING } from "@vinaadi/shared/reading";

import { HOUSE_TONE_FILL, SouthGrid } from "./graphics";
import { houseOrdinal, houseTheme, houseTone, lagnaLordPlacement, type HouseTone } from "./reading-selectors";
import { StoryCard, StoryKicker, bodyText, quietText, type StoryProps } from "./story-parts";

// What each anchor *is*: the shared copy (packages/shared/src/reading.ts), so
// mobile's reading words the pillars the same way.

// The 1st is both kendra and trikona; the map tints it as a pillar (kendra
// wins, as everywhere else on the page), so the growth legend names 5 and 9.
const TONE_WORD: Record<Exclude<HouseTone, "other">, { term: "kendra" | "trikona" | "dusthana"; en: string; ta: string }> = {
  pillar: { term: "kendra", en: "Pillars", ta: "தூண்கள்" },
  growth: { term: "trikona", en: "Growth", ta: "வளர்ச்சி" },
  care: { term: "dusthana", en: "Care", ta: "கவனம்" },
};

const pick = (text: { en: string; ta: string }, lang: Lang) => (lang === "ta" ? text.ta : text.en);

export function ChapterWho({ lang, chart, explanation }: StoryProps) {
  const lagnaRasi = chart.lagna.rasi;
  const planets: { graha: string; rasi: number; houseFromLagna: number; nakshatra: number; nakshatraName: string; pada: number }[] =
    explanation?.planets?.length ? explanation.planets : chart.planets;
  const moon = planets.find((p) => p.graha === "MOON") ?? null;
  const lord = lagnaLordPlacement(lagnaRasi, planets);
  const [selected, setSelected] = useState<number | null>(null);

  const selectedHouse = selected ? ((selected - lagnaRasi + 12) % 12) + 1 : null;
  const selectedPlanets = selected ? planets.filter((p) => p.rasi === selected).map((p) => tPlanetLord(p.graha, lang)) : [];
  const edgeNotes = [explanation?.coreIdentity?.lagnaEdgeNote, explanation?.coreIdentity?.navamsaLagnaEdgeNote].filter(Boolean);

  const pillars = [
    {
      key: "lagna",
      art: <ZodiacBadge rasi={lagnaRasi} size={52} />,
      term: <GlossaryTerm term="lagnam" lang={lang}>{lang === "ta" ? "லக்னம்" : "Lagna"}</GlossaryTerm>,
      name: rasiDisplayName(lagnaRasi, lang),
      meaning: pick(PILLAR_MEANING.lagna, lang),
    },
    moon && {
      key: "rasi",
      art: <ZodiacBadge rasi={moon.rasi} size={52} />,
      term: <GlossaryTerm term="rasi" lang={lang}>{lang === "ta" ? "ராசி (சந்திரன்)" : "Rasi (Moon sign)"}</GlossaryTerm>,
      name: rasiDisplayName(moon.rasi, lang),
      meaning: pick(PILLAR_MEANING.rasi, lang),
    },
    moon && {
      key: "star",
      art: <NakshatraBadge nakshatra={moon.nakshatra} size={52} />,
      term: <GlossaryTerm term="nakshatra" lang={lang}>{lang === "ta" ? "நட்சத்திரம்" : "Birth star"}</GlossaryTerm>,
      name: `${tNakshatra(moon.nakshatraName, lang)} · ${lang === "ta" ? "பாதம்" : "pada"} ${moon.pada}`,
      meaning: pick(PILLAR_MEANING.star, lang),
    },
  ].filter(Boolean) as { key: string; art: React.ReactNode; term: React.ReactNode; name: string; meaning: string }[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
        {pillars.map((pillar) => (
          <StoryCard key={pillar.key} style={{ flexDirection: "row", alignItems: "flex-start", gap: "var(--space-3)" }}>
            {pillar.art}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-0_5)", minWidth: 0 }}>
              <StoryKicker>{pillar.term}</StoryKicker>
              <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {pillar.name}
              </p>
              <p style={quietText}>{pillar.meaning}</p>
            </div>
          </StoryCard>
        ))}
      </div>

      {/* Ruling D1 (astrologer, 2026-10-04): CONFIRMED. The Lagna lord's house
          is where life's attention, effort or involvement tends to go. It does
          NOT say that house is strong or fortunate; dignity, aspects and house
          condition still decide that, so the copy stops at "attention". */}
      {lord && (
        <p style={bodyText}>
          {lang === "ta"
            ? `லக்னாதிபதி ${tPlanetLord(lord.lord, lang)} உங்கள் ${lord.house}-ஆம் வீட்டில் அமைந்துள்ளது — ${houseTheme(lord.house, lang)}. உங்கள் வாழ்க்கையின் கவனம் பெரும்பாலும் அங்கே திரும்பும்.`
            : `Your Lagna's ruling planet, ${tPlanetLord(lord.lord, lang)}, sits in your ${houseOrdinal(lord.house, lang)} — ${houseTheme(lord.house, lang)}. Life's attention tends to turn there.`}
        </p>
      )}

      {edgeNotes.map((note, index) => (
        <p key={index} role="note" style={{ ...quietText, color: "var(--color-text)" }}>
          {pick(note!, lang)}
        </p>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)", alignItems: "center" }}>
        <SouthGrid
          lang={lang}
          lagnaRasi={lagnaRasi}
          planets={planets}
          tintFor={houseTone}
          selectedRasi={selected}
          onSelectRasi={(rasi) => setSelected((current) => (current === rasi ? null : rasi))}
          ariaLabel={lang === "ta" ? "ஜாதகக் கட்டம் — ஒரு வீட்டைத் தொடவும்" : "Birth chart — tap a house to read it"}
          center={
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.35 }}>
              {lang === "ta" ? "ஒரு வீட்டைத் தொடவும்" : "Tap a house"}
            </span>
          }
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div aria-live="polite" style={{ minHeight: "3.2em" }}>
            {selectedHouse ? (
              <>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? `${selectedHouse}-ஆம் வீடு` : `House ${selectedHouse}`} · {rasiDisplayName(selected!, lang)}
                </p>
                <p style={quietText}>
                  {houseTheme(selectedHouse, lang)}
                  {selectedPlanets.length > 0 ? ` — ${selectedPlanets.join(", ")}` : lang === "ta" ? " — கிரகம் இல்லை" : " — no planet here"}
                </p>
              </>
            ) : (
              <p style={quietText}>
                {lang === "ta"
                  ? "வீட்டின் நிறம் அதன் வகையைக் காட்டும். ஒரு வீட்டைத் தொட்டால் அது எந்த வாழ்க்கைப் பகுதி என்று தெரியும்."
                  : "Each house's colour shows its kind. Tap one to see which part of life it holds."}
              </p>
            )}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
            {(Object.keys(TONE_WORD) as (keyof typeof TONE_WORD)[]).map((tone) => (
              // minHeight 24px: each row's glossary chip is a 16px-tall target,
              // so rows must sit 24px apart (WCAG 2.5.8 spacing exception).
              <li key={tone} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minHeight: "24px", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                <span aria-hidden style={{ width: "14px", height: "14px", borderRadius: "4px", background: HOUSE_TONE_FILL[tone], border: "1px solid var(--color-border-strong)" }} />
                <strong>{pick(TONE_WORD[tone], lang)}</strong>
                <GlossaryTerm term={TONE_WORD[tone].term} lang={lang}>
                  {lang === "ta"
                    ? { pillar: "கேந்திரம் 1·4·7·10", growth: "திரிகோணம் 5·9", care: "துஷ்டானம் 6·8·12" }[tone]
                    : { pillar: "Kendra 1·4·7·10", growth: "Trikona 5·9", care: "Dusthana 6·8·12" }[tone]}
                </GlossaryTerm>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

// Chapter 5 · What's coming (FTR-15). The next slow-planet sign changes as a
// timeline: when, how far away, from which sign to which (artwork + the name in
// the reader's language, resolved from the rasi number — never the raw code,
// FTR-02), and which house from the Janma Rasi it lands in.

import { ArrowRight } from "lucide-react";

import { formatDateLabel } from "@/lib/format";
import { saniCycleName } from "@/lib/family-flags";
import { rasiDisplayName } from "@/lib/chart-utils";
import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

import { ORB_GRADIENTS } from "../dashboard-hybrid-parts";
import { GlossaryTerm } from "../glossary-term";
import { ZodiacBadge } from "../zodiac-badge";
import { Disclosure, ToneBadge } from "./graphics";
import { daysUntil, guruTone, houseTheme, saniTone, upcomingMoves } from "./reading-selectors";
import { ordinalSuffix } from "./reading-helpers";
import { SeeAlso, StoryCard, quietText, type StoryProps } from "./story-parts";

const pick = (text: { en: string; ta: string }, lang: Lang) => (lang === "ta" ? text.ta : text.en);

function whenLabel(days: number, lang: Lang): string {
  if (days <= 0) return lang === "ta" ? "இன்று" : "today";
  if (days === 1) return lang === "ta" ? "நாளை" : "tomorrow";
  return lang === "ta" ? `${days} நாட்களில்` : `in ${days} days`;
}

export function ChapterComing({ lang, explanation, peyarchiUpcoming, today, onOpenSection }: StoryProps) {
  const moves = upcomingMoves(explanation, peyarchiUpcoming);

  if (moves.length === 0) {
    return (
      <p style={quietText}>
        {lang === "ta" ? "அடுத்த சில மாதங்களில் பெரிய கிரகப் பெயர்ச்சி இல்லை." : "No big planet move in the coming window."}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={quietText}>
        {lang === "ta" ? (
          <>மெதுவாக நகரும் கிரகங்கள் ராசி மாறும் நாட்கள் — <GlossaryTerm term="peyarchi" lang={lang}>பெயர்ச்சி</GlossaryTerm>. ஒவ்வொன்றும் நீண்ட காலத்துக்குப் போக்கை மாற்றும்.</>
        ) : (
          <>When the slow planets change sign — <GlossaryTerm term="peyarchi" lang={lang}>peyarchi</GlossaryTerm>. Each one shifts the weather for a long stretch.</>
        )}
      </p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-3)" }}>
        {moves.map((move) => {
          const days = daysUntil(move.date, today);
          const grad = ORB_GRADIENTS[move.planet];
          const tone = move.planet === "JUPITER" ? guruTone(move.houseFromMoon) : move.planet === "SATURN" ? saniTone(move.houseFromMoon) : null;
          return (
            <li key={`${move.planet}-${move.date}`} style={{ display: "flex" }}>
              <StoryCard style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span aria-hidden style={{ width: "18px", height: "18px", borderRadius: "50%", background: grad?.orb, boxShadow: grad ? `0 0 8px ${grad.glow}` : undefined }} />
                  <span style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(move.planet, lang)}</span>
                  <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent-strong)" }}>{whenLabel(days, lang)}</span>
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{formatDateLabel(move.date.slice(0, 10))}</span>
                {move.fromRasi && move.toRasi && (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <ZodiacBadge rasi={move.fromRasi} size={30} />
                    <ArrowRight size={14} aria-hidden style={{ color: "var(--color-faint)" }} />
                    <ZodiacBadge rasi={move.toRasi} size={30} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                      {rasiDisplayName(move.fromRasi, lang)} → {rasiDisplayName(move.toRasi, lang)}
                    </span>
                  </div>
                )}
                <p style={quietText}>
                  {lang === "ta"
                    ? `ஜென்ம ராசியிலிருந்து ${move.houseFromMoon}-ஆம் இடம் — ${houseTheme(move.houseFromMoon, lang)}.`
                    : `${ordinalSuffix(move.houseFromMoon)} from your Moon sign — ${houseTheme(move.houseFromMoon, lang)}.`}
                </p>
                {(tone || move.saniCycleAfter) && (
                  <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                    {tone && (
                      <ToneBadge tone={tone}>
                        {tone === "good" ? (lang === "ta" ? "ஆதரவு" : "Supportive") : tone === "care" ? (lang === "ta" ? "கவனம் தேவை" : "Needs care") : lang === "ta" ? "கலந்த நிலை" : "Mixed"}
                      </ToneBadge>
                    )}
                    {move.saniCycleAfter && <ToneBadge tone="care">{saniCycleName(move.saniCycleAfter, lang)}</ToneBadge>}
                  </div>
                )}
                {move.explanation && (
                  <Disclosure label={lang === "ta" ? "இதன் பொருள்" : "What this means"} openLabel={lang === "ta" ? "மூடு" : "Hide"}>
                    <p style={quietText}>{pick(move.explanation, lang)}</p>
                  </Disclosure>
                )}
              </StoryCard>
            </li>
          );
        })}
      </ol>
      <SeeAlso
        label={lang === "ta" ? "கணிப்புகள் & கோச்சாரம் பகுதி" : "Predictions & transits on this page"}
        onClick={onOpenSection ? () => onOpenSection("forecast") : undefined}
      />
    </div>
  );
}

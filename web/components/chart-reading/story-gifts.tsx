"use client";

// Chapter 4 · Gifts & care (FTR-14). Two columns from the engine's own summary:
// what the chart gives you and what it asks you to handle gently. Yogas show
// their *birth-chart standing* — the same `yogaStanding` the §7 chips use — and
// only the top three; the chart's full list (routinely 28-30 rows) is one tap
// away in the Astrologer view. Remedies are not repeated here: §7 already has
// them, so this chapter links there (say it once).

import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { BiText, ChartDoshamInsight } from "@/lib/types";
import { VERDICT_DOSHAMS } from "@vinaadi/shared/doshamReckoning";

import { strengthReassurance, strengthVerdict } from "../dashboard-hybrid-parts";
import { displayName as yogaDisplayName, doshamStanding } from "../dashboard-yoga-dosham-panel";
import { DoshamVerdictLine } from "../dosham-verdict-line";
import { GlossaryTerm } from "../glossary-term";
import { Disclosure, StrengthMeter, TONE_TOKENS, type Tone } from "./graphics";
import { HIGHLIGHT_CAP, carePatterns, giftPatterns, highlightLines, type PatternChip } from "./reading-selectors";
import { SeeAlso, StoryCard, StoryKicker, bodyText, quietText, type StoryProps } from "./story-parts";

const pick = (text: BiText, lang: Lang) => (lang === "ta" ? text.ta : text.en);

function Patterns({ chips, tone, lang }: { chips: PatternChip[]; tone: Tone; lang: Lang }) {
  if (chips.length === 0) return null;
  const c = TONE_TOKENS[tone];
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
      {chips.map((chip) => (
        <li
          key={chip.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1_5)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text)",
            background: c.bg,
            border: `1px solid ${c.bd}`,
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-0_5) var(--space-2_5)",
          }}
        >
          {chip.effect ? (
            <GlossaryTerm definition={{ ta: chip.effect, en: chip.effect }} lang={lang}>
              {chip.name}
            </GlossaryTerm>
          ) : (
            chip.name
          )}
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: c.fg }}>{chip.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sevvai and Rahu–Ketu, detected → assessed → softened. An unmitigated one sits
 * under "Needs attention"; a mitigated one under "Checked & softened" — never
 * under "Handle with care", which would make "mitigated" meaningless, and never
 * hidden (owner-forwarded review, 2026-10-06).
 */
function MarriageDoshams({ doshams, lang }: { doshams: ChartDoshamInsight[]; lang: Lang }) {
  const groups: { key: string; title: string; items: ChartDoshamInsight[] }[] = [
    { key: "attention", title: lang === "ta" ? "கவனம் தேவை" : "Needs attention", items: doshams.filter((d) => !d.isCancelled) },
    { key: "softened", title: lang === "ta" ? "சரிபார்த்து, குறைந்தவை" : "Checked & softened", items: doshams.filter((d) => d.isCancelled) },
  ];
  return (
    <StoryCard>
      <StoryKicker>{lang === "ta" ? "திருமண தோஷங்கள்" : "Marriage doshams"}</StoryKicker>
      {groups.filter((g) => g.items.length > 0).map((group) => (
        <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          <p style={{ ...quietText, fontWeight: 700 }}>{group.title}</p>
          {group.items.map((d) => {
            const standing = doshamStanding(d, lang);
            const c = TONE_TOKENS[standing.tone === "caution" ? "care" : standing.tone === "good" ? "good" : "steady"];
            return (
              <div key={d.name} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <span style={{ ...bodyText, fontWeight: 600 }}>{yogaDisplayName(d.name, lang)}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2_5)" }}>
                    {standing.label}
                  </span>
                </div>
                <DoshamVerdictLine dosham={d} lang={lang} />
              </div>
            );
          })}
        </div>
      ))}
    </StoryCard>
  );
}

function PlanetLine({ graha, score, lang }: { graha: string; score: number | null | undefined; lang: Lang }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)" }}>
        {tPlanetLord(graha, lang)}
      </span>
      {typeof score === "number" && (
        <>
          <StrengthMeter score={score} />
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text)" }}>{strengthVerdict(score, lang)}</span>
        </>
      )}
    </div>
  );
}

export function ChapterGifts({ lang, chart, explanation, onOpenSection, onShowAstrologer }: StoryProps) {
  const summary = explanation?.summary ?? null;
  const yogas = explanation?.yogaDosham?.yogas ?? chart.yogas ?? [];
  const doshams = explanation?.yogaDosham?.doshams ?? chart.doshams ?? [];
  const gifts = giftPatterns(yogas, lang, explanation?.story);
  // Sevvai and Rahu–Ketu get their own card below whenever present — mitigated
  // included — so they leave the care chips (say it once). A Story reading that
  // said nothing about them read as "Vinaadi missed it" (plan 2026-10-06).
  const marriageDoshams = doshams.filter((d) => d.isPresent && VERDICT_DOSHAMS.has(d.name));
  const story = explanation?.story;
  const storyForCare = story
    ? { ...story, carePatterns: story.carePatterns.filter((c) => !(c.kind === "DOSHAM" && VERDICT_DOSHAMS.has(c.name))) }
    : story;
  const cares = carePatterns(doshams.filter((d) => !VERDICT_DOSHAMS.has(d.name)), yogas, lang, storyForCare);
  // FTR-18, say it once: on the Family page §4's "Chart strengths" and
  // "Watch-outs" cards print these same summary lines (measured by
  // e2e/chart-reading-say-once.spec.ts), so the chapter links there instead.
  // A host without that section (the legacy family tab) passes no
  // onOpenSection and keeps them here.
  const ownedAbove = Boolean(onOpenSection);
  const positives = ownedAbove ? [] : summary?.positives ?? [];
  const cautions = ownedAbove ? [] : summary?.cautions ?? [];
  // What §4 does not print (past its cap) stays reachable here.
  const overflow = ownedAbove
    ? [...highlightLines(summary?.positives ?? []).slice(HIGHLIGHT_CAP), ...highlightLines(summary?.cautions ?? []).slice(HIGHLIGHT_CAP)]
    : [...positives.slice(1), ...cautions.slice(1)];
  const moreCount = overflow.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-3)" }}>
        <StoryCard style={{ background: "color-mix(in srgb, var(--color-high) 5%, var(--color-surface))" }}>
          <StoryKicker>{lang === "ta" ? "உங்கள் பலம்" : "What your chart gives you"}</StoryKicker>
          {summary?.strongestPlanet && (
            <>
              <PlanetLine graha={summary.strongestPlanet} score={summary.strongestPlanetScore} lang={lang} />
              <p style={quietText}>
                {lang === "ta" ? "நிலையில் மிக வலுவான கிரகம்." : "Your strongest planet by position."}
              </p>
            </>
          )}
          {summary?.strongestPlanetCaveat && <p style={{ ...quietText, color: "var(--color-text)" }}>{pick(summary.strongestPlanetCaveat, lang)}</p>}
          {positives[0] && <p style={bodyText}>{pick(positives[0], lang)}</p>}
          {gifts.length > 0 && (
            <>
              <StoryKicker>
                <GlossaryTerm term="yoga" lang={lang}>{lang === "ta" ? "முக்கிய யோகங்கள்" : "Key yogas"}</GlossaryTerm>
              </StoryKicker>
              <Patterns chips={gifts} tone="good" lang={lang} />
            </>
          )}
        </StoryCard>

        <StoryCard style={{ background: "color-mix(in srgb, var(--color-low) 4%, var(--color-surface))" }}>
          <StoryKicker>{lang === "ta" ? "கவனமாகக் கையாள வேண்டியவை" : "Handle with care"}</StoryKicker>
          {summary?.weakestPlanet && (
            <>
              <PlanetLine graha={summary.weakestPlanet} score={summary.weakestPlanetScore} lang={lang} />
              <p style={quietText}>
                {typeof summary.weakestPlanetScore === "number"
                  ? strengthReassurance(summary.weakestPlanetScore, lang)
                  : lang === "ta" ? "நிலையில் மிகக் குறைந்த பலம் கொண்ட கிரகம்." : "Your lowest planet by position."}
              </p>
            </>
          )}
          {cautions[0] && <p style={bodyText}>{pick(cautions[0], lang)}</p>}
          {cares.length > 0 && (
            <>
              <StoryKicker>{lang === "ta" ? "கவனிக்க வேண்டிய அமைப்புகள்" : "Patterns to watch"}</StoryKicker>
              <Patterns chips={cares} tone="care" lang={lang} />
            </>
          )}
        </StoryCard>
      </div>

      {marriageDoshams.length > 0 && <MarriageDoshams doshams={marriageDoshams} lang={lang} />}

      {moreCount > 0 && (
        <Disclosure
          label={lang === "ta" ? `மேலும் ${moreCount} குறிப்புகள்` : `${moreCount} more notes`}
          openLabel={lang === "ta" ? "மூடு" : "Hide"}
        >
          <ul style={{ margin: 0, paddingLeft: "var(--space-4)", display: "grid", gap: "var(--space-1_5)" }}>
            {overflow.map((item, index) => (
              <li key={index} style={quietText}>
                {pick(item, lang)}
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
        {ownedAbove && (summary?.positives?.length || summary?.cautions?.length) ? (
          <SeeAlso
            label={lang === "ta" ? "ஜாதகத்தின் பலமும் கவனிக்க வேண்டியவையும்" : "Chart strengths and watch-outs"}
            onClick={() => onOpenSection?.("strengths")}
          />
        ) : null}
        <SeeAlso label={lang === "ta" ? "எல்லா யோகங்களும் தோஷங்களும் — ஜோதிடர் பார்வை" : "Every yoga and dosham — Astrologer view"} onClick={onShowAstrologer} />
        <SeeAlso
          label={lang === "ta" ? "இந்த வாரப் பரிகாரங்கள்" : "Remedies this week"}
          onClick={onOpenSection ? () => onOpenSection("remedies") : undefined}
        />
      </div>
    </div>
  );
}

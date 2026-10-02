"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Clock, Compass, Sparkles } from "lucide-react";

import { saniCycleName } from "@/lib/family-flags";
import { formatClockRange } from "@/lib/format";
import { tPlanetLord, type Lang } from "@/lib/i18n";
import type {
  PalanPolarity,
  PersonalPalan,
  PersonalPalanArea,
  PersonalPalanLucky,
  PersonalPalanPeriod,
  PersonalPalanSegment,
} from "@/lib/types";
import { PALAN_POLARITY_LABEL, palanAreaLabel, palanLeadAreas } from "@vinaadi/shared/personalPalan";

import { Card, Kicker, Segmented } from "./ui";

/**
 * இன்றைய பலன் · உங்கள் ஜாதகப்படி — Today in two minutes, from the reader's
 * own chart (proposal §5, owner rulings R6/R9/R10).
 *
 * It replaces the natal "Your chart in two minutes" reading on Today; that
 * reading lives on Family & Charts, where it is read in full.
 *
 * Every word comes from `dailyGuidance.personalPalan`: this component only
 * orders and labels. The headline polarity is the hero's own verdict, and the
 * best part of the day is the hero's featured window, so nothing here can
 * contradict the hero. Each member chip reads that member's own guidance,
 * which the Family bundle has already loaded; a chip costs no request.
 *
 * Layout (owner, 2026-09-23: presenter style is the default):
 *   1. Header: kicker + read time, title, and the view switch.
 *   2. Member chips.
 *   3. Verdict band: the day's word, and three glanceable facts (best time,
 *      lucky, soolam). The five-second read.
 *   4. The body: the presenter's running paragraphs, or the by-area grid.
 *   5. A pull-quote closing line and a quiet footer.
 * Styling lives in `.tp*` in dashboard-nova.css (media queries need CSS).
 */

export type PalanMember = {
  memberId: string;
  displayName: string;
  palan: PersonalPalan;
  /** The reader's own chart: life focus picks the lead areas (Q2: others neutral). */
  isSelf: boolean;
};

type PalanMode = "areas" | "presenter";
const MODE_KEY = "vinaadi-palan-mode";

const COPY = {
  kicker: { ta: "இன்று இரண்டு நிமிடத்தில்", en: "Today in two minutes" },
  readTime: (minutes: number) => ({ ta: `சுமார் ${minutes} நிமிடம்`, en: `≈ ${minutes} min` }),
  title: { ta: "இன்றைய பலன் · உங்கள் ஜாதகப்படி", en: "Today, from your chart" },
  memberTitle: (name: string) => ({ ta: `${name} · இன்றைய பலன்`, en: `${name} · today` }),
  you: { ta: "நீங்கள்", en: "You" },
  members: { ta: "யாருக்கான பலன்", en: "Whose palan" },
  verdict: {
    FAVOURABLE: { ta: "சாதகமான நாள்", en: "A favourable day" },
    MIXED: { ta: "கலவையான நாள்", en: "A mixed day" },
    CAUTION: { ta: "கவனம் தேவைப்படும் நாள்", en: "A day for care" },
  } satisfies Record<PalanPolarity, { ta: string; en: string }>,
  chandrashtama: { ta: "சந்திராஷ்டமம்", en: "Chandrashtama" },
  bestPart: { ta: "சிறந்த நேரம்", en: "Best time" },
  strength: { ta: "இன்று பலம்", en: "Strength today" },
  watch: { ta: "கவனிக்க வேண்டியது", en: "Watch for" },
  advice: { ta: "இன்றைய சிறப்பு அறிவுரை", en: "Today's advice" },
  worship: { ta: "வழிபாடு", en: "Worship" },
  lucky: { ta: "அதிர்ஷ்டம்", en: "Lucky today" },
  luckyValue: (colour: string, number: number, direction: string | null) => ({
    ta: `நிறம் ${colour} · எண் ${number}${direction ? ` · திசை ${direction}` : ""}`,
    en: `Colour ${colour} · number ${number}${direction ? ` · direction ${direction}` : ""}`,
  }),
  soolamLabel: { ta: "சூலம்", en: "Soolam" },
  soolamAdvice: { ta: "அத்திசைப் பயணம் தவிர்ப்பது நல்லது", en: "Travel that way is best avoided" },
  luckyWhy: { ta: "ஏன் இவை?", en: "Why these?" },
  allAreas: (n: number) => ({ ta: `மற்ற ${n} பகுதிகள்`, en: `${n} more areas` }),
  fewerAreas: { ta: "சுருக்கு", en: "Show fewer" },
  basis: { ta: "இது எதை வைத்துச் சொல்லப்படுகிறது?", en: "What is this read from?" },
  season: { ta: "இக்காலம்", en: "This period" },
  modeLabel: { ta: "காட்சி முறை", en: "View" },
  modeAreas: { ta: "பகுதிவாரி", en: "By area" },
  modePresenter: { ta: "தொகுப்பாளர் நடை", en: "Presenter style" },
  greeting: (name: string) => ({ ta: `${name}, வணக்கம்!`, en: `Good day, ${name}.` }),
  inFocus: { ta: "இக்காலத்தில் முன்னிலை", en: "In focus this period" },
  dasha: (maha: string, antar: string) => ({ ta: `${maha} தசை · ${antar} புக்தி`, en: `${maha} dasa · ${antar} bhukti` }),
  inHouse: (planet: string, house: number) => ({ ta: `${planet} ${house}-ஆம் இடத்தில்`, en: `${planet} in house ${house}` }),
  chartReading: { ta: "உங்கள் ஜாதகம் 2 & 5 நிமிடத்தில் · ஜாதகம் பக்கத்தில்", en: "Your chart in 2 & 5 minutes · on Family & Charts" },
} as const;

function tx(text: { ta: string; en: string }, lang: Lang): string {
  return lang === "ta" ? text.ta : text.en;
}

/** A per-viewer reading preference. Presenter style is the default; storage
 *  can be missing or blocked (private mode), and the card then stays on it. */
function loadMode(): PalanMode {
  try {
    return localStorage.getItem(MODE_KEY) === "areas" ? "areas" : "presenter";
  } catch {
    return "presenter";
  }
}

function saveMode(mode: PalanMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not remembered; the choice still applies for this visit.
  }
}

/** Spoken-pace estimate for the kicker: Tamil is read aloud more slowly. */
function readMinutes(segments: PersonalPalanSegment[], lang: Lang): number {
  const words = segments.reduce((sum, s) => sum + tx(s.text, lang).split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / (lang === "ta" ? 110 : 150)));
}

function PolarityMark({ polarity, lang }: { polarity: PalanPolarity; lang: Lang }) {
  return (
    <span className={`tp-mark tp-mark--${polarity.toLowerCase()}`}>
      <span className="tp-mark__dot" aria-hidden="true" />
      {tx(PALAN_POLARITY_LABEL[polarity], lang)}
    </span>
  );
}

function AreaCard({ area, lang }: { area: PersonalPalanArea; lang: Lang }) {
  return (
    <li className="tp-area">
      <div className="tp-area__head">
        <span className="tp-area__name">{palanAreaLabel(area.area, lang)}</span>
        <PolarityMark polarity={area.polarity} lang={lang} />
      </div>
      <p className="tp-area__text">{tx(area.text, lang)}</p>
      {area.periodNote && <p className="tp-area__note">{tx(area.periodNote, lang)}</p>}
    </li>
  );
}

/** The season the day is read against: dasha/bhukti, the Sani cycle, Guru and
 *  Rahu from the Moon. Every name here is a key rendered through its localiser
 *  (display boundary); the prose line is the server's. */
function PeriodBlock({ period, dashaAreas, lang }: { period: PersonalPalanPeriod; dashaAreas: readonly string[]; lang: Lang }) {
  const tags = [
    tx(COPY.dasha(tPlanetLord(period.mahaLord, lang), tPlanetLord(period.antarLord, lang)), lang),
    ...(period.saniCycle ? [saniCycleName(period.saniCycle, lang)] : []),
    ...(period.kandakaHouse != null && period.saniCycle !== "ARDHASHTAMA_SANI" ? [saniCycleName("KANDAKA_SANI", lang)] : []),
    tx(COPY.inHouse(tPlanetLord("JUPITER", lang), period.guruHouse), lang),
    tx(COPY.inHouse(tPlanetLord("RAHU", lang), period.rahuHouse), lang),
  ];
  return (
    <section aria-label={tx(COPY.season, lang)} className="tp-period">
      <Kicker tone="muted">{tx(COPY.season, lang)}</Kicker>
      <ul className="tp-period__tags">
        {tags.map((tag) => <li key={tag} className="tp-pill">{tag}</li>)}
      </ul>
      <p className="tp-period__text">
        {tx(period.text, lang)}
        {dashaAreas.length > 0 && (
          <>
            {" "}
            <strong>
              {tx(COPY.inFocus, lang)}: {dashaAreas.map((area) => palanAreaLabel(area, lang)).join(", ")}
            </strong>
          </>
        )}
      </p>
    </section>
  );
}

/** The verdict band's glanceable facts. `lucky` carries its rule one tap away. */
function FactTiles({ palan, lang }: { palan: PersonalPalan; lang: Lang }) {
  const [showWhy, setShowWhy] = useState(false);
  const bestWindow = palan.bestWindow;
  const lucky: PersonalPalanLucky | null | undefined = palan.lucky;
  if (!bestWindow && !lucky) return null;
  return (
    <div className="tp-facts">
      {bestWindow && (
        <div className="tp-fact">
          <span className="tp-fact__label"><Clock size={13} strokeWidth={2} aria-hidden="true" />{tx(COPY.bestPart, lang)}</span>
          <span className="tp-fact__value">{formatClockRange(bestWindow.start, bestWindow.end, lang === "ta" ? "ta" : undefined)}</span>
        </div>
      )}
      {lucky && (
        <div className="tp-fact">
          <span className="tp-fact__label"><Sparkles size={13} strokeWidth={2} aria-hidden="true" />{tx(COPY.lucky, lang)}</span>
          <span className="tp-fact__value">
            {tx(COPY.luckyValue(tx(lucky.colour, lang), lucky.number, lucky.directionName ? tx(lucky.directionName, lang) : null), lang)}
          </span>
          <button type="button" className="tp-link tp-link--inline" aria-expanded={showWhy} onClick={() => setShowWhy((v) => !v)}>
            {tx(COPY.luckyWhy, lang)}
            <ChevronDown size={13} strokeWidth={2} aria-hidden="true" className={showWhy ? "tp-flip" : undefined} />
          </button>
          {showWhy && <span className="tp-fact__why">{tx(lucky.text, lang)}</span>}
        </div>
      )}
      {lucky?.soolamName && (
        <div className="tp-fact">
          <span className="tp-fact__label"><Compass size={13} strokeWidth={2} aria-hidden="true" />{tx(COPY.soolamLabel, lang)}</span>
          <span className="tp-fact__value">{tx(lucky.soolamName, lang)}</span>
          <span className="tp-fact__why">{tx(COPY.soolamAdvice, lang)}</span>
        </div>
      )}
    </div>
  );
}

/** Paragraph breaks where a presenter takes a breath: the day and the season,
 *  the areas in two runs, then time, strength, advice, lucky and worship. */
function transcriptParagraphs(segments: PersonalPalanSegment[]): PersonalPalanSegment[][] {
  const opening = segments.filter((s) => s.kind === "OVERALL" || s.kind === "PERIOD");
  const areas = segments.filter((s) => s.kind === "AREA");
  const half = Math.ceil(areas.length / 2);
  const counsel = segments.filter((s) => ["TIME", "STRENGTH", "ADVICE", "LUCKY", "WORSHIP"].includes(s.kind));
  return [opening, areas.slice(0, half), areas.slice(half), counsel].filter((p) => p.length > 0);
}

/**
 * The palan as a TV rasipalan presenter says it: one voice talking through the
 * day in running paragraphs, opening with the person's name — no headings, no
 * labels, nothing that reads as a form (owner, 2026-09-23: "TV presenter like").
 * Every sentence is the server's (`transcript`), the same lines the area view
 * shows. Each segment stays its own span with `data-kind` so a later voice
 * reader can pause between them and highlight the one being spoken; `lang`
 * tells a speech engine which voice.
 */
function PresenterTranscript({ segments, greeting, lang }: { segments: PersonalPalanSegment[]; greeting: string; lang: Lang }) {
  const closing = segments.find((s) => s.kind === "CLOSING");
  return (
    <div lang={lang === "ta" ? "ta" : "en"} data-palan-transcript="" className="tp-script">
      {transcriptParagraphs(segments).map((paragraph, index) => (
        <p key={index} className="tp-script__para">
          {index === 0 && <strong className="tp-script__greeting">{greeting} </strong>}
          {paragraph.map((segment, i) => (
            <span key={`${segment.kind}-${segment.area ?? i}`} data-kind={segment.kind} data-area={segment.area ?? undefined}>
              {i > 0 ? " " : ""}
              {tx(segment.text, lang)}
            </span>
          ))}
        </p>
      ))}
      {closing && <blockquote className="tp-close" data-kind="CLOSING">{tx(closing.text, lang)}</blockquote>}
    </div>
  );
}
function AreasView({ palan, focusArea, lang }: { palan: PersonalPalan; focusArea: string | null; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const { lead, rest } = palanLeadAreas(palan, focusArea);
  type Bi = { ta: string; en: string };
  const counsel: { key: string; label: Bi; text: Bi }[] = [
    ...(palan.strength ? [{ key: "strength", label: COPY.strength, text: palan.strength }] : []),
    ...(palan.watch ? [{ key: "watch", label: COPY.watch, text: palan.watch }] : []),
    { key: "advice", label: COPY.advice, text: palan.advice },
    { key: "worship", label: COPY.worship, text: palan.worship },
  ];
  return (
    <>
      <p className="tp-overall">{tx(palan.overall, lang)}</p>
      {palan.period && <PeriodBlock period={palan.period} dashaAreas={palan.dashaAreas ?? []} lang={lang} />}
      <ul className="tp-areas">
        {lead.map((area) => <AreaCard key={area.area} area={area} lang={lang} />)}
        {expanded && rest.map((area) => <AreaCard key={area.area} area={area} lang={lang} />)}
      </ul>
      {rest.length > 0 && (
        <button type="button" className="tp-link" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? tx(COPY.fewerAreas, lang) : tx(COPY.allAreas(rest.length), lang)}
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" className={expanded ? "tp-flip" : undefined} />
        </button>
      )}
      <dl className="tp-counsel">
        {counsel.map((item) => (
          <div key={item.key} className="tp-counsel__item">
            <dt>{tx(item.label, lang)}</dt>
            <dd>{tx(item.text, lang)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "";
}

export function DashboardTodayPalanNova({
  lang,
  members,
  focusArea,
  onOpenChartReading,
}: {
  lang: Lang;
  members: PalanMember[];
  focusArea: string | null;
  onOpenChartReading?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [mode, setMode] = useState<PalanMode>("presenter");
  useEffect(() => { setMode(loadMode()); }, []);
  const chooseMode = (next: PalanMode) => { setMode(next); saveMode(next); };

  const selected = members.find((m) => m.memberId === selectedId) ?? members[0];
  if (!selected) return null;
  const { palan } = selected;
  const title = selected.isSelf ? COPY.title : COPY.memberTitle(selected.displayName);
  const transcript = palan.transcript ?? [];
  // A row cached before the transcript existed falls back to the area view.
  const presenter = mode === "presenter" && transcript.length > 0;
  const firstName = selected.displayName.trim().split(/\s+/)[0] || selected.displayName;

  return (
    <Card aria-labelledby="today-palan-title" className="tp" lang={lang === "ta" ? "ta" : "en"}>
      <header className="tp-head">
        <div className="tp-head__text">
          <Kicker>
            <Sparkles size={12} strokeWidth={2} aria-hidden="true" className="tp-kicker-icon" />
            {tx(COPY.kicker, lang)}
            {transcript.length > 0 && <span className="tp-head__time"> · {tx(COPY.readTime(readMinutes(transcript, lang)), lang)}</span>}
          </Kicker>
          <h2 id="today-palan-title" className="tp-head__title">{tx(title, lang)}</h2>
        </div>
        {transcript.length > 0 && (
          <Segmented<PalanMode>
            ariaLabel={tx(COPY.modeLabel, lang)}
            value={mode}
            onChange={chooseMode}
            className="tp-head__switch"
            options={[
              { key: "presenter", label: tx(COPY.modePresenter, lang) },
              { key: "areas", label: tx(COPY.modeAreas, lang) },
            ]}
          />
        )}
      </header>

      {members.length > 1 && (
        <div role="group" aria-label={tx(COPY.members, lang)} className="tp-members">
          {members.map((member) => {
            const active = member.memberId === selected.memberId;
            return (
              <button
                key={member.memberId}
                type="button"
                aria-pressed={active}
                className="tp-member"
                onClick={() => { setSelectedId(member.memberId); setShowBasis(false); }}
              >
                <span className="tp-member__avatar" aria-hidden="true">{initialOf(member.displayName)}</span>
                {member.isSelf ? tx(COPY.you, lang) : member.displayName}
              </button>
            );
          })}
        </div>
      )}

      {/* Wide screens: the script, with the verdict band as a sticky rail
          beside it. Narrow: the band first, then the script. */}
      <div className="tp-layout">
      {/* நாளின் மொத்த பலன் — the five-second read. */}
      <div className={`tp-band tp-band--${palan.overallPolarity.toLowerCase()}`}>
        <div className="tp-band__verdict">
          <span className="tp-band__dot" aria-hidden="true" />
          <span className="tp-band__word">{tx(COPY.verdict[palan.overallPolarity], lang)}</span>
          {palan.basis.isChandrashtama && <span className="tp-pill tp-pill--alert">{tx(COPY.chandrashtama, lang)}</span>}
        </div>
        <FactTiles key={selected.memberId} palan={palan} lang={lang} />
      </div>

      <div className="tp-body">
        {presenter ? (
          <PresenterTranscript segments={transcript} greeting={tx(COPY.greeting(firstName), lang)} lang={lang} />
        ) : (
          <AreasView key={selected.memberId} palan={palan} focusArea={selected.isSelf ? focusArea : null} lang={lang} />
        )}
        {/* நாளின் முடிவு வரி — inside the script in presenter mode. */}
        {!presenter && <blockquote className="tp-close">{tx(palan.closing, lang)}</blockquote>}
      </div>
      </div>

      <footer className="tp-foot">
        <button type="button" className="tp-link" aria-expanded={showBasis} onClick={() => setShowBasis((v) => !v)}>
          {tx(COPY.basis, lang)}
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" className={showBasis ? "tp-flip" : undefined} />
        </button>
        {onOpenChartReading && (
          <button type="button" className="tp-link" onClick={onOpenChartReading}>
            {tx(COPY.chartReading, lang)}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
        {showBasis && <p className="tp-foot__basis">{tx(palan.basis.text, lang)}</p>}
      </footer>
    </Card>
  );
}

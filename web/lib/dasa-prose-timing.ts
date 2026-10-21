/**
 * Finds timing claims typed into hand-written dasa prose (FSA-03).
 *
 * The owner's ruling: every dasa timing a page prints comes from the engine,
 * names its datum, and states an age from birth only as a range over the birth
 * balance. Prose cannot do any of that, so prose about dasas carries **no
 * timing at all** — the engine-rendered timeline beside it does.
 *
 * The rule is deliberately blunt: any digit in dasa prose is a claim. A
 * non-time number ("the eighth house") is written in words. That keeps the
 * check unambiguous; the earlier audit parser read only 21 of 27 pages because
 * it tried to understand phrasing.
 *
 * What it cannot see, by construction: a life stage standing in for an age
 * ("lands in adolescence", "by the time of marriage"). Whether a stage is true
 * depends on the balance, so those sentences are reviewed by hand.
 */

const DIGIT = /[0-9௦-௯]/;

const EN_DECADE = /\b(teens|teenage|twenties|thirties|forties|fifties|sixties|seventies|eighties|nineties)\b/i;
const EN_NUMBER_WORD =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred";
const EN_SPELLED_SPAN = new RegExp(`\\b(${EN_NUMBER_WORD})[\\s-]+(years?|yrs?|months?)\\b`, "i");
const EN_AGE_WORD = new RegExp(`\\b(age|ages|aged)\\s+(of\\s+)?(${EN_NUMBER_WORD})\\b`, "i");
const EN_ORDINAL_PERIOD =
  /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|final)\s+(sub-?period|bhukti|antardas\w*|year)\b/i;

const TA_DECADE = /(இருபது|முப்பது|நாற்பது|ஐம்பது|அறுபது|எழுபது|எண்பது|தொண்ணூறு)கள/;
const TA_NUMBER_WORD =
  "ஒரு|ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|ஆறு|ஏழு|எட்டு|ஒன்பது|பத்து|பதினொரு|பன்னிரண்டு|இருபது|முப்பது|நாற்பது|ஐம்பது|அறுபது|எழுபது|எண்பது";
const TA_SPELLED_SPAN = new RegExp(`(${TA_NUMBER_WORD})\\s*(வருட|ஆண்டு|மாத|வயது)`);

const RULES: readonly [string, RegExp][] = [
  ["digit", DIGIT],
  ["decade", EN_DECADE],
  ["spelled span", EN_SPELLED_SPAN],
  ["spelled age", EN_AGE_WORD],
  ["ordinal period", EN_ORDINAL_PERIOD],
  ["Tamil decade", TA_DECADE],
  ["Tamil spelled span", TA_SPELLED_SPAN],
];

/** Every timing claim in one piece of dasa prose, as "rule: …excerpt…". */
export function dasaProseTimingClaims(text: string): string[] {
  const claims: string[] = [];
  for (const [name, rule] of RULES) {
    const global = new RegExp(rule.source, rule.flags.includes("g") ? rule.flags : `${rule.flags}g`);
    for (const m of text.matchAll(global)) {
      const at = m.index ?? 0;
      claims.push(`${name}: …${text.slice(Math.max(0, at - 30), at + m[0].length + 20)}…`);
    }
  }
  return claims;
}

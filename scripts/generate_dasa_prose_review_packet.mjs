// Generates docs/DASA_PROSE_REVIEW_PACKET_2026-10-21.md: the dasa-prose cleanup of the
// 26 nakshatra visual pages, diffed against the commit before it, so every string
// shown is the string in the code. Usage: node scripts/generate_dasa_prose_review_packet.mjs [base]
// The base stays pinned to the pre-cleanup commit so the packet survives later commits.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/").replace(/\/$/, "");
const BASE = process.argv[2] ?? "ca0cb3b0";
const { dasaProseTimingClaims } = await import(pathToFileURL(`${ROOT}/web/lib/dasa-prose-timing.ts`).href);
const DIR = "web/app/(marketing)/natchathiram";
const gen = readFileSync(`${ROOT}/web/lib/generated/natchathiram-dasa-timings.ts`, "utf8");
const arr = new Function("return " + gen.slice(gen.indexOf("= [", gen.indexOf("export const NATCHATHIRAM_DASA_TIMINGS")) + 2, gen.lastIndexOf("];") + 1))();
const base = readFileSync(`${ROOT}/web/lib/natchathiram-data.ts`, "utf8");
const list = [...base.matchAll(/number: (\d+),\s+name_ta: "([^"]+)",\s+name_en: "([^"]+)",\s+slug: "([\w-]+)"/g)].map((m) => ({ n: +m[1], ta: m[2], en: m[3], slug: m[4] }));

const git = (p) => execFileSync("git", ["-C", ROOT, "show", `${BASE}:${p}`], { encoding: "utf8", maxBuffer: 1 << 26 });
const parse = (src) => {
  const lines = src.split(/\r?\n/);
  const find = (re, from = 0) => { for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i; return -1; };
  const enS = find(/^\s*dashaTimeline:/), enE = find(/^\s*spirituality:/, enS);
  const thS = find(/^\s*dashaThemes:/, enE), dtS = find(/^\s*dashaDetails:/, thS), taE = find(/^\s*spirituality:/, dtS);
  const fields = (a, b) => {
    const out = [];
    for (let i = a; i < b; i++) { const m = /^\s+(expect|navigate|focus): (".*"),\s*$/.exec(lines[i]); if (m) out.push([m[1], JSON.parse(m[2])]); }
    return out;
  };
  // Lines outside both dasa regions (for the star-name section).
  const outside = lines.filter((_, i) => !((i >= enS && i < enE) || (i >= thS && i < taE)));
  const planets = []; const enThemes = [];
  for (let i = enS; i < enE; i++) { const m = /planet: "(\w+)", theme: (".*"),/.exec(lines[i]); if (m) { planets.push(m[1]); enThemes.push(JSON.parse(m[2])); } }
  const taThemes = [];
  for (let i = thS + 1; i < dtS; i++) { const m = /^\s+(".*"),\s*$/.exec(lines[i]); if (m) taThemes.push(JSON.parse(m[1])); }
  return { planets, enThemes, taThemes, en: fields(enS, enE), ta: fields(dtS, taE), outside, all: lines };
};

// Fourth round (OWNER_RULINGS_FSA §9): astrologer's wording and T2 star names.
const RULED = [
  "Where marriage falls within this dasa, it is read from the seventh house and its lord",
  "இந்தத் தசைக்குள் திருமணம் அமைந்தால்",
  "not from this dasa's own nature",
  "இந்தத் தசையின் இயல்பால் அல்ல",
];
const STAR_NAMES = {
  anuradha: ["அனுராதா", /அனுஷ\S*/g],
  hasta: ["ஆஸ்தா", /ஹஸ்த\S*/g],
  punarvasu: ["புனர்வசு", /புனர்பூச\S*/g],
  "purva-ashadha": ["பூர்வ ஆஷாடா", /பூராட\S*/g],
  "uttara-ashadha": ["உத்தர ஆஷாடா", /உத்திராட\S*/g],
  jyeshtha: ["ஜ்யேஷ்டா", /கேட்டை\S*/g],
};
const bold = (s, re) => s.replace(re, (w) => `**${w}**`);
const tamilStrings = (line) => [...line.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`)).filter((x) => /[஀-௿]/.test(x));
let starNameLines = 0;
const trunc = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
const excerpts = (t) => dasaProseTimingClaims(t).map((c) => c.replace(/^[^:]+: …/, "").replace(/…$/, "")).slice(0, 3);
const rangeLabel = (a, b) => `${a.toFixed(0)}–${b.toFixed(0)}`;

let md = "";
const out = (s = "") => { md += s + "\n"; };
let totals = { en: 0, ta: 0, timingEn: 0, timingTa: 0, taAdded: 0 };
const sections = [];

const slugs = readdirSync(`${ROOT}/${DIR}`, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).filter((s) => s !== "rohini");
const order = list.filter((l) => slugs.includes(l.slug)).sort((a, b) => a.n - b.n);

for (const st of order) {
  const rel = `${DIR}/${st.slug}/visual/page.tsx`;
  let before; try { before = parse(git(rel)); } catch { continue; }
  const after = parse(readFileSync(`${ROOT}/${rel}`, "utf8"));
  const t = arr[st.n - 1];
  let s = "";
  const o = (x = "") => { s += x + "\n"; };
  o(`## ${st.n}. ${st.ta} (${st.en}) — \`${st.slug}\`, opens in ${t.openingLord}`);
  o();
  o(`Engine ranges (age in years, over the birth balance; first eight dasas):`);
  o();
  o(`| Dasa | Starts | Ends |`); o(`|---|---|---|`);
  t.mahadashas.slice(0, 8).forEach((m) => o(`| ${m.lord} | ${rangeLabel(m.minStartAgeYears, m.maxStartAgeYears)} | ${rangeLabel(m.minEndAgeYears, m.maxEndAgeYears)} |`));
  o();
  o(`Release conditions for this page (OWNER_RULINGS_FSA §8.2) — sign when done:`);
  o();
  o(`- [ ] 1. Tamil strings below reviewed for naturalness, grammar, meaning — reviewer: ______  date: ______`);
  o(`- [ ] 2. Personality, career, family sections reviewed for unsupported / over-deterministic claims (outside this packet)`);
  o(`- [ ] 3. Life-stage wording checked against the table above`);
  o(`- [ ] 4. English and Tamil carry the same astrological meaning`);
  o(`- [ ] 5. After release: tests run, sitemap inclusion verified`);
  o();
  let any = false;
  for (let d = 0; d < after.planets.length; d++) {
    let block = "";
    const b = (x = "") => { block += x + "\n"; };
    const addedTa = d >= before.ta.length / 3;
    const fieldNames = ["expect", "navigate", "focus"];
    for (const lang of ["en", "ta"]) {
      for (let f = 0; f < 3; f++) {
        const idx = d * 3 + f;
        const a = after[lang][idx]?.[1];
        const bf = before[lang][idx]?.[1];
        if (a === undefined) continue;
        const isNew = bf === undefined;
        if (!isNew && a === bf) continue;
        const removed = isNew ? [] : excerpts(bf);
        totals[lang]++;
        if (removed.length) totals[lang === "en" ? "timingEn" : "timingTa"]++;
        if (isNew) totals.taAdded++;
        const ruled = RULED.some((r) => a.includes(r)) ? " — **contains the astrologer's ruled marriage wording (§9)**" : "";
        const sn = STAR_NAMES[st.slug];
        const renamed = sn && bf && bf.includes(sn[0]) && !a.includes(sn[0]) ? " — star name now in its almanac form (check the case ending)" : "";
        b(`**${lang.toUpperCase()} · ${fieldNames[f]}**${isNew ? " — **NEW (no Tamil existed for this dasa; English fell back in Tamil mode)**" : ""}${ruled}${renamed}${removed.length ? ` — timing removed: ${removed.map((x) => "“" + trunc(x.replace(/\s+/g, " "), 70) + "”").join("; ")}` : ""}`);
        b();
        b(`> ${a}`);
        b();
      }
    }
    if (block) {
      any = true;
      o(`### ${st.n}.${d + 1} ${after.planets[d]} dasa — ${after.enThemes[d]}${after.taThemes[d] ? ` / ${after.taThemes[d]}` : ""}`);
      o();
      o(block);
    }
  }
  if (!any) o("_No dasa prose changed._\n");
  const sn = STAR_NAMES[st.slug];
  if (sn) {
    const headLines = new Set(before.all.map((l) => l.trim()));
    const changed = after.outside.filter((l) => !headLines.has(l.trim()) && l.match(sn[1]));
    o(`### ${st.n}.S Star names outside the dasa sections (T2) — ${changed.length} changed line(s)`);
    o();
    o(`Replaced by the astrologer's suffix table (§9.3): ${sn[0]} → almanac name, bold below. Check each for case ending and for words that still agree with the old form.${sn[0].includes("ஆஷாடா") ? ` The etymology line (“${sn[0]} என்றால் …”) was left unchanged on purpose — T2 item 1.` : ""}`);
    o();
    for (const l of changed) {
      for (const x of tamilStrings(l)) { if (x.match(sn[1])) { o(`> ${bold(x, sn[1])}`); o(); starNameLines++; } }
    }
  }
  sections.push(s);
}

out(`# Dasa prose cleanup — review packet (26 visual pages)`);
out();
out(`Generated by \`scripts/generate_dasa_prose_review_packet.mjs\` from \`git diff ${BASE}\` (the commit before the cleanup) against the working tree, so every string below is the string in the code. Rohini was the pilot and is not repeated here; see \`OWNER_RULINGS_FSA_2026-10-21.md\` §7.1.`);
out();
out(`**Regenerated after the fourth round (§9 of the rulings).** It now includes the astrologer's marriage wording (tagged “ruled marriage wording”), the six A2 changes, and the star-name replacements in the six affected pages (dasa strings tagged “star name now in its almanac form”, plus a “Star names outside the dasa sections” block per page). The requests to each reviewer are in \`REVIEW_REQUESTS_2026-10-21.md\`.`);
out();
out(`**Status: all 27 visual pages remain on the dasa-timing hold and noindex.** Nothing here releases a page. Per §8.2 a page is released only when its five conditions are signed, and the release is the owner's decision.`);
out();
out(`## How to read this`);
out();
out(`1. Each star has the engine's age ranges (so the life-stage wording can be checked against them), a five-line sign-off block, then every edited string, grouped by dasa. Only strings that changed are listed; unchanged strings are not re-presented.`);
out(`2. A line such as “timing removed: …” quotes up to three of the phrases the old text carried (digits, decade words, ordinal sub-periods). They are quoted so you can see what kind of claim went, not to be restored.`);
out(`3. **Review order that costs least:** first the strings marked **NEW** (Tamil that did not exist before), then Tamil strings generally, then English.`);
out();
out(`## Totals`);
out();
out(`- Strings rewritten: **${totals.en} English**, **${totals.ta} Tamil** (of which **${totals.taAdded} are new Tamil**).`);
out(`- Strings that carried at least one timing claim: ${totals.timingEn} English, ${totals.timingTa} Tamil.`);
out(`- Gate: every page's dasa prose now has zero timing claims under \`web/lib/dasa-prose-timing.ts\`; \`web/lib/natchathiram-dasa-prose.test.ts\` passes (122), \`tsc --noEmit\` is clean. Before this change the same detector found 121–314 raw matches per page.`);
out();
out(`## What the gate cannot see (read this before signing anything)`);
out();
out(`The detector bans digits, decade words, spelled durations and ordinal sub-periods. It cannot tell whether a **life stage** is true for the page's range. Every stage word below was written conditionally against the table beside it ("where the balance reaches the school years…", "for the later padas… for the first pada…"), but that is the author's reading and is exactly what condition 3 asks you to confirm. Words to look for: school, college, university, adolescence, young adulthood, mid-life, marriage, children, grandchildren, retirement.`);
out();
out(`Also not checked by any gate: the Tamil's naturalness, and whether English and Tamil mean the same thing (conditions 1 and 4).`);
out();
out(`## Doctrine corrections made while rewriting (for the astrologer)`);
out();
out(`These are not wording edits; they change what a page claims. Each is a place where the old text was wrong, not merely badly timed.`);
out();
out(`1. **Ashwini — Venus's houses.** The page said Venus "rules both the lagna and 6th house for Aries ascendant". Venus rules the 2nd and 7th from Mesha. Now: "the second and seventh houses from Mesha — wealth and partnership."`);
out(`2. **Bhukti placement, every page.** The hand-typed "yr N of the dasa" placements were wrong in the pattern the 2026-10-21 audit found (e.g. Ashlesha's Mercury–Rahu "ages 13–15"; Mercury–Mars "early teens" on Jyeshtha; Krittika's Moon–Rahu "peer pressure at 14–15" — it falls in early childhood). The narrative that rested on a wrong placement was rewritten to follow the engine's table, or dropped.`);
out(`3. **Marriage windows removed.** Statements of the form "marriage in Venus–Moon or Venus–Jupiter, ages 21–26" were deleted: on the engine's arithmetic Venus–Jupiter begins about ten years into Venus dasa, so the stated ages could not hold. Marriage is now described as read from Venus, Jupiter and the seventh house of the horoscope, within the dasa where it falls — a tendency, not a placement.`);
out(`   **Ruled (§9.1–9.2):** general form accepted, no universal bhukti or age. The astrologer's own sentence (“Where marriage falls within this dasa, it is read from the seventh house and its lord …” / “இந்தத் தசைக்குள் திருமணம் அமைந்தால் …”) now fills the three slots (Bharani Moon, Purva Ashadha Moon, Ashwini Venus) and replaces Magha's; Ashwini's remedies line is deleted; Shravana and Uttara Ashadha are reworded (“Rahu is not a significator of marriage”); Ashlesha says “may fall”; Bharani's Venus clause is cut. The same sentence classes on 18 more pages await the astrologer's A3 answer and are unchanged here.`);
out(`4. **Rasi-lord dasa ages.** Several pages told the reader when the rasi lord's dasa arrives ("Saturn dasa at ages 51–70" on Shravana; the engine says it starts 41–51). The ages are gone; the declaration that this is the rasi lord's dasa is kept on every page where it applies.`);
out(`5. **Houses by pada.** Pages that mix two rasis (Krittika, Mrigashira, Punarvasu, Chitra, Uttara Phalguni, Vishakha, Uttara Ashadha, Purva Bhadra, Dhanishtha) keep their pada-by-pada treatment; the pada ↔ rasi mapping was left as the page had it and should be checked once against the chosen almanac.`);
out();
out(`## Defects found in the old Tamil (fixed here; same class may exist elsewhere)`);
out();
out(`- **21 of the 26 pages had seven Tamil dasa bodies for eight dasas** (Ashwini, Bharani, Krittika, Mrigashira and Revati were complete). The eighth dasa fell back to English in Tamil mode, so a Tamil reader saw a page that switched language mid-list. Each now has a Tamil body; these are the **NEW** strings (63 of them: 21 pages × expect / navigate / focus), and they are the highest-priority Tamil to review. They are the very-late-life dasas, so the content is brief, but they are Tamil that nobody has read.`);
out(`- **Stray Korean characters in Tamil text:** Ashlesha ("충동"), Dhanishtha ("온기"), Punarvasu ("일찍"), Pushya ("넘쳐", outside the dasa region — fixed in the core-strengths line). They were inside the strings that were rewritten, except Pushya's, which was a one-word fix.`);
out(`- **English left inside Tamil:** "~yr 12", "(~13 வயது)" fragments, and the English word "flag" rendered as கொடியாளி ("flagger"). Replaced with a plain Tamil phrase (ராசி அதிபதி அடையாளம்).`);
out(`- **Wrong Tamil words:** "மரக்கால" (not a word for "mystical") on Shatabhisha → மறைஞான/மறைபொருள்; "கோடை" ("summer") used for "tidal" on several pages → அலை/கடல்; Sanskritised star names inside prose (ஆஸ்தா, ஜ்யேஷ்டா, அனுராதா, பூர்வ ஆஷாடா …) → the almanac names used by the site (ஹஸ்தம், கேட்டை, அனுஷம், பூராடம் …) in every string rewritten.`);
out(`- **Sanskritised names outside the dasa sections — now replaced (§9.3):** 88 of 90 uses across Anuradha, Hasta, Punarvasu, Jyeshtha, Purva Ashadha and Uttara Ashadha, by the astrologer's suffix table. -ம் names take -த்த- (அனுஷத்தின்), கேட்டை takes -ய்- (கேட்டையின்), and attributive uses take the bare stem (ஹஸ்த குழந்தைக்கு). The two etymology lines were left unchanged on purpose. ஆஸ்தா was a typo for ஹஸ்தா. Each page's “Star names outside the dasa sections” block lists the changed lines.`);
out(`- **Not fixed (flag for the Tamil review):** many *unchanged* Tamil dasa strings are much shorter than their English twins, which condition 4 will catch.`);
out();
out(`## Method (so the next reader can repeat it)`);
out();
out(`Per page: read the engine's ranges → rewrite each flagged string so that (a) no timing is typed, (b) every bhukti reference points at the bhukti table ("the table below gives when it begins and how long it lasts"), (c) every life stage is conditional on the pada / balance, (d) rasi-lord declaration kept, (e) remedies and temples untouched → splice into the page (\`scratchpad/splice.mjs\`, which refuses to write if a field count is wrong or a placeholder is left) → detector must return zero.`);
out();
out(`---`);
out();
out(sections.join("\n"));
writeFileSync(`${ROOT}/docs/DASA_PROSE_REVIEW_PACKET_2026-10-21.md`, md, "utf8");
console.log("written", md.length, "chars;", JSON.stringify(totals), "starNameStrings:", starNameLines);

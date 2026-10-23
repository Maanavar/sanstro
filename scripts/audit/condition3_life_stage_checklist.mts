// Condition-3 checklist (OWNER_RULINGS_FSA §8.2): every life-stage word in the
// visual pages' dasa prose, checked per pada against the engine's age ranges.
//   node scripts/audit/condition3_life_stage_checklist.mts . > body.md
// Output is the body of docs/CONDITION3_LIFE_STAGE_CHECKLIST_<date>.md.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.argv[2];
const WEB = path.join(ROOT, "web");
const { NATCHATHIRAM_DASA_TIMINGS } = await import(
  pathToFileURL(path.join(WEB, "lib/generated/natchathiram-dasa-timings.ts")).href
);

// Working bands (age in years) for "the stage falls in this dasa". Assumptions
// for the content reviewer to correct, not doctrine.
const BANDS: Record<string, [number, number]> = {
  school: [5, 17],
  college: [17, 22],
  marriage: [21, 35],
  retirement: [58, 62],
};

const FAMILIES: Record<string, { en: RegExp; ta: RegExp }> = {
  school: { en: /\bschool/i, ta: /பள்ளி/ },
  college: { en: /\b(college|universit)/i, ta: /(கல்லூரி|பல்கலை)/ },
  marriage: { en: /\b(marriage|married|marry|marries|wedding)/i, ta: /(திருமண|விவாக)/ },
  retirement: { en: /\bretire/i, ta: /(ஓய்வு பெற|பணி ஓய்வு|ஓய்வூதிய|ஓய்வுக்கால|ஓய்வுக் கால)/ },
};

const CONDITIONAL = {
  en: /\b(where|if|for some|for the (earlier|later|first|last|longer|shorter)|depending|by pada|when the balance|the pada decides|pada|padas|balance)\b/i,
  ta: /(மானால்|ந்தால்|ண்டால்|ட்டால்|ன்றால்|பாதத்தில்|பாதங்களில்|இருப்பில்|இருப்பு|இருந்தால்|என்றால்|எனில்|சில பாதங்|பாதத்தைப் பொறுத்து|பாதங்களுக்கு|பாதத்துக்கு|பொறுத்து|நீடித்தால்|வந்தால்|அமைந்தால்|நடந்தால்|வரும்போது|எட்டினால்)/,
};

// A stage that may belong to the native's children, not the native.
const OTHERS = {
  en: /\b(child|children|son|sons|daughter|daughters|grandchild|grandchildren|offspring|parent council)\b/i,
  ta: /(பிள்ளை|குழந்தை|மகன்|மகள்|பேரன்|பேத்தி|வாரிசு|பெற்றோர் குழு)/,
};

const listSrc = readFileSync(path.join(WEB, "lib/natchathiram-data.ts"), "utf8");
const numberOf = new Map<string, number>();
for (const m of listSrc.matchAll(/number:\s*(\d+),[^}]*?slug:\s*"([a-z-]+)"/g)) numberOf.set(m[2], Number(m[1]));
const nameOf = new Map<string, string>();
for (const m of listSrc.matchAll(/name_en:\s*"([^"]+)",\s*slug:\s*"([a-z-]+)"/g)) nameOf.set(m[2], m[1]);

const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
const unq = (s: string) => JSON.parse(`"${s}"`) as string;

function region(src: string, key: string): string {
  const start = src.indexOf(key);
  if (start < 0) return "";
  const end = src.indexOf("spirituality:", start);
  return src.slice(start, end < 0 ? undefined : end);
}

type Prose = { expect: string; navigate: string; focus: string };
function proseBlocks(block: string): Prose[] {
  const re = new RegExp(String.raw`expect:\s*${STR},\s*navigate:\s*${STR},\s*focus:\s*${STR}`, "g");
  return [...block.matchAll(re)].map((m) => ({ expect: unq(m[1]), navigate: unq(m[2]), focus: unq(m[3]) }));
}

const sentences = (text: string) => text.split(/(?<=[.!?।])\s+/).filter(Boolean);
const overlaps = (a: number, b: number, [lo, hi]: [number, number]) => a < hi && b > lo;

type Timing = (typeof NATCHATHIRAM_DASA_TIMINGS)[number];
/** Per pada: "all" (stage in this dasa for every birth in the pada), "part", or "none". */
function padaCoverage(t: Timing, dasaIndex: number, band: [number, number]): ("all" | "part" | "none")[] {
  const before = t.mahadashas.slice(1, dasaIndex).reduce((s: number, d: { years: number }) => s + d.years, 0);
  const years = t.mahadashas[dasaIndex].years;
  return t.balanceByPada.map((p: { minYears: number; maxYears: number }) => {
    const span = (bal: number): [number, number] =>
      dasaIndex === 0 ? [0, bal] : [bal + before, bal + before + years];
    const hits = [p.minYears, p.maxYears].map((bal) => overlaps(...span(bal), band));
    return hits.every(Boolean) ? "all" : hits.some(Boolean) ? "part" : "none";
  });
}

type Hit = {
  slug: string; dasa: string; idx: number; lang: "en" | "ta"; field: string;
  family: string; sentence: string; cover: string[]; verdict: "FLAG" | "CHECK" | "OK"; why: string;
};
const hits: Hit[] = [];
const problems: string[] = [];

const pagesDir = path.join(WEB, "app/(marketing)/natchathiram");
for (const slug of readdirSync(pagesDir).sort()) {
  const file = path.join(pagesDir, slug, "visual", "page.tsx");
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  const n = numberOf.get(slug);
  const t = NATCHATHIRAM_DASA_TIMINGS.find((x: Timing) => x.nakshatra === n);
  if (!t) { problems.push(`${slug}: no timings`); continue; }
  const en = proseBlocks(region(src, "dashaTimeline:"));
  const ta = proseBlocks(region(src, "dashaDetails:"));
  if (en.length !== ta.length) problems.push(`${slug}: ${en.length} EN vs ${ta.length} TA dasa blocks`);
  for (const [lang, blocks] of [["en", en], ["ta", ta]] as const) {
    blocks.forEach((b, idx) => {
      const dasa = t.mahadashas[idx]?.lord ?? "?";
      for (const field of ["expect", "navigate", "focus"] as const) {
        for (const s of sentences(b[field])) {
          for (const [family, re] of Object.entries(FAMILIES)) {
            if (!re[lang].test(s)) continue;
            // ஓய்வு எடு / ஓய்வு தேவை: taking rest, not retirement.
            if (lang === "ta" && family === "retirement" && /ஓய்வு\s*(எடு|தேவை|கொடு|அவசிய)/.test(s) && !/(பணி ஓய்வு|ஓய்வு பெற|ஓய்வூதிய)/.test(s)) continue;
            const others = OTHERS[lang].test(s);
            const cover = padaCoverage(t, idx, BANDS[family]);
            const all = cover.every((c) => c === "all");
            const none = cover.every((c) => c === "none");
            const cond = CONDITIONAL[lang].test(s);
            let verdict: Hit["verdict"], why: string;
            if (others && !all) { verdict = "CHECK"; why = "may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age"; }
            else if (all) { verdict = "OK"; why = "true for every pada"; }
            else if (none) { verdict = "FLAG"; why = "stage falls outside this dasa for every pada"; }
            else if (cond) { verdict = "CHECK"; why = "true for some padas; sentence is conditional: confirm it names the right ones"; }
            else { verdict = "FLAG"; why = "true for some padas only; sentence is unconditional"; }
            if (lang === "ta" && family === "retirement" && !/(பெற|பணி ஓய்வு|ஓய்வூதிய|ஓய்வுக்)/.test(s)) {
              why += "; bare ஓய்வு may mean rest, not retirement";
            }
            hits.push({ slug, dasa, idx, lang, field, family, sentence: s, cover, verdict, why });
          }
        }
      }
    });
  }
}

const fmtCover = (c: string[]) => c.map((v, i) => `P${i + 1} ${v}`).join(", ");
const count = (f: (h: Hit) => boolean) => hits.filter(f).length;
const out: string[] = [];
out.push(`| Page | Hits | FLAG | CHECK | OK |`, `|---|---|---|---|---|`);
const slugs = [...new Set(hits.map((h) => h.slug))];
for (const s of slugs) {
  out.push(`| ${nameOf.get(s) ?? s} | ${count((h) => h.slug === s)} | ${count((h) => h.slug === s && h.verdict === "FLAG")} | ${count((h) => h.slug === s && h.verdict === "CHECK")} | ${count((h) => h.slug === s && h.verdict === "OK")} |`);
}
out.push(`| **Total** | **${hits.length}** | **${count((h) => h.verdict === "FLAG")}** | **${count((h) => h.verdict === "CHECK")}** | **${count((h) => h.verdict === "OK")}** |`, "");
for (const s of slugs) {
  const rows = hits.filter((h) => h.slug === s && h.verdict !== "OK");
  out.push(`### ${nameOf.get(s) ?? s} (\`${s}\`)`, "");
  if (!rows.length) { out.push("Nothing to review: every hit is true for every pada.", ""); continue; }
  for (const h of rows.sort((a, b) => a.idx - b.idx || a.lang.localeCompare(b.lang))) {
    out.push(`- [ ] **${h.verdict}** · ${h.dasa} dasa · ${h.lang.toUpperCase()} ${h.field} · ${h.family} · ${fmtCover(h.cover)}`,
      `  ${h.why}.`, `  > ${h.sentence}`, "");
  }
  const ok = hits.filter((h) => h.slug === s && h.verdict === "OK");
  if (ok.length) out.push(`OK, not listed: ${ok.map((h) => `${h.dasa} ${h.lang.toUpperCase()} ${h.family}`).join("; ")}.`, "");
}
if (problems.length) out.push("## Parser problems", "", ...problems.map((p) => `- ${p}`), "");
process.stdout.write(out.join("\n"));

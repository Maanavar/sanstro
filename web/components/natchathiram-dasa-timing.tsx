import type {
  BhuktiTiming,
  MahadashaTiming,
  NakshatraDasaTimings,
} from "@/lib/generated/natchathiram-dasa-timings";
import { tPlanetLord } from "@/lib/i18n";

/**
 * Renders the engine's Vimshottari numbers for a nakshatra page (FSA-03).
 *
 * Every number here comes from `web/lib/generated/natchathiram-dasa-timings.ts`,
 * which `scripts/generate_natchathiram_dasa_timings.py` writes from
 * `app/calculations/dasha.py`. This file only formats; it does no arithmetic
 * (the owner's ruling: no second implementation of Vimshottari in the frontend).
 *
 * Two rules from the same ruling shape the wording:
 * - every bhukti time names its datum — "after Venus dasa begins";
 * - an age from birth is only ever a range over the birth balance, and says so.
 */

type Lang = "en" | "ta";

const UNITS = {
  en: { y: "yr", m: "mo", d: "d" },
  ta: { y: "வருடம்", m: "மாதம்", d: "நாள்" },
} as const;

/** [y, m, d] -> "3 yr 4 mo" / "3 வருடம் 4 மாதம்"; zero parts dropped, all-zero -> "0". */
export function formatSpan(span: readonly number[], lang: Lang): string {
  const u = UNITS[lang];
  const [y = 0, m = 0, d = 0] = span;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${u.y}`);
  if (m) parts.push(`${m} ${u.m}`);
  if (d) parts.push(`${d} ${u.d}`);
  return parts.length ? parts.join(" ") : "0";
}

/** An age from birth: zero reads "birth", not "0". */
function formatAge(span: readonly number[], lang: Lang): string {
  return span.every((n) => n === 0) ? (lang === "ta" ? "பிறப்பு" : "birth") : formatSpan(span, lang);
}

function dasaName(lord: string, lang: Lang): string {
  return lang === "ta" ? `${tPlanetLord(lord, lang)} தசை` : `${tPlanetLord(lord, lang)} dasha`;
}

/** The one-line timing under a mahadasha on the timeline. */
export function mahadashaSpanLabel(md: MahadashaTiming, lang: Lang): string {
  if (md.isOpening) {
    return lang === "ta"
      ? `பிறப்பில் நடப்பது · தசா இருப்பு ${md.years} ${UNITS.ta.y} வரை`
      : `Running at birth · up to ${md.years} ${UNITS.en.y} left`;
  }
  const from = formatAge(md.minStartAge, lang);
  const to = formatAge(md.maxStartAge, lang);
  return lang === "ta"
    ? `${md.years} ${UNITS.ta.y} · தொடங்கும் வயது ${from} – ${to}`
    : `${md.years} ${UNITS.en.y} · starts between ${from === "birth" ? "birth" : `age ${from}`} and ${to}`;
}

function bhuktiAgeLabel(b: BhuktiTiming, lang: Lang): string {
  const to = formatAge(b.maxStartAge, lang);
  if (b.canPrecedeBirth) {
    return lang === "ta" ? `பிறப்புக்கு முன் – ${to}` : `before birth – ${to}`;
  }
  return `${formatAge(b.minStartAge, lang)} – ${to}`;
}

export const DASA_TIMING_NOTE = {
  en:
    "Ages are ranges, never one age. Where in the star you were born decides how much of the first dasha is left at birth — the birth balance, anything from almost none of it to all of it — and every later dasha moves with it. Bhukti times are counted from the start of their own mahadasha. Computed by the Vimshottari engine, in years of 365.25 days.",
  ta:
    "வயதுகள் ஒரு வரம்பாகவே தரப்பட்டுள்ளன, ஒரே வயதாக அல்ல. நட்சத்திரத்தின் எந்தப் பகுதியில் பிறந்தீர்கள் என்பதைப் பொறுத்து, பிறக்கும்போது முதல் தசையில் மீதமுள்ள காலம் (தசா இருப்பு) கிட்டத்தட்ட ஒன்றுமில்லாததிலிருந்து முழுக் காலம் வரை மாறும்; அடுத்த தசைகள் அனைத்தும் அதனுடன் நகரும். ஒவ்வொரு புக்தியின் காலமும் அதன் மகா தசை தொடங்கியதிலிருந்து கணக்கிடப்படுகிறது. விம்சோத்தரி கணிப்பு, 365.25 நாள் கொண்ட வருடம்.",
} as const;

const TABLE = { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.85rem", margin: "0 0 1.25rem" };
const CELL = { padding: "0.4rem 0.6rem", borderBottom: "1px solid var(--cl-border-2, var(--panel-tan-light))", textAlign: "left" as const };

/**
 * The base page's dasa summary: the balance a birth in each pada leaves, then
 * each mahadasha's length and the age range it starts in. No hooks, so it
 * renders in the server page as well as a client one.
 */
export function DasaSummaryTables({ timings, lang }: { timings: NakshatraDasaTimings; lang: Lang }) {
  const ta = lang === "ta";
  const opening = dasaName(timings.openingLord, lang);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={TABLE}>
        <caption style={{ captionSide: "top", textAlign: "left", fontWeight: 700, padding: "0 0 0.4rem" }}>
          {ta ? `பிறக்கும்போது ${opening} இருப்பு — பாதம் வாரியாக` : `${opening} left at birth (birth balance), by pada`}
        </caption>
        <thead>
          <tr>
            <th scope="col" style={CELL}>{ta ? "பாதம்" : "Pada"}</th>
            <th scope="col" style={CELL}>{ta ? "தசா இருப்பு (வரம்பு)" : "Balance (range)"}</th>
          </tr>
        </thead>
        <tbody>
          {timings.balanceByPada.map((p) => (
            <tr key={p.pada}>
              <th scope="row" style={{ ...CELL, fontWeight: 600 }}>{p.pada}</th>
              <td style={CELL}>{formatSpan(p.min, lang)} – {formatSpan(p.max, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={TABLE}>
        <caption style={{ captionSide: "top", textAlign: "left", fontWeight: 700, padding: "0 0 0.4rem" }}>
          {ta ? "மகா தசைகள் — வரிசை, காலம், தொடங்கும் வயது" : "Mahadashas — order, length, and the age each begins"}
        </caption>
        <thead>
          <tr>
            <th scope="col" style={CELL}>{ta ? "தசை" : "Dasha"}</th>
            <th scope="col" style={CELL}>{ta ? "முழுக் காலம்" : "Full length"}</th>
            <th scope="col" style={CELL}>{ta ? "தொடங்கும் வயது (வரம்பு)" : "Begins at age (range)"}</th>
          </tr>
        </thead>
        <tbody>
          {timings.mahadashas.map((md) => (
            <tr key={md.lord}>
              <th scope="row" style={{ ...CELL, fontWeight: 600 }}>{dasaName(md.lord, lang)}</th>
              <td style={CELL}>{md.years} {UNITS[lang].y}</td>
              <td style={CELL}>
                {md.isOpening
                  ? (ta ? "பிறப்பில் நடப்பது" : "running at birth")
                  : `${formatAge(md.minStartAge, lang)} – ${formatAge(md.maxStartAge, lang)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The bhukti table inside a dasha's detail panel. */
export function BhuktiTable({ md, lang, color }: { md: MahadashaTiming; lang: Lang; color: string }) {
  const ta = lang === "ta";
  const head = ta
    ? { bhukti: "புக்தி", begins: `${dasaName(md.lord, lang)} தொடங்கி`, lasts: "காலம்", age: "தொடங்கும் வயது (வரம்பு)" }
    : { bhukti: "Bhukti", begins: `After ${dasaName(md.lord, lang)} begins`, lasts: "Lasts", age: "Age at start (range)" };
  const cell = { padding: "0.4rem 0.6rem", borderBottom: "1px solid var(--panel-tan-light)", textAlign: "left" as const };
  return (
    <div style={{ marginTop: "1.25rem", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", color: "var(--panel-earth)" }}>
        <caption style={{ captionSide: "top", textAlign: "left", fontWeight: 700, color, padding: "0 0 0.4rem" }}>
          {ta ? `${dasaName(md.lord, lang)} — புக்திகள்` : `${dasaName(md.lord, lang)} — bhuktis`}
        </caption>
        <thead>
          <tr>
            <th scope="col" style={cell}>{head.bhukti}</th>
            <th scope="col" style={cell}>{head.begins}</th>
            <th scope="col" style={cell}>{head.lasts}</th>
            <th scope="col" style={cell}>{head.age}</th>
          </tr>
        </thead>
        <tbody>
          {md.bhuktis.map((b) => (
            <tr key={b.lord}>
              <th scope="row" style={{ ...cell, fontWeight: 600 }}>
                {tPlanetLord(md.lord, lang)}–{tPlanetLord(b.lord, lang)}
              </th>
              <td style={cell}>
                {b.offsetYears === 0 ? (ta ? "தொடக்கத்திலேயே" : "at the start") : formatSpan(b.offset, lang)}
              </td>
              <td style={cell}>{formatSpan(b.duration, lang)}</td>
              <td style={cell}>{bhuktiAgeLabel(b, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

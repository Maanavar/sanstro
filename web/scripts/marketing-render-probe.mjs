#!/usr/bin/env node
/**
 * Does a marketing page still render its own copy — in both languages?
 *
 * Written for F7, where `lib/marketing-i18n.ts` was split into 45 per-page
 * modules behind a re-export barrel. `next build` succeeding proves the modules
 * resolve; it does not prove a page renders. The failure a barrel split can
 * introduce is quiet: a page that lost some keys still returns 200 and renders
 * blank headings, and neither tsc nor the build says a word.
 *
 * It asks over HTTP rather than through a browser, and that is not a shortcut —
 * it is the more direct instrument here. These routes are `ƒ` Dynamic (the root
 * layout does `await cookies()`), and `LangProvider`'s initial state IS the
 * cookie's language, so the server-rendered HTML already contains the active
 * language's copy. Sending `jothidam-lang=ta` therefore exercises exactly the
 * half of every `BiStr` that a browser toggle would reach — and a `BiStr` is
 * `{ en, ta }`, so a half-moved module can be whole in English and empty in
 * Tamil, which is the failure a spot-check in English would miss.
 *
 * Usage:
 *   node node_modules/next/dist/bin/next start -p 3200
 *   node scripts/marketing-render-probe.mjs [baseUrl]
 *
 * NOTE: a `next dev` server running against this checkout rewrites `.next`
 * whenever a file changes, which replaces the production build under
 * `next start` and makes every route 404 with a ZERO-LENGTH body while the
 * route manifest still lists it. If you see that, stop the stray dev servers
 * rather than debugging the routes.
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:3200";

/** Routes chosen so each one is the sole consumer of its own i18n domain module. */
const PAGES = [
  "/",
  "/learn/what-is-chandrashtama",
  "/learn/what-is-thirukanitham",
  "/learn/what-is-porutham",
  "/learn/how-to-read-a-jadhagam",
  "/learn/why-birth-time-matters",
  "/temples",
  "/temples/thirunallar",
  "/temples/arupadai-veedu",
  "/temples/pancha-bhoota-sthalams",
  "/temples/thirumananjeri",
  "/dosham",
  "/dosham/sevvai-dosham",
  "/dosham/kala-sarpa-dosham",
  "/dosham/pithru-dosham",
  "/dosham/kalathra-dosham",
  "/dosham/naga-sarpa-dosham",
  "/pariharam",
  "/pariharam/rahu-ketu-pariharam",
  "/pariharam/puthra-pariharam",
  "/pariharam/ayul-pariharam",
  "/pariharam/kadan-pariharam",
  "/pariharam/naga-dosha-pariharam",
  "/pariharam/sevvai-dosha-pariharam",
  "/pariharam/thirumana-thadai",
  "/tools/marriage-porutham-calculator",
  "/tools/jadhagam-generator",
  "/tools/daily-panchangam-planner",
  "/tools/birth-time-rectification",
  "/tools/numerology-calculator",
  "/trust/methodology",
  "/trust/about-vinaadi",
  "/natchathiram",
  "/yogam",
  "/features/daily-guidance",
  "/features/chart-guidance",
  "/features/family-planning",
  "/features/timing-and-decisions",
  "/family",
];

const TAMIL = /[஀-௿]/g;
/** Strip tags and the JSON-LD / script payloads so we count rendered copy only. */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function get(path, lang) {
  const res = await fetch(BASE + path, {
    headers: lang === "ta" ? { cookie: "jothidam-lang=ta" } : {},
    redirect: "follow",
  });
  return { status: res.status, html: await res.text() };
}

const rows = [];
for (const path of PAGES) {
  try {
    const en = await get(path, "en");
    const ta = await get(path, "ta");
    const enText = visible(en.html);
    const taText = visible(ta.html);
    rows.push({
      path,
      status: en.status,
      enLen: enText.length,
      // Tamil characters in the EN render are expected and small (the toggle
      // button itself says "தமிழ்"); the TA render should be dominated by them.
      enTamil: (enText.match(TAMIL) ?? []).length,
      taTamil: (taText.match(TAMIL) ?? []).length,
      h1: (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(en.html)?.[1] ?? "").replace(/<[^>]+>/g, "").trim(),
    });
  } catch (e) {
    rows.push({ path, status: 0, enLen: 0, enTamil: 0, taTamil: 0, h1: "", err: String(e).slice(0, 90) });
  }
}

let bad = 0;
console.log("  " + "route".padEnd(40) + "st".padEnd(5) + "en-chars".padEnd(10) + "ta-chars".padEnd(10) + "h1");
for (const r of rows) {
  const problem = r.status !== 200 || r.enLen < 500 || !r.h1 || r.taTamil < 200 || r.err;
  if (problem) bad++;
  console.log(
    (problem ? "! " : "  ") +
      r.path.padEnd(40) +
      String(r.status).padEnd(5) +
      String(r.enLen).padEnd(10) +
      String(r.taTamil).padEnd(10) +
      (r.err ?? r.h1.slice(0, 42)),
  );
}
console.log(`\n${rows.length - bad}/${rows.length} clean`);
process.exit(bad ? 1 : 0);

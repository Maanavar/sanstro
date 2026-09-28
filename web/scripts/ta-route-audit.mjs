// GRW-06 — which public pages actually render Tamil, and in what part of the page?
//
// A route may only join TA_READY_ROUTES (lib/ta-routes.ts) once its Tamil body
// has been read on a real render. Importing `useLang` proves nothing: a page can
// import it and print English. This walks every URL in the running site's
// sitemap and measures the share of Tamil script in what a reader gets, so the
// answer comes from the page rather than the source.
//
//   node scripts/ta-route-audit.mjs [baseUrl] [--min=70] [--only=/tools] [--hydrate] [--interact] [--strict]
//
// What it looks at, per page:
//   text        visible text of the server HTML.
//   attributes  title= / aria-label= / alt= / placeholder= values. `innerText`
//               (and so every text probe) cannot see these; they still reach a
//               screen reader and a hover tooltip.
//   JSON-LD     the language of each structured-data block. A Tamil page must
//               carry Tamil blocks or none; an English page must carry no Tamil.
//   document    <html lang>, canonical and hreflang set.
//   English URL the same page without a cookie, for Tamil leaking the other way.
//   --hydrate   the page again in a real browser after client-side data has
//               loaded, so text and attributes fetched on mount are counted.
//   --interact  scripted flows for the tools whose answer only exists after the
//               visitor presses a button (INTERACTIONS below).
//
// STILL A BLIND SPOT, on purpose written here so a PASS is not read as more than
// it is: images with text baked in; interaction results for any tool without an
// entry in INTERACTIONS; anything behind a login; and the wording itself. A high
// Tamil share means "not an English page". Someone who reads Tamil still has to
// read it.
//
// Exit code 1 when a Tamil-ready page fails a hard check (JSON-LD language,
// <html lang>, canonical, Tamil share below --min) or, with --strict, has an
// attribute or hydrated string that is still English.
import process from "node:process";

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith("http")) ?? "http://localhost:3200").replace(/\/$/, "");
const MIN = Number((args.find((a) => a.startsWith("--min=")) ?? "--min=70").slice(6));
const ONLY = (args.find((a) => a.startsWith("--only=")) ?? "").slice(7);
const HYDRATE = args.includes("--hydrate") || args.includes("--interact");
const INTERACT = args.includes("--interact");
const STRICT = args.includes("--strict");

const tamil = /[஀-௿]/g;
const latin = /[A-Za-z]/g;
const count = (re, text) => (text.match(re) ?? []).length;
const share = (text) => {
  const t = count(tamil, text);
  const l = count(latin, text);
  return t + l ? Math.round((100 * t) / (t + l)) : 0;
};

/** Strings that are English on purpose, with the reason. */
const ALLOWED_ENGLISH_ATTRS = [
  // The toggle names the language it switches TO, in that language, so a Tamil
  // reader who landed on the wrong page can still find the way back. e2e-tested.
  [/^(Switch to English|View in English)$/, "language toggle label and title, deliberate"],
  // Brand and product names, and places where the product itself uses Latin.
  [/^(Vinaadi|Google Play|Get it on Google Play|Play Store|WhatsApp|PostHog|Anthropic|GitHub|Instagram|X|YouTube|Facebook)\b/i, "brand or product name"],
  [/^[\d\s.,:;/()+\-–—₹%]*$/, "numbers and punctuation"],
  [/^https?:\/\//, "URL"],
];
const allowedEnglish = (value) => ALLOWED_ENGLISH_ATTRS.some(([re]) => re.test(value.trim()));

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
}

/** Attribute strings a reader meets without them being text. */
function attributeStrings(html) {
  const body = html.slice(html.indexOf("<body"));
  const out = [];
  for (const m of body.matchAll(/\s(title|aria-label|alt|placeholder|aria-description)="([^"]*)"/g)) {
    const value = decode(m[2]).trim();
    if (value) out.push({ attr: m[1], value });
  }
  return out;
}

/** The English-only attribute strings: Latin letters, no Tamil, not allow-listed. */
function englishAttributes(list) {
  const seen = new Set();
  const out = [];
  for (const { attr, value } of list) {
    if (count(tamil, value) > 0) continue;
    if (count(latin, value) < 3) continue;
    if (allowedEnglish(value)) continue;
    const key = `${attr}=${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

const HUMAN_KEYS = new Set(["name", "headline", "description", "text", "articleBody", "about"]);
function humanStrings(node, out = []) {
  if (typeof node === "string") return out;
  if (Array.isArray(node)) node.forEach((n) => humanStrings(n, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (HUMAN_KEYS.has(key) && typeof value === "string") out.push(value);
      else humanStrings(value, out);
    }
  }
  return out;
}

function jsonLdBlocks(html) {
  const blocks = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      blocks.push(null);
    }
  }
  return blocks;
}

function documentFacts(html) {
  const lang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1] ?? "";
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1] ?? html.match(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"/)?.[1] ?? "";
  const hreflang = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hrefLang="([^"]*)"/gi)].map((m) => m[1]);
  return { lang, canonical, hreflang };
}

// A dev server recompiles and sometimes drops a connection; retry rather than
// lose a ten-minute run to one ECONNRESET.
async function fetchRetry(url, init) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (attempt >= 4) throw error;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

async function get(path, cookie) {
  const res = await fetchRetry(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  const redirect = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
  return { status: res.status, redirect, html: redirect ? "" : await res.text() };
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

// ── Interaction flows ──────────────────────────────────────────────────────
// Each flow drives one tool to the state where its answer is on screen and
// returns a short note. A tool with no entry here is a stated blind spot.
const INTERACTIONS = {
  // Synthetic inputs only (CLAUDE.md: no real birth data anywhere).
  "/tools/indraiya-rasipalan": async (page) => {
    await page.getByRole("button", { name: "ராசிபலன் பெறு" }).click();
    await page.waitForTimeout(2500);
    return "fetched today's palan for all rasis";
  },
  "/tools/numerology-calculator": async (page) => {
    await page.locator('input[type="date"]').first().fill("1990-01-01");
    // Inputs carry no type attribute, so find the name field by its placeholder.
    await page.locator("main input[placeholder]").first().fill("Test Person");
    await page.getByRole("button", { name: "எண்களைக் காட்டு" }).click();
    await page.waitForTimeout(2500);
    return "calculated numbers for a synthetic name and date";
  },
  "/tools/marriage-porutham-calculator": async (page) => {
    await page.locator("main button", { hasText: "அசுவினி" }).first().click();
    await page.waitForTimeout(600);
    // The boy-star list appears once a girl star is chosen; take its second star.
    await page.locator("main button", { hasText: "பரணி" }).last().click();
    await page.waitForTimeout(2000);
    return "picked a girl star and a boy star";
  },
};

// ── Sitemap ────────────────────────────────────────────────────────────────
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))]
  .filter((p) => !p.startsWith("/ta/") && p !== "/ta")
  .filter((p) => !ONLY || p.startsWith(ONLY));

// ── Server-HTML pass ───────────────────────────────────────────────────────
const rows = await pool(paths, 4, async (path) => {
  const taPath = path === "/" ? "/ta" : `/ta${path}`;
  const ta = await get(taPath);
  const ready = ta.status === 200;
  // A page with no twin is measured the old way, through the cookie, so the
  // audit can still say how close a candidate is.
  const measured = ready ? ta : await get(path, "jothidam-lang=ta");
  if (measured.redirect) return { path, ready, status: measured.status, note: `redirect -> ${measured.redirect}` };

  const html = measured.html;
  const text = visibleText(html);
  const attrs = attributeStrings(html);
  const row = {
    path,
    ready,
    status: measured.status,
    share: share(text),
    tamil: count(tamil, text),
    latin: count(latin, text),
    attrs: attrs.length,
    englishAttrs: englishAttributes(attrs),
    problems: [],
  };

  if (ready) {
    const facts = documentFacts(html);
    if (facts.lang !== "ta") row.problems.push(`<html lang="${facts.lang}">, expected ta`);
    if (!facts.canonical.includes("/ta")) row.problems.push(`canonical is not a /ta URL: ${facts.canonical || "(none)"}`);
    if (facts.hreflang.length < 3) row.problems.push(`hreflang set has ${facts.hreflang.length} entries, expected en, ta, x-default`);
    jsonLdBlocks(html).forEach((block, i) => {
      if (!block) return row.problems.push(`JSON-LD block ${i} is not valid JSON`);
      const strings = humanStrings(block).join(" ");
      if (count(latin, strings) + count(tamil, strings) >= 30 && share(strings) < 50) {
        row.problems.push(`JSON-LD block ${i} is English on a Tamil page (${share(strings)}% Tamil)`);
      }
    });

    // The same page at its English address, with no cookie: Tamil must not leak the other way.
    const en = await get(path);
    if (en.redirect) row.problems.push(`English URL redirects: ${en.redirect}`);
    else {
      const enFacts = documentFacts(en.html);
      if (enFacts.lang !== "en") row.problems.push(`English URL has <html lang="${enFacts.lang}">`);
      jsonLdBlocks(en.html).forEach((block, i) => {
        if (!block) return;
        const strings = humanStrings(block).join(" ");
        if (count(tamil, strings) > 0 && share(strings) > 10) {
          row.problems.push(`English URL: JSON-LD block ${i} is Tamil (${share(strings)}%)`);
        }
      });
    }
  }
  return row;
});

// ── Hydrated pass (real browser) ───────────────────────────────────────────
// Text and attributes that only exist once client-side code has run. The server
// HTML above cannot see them; a browser can. English strings are compared with
// the server pass so only what the client ADDED is reported.
const hydrated = new Map();
if (HYDRATE) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ locale: "ta-IN" });
  const targets = rows.filter((r) => r.ready && r.share !== undefined);
  for (const row of targets) {
    const page = await ctx.newPage();
    try {
      const path = row.path === "/" ? "/ta" : `/ta${row.path}`;
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      hydrated.set(row.path, await measureLive(page, row));
    } catch (error) {
      hydrated.set(row.path, { error: String(error).split("\n")[0] });
    } finally {
      await page.close();
    }
  }

  if (INTERACT) {
    for (const [path, flow] of Object.entries(INTERACTIONS)) {
      if (ONLY && !path.startsWith(ONLY)) continue;
      const row = rows.find((r) => r.path === path);
      if (!row?.ready) continue;
      const page = await ctx.newPage();
      try {
        await page.goto(`${BASE}/ta${path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        const before = await measureLive(page, row);
        // The first-visit beta welcome dialog sits over the page and eats clicks.
        await page.locator(".beta-modal__primary").click({ timeout: 3000 }).catch(() => {});
        const note = await flow(page);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        const after = await measureLive(page, row);
        hydrated.set(`${path} (after interaction)`, { ...after, note, baseline: before.share });
      } catch (error) {
        hydrated.set(`${path} (after interaction)`, { error: String(error).split("\n")[0] });
      } finally {
        await page.close();
      }
    }
  }
  await browser.close();
}

async function measureLive(page, row) {
  const live = await page.evaluate(() => ({
    text: document.body.innerText,
    attrs: [...document.querySelectorAll("[title],[aria-label],[alt],[placeholder]")].flatMap((el) =>
      ["title", "aria-label", "alt", "placeholder"].filter((a) => el.getAttribute(a)).map((a) => ({ attr: a, value: el.getAttribute(a).trim() })),
    ),
  }));
  return {
    share: share(live.text),
    latin: count(latin, live.text),
    englishAttrs: englishAttributes(live.attrs),
    // Long English lines, so the report says WHAT is still English, not just how much.
    englishLines: live.text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => count(latin, l) >= 12 && count(tamil, l) === 0 && !allowedEnglish(l) && !/^<|="|^https?:/.test(l)) // markup samples (the widget embed code) are code, not copy
      .slice(0, 12),
    newAttrs: englishAttributes(live.attrs).filter((a) => !row.englishAttrs?.includes(a)),
  };
}

// ── Report ─────────────────────────────────────────────────────────────────
const ready = rows.filter((r) => r.ready && r.share !== undefined);
const failures = [];
const warnings = [];
for (const r of ready) {
  if (r.share < MIN) failures.push(`${r.path}: Tamil share ${r.share}% < ${MIN}%`);
  for (const p of r.problems) failures.push(`${r.path}: ${p}`);
  for (const a of r.englishAttrs) (STRICT ? failures : warnings).push(`${r.path}: English attribute ${a}`);
}
for (const [path, h] of hydrated) {
  if (h.error) {
    warnings.push(`${path}: could not measure (${h.error})`);
    continue;
  }
  if (h.share < MIN) failures.push(`${path}: hydrated Tamil share ${h.share}% < ${MIN}%`);
  for (const a of h.newAttrs ?? []) (STRICT ? failures : warnings).push(`${path}: English attribute added on the client ${a}`);
  for (const line of h.englishLines ?? []) (STRICT ? failures : warnings).push(`${path}: English text after load/interaction: "${line.slice(0, 90)}"`);
}

const below = rows.filter((r) => !r.ready && r.share !== undefined);
console.log(`base ${BASE}  threshold ${MIN}%  pages ${rows.length}  tamil-ready ${ready.length}  candidates ${below.length}${HYDRATE ? "  hydrated" : ""}${INTERACT ? "  interactions" : ""}`);
console.log("\n--- NOT READY (no /ta twin; share is via the cookie) ---");
for (const r of below.sort((a, b) => a.share - b.share)) console.log(`${String(r.share).padStart(3)}%  ${r.status}  ${r.path}  (tamil ${r.tamil}, latin ${r.latin})`);
console.log("\n--- READY ---");
for (const r of ready) console.log(`${String(r.share).padStart(3)}%  ${r.path}  attrs ${r.attrs}${r.englishAttrs.length ? `  english-attrs ${r.englishAttrs.length}` : ""}${r.problems.length ? `  PROBLEMS ${r.problems.length}` : ""}`);
if (hydrated.size) {
  console.log("\n--- HYDRATED (real browser, after client-side load) ---");
  for (const [path, h] of hydrated) console.log(h.error ? `ERR  ${path}  ${h.error}` : `${String(h.share).padStart(3)}%  ${path}${h.note ? `  [${h.note}]` : ""}${h.baseline !== undefined ? `  (before ${h.baseline}%)` : ""}`);
}
const noRedirect = rows.filter((r) => r.share === undefined);
if (noRedirect.length) {
  console.log("\n--- REDIRECTS ---");
  for (const r of noRedirect) console.log(`${r.path}  ${r.note}`);
}
console.log(`\n--- WARNINGS (${warnings.length}) ---`);
for (const w of warnings) console.log(w);
console.log(`\n--- FAILURES (${failures.length}) ---`);
for (const f of failures) console.log(f);
process.exit(failures.length ? 1 : 0);

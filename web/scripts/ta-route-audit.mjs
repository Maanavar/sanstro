// GRW-06 — which public pages actually render Tamil?
//
// A route may only join TA_READY_ROUTES (lib/ta-routes.ts) once its Tamil body
// has been read on a real render. Importing `useLang` proves nothing: a page can
// import it and print English. This walks every URL in the running site's
// sitemap with a Tamil-language cookie and measures the share of Tamil script
// in the visible text, so the answer comes from the page rather than the source.
//
//   node scripts/ta-route-audit.mjs [baseUrl] [--min=70]
//
// BLIND SPOT: it counts characters of visible text only. It cannot see `title=`
// / `aria-label=` attributes, JSON-LD, images with text baked in, or text that
// only appears after client-side data loads (the tools fetch on interaction).
// A high share means "not an English page"; a person still has to read it.
import process from "node:process";

const BASE = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3200").replace(/\/$/, "");
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) ?? "--min=70").slice(6));

const tamil = /[஀-௿]/g;
const latin = /[A-Za-z]/g;

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => !p.startsWith("/ta/") && p !== "/ta");

const rows = [];
for (const path of urls) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: "jothidam-lang=ta" },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    rows.push({ path, status: res.status, share: null, note: `redirect -> ${res.headers.get("location")}` });
    continue;
  }
  const text = visibleText(await res.text());
  const t = (text.match(tamil) ?? []).length;
  const l = (text.match(latin) ?? []).length;
  rows.push({ path, status: res.status, share: t + l ? Math.round((100 * t) / (t + l)) : 0, tamil: t, latin: l });
}

const ok = rows.filter((r) => r.share !== null && r.share >= MIN);
const low = rows.filter((r) => r.share !== null && r.share < MIN);
console.log(`base ${BASE}  threshold ${MIN}%  pages ${rows.length}  tamil-ready ${ok.length}  below ${low.length}`);
console.log("\n--- BELOW THRESHOLD (English body or mostly English) ---");
for (const r of low.sort((a, b) => a.share - b.share)) console.log(`${String(r.share).padStart(3)}%  ${r.status}  ${r.path}  (tamil ${r.tamil}, latin ${r.latin})`);
console.log("\n--- READY ---");
for (const r of ok) console.log(`${String(r.share).padStart(3)}%  ${r.path}`);
const other = rows.filter((r) => r.share === null);
if (other.length) {
  console.log("\n--- REDIRECTS ---");
  for (const r of other) console.log(`${r.path}  ${r.note}`);
}

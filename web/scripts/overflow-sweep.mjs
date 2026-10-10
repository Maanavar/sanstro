#!/usr/bin/env node
/**
 * Page-width sweep: every top-level dashboard tab, en + ta, at 320 / 375 / 768
 * / 1440. Fails when any pane is wider than the viewport, and names the
 * innermost element that is not inside a scroller.
 *
 * Written 2026-09-22 when the Tamil 375px Today overflow (447px, the ribbon)
 * turned out to be one of six: Life areas held 1324px (ta) and 635px (en), the
 * Calendar muhurta view 401px, Family 419px, Calendar 372px at 320. The audit
 * harness only walks top-level panes in English, so none of these were seen.
 *
 * What it cannot see: overlays, sub-tabs other than each pane's default,
 * More-menu tabs, and overflow that a pseudo-element causes (it reports the
 * width but may name no element; bisect by hiding subtrees, as was done for
 * the Tamil Calendar spec rows).
 *
 * SAFETY: refuses to run unless the frontend proxies to the e2e backend.
 *
 * Usage (repo root, isolated stack up):
 *   node web\scripts\overflow-sweep.mjs --email <existing e2e account with a chart>
 */
import { chromium } from "@playwright/test";

import { DEFAULT_PASSWORD, assertE2eBackend } from "./ux-audit-core.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const BASE = String(arg("base", "http://localhost:3100")).replace(/\/$/, "");
const EMAIL = arg("email", null);
const PASSWORD = String(arg("password", DEFAULT_PASSWORD));
const CSRF = { "X-Vinaadi-CSRF": "1" };
const WIDTHS = [320, 375, 768, 1440];
if (!EMAIL) throw new Error("--email <existing e2e account> is required");

await assertE2eBackend(BASE);
const browser = await chromium.launch();
const auth = await browser.newContext({ baseURL: BASE });
for (let i = 0; ; i++) {
  const r = await auth.request.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD }, headers: CSRF });
  if (r.ok()) break;
  if (i >= 8) throw new Error(`login failed: ${r.status()}`);
  await new Promise((res) => setTimeout(res, 5000 * (i + 1)));
}
const storageState = await auth.storageState();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let total = 0;
try {
  for (const lang of ["en", "ta"]) {
    const lp = await auth.request.patch("/api/backend/api/v1/settings/ui", { data: { lang }, headers: CSRF });
    if (!lp.ok()) throw new Error(`language PATCH failed: ${lp.status()}`);
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ baseURL: BASE, viewport: { width, height: width < 600 ? 812 : 900 }, storageState });
      const page = await ctx.newPage();
      page.setDefaultNavigationTimeout(240_000);
      await page.goto("/dashboard");
      await page.waitForSelector(".nova-hero:not(.nova-hero--pending)", { timeout: 180_000 }).catch(() => {});
      await sleep(1500);
      const tabs = await page.evaluate(() => [...new Set([...document.querySelectorAll("button.cd-tab[data-tab]")].map((e) => e.getAttribute("data-tab")))]);
      const row = [];
      for (const tab of tabs) {
        const direct = page.locator(`button.cd-tab[data-tab="${tab}"]`).first();
        if (await direct.isVisible().catch(() => false)) await direct.click();
        else {
          await page.locator("button.cd-tab--more").first().click();
          await page.locator(`[role="menuitem"][data-tab="${tab}"]`).first().click();
        }
        await sleep(3500);
        const m = await page.evaluate(() => {
          const vw = innerWidth;
          const sw = document.documentElement.scrollWidth;
          if (sw <= vw) return { sw };
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.right <= vw + 1 || r.width === 0) continue;
            let clipped = false;
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              const o = getComputedStyle(a).overflowX;
              if (["auto", "scroll", "hidden", "clip"].includes(o) && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
            }
            if (clipped || [...el.children].some((c) => c.getBoundingClientRect().right > vw + 1)) continue;
            const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
            return { sw, el: `${el.tagName.toLowerCase()}.${cls} "${(el.innerText || "").slice(0, 40).replace(/\n/g, " ")}" w${Math.round(r.width)}` };
          }
          return { sw };
        });
        total++;
        row.push(`${tab}:${m.sw}`);
        if (m.sw > width) fails.push(`${lang}@${width} ${tab} ${m.sw}px ${m.el ?? "(no element found: check pseudo-elements)"}`);
      }
      console.log(`${lang}@${width}`, row.join(" "));
      await ctx.close();
    }
  }
} finally {
  await auth.request.patch("/api/backend/api/v1/settings/ui", { data: { lang: "en" }, headers: CSRF }).catch(() => {});
  await auth.close();
  await browser.close();
}
console.log(`\n${total - fails.length}/${total} panes fit`);
for (const f of fails) console.log("OVERFLOW", f);
process.exit(fails.length ? 1 : 0);

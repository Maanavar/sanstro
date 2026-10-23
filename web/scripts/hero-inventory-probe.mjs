#!/usr/bin/env node
/**
 * Measures Today's LOADED hero height in en and ta at 390 / 860 / 1440 — the
 * numbers `--nova-hero-reserve` in app/dashboard/dashboard-nova.css must match
 * (DXA-05: the pending hero is floored at the reserve, so a reserve taller than
 * the loaded hero is a shrink on arrival, and a shorter one is a grow).
 *
 * The CSS comment above the reserve named this script before it existed; it
 * was written 2026-09-21 (E-4f) when kit buttons let the hero's action pair fit
 * beside the best-window time and the loaded hero fell 621 → 580 px.
 *
 * The loaded hero depends on the clock (the rail's avoid card hides once its
 * window has passed; the evening switch appears from 19:00), so each row
 * records the blocks it saw. Compare runs at similar times of day.
 *
 * SAFETY: refuses to run unless the frontend proxies to the e2e backend.
 *
 * Usage (repo root, isolated stack up):
 *   node web\scripts\hero-inventory-probe.mjs --email <existing ux-audit e2e account>
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
if (!EMAIL) throw new Error("--email <existing e2e account> is required (see a ux-audit metrics.json)");

await assertE2eBackend(BASE);
const browser = await chromium.launch();
const rows = [];
// One login for the whole run: auth is rate-limited (429), and six logins in
// a few seconds trip it. Every measuring context reuses this session.
const auth = await browser.newContext({ baseURL: BASE });
for (let i = 0; ; i++) {
  const r = await auth.request.post("/api/backend/api/v1/auth/login", { data: { email: EMAIL, password: PASSWORD }, headers: CSRF });
  if (r.ok()) break;
  if (i >= 8) throw new Error(`login failed: ${r.status()}`);
  await new Promise((res) => setTimeout(res, 5000 * (i + 1)));
}
const storageState = await auth.storageState();
try {
  for (const lang of ["en", "ta"]) {
    const lp = await auth.request.patch("/api/backend/api/v1/settings/ui", { data: { lang }, headers: CSRF });
    if (!lp.ok()) throw new Error(`language PATCH failed: ${lp.status()}`);
    for (const width of [390, 860, 1440]) {
      const ctx = await browser.newContext({ baseURL: BASE, viewport: { width, height: 900 }, storageState });
      const page = await ctx.newPage();
      page.setDefaultNavigationTimeout(240_000);
      await page.goto("/dashboard/today");
      await page.waitForFunction(() => {
        const hero = document.querySelector(".nova-hero");
        return !!hero
          && !hero.classList.contains("nova-hero--pending")
          && !document.querySelector(".nova-today-pane [data-pending-placeholder]")
          && document.querySelectorAll(".nova-hero .skel").length === 0;
      }, null, { timeout: 120_000 });
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const hero = document.querySelector(".nova-hero");
        const h = (sel) => {
          const el = hero.querySelector(sel);
          return el ? Math.round(el.getBoundingClientRect().height) : null;
        };
        return {
          docLang: document.documentElement.lang,
          hero: Math.round(hero.getBoundingClientRect().height),
          masthead: h(".nova-hero-masthead"),
          action: h(".nova-hero-action"),
          rail: h(".nova-hero-rail"),
          eveningSwitch: !!hero.querySelector('[role="switch"]'),
        };
      });
      rows.push({ lang, width, ...m, at: new Date().toISOString() });
      if (m.docLang !== lang) throw new Error(`asked for ${lang}, page rendered lang="${m.docLang}" — not measurable`);
      await ctx.close();
    }
  }
} finally {
  // Leave the account as the audit expects it.
  await auth.request.patch("/api/backend/api/v1/settings/ui", { data: { lang: "en" }, headers: CSRF }).catch(() => {});
  await auth.close();
  await browser.close();
}
console.table(rows);

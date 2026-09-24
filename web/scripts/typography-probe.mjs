#!/usr/bin/env node
/**
 * What type does the Today pane actually render?
 *
 * The hero is almost entirely inline-styled, so a source read cannot say which
 * family a paragraph resolves to — `inherit`, `var(--font-body)` and a bare
 * <p> all end somewhere different depending on which ancestor set what. This
 * walks every visible text-bearing element in the pane and records the
 * *computed* family (first entry, next/font hash stripped), size, weight,
 * text-transform and letter-spacing, then groups them.
 *
 * SAFETY: registers a throwaway `type-probe-*@e2e.test` account, so it refuses
 * to run unless the frontend proxies to the e2e backend (same guard as
 * ux-audit.mjs). Never point it at :3000.
 *
 *   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
 *   node web\scripts\typography-probe.mjs [--base http://localhost:3100] [--lang en|ta] [--json out.json]
 */
import fs from "node:fs";

import { chromium } from "@playwright/test";

import { assertE2eBackend } from "./ux-audit-core.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const BASE = String(arg("base", "http://localhost:3100")).replace(/\/$/, "");
const LANG = arg("lang", "en");
const JSON_OUT = arg("json", null);
const CSRF = { "X-Vinaadi-CSRF": "1" };
const PASSWORD = "UxAudit!Test123";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await assertE2eBackend(BASE);

const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
const api = context.request;
const email = `type-probe-${Date.now()}@e2e.test`;

async function login() {
  for (let i = 0; i < 12; i++) {
    const r = await api.post("/api/backend/api/v1/auth/login", { data: { email, password: PASSWORD }, headers: CSRF });
    if (r.ok()) return;
    await sleep(500);
  }
  throw new Error("login failed");
}

const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email, password: PASSWORD, consentGiven: true }, headers: CSRF });
if (!reg.ok()) throw new Error(`register failed: ${reg.status()}`);
await login();
// Fictitious identity (repo synthetic-fixture rule).
const bp = await api.post("/api/backend/api/v1/birth-profiles", {
  headers: CSRF,
  data: {
    displayName: "Audit Sample", relationshipToOwner: "self",
    birthDateLocal: "1990-05-15", birthTimeLocal: "08:30:00",
    birthPlace: "Chennai, Tamil Nadu, India", birthLatitude: 13.0827, birthLongitude: 80.2707,
    birthTimezone: "Asia/Kolkata", calculateNow: true, genderForTraditionalRules: "male", maritalStatus: "married",
  },
});
if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()}`);
await api.patch("/api/backend/api/v1/settings/life-mode", { data: { mode: "BALANCED" }, headers: CSRF });
await api.patch("/api/backend/api/v1/settings/ui", { data: { lang: LANG }, headers: CSRF });

const page = await context.newPage();
// `next dev` compiles the route on first hit; that alone can outlast 30s.
await page.goto("/dashboard/today", { timeout: 240_000, waitUntil: "domcontentloaded" });
await page.waitForSelector(".nova-hero-name", { timeout: 120_000 });
// Let the day bundle land and every Reveal settle.
await page.waitForFunction(() => !document.querySelector(".nova-hero--pending"), null, { timeout: 120_000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
});
await sleep(1500);

const rows = await page.evaluate(() => {
  const pane = document.querySelector(".nova-today-pane");
  const out = [];
  let idx = 0;
  const fam = (f) => f.split(",")[0].trim().replace(/["']/g, "").replace(/^__(\w+?)_[0-9a-f]+$/, "$1").replace(/_Fallback_[0-9a-f]+$/, " (fallback)");
  const describe = (n) => {
    const parts = [];
    let el = n;
    for (let i = 0; el && el !== pane && i < 3; i++, el = el.parentElement) {
      const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean)[0];
      parts.unshift(el.tagName.toLowerCase() + (cls ? "." + cls : ""));
    }
    return parts.join(" > ");
  };
  for (const el of pane.querySelectorAll("*")) {
    const own = [...el.childNodes].filter((c) => c.nodeType === 3 && c.textContent.trim()).map((c) => c.textContent.trim()).join(" ");
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || el.closest(".cd-visually-hidden")) continue;
    el.setAttribute("data-type-probe", String(idx));
    out.push({
      idx: idx++,
      family: fam(cs.fontFamily), size: cs.fontSize, weight: cs.fontWeight, style: cs.fontStyle,
      transform: cs.textTransform, spacing: cs.letterSpacing, lh: cs.lineHeight,
      tag: el.tagName.toLowerCase(), where: describe(el), text: own.slice(0, 70),
    });
  }
  return out;
});

// The declared stack is not what is drawn: a Latin-only first family hands
// every Tamil glyph to the next family that has it — or to the OS when none
// in the stack does. Ask the renderer which faces actually painted each node.
const cdp = await context.newCDPSession(page);
await cdp.send("DOM.enable");
await cdp.send("CSS.enable");
const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
for (const r of rows) {
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-type-probe="${r.idx}"]` });
  if (!nodeId) continue;
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  r.used = fonts.filter((f) => f.glyphCount > 0).map((f) => f.familyName).join(" + ");
}

await browser.close();

const group = (key) => {
  const m = new Map();
  for (const r of rows) { const k = key(r); m.set(k, [...(m.get(k) ?? []), r]); }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
};
console.log(`\n${rows.length} text elements on /dashboard/today (${LANG})\n`);
console.log("── families ──");
for (const [k, rs] of group((r) => `${r.family}${r.style === "italic" ? " italic" : ""}`)) {
  console.log(`${String(rs.length).padStart(4)}  ${k}`);
  for (const r of rs.slice(0, 40)) console.log(`        ${r.size.padEnd(7)} ${r.weight} ${r.transform === "none" ? "" : r.transform + " "}${r.spacing === "normal" ? "" : "ls=" + r.spacing + " "}${r.where}  «${r.text}»`);
}
console.log("\n── faces actually painted ──");
for (const [k, rs] of group((r) => r.used ?? "?")) {
  console.log(`${String(rs.length).padStart(4)}  ${k}`);
  for (const r of rs.slice(0, 6)) console.log(`        ${r.family.padEnd(16)} ${r.where}  «${r.text.slice(0, 40)}»`);
}
console.log("\n── uppercase / tracked ──");
for (const r of rows.filter((r) => r.transform !== "none" || r.spacing !== "normal")) {
  console.log(`  ${r.transform.padEnd(10)} ls=${r.spacing.padEnd(8)} ${r.size.padEnd(7)} ${r.weight} ${r.where}  «${r.text}»`);
}
console.log("\n── sizes ──");
for (const [k, rs] of group((r) => r.size).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))) console.log(`${String(rs.length).padStart(4)}  ${k}`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(rows, null, 2));

#!/usr/bin/env node
/**
 * Dashboard experience audit, CLI entry point. The probes and gates live in
 * ./ux-audit-core.mjs, shared with web/e2e/dashboard-experience.spec.ts.
 *
 * SAFETY. It registers a throwaway `ux-audit-*@e2e.test` account, so it refuses
 * to run unless `<base>/api/backend/health` — asked THROUGH the frontend proxy —
 * reports environment "e2e". Never point it at the dev stack (:3000 → vinaadi_dev).
 *
 * Usage (from the repo root, PowerShell):
 *   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
 *   node web\scripts\ux-audit.mjs [--base http://localhost:3100] [--out <dir>]
 *        [--phases load,tabs,today,hover,overlays,reduced,light,phone] [--email <existing e2e account>] [--prod]
 *   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
 *
 * Output: <out>/metrics.json (raw measurements + `gates`), screenshots, and a
 * gate table on stdout. Default <out> is web/e2e/.artifacts/ux-audit-<stamp>
 * (gitignored). Exit code is 0 unless the run itself broke — failing gates are
 * findings, reported in the table, not crashes.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { ALL_PHASES, DEFAULT_PASSWORD, assertE2eBackend, formatGates, runAudit } from "./ux-audit-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const BASE = String(arg("base", "http://localhost:3100")).replace(/\/$/, "");
const OUT = path.resolve(String(arg("out", path.join(__dirname, "..", "e2e", ".artifacts", `ux-audit-${stamp}`))));
const PHASES = String(arg("phases", ALL_PHASES.join(","))).split(",").map((s) => s.trim()).filter(Boolean);
const EMAIL = arg("email", null);

const T0 = Date.now();
const log = (...a) => console.log(`[ux-audit ${((Date.now() - T0) / 1000).toFixed(0)}s]`, ...a);

await assertE2eBackend(BASE);
const browser = await chromium.launch();
try {
  const metrics = await runAudit({
    browser,
    base: BASE,
    out: OUT,
    phases: PHASES,
    prod: arg("prod", false) === true,
    email: typeof EMAIL === "string" ? EMAIL : undefined,
    password: String(arg("password", DEFAULT_PASSWORD)),
    // DXA-12 samples 16 surfaces per pane; a larger number censuses the population.
    hoverMax: Number(arg("hover-max", 16)),
    log,
  });
  console.log(`\n${formatGates(metrics.gates)}\n`);
} finally {
  await browser.close();
  log(`done → ${OUT}`);
}

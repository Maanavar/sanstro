/**
 * Dashboard experience audit: the probes and gates behind
 * docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md. Every gate carries the DXA id
 * it verifies, so "done" on an item is a number here, not a claim.
 *
 * Two entry points share this module, so the probes cannot drift apart:
 *   - web/scripts/ux-audit.mjs, the CLI against a manual `ux-audit-stack.ps1 -Action up`;
 *   - web/e2e/dashboard-experience.spec.ts, the Playwright port (VISUAL_AUDIT=1).
 *
 * Why rendered, not unit-tested: every defect in that audit passed tsc, eslint
 * and vitest. A cream skeleton on navy, a tab that swaps after it painted,
 * "Create a birth profile" shown to a user who has one, a card that ignores the
 * pointer — none of these exists until a browser paints the page.
 *
 * SAFETY. A run registers a throwaway `ux-audit-*@e2e.test` account, so callers
 * must pass `assertE2eBackend` first: `<base>/api/backend/health`, asked THROUGH
 * the frontend proxy, has to report environment "e2e". Never point it at the dev
 * stack (:3000 → vinaadi_dev).
 *
 * Dev-server caveat: absolute timings under `next dev` are inflated. Gates that
 * depend on timing (DXA-06) are reported as INFO unless `prod` is set.
 */
import fs from "node:fs";
import path from "node:path";

export const ALL_PHASES = ["load", "tabs", "today", "hover", "overlays", "reduced", "light", "phone"];
export const DEFAULT_PASSWORD = "UxAudit!Test123";
const CSRF = { "X-Vinaadi-CSRF": "1" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TABS = [
  { id: "personal", label: "Today", slug: "today", more: false },
  { id: "calendar", label: "Calendar", slug: "calendar", more: false },
  { id: "family", label: "Family & Charts", slug: "family", more: false },
  { id: "plan", label: "Goals", slug: "goals", more: false },
  { id: "life-areas", label: "Life Areas", slug: "life-areas", more: false },
  { id: "tools", label: "Tools", slug: "tools", more: true },
  { id: "explore", label: "Understand", slug: "explore", more: true },
];

/** A gate's stable identity: `<id> <check>`. The spec's ratchet keys on it. */
export const gateKey = (g) => `${g.id} ${g.check}`;

// ── isolation guard ────────────────────────────────────────────────────────
/** Throws unless the frontend at `base` proxies to the e2e backend. */
export async function assertE2eBackend(base) {
  let body;
  try {
    body = await (await fetch(`${base}/api/backend/health`)).json();
  } catch (cause) {
    throw new Error(`Cannot reach ${base}/api/backend/health — is the isolated stack up? (scripts/ux-audit-stack.ps1 -Action up)`, { cause });
  }
  if (body.environment !== "e2e") {
    throw new Error(`REFUSING TO RUN: ${base} proxies to environment "${body.environment}", not "e2e". This harness registers accounts.`);
  }
}

// ── account ────────────────────────────────────────────────────────────────
async function login(run, api) {
  for (let i = 0; i < 12; i++) {
    const r = await api.post("/api/backend/api/v1/auth/login", { data: { email: run.email, password: run.password }, headers: CSRF });
    if (r.ok()) return;
    await sleep(500);
  }
  throw new Error(`login failed for ${run.email}`);
}

async function bootstrap(run, api) {
  if (run.reuseAccount) {
    await login(run, api);
    return;
  }
  const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email: run.email, password: run.password, consentGiven: true }, headers: CSRF });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  await login(run, api); // register commits in dependency teardown — login is retried
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
  if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);
  const vault = await api.post("/api/backend/api/v1/family-vaults", { data: { name: "Audit Family" }, headers: CSRF });
  if (!vault.ok()) throw new Error(`vault failed: ${vault.status()} ${await vault.text()}`);
  const vaultId = (await vault.json()).data.familyVaultId;
  const member = await api.post(`/api/backend/api/v1/family-vaults/${vaultId}/members`, {
    headers: CSRF,
    data: {
      displayName: "Audit Partner", relationshipToOwner: "spouse",
      birthDateLocal: "1992-08-20", birthTimeLocal: "14:15:00",
      birthPlace: "Madurai, Tamil Nadu, India", birthLatitude: 9.9252, birthLongitude: 78.1198,
      birthTimezone: "Asia/Kolkata", calculateNow: true, genderForTraditionalRules: "female", maritalStatus: "married",
    },
  });
  if (!member.ok()) throw new Error(`member failed: ${member.status()} ${await member.text()}`);
  // An established user: no first-run focus picker, English UI.
  await api.patch("/api/backend/api/v1/settings/life-mode", { data: { mode: "BALANCED" }, headers: CSRF });
  await api.patch("/api/backend/api/v1/settings/ui", { data: { lang: "en" }, headers: CSRF });
}

// ── in-page instrumentation ────────────────────────────────────────────────
const INSTRUMENT = () => {
  const describe = (n) => {
    if (!n || !n.tagName) return String(n && n.nodeName);
    const cls = typeof n.className === "string" ? n.className : (n.getAttribute && n.getAttribute("class")) || "";
    return `${n.tagName.toLowerCase()}${cls ? "." + cls.trim().split(/\s+/).slice(0, 3).join(".") : ""}`;
  };
  window.__uxDescribe = describe;
  // The visible tab pane, tolerant of how TabPane hides the others. Defined
  // here (an init script) rather than eval'd per call, because a production
  // CSP has no 'unsafe-eval'.
  window.__uxPane = () => {
    const kids = [...document.querySelectorAll(".cd-page > *")].filter((el) =>
      !el.classList.contains("nova-sky") && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().height > 0);
    return kids.pop() || document.querySelector(".cd-page") || document.body;
  };
  const ux = (window.__ux = { shifts: [], timeline: [] });
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        ux.shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), input: e.hadRecentInput, src: (e.sources || []).slice(0, 3).map((s) => describe(s.node)) });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch { /* unsupported */ }
  const FALSE_EMPTY = /Create a birth profile to load chart data|No family members yet|Daily guidance loads after a profile is calculated|Create a profile to see panchangam|பிறப்பு விவரம் உருவாக்கிய பின்|குடும்ப உறுப்பினர்கள் இல்லை/;
  const start = performance.now();
  const iv = setInterval(() => {
    if (!document.body) return;
    const app = document.querySelector(".cd-app-body");
    const hero = document.querySelector(".nova-hero");
    ux.timeline.push({
      t: Math.round(performance.now()),
      tab: app ? app.getAttribute("data-active-tab") : null,
      skel: document.querySelectorAll(".skel").length,
      onboarding: !!document.querySelector(".cd-onboarding"),
      falseEmpty: FALSE_EMPTY.test(document.body.innerText),
      heroH: hero ? Math.round(hero.getBoundingClientRect().height) : 0,
      docH: document.documentElement.scrollHeight,
    });
    if (performance.now() - start > 25000) clearInterval(iv);
  }, 100);
};

// ── page helpers ───────────────────────────────────────────────────────────
async function dismissDialogs(page, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const dialog = page.locator('[role="dialog"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    const skip = dialog.getByRole("button", { name: /skip for now|not now/i }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 3000 }).catch(() => {});
    else await page.keyboard.press("Escape").catch(() => {});
    await sleep(350);
  }
}

/** Settled = network idle AND three consecutive quiet samples: no skeleton, no
 *  loading copy, and no empty-state copy that is really a loading state in
 *  disguise (DXA-03 — until that lands, it is the only sign data is pending).
 *  A failed evaluate (navigation in flight) is NOT quiet. Bounded at ~32 s. */
async function settle(page, extra = 1000) {
  await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  let quiet = 0;
  for (let i = 0; i < 80 && quiet < 3; i++) {
    const busy = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : "";
      const disguised = /Create a birth profile to load chart data|Daily guidance loads after a profile is calculated|Create a profile to see panchangam|Today's guidance, your chart score, and the best windows/.test(text) ? 1 : 0;
      return document.querySelectorAll(".skel, [aria-busy='true']").length + (text.match(/Refreshing\.\.\.|Loading…|Loading\.\.\./g) || []).length + disguised;
    }).catch(() => 1);
    quiet = busy === 0 ? quiet + 1 : 0;
    await sleep(400);
  }
  await dismissDialogs(page, 3);
  await sleep(extra);
}

async function shot(run, page, name) {
  await page.screenshot({ path: path.join(run.out, `${name}.png`) }).catch((e) => run.log(`shot ${name}: ${e.message}`));
}

async function sectionShots(run, page, name, max) {
  const { total, vh } = await page.evaluate(() => ({ total: document.documentElement.scrollHeight, vh: innerHeight }));
  const step = Math.round(vh * 0.85);
  const n = Math.min(max, Math.ceil(total / step));
  for (let i = 0; i < n; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * step);
    await sleep(600);
    await shot(run, page, `${name}-s${i + 1}`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return { pageHeight: total, sections: n };
}

async function clickTab(page, tab) {
  await dismissDialogs(page, 2);
  if (tab.more) {
    await page.locator("button.cd-tab--more").first().click({ timeout: 10_000 });
    await page.getByRole("menuitem", { name: new RegExp(`^${tab.label}`) }).first().click({ timeout: 10_000 });
  } else {
    // Desktop top strip first; a phone bottom bar (DXA-27) is accepted too.
    const top = page.locator(".cd-topnav__scroll button.cd-tab", { hasText: tab.label }).first();
    if (await top.isVisible().catch(() => false)) await top.click({ timeout: 10_000 });
    else await page.getByRole("button", { name: tab.label, exact: true }).first().click({ timeout: 10_000 });
  }
}

/** Per-frame record of the incoming pane through one tab switch (DXA-06). */
async function probeSwitch(page, tab) {
  if (tab.more) {
    await page.locator("button.cd-tab--more").first().click({ timeout: 10_000 });
    await sleep(300);
  }
  return page.evaluate(async ({ label, more }) => {
    const btn = (more
      ? [...document.querySelectorAll('[role="menuitem"]')]
      : [...document.querySelectorAll(".cd-topnav__scroll button.cd-tab")]
    ).find((b) => b.textContent.trim().startsWith(label));
    if (!btn) return { error: `no nav button "${label}"` };
    const pane = () => window.__uxPane();
    const t0 = performance.now();
    const samples = [];
    const shiftsBefore = window.__ux ? window.__ux.shifts.length : 0;
    btn.click();
    await new Promise((res) => {
      const tick = (now) => {
        const p = pane();
        const cs = p ? getComputedStyle(p) : null;
        samples.push({ t: Math.round(now - t0), op: cs ? +(+cs.opacity).toFixed(3) : null, tf: cs ? cs.transform : null, skel: document.querySelectorAll(".skel").length, docH: document.documentElement.scrollHeight });
        if (now - t0 < 1800) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
    const skelFullOpacityFrames = samples.filter((s) => s.skel > 0 && s.op !== null && s.op >= 0.99).length;
    const firstContent = samples.find((s, i) => i > 0 && s.skel === 0 && samples[i - 1].skel > 0);
    const changes = samples.filter((s, i) => i === 0 || s.op !== samples[i - 1].op || s.skel !== samples[i - 1].skel || s.docH !== samples[i - 1].docH);
    return {
      skeletonShown: samples.some((s) => s.skel > 0),
      skelFullOpacityFrames,
      contentAtMs: firstContent ? firstContent.t : null,
      docHeightJumps: changes.filter((s, i) => i > 0 && s.docH !== changes[i - 1].docH).length,
      samples: changes.slice(0, 30),
      shiftsAfterClick: window.__ux ? window.__ux.shifts.slice(shiftsBefore) : [],
    };
  }, { label: tab.label, more: tab.more });
}

/** Text, glyph, stripe and starfield checks on the visible pane (DXA-08/09/10). */
async function paneChecks(page) {
  return page.evaluate(() => {
    const pane = window.__uxPane();
    const inner = pane.innerText;
    const raw = pane.textContent;
    const sample = (arr) => [...new Set(arr)].slice(0, 6);
    const rawEnums = sample(inner.match(/\b[A-Z]{3,}(?:_[A-Z]{2,})+\b/g) || []);
    const noneValues = (inner.match(/^None$/gm) || []).length;
    const upperNames = sample(raw.match(/\b(MESHAM|RISHABAM|MITHUNAM|KADAGAM|SIMMAM|KANNI|THULAM|VIRUCHIGAM|DHANUSU|MAGARAM|KUMBAM|MEENAM|MANDHI)\b/g) || []);
    const emoji = sample(inner.match(/\p{Extended_Pictographic}/gu) || []);
    const textGlyphs = sample(inner.match(/[→←↗↻◇✎⤓★▾▸☀✓✕⚠✦]/g) || []);
    const tamilInEnglish = document.documentElement.lang === "ta" ? [] : sample((inner.match(/[^\n]{0,24}[஀-௿]+[^\n]{0,12}/g) || []).map((s) => s.trim()));

    // Accent stripe: a thick coloured left/inline-start edge on a boxed surface.
    const stripes = [];
    for (const el of pane.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 36) continue;
      const cs = getComputedStyle(el);
      const left = parseFloat(cs.borderLeftWidth);
      if (left >= 2 && parseFloat(cs.borderTopWidth) <= 1 && cs.borderLeftStyle !== "none" && cs.borderLeftColor !== cs.borderTopColor) {
        stripes.push(window.__uxDescribe ? window.__uxDescribe(el) : el.tagName);
      }
    }

    // Page-sky stars that sit inside a text line, or show through a translucent surface.
    const alphaOf = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return c === "transparent" ? 0 : 1;
      const parts = m[1].split(/[ ,/]+/).filter(Boolean);
      return parts.length > 3 ? parseFloat(parts[3]) : 1;
    };
    let starsInText = 0;
    let starsThroughSurface = 0;
    for (const star of document.querySelectorAll(".nova-sky .nova-celestial__star")) {
      const r = star.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let covered = false;
      let translucent = false;
      // Paint order, topmost first. The sky ignores pointer events, so it is not
      // in the list; its ANCESTORS are, and they paint below it — stop there.
      for (const el of document.elementsFromPoint(cx, cy)) {
        if (el.contains(star)) break;
        const cs = getComputedStyle(el);
        const a = alphaOf(cs.backgroundColor);
        const img = cs.backgroundImage !== "none";
        if (a >= 0.95) { covered = true; break; }
        if ((a > 0 || img) && el.getBoundingClientRect().width > 100) translucent = true;
      }
      if (covered) continue;
      if (translucent) starsThroughSurface++;
      const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(cx, cy) : null;
      if (range && range.startContainer.nodeType === 3) {
        const node = range.startContainer;
        const probe = document.createRange();
        probe.setStart(node, Math.max(0, range.startOffset - 1));
        probe.setEnd(node, Math.min(node.length, range.startOffset + 1));
        if ([...probe.getClientRects()].some((q) => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) starsInText++;
      }
    }
    const readingSections = [...pane.querySelectorAll("section.om")].filter((s) => s.getBoundingClientRect().height > 0).length;
    return { rawEnums, noneValues, upperNames, emoji, textGlyphs, tamilInEnglish, stripes: sample(stripes), stripeCount: stripes.length, starsInText, starsThroughSurface, readingSections };
  });
}

/** Rendered design-system census of the visible pane (DXA-16/19/20/21/22). */
async function census(page) {
  return page.evaluate(() => {
    const pane = window.__uxPane();
    const tally = (o, k) => { o[k] = (o[k] || 0) + 1; };
    const radius = {}, fontSize = {}, easing = {}, shadowsOnCards = { none: 0, some: 0 };
    let elements = 0, inline = 0, tinyText = 0;
    for (const el of pane.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      elements++;
      if (el.getAttribute("style")) inline++;
      const cs = getComputedStyle(el);
      const boxed = (cs.borderTopStyle !== "none" && cs.borderTopWidth !== "0px") || cs.backgroundColor !== "rgba(0, 0, 0, 0)";
      if (boxed && cs.borderTopLeftRadius !== "0px") tally(radius, parseFloat(cs.borderTopLeftRadius) >= 999 ? "pill" : cs.borderTopLeftRadius);
      if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        tally(fontSize, cs.fontSize);
        if (parseFloat(cs.fontSize) < 11) tinyText++;
      }
      if (cs.transitionDuration !== "0s") {
        // First timing function; a plain split(",") would cut inside cubic-bezier(…).
        const first = cs.transitionTimingFunction.match(/^\s*(cubic-bezier\([^)]*\)|steps\([^)]*\)|linear\([^)]*\)|[a-z-]+)/);
        tally(easing, first ? first[1] : cs.transitionTimingFunction);
      }
      if (el.classList.contains("ui-card") || el.classList.contains("card")) shadowsOnCards[cs.boxShadow === "none" ? "none" : "some"]++;
    }
    const root = pane.firstElementChild || pane;
    const blocks = [...root.children].filter((k) => k.getBoundingClientRect().height > 0);
    const sectionGaps = blocks.slice(1).map((k, i) => Math.round(k.getBoundingClientRect().top - blocks[i].getBoundingClientRect().bottom));
    const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    return {
      elements, inlineStyled: inline, tinyText,
      fontSizes: sortObj(fontSize), distinctFontSizes: Object.keys(fontSize).length,
      radii: sortObj(radius), distinctRadii: Object.keys(radius).length,
      easings: sortObj(easing), shadowsOnCards, sectionGaps,
      headings: [...pane.querySelectorAll("h1,h2")].filter((h) => h.getBoundingClientRect().height).map((h) => `${h.tagName} ${getComputedStyle(h).fontSize} ${h.textContent.trim().slice(0, 40)}`).slice(0, 20),
    };
  });
}

/** Infinite animations outside the Today hero (DXA-17). Loading indicators are allowed. */
async function ambientLoops(page) {
  return page.evaluate(() => {
    const allowed = /^(shimmer|cd-shimmer|om-pulse)$/;
    const out = [];
    for (const a of document.getAnimations()) {
      const timing = a.effect && a.effect.getTiming ? a.effect.getTiming() : {};
      if (timing.iterations !== Infinity) continue;
      const target = a.effect && a.effect.target;
      if (!target || (target.closest && target.closest(".nova-hero"))) continue;
      const r = target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      if (r && (r.bottom < 0 || r.top > innerHeight)) continue;
      const name = a.animationName || a.id || "waapi";
      if (allowed.test(name) || (target.classList && (target.classList.contains("skel") || target.classList.contains("ui-state__spinner")))) continue;
      const frames = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
      const paintsBoxShadow = frames.some((f) => "boxShadow" in f);
      out.push({ name, target: window.__uxDescribe ? window.__uxDescribe(target) : "", paintsBoxShadow });
    }
    return out;
  });
}

/** Real-pointer hover + press diffs on the visible pane's clickable surfaces (DXA-12). */
async function hoverPress(page, max = 16) {
  const n = await page.evaluate(({ max }) => {
    document.querySelectorAll("[data-ux-h]").forEach((e) => e.removeAttribute("data-ux-h"));
    const pane = window.__uxPane();
    let i = 0;
    for (const el of pane.querySelectorAll("button, a[href], [role='button'], [role='tab']")) {
      if (i >= max) break;
      if (el.disabled || el.getAttribute("aria-disabled") === "true") continue;
      if (["true"].includes(el.getAttribute("aria-selected")) || ["true"].includes(el.getAttribute("aria-pressed")) || el.getAttribute("aria-current")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 90 || r.height < 30 || r.top < 130 || r.bottom > innerHeight - 10) continue;
      el.setAttribute("data-ux-h", String(i++));
    }
    return i;
  }, { max });
  const read = (i) => page.evaluate((i) => {
    const el = document.querySelector(`[data-ux-h="${i}"]`);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), transform: cs.transform, boxShadow: cs.boxShadow, border: cs.borderTopColor, bg: cs.backgroundColor, color: cs.color, filter: cs.filter };
  }, i);
  const keys = ["transform", "boxShadow", "border", "bg", "color", "filter"];
  const out = [];
  for (let i = 0; i < n; i++) {
    await page.mouse.move(1, 1);
    await sleep(250);
    const a = await read(i);
    const box = await page.locator(`[data-ux-h="${i}"]`).boundingBox().catch(() => null);
    if (!a || !box) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(350);
    const b = await read(i);
    await page.mouse.down();
    await sleep(70);
    const c = await read(i);
    await page.mouse.move(1, 1); // release OFF the element so nothing activates
    await page.mouse.up();
    out.push({ label: a.label, hover: keys.filter((k) => b && a[k] !== b[k]), press: keys.filter((k) => c && b && c[k] !== b[k]) });
  }
  return out;
}

const ENTER_PROBE = (sel) => new Promise((res) => {
  const t0 = performance.now();
  let animated = false;
  const tick = () => {
    const el = document.querySelector(sel);
    if (el && document.getAnimations().some((a) => { const t = a.effect && a.effect.target; return t && (t === el || el.contains(t)); })) animated = true;
    if (animated || performance.now() - t0 > 350) res({ present: !!document.querySelector(sel), animated });
    else requestAnimationFrame(tick);
  };
  tick();
});

const EXIT_PROBE = (sel) => new Promise((res) => {
  const t0 = performance.now();
  let animated = false;
  let lingered = 0;
  const tick = () => {
    const el = document.querySelector(sel);
    if (el) {
      lingered = performance.now() - t0;
      if (document.getAnimations().some((a) => { const t = a.effect && a.effect.target; return t && (t === el || el.contains(t)); })) animated = true;
    }
    if (performance.now() - t0 > 450) res({ animated, lingeredMs: Math.round(lingered), closed: !document.querySelector(sel) });
    else requestAnimationFrame(tick);
  };
  tick();
});

/** Close whatever is open, whichever way works (the probe must not strand an overlay). */
async function forceClose(page, selector, trigger) {
  const open = () => page.locator(selector).count().then((n) => n > 0).catch(() => false);
  if (!(await open())) return;
  await page.keyboard.press("Escape").catch(() => {});
  await sleep(300);
  if (!(await open())) return;
  await page.mouse.click(300, 860);
  await sleep(300);
  if (!(await open()) || !trigger) return;
  // A raw click at the trigger: before DXA-41 lands, the confined overlay sits
  // on top of it and closes the menu; after, the trigger itself toggles it.
  const box = await page.locator(trigger).first().boundingBox().catch(() => null);
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(300);
}

/**
 * One overlay, opened twice: once closed with Escape, once with a click on the
 * page body. Records enter/exit animation (DXA-13) and whether each close path
 * works at all (DXA-41).
 */
async function overlay(run, page, name, open, selector, trigger) {
  const result = { name };
  try {
    await open();
    result.enter = await page.evaluate(ENTER_PROBE, selector);
    await sleep(400);
    await shot(run, page, `overlay-${name}`);
    await page.keyboard.press("Escape");
    result.escape = await page.evaluate(EXIT_PROBE, selector);
    await forceClose(page, selector, trigger);

    await open();
    await sleep(400);
    await page.mouse.click(300, 860);
    result.outside = await page.evaluate(EXIT_PROBE, selector);
    await forceClose(page, selector, trigger);
    // The exit animation is judged on whichever close path worked.
    result.exit = result.escape.closed ? result.escape : result.outside;
  } catch (e) {
    result.error = e.message.split("\n")[0];
    await forceClose(page, selector, trigger).catch(() => {});
  }
  return result;
}

/** Skeleton bar vs its card, as painted (DXA-01). Contrast should be quiet: 1.05–1.6. */
async function skeletonPalette(page) {
  return page.evaluate(() => {
    const host = document.querySelector(".cd-page") || document.body;
    const card = document.createElement("div");
    card.className = "skel-card";
    card.innerHTML = '<span class="skel skel-line-full" style="display:block"></span>';
    host.appendChild(card);
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return [0, 0, 0, 0];
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])).concat(1);
    const lum = (c) => {
      const [r, g, b] = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    // The page ground as the theme defines it (the shell paints a gradient, so
    // its computed background-color is not a reliable ground).
    const groundProbe = document.createElement("div");
    groundProbe.style.background = "var(--color-bg)";
    host.appendChild(groundProbe);
    const ground = parse(getComputedStyle(groundProbe).backgroundColor);
    groundProbe.remove();
    const pageBg = ground[3] > 0 ? over(ground, [255, 255, 255, 1]) : [4, 5, 14, 1];
    const cardBg = over(parse(getComputedStyle(card).backgroundColor), pageBg);
    const barBg = over(parse(getComputedStyle(card.querySelector(".skel")).backgroundColor), cardBg);
    const l1 = lum(barBg);
    const l2 = lum(cardBg);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const border = getComputedStyle(card).borderTopColor;
    card.remove();
    return { theme: document.documentElement.getAttribute("data-theme"), bar: `rgb(${barBg.slice(0, 3).map(Math.round)})`, card: `rgb(${cardBg.slice(0, 3).map(Math.round)})`, border, contrast: +contrast.toFixed(2) };
  });
}

async function newContext(run, browser, opts) {
  const { theme = "dark", ...rest } = opts;
  const ctx = await browser.newContext({ baseURL: run.base, colorScheme: theme, ...rest });
  ctx.setDefaultTimeout(10_000);
  await ctx.addInitScript((t) => { try { localStorage.setItem("vinaadi-theme", t); } catch { /* storage blocked */ } }, theme);
  await ctx.addInitScript(INSTRUMENT);
  await login(run, ctx.request);
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(240_000);
  return { ctx, page };
}

// ── run ────────────────────────────────────────────────────────────────────
/**
 * Runs the selected phases and returns the metrics, with `gates` computed.
 * Writes `<out>/metrics.json` and screenshots as it goes. The caller owns the
 * browser and must have called `assertE2eBackend(base)`. Gates are computed
 * even when a phase throws; the error is then rethrown.
 *
 * @param {object} opts
 * @param {import("@playwright/test").Browser} opts.browser
 * @param {string} opts.base          frontend origin, e.g. http://localhost:3100
 * @param {string} opts.out           output directory (created)
 * @param {string[]} [opts.phases]    subset of ALL_PHASES
 * @param {boolean} [opts.prod]       gate timing-dependent checks (DXA-06)
 * @param {string} [opts.email]       reuse an existing e2e account instead of registering one
 * @param {string} [opts.password]
 * @param {(...a: unknown[]) => void} [opts.log]
 */
export async function runAudit({ browser, base, out, phases = ALL_PHASES, prod = false, email, password = DEFAULT_PASSWORD, log = () => {} }) {
  const PHASES = new Set(phases);
  const run = {
    base: base.replace(/\/$/, ""),
    out,
    email: email ?? `ux-audit-${Date.now()}@e2e.test`,
    reuseAccount: Boolean(email),
    password,
    log,
  };
  const metrics = { base: run.base, email: run.email, phases: [...PHASES], startedAt: new Date().toISOString(), notes: [] };
  fs.mkdirSync(out, { recursive: true });
  const save = () => fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  const consoleErrors = [];

  try {
    {
      const boot = await browser.newContext({ baseURL: run.base });
      await bootstrap(run, boot.request);
      await boot.close();
      log(`account ready: ${run.email}`);
    }

    const { ctx: dark, page } = await newContext(run, browser, { viewport: { width: 1440, height: 900 } });
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 240)); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 240)}`));

    log("warm-up (compiles every tab on a dev server)");
    for (const tab of TABS) {
      await page.goto(`/dashboard/${tab.slug}`);
      await settle(page, 300);
    }
    await page.goto("/dashboard/settings");
    await settle(page, 300);

    if (PHASES.has("load")) {
      log("load: one destination, false empties, layout stability");
      // Leave the workspace on Calendar so a tab restore has something to restore.
      await page.goto("/dashboard/today");
      await settle(page, 500);
      await clickTab(page, TABS[1]);
      await sleep(1500);
      await page.goto("/dashboard", { waitUntil: "commit" });
      for (let i = 0; i < 16; i++) {
        await page.screenshot({ path: path.join(out, `load-bare-${String(i).padStart(2, "0")}.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
        await sleep(250);
      }
      await settle(page, 1500);
      metrics.bareLoad = await page.evaluate(() => {
        const tl = window.__ux.timeline;
        return { destinations: [...new Set(tl.map((s) => s.tab).filter(Boolean))], onboardingSeen: tl.some((s) => s.onboarding) };
      });

      await page.goto("/dashboard/today", { waitUntil: "commit" });
      for (let i = 0; i < 16; i++) {
        await page.screenshot({ path: path.join(out, `load-today-${String(i).padStart(2, "0")}.jpg`), type: "jpeg", quality: 55 }).catch(() => {});
        await sleep(200);
      }
      await settle(page, 1500);
      metrics.todayLoad = await page.evaluate(() => {
        const ux = window.__ux;
        const tl = ux.timeline;
        const first = (p) => (tl.find(p) || {}).t ?? null;
        const last = (p) => ([...tl].reverse().find(p) || {}).t ?? null;
        const heights = tl.filter((s, i) => i === 0 || s.docH !== tl[i - 1].docH).map((s) => s.docH);
        return {
          falseEmptyFrom: first((s) => s.falseEmpty), falseEmptyUntil: last((s) => s.falseEmpty),
          onboardingSeen: tl.some((s) => s.onboarding),
          skeletonFrom: first((s) => s.skel > 0), skeletonUntil: last((s) => s.skel > 0),
          documentHeightChanges: Math.max(0, heights.length - 1), heights: heights.slice(0, 20),
          cls: +ux.shifts.filter((s) => !s.input).reduce((a, s) => a + s.v, 0).toFixed(4),
          topbarShifts: ux.shifts.filter((s) => s.src.some((x) => /cd-topbar|cd-tab|cd-subbar/.test(x))).length,
          shifts: ux.shifts.slice(0, 25),
        };
      });
      metrics.skeletonDark = await skeletonPalette(page);

      await page.goto("/dashboard/explore", { waitUntil: "commit" });
      await settle(page, 1500);
      metrics.exploreLoad = await page.evaluate(() => ({ cls: +window.__ux.shifts.filter((s) => !s.input).reduce((a, s) => a + s.v, 0).toFixed(4), shifts: window.__ux.shifts.slice(0, 15) }));
      save();
    }

    if (PHASES.has("tabs")) {
      log("tabs: first-visit switches, pane checks, census, ambient loops");
      await page.goto("/dashboard/today");
      await settle(page, 800);
      metrics.tabs = { personal: { checks: await paneChecks(page), census: await census(page), loops: await ambientLoops(page) } };
      for (const tab of TABS.slice(1)) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const sw = await probeSwitch(page, tab).catch((e) => ({ error: e.message }));
        await settle(page, 900);
        await shot(run, page, `tab-${tab.slug}`);
        const sections = await sectionShots(run, page, `tab-${tab.slug}`, tab.id === "family" ? 10 : 5);
        metrics.tabs[tab.id] = { switch: sw, sections, checks: await paneChecks(page), census: await census(page), loops: await ambientLoops(page) };
        save();
      }
      for (const extra of ["journal", "settings"]) {
        await page.goto(`/dashboard/${extra}`);
        await settle(page, 900);
        await shot(run, page, `tab-${extra}`);
        metrics.tabs[extra] = { checks: await paneChecks(page), census: await census(page), loops: await ambientLoops(page), onboardingVisible: await page.locator(".cd-onboarding").isVisible().catch(() => false) };
      }
      save();
    }

    if (PHASES.has("today")) {
      log("today: sections, date change continuity");
      await page.goto("/dashboard/today");
      await settle(page, 1200);
      await shot(run, page, "today");
      metrics.today = { sections: await sectionShots(run, page, "today", 8) };
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(400);
      metrics.today.dateChange = await page.evaluate(async () => {
        const input = document.querySelector("#dashboard-date");
        const hero = document.querySelector(".nova-hero");
        if (!input || !hero) return { error: "no date input or hero" };
        const before = hero.getBoundingClientRect().height;
        const [y, m, d] = input.value.split("-").map(Number);
        const nd = new Date(y, m - 1, d + 1);
        const next = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        const t0 = performance.now();
        let minHero = before;
        const animations = new Set();
        await new Promise((res) => {
          const tick = (now) => {
            const h = document.querySelector(".nova-hero");
            minHero = Math.min(minHero, h ? h.getBoundingClientRect().height : 0);
            for (const a of document.getAnimations()) {
              const n = a.animationName || a.transitionProperty || a.id || "waapi";
              if (!/twinkle|spin|breathe|pulse|shimmer|travel/.test(n)) animations.add(n);
            }
            if (now - t0 < 4000) requestAnimationFrame(tick); else res();
          };
          requestAnimationFrame(tick);
        });
        return { next, heroBefore: Math.round(before), heroMin: Math.round(minHero), minRatio: +(minHero / before).toFixed(2), animations: [...animations].slice(0, 12) };
      });
      await settle(page, 800);
      await shot(run, page, "today-next-day");
      save();
    }

    if (PHASES.has("hover")) {
      log("hover/press coverage");
      metrics.hover = {};
      await page.goto("/dashboard/today");
      await settle(page, 1000);
      metrics.hover.todayHero = await hoverPress(page, 8);
      await page.evaluate(() => {
        const h = [...document.querySelectorAll("h2")].find((x) => /Quick Links/i.test(x.textContent));
        if (h) window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 140);
      });
      await sleep(600);
      metrics.hover.todayQuickLinks = await hoverPress(page, 12);
      for (const slug of ["tools", "family", "explore", "calendar"]) {
        await page.goto(`/dashboard/${slug}`);
        await settle(page, 900);
        metrics.hover[slug] = await hoverPress(page, 12);
      }
      save();
    }

    if (PHASES.has("overlays")) {
      log("overlays: enter and exit");
      await page.goto("/dashboard/today");
      await settle(page, 1000);
      metrics.overlays = [];
      const clickOpen = (sel) => () => page.locator(sel).first().click({ timeout: 8000 });
      metrics.overlays.push(await overlay(run, page, "more-menu", clickOpen("button.cd-tab--more"), ".cd-dropdown--nav", "button.cd-tab--more"));
      metrics.overlays.push(await overlay(run, page, "notifications", clickOpen(".cd-topbar__right .cd-icon-btn"), ".cd-alerts-popover", ".cd-topbar__right .cd-icon-btn"));
      metrics.overlays.push(await overlay(run, page, "account-menu", clickOpen(".cd-topbar .cd-avatar"), ".cd-dropdown:not(.cd-dropdown--nav)", ".cd-topbar .cd-avatar"));
      metrics.overlays.push(await overlay(run, page, "ask-vinaadi", clickOpen(".cd-ask-search"), '[role="dialog"]', null));
      await page.goto("/dashboard/calendar");
      await settle(page, 800);
      const monthly = page.getByRole("tab", { name: /Monthly/ }).first();
      if (await monthly.isVisible().catch(() => false)) {
        await monthly.click();
        await settle(page, 1200);
        metrics.overlays.push(await overlay(run, page, "day-drawer", () => page.locator("button.nova-cal-cell").nth(10).click({ timeout: 8000 }), ".drawer", null));
      }
      save();
    }
    await dark.close();

    if (PHASES.has("reduced")) {
      log("reduced motion");
      const { ctx, page: rp } = await newContext(run, browser, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await rp.goto("/dashboard/today");
      await settle(rp, 800);
      metrics.reducedMotion = await rp.evaluate(async () => {
        const btn = [...document.querySelectorAll(".cd-topnav__scroll button.cd-tab")].find((b) => b.textContent.trim().startsWith("Calendar"));
        if (!btn) return { error: "no Calendar tab" };
        btn.click();
        const transforms = new Set();
        const opacities = new Set();
        const t0 = performance.now();
        await new Promise((res) => {
          const tick = (now) => {
            const ind = document.querySelector(".cd-tab__indicator");
            if (ind) transforms.add(getComputedStyle(ind).transform);
            const kids = [...document.querySelectorAll(".cd-page > *")].filter((el) => !el.classList.contains("nova-sky") && getComputedStyle(el).display !== "none");
            const pane = kids.pop();
            if (pane) opacities.add(getComputedStyle(pane).opacity);
            if (now - t0 < 600) requestAnimationFrame(tick); else res();
          };
          requestAnimationFrame(tick);
        });
        return { indicatorTransforms: [...transforms], paneOpacities: [...opacities] };
      });
      metrics.reducedMotion.loopsOnToday = await ambientLoops(rp);
      save();
      await ctx.close();
    }

    if (PHASES.has("light")) {
      log("light theme");
      const { ctx, page: lp } = await newContext(run, browser, { viewport: { width: 1440, height: 900 }, theme: "light" });
      await lp.goto("/dashboard/today");
      await settle(lp, 1200);
      metrics.skeletonLight = await skeletonPalette(lp);
      await shot(run, lp, "light-today");
      for (const tab of [...TABS.slice(1).map((t) => t.slug), "journal", "settings"]) {
        await lp.goto(`/dashboard/${tab}`);
        await settle(lp, 900);
        await shot(run, lp, `light-${tab}`);
      }
      save();
      await ctx.close();
    }

    if (PHASES.has("phone")) {
      log("phone 390x844");
      const { ctx, page: pp } = await newContext(run, browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      metrics.phone = {};
      for (const slug of ["today", "calendar", "family", "goals", "tools"]) {
        await pp.goto(`/dashboard/${slug}`);
        await settle(pp, 1200);
        await shot(run, pp, `phone-${slug}`);
        await pp.evaluate(() => window.scrollTo(0, 1500));
        await sleep(700);
        await shot(run, pp, `phone-${slug}-scrolled`);
        metrics.phone[slug] = await pp.evaluate(() => {
          const vw = innerWidth;
          const vh = innerHeight;
          const pinned = [...document.querySelectorAll("body *")].filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.position !== "fixed" && cs.position !== "sticky") return false;
            const r = el.getBoundingClientRect();
            return r.height > 0 && r.width > vw * 0.5;
          }).map((el) => el.getBoundingClientRect());
          const topChrome = Math.round(pinned.filter((r) => r.top < vh * 0.5 && r.bottom <= vh * 0.6).reduce((m, r) => Math.max(m, r.bottom), 0));
          const bottomRects = pinned.filter((r) => r.bottom >= vh - 1 && r.top > vh * 0.5);
          const bottomChrome = bottomRects.length ? Math.round(vh - Math.min(...bottomRects.map((r) => r.top))) : 0;
          const clippedTabs = [...document.querySelectorAll(".cd-topnav__scroll .cd-tab")].filter((t) => {
            const r = t.getBoundingClientRect();
            if (r.left < 0 || r.right > vw || !r.width) return false;
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return hit && hit !== t && !t.contains(hit);
          }).map((t) => t.textContent.trim());
          const board = [...document.querySelectorAll("h2")].find((h) => /Is today okay/i.test(h.textContent));
          const overflow = document.documentElement.scrollWidth > vw + 1;
          window.scrollTo(0, 0);
          return {
            topChrome, bottomChrome, pinnedTotal: topChrome + bottomChrome, clippedTabs, overflow,
            activityBoardScreens: board ? +((board.getBoundingClientRect().top + scrollY) / vh).toFixed(2) : null,
          };
        });
      }
      save();
      await ctx.close();
    }
  } finally {
    metrics.consoleErrors = consoleErrors.slice(0, 20);
    metrics.finishedAt = new Date().toISOString();
    metrics.gates = computeGates(metrics, { prod });
    save();
  }
  return metrics;
}

// ── gates ──────────────────────────────────────────────────────────────────
export function computeGates(m, { prod = false } = {}) {
  const g = [];
  const add = (id, check, value, pass) => g.push({ id, check, value, result: pass === null ? "INFO" : pass ? "PASS" : "FAIL" });
  const tabs = m.tabs ? Object.entries(m.tabs) : [];
  const sum = (f) => tabs.reduce((a, [, t]) => a + (t.checks ? f(t.checks) : 0), 0);
  const list = (f) => tabs.flatMap(([k, t]) => (t.checks && f(t.checks).length ? [`${k}: ${f(t.checks).join(" | ")}`] : []));

  if (m.skeletonDark) add("DXA-01", "skeleton bar/card contrast, dark (1.05–1.6)", m.skeletonDark.contrast, m.skeletonDark.contrast >= 1.05 && m.skeletonDark.contrast <= 1.6);
  if (m.skeletonLight) add("DXA-01", "skeleton bar/card contrast, light (1.05–1.6)", m.skeletonLight.contrast, m.skeletonLight.contrast >= 1.05 && m.skeletonLight.contrast <= 1.6);
  if (m.bareLoad) add("DXA-02", "bare /dashboard shows one destination", m.bareLoad.destinations.join(" → "), m.bareLoad.destinations.length === 1 && m.bareLoad.destinations[0] === "personal");
  if (m.todayLoad) {
    add("DXA-03", "no empty-state copy while loading (Today)", m.todayLoad.falseEmptyFrom === null ? "never" : `${m.todayLoad.falseEmptyFrom}–${m.todayLoad.falseEmptyUntil} ms`, m.todayLoad.falseEmptyFrom === null);
    add("DXA-04", "no onboarding banner for a set-up account", `bare:${m.bareLoad ? m.bareLoad.onboardingSeen : "?"} today:${m.todayLoad.onboardingSeen}`, !m.todayLoad.onboardingSeen && !(m.bareLoad && m.bareLoad.onboardingSeen));
    add("DXA-05", "CLS < 0.1 (Today cold load)", m.todayLoad.cls, m.todayLoad.cls < 0.1);
    add("DXA-05", "no top-bar / sub-bar shifts", m.todayLoad.topbarShifts, m.todayLoad.topbarShifts === 0);
    add("DXA-05", "document height changes during load", m.todayLoad.documentHeightChanges, null);
  }
  if (m.exploreLoad) add("DXA-05", "CLS < 0.1 (Understand cold load)", m.exploreLoad.cls, m.exploreLoad.cls < 0.1);
  if (m.tabs) {
    const switches = tabs.filter(([, t]) => t.switch && !t.switch.error);
    const full = switches.reduce((a, [, t]) => a + t.switch.skelFullOpacityFrames, 0);
    add("DXA-06", "frames showing a skeleton at full opacity on first tab visits", full, prod ? full === 0 : null);
  }
  if (m.today && m.today.dateChange && !m.today.dateChange.error) add("DXA-07", "hero keeps ≥ 90% height through a date change", m.today.dateChange.minRatio, m.today.dateChange.minRatio >= 0.9);
  if (m.tabs) {
    const enums = list((c) => c.rawEnums);
    add("DXA-08", "no raw enums / 'None' / upper-case rasi names", [...enums, ...list((c) => c.upperNames)].join(" ; ") || `none (None×${sum((c) => c.noneValues)})`, enums.length === 0 && sum((c) => c.noneValues) === 0 && list((c) => c.upperNames).length === 0);
    add("DXA-09", "no accent stripes", list((c) => c.stripes).join(" ; ") || 0, sum((c) => c.stripeCount) === 0);
    add("DXA-09", "no Tamil text in English mode", list((c) => c.tamilInEnglish).join(" ; ") || 0, list((c) => c.tamilInEnglish).length === 0);
    add("DXA-09", "no emoji / text glyphs as icons", [...list((c) => c.emoji), ...list((c) => c.textGlyphs)].join(" ; ") || 0, list((c) => c.emoji).length === 0 && list((c) => c.textGlyphs).length === 0);
    if (m.tabs.family && m.tabs.family.checks) add("DXA-37", "Family shows exactly one reading", m.tabs.family.checks.readingSections, m.tabs.family.checks.readingSections === 1);
    add("DXA-10", "no page-sky star inside a text line", sum((c) => c.starsInText), sum((c) => c.starsInText) === 0);
    add("DXA-10", "no page-sky star showing through a translucent surface", sum((c) => c.starsThroughSurface), sum((c) => c.starsThroughSurface) === 0);
  }
  if (m.reducedMotion && !m.reducedMotion.error) {
    add("DXA-11", "reduced motion: nav indicator does not move", m.reducedMotion.indicatorTransforms.length, m.reducedMotion.indicatorTransforms.length <= 1);
    add("DXA-11", "reduced motion: pane appears without a fade", m.reducedMotion.paneOpacities.join(","), m.reducedMotion.paneOpacities.every((o) => o === "1"));
  }
  if (m.hover) {
    const all = Object.values(m.hover).flat();
    const hov = all.filter((x) => x.hover.length).length;
    const prs = all.filter((x) => x.press.length).length;
    add("DXA-12", "hover feedback coverage ≥ 95%", `${hov}/${all.length}`, all.length > 0 && hov / all.length >= 0.95);
    add("DXA-12", "press feedback coverage = 100%", `${prs}/${all.length}`, all.length > 0 && prs === all.length);
  }
  if (m.overlays) {
    for (const o of m.overlays) {
      add("DXA-13", `overlay ${o.name}: enter + exit animation`, o.error ? `error: ${o.error}` : `enter:${o.enter && o.enter.animated} exit:${o.exit && o.exit.animated}`, !o.error && !!(o.enter && o.enter.animated && o.exit && o.exit.animated));
    }
    for (const o of m.overlays) {
      add("DXA-41", `overlay ${o.name}: closes on Escape and on a page click`, o.error ? `error: ${o.error}` : `escape:${o.escape && o.escape.closed} page-click:${o.outside && o.outside.closed}`, !o.error && !!(o.escape && o.escape.closed && o.outside && o.outside.closed));
    }
  }
  if (m.tabs) {
    const easings = tabs.flatMap(([, t]) => (t.census ? Object.keys(t.census.easings) : []));
    const offToken = [...new Set(easings.filter((e) => !/^cubic-bezier\(0\.22, 1, 0\.36, 1\)$|^cubic-bezier\(0\.4, 0, 1, 1\)$/.test(e)))];
    add("DXA-16", "transitions use the Nova easing tokens only", offToken.join(" ") || "tokens only", offToken.length === 0);
    const loops = tabs.flatMap(([k, t]) => (t.loops || []).map((l) => `${k}:${l.name}${l.paintsBoxShadow ? "(box-shadow)" : ""}`));
    add("DXA-17", "no infinite animation outside the Today hero", [...new Set(loops)].join(" ") || 0, loops.length === 0);
    const cardsFlat = tabs.reduce((a, [, t]) => a + (t.census ? t.census.shadowsOnCards.none : 0), 0);
    add("DXA-19", "cards resolve an elevation shadow", `${cardsFlat} flat`, cardsFlat === 0);
    const gaps = [...new Set(tabs.flatMap(([, t]) => (t.census ? t.census.sectionGaps : [])))].sort((a, b) => a - b);
    add("DXA-20", "top-level gaps ⊆ {12, 24, 48, 56}", gaps.join(","), gaps.every((x) => [12, 24, 48, 56].includes(x)));
    const worstSizes = Math.max(0, ...tabs.map(([, t]) => (t.census ? t.census.distinctFontSizes : 0)));
    const tiny = tabs.reduce((a, [, t]) => a + (t.census ? t.census.tinyText : 0), 0);
    add("DXA-21", "≤ 8 font sizes per page, none < 11 px", `max ${worstSizes}, tiny ${tiny}`, worstSizes <= 8 && tiny === 0);
    const worstRadii = Math.max(0, ...tabs.map(([, t]) => (t.census ? t.census.distinctRadii : 0)));
    add("DXA-22", "≤ 4 corner radii per page (pill counted once)", worstRadii, worstRadii <= 4);
  }
  if (m.phone) {
    const rows = Object.entries(m.phone);
    const worst = Math.max(0, ...rows.map(([, p]) => p.topChrome));
    add("DXA-27", "phone: pinned top chrome ≤ 120 px (scrolled)", `${worst} px`, worst <= 120);
    const bottom = Math.max(0, ...rows.map(([, p]) => p.bottomChrome));
    add("DXA-27", "phone: bottom tab bar present", `${bottom} px`, bottom > 0);
    const clipped = rows.flatMap(([k, p]) => p.clippedTabs.map((t) => `${k}:${t}`));
    add("DXA-27", "phone: no overprinted tab labels", clipped.join(" ") || 0, clipped.length === 0);
    add("DXA-27", "phone: no horizontal overflow", rows.filter(([, p]) => p.overflow).map(([k]) => k).join(" ") || "none", rows.every(([, p]) => !p.overflow));
    if (m.phone.today && m.phone.today.activityBoardScreens !== null) add("DXA-28", "phone: activity board within 2.5 screens", m.phone.today.activityBoardScreens, m.phone.today.activityBoardScreens <= 2.5);
  }
  add("—", "console errors (dev CSP chunk warnings included)", (m.consoleErrors || []).length, null);
  return g;
}

/** The gate table as text (the CLI prints it; the spec attaches it). */
export function formatGates(gates) {
  const w = Math.max(...gates.map((x) => x.check.length));
  const lines = ["DXA gates"];
  for (const x of gates) {
    const value = String(x.value).replace(/\s+/g, " ").slice(0, 90);
    lines.push(`${x.result.padEnd(5)} ${x.id.padEnd(7)} ${x.check.padEnd(w)}  ${value}`);
  }
  const fails = gates.filter((x) => x.result === "FAIL").length;
  lines.push("", `${fails} failing, ${gates.filter((x) => x.result === "PASS").length} passing, ${gates.filter((x) => x.result === "INFO").length} info`);
  return lines.join("\n");
}

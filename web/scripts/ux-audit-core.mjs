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

export const ALL_PHASES = ["load", "tabs", "today", "hover", "overlays", "reduced", "light", "phone", "sky"];
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
      heroPending: !!(hero && hero.classList.contains("nova-hero--pending")),
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

/** Reduced motion should remove travel, not the non-motion cue that a card is
 * interactive. Exercise the real hover state instead of inferring it from CSS
 * so the probe covers the cascade that a reader actually receives. */
async function reducedHoverFeedback(page) {
  const cards = page.locator(".nova-today-pane .ui-card--interactive:visible");
  const sampled = Math.min(await cards.count(), 3);
  const samples = [];
  for (let i = 0; i < sampled; i++) {
    const card = cards.nth(i);
    await page.mouse.move(0, 0);
    await sleep(300);
    const rest = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.transform, boxShadow: cs.boxShadow, borderColor: cs.borderTopColor };
    });
    await card.hover({ timeout: 10_000 });
    await sleep(350);
    const hover = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.transform, boxShadow: cs.boxShadow, borderColor: cs.borderTopColor };
    });
    samples.push({
      feedback: rest.boxShadow !== hover.boxShadow && rest.borderColor !== hover.borderColor,
      noTravel: rest.transform === hover.transform,
      rest,
      hover,
    });
  }
  return {
    sampled,
    withFeedback: samples.filter((s) => s.feedback && s.noTravel).length,
    samples,
  };
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
    // DXA-08 owns UI labels and facts. Server-authored prose has its own text
    // contract and must not make this frontend display gate report a green
    // fix for a backend change it did not make (notably confirmationSentence).
    const copy = [...pane.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && !el.closest(".metric__hint, [data-server-prose]"))
      .map((el) => el.textContent ?? "")
      .join("\n");
    const sample = (arr) => [...new Set(arr)].slice(0, 6);
    const rawEnums = sample(copy.match(/\b[A-Z]{3,}(?:_[A-Z]{2,})+\b/g) || []);
    const noneValues = (copy.match(/^None$/gm) || []).length;
    const upperNames = sample(copy.match(/\b(MESHAM|RISHABAM|MITHUNAM|KADAGAM|SIMMAM|KANNI|THULAM|VIRUCHIGAM|DHANUSU|MAGARAM|KUMBAM|MEENAM|MANDHI)\b/g) || []);
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

    const readingSections = [...pane.querySelectorAll("section.om")].filter((s) => s.getBoundingClientRect().height > 0).length;
    return { rawEnums, noneValues, upperNames, emoji, textGlyphs, tamilInEnglish, stripes: sample(stripes), stripeCount: stripes.length, readingSections };
  });
}

/**
 * Page-sky stars that sit inside a text line, or show through a translucent
 * surface (DXA-10).
 *
 * This lives in its own phase, on its own clock, for a reason. The page sky
 * draws stars only from dusk on the dark canvas
 * (`celestial-ambient-nova.tsx`: `showStars = isLight || tod === "night" ||
 * tod === "dusk"`), so a run started at 11:50 finds no `.nova-celestial__star`
 * at all and BOTH DXA-10 gates report 0 and pass, with no fix anywhere in the
 * tree. Measured 2026-09-18 at 11:37 and 11:50 IST: `0 / 0 PASS`. The §12
 * baseline of `2 / 6` was taken at 18:39 IST, in the one window where the
 * layer under audit is on screen at all.
 *
 * That is this file’s fourth "green by a check that could not fail", so the
 * hour is pinned rather than inherited: `setFixedTime` (not `install`, which
 * also freezes the timers React and Next need to hydrate) plus an explicit
 * `timezoneId`, so the page reads 21:30 local wherever this runs.
 *
 * `starsRendered` is returned so the gate can tell "nothing shows through
 * anything" from "the sky never painted" — a measurement that could not be
 * taken is not a measurement that passed, the same rule DXA-07 follows.
 */
async function starOcclusion(page) {
  return page.evaluate(() => {
    const alphaOf = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(/[ ,/]+/).filter(Boolean);
        return parts.length > 3 ? parseFloat(parts[3]) : 1;
      }
      // color-mix() with transparency serializes as color(srgb r g b / a); read
      // as opaque, a translucent Nova surface would hide the stars behind it.
      const srgb = c.match(/^color\(srgb\s+([^)]+)\)$/);
      if (srgb) {
        const parts = srgb[1].split(/[ /]+/).filter(Boolean);
        return parts.length > 3 ? parseFloat(parts[3]) : 1;
      }
      return c === "transparent" ? 0 : 1;
    };
    /**
     * What this element paints over the point: "opaque", "sheer" or "none".
     *
     * `backgroundColor` alone is not the answer. `.nova-hero` paints
     * `linear-gradient(135deg, #1A1E31, #0A0E20)` — two solid colours — and
     * its backgroundColor computes to rgba(0, 0, 0, 0). Reading only the colour
     * called that hero see-through and reported nine page-sky stars as showing
     * through it, on a surface that in the screenshot hides them completely.
     *
     * So the gradient's own stops are read. Every stop opaque covers; a
     * `transparent` or alpha stop does not — which is exactly the Tools hero
     * (`linear-gradient(120deg, var(--color-accent-muted), transparent)`), the
     * surface DXA-10 named. An unreadable paint (a url() image) counts as
     * sheer: a gate should err toward failing.
     */
    const paints = (cs) => {
      if (parseFloat(cs.opacity) < 0.95) return "sheer";
      if (/blur\(/.test(cs.backdropFilter || "")) return "opaque"; // DXA-10 accepts blurred
      if (alphaOf(cs.backgroundColor) >= 0.95) return "opaque";
      const img = cs.backgroundImage;
      if (img && img !== "none") {
        const stops = img.match(/rgba?\([^)]*\)|color\(srgb[^)]*\)|transparent/g) || [];
        return stops.length > 0 && stops.every((s) => alphaOf(s) >= 0.95) ? "opaque" : "sheer";
      }
      return alphaOf(cs.backgroundColor) > 0 ? "sheer" : "none";
    };
    let starsRendered = 0;
    let starsInText = 0;
    let starsThroughSurface = 0;
    const samples = [];
    for (const star of document.querySelectorAll(".nova-sky .nova-celestial__star")) {
      const r = star.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      starsRendered++;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let covered = false;
      let translucent = null;
      // Paint order, topmost first. The sky ignores pointer events, so it is not
      // in the list; its ANCESTORS are, and they paint below it — stop there.
      for (const el of document.elementsFromPoint(cx, cy)) {
        if (el.contains(star)) break;
        const cs = getComputedStyle(el);
        const layer = paints(cs);
        if (layer === "opaque") { covered = true; break; }
        if (layer === "sheer" && el.getBoundingClientRect().width > 100) {
          // Name the paint, not just the tag: these surfaces are styled inline
          // and carry no class, so "button" alone does not say which one.
          const paint = cs.backgroundImage !== "none" ? cs.backgroundImage : cs.backgroundColor;
          translucent = `${window.__uxDescribe ? window.__uxDescribe(el) : el.tagName} {${paint.slice(0, 70)}}`;
        }
      }
      if (covered) continue;
      if (translucent) {
        starsThroughSurface++;
        if (samples.length < 6) samples.push(`through ${translucent}`);
      }
      const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(cx, cy) : null;
      if (range && range.startContainer.nodeType === 3) {
        const node = range.startContainer;
        const probe = document.createRange();
        probe.setStart(node, Math.max(0, range.startOffset - 1));
        probe.setEnd(node, Math.min(node.length, range.startOffset + 1));
        if ([...probe.getClientRects()].some((q) => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) {
          starsInText++;
          if (samples.length < 6) samples.push(`in text "${(node.textContent ?? "").trim().slice(0, 40)}"`);
        }
      }
    }
    const sky = document.querySelector(".nova-sky");
    // An empty pane is nothing but sky, and every star in it "shows through"
    // whatever the blank column paints. Recorded so the gate can refuse the
    // measurement instead of reading a failed render as a finding.
    const pane = window.__uxPane ? window.__uxPane() : null;
    return {
      hour: new Date().getHours(),
      skyOpacity: sky ? getComputedStyle(sky).opacity : null,
      paneElements: pane ? pane.querySelectorAll("*").length : 0,
      starsRendered,
      starsInText,
      starsThroughSurface,
      samples,
    };
  });
}

/** Rendered design-system census of the visible pane (DXA-16/19/20/21/22). */
async function census(page) {
  return page.evaluate(() => {
    const pane = window.__uxPane();
    const tally = (o, k) => { o[k] = (o[k] || 0) + 1; };
    const radius = {}, fontSize = {}, easing = {}, easingExamples = {}, shadowsOnCards = { none: 0, some: 0 };
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
        const timing = first ? first[1] : cs.transitionTimingFunction;
        tally(easing, timing);
        if (!/^cubic-bezier\(0\.22, 1, 0\.36, 1\)$|^cubic-bezier\(0\.4, 0, 1, 1\)$/.test(timing)) {
          (easingExamples[timing] ||= []).push({ tag: el.tagName.toLowerCase(), className: el.className, transition: cs.transition });
        }
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
      easings: sortObj(easing), easingExamples, shadowsOnCards, sectionGaps,
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
      const name = a.animationName || a.id || "waapi";
      if (allowed.test(name) || (target.classList && (target.classList.contains("skel") || target.classList.contains("ui-state__spinner")))) continue;
      const frames = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
      const paintsBoxShadow = frames.some((f) => "boxShadow" in f);
      out.push({ name, target: window.__uxDescribe ? window.__uxDescribe(target) : "", paintsBoxShadow });
    }
    return out;
  });
}

/** Wait until a programmatic pane scroll has stopped before taking a pointer sample. */
async function settleScroll(page) {
  await page.evaluate(async () => {
    let stable = 0;
    let previous = window.scrollY;
    while (stable < 3) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const current = window.scrollY;
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
  });
}

/** Real-pointer hover + press diffs sampled across the entire visible pane (DXA-12). */
async function hoverPress(page, max = 16) {
  const n = await page.evaluate(({ max }) => {
    document.querySelectorAll("[data-ux-h]").forEach((e) => e.removeAttribute("data-ux-h"));
    const pane = window.__uxPane();
    const candidates = [];
    for (const el of pane.querySelectorAll("button, a[href], [role='button'], [role='tab']")) {
      if (el.disabled || el.getAttribute("aria-disabled") === "true") continue;
      if (["true"].includes(el.getAttribute("aria-selected")) || ["true"].includes(el.getAttribute("aria-pressed")) || el.getAttribute("aria-current")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 90 || r.height < 30) continue;
      candidates.push(el);
    }
    const sampleCount = Math.min(max, candidates.length);
    for (let i = 0; i < sampleCount; i++) {
      const index = sampleCount === 1 ? 0 : Math.round(i * (candidates.length - 1) / (sampleCount - 1));
      candidates[index].setAttribute("data-ux-h", String(i));
    }
    return sampleCount;
  }, { max });
  const read = (i) => page.evaluate((i) => {
    const el = document.querySelector(`[data-ux-h="${i}"]`);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const describe = window.__uxDescribe ?? ((node) => node?.tagName?.toLowerCase() ?? "unknown");
    const selector = [el, el.parentElement, el.parentElement?.parentElement].map(describe).join(" < ");
    return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), selector, transform: cs.transform, boxShadow: cs.boxShadow, border: cs.borderTopColor, bg: cs.backgroundColor, color: cs.color, filter: cs.filter };
  }, i);
  const keys = ["transform", "boxShadow", "border", "bg", "color", "filter"];
  const out = [];
  for (let i = 0; i < n; i++) {
    const present = await page.evaluate((i) => {
      const el = document.querySelector(`[data-ux-h="${i}"]`);
      if (!el) return false;
      el.scrollIntoView({ block: "center", inline: "nearest" });
      return true;
    }, i);
    if (!present) continue;
    await settleScroll(page);
    await page.mouse.move(1, 1);
    await sleep(250);
    const a = await read(i);
    const box = await page.evaluate((i) => {
      const el = document.querySelector(`[data-ux-h="${i}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, i);
    if (!a || !box) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(350);
    const b = await read(i);
    await page.mouse.down();
    await sleep(70);
    const c = await read(i);
    await page.mouse.move(1, 1); // release OFF the element so nothing activates
    await page.mouse.up();
    out.push({ label: a.label, selector: a.selector, hover: keys.filter((k) => b && a[k] !== b[k]), press: keys.filter((k) => c && b && c[k] !== b[k]) });
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

/**
 * One crossfade per view switch (DXA-14). `ViewSwap` uses `mode="wait"`, so the
 * outgoing view animates out before the incoming one animates in; either half
 * proves the switch is not a hard cut. Samples for 500ms, which covers the
 * 180ms in / 120ms out pair plus dev-server slack.
 */
const SWAP_PROBE = (before) => new Promise((res) => {
  const t0 = performance.now();
  let animated = false;
  // A pane can hold several swaps (Life Areas has four Segmenteds), so the
  // signature is every key in the pane, not one panel picked by position.
  // Comparing the whole signature is what tells us the click actually drove a
  // swap rather than some unrelated control.
  const signature = () => [...window.__uxPane().querySelectorAll("[data-view-swap]")]
    .map((p) => p.getAttribute("data-view-key")).join("|");
  const tick = () => {
    // The crossfade is on the swap element itself. Descendants are excluded
    // deliberately: Life Areas reveals its groups on entry (DXA-18), so a
    // `contains` test reported animated:true with the crossfade removed —
    // caught by running this gate against the fix taken out.
    const panels = [...window.__uxPane().querySelectorAll("[data-view-swap]")];
    if (panels.some((p) => document.getAnimations().some((a) => {
      const t = a.effect && a.effect.target;
      return t === p;
    }))) animated = true;
    if (performance.now() - t0 > 500) {
      const key = signature();
      res({ animated, key, changed: key !== before });
    } else requestAnimationFrame(tick);
  };
  tick();
});

/**
 * Drive one Segmented-driven view switch on the current pane and watch for the
 * crossfade. Returns `skipped` when the pane has no unselected segment to
 * click — a pane that cannot switch is not a finding, but it must not read as
 * a pass either (see the `measured` gate in computeGates).
 */
async function viewSwap(page, name, maxTries = 4) {
  const result = { name };
  try {
    // Not every Segmented on a pane drives a ViewSwap — some filter in place.
    // Try each unselected segment until one moves the key signature; only then
    // is there a switch to judge. Re-tag each round, because the click
    // re-renders the row and a previous attribute would be gone.
    for (let i = 0; i < maxTries; i++) {
      const prep = await page.evaluate((idx) => {
        document.querySelectorAll("[data-ux-swap]").forEach((e) => e.removeAttribute("data-ux-swap"));
        const pane = window.__uxPane();
        const btns = [...pane.querySelectorAll('.ui-segmented__btn[aria-selected="false"]')];
        if (!btns[idx]) return null;
        btns[idx].setAttribute("data-ux-swap", "1");
        return { before: [...pane.querySelectorAll("[data-view-swap]")].map((p) => p.getAttribute("data-view-key")).join("|") };
      }, i);
      if (!prep) break;
      await page.locator('[data-ux-swap="1"]').click({ timeout: 8000 });
      const seen = await page.evaluate(SWAP_PROBE, prep.before);
      if (seen.changed) return { ...result, ...seen, from: prep.before, segment: i };
    }
    return { ...result, skipped: "no segment drove a view swap" };
  } catch (e) {
    return { ...result, error: e.message.split("\n")[0] };
  }
}

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
      if (m) {
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
      }
      // Chromium serializes color-mix() with transparency as color(srgb …).
      // Convert its unit RGB channels back to the 0–255 scale used below.
      const srgb = c.match(/^color\(srgb\s+([^)]+)\)$/);
      if (!srgb) return [0, 0, 0, 0];
      const p = srgb[1].split(/[ /]+/).filter(Boolean).map(Number);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
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

// ── DXA-07 · stale pane text, measured in the real stale state ─────────────
/**
 * Puts the Today pane into its genuine stale state — the next day's bundle
 * request held open, the date moved, `[data-stale]` rendered by the app
 * itself — and measures every visible element in the pane that owns a
 * non-empty text node, not one sample.
 *
 * Why not re-apply a declaration: the probe this replaces scraped the
 * stylesheets for an `opacity` on `.nova-today-pane[data-stale]` and set it
 * inline on the pane. Once the dim moved onto a descendant (the masthead) that
 * rule had no opacity, so it measured an undimmed pane and read 10.47:1 while
 * the day's own date and limbs sat at ≈2.9–4.3:1 (E-1, 2026-09-21). It also
 * sampled one briefing paragraph and never the masthead.
 *
 * Compositing follows paint order: ancestor background colours from the root
 * down, and each ancestor opacity < 1 opens a group blended back over the
 * colour behind it. Not seen: background images and gradients, and anything
 * painted underneath by a sibling (the hero's sky backdrop).
 */
async function staleTextContrast(page, onStale = async () => {}) {
  const next = await page.evaluate(() => {
    const input = document.querySelector("#dashboard-date");
    if (!(input instanceof HTMLInputElement) || !input.value) return null;
    const [y, m, d] = input.value.split("-").map(Number);
    const nd = new Date(y, m - 1, d + 1);
    return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
  });
  if (!next) return { error: "no date input to move the day with" };

  // Delay the next day's bundle, never fail it: a failed request exits the
  // stale state (`isShowingPreviousDay` stands down on error).
  let release = () => {};
  const released = new Promise((res) => { release = res; });
  let held = 0;
  const matcher = (url) => url.pathname.endsWith("/dashboard-bundle") && url.searchParams.get("date") === next;
  const handler = async (route) => {
    held += 1;
    // Bounded, so a probe that throws before releasing cannot hang the run.
    await Promise.race([released, new Promise((res) => setTimeout(res, 45_000))]);
    await route.continue().catch(() => {});
  };
  await page.route(matcher, handler);
  try {
    await page.evaluate((value) => {
      const input = document.querySelector("#dashboard-date");
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, next);
    const entered = await page
      .waitForSelector(".nova-today-pane[data-stale]", { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    // "Not measurable" is a failure, not a pass (DXA-10's rule).
    if (!entered) return { error: `pane never entered the stale state (bundle requests held: ${held})`, next, held };
    // Let the dim's own transition (--dur-base) finish before sampling.
    await page.waitForTimeout(600);
    await onStale();
    const measured = await page.evaluate(() => {
      const pane = document.querySelector(".nova-today-pane[data-stale]");
      if (!(pane instanceof HTMLElement)) return { error: "the stale state ended before it was measured" };
      const parse = (value) => {
        if (!value || value === "none" || value === "transparent") return null;
        const nums = (value.match(/[\d.]+/g) || []).map(Number);
        if (nums.length < 3) return null;
        const unit = value.startsWith("color(srgb");
        return { r: unit ? nums[0] * 255 : nums[0], g: unit ? nums[1] * 255 : nums[1], b: unit ? nums[2] * 255 : nums[2], a: nums[3] ?? 1 };
      };
      const mix = (front, back, alpha) => ({
        r: front.r * alpha + back.r * (1 - alpha),
        g: front.g * alpha + back.g * (1 - alpha),
        b: front.b * alpha + back.b * (1 - alpha),
        a: 1,
      });
      const luminance = (c) => {
        const channel = (n) => { const s = n / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
      };
      const contrast = (a, b) => {
        const l1 = luminance(a);
        const l2 = luminance(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };
      const labelOf = (el) => {
        const tag = el.tagName.toLowerCase();
        const cls = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "";
        let name = `${tag}${cls}`;
        if (!cls) {
          const owner = el.parentElement?.closest("[class]");
          const ownerCls = owner && typeof owner.className === "string" ? owner.className.trim().split(/\s+/)[0] : "";
          if (ownerCls) name += ` < .${ownerCls}`;
        }
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim().replace(/\s+/g, " ");
        return `${name} "${text.slice(0, 28)}"`;
      };

      const white = { r: 255, g: 255, b: 255, a: 1 };
      const samples = [];
      for (const el of [pane, ...pane.querySelectorAll("*")]) {
        const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!ownText) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility !== "visible") continue;
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) continue;
        if (cs.clipPath === "inset(50%)" || cs.clip === "rect(0px, 0px, 0px, 0px)") continue;

        const chain = [];
        for (let n = el; n; n = n.parentElement) chain.unshift(n);
        let cur = white;
        const groups = [];
        for (const n of chain) {
          const s = getComputedStyle(n);
          const op = Number(s.opacity);
          if (op < 0.999) groups.push({ op, backdrop: cur });
          const bg = parse(s.backgroundColor);
          if (bg && bg.a > 0) cur = mix(bg, cur, bg.a);
        }
        const opacity = groups.reduce((a, g) => a * g.op, 1);
        // Mid-fade or fully transparent text is not on screen to be read.
        if (opacity < 0.05) continue;
        const fg = parse(el instanceof SVGElement ? cs.fill : cs.color);
        if (!fg) continue;
        let textPixel = mix(fg, cur, fg.a);
        let backPixel = cur;
        for (let i = groups.length - 1; i >= 0; i--) {
          textPixel = mix(textPixel, groups[i].backdrop, groups[i].op);
          backPixel = mix(backPixel, groups[i].backdrop, groups[i].op);
        }
        const size = parseFloat(cs.fontSize) || 16;
        const weight = Number(cs.fontWeight) || 400;
        // WCAG large text: 18pt (24px), or 14pt (18.66px) bold.
        const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
        const ratio = contrast(textPixel, backPixel);
        samples.push({ label: labelOf(el), ratio: +ratio.toFixed(2), need, margin: ratio / need, opacity: +opacity.toFixed(2), color: cs.color, size, weight });
      }
      if (!samples.length) return { error: "no text measured in the stale pane" };
      samples.sort((a, b) => a.margin - b.margin);
      const failing = samples.filter((s) => s.ratio < s.need);
      // Borders are dimmed through tokens; a self-referencing custom property
      // is a cycle and computes to nothing, so record what the pane's content
      // actually resolves (empty = the dim dropped the border instead).
      const inner = pane.firstElementChild ?? pane;
      const tokens = Object.fromEntries(["--color-border", "--color-border-strong", "--color-accent-muted"].map((t) => [
        t,
        { stale: getComputedStyle(inner).getPropertyValue(t).trim(), parent: pane.parentElement ? getComputedStyle(pane.parentElement).getPropertyValue(t).trim() : null },
      ]));
      return {
        n: samples.length,
        worst: samples[0],
        failing: failing.length,
        failingLabels: failing.slice(0, 12).map((s) => `${s.label} ${s.ratio}:1`),
        lowest: samples.slice(0, 10),
        tokens,
        ariaBusy: pane.getAttribute("aria-busy"),
      };
    });
    return { ...measured, next, held, state: "real: next day's dashboard-bundle held open" };
  } finally {
    release();
    await page.unroute(matcher, handler).catch(() => {});
    await page
      .waitForFunction(
        (want) => document.querySelector(".nova-today-pane")?.getAttribute("data-day") === want
          && !document.querySelector(".nova-today-pane[data-stale]"),
        next,
        { timeout: 30_000 },
      )
      .catch(() => {});
  }
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

    // A full tab sweep matters when that phase is under test. Focused overlay
    // and interaction runs only touch Today (and Calendar for the day drawer),
    // so compiling every lazy tab first turns a small verification into a
    // multi-minute unrelated wait on next dev.
    const warmTabs = PHASES.has("tabs")
      ? [...TABS.map((tab) => tab.slug), "settings"]
      : PHASES.has("overlays")
        ? [TABS[0].slug, "calendar"]
        : [TABS[0].slug];
    log(`warm-up (${warmTabs.join(", ")})`);
    if (PHASES.has("tabs") || PHASES.has("hover") || PHASES.has("overlays")) {
      // A direct lazy-tab URL gets a fresh dev CSP nonce, then its chunk can
      // be refused. Warm the interactive paths by the same tab controls a
      // reader uses, so a blank pane cannot be mistaken for a zero sample.
      await page.goto("/dashboard");
      await settle(page, 300);
      for (const slug of warmTabs) {
        const tab = TABS.find((candidate) => candidate.slug === slug);
        if (tab && tab.id !== "personal") await clickTab(page, tab);
        if (slug === "settings") {
          await page.locator(".cd-avatar").first().click({ timeout: 10_000 });
          await page.locator(".cd-dropdown__btn", { hasText: "Settings" }).first().click({ timeout: 10_000 });
        }
        await settle(page, 300);
      }
    } else {
      for (const slug of warmTabs) {
        await page.goto(`/dashboard/${slug}`);
        await settle(page, 300);
      }
    }

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
          // DXA-05: the pending hero is built to stand at the loaded hero's
          // height, so the day's data lands without moving the page. This is
          // that claim as a number — the last waiting height against the
          // first settled one.
          heroReserve: (() => {
            const waiting = [...tl].reverse().find((s) => s.heroPending && s.heroH > 0);
            const settled = tl.find((s, i) => i > 0 && !s.heroPending && s.heroH > 0 && tl[i - 1].heroPending);
            return waiting && settled
              ? { pending: waiting.heroH, loaded: settled.heroH, delta: settled.heroH - waiting.heroH }
              : null;
          })(),
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
      // DXA-14: a Segmented-driven switch must crossfade, not hard-cut. Probed
      // after the per-tab census above, so changing a sub-view cannot disturb
      // the screenshots or the design-system counts already taken. Tabs are
      // reached by clicking, not goto — a direct lazy-tab URL re-issues the dev
      // CSP nonce and the pane renders blank (DXA-35).
      metrics.viewSwaps = [];
      for (const id of ["life-areas", "plan", "calendar"]) {
        const tab = TABS.find((t) => t.id === id);
        if (!tab) continue;
        await clickTab(page, tab);
        await settle(page, 800);
        metrics.viewSwaps.push(await viewSwap(page, id));
      }
      save();

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
      // A day that never loaded would pass this probe for the wrong reason:
      // DXA-05's pending hero stands at the loaded height by construction, so
      // measuring a placeholder page against a placeholder page returns a
      // perfect ratio while proving nothing. Demand a loaded, *settled* day
      // first and record an error otherwise — which withholds the gates
      // rather than passing them.
      //
      // Both halves are needed. Markers alone fire too early: the hero fills
      // (no `--pending`, no DXA-03 placeholder, no `.skel`) while the sections
      // below it are still mounting, and a baseline taken there measured
      // 2,072px against the same page's settled 4,074px. `settle()` does not
      // cover it either — it gives up after ~32s, and this stack needs ~11s
      // just to fill the pane after a cold compile. So: the markers, and then
      // a document height that has not moved for 2s.
      const loaded = await (async () => {
        let lastHeight = -1;
        let stableFor = 0;
        for (let i = 0; i < 150; i++) {
          const now = await page.evaluate(() => {
            const pane = document.querySelector(".nova-today-pane");
            return {
              ready: !!pane
                && !document.querySelector(".nova-hero--pending")
                && document.querySelectorAll("[data-pending-placeholder]").length === 0
                && document.querySelectorAll(".skel").length === 0,
              // The pane's own box, the same number the gate measures — and
              // not `documentElement.scrollHeight`, which does not track it
              // (the dashboard scrolls an inner element). Watching the
              // document instead declared "settled" while sections were still
              // mounting, and every baseline taken that way was a different
              // half-built page: 1,513 / 2,072 / 2,940 / 4,052 across runs of
              // the same account.
              height: pane ? Math.round(pane.getBoundingClientRect().height) : -1,
            };
          }).catch(() => ({ ready: false, height: -1 }));
          stableFor = now.ready && now.height === lastHeight ? stableFor + 1 : 0;
          lastHeight = now.height;
          if (stableFor >= 5) return true;
          await sleep(400);
        }
        return false;
      })();
      metrics.today.dateChange = { error: "the day never finished loading — nothing to measure a date change against" };
      // The state the date change is measured *from*, so a surprising ratio
      // can be read rather than guessed at.
      await shot(run, page, "today-before-date-change");
      // What the pane actually consisted of at the baseline, so a surprising
      // `pageBefore` names its own cause instead of needing a bisect.
      metrics.today.baselineSections = await page.evaluate(() => {
        const pane = document.querySelector(".nova-today-pane");
        if (!pane) return null;
        return [...pane.children].map((el) => ({
          h: Math.round(el.getBoundingClientRect().height),
          text: (el.textContent || "").trim().slice(0, 40),
        }));
      });
      if (loaded) metrics.today.dateChange = await page.evaluate(async () => {
        const input = document.querySelector("#dashboard-date");
        const hero = document.querySelector(".nova-hero");
        if (!input || !hero) return { error: "no date input or hero" };
        const before = hero.getBoundingClientRect().height;
        // Both baselines are read BEFORE the date is dispatched. Reading the
        // pane afterwards, even in the same synchronous block, already caught
        // the collapsed pane on a build without the fix (1,513px against a
        // settled 3,515px) and reported a perfect ratio against it.
        const paneOf = () => document.querySelector(".nova-today-pane");
        const paneBefore = paneOf() ? paneOf().getBoundingClientRect().height : 0;
        const [y, m, d] = input.value.split("-").map(Number);
        const nd = new Date(y, m - 1, d + 1);
        const next = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        const t0 = performance.now();
        // The hero alone does not carry this finding: the audit measured the
        // page at 4,029 -> 1,376px, i.e. everything below the hero went too.
        // Measured on the pane's own rendered box rather than
        // `documentElement.scrollHeight`, which does not track it — the
        // dashboard scrolls an inner element, and that number read 4,074
        // against a 3,515px pane.
        let minHero = before;
        let minPane = paneBefore;
        const animations = new Set();
        await new Promise((res) => {
          const tick = (now) => {
            const h = document.querySelector(".nova-hero");
            minHero = Math.min(minHero, h ? h.getBoundingClientRect().height : 0);
            minPane = Math.min(minPane, paneOf() ? paneOf().getBoundingClientRect().height : 0);
            for (const a of document.getAnimations()) {
              const n = a.animationName || a.transitionProperty || a.id || "waapi";
              if (!/twinkle|spin|breathe|pulse|shimmer|travel/.test(n)) animations.add(n);
            }
            if (now - t0 < 4000) requestAnimationFrame(tick); else res();
          };
          requestAnimationFrame(tick);
        });
        return {
          next,
          heroBefore: Math.round(before), heroMin: Math.round(minHero),
          minRatio: +(minHero / before).toFixed(2),
          paneBefore: Math.round(paneBefore), paneMin: Math.round(minPane),
          paneMinRatio: paneBefore ? +(minPane / paneBefore).toFixed(2) : 0,
          docHeight: document.documentElement.scrollHeight,
          animations: [...animations].slice(0, 12),
        };
      });
      // Holding the previous day is only a fix if the selected day then
      // replaces it. A gate that measures height alone cannot tell the two
      // apart, so ask the pane which day it is rendering (DXA-07).
      if (!metrics.today.dateChange.error) {
        metrics.today.dateChange.arrived = await page
          .waitForFunction(
            (want) => document.querySelector(".nova-today-pane")?.getAttribute("data-day") === want,
            metrics.today.dateChange.next,
            { timeout: 20000 },
          )
          .then(() => true)
          .catch(() => false);
      }
      await settle(page, 800);
      await shot(run, page, "today-next-day");
      save();
    }

    if (PHASES.has("hover")) {
      log("hover/press coverage");
      metrics.hover = {};
      await page.goto("/dashboard");
      await settle(page, 1000);
      await clickTab(page, TABS[0]);
      await settle(page, 900);
      metrics.hover.today = await hoverPress(page, 16);
      for (const tab of TABS.filter((tab) => tab.id !== "personal")) {
        await clickTab(page, tab);
        await settle(page, 900);
        metrics.hover[tab.slug] = await hoverPress(page, 16);
      }
      save();
    }

    if (PHASES.has("overlays")) {
      log("overlays: enter and exit");
      await page.goto("/dashboard");
      await settle(page, 1000);
      await clickTab(page, TABS[0]);
      await settle(page, 900);
      metrics.overlays = [];
      // Use a real pointer click: the overlay probe must preserve Playwright's
      // actionability checks now that the trigger and dismiss layer share their
      // retained lifetime. DXA-12 separately measures the visual feedback.
      const clickOpen = (sel) => () => page.locator(sel).first().click({ timeout: 10_000 });
      metrics.overlays.push(await overlay(run, page, "more-menu", clickOpen("button.cd-tab--more"), ".cd-dropdown--nav", "button.cd-tab--more"));
      metrics.overlays.push(await overlay(run, page, "notifications", clickOpen(".cd-topbar__right .cd-icon-btn"), ".cd-alerts-popover", ".cd-topbar__right .cd-icon-btn"));
      metrics.overlays.push(await overlay(run, page, "account-menu", clickOpen(".cd-topbar .cd-avatar"), ".cd-dropdown:not(.cd-dropdown--nav)", ".cd-topbar .cd-avatar"));
      metrics.overlays.push(await overlay(run, page, "ask-vinaadi", clickOpen(".cd-ask-search"), '[role="dialog"]', null));
      await clickTab(page, TABS[1]);
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
      await clickTab(rp, TABS[0]);
      await settle(rp, 800);
      metrics.reducedMotion.hoverFeedback = await reducedHoverFeedback(rp);
      save();
      await ctx.close();
    }

    if (PHASES.has("light")) {
      log("light theme");
      const { ctx, page: lp } = await newContext(run, browser, { viewport: { width: 1440, height: 900 }, theme: "light" });
      await lp.goto("/dashboard/today");
      await settle(lp, 1200);
      metrics.skeletonLight = await skeletonPalette(lp);
      await lp.waitForFunction(() => {
        const pane = document.querySelector(".nova-today-pane[data-day]");
        return !!pane
          && !document.querySelector(".nova-hero--pending")
          && document.querySelectorAll("[data-pending-placeholder]").length === 0
          && document.querySelectorAll(".skel").length === 0;
      }, null, { timeout: 60000 });
      await shot(run, lp, "light-today");
      metrics.lightStaleContrast = await staleTextContrast(lp, () => shot(run, lp, "light-today-stale"));
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

    if (PHASES.has("sky")) {
      log("sky: page starfield occlusion, clock pinned to 21:30 IST");
      // A separate context, because pinning the clock is not free: every other
      // phase reads real panchangam for the real day, and DXA-03/05/07 measure
      // that day loading. Only the sky needs a fixed hour, so only the sky gets
      // one.
      const { ctx, page: sp } = await newContext(run, browser, { viewport: { width: 1440, height: 900 }, timezoneId: "Asia/Kolkata" });
      await sp.clock.setFixedTime(new Date("2026-09-17T16:00:00Z")); // 21:30 IST
      metrics.sky = {};
      // Switch tabs by CLICKING, never by `goto`. On this dev stack a fresh
      // document re-issues the CSP nonce and every lazily-loaded tab chunk is
      // then refused (DXA-35), so a per-tab `goto` renders an EMPTY pane — and
      // an empty pane is nothing but sky, which reads as a page whose every
      // star shows through. The first version of this phase reported 10 of 17
      // stars "through a translucent surface" on Goals; the screenshot beside
      // it was a blank starfield.
      await sp.goto("/dashboard/today");
      await settle(sp, 1200);
      for (const tab of TABS) {
        if (tab.id !== "personal") {
          await clickTab(sp, tab).catch(() => {});
          await settle(sp, 1200);
        }
        await sp.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);
        metrics.sky[tab.id] = await starOcclusion(sp);
        await shot(run, sp, `sky-${tab.slug}`);
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
  if (m.lightStaleContrast) {
    const sc = m.lightStaleContrast;
    // Every text-bearing element against its own WCAG threshold; the value
    // names the weakest one so a FAIL points at its element.
    const value = sc.error ?? `min ${sc.worst.ratio.toFixed(2)}:1${sc.worst.need === 3 ? " (large text, needs 3:1)" : ""} (${sc.worst.label}, n=${sc.n})`;
    add("DXA-07", "stale pane body text holds AA on light", value, !sc.error && sc.failing === 0);
  }
  if (m.bareLoad) add("DXA-02", "bare /dashboard shows one destination", m.bareLoad.destinations.join(" → "), m.bareLoad.destinations.length === 1 && m.bareLoad.destinations[0] === "personal");
  if (m.todayLoad) {
    add("DXA-03", "no empty-state copy while loading (Today)", m.todayLoad.falseEmptyFrom === null ? "never" : `${m.todayLoad.falseEmptyFrom}–${m.todayLoad.falseEmptyUntil} ms`, m.todayLoad.falseEmptyFrom === null);
    add("DXA-04", "no onboarding banner for a set-up account", `bare:${m.bareLoad ? m.bareLoad.onboardingSeen : "?"} today:${m.todayLoad.onboardingSeen}`, !m.todayLoad.onboardingSeen && !(m.bareLoad && m.bareLoad.onboardingSeen));
    add("DXA-05", "CLS < 0.1 (Today cold load)", m.todayLoad.cls, m.todayLoad.cls < 0.1);
    add("DXA-05", "no top-bar / sub-bar shifts", m.todayLoad.topbarShifts, m.todayLoad.topbarShifts === 0);
    add("DXA-05", "document height changes during load", m.todayLoad.documentHeightChanges, null);
    const hr = m.todayLoad.heroReserve;
    add(
      "DXA-05",
      "pending hero within 8px of loaded",
      hr ? `${hr.pending} → ${hr.loaded} (${hr.delta >= 0 ? "+" : ""}${hr.delta}px)` : "not observed",
      hr ? Math.abs(hr.delta) <= 8 : null,
    );
  }
  if (m.exploreLoad) add("DXA-05", "CLS < 0.1 (Understand cold load)", m.exploreLoad.cls, m.exploreLoad.cls < 0.1);
  if (m.tabs) {
    const switches = tabs.filter(([, t]) => t.switch && !t.switch.error);
    const full = switches.reduce((a, [, t]) => a + t.switch.skelFullOpacityFrames, 0);
    add("DXA-06", "frames showing a skeleton at full opacity on first tab visits", full, prod ? full === 0 : null);
  }
  if (m.today && m.today.dateChange) {
    const dc = m.today.dateChange;
    // On an error every gate reports it and fails: a measurement that could
    // not be taken is not a measurement that passed.
    add("DXA-07", "hero keeps ≥ 90% height through a date change", dc.error ?? dc.minRatio, !dc.error && dc.minRatio >= 0.9);
    add("DXA-07", "Today pane keeps ≥ 90% height through a date change", dc.error ?? dc.paneMinRatio, !dc.error && dc.paneMinRatio >= 0.9);
    add("DXA-07", "the selected day replaces the held one", dc.error ?? (dc.arrived ? dc.next : "still on the previous day"), dc.arrived === true);
  }
  if (m.tabs) {
    const enums = list((c) => c.rawEnums);
    add("DXA-08", "no raw enums / 'None' / upper-case rasi names", [...enums, ...list((c) => c.upperNames)].join(" ; ") || `none (None×${sum((c) => c.noneValues)})`, enums.length === 0 && sum((c) => c.noneValues) === 0 && list((c) => c.upperNames).length === 0);
    add("DXA-09", "no accent stripes", list((c) => c.stripes).join(" ; ") || 0, sum((c) => c.stripeCount) === 0);
    add("DXA-09", "no Tamil text in English mode", list((c) => c.tamilInEnglish).join(" ; ") || 0, list((c) => c.tamilInEnglish).length === 0);
    add("DXA-09", "no emoji / text glyphs as icons", [...list((c) => c.emoji), ...list((c) => c.textGlyphs)].join(" ; ") || 0, list((c) => c.emoji).length === 0 && list((c) => c.textGlyphs).length === 0);
    if (m.tabs.family && m.tabs.family.checks) add("DXA-37", "Family shows exactly one reading", m.tabs.family.checks.readingSections, m.tabs.family.checks.readingSections === 1);
  }
  if (m.sky) {
    const skies = Object.values(m.sky);
    const total = (f) => skies.reduce((a, s) => a + (f(s) ?? 0), 0);
    const rendered = total((s) => s.starsRendered);
    const evidence = skies.flatMap((s) => s.samples ?? []).slice(0, 6).join(" ; ");
    // The sky paints stars only from dusk. If the pinned clock did not put one
    // on screen, these two gates have nothing to measure, and reporting 0 would
    // report the absence of the LAYER as the absence of the DEFECT.
    const blank = Object.entries(m.sky).filter(([, s]) => (s.paneElements ?? 0) < 40).map(([k]) => k);
    if (rendered === 0 || blank.length > 0) {
      const hours = [...new Set(skies.map((s) => s.hour))].join(",");
      const why = rendered === 0
        ? `the sky painted no stars (page hour ${hours})`
        : `these panes did not render: ${blank.join(", ")}`;
      add("DXA-10", "no page-sky star inside a text line", `not measurable: ${why}`, false);
      add("DXA-10", "no page-sky star showing through a translucent surface", `not measurable: ${why}`, false);
    } else {
      add("DXA-10", "no page-sky star inside a text line", `${total((s) => s.starsInText)} of ${rendered}${evidence ? ` — ${evidence}` : ""}`, total((s) => s.starsInText) === 0);
      add("DXA-10", "no page-sky star showing through a translucent surface", `${total((s) => s.starsThroughSurface)} of ${rendered}`, total((s) => s.starsThroughSurface) === 0);
    }
  }
  if (m.reducedMotion && !m.reducedMotion.error) {
    add("DXA-11", "reduced motion: nav indicator does not move", m.reducedMotion.indicatorTransforms.length, m.reducedMotion.indicatorTransforms.length <= 1);
    add("DXA-11", "reduced motion: pane appears without a fade", m.reducedMotion.paneOpacities.join(","), m.reducedMotion.paneOpacities.every((o) => o === "1"));
    const feedback = m.reducedMotion.hoverFeedback ?? { sampled: 0, withFeedback: 0 };
    add("DXA-12", "reduced motion keeps colour/shadow hover feedback", `${feedback.withFeedback}/${feedback.sampled}`, feedback.sampled > 0 && feedback.withFeedback === feedback.sampled);
  }
  if (m.viewSwaps) {
    // A pane with no unselected segment tells us nothing, so it is reported
    // rather than silently averaged away — the empty-pane lesson from DXA-12.
    const usable = m.viewSwaps.filter((s) => !s.skipped && !s.error);
    const blank = m.viewSwaps.filter((s) => s.skipped || s.error).map((s) => s.name);
    add("DXA-14", "every view-swap pane was measurable", blank.length ? `not measured: ${blank.join(",")}` : `${usable.length} panes`, m.viewSwaps.length > 0 && blank.length === 0);
    for (const s of usable) {
      add("DXA-14", `view switch ${s.name}: crossfades`, `animated:${s.animated} key:${s.from}→${s.key}`, !!s.animated && !!s.changed);
    }
  }
  if (m.hover) {
    const all = Object.values(m.hover).flat();
    const panes = Object.entries(m.hover);
    const empty = panes.filter(([, surfaces]) => surfaces.length === 0).map(([pane]) => pane);
    const hov = all.filter((x) => x.hover.length).length;
    const prs = all.filter((x) => x.press.length).length;
    add("DXA-12", "every hover pane yielded surfaces", empty.length ? `empty: ${empty.join(",")}` : "all panes measured", empty.length === 0);
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

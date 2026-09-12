/**
 * A/B fingerprint of what the browser actually resolved, for the CSS split.
 *
 * Everything else proving the split is static: css-inventory reachability,
 * css-split-seams cascade order, the size ratchets. None of it has looked at a
 * rendered page. This does, on all three load contexts, in both themes, at two
 * widths — and it is run twice, once at HEAD and once with
 * scripts/css-presplit-toggle.mjs --on, then diffed.
 *
 * WHAT IS RECORDED, AND WHY NOT PIXELS. Screenshot diffing a dashboard whose
 * content is today's chart produces a wall of true-but-irrelevant differences.
 * What matters here is narrower and checkable exactly: for a given combination
 * of classes, does the browser resolve the same declarations? So the
 * fingerprint is keyed by `tagName + sorted class list` and holds the computed
 * styles of the FIRST element carrying that combination.
 *
 * That key is deliberately not a DOM path. A path changes whenever the content
 * changes length — one extra list item shifts every sibling after it and every
 * descendant, so a path-keyed diff reports thousands of false changes on a page
 * that is styled identically. A class combination is stable under content
 * churn: more items means more elements sharing the same key, not a new key.
 * Combinations that appear on only one side are reported separately as DOM
 * drift, never as a style change.
 *
 * Scrollbars are probed rather than read. F5 rewrote ::-webkit-scrollbar-thumb
 * to derive from --color-text per theme, and pseudo-element styles never appear
 * in getComputedStyle. So a probe element is injected carrying the exact
 * color-mix() the rule uses and its resolved background is read back, which
 * gives the actual painted colour on each theme.
 */
import { test, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = process.env.CSS_AB_OUT
  ? path.resolve(process.env.CSS_AB_OUT)
  : path.join(__dirname, ".artifacts", "css-ab", "unlabelled");

/** Properties that a mis-filed CSS rule would change. Deliberately not "all of
 *  them": getComputedStyle exposes ~340, most of which are initial values that
 *  add noise and megabytes without adding signal. */
const PROPS = [
  "color", "background-color", "background-image", "opacity", "visibility", "display",
  "position", "z-index", "overflow-x", "overflow-y",
  "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
  "text-align", "text-transform", "text-decoration-line", "white-space",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-style", "border-top-left-radius", "border-bottom-right-radius",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  // Box metrics, because the one thing the existing visual suite reports on
  // every marketing page is tap-target-too-small (40x40 buttons against a 44px
  // floor). Lost padding and a pre-existing 40px control are indistinguishable
  // from that failure alone; these make the difference visible.
  "width", "height", "min-width", "min-height", "max-width", "box-sizing",
  "box-shadow", "flex-direction", "flex-wrap", "justify-content", "align-items", "gap",
  "grid-template-columns", "grid-template-rows", "transform", "text-shadow", "backdrop-filter",
];

/** The scrollbar rules F5 rewrote, as the color-mix() expressions they now use. */
const SCROLLBAR_PROBES: Record<string, string> = {
  "shell-track": "color-mix(in srgb, var(--color-text) 4%, transparent)",
  "shell-thumb": "color-mix(in srgb, var(--color-text) 18%, transparent)",
};

type Fingerprint = {
  route: string;
  theme: string;
  viewport: string;
  docScrollWidth: number;
  innerWidth: number;
  elementCount: number;
  styles: Record<string, Record<string, string>>;
  probes: Record<string, string>;
  vars: Record<string, string>;
};

async function fingerprint(page: Page, route: string, theme: string, viewport: string): Promise<Fingerprint> {
  return page.evaluate(
    ({ PROPS, SCROLLBAR_PROBES, route, theme, viewport }) => {
      const styles: Record<string, Record<string, string>> = {};
      let elementCount = 0;

      for (const el of Array.from(document.querySelectorAll("*"))) {
        if (/^(SCRIPT|STYLE|LINK|META|HEAD|TITLE|NOSCRIPT)$/.test(el.tagName)) continue;
        elementCount++;
        const classes = Array.from(el.classList).sort().join(".");
        // Elements with no class carry only inherited or element-selector
        // styling; include them under a tag-only key so a change to `body`,
        // `a` or `h2` rules is still visible.
        const key = classes ? `${el.tagName.toLowerCase()}.${classes}` : el.tagName.toLowerCase();
        if (key in styles) continue; // first occurrence wins
        const cs = getComputedStyle(el);
        const rec: Record<string, string> = {};
        for (const p of PROPS) rec[p] = cs.getPropertyValue(p);
        styles[key] = rec;
      }

      // Scrollbar pseudo-elements never appear in getComputedStyle, so paint the
      // same color-mix() onto a real node and read what it resolved to.
      const probes: Record<string, string> = {};
      const host = (document.querySelector(".cd-shell") as HTMLElement) ?? document.body;
      for (const [name, expr] of Object.entries(SCROLLBAR_PROBES)) {
        const probe = document.createElement("div");
        probe.style.background = expr;
        host.appendChild(probe);
        probes[name] = getComputedStyle(probe).backgroundColor;
        probe.remove();
      }

      const rootStyle = getComputedStyle(document.documentElement);
      const vars: Record<string, string> = {};
      for (const v of ["--color-text", "--color-bg", "--color-surface", "--color-accent", "--font-body", "--font-display"])
        vars[v] = rootStyle.getPropertyValue(v).trim();
      vars["data-theme"] = document.documentElement.getAttribute("data-theme") ?? "(none)";
      vars["data-ui"] = document.documentElement.getAttribute("data-ui") ?? "(none)";

      return {
        route,
        theme,
        viewport,
        docScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        elementCount,
        styles,
        probes,
        vars,
      };
    },
    { PROPS, SCROLLBAR_PROBES, route, theme, viewport },
  );
}

function save(name: string, data: unknown) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 1), "utf8");
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

/** Public routes — these load globals.css + marketing.css. */
const MARKETING_ROUTES = [
  "/",
  "/features/daily-guidance",
  "/trust/methodology",
  "/learn/what-is-porutham",
  // The only route in this list that renders <RasiBadge>/<NakBadge>, whose
  // `as-rasi--${tone}` / `as-nak--${size}` modifiers a usage scan cannot see.
  // The first version of this list had no such page, so the prune that deleted
  // those rules would have gone unnoticed here too — the marks on
  // /trust/methodology are what caught it, and only by luck of being on a page
  // someone happened to include.
  "/natchathiram",
  "/tools/marriage-porutham-calculator",
  // The two that carry .cl-mobile-* / .cd-responsive-* grouped selectors, which
  // the split had to divide between globals.css and marketing.css.
  "/tools/daily-panchangam-planner",
  "/tools/indraiya-rasipalan",
];

/** Neither is under app/dashboard/, so they load globals.css and nothing else.
 *  This is the third load context, the one that reads like "signed-in" and is
 *  not — filing .input--error by feel put login's validation styling in a file
 *  /login never downloads. */
const ROOT_ONLY_ROUTES = ["/login"];

const THEMES = ["dark", "light"] as const;
const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

const slug = (s: string) => (s === "/" ? "home" : s.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-"));

test.describe("css A/B — public and root-only routes", () => {
  for (const route of [...MARKETING_ROUTES, ...ROOT_ONLY_ROUTES]) {
    for (const theme of THEMES) {
      for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
        // Mobile is where .cl-mobile-* earns its name; running every route at
        // both widths in both themes would quadruple a slow suite for little
        // extra signal, so the second width is spent on the routes that use it.
        const mobileWorthwhile = route.startsWith("/tools/") || route === "/" || route === "/login";
        if (vpName === "mobile" && !mobileWorthwhile) continue;

        test(`${slug(route)} · ${theme} · ${vpName}`, async ({ browser }) => {
          const context = await browser.newContext({ viewport: vp });
          const page = await context.newPage();
          // The inline script in app/layout.tsx reads this before first paint,
          // so setting it here avoids a light-then-dark flash mid-capture.
          await context.addInitScript((t) => {
            try {
              localStorage.setItem("vinaadi-theme", t);
            } catch {
              /* storage disabled — the script falls back to prefers-color-scheme */
            }
          }, theme);
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await settle(page);
          const fp = await fingerprint(page, route, theme, vpName);
          save(`${slug(route)}__${theme}__${vpName}`, fp);
          await page.screenshot({
            path: path.join(OUT, `${slug(route)}__${theme}__${vpName}.png`),
            fullPage: true,
          });
          await context.close();
        });
      }
    }
  }
});

/**
 * The dashboard context, which needs a real signed-in account. Same synthetic
 * bootstrap as nova-sweep.spec.ts (fictitious birth data per the repo's
 * synthetic-fixtures rule), against the isolated e2e backend that
 * e2e/global-setup.ts has already proven is not the dev one.
 */
test.describe("css A/B — dashboard", () => {
  test.describe.configure({ mode: "serial" });

  const PASSWORD = "CssAb!Test123";
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const email = `css-ab-${Date.now()}@e2e.test`;
    context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    await context.addInitScript(() => {
      try {
        localStorage.setItem("vinaadi-theme", "dark");
      } catch {
        /* ignore */
      }
    });
    const api = context.request;
    const csrf = { "X-Vinaadi-CSRF": "1" };

    const reg = await api.post("/api/backend/api/v1/auth/register", { data: { email, password: PASSWORD, consentGiven: true } });
    if (!reg.ok()) throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
    const login = await api.post("/api/backend/api/v1/auth/login", { data: { email, password: PASSWORD } });
    if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);

    const bp = await api.post("/api/backend/api/v1/birth-profiles", {
      data: {
        displayName: "E2E CssAb Owner",
        relationshipToOwner: "self",
        birthDateLocal: "1990-05-15",
        birthTimeLocal: "08:30:00",
        birthPlace: "Chennai, Tamil Nadu, India",
        birthLatitude: 13.0827,
        birthLongitude: 80.2707,
        birthTimezone: "Asia/Kolkata",
        calculateNow: true,
        genderForTraditionalRules: "male",
        maritalStatus: "married",
      },
      headers: csrf,
    });
    if (!bp.ok()) throw new Error(`birth profile failed: ${bp.status()} ${await bp.text()}`);

    page = await context.newPage();
    await page.goto("/dashboard");
    await settle(page);
    // First-run modals overlay the page; both close on a backdrop click, which
    // is a pure client-side state change (see nova-sweep.spec.ts for why the
    // labelled buttons are avoided — one of them fires a real mutation).
    for (let i = 0; i < 12; i++) {
      const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
      if (!(await dialog.isVisible().catch(() => false))) break;
      await dialog.click({ position: { x: 3, y: 3 }, force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    await page
      .waitForFunction(() => !document.body.innerText.includes("Refreshing..."), { timeout: 45_000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  for (const theme of THEMES) {
    test(`dashboard · ${theme} · desktop`, async () => {
      await page.evaluate((t) => {
        localStorage.setItem("vinaadi-theme", t);
        document.documentElement.setAttribute("data-theme", t);
      }, theme);
      await page.waitForTimeout(800);
      const fp = await fingerprint(page, "/dashboard", theme, "desktop");
      save(`dashboard__${theme}__desktop`, fp);
      await page.screenshot({ path: path.join(OUT, `dashboard__${theme}__desktop.png`), fullPage: true });
    });
  }
});

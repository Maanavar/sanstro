/**
 * Every public page names itself to search engines (GRW-02, GRW-07).
 *
 * Next merges `metadata` down the layout tree key by key: a page that exports
 * no `alternates` inherits its parent's, canonical and all. The root layout
 * used to declare `canonical: "https://vinaadi.com"`, so ten public pages —
 * all four /features pages, /trust/methodology, /trust/about-vinaadi,
 * rectification, chandrashtama, /family and the panchangam widget — told Google
 * they were duplicates of the homepage, and carried its title too.
 *
 * This evaluates the real metadata objects (static `metadata`, or
 * `generateMetadata` called with sample params) rather than grepping for the
 * word "canonical", because half the site builds its metadata in helpers
 * (`metadataForCategory`, `metadataForMuhurthamYear`) that a text search of the
 * page cannot see.
 *
 * BLIND SPOT: the root layout cannot be imported here (`next/font` needs Next's
 * compiler), so its canonical and title template are read from source. And
 * `generateMetadata` runs with the backend unreachable, so it proves the
 * offline branch of pages that fetch — which is the branch that matters, since
 * a crawler hitting a backend hiccup still gets that page's metadata.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { TA_READY_ROUTES, isTaReady, splitLangPrefix } from "./ta-routes";

// The language the middleware would have put on the request (`x-lang`), which
// is how a `/ta/...` URL reaches `getServerLang()`. Null = an English URL.
const urlLang = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(urlLang.value ? { "x-lang": urlLang.value } : {}),
}));

const BASE = "https://vinaadi.com";
const APP = path.resolve(import.meta.dirname, "../app");
const MARKETING = path.join(APP, "(marketing)");

/** Pages that render nothing of their own, so carry no metadata. */
const NO_METADATA: Record<string, string> = {
  "/panchangam/today": "redirects to /panchangam/<today> before rendering",
};

/** Sample values for dynamic segments without generateStaticParams. */
const SAMPLE_PARAMS: Record<string, string> = {
  date: "2026-10-01",
  token: "sample-token",
};

const rootSource = readFileSync(path.join(APP, "layout.tsx"), "utf8");
const ROOT_TEMPLATE = rootSource.match(/template:\s*"([^"]+)"/)?.[1] ?? "%s";
const ROOT_DEFAULT_TITLE = rootSource.match(/default:\s*"([^"]+)"/)?.[1];

function listPages(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listPages(full);
    return entry === "page.tsx" ? [full] : [];
  });
}

/** Layout files between (marketing) and the page, outermost first. */
function layoutChain(pageFile: string): string[] {
  const chain: string[] = [];
  let dir = path.dirname(pageFile);
  while (dir.startsWith(MARKETING)) {
    const layout = path.join(dir, "layout.tsx");
    try {
      statSync(layout);
      chain.unshift(layout);
    } catch {
      /* no layout at this level */
    }
    dir = path.dirname(dir);
  }
  return chain;
}

function routeSegments(pageFile: string): string[] {
  return path
    .relative(MARKETING, path.dirname(pageFile))
    .split(path.sep)
    .filter((s) => s && !/^\(.*\)$/.test(s));
}

type PageModule = {
  metadata?: Metadata;
  generateMetadata?: (props: unknown) => Promise<Metadata> | Metadata;
  generateStaticParams?: () => Array<Record<string, string>> | Promise<Array<Record<string, string>>>;
};

async function resolveMetadata(mod: PageModule, params: Record<string, string>): Promise<Metadata | undefined> {
  if (mod.metadata) return mod.metadata;
  if (mod.generateMetadata) {
    return mod.generateMetadata({ params: Promise.resolve(params), searchParams: Promise.resolve({}) });
  }
  return undefined;
}

function canonicalOf(md: Metadata | undefined): string | undefined {
  const c = md?.alternates?.canonical;
  if (!c) return undefined;
  return (typeof c === "string" ? c : "url" in c ? String(c.url) : String(c)).replace(/\/$/, "");
}

function noindex(md: Metadata | undefined): boolean {
  const r = md?.robots;
  return typeof r === "object" && r !== null && "index" in r && r.index === false;
}

function renderTitle(md: Metadata | undefined): string | undefined {
  const t = md?.title;
  if (t == null) return undefined;
  if (typeof t === "string") return ROOT_TEMPLATE.replace("%s", t);
  if ("absolute" in t && t.absolute) return t.absolute;
  if ("default" in t && t.default) return ROOT_TEMPLATE.replace("%s", t.default);
  return undefined;
}

type Row = {
  route: string;
  pattern: RegExp;
  dynamic: boolean;
  canonical?: string;
  noindex: boolean;
  title?: string;
  description?: string;
  languages?: Record<string, string>;
};
const rows: Row[] = [];
/** The same pages, evaluated as the middleware serves them at `/ta/...`. */
const taRows: Row[] = [];

function routePattern(segments: string[]): RegExp {
  const body = segments.map((s) => (/^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("/");
  return new RegExp(`^/${body}$`);
}

function languagesOf(md: Metadata | undefined): Record<string, string> | undefined {
  const l = md?.alternates?.languages;
  return l ? (Object.fromEntries(Object.entries(l).map(([k, v]) => [k, String(v)])) as Record<string, string>) : undefined;
}

beforeAll(async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("backend unreachable in tests")));
  await collectRows(rows, null);
  await collectRows(taRows, "ta");
  urlLang.value = null;
}, 240_000);

async function collectRows(into: Row[], lang: string | null) {
  urlLang.value = lang;
  for (const file of listPages(MARKETING)) {
    const segments = routeSegments(file);
    const mod = (await import(/* @vite-ignore */ file)) as PageModule;
    let params: Record<string, string> = {};
    const dynamic = segments.filter((s) => /^\[.+\]$/.test(s)).map((s) => s.slice(1, -1));
    if (dynamic.length) {
      const fromStatic = mod.generateStaticParams ? (await mod.generateStaticParams())[0] : undefined;
      params = fromStatic ?? Object.fromEntries(dynamic.map((d) => [d, SAMPLE_PARAMS[d] ?? "sample"]));
    }
    const route = "/" + segments.map((s) => (/^\[.+\]$/.test(s) ? params[s.slice(1, -1)] : s)).join("/");

    // Merge the chain the way Next does for these keys: a level that defines
    // the key replaces it outright.
    let merged: Metadata = /canonical/.test(rootSource) ? { alternates: { canonical: BASE } } : {};
    for (const layout of layoutChain(file)) {
      const layoutMod = (await import(/* @vite-ignore */ layout)) as PageModule;
      const md = await resolveMetadata(layoutMod, params);
      merged = { ...merged, ...md };
    }
    const own = await resolveMetadata(mod, params);
    merged = { ...merged, ...own };

    into.push({
      route: route === "/" ? "/" : route.replace(/\/$/, ""),
      pattern: segments.length ? routePattern(segments) : /^\/$/,
      dynamic: dynamic.length > 0,
      canonical: canonicalOf(merged),
      noindex: noindex(merged),
      title: renderTitle(own) ?? (own?.title ? undefined : renderTitle(merged)),
      description: typeof merged.description === "string" ? merged.description : undefined,
      languages: languagesOf(merged),
    });
  }
}

describe("public page metadata", () => {
  it("found the public pages", () => {
    expect(rows.length).toBeGreaterThan(100);
  });

  it("the root layout declares no canonical — it would be inherited by every page that forgets one", () => {
    expect(rootSource).not.toMatch(/canonical/);
  });

  it("every indexable page's canonical is its own URL", () => {
    const wrong = rows
      .filter((r) => !r.noindex && !(r.route in NO_METADATA))
      .filter((r) => r.canonical !== (r.route === "/" ? BASE : BASE + r.route))
      .map((r) => `${r.route} -> ${r.canonical ?? "(none)"}`);
    expect(wrong).toEqual([]);
  });

  it("every indexable page has a title of its own, not the homepage's", () => {
    const inherited = rows
      .filter((r) => !r.noindex && !(r.route in NO_METADATA) && r.route !== "/")
      .filter((r) => !r.title || (ROOT_DEFAULT_TITLE && r.title.startsWith(ROOT_DEFAULT_TITLE)))
      .map((r) => r.route);
    expect(inherited).toEqual([]);
  });

  it("every indexable static page is in the sitemap", async () => {
    const { default: sitemap } = await import("../app/sitemap");
    const listed = new Set(sitemap().map((e) => e.url.replace(BASE, "") || "/"));
    // (English URLs only: this is about coverage; the Tamil twins are below.)
    const missing = rows
      .filter((r) => !r.noindex && !r.dynamic && !(r.route in NO_METADATA))
      .filter((r) => !listed.has(r.route))
      .map((r) => r.route);
    expect(missing).toEqual([]);
  });

  it("every sitemap URL is a real, indexable page, listed once", async () => {
    const { default: sitemap } = await import("../app/sitemap");
    // A `/ta/...` entry is the same page as its English twin, so it is checked
    // against the same route; the twin tests below check the Tamil half itself.
    const all = sitemap().map((e) => e.url.replace(BASE, "") || "/");
    const dupes = all.filter((p, i) => all.indexOf(p) !== i);
    const paths = all.map((p) => splitLangPrefix(p).path);
    expect(dupes).toEqual([]);
    const bad = paths.filter((p) => {
      const matches = rows.filter((r) => r.pattern.test(p));
      // Static routes win over a sibling [slug] catch-all, as in Next.
      const row = matches.find((r) => !r.dynamic) ?? matches[0];
      return !row || row.noindex;
    });
    expect(bad).toEqual([]);
  });

  it("no title names the brand twice (the root template already appends it)", () => {
    const doubled = rows
      .filter((r) => r.title && (r.title.match(/Vinaadi/g) ?? []).length > 1)
      .map((r) => `${r.route}: ${r.title}`);
    expect(doubled).toEqual([]);
  });
});

const TAMIL_SCRIPT = /[஀-௿]/;

/** The English and Tamil URLs of a route (`/` -> `/ta`, never `/ta/`). */
const twin = (route: string) => ({ en: route === "/" ? BASE : `${BASE}${route}`, ta: `${BASE}/ta${route === "/" ? "" : route}` });

/**
 * GRW-06 — Tamil at its own URLs. The Tamil half of every page with a twin has
 * to carry Tamil text, name itself as `/ta/...`, and be named back by its
 * English twin: Google discards an hreflang pair that is not reciprocal.
 */
describe("Tamil twins (/ta/...)", () => {
  // `/panchangam/today` renders nothing of its own (it redirects), so has no metadata.
  const ready = () => taRows.filter((r) => isTaReady(r.route) && !(r.route in NO_METADATA));

  it("finds Tamil-ready pages, and every registry pattern matches a real route", () => {
    expect(ready().length).toBeGreaterThan(50);
    const dead = TA_READY_ROUTES.filter((pattern) => {
      const re = new RegExp(`^${pattern.replace(/\*/g, "[^/]+")}$`);
      return !rows.some((r) => re.test(r.route));
    });
    expect(dead).toEqual([]);
  });

  it("every Tamil page has a Tamil title and description of its own", () => {
    const bad = ready()
      .filter((r) => !r.title || !TAMIL_SCRIPT.test(r.title) || !r.description || !TAMIL_SCRIPT.test(r.description))
      .map((r) => `${r.route}: ${r.title ?? "(no title)"}`);
    expect(bad).toEqual([]);
  });

  it("every Tamil page's canonical is its own /ta URL", () => {
    const wrong = ready()
      .filter((r) => r.canonical !== twin(r.route).ta)
      .map((r) => `${r.route} -> ${r.canonical ?? "(none)"}`);
    expect(wrong).toEqual([]);
  });

  it("hreflang is reciprocal: both languages name both URLs, plus x-default", () => {
    const bad: string[] = [];
    for (const ta of ready()) {
      const en = rows.find((r) => r.route === ta.route);
      const want = { en: twin(ta.route).en, ta: twin(ta.route).ta, "x-default": twin(ta.route).en };
      if (JSON.stringify(ta.languages) !== JSON.stringify(want)) bad.push(`${ta.route} (ta side)`);
      if (JSON.stringify(en?.languages) !== JSON.stringify(want)) bad.push(`${ta.route} (en side)`);
    }
    expect(bad).toEqual([]);
  });

  it("the English page is not the Tamil page: titles differ and the English URL keeps its own canonical", () => {
    const same = ready()
      .filter((ta) => {
        const en = rows.find((r) => r.route === ta.route);
        return en?.title === ta.title || en?.canonical === ta.canonical;
      })
      .map((r) => r.route);
    expect(same).toEqual([]);
  });

  it("pages without a twin advertise no hreflang", () => {
    const stray = rows.filter((r) => !isTaReady(r.route) && r.languages).map((r) => r.route);
    expect(stray).toEqual([]);
  });

  it("the sitemap lists both URLs of every Tamil-ready page it lists, each naming the other", async () => {
    const { default: sitemap } = await import("../app/sitemap");
    const entries = sitemap();
    const byUrl = new Map(entries.map((e) => [e.url, e]));
    const bad: string[] = [];
    for (const r of ready()) {
      // A dynamic route's sample param may not be one the sitemap lists; only
      // pages it does list are held to this.
      const { en, ta } = twin(r.route);
      if (!byUrl.has(en)) continue;
      for (const url of [en, ta]) {
        const langs = byUrl.get(url)?.alternates?.languages as Record<string, string> | undefined;
        if (langs?.ta !== ta || langs?.en !== en) bad.push(url);
      }
    }
    expect(bad).toEqual([]);
    expect(entries.filter((e) => splitLangPrefix(e.url.replace(BASE, "") || "/").lang === "ta").length).toBeGreaterThan(50);
  });
});

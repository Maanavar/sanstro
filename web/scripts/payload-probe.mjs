#!/usr/bin/env node
/**
 * F6's "check first" step, answered from the import graph instead of by grep.
 *
 * The plan attaches a precondition to each root-layout trim — "grep the 55
 * marketing client files for useQuery", "grep toast( in app/ marketing routes",
 * "is Mono used on marketing at all". Those greps ask a narrower question than
 * the one that matters. A provider moved out of the root layout breaks any
 * component that any marketing route *renders*, and marketing routes render
 * plenty of files that do not live under app/(marketing) — `components/` holds
 * both surfaces side by side. This is the same mistake the CSS side already
 * paid for: filenames cannot answer which surface uses a thing, only the import
 * graph can.
 *
 * So: walk each load context's real module tree (scripts/css-inventory.mjs
 * --emit-reach) and report, per candidate, exactly which reachable files use it
 * and from which context.
 *
 * Usage: node scripts/payload-probe.mjs [--verbose]
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERBOSE = process.argv.includes("--verbose");

const reach = JSON.parse(
  execFileSync(process.execPath, [join(WEB, "scripts/css-inventory.mjs"), "--emit-reach"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);

if (reach.unresolved?.length) {
  console.error(`refusing to report: ${reach.unresolved.length} unresolved local import(s) — the graph is incomplete`);
  for (const u of reach.unresolved) console.error("  " + u);
  process.exit(1);
}

/**
 * Each candidate is something the root layout currently gives every visitor.
 * `pattern` is what "this file needs it" looks like in source.
 */
const CANDIDATES = [
  {
    name: "react-query (QueryProvider)",
    pattern: /\b(useQuery|useMutation|useInfiniteQuery|useQueryClient|useSuspenseQuery)\b|@tanstack\/react-query/,
    note: "move QueryProvider to dashboard + login if marketing reaches none",
  },
  {
    name: "sonner (Toaster)",
    pattern: /from\s+["']sonner["']|\btoast\s*\(|\btoast\.(success|error|info|warning|promise|custom|dismiss)\b/,
    note: "move Toaster to the dashboard layout if marketing reaches none",
  },
  {
    name: "posthog",
    pattern: /posthog/i,
    note: "lazy-load after first paint regardless; this shows who calls it directly",
  },
  {
    name: "BetaSystem",
    pattern: /\bBetaSystem\b|beta-system/,
    note: "next/dynamic candidate",
  },
  {
    name: "font: JetBrains Mono (--font-mono)",
    pattern: /--font-mono|JetBrains_Mono|font-mono/,
    note: "4 root fonts ship to every visitor",
  },
  {
    name: "font: Noto Sans Tamil (--font-tamil)",
    pattern: /--font-tamil|Noto_Sans_Tamil/,
    note: "",
  },
  {
    name: "font: Fraunces (--font-display)",
    pattern: /--font-display|Fraunces/,
    note: "",
  },
  {
    name: "font: Inter (--font-body)",
    pattern: /--font-body|\bInter\b/,
    note: "",
  },
];

/** CSS counts here: a font variable is usually referenced from a stylesheet. */
const CSS_BY_CONTEXT = {
  root: ["app/globals.css"],
  marketing: ["app/globals.css", "app/marketing.css"],
  dashboard: [
    "app/globals.css",
    "app/dashboard/dashboard-globals.css",
    "app/dashboard/dashboard.css",
    "app/dashboard/dashboard-nova.css",
  ],
};

const cache = new Map();
const read = (f) => {
  if (!cache.has(f)) {
    try {
      cache.set(f, readFileSync(resolve(WEB, f), "utf8"));
    } catch {
      cache.set(f, "");
    }
  }
  return cache.get(f);
};

const CONTEXTS = ["marketing", "dashboard", "root"];

// The root layout defines all four fonts and renders all four providers, so it
// matches everything and would make every context look like a user. The
// question is who ELSE needs it.
const SELF = new Set(["app/layout.tsx"]);

console.log("Payload probe — who actually reaches what the root layout loads\n");
console.log("  Context sets are each route group's OWN module tree (root layout excluded),");
console.log("  plus the stylesheets that context loads.\n");

const results = [];
for (const c of CANDIDATES) {
  const hits = {};
  for (const ctx of CONTEXTS) {
    const files = reach.own[ctx].filter((f) => !SELF.has(f));
    const codeHits = files.filter((f) => /\.(tsx?|jsx?|mjs)$/.test(f) && c.pattern.test(read(f)));
    const cssHits = (CSS_BY_CONTEXT[ctx] ?? []).filter((f) => c.pattern.test(read(f)));
    hits[ctx] = { code: codeHits, css: cssHits };
  }
  results.push({ c, hits });

  const line = CONTEXTS.map((ctx) => {
    const n = hits[ctx].code.length + hits[ctx].css.length;
    return `${ctx} ${n === 0 ? "—" : n}`;
  }).join("   ");
  console.log(`${c.name}`);
  console.log(`    ${line}${c.note ? "     (" + c.note + ")" : ""}`);
  for (const ctx of CONTEXTS) {
    const { code, css } = hits[ctx];
    if (!code.length && !css.length) continue;
    const show = VERBOSE ? code : code.slice(0, 6);
    for (const f of show) console.log(`        [${ctx}] ${f}`);
    if (!VERBOSE && code.length > 6) console.log(`        [${ctx}] … ${code.length - 6} more`);
    for (const f of css) console.log(`        [${ctx}] ${f}  (stylesheet)`);
  }
  console.log("");
}

console.log("────────────────────────────────────────────────────────");
console.log("Safe to move off the root layout (marketing reaches zero):");
for (const { c, hits } of results) {
  const m = hits.marketing.code.length + hits.marketing.css.length;
  if (m === 0) console.log(`  ✓ ${c.name}`);
}
console.log("\nMarketing DOES reach these — moving them would break a public page:");
for (const { c, hits } of results) {
  const m = hits.marketing.code.length + hits.marketing.css.length;
  if (m > 0) console.log(`  ✗ ${c.name}  (${m} file(s))`);
}

/**
 * What the root layout is allowed to give every visitor (F6).
 *
 * QueryProvider and Toaster used to live in app/layout.tsx, so react-query and
 * sonner shipped to every marketing page that never calls either. They now live
 * in app/dashboard/layout.tsx. That move is only safe while it stays true that
 * no other load context reaches them — and nothing in the type system knows
 * that. A marketing component that starts calling `useQuery` compiles fine and
 * throws "No QueryClient set, use QueryClientProvider" at runtime, on a public
 * page, for the visitor rather than for us.
 *
 * The question is asked of the real import graph, not of directory names. That
 * distinction is the one this repo keeps paying for: `components/` holds both
 * surfaces' files side by side, so grepping app/(marketing) answers a narrower
 * question than "what does a marketing route render". F4 learned it for CSS —
 * 84 classes defined in globals.css turned out to be dashboard-rendered by
 * components not named `dashboard-*`. Same graph, same lesson, one layer up.
 *
 * There are three load contexts, not two surfaces: /login and /admin are NOT
 * under app/dashboard/, so a provider placed in the dashboard layout does not
 * reach them either.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = join(import.meta.dirname, "..");

const reach: {
  unresolved: string[];
  own: Record<"marketing" | "dashboard" | "root", string[]>;
} = JSON.parse(
  execFileSync(process.execPath, [join(WEB, "scripts/css-inventory.mjs"), "--emit-reach"], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);

const cache = new Map<string, string>();
function read(f: string): string {
  if (!cache.has(f)) {
    try {
      cache.set(f, readFileSync(join(WEB, f), "utf-8"));
    } catch {
      cache.set(f, "");
    }
  }
  return cache.get(f)!;
}

/** The root layout defines and renders everything, so it would match every
 *  pattern and make each context look like a user. The question is who else. */
const ROOT_LAYOUT = "app/layout.tsx";
const codeFiles = (ctx: "marketing" | "dashboard" | "root") =>
  reach.own[ctx].filter((f) => f !== ROOT_LAYOUT && /\.(tsx?|jsx?)$/.test(f) && !/\.test\.[tj]sx?$/.test(f));

const usersOf = (ctx: "marketing" | "dashboard" | "root", pattern: RegExp) =>
  codeFiles(ctx).filter((f) => pattern.test(read(f)));

const REACT_QUERY = /\b(useQuery|useMutation|useInfiniteQuery|useQueryClient|useSuspenseQuery)\b|@tanstack\/react-query/;
const SONNER = /from\s+["']sonner["']|\btoast\s*\(|\btoast\.(success|error|info|warning|promise|custom|dismiss)\b/;

describe("root layout payload boundary", () => {
  it("the import graph is complete (an unresolved import hides whatever it pointed at)", () => {
    expect(reach.unresolved).toEqual([]);
  });

  it("the analysis saw each context (an empty set would pass everything vacuously)", () => {
    expect(codeFiles("marketing").length).toBeGreaterThan(50);
    expect(codeFiles("dashboard").length).toBeGreaterThan(50);
  });

  for (const [name, pattern] of [
    ["react-query", REACT_QUERY],
    ["sonner", SONNER],
  ] as const) {
    it(`no marketing route reaches ${name} — its provider lives in the dashboard layout`, () => {
      const users = usersOf("marketing", pattern);
      expect(
        users,
        `${name} moved out of the root layout, so these would fail at runtime on a public page. ` +
          `Either use it from the dashboard, or put the provider back and record why.`,
      ).toEqual([]);
    });

    it(`no root-only route (/login, /admin) reaches ${name}`, () => {
      const users = usersOf("root", pattern).filter((f) => !/query-provider|queryClient|deferred-chrome/.test(f));
      expect(
        users,
        `/login and /admin are not under app/dashboard/, so they do not get the dashboard layout's provider.`,
      ).toEqual([]);
    });
  }

  it("the dashboard does reach both — otherwise the providers are in the wrong place", () => {
    expect(usersOf("dashboard", REACT_QUERY).length).toBeGreaterThan(0);
    expect(usersOf("dashboard", SONNER).length).toBeGreaterThan(0);
  });

  it("the root layout no longer renders the moved providers", () => {
    const src = read(ROOT_LAYOUT);
    expect(src).not.toMatch(/<QueryProvider>/);
    expect(src).not.toMatch(/<Toaster\b/);
  });

  it("the dashboard layout renders them", () => {
    const src = read("app/dashboard/layout.tsx");
    expect(src).toMatch(/<QueryProvider>/);
    expect(src).toMatch(/<Toaster\b/);
  });
});

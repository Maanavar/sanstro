import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * GRW-06 - no page prints structured data by hand.
 *
 * A hand-written `<script type="application/ld+json">` is how an English block
 * reaches a Tamil page: the page builds one constant and prints it whatever the
 * URL says. `<JsonLd en ta>` (lib/json-ld.tsx) picks the block by the URL's
 * language and prints nothing where a page has no Tamil one, so every page goes
 * through it. The two files below are the deliberate exceptions.
 */
const ALLOWED: Record<string, string> = {
  "lib/json-ld.tsx": "the component itself",
  "app/layout.tsx":
    "site-level Organization/WebSite blocks on every route, dashboard included; it swaps in the Tamil description itself on a /ta/ twin",
};

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["node_modules", ".next", "e2e", "tests"]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\./.test(name)) out.push(full);
  }
  return out;
}

// A comment that mentions the MIME type (security-headers.ts does) is not a printer.
const withoutComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const printers = ["app", "components", "lib"]
  .flatMap((d) => sourceFiles(path.join(ROOT, d)))
  .filter((f) => /type=["']application\/ld\+json["']/.test(withoutComments(readFileSync(f, "utf8"))))
  .map((f) => path.relative(ROOT, f).split(path.sep).join("/"));

describe("structured data goes through <JsonLd>", () => {
  it("has no page that prints an ld+json script itself", () => {
    expect(printers.filter((f) => !(f in ALLOWED))).toEqual([]);
  });

  it("finds the allowed printers (the scan is alive) and lists no stale exception", () => {
    expect(printers.length).toBeGreaterThan(0);
    expect(Object.keys(ALLOWED).filter((f) => !printers.includes(f))).toEqual([]);
  });
});

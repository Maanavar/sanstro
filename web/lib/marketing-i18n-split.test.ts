/**
 * F7 — the marketing i18n split only pays while BOTH halves hold.
 *
 * All 63 exports of `lib/marketing-i18n.ts` used to sit in one module, and
 * webpack put that module in a commons chunk which 117 of 121 marketing routes
 * downloaded eagerly. `/learn/what-is-chandrashtama`, a 55-line page, shipped
 * the Thirunallar temple's full English description. The fix was one module per
 * page behind a re-export barrel.
 *
 * WHAT MAKES THIS WORTH A TEST: neither half works alone, and this was measured
 * rather than reasoned about, because the reasoning would have got it wrong.
 *
 *   - `sideEffects` in package.json, alone   -> 117 routes. No change at all.
 *   - the split, alone                       -> 117 routes. Without the flag,
 *     webpack must assume importing any module has side effects, so an unused
 *     `export *` cannot be dropped.
 *   - both                                   -> 1 route.
 *
 * So deleting one line of package.json silently reverts a 477 KB-per-route win
 * and leaves behind a tree that merely looks better organised. Nothing in tsc,
 * eslint or `next build` notices: the build succeeds, the pages render, and the
 * only symptom is a number in a report nobody runs. That is the exact shape of
 * the regression this repo keeps paying for, so it gets a cheap unit test rather
 * than a note in a plan document.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = join(import.meta.dirname, "..");
const DOMAIN_DIR = join(WEB, "lib/marketing-i18n");

const barrel = readFileSync(join(WEB, "lib/marketing-i18n.ts"), "utf-8");
const domainFiles = readdirSync(DOMAIN_DIR).filter((f) => f.endsWith(".ts"));

describe("marketing-i18n split", () => {
  it("package.json still declares sideEffects — without it the split pays nothing", () => {
    const pkg = JSON.parse(readFileSync(join(WEB, "package.json"), "utf-8")) as {
      sideEffects?: false | string[];
    };
    expect(
      pkg.sideEffects,
      "removing `sideEffects` puts all 63 i18n domains back on all 117 marketing routes, " +
        "with no build error and no visible symptom. Keep it, and keep `*.css` in it — " +
        "a bare `false` would let webpack drop stylesheet imports, which are exactly the " +
        "kind of import-for-side-effect the flag is warning about.",
    ).toBeDefined();
    expect(pkg.sideEffects).toContain("*.css");
  });

  it("the barrel declares no content of its own — a new export there ships everywhere", () => {
    // The barrel is reached by every marketing page (it exports `mt`), so anything
    // declared IN it is unconditionally on every route. Content belongs in a
    // domain module; only re-exports and the `mt` helper belong here.
    const declared = [...barrel.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
    expect(
      declared,
      "declare this in lib/marketing-i18n/<page>.ts and re-export it, or it lands in " +
        "the shared chunk for all 121 marketing routes",
    ).toEqual([]);
  });

  it("no domain module imports the barrel — that would drag every other domain back", () => {
    // A domain file reaching for `mt` or another domain via "@/lib/marketing-i18n"
    // re-creates the single-chunk problem from the other direction: the barrel
    // pulls in all 45 domains, so one such import re-couples them all.
    const offenders = domainFiles.filter((f) => {
      const text = readFileSync(join(DOMAIN_DIR, f), "utf-8");
      return /from\s+["'](?:@\/lib\/marketing-i18n|\.\.\/marketing-i18n)["']/.test(text);
    });
    expect(offenders, "import { s } from './_s' instead").toEqual([]);
  });

  it("every domain module is re-exported by the barrel", () => {
    // A module the barrel forgot is unreachable through the path all 63 call
    // sites use, and would fail as a missing export at build time — but only if
    // something imports it. An orphan domain file would just sit there.
    const reExported = new Set(
      [...barrel.matchAll(/export \* from "\.\/marketing-i18n\/([\w-]+)"/g)].map((m) => `${m[1]}.ts`),
    );
    const shouldBe = domainFiles.filter((f) => f !== "_s.ts");
    expect(shouldBe.filter((f) => !reExported.has(f))).toEqual([]);
  });
});

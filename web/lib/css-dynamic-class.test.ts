/**
 * Classes whose names the source builds, which no usage scan can see.
 *
 *     cx("as-rasi", `as-rasi--${item.tone}`, `as-rasi--${size}`)
 *
 * There is no literal "as-rasi--fire" anywhere in the tree, so every tool that
 * decides "is this class used?" by searching source answers *no* — correctly,
 * and uselessly. F4 step 5 pruned on exactly that answer and deleted 13 live
 * rules: the element tones and sizes for the rasi and nakshatra badges, and the
 * four positional marks on `<AstroTopic>`. The badges lost their colour and
 * collapsed to intrinsic size; the marks lost their offsets and stacked in one
 * corner. It shipped in 623ad59, whose message states the opposite — "the 5
 * live .as-* families … are untouched" — because the safety net it describes
 * ("refuses any grouped selector in which a single class is still referenced")
 * guards grouped selectors, and every one of these was a standalone rule for a
 * single modifier.
 *
 * No test saw it. tsc cannot: CSS class names are strings. The reachability
 * guard in css-surface-boundary.test.ts cannot: it asks whether a *used* class
 * is defined somewhere loadable, and these had stopped being "used" by its own
 * measure the moment they were interpolated. It was found by diffing computed
 * styles on a rendered page against the pre-split build.
 *
 * So this asserts the property the prune needed and did not have: a class only
 * an interpolation can produce is still a live class.
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// @ts-expect-error -- plain .mjs helper shared with the scripts, no types
import { stripComments } from "../scripts/lib/strip-comments.mjs";

const WEB = join(import.meta.dirname, "..");

const audit: {
  prefixes: Record<string, string[]>;
  byPrefix: Record<string, string[]>;
  atRisk: string[];
} = JSON.parse(
  execFileSync(process.execPath, [join(WEB, "scripts/css-dynamic-class-audit.mjs"), "--json"], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);

/**
 * The exact rules 623ad59 deleted, restored in marketing.css. Listed by name
 * rather than by count so the test says which one went missing, and so it keeps
 * failing if someone deletes them again for the same reason.
 */
const RESTORED = [
  "as-rasi--sm", "as-rasi--md", "as-rasi--lg",
  "as-rasi--fire", "as-rasi--earth", "as-rasi--air", "as-rasi--water",
  "as-nak--sm", "as-nak--lg",
  "as-topic__mark--0", "as-topic__mark--1", "as-topic__mark--2", "as-topic__mark--3",
];

/**
 * Families that exist only as interpolated names. A prune that empties one of
 * these has removed a live modifier set — which is precisely what happened to
 * the `as-` entries below. Deliberately not a count: a family that legitimately
 * loses one modifier still passes, while one that is wiped out fails.
 */
const MUST_STAY_POPULATED = [
  "as-rasi--",
  "as-nak--",
  "as-topic__mark--",
  "button--",
  "chip--",
  "metric--",
  "ui-btn--",
  "ui-chip--",
];

describe("CSS classes built by string interpolation", () => {
  it("restores every rule the F4 prune deleted while it was live", () => {
    const missing = RESTORED.filter((c) => !audit.atRisk.includes(c));
    expect(missing, `these are rendered via a template literal and must stay defined: ${missing.join(", ")}`).toEqual([]);
  });

  for (const prefix of MUST_STAY_POPULATED) {
    it(`\`${prefix}\${…}\` still resolves to at least one defined class`, () => {
      expect(audit.byPrefix[prefix], `no source file interpolates "${prefix}" any more — update this list if that is intended`).toBeDefined();
      expect(audit.byPrefix[prefix] ?? []).not.toEqual([]);
    });
  }

  it("the audit actually found interpolations (an empty scan would pass everything)", () => {
    expect(Object.keys(audit.prefixes).length).toBeGreaterThan(20);
    expect(audit.atRisk.length).toBeGreaterThan(50);
  });
});

/**
 * The failure above is a guard reporting too little. This one is the opposite,
 * and it is what made the audit useless for the job it exists to protect.
 *
 * The audit read comments as code. `scripts/css-inventory.mjs:413` documents its
 * dynamic-class regex with the example `cl-${x}`, so the audit derived a bare
 * `cl-` prefix and declared all ~400 `.cl-*` classes "invisible to a usage scan,
 * a prune must not delete these" — the whole marketing namespace, which is
 * exactly the set F4 step 5 deliberately left for a later prune. It could not
 * distinguish a live interpolated `.cl-*` rule from a dead one, so before any
 * `.cl-*` prune the audit's answer was "all of them are live", which is not an
 * answer. 548 at-risk classes became 78 once comments and tooling were excluded.
 *
 * Over-reporting reads as the safe direction and is not: this repo's record (F10)
 * is that a guard which cries wolf earns an allowlist entry rather than a fix.
 */
describe("the audit does not invent prefixes out of prose", () => {
  it("blanks a commented interpolation and keeps a real one", () => {
    const src = [
      "// Dynamically composed class names — `cl-${x}` — defeat the scan above.",
      "/* `legacy-${y}` was removed in 2026-06. */",
      "const real = `as-rasi--${tone}`;",
    ].join("\n");
    const out: string = stripComments(src);
    expect(out).not.toContain("cl-${");
    expect(out).not.toContain("legacy-${");
    expect(out).toContain("as-rasi--${");
    // Length preserved, so any line/offset reported off the stripped text still
    // points at the right place in the original file.
    expect(out).toHaveLength(src.length);
  });

  it("reads no interpolation out of an app-source comment", () => {
    // The one case in the tree today, and so the only assertion that can prove
    // the audit still *calls* stripComments rather than merely shipping it:
    // lib/i18n.ts names `retro_event_${…}` in prose, and only the retrospective
    // panel actually builds it. Excluding scripts/ and e2e/ does not cover this
    // — lib/ is app source and is meant to be scanned.
    expect(audit.prefixes["retro_event_"]).toEqual(["components/dashboard-retrospective-panel.tsx"]);
  });

  it("attributes no prefix to a script, spec or test file", () => {
    const offenders = Object.entries(audit.prefixes)
      .map(([prefix, files]) => [prefix, files.filter((f) => /^(scripts|e2e|tests)\//.test(f))] as const)
      .filter(([, files]) => files.length > 0);

    expect(
      offenders.map(([p, f]) => `${p}\${…} <- ${f.join(", ")}`),
      "only the application renders a class name; tooling and specs merely mention one",
    ).toEqual([]);
  });

  it("does not protect a whole namespace off one phantom prefix", () => {
    // `cl-` is the specific regression: it exists nowhere in app source as an
    // interpolation stem, only in that comment. Its three genuine descendants
    // (`cl-score-bar--`, `cl-score-num--`, `cl-num-reading__relation--`) are
    // asserted present so this cannot pass by the audit finding nothing at all.
    expect(Object.keys(audit.prefixes)).not.toContain("cl-");
    for (const real of ["cl-score-bar--", "cl-score-num--", "cl-num-reading__relation--"]) {
      expect(audit.byPrefix[real] ?? [], `${real}\${…} is built by a marketing page`).not.toEqual([]);
    }
  });
});

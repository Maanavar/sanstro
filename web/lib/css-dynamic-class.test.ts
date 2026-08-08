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
  "alert-banner--",
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

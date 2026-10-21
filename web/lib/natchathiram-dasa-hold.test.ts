/**
 * FSA-03 hold: nakshatra visual profiles stay out of search until their dasa
 * timings come from the engine (owner ruling 2026-10-21).
 *
 * Evaluates the real `generateMetadata` of each page on both language twins,
 * not a grep for "noindex" — the robots value is added by a wrapper around
 * `withTamilTwin`, and the Tamil twin is a separate branch of that helper.
 *
 * BLIND SPOT: this proves the pages ask not to be indexed. It says nothing
 * about whether their timings are right — that needs the regeneration this
 * hold is waiting for, gated by its own arithmetic check.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";
import { NAKSHATRA_LIST } from "@vinaadi/shared/constants";
import { DASA_TIMING_HOLD, withDasaTimingHold } from "./natchathiram-dasa-hold";

const urlLang = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(urlLang.value ? { "x-lang": urlLang.value } : {}),
}));

const NATCHATHIRAM = path.resolve(import.meta.dirname, "../app/(marketing)/natchathiram");
const VISUAL_SLUGS = readdirSync(NATCHATHIRAM, { withFileTypes: true })
  .filter((d) => d.isDirectory() && readdirSync(path.join(NATCHATHIRAM, d.name)).includes("visual"))
  .map((d) => d.name)
  .sort();

describe("FSA-03 dasa-timing hold", () => {
  it("finds all 27 visual profiles (guard the guard)", () => {
    expect(VISUAL_SLUGS).toHaveLength(27);
    expect(VISUAL_SLUGS).toEqual(NAKSHATRA_LIST.map((n) => n.slug).sort());
  });

  it.each(VISUAL_SLUGS)("%s/visual is noindex on both language twins", async (slug) => {
    const page = (await import(`../app/(marketing)/natchathiram/${slug}/visual/page.tsx`)) as {
      generateMetadata: () => Promise<Metadata>;
    };
    for (const lang of [null, "ta"]) {
      urlLang.value = lang;
      const meta = await page.generateMetadata();
      expect(DASA_TIMING_HOLD.has(slug)).toBe(true);
      expect(meta.robots, `${slug} (${lang ?? "en"})`).toEqual({ index: false, follow: true });
    }
    urlLang.value = null;
  });

  it("leaves a page that is not held untouched", () => {
    const meta: Metadata = { title: "x" };
    expect(withDasaTimingHold(meta, "not-a-nakshatra")).toBe(meta);
  });

  it("keeps held profiles out of the sitemap", async () => {
    const { default: sitemap } = await import("../app/sitemap");
    const visual = sitemap().filter((e) => /\/natchathiram\/[^/]+\/visual$/.test(e.url));
    expect(visual).toEqual([]);
  });
});

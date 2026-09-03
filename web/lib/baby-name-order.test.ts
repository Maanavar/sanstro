/**
 * The list ORDER, and how it is presented.
 *
 * A parent read the flat, numbered result list twice and twice asked the same
 * question: "why is a 59 ranked #1 and an 85 ranked #3?". The ordering was
 * correct both times — doctrine D2, the akshara decides who is eligible and
 * the number only orders within that — but a single column of `#1..#6` beside
 * a column of `59 85 83 37 31` asserts one ranking by merit, and no paragraph
 * above a numbered list survives the list.
 *
 * The fix was structural: group by letter rule, drop the cross-group position
 * number. These tests hold the two properties that makes correct — the groups
 * are in D2 order, and the server's within-group order is never re-sorted.
 */
import { describe, expect, it } from "vitest";

import type { AksharaRelation } from "@vinaadi/shared/api/numerology";

import {
  GROUP_ADVICE,
  GROUP_HEADING,
  RELATION_ORDER,
  groupByRelation,
} from "./baby-name-copy";

type Row = { name: string; relation: AksharaRelation; fit: number };

/** The exact six rows from the reported screenshot. */
const REPORTED: Row[] = [
  { name: "ஜானகி", relation: "on_paadham", fit: 59 },
  { name: "ஜாஸ்மின்", relation: "on_paadham", fit: 59 },
  { name: "aadhini", relation: "other_paadham", fit: 85 },
  { name: "aadhinii", relation: "other_paadham", fit: 83 },
  { name: "aadhinii senthilkumar", relation: "other_paadham", fit: 37 },
  { name: "aadhini senthilkumar", relation: "other_paadham", fit: 31 },
];

describe("baby-name list grouping", () => {
  it("splits the reported list into the two groups that explain it", () => {
    const groups = groupByRelation(REPORTED);
    expect(groups.map((g) => g.relation)).toEqual(["on_paadham", "other_paadham"]);
    expect(groups[0].items.map((i) => i.fit)).toEqual([59, 59]);
    expect(groups[1].items.map((i) => i.fit)).toEqual([85, 83, 37, 31]);
  });

  it("orders groups by doctrine D2, most on-target first", () => {
    expect(RELATION_ORDER).toEqual([
      "on_paadham",
      "same_natchathiram",
      "same_rasi",
      "other_paadham",
      "no_paadham",
    ]);
    // Shuffled input must still come back in D2 order — the grouping decides
    // the order of groups, never the arrival order of the candidates.
    const groups = groupByRelation([...REPORTED].reverse());
    expect(groups.map((g) => g.relation)).toEqual(["on_paadham", "other_paadham"]);
  });

  it("never re-sorts inside a group — the server's order is authoritative", () => {
    // `_sort_key` in numerology_naming_service.py already ordered these by
    // chart fit within the tier. Re-sorting here would be a second, drifting
    // copy of the ranking rule.
    const scrambled: Row[] = [
      { name: "low", relation: "other_paadham", fit: 31 },
      { name: "high", relation: "other_paadham", fit: 85 },
    ];
    expect(groupByRelation(scrambled)[0].items.map((i) => i.name)).toEqual(["low", "high"]);
  });

  it("drops empty groups so a strict search renders exactly one heading", () => {
    const strict = REPORTED.filter((r) => r.relation === "on_paadham");
    const groups = groupByRelation(strict);
    expect(groups).toHaveLength(1);
    expect(groups[0].relation).toBe("on_paadham");
  });

  it("gives every relation a heading and a line of advice, in both languages", () => {
    // A group with a heading but no advice is a label; the advice is what
    // makes the ordering legible ("take the ceremony name from here").
    for (const relation of RELATION_ORDER) {
      expect(GROUP_HEADING[relation]?.en?.length).toBeGreaterThan(0);
      expect(GROUP_HEADING[relation]?.ta?.length).toBeGreaterThan(0);
      expect(GROUP_ADVICE[relation]?.en?.length).toBeGreaterThan(0);
      expect(GROUP_ADVICE[relation]?.ta?.length).toBeGreaterThan(0);
    }
  });

  it("never states a position across groups", () => {
    // The regression itself: no heading or advice string may imply a single
    // merit ranking, because that is the reading that made 59-above-85 look
    // like a bug.
    for (const relation of RELATION_ORDER) {
      for (const text of [GROUP_HEADING[relation].en, GROUP_ADVICE[relation].en]) {
        expect(text).not.toMatch(/\bbest\b/i);
        expect(text).not.toMatch(/#\d/);
        expect(text).not.toMatch(/\branked?\b/i);
      }
    }
  });
});

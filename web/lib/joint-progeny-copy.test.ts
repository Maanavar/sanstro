import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { JointProgeny, ProgenyFactor, ProgenyReading, ProgenyTimingRole, ProgenyWindow } from "@vinaadi/shared";
import {
  JOINT_PROGENY_INTRO,
  PROGENY_GROUPS,
  progenyAlsoCounted,
  progenyBearing,
  progenyD7Note,
  progenyGroup,
  progenyGroupLabel,
  progenyJointLine,
  progenyLine,
  progenyNinthNotApplied,
  progenyTimingEmpty,
  progenyTimingIntro,
  progenyWindowLine,
} from "./joint-progeny-copy";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";

const GOLDEN = path.resolve(__dirname, "../../tests/golden/joint_progeny/joint_progeny_copy.json");
const LANGS = ["en", "ta"] as const;

const f = (o: Partial<ProgenyFactor>): ProgenyFactor => ({
  kind: "OCCUPANT", reference: "LAGNA", bhava: 5, graha: "SATURN", rasi: 5, house: 5, nature: "MALEFIC",
  condition: null, dignity: "NEUTRAL", combust: false, lordship: [], ownHouse: false, via: "IN",
  target: "HOUSE", bearing: "CHALLENGING", placementId: "D1.SATURN", alsoCountedIn: [],
  rule: "GROUP_D_RULINGS_2026_11_11", tier: "engine_inference", ...o,
});
const reading = (ninth: ProgenyReading["ninth"], o: Partial<ProgenyReading> = {}): ProgenyReading => ({
  ninth, fifthFromLagna: 5, fifthFromMoon: 9, fifthFromJupiter: 3, ninthFromLagna: ninth === "NOT_APPLIED" ? null : 9,
  factors: [], d7Note: null, timingLords: [], tier: "engine_inference", ...o,
});
const couple = (o: Partial<JointProgeny> = {}): JointProgeny => ({
  personA: reading("CHILDREN"), personB: reading("CONTEXT"), joint: [], windows: [], horizonYears: 5,
  horizonStart: "2026-11-11", horizonEnd: "2031-11-11", timingNote: null, tier: "engine_inference", ...o,
});

/** Every shape the engine emits, with the qualifiers varied across cases. */
function goldenFactors(): ProgenyFactor[] {
  const shapes: Partial<ProgenyFactor>[] = [];
  for (const [reference, bhava] of [["LAGNA", 5], ["JUPITER", 5], ["MOON", 5], ["LAGNA", 9]] as const) {
    shapes.push({ kind: "OCCUPANT", reference, bhava, target: "HOUSE", via: "IN" });
    shapes.push({ kind: "LORD", reference, bhava, target: "LORD", via: "IN" });
  }
  shapes.push({ kind: "KARAKA", target: "KARAKA", via: "IN" });
  for (const kind of ["INFLUENCE", "BENEFIC_ASPECT"] as const) {
    shapes.push({ kind, target: "HOUSE", via: "ASPECT" }, { kind, target: "LORD", via: "CONJUNCT" }, { kind, target: "LORD", via: "ASPECT" });
  }
  shapes.push({ kind: "INFLUENCE", target: "KARAKA", via: "CONJUNCT" });
  for (const kind of ["D7_LORD", "D7_OCCUPANT", "D7_KARAKA"] as const) {
    shapes.push({ kind, reference: "D7_LAGNA", target: kind === "D7_LORD" ? "LORD" : kind === "D7_KARAKA" ? "KARAKA" : "HOUSE", via: "IN" });
  }
  const grahas = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"];
  const natures: [ProgenyFactor["nature"], ProgenyFactor["condition"]][] = [
    ["MALEFIC", null], ["BENEFIC", null], ["MALEFIC", "PAKSHA"], ["BENEFIC", "PAKSHA"], ["MALEFIC", "ASSOCIATION"], ["BENEFIC", "ASSOCIATION"],
  ];
  const dignities: ProgenyFactor["dignity"][] = ["NEUTRAL", "EXALTED", "OWN", "DEBILITATED"];
  const bearings: ProgenyFactor["bearing"][] = ["CHALLENGING", "SUPPORTIVE", "CONTEXT"];
  const links = [[], ["PUTRA_SARPA_DOSHAM"], [], ["SANTHANA_THADAI"], [], ["PUTRA_SARPA_DOSHAM", "SANTHANA_THADAI"]];
  const out: ProgenyFactor[] = [];
  let i = 0;
  for (const shape of shapes) {
    for (let v = 0; v < 3; v += 1, i += 1) {
      const [nature, condition] = natures[i % natures.length];
      const graha = grahas[(i * 5) % grahas.length];
      out.push(f({
        ...shape, graha, rasi: (i * 7) % 12 + 1, house: (i * 5) % 12 + 1, nature, condition,
        dignity: dignities[i % 4], combust: i % 5 === 0, ownHouse: i % 7 === 0, bearing: bearings[i % 3],
        alsoCountedIn: links[i % links.length], placementId: `${shape.kind?.startsWith("D7") ? "D7" : "D1"}.${graha}`,
      }));
    }
  }
  return out;
}

const ROLES: ProgenyTimingRole[] = ["FIFTH_LORD", "JUPITER", "FIFTH_OCCUPANT", "FIFTH_FROM_JUPITER_LORD", "FIFTH_LORD_DISPOSITOR", "NINTH_LORD", "NINTH_OCCUPANT"];
const WINDOWS: ProgenyWindow[] = [
  { start: "2027-01-03", end: "2027-08-19", lordA: "JUPITER", mahaA: "SATURN", rolesA: ["JUPITER", "FIFTH_FROM_JUPITER_LORD"], lordB: "VENUS", mahaB: "RAHU", rolesB: ["FIFTH_LORD"] },
  { start: "2028-05-01", end: "2029-02-11", lordA: "MOON", mahaA: "MERCURY", rolesA: ["NINTH_LORD", "NINTH_OCCUPANT"], lordB: "KETU", mahaB: "JUPITER", rolesB: ["FIFTH_OCCUPANT", "FIFTH_LORD_DISPOSITOR"] },
  { start: "2030-10-20", end: "2031-01-02", lordA: "SUN", mahaA: "KETU", rolesA: ROLES, lordB: "MARS", mahaB: "SUN", rolesB: ["JUPITER"] },
];

function buildGolden() {
  const cases = goldenFactors().flatMap((factor) => LANGS.map((lang) => ({
    factor, lang, line: progenyLine(factor, lang), bearing: progenyBearing(factor, lang),
    also: progenyAlsoCounted(factor, lang), group: progenyGroup(factor),
  })));
  const joint = (["FIFTH_HOUSE", "FIFTH_LORD", "JUPITER"] as const).flatMap((key) =>
    (["BOTH", "ONE", "NEITHER"] as const).flatMap((pattern) => LANGS.map((lang) => ({ key, pattern, lang, line: progenyJointLine(key, pattern, lang) }))));
  const windows = WINDOWS.flatMap((window) => LANGS.map((lang) => ({ window, lang, line: progenyWindowLine(window, "Person A", "Person B", lang) })));
  const labels = PROGENY_GROUPS.flatMap((group) => (["CHILDREN", "CONTEXT"] as const).flatMap((ninth) =>
    LANGS.map((lang) => ({ group, ninth, lang, label: progenyGroupLabel(group, reading(ninth), lang) }))));
  const notes = LANGS.flatMap((lang) => [
    { kind: "ninth", value: "NOT_APPLIED", lang, text: progenyNinthNotApplied(reading("NOT_APPLIED"), lang) },
    ...(["D7_LAGNA_UNRELIABLE", "D7_UNAVAILABLE"] as const).map((d7) => ({ kind: "d7", value: d7, lang, text: progenyD7Note(reading("CHILDREN", { d7Note: d7 }), lang) })),
    { kind: "intro", value: "5", lang, text: progenyTimingIntro(couple(), lang) },
    { kind: "empty", value: "NONE", lang, text: progenyTimingEmpty(couple(), lang) },
    { kind: "empty", value: "AGE_OUTSIDE_RANGE", lang, text: progenyTimingEmpty(couple({ timingNote: "AGE_OUTSIDE_RANGE" }), lang) },
  ]);
  return {
    _note: "Generated from web/lib/joint-progeny-copy.ts (WRITE_GOLDEN=1 pnpm vitest run lib/joint-progeny-copy.test.ts). web/lib/joint-progeny-copy.test.ts and tests/test_faa32_joint_progeny.py (the PDF copy) must both reproduce every line. Regenerate only when the web copy changes on purpose.",
    cases, joint, windows, labels, notes,
  };
}

describe("FAA-32 joint progeny copy", () => {
  it("renders names through the display boundary in both languages", () => {
    for (const lang of LANGS) {
      const line = progenyLine(f({}), lang);
      expect(line).toContain(rasiDisplayName(5, lang));
      expect(line).toContain(tPlanetLord("SATURN", lang));
      expect(line).not.toContain("SATURN");
      const w = progenyWindowLine(WINDOWS[0], "A", "B", lang);
      expect(w).toContain(tPlanetLord("JUPITER", lang));
      expect(w).not.toMatch(/JUPITER|SATURN|VENUS|RAHU/);
    }
  });

  it("groups by reference, with the karaka and the 9th apart", () => {
    expect(progenyGroup(f({}))).toBe("LAGNA");
    expect(progenyGroup(f({ kind: "INFLUENCE", target: "KARAKA", via: "CONJUNCT" }))).toBe("KARAKA");
    expect(progenyGroup(f({ bhava: 9 }))).toBe("NINTH");
    expect(progenyGroup(f({ kind: "D7_KARAKA", reference: "D7_LAGNA", target: "KARAKA" }))).toBe("D7");
    expect(progenyGroupLabel("NINTH", reading("CONTEXT"), "en")).toMatch(/context only/);
    expect(progenyNinthNotApplied(reading("CHILDREN"), "en")).toBe("");
    expect(progenyNinthNotApplied(reading("NOT_APPLIED"), "en")).toMatch(/No gender is stated/);
  });

  it("marks lines but never sums them", () => {
    expect(progenyBearing(f({ bearing: "CONTEXT" }), "en")).toBe("");
    expect(JOINT_PROGENY_INTRO.en).toMatch(/not added up/);
  });

  it("reproduces the golden file the PDF copy is checked against", () => {
    const built = buildGolden();
    if (process.env.WRITE_GOLDEN === "1") writeFileSync(GOLDEN, `${JSON.stringify(built, null, 1)}\n`, "utf8");
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    expect(golden.cases.length).toBeGreaterThan(100);
    expect(golden).toEqual(JSON.parse(JSON.stringify(built)));
  });

  it("never denies, predicts or grades", () => {
    const g = buildGolden();
    const all = [
      ...g.cases.flatMap((c) => [c.line, c.also, c.bearing]), ...g.joint.map((c) => c.line), ...g.windows.map((c) => c.line),
      ...g.labels.map((c) => c.label), ...g.notes.map((c) => c.text), JOINT_PROGENY_INTRO.en, JOINT_PROGENY_INTRO.ta,
    ].join(" ").toLowerCase();
    for (const banned of [
      "cannot have", "can't have", "will not have", "no children", "childless", "barren", "infertil", "probability",
      "chance of", "likely", "denial", "widow", "death", "lifespan", "maraka",
      "குழந்தை பிறக்காது", "குழந்தைப்பேறு இல்லை", "குழந்தை இல்லை", "சந்ததி இல்லை", "பாக்கியம் இல்லை", "மலட்டு", "மரண", "ஆயுள்",
    ]) {
      expect(all).not.toContain(banned);
    }
  });
});

import type { ChartCalculateResponseData } from "./types";

export const D1_RASI_NAMES = [
  "",
  "Mesham",
  "Rishabam",
  "Mithunam",
  "Kadagam",
  "Simmam",
  "Kanni",
  "Thulam",
  "Viruchigam",
  "Dhanusu",
  "Magaram",
  "Kumbam",
  "Meenam",
];

/**
 * The same twelve rasis in Tamil script.
 *
 * D1_RASI_NAMES above is Tamil transliterated into Latin, which is the right
 * label in English mode and the wrong one in Tamil mode — a Tamil reader was
 * being shown "Viruchigam" where the almanac says விருச்சிகம். The table was
 * already hand-copied in two files (`chart-generate-inline-panel`, the
 * marketing `JadhagamTool`); it lives here so the grids can read the reader's
 * language without a third copy appearing.
 */
export const D1_RASI_NAMES_TA = [
  "",
  "மேஷம்",
  "ரிஷபம்",
  "மிதுனம்",
  "கடகம்",
  "சிம்மம்",
  "கன்னி",
  "துலாம்",
  "விருச்சிகம்",
  "தனுசு",
  "மகரம்",
  "கும்பம்",
  "மீனம்",
];

/** Rasi label in the reader's language. */
export function rasiLabel(rasi: number, lang: "ta" | "en"): string {
  const table = lang === "ta" ? D1_RASI_NAMES_TA : D1_RASI_NAMES;
  return table[rasi] ?? `Rasi ${rasi}`;
}

// Classical, fixed rasi→ruling-planet mapping (never changes per-chart, so it's
// safe to hardcode client-side — same tier of fact as GRAHA_ABBR/D1_RASI_NAMES
// above). Keyed the same way DASHA_COLORS/tPlanetLord are (SUN/MOON/MARS/...).
export const RASI_LORDS: Record<number, string> = {
  1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
  7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
};

// ── Dignity (Nilai) doctrine ─────────────────────────────────────────────────
//
// THE TABLES LIVE HERE RATHER THAN IN A DASHBOARD FILE, and the reason is the
// [M]/[D] split. They were duplicated between
// `components/dashboard-chart-explanation-data.ts` and the public
// `app/tools/jadhagam-generator/JadhagamTool.tsx`. Pointing the marketing tool at
// the dashboard module would have fixed the duplication and created a worse
// problem: that file also holds `HOUSE_MEANING` and `SECTION_META`, several KB of
// bilingual dashboard prose, which would then ship on an SEO-indexed page.
//
// These are pure doctrine — fixed, chart-independent, no copy — so `lib/` is the
// honest home. `chart-utils` was already imported by both surfaces.
//
// NATURAL_ENEMIES HAD ALREADY DRIFTED. `JadhagamTool`'s copy omitted RAHU/KETU as
// enemies for SUN, MARS, JUPITER, VENUS and KETU. The values below are the
// dashboard's, which match the backend's `chart_strength._NATURAL_ENEMIES`
// exactly. The drift was LATENT, not live: its only consumer, `getNilai`, looks up
// a SIGN LORD, and a sign lord is never Rahu or Ketu, so those five rows were
// never reached. That is the argument for consolidating rather than a reason to
// relax — the copy was already wrong, and only an accident of the caller kept it
// from showing.
//
// It drifted a SECOND time, the same latent way. `20a27af` resolved the
// Venus-node contradiction in `chart_strength.py` — Venus and the nodes are
// mutually friendly — and this copy kept the old rows, listing Rahu and Ketu as
// Venus's enemies while its own RAHU and KETU rows called Venus a friend. Again
// unreachable, because `getNilai` looks up a sign lord; again caught only by
// `lib/doctrine-parity.test.ts`, which had been red since that commit. Both
// Venus rows below are now the backend's.
export const EXALTATION_RASI: Record<string, number> = {
  SUN: 1, MOON: 2, MARS: 10, MERCURY: 6, JUPITER: 4, VENUS: 12, SATURN: 7,
};

export const DEBILITATION_RASI: Record<string, number> = {
  SUN: 7, MOON: 8, MARS: 4, MERCURY: 12, JUPITER: 10, VENUS: 6, SATURN: 1,
};

export const MOOLATRIKONA_ZONE: Record<string, { rasi: number; start: number; end: number }> = {
  SUN: { rasi: 5, start: 0, end: 20 },
  MOON: { rasi: 2, start: 4, end: 30 },
  MARS: { rasi: 1, start: 0, end: 12 },
  MERCURY: { rasi: 6, start: 16, end: 20 },
  JUPITER: { rasi: 9, start: 0, end: 10 },
  VENUS: { rasi: 7, start: 0, end: 15 },
  SATURN: { rasi: 11, start: 0, end: 20 },
};

// RAHU/KETU own no sign. Present as empty arrays rather than absent so a caller
// doing `OWN_SIGN_RASI[graha].includes(...)` cannot throw on the two grahas most
// likely to be passed in by accident.
export const OWN_SIGN_RASI: Record<string, number[]> = {
  SUN: [5], MOON: [4], MARS: [1, 8], MERCURY: [3, 6],
  JUPITER: [9, 12], VENUS: [2, 7], SATURN: [10, 11],
  RAHU: [], KETU: [],
};

export const NATURAL_FRIENDS: Record<string, string[]> = {
  SUN: ["MOON", "MARS", "JUPITER"],
  MOON: ["SUN", "MERCURY"],
  MARS: ["SUN", "MOON", "JUPITER"],
  MERCURY: ["SUN", "VENUS"],
  JUPITER: ["SUN", "MOON", "MARS"],
  VENUS: ["MERCURY", "SATURN", "RAHU", "KETU"],
  SATURN: ["MERCURY", "VENUS"],
  RAHU: ["VENUS", "SATURN"],
  KETU: ["MARS", "VENUS"],
};

export const NATURAL_ENEMIES: Record<string, string[]> = {
  SUN: ["VENUS", "SATURN", "RAHU", "KETU"],
  MOON: ["RAHU", "KETU"],
  MARS: ["MERCURY", "RAHU"],
  MERCURY: ["MOON"],
  JUPITER: ["MERCURY", "VENUS", "RAHU", "KETU"],
  VENUS: ["SUN", "MOON"],
  SATURN: ["SUN", "MOON", "MARS"],
  RAHU: ["SUN", "MOON", "MARS", "JUPITER"],
  KETU: ["SUN", "MOON", "JUPITER", "RAHU"],
};

export const GRAHA_ABBR: Record<string, string> = {
  SUN: "சூ",
  MOON: "சந்",
  MARS: "செ",
  MERCURY: "பு",
  JUPITER: "கு",
  VENUS: "சு",
  SATURN: "ச",
  RAHU: "ரா",
  KETU: "கே",
  MANDHI: "மா",
  Sun: "சூ",
  Moon: "சந்",
  Mars: "செ",
  Mercury: "பு",
  Jupiter: "கு",
  Venus: "சு",
  Saturn: "ச",
  Rahu: "ரா",
  Ketu: "கே",
  Mandhi: "மா",
  Lagna: "ல",
};

// English fallback abbreviations for contexts that need ASCII.
export const GRAHA_ABBR_EN: Record<string, string> = {
  SUN: "Su", MOON: "Mo", MARS: "Ma", MERCURY: "Me",
  JUPITER: "Ju", VENUS: "Ve", SATURN: "Sa", RAHU: "Ra", KETU: "Ke", MANDHI: "Md",
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke", Mandhi: "Md",
  Lagna: "La",
};

export function houseFrom(referenceRasi: number, targetRasi: number): number {
  return ((targetRasi - referenceRasi + 12) % 12) + 1;
}

export function computeD9LagnaRasi(lagnaAbsoluteLongitude: number): number {
  const lagnaRasiIdx = Math.floor(lagnaAbsoluteLongitude / 30);
  const degreeInRasi = lagnaAbsoluteLongitude % 30;
  const pada = Math.floor(degreeInRasi / (30 / 9));
  const modalityStart = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3];
  return ((modalityStart[lagnaRasiIdx] + pada) % 12) + 1;
}

export type RasiCellDetail = {
  rasi: number;
  rasiName: string;
  houseFromRef: number;
  isLagna: boolean;
  occupants: Array<{
    key: string;
    graha: string;
    abbr: string;
    degreeInRasi: number | null;
    isRetrograde: boolean;
    /** D1-only (physical proximity to the Sun) — left undefined on D9 occupants. */
    isCombust?: boolean;
    isCazimi?: boolean;
    isVargottama?: boolean;
  }>;
};

export function buildD1CellDetail(chart: ChartCalculateResponseData, rasi: number): RasiCellDetail {
  const occupants = chart.planets
    .filter((p) => p.rasi === rasi)
    .map((p) => ({
      key: p.graha,
      graha: p.graha,
      abbr: GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2),
      degreeInRasi: p.degreeInRasi,
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
      isCazimi: p.isCazimi ?? false,
      isVargottama: p.isVargottama,
    }));

  if (chart.lagna.rasi === rasi) {
    occupants.unshift({
      key: "Lagna",
      graha: "Lagna",
      abbr: "La",
      degreeInRasi: chart.lagna.degreeInRasi,
      isRetrograde: false,
      isCombust: false,
      isCazimi: false,
      isVargottama: false,
    });
  }

  return {
    rasi,
    rasiName: D1_RASI_NAMES[rasi] ?? `Rasi ${rasi}`,
    houseFromRef: houseFrom(chart.lagna.rasi, rasi),
    isLagna: chart.lagna.rasi === rasi,
    occupants,
  };
}

export function buildD9CellDetail(chart: ChartCalculateResponseData, rasi: number): RasiCellDetail {
  const d9LagnaRasi = computeD9LagnaRasi(chart.lagna.absoluteLongitude);
  const occupants = chart.planets
    .filter((p) => p.d9Rasi === rasi)
    .map((p) => ({
      key: p.graha,
      graha: p.graha,
      abbr: GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2),
      degreeInRasi: null,
      isRetrograde: p.isRetrograde,
      isVargottama: p.isVargottama,
    }));

  if (d9LagnaRasi === rasi) {
    occupants.unshift({
      key: "Lagna",
      graha: "Lagna",
      abbr: "La",
      degreeInRasi: null,
      isRetrograde: false,
      isVargottama: false,
    });
  }

  return {
    rasi,
    rasiName: D1_RASI_NAMES[rasi] ?? `Rasi ${rasi}`,
    houseFromRef: houseFrom(d9LagnaRasi, rasi),
    isLagna: d9LagnaRasi === rasi,
    occupants,
  };
}

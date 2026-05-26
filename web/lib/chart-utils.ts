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

export const GRAHA_ABBR: Record<string, string> = {
  SUN: "Su",
  MOON: "Mo",
  MARS: "Ma",
  MERCURY: "Me",
  JUPITER: "Ju",
  VENUS: "Ve",
  SATURN: "Sa",
  RAHU: "Ra",
  KETU: "Ke",
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
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
    }));

  if (chart.lagna.rasi === rasi) {
    occupants.unshift({
      key: "Lagna",
      graha: "Lagna",
      abbr: "La",
      degreeInRasi: chart.lagna.degreeInRasi,
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
    }));

  if (d9LagnaRasi === rasi) {
    occupants.unshift({
      key: "Lagna",
      graha: "Lagna",
      abbr: "La",
      degreeInRasi: null,
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

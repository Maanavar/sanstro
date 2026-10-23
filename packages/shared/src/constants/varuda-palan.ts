import type { BiText } from "../types";

/**
 * Varuda Palan (வருடப்பலன்) — the simplified annual chart. One source for its
 * name and for what it does and does not compute, rendered on the paid feature
 * itself on web and mobile (owner ruling 2026-10-21, FSA-17 / §8.3 —
 * docs/OWNER_RULINGS_FSA_2026-10-21.md).
 *
 * The backend module is still called Tajaka/Varshaphala internally
 * (`app/calculations/tajaka.py`, route `/charts/{id}/varshaphala`); only the
 * user-facing name changes. A partial Varshaphala: the solar-return chart and
 * the muntha are real, the year lord is a stand-in, and sahams and the Tajaka
 * dasas are not built. Do not describe it as "North Indian" — that names a
 * chart format, not this calculation.
 *
 * Change a row's status only when the backend changes: this table is a claim
 * about what the code computes.
 */
export const VARUDA_PALAN_NAME: BiText = {
  ta: "வருடப்பலன் — எளிமைப்படுத்தப்பட்ட ஆண்டு ஜாதகம்",
  en: "Simplified Annual Chart (Varuda Palan)",
};

export const VARUDA_PALAN_SHORT_NAME: BiText = {
  ta: "வருடப்பலன்",
  en: "Annual Chart",
};

/** The ten `areaOutlook[].area` keys the backend sends (`_AREA_KARAKA` in
 *  app/services/tajaka_service.py). Render through `varudaPalanAreaLabel`,
 *  never the bare key — it is an UPPER_CASE wire code. */
export const VARUDA_PALAN_AREA_LABEL: Record<string, BiText> = {
  CAREER: { ta: "தொழில்", en: "Career" },
  RELATIONSHIPS: { ta: "உறவுகள்", en: "Relationships" },
  HEALTH: { ta: "ஆரோக்கியம்", en: "Health" },
  WEALTH: { ta: "செல்வம்", en: "Wealth" },
  EDUCATION: { ta: "கல்வி", en: "Education" },
  CHILDREN: { ta: "குழந்தைகள்", en: "Children" },
  PROPERTY: { ta: "சொத்து", en: "Property" },
  FOREIGN: { ta: "வெளிநாடு", en: "Foreign" },
  LITIGATION: { ta: "வழக்கு", en: "Litigation" },
  SPIRITUALITY: { ta: "ஆன்மீகம்", en: "Spirituality" },
};

export function varudaPalanAreaLabel(area: string, lang: keyof BiText): string {
  const label = VARUDA_PALAN_AREA_LABEL[area];
  if (label) return label[lang];
  // An unknown key still must not print as a wire code.
  return area.charAt(0) + area.slice(1).toLowerCase().replace(/_/g, " ");
}

export type VarudaPalanComponentStatus = "COMPUTED" | "APPROXIMATE" | "HIDDEN" | "NOT_IMPLEMENTED";

export const VARUDA_PALAN_STATUS_LABEL: Record<VarudaPalanComponentStatus, BiText> = {
  COMPUTED: { ta: "கணக்கிடப்படுகிறது", en: "Computed" },
  APPROXIMATE: { ta: "தோராயம்", en: "Approximate" },
  HIDDEN: { ta: "மறைக்கப்பட்டுள்ளது", en: "Hidden" },
  NOT_IMPLEMENTED: { ta: "இல்லை — கணக்கிடுவதாகக் கூறவில்லை", en: "Not implemented, not claimed" },
};

export interface VarudaPalanComponent {
  key: "SOLAR_RETURN_CHART" | "MUNTHA" | "YEAR_LORD" | "FAVOURABLE_MONTHS" | "SAHAMS" | "TAJAKA_DASA";
  status: VarudaPalanComponentStatus;
  label: BiText;
  note?: BiText;
}

export const VARUDA_PALAN_COMPONENTS: readonly VarudaPalanComponent[] = [
  {
    key: "SOLAR_RETURN_CHART",
    status: "COMPUTED",
    label: { ta: "ஆண்டு சூரியப் பிரவேச ஜாதகம்", en: "Annual solar-return chart" },
  },
  {
    key: "MUNTHA",
    status: "COMPUTED",
    label: { ta: "முந்தா", en: "Muntha" },
  },
  {
    key: "YEAR_LORD",
    status: "APPROXIMATE",
    label: { ta: "ஆண்டு அதிபதி", en: "Year lord" },
    note: {
      ta: "சூரியப் பிரவேச நாளின் வார அதிபதி; பஞ்சாதிகாரி முறையில் தீர்மானிக்கப்படவில்லை.",
      en: "The weekday lord of the solar-return day, not a panchadhikari determination.",
    },
  },
  {
    key: "FAVOURABLE_MONTHS",
    status: "HIDDEN",
    label: { ta: "சாதக மாதங்கள்", en: "Favourable months" },
    note: {
      ta: "உங்கள் ஜாதகத்திலிருந்து கணக்கிடப்படும் வரை காட்டப்படாது.",
      en: "Not shown until they can be derived from your own chart.",
    },
  },
  {
    key: "SAHAMS",
    status: "NOT_IMPLEMENTED",
    label: { ta: "ஸஹம்கள்", en: "Sahams" },
  },
  {
    key: "TAJAKA_DASA",
    status: "NOT_IMPLEMENTED",
    label: { ta: "தாஜக தசை", en: "Tajaka dasa" },
  },
];

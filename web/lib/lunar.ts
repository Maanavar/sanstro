import { tTithi } from "./i18n";
import type { Lang } from "./i18n";

export type LunarSpecialTithi = "AMAVASAI" | "POURNAMI";

export function lunarSpecialTithiMeta(value: string | null | undefined, lang: Lang) {
  if (value === "AMAVASAI") {
    return {
      kind: "new" as const,
      label: tTithi("AMAVASAI", lang),
      phaseLabel: lang === "ta" ? "நிலா இல்லை" : "No moon",
    };
  }
  if (value === "POURNAMI") {
    return {
      kind: "full" as const,
      label: tTithi("POURNAMI", lang),
      phaseLabel: lang === "ta" ? "முழுநிலா" : "Full moon",
    };
  }
  return null;
}

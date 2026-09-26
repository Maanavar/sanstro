/**
 * English names for the backend's world-observance days.
 *
 * `_WORLD_OBSERVANCES` in `app/calculations/festivals.py` sends each day under
 * a Tamil-only `name` — there is no language-free key and no English field —
 * so an English reader would otherwise see Tamil, or (the stopgap this
 * replaces) the generic word "Observance" on 23 of its 24 days. The previous
 * fix mapped one date, `09-21`, because that was the date the audit ran (E-3,
 * 2026-09-21).
 *
 * Keyed by the exact Tamil name, not by date: two observances share `06-08`,
 * and a date key would give both the same label.
 *
 * STOPGAP (OD-5, proceed-under-assumption 2026-09-21). The right fix is a
 * language-free key from the backend, localised here — an API contract change
 * across `app/api/`, `packages/shared/src/api/`, `mobile/src/api/` and `web/`,
 * recorded as its own audit item. Until then `observance-names.test.ts` reads
 * `festivals.py` and fails on any Tamil name missing from this table, so a
 * 25th observance is a red test instead of a silent "Observance" chip.
 */
export const OBSERVANCE_ENGLISH_NAMES: Readonly<Record<string, string>> = {
  "உலக பிரெய்லி தினம்": "World Braille Day",
  "உலக புற்றுநோய் தினம்": "World Cancer Day",
  "சர்வதேச மகளிர் தினம்": "International Women's Day",
  "உலக மகிழ்ச்சி தினம்": "International Day of Happiness",
  "உலக காடுகள் தினம்": "International Day of Forests",
  "உலக நீர் தினம்": "World Water Day",
  "உலக சுகாதார தினம்": "World Health Day",
  "உலக புவி தினம்": "Earth Day",
  "உலக தொழிலாளர் தினம்": "International Workers' Day",
  "உலக புகையிலை எதிர்ப்பு தினம்": "World No Tobacco Day",
  "உலக சுற்றுச்சூழல் தினம்": "World Environment Day",
  "உலக பெருங்கடல் தினம்": "World Oceans Day",
  "உலக மூளைக்கட்டி தினம்": "World Brain Tumour Day",
  "சர்வதேச யோகா தினம்": "International Day of Yoga",
  "உலக மக்கள்தொகை தினம்": "World Population Day",
  "சர்வதேச இளைஞர் தினம்": "International Youth Day",
  "சர்வதேச எழுத்தறிவு தினம்": "International Literacy Day",
  "சர்வதேச அமைதி தினம்": "International Day of Peace",
  "சர்வதேச முதியோர் தினம்": "International Day of Older Persons",
  "உலக உணவு தினம்": "World Food Day",
  "உலக நீரிழிவு தினம்": "World Diabetes Day",
  "உலக குழந்தைகள் தினம்": "World Children's Day",
  "உலக எய்ட்ஸ் தினம்": "World AIDS Day",
  "உலக மனித உரிமைகள் தினம்": "Human Rights Day",
};

/** The English name for a backend observance, or null for a name not in the table. */
export function observanceEnglishName(tamilName: string): string | null {
  return OBSERVANCE_ENGLISH_NAMES[tamilName.trim()] ?? null;
}

export const MIN_BIRTH_DATE = "1900-01-01";

export function maxBirthDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isBirthDateWithinBounds(value: string): boolean {
  if (!value) return true;
  const year = Number.parseInt(value.split("-")[0] ?? "", 10);
  const currentYear = new Date().getFullYear();
  if (!Number.isFinite(year)) return false;
  if (year < 1900 || year > currentYear) return false;
  return value >= MIN_BIRTH_DATE && value <= maxBirthDateIso();
}

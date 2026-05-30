export type PeyarchiTone = "supportive" | "neutral" | "caution";

export function classifyPeyarchiToneFromMoon(planet: string, houseFromMoon: number): PeyarchiTone {
  if (planet === "JUPITER") {
    if ([2, 5, 7, 9, 11].includes(houseFromMoon)) return "supportive";
    if ([1, 10].includes(houseFromMoon)) return "neutral";
    return "caution";
  }

  if (planet === "SATURN") {
    if ([3, 6, 10, 11].includes(houseFromMoon)) return "supportive";
    if ([5, 7].includes(houseFromMoon)) return "neutral";
    return "caution";
  }

  return "neutral";
}

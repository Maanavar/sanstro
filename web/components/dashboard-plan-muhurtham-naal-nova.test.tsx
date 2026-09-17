import { describe, expect, it } from "vitest";

import { chandrashtamaWho } from "./dashboard-plan-muhurtham-naal-nova";
import type { MuhurthamNaalMatchItem, MuhurthamNaalReading } from "@/lib/muhurtham-naal";

function reading(who: { en: string; ta: string } | null, isChandrashtama: boolean): MuhurthamNaalReading {
  return { who, isChandrashtama, taraNumber: 2, taraName: { en: "Sampat", ta: "சம்பத்" }, taraQuality: "GOOD", governs: false };
}

function match(readings: MuhurthamNaalReading[] | undefined): MuhurthamNaalMatchItem {
  return { readings } as MuhurthamNaalMatchItem;
}

const BRIDE = { en: "Bride", ta: "மணமகள்" };
const GROOM = { en: "Groom", ta: "மணமகன்" };

describe("chandrashtamaWho", () => {
  it("names whose Chandrashtama a couple's date is", () => {
    // A bare "Chandrashtama" on a date that is clear for the reader would read
    // as a mistake; it is their partner's.
    expect(chandrashtamaWho(match([reading(BRIDE, false), reading(GROOM, true)]), "en")).toBe(" · Groom");
    expect(chandrashtamaWho(match([reading(BRIDE, true), reading(GROOM, true)]), "ta")).toBe(" · மணமகள் & மணமகன்");
  });

  it("adds nothing for a single chart, or a response that predates readings", () => {
    expect(chandrashtamaWho(match([reading(null, true)]), "en")).toBe("");
    expect(chandrashtamaWho(match(undefined), "en")).toBe("");
    expect(chandrashtamaWho(null, "en")).toBe("");
  });
});

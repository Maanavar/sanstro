import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NovaMuhurthamNaal, chandrashtamaWho, defaultGregorianMonth } from "./dashboard-plan-muhurtham-naal-nova";
import type { MuhurthamNaalMatchItem, MuhurthamNaalReading } from "@/lib/muhurtham-naal";

vi.mock("@/lib/muhurtham-naal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/muhurtham-naal")>()),
  fetchPublicMuhurthamNaals: vi.fn(() => new Promise(() => {})),
}));

afterEach(() => {
  vi.useRealTimers();
});

function reading(who: { en: string; ta: string } | null, isChandrashtama: boolean): MuhurthamNaalReading {
  return { who, isChandrashtama, taraNumber: 2, taraName: { en: "Sampat", ta: "சம்பத்" }, taraQuality: "GOOD", governs: false };
}

function match(readings: MuhurthamNaalReading[] | undefined): MuhurthamNaalMatchItem {
  return { readings } as MuhurthamNaalMatchItem;
}

const BRIDE = { en: "Bride", ta: "மணமகள்" };
const GROOM = { en: "Groom", ta: "மணமகன்" };

describe("defaultGregorianMonth", () => {
  it("opens the published dates on the current English month", () => {
    expect(defaultGregorianMonth(new Date(2026, 9, 13))).toBe(10);
  });

  it("uses that month as the English-month filter's initial selection", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 12));

    render(<NovaMuhurthamNaal lang="en" chartId={null} DayDrawer={() => null} />);

    expect(screen.getByRole("button", { name: "English month" })).toHaveTextContent("Oct");
  });
});

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

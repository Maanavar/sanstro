import { describe, expect, it } from "vitest";
import { lunarSpecialTithiMeta } from "./lunar";

describe("lunarSpecialTithiMeta", () => {
  it("returns new-moon meta for AMAVASAI in English", () => {
    const meta = lunarSpecialTithiMeta("AMAVASAI", "en");
    expect(meta).not.toBeNull();
    expect(meta!.kind).toBe("new");
    expect(meta!.phaseLabel).toBe("No moon");
  });

  it("returns new-moon meta for AMAVASAI in Tamil", () => {
    const meta = lunarSpecialTithiMeta("AMAVASAI", "ta");
    expect(meta).not.toBeNull();
    expect(meta!.phaseLabel).toContain("நிலா");
  });

  it("returns full-moon meta for POURNAMI in English", () => {
    const meta = lunarSpecialTithiMeta("POURNAMI", "en");
    expect(meta).not.toBeNull();
    expect(meta!.kind).toBe("full");
    expect(meta!.phaseLabel).toBe("Full moon");
  });

  it("returns full-moon meta for POURNAMI in Tamil", () => {
    const meta = lunarSpecialTithiMeta("POURNAMI", "ta");
    expect(meta).not.toBeNull();
    expect(meta!.phaseLabel).toContain("முழுநிலா");
  });

  it("returns null for regular tithi", () => {
    expect(lunarSpecialTithiMeta("PRATHAMA", "en")).toBeNull();
    expect(lunarSpecialTithiMeta(null, "en")).toBeNull();
    expect(lunarSpecialTithiMeta(undefined, "en")).toBeNull();
  });
});

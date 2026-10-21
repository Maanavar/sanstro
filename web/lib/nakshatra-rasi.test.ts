import { describe, expect, it } from "vitest";
import { nakshatraPadaGroups, nakshatraPadaRasi } from "@vinaadi/shared/nakshatraRasi";

// Output of app/calculations/astro.py `nakshatra_to_rasi(n, p)` for every pada,
// one 4-character group per nakshatra, rasi in hex (a = 10, b = 11, c = 12).
// Regenerate with:
//   python -c "from app.calculations.astro import nakshatra_to_rasi as f;
//     print(','.join(''.join('%x' % f(n,p) for p in range(1,5)) for n in range(1,28)))"
const BACKEND =
  "1111,1111,1222,2222,2233,3333,3334,4444,4444,5555,5555,5666,6666,6677," +
  "7777,7778,8888,8888,9999,9999,9aaa,aaaa,aabb,bbbb,bbbc,cccc,cccc";

describe("nakshatraPadaRasi", () => {
  it("matches the backend for all 108 padas", () => {
    const rows = BACKEND.split(",");
    expect(rows).toHaveLength(27);
    rows.forEach((row, i) => {
      for (let pada = 1; pada <= 4; pada += 1) {
        expect(nakshatraPadaRasi(i + 1, pada)).toBe(parseInt(row[pada - 1], 16));
      }
    });
  });

  it("rejects out-of-range input instead of guessing a sign", () => {
    expect(() => nakshatraPadaRasi(0, 1)).toThrow(RangeError);
    expect(() => nakshatraPadaRasi(28, 1)).toThrow(RangeError);
    expect(() => nakshatraPadaRasi(3, 0)).toThrow(RangeError);
    expect(() => nakshatraPadaRasi(3, 5)).toThrow(RangeError);
  });
});

describe("nakshatraPadaGroups", () => {
  it("splits exactly the nine boundary stars", () => {
    const split = Array.from({ length: 27 }, (_, i) => i + 1).filter(
      (n) => nakshatraPadaGroups(n).length === 2,
    );
    expect(split).toEqual([3, 5, 7, 12, 14, 16, 21, 23, 25]);
  });

  it("groups Karthigai as pada 1 Mesham, padas 2-4 Rishabam", () => {
    expect(nakshatraPadaGroups(3)).toEqual([
      { rasi: 1, padas: [1] },
      { rasi: 2, padas: [2, 3, 4] },
    ]);
  });

  it("keeps a whole star in one group", () => {
    expect(nakshatraPadaGroups(4)).toEqual([{ rasi: 2, padas: [1, 2, 3, 4] }]);
  });
});

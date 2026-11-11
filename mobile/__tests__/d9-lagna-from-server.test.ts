/**
 * FAA-01 (docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md): the mobile D9 wheel
 * computed its own Navamsa lagna and started fixed signs at the 8th and dual
 * signs at the 4th. Parashara starts them at the 9th and the 5th
 * (app/calculations/astro.py::navamsa_rasi_from_degree), so 8 of 12 lagnas
 * landed one sign off while the planets (read from the server) were right.
 *
 * The backend is the only place D9 is computed. This guard fails if any mobile
 * source file computes a navamsa from a longitude again, or if a D9 wheel screen
 * stops reading `lagna.d9Rasi`.
 *
 * Verified: with the old helper restored in jadhagam.tsx, both tests fail.
 * BLIND SPOT: it matches the shapes a navamsa formula takes (`30 / 9`,
 * `navamsa...FromDegree`); a formula written another way, such as `3.3333`, would
 * pass. The server value itself is pinned in tests/test_faa_group_a.py.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SCAN = ["app", "src", "components"];
const D9_SCREENS = ["app/(tabs)/tools/jadhagam.tsx", "app/jadhagam/[id].tsx"];

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe("FAA-01 D9 lagna comes from the server", () => {
  it("no mobile source computes a navamsa from a longitude", () => {
    const offenders: string[] = [];
    for (const dir of SCAN) {
      for (const file of walk(path.join(ROOT, dir))) {
        const src = readFileSync(file, "utf8");
        if (/navamsa\w*FromDegree|\(\s*30\s*\/\s*9\s*\)/i.test(src)) {
          offenders.push(path.relative(ROOT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it.each(D9_SCREENS)("%s reads chart.lagna.d9Rasi", (rel) => {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    expect(src).toMatch(/chart\.lagna\.d9Rasi/);
  });
});

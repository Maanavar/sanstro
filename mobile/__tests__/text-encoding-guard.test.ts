import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Mobile's copy of web's `lib/text-encoding-guard.test.ts`, and the reason it
 * now exists: web had this guard and mobile did not, so every encoding defect
 * in this repo accumulated on the side without one.
 *
 * What it caught the day it was written (P2-8, 2026-09-03), all pre-existing:
 *
 * - Five files carrying a UTF-8 BOM. A BOM once hid the 38 heaviest files from
 *   a bundle-analysis tool here, and one of the five sat in `src/`, which the
 *   lint script does not even glob.
 * - `app/(tabs)/today.tsx` shipping a double-encoded en dash into
 *   `pushWidgetData()` — visible on the user's home-screen widget.
 * - `app/(tabs)/panchangam/index.tsx` rendering six garbage characters where
 *   the sunrise and sunset emoji had been mangled twice over.
 *
 * None of that was detectable by tsc, eslint or any unit test: mojibake is
 * valid TypeScript and a valid string. Only reading the bytes finds it.
 */

const SOURCE_ROOTS = ["app", "src"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORED_DIRS = new Set(["node_modules", ".expo", ".expo-shared", "android", "ios"]);

const MOJIBAKE_MARKERS = [
  [0x00e0, 0x00ae], // Tamil UTF-8 bytes decoded as Latin-1.
  [0x00e0, 0x00af],
  [0x00e2, 0x20ac], // Smart punctuation: en/em dash, curly quotes.
  [0x00c2, 0x00b7],
  [0x00e2, 0x2020],
  [0x00e2, 0x2021],
  [0x00e2, 0x02dc],
  [0x00e2, 0x0160],
  [0x00e2, 0x2022],
  [0x00c3, 0x0192], // Doubly-encoded — what the panchangam emoji had become.
].map((codes) => String.fromCodePoint(...codes));

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return IGNORED_DIRS.has(entry) ? [] : listSourceFiles(fullPath);
    }
    return SOURCE_EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

function allSourceFiles(): { root: string; files: string[] } {
  const root = path.resolve(__dirname, "..");
  return { root, files: SOURCE_ROOTS.flatMap((r) => listSourceFiles(path.join(root, r))) };
}

describe("text encoding guard", () => {
  it("keeps mobile source free from common mojibake markers", () => {
    const { root, files } = allSourceFiles();
    const offenders = files.flatMap((filePath) => {
      const content = readFileSync(filePath, "utf8");
      const markers = MOJIBAKE_MARKERS.filter((marker) => content.includes(marker));
      return markers.length ? [`${path.relative(root, filePath)}: ${markers.join(", ")}`] : [];
    });

    expect(offenders).toEqual([]);
  });

  it("keeps mobile source free from UTF-8 BOMs", () => {
    // Separate from the marker check on purpose: a BOM is invisible in every
    // editor and diff, so a failure naming it explicitly is worth more than one
    // more entry in a shared list.
    const { root, files } = allSourceFiles();
    const offenders = files.filter((filePath) => readFileSync(filePath, "utf8").charCodeAt(0) === 0xfeff);

    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
});

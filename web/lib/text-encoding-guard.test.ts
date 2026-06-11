import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["app", "components", "lib"];
const SOURCE_EXTENSIONS = new Set([".css", ".mjs", ".ts", ".tsx"]);

const MOJIBAKE_MARKERS = [
  [0x00e0, 0x00ae], // Tamil UTF-8 bytes decoded as Latin-1.
  [0x00e0, 0x00af],
  [0x00e2, 0x20ac], // Smart punctuation decoded as mojibake.
  [0x00c2, 0x00b7],
  [0x00e2, 0x2020],
  [0x00e2, 0x2021],
  [0x00e2, 0x02dc],
  [0x00e2, 0x0160],
  [0x00e2, 0x2022],
].map((codes) => String.fromCodePoint(...codes));

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === ".next" || entry === "node_modules") return [];
      return listSourceFiles(fullPath);
    }

    return SOURCE_EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

describe("text encoding guard", () => {
  it("keeps public web source free from common mojibake markers", () => {
    const root = process.cwd();
    const offenders = SOURCE_ROOTS.flatMap((sourceRoot) => listSourceFiles(path.join(root, sourceRoot)))
      .flatMap((filePath) => {
        const content = readFileSync(filePath, "utf8");
        const markers = MOJIBAKE_MARKERS.filter((marker) => content.includes(marker));
        return markers.length ? [`${path.relative(root, filePath)}: ${markers.join(", ")}`] : [];
      });

    expect(offenders).toEqual([]);
  });
});

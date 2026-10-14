/**
 * A02 ratchet — a private query key must name the account it belongs to.
 *
 * `["family-vaults"]` is the exact shape of the finding: a key with no account
 * in it, so A's response and B's response are one cache entry. There were five
 * of them (`family-vaults`, `notification-prefs`, `notification-inbox`,
 * `my-subscription`, `ask-vinaadi-status`), and nothing could have noticed a
 * sixth being added — the cache does not care, TypeScript does not care, and
 * the screen works perfectly until two accounts use the same device.
 *
 * The rule asserted here: a query key that is a single bare string literal is
 * allowed ONLY if `queryCachePolicy.ts` classifies it as public, i.e.
 * account-independent by nature. Anything else must go through `accountKey()`
 * or carry an argument that scopes it (a chart id, a member id, a date).
 *
 * This is a ratchet, not the fix. The fix is that a session transition clears
 * the cache (src/state/sessionTransition.ts, tested in sessionTransition.test.ts).
 * This stops the *collision* from being expressible, so a future path that
 * forgets to clear cannot serve one account's row to another.
 *
 * WHAT IT CANNOT SEE:
 *  - a key built at runtime: `queryKey: [someVariable]`, or a key assembled by
 *    a helper other than `accountKey`. It is a source match on literal keys,
 *    which is the form every call site in this app currently uses.
 *  - whether `accountKey()` was given the RIGHT account. It reads the
 *    authoritative session identity, so there is one answer, but this test does
 *    not execute it.
 *  - server-side authorization, which is a different guarantee entirely. A user
 *    id in a cache key is isolation metadata, never an access check.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { ACCOUNT_INDEPENDENT_PRIVATE_KEYS, policyFor } from "@/lib/queryCachePolicy";

const MOBILE_ROOT = path.join(__dirname, "..");
const SCAN_DIRS = ["app", "src"];
const SKIP = new Set(["node_modules", ".expo", "__tests__", "__mocks__"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const FILES = SCAN_DIRS.flatMap((dir) => walk(path.join(MOBILE_ROOT, dir)));

/** Every `queryKey: [...]` literal in the scanned source. */
function literalQueryKeys(): Array<{ file: string; head: string; raw: string }> {
  const found: Array<{ file: string; head: string; raw: string }> = [];
  for (const file of FILES) {
    const src = readFileSync(file, "utf-8");
    // `queryKey: ["name"]` and `queryKey: ["name", …]`. Deliberately only the
    // literal form; see the blind spot note above.
    for (const match of src.matchAll(/queryKey:\s*\[\s*"([^"]+)"([^\]]*)\]/g)) {
      found.push({
        file: path.relative(MOBILE_ROOT, file).split(path.sep).join("/"),
        head: match[1],
        raw: match[0],
      });
    }
  }
  return found;
}

describe("A02 ratchet: query-key scoping", () => {
  it("the scan reaches the screens it is supposed to", () => {
    // A guard whose file list came back empty would pass for the wrong reason.
    expect(FILES.length).toBeGreaterThan(80);
    expect(FILES.some((f) => f.endsWith("family-vault.tsx"))).toBe(true);
  });

  it("finds query keys to check at all", () => {
    expect(literalQueryKeys().length).toBeGreaterThan(20);
  });

  it("no unscoped single-segment private key exists", () => {
    const offenders = literalQueryKeys()
      .filter(({ head, raw }) => {
        // `["name"]` with nothing after it is account-independent by shape.
        const isSingleSegment = /^\[\s*"[^"]+"\s*\]$/.test(raw.replace(/^queryKey:\s*/, ""));
        if (!isSingleSegment) return false;
        // Allowed only if the policy file says this resource is public.
        return policyFor([head]).policy !== "public";
      })
      .map(({ file, head }) => `${file}: ["${head}"] — wrap in accountKey("${head}") or declare it public`)
      .sort();

    expect(offenders).toEqual([]);
  });

  it("each key the finding named now goes through accountKey", () => {
    // The other direction: an entry that no longer appears anywhere would make
    // ACCOUNT_INDEPENDENT_PRIVATE_KEYS a record of a past already cleaned up,
    // and the assertion above would pass vacuously for it.
    // Collected rather than asserted one at a time: jest's `expect` takes no
    // message argument (that is vitest, which web/ uses), so the explanation
    // has to be in the compared value.
    const sources = FILES.map((f) => readFileSync(f, "utf-8")).join("\n");
    const problems: string[] = [];
    for (const key of ACCOUNT_INDEPENDENT_PRIVATE_KEYS) {
      if (!sources.includes(`accountKey("${key}")`)) {
        problems.push(`${key}: declared in ACCOUNT_INDEPENDENT_PRIVATE_KEYS but no call site uses accountKey for it`);
      }
      if (sources.includes(`queryKey: ["${key}"]`)) {
        problems.push(`${key}: still has a bare, unscoped call site`);
      }
    }

    expect(problems).toEqual([]);
  });
});

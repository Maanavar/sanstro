/**
 * What may be written to the device, and what is memory-only.
 *
 * A07 replaced a substring denylist with this allowlist, because the denylist
 * was unsafe by default. It matched ten substrings against a key's first
 * segment, and most private surfaces in this app match none of them —
 * `family-vaults`, `synastry`, `my-subscription`, `porutham`, `dosham`,
 * `yogam`, `pariharam`, `friendship-compat`, `prasna`, `retrospective`,
 * `notification-inbox`. The only reason they were not already on disk is that
 * the filter was inspecting the wrong level of the envelope and never ran. A
 * repair of that bug alone would have *started* persisting them.
 *
 * So an unlisted key is not persisted. A new feature that wants offline
 * behaviour has to say so here, in a diff a reviewer sees.
 *
 * OWNER RULING (2026-10-07): the private surfaces worth having offline are the
 * user's own chart summary, their current dasha, and a short-lived today
 * snapshot. Family-vault data is deliberately NOT persisted in V1 — it is other
 * people's birth data held under this account, and the account-isolation work
 * in A02 is what would have to be trusted for it.
 */

/** How a query's data may be cached on the device. */
export type CachePolicy =
  /** Account-independent. Safe to keep, and useful without a network. */
  | "public"
  /** Account-scoped, explicitly approved for offline use. */
  | "private-persistable"
  /** Account-scoped, memory only. The default for anything unlisted. */
  | "private-memory";

interface PolicyEntry {
  policy: CachePolicy;
  /**
   * Discard a persisted entry older than this, independently of the envelope's
   * own age. Persistence age, in-memory garbage collection and staleness answer
   * three different questions; this one is "is it still fit to show offline".
   */
  maxAgeMs?: number;
  /** Why, for the next reader. */
  reason: string;
}

const H = (n: number) => 1000 * 60 * 60 * n;
const D = (n: number) => H(24 * n);

/**
 * Keyed by the FIRST segment of the query key, which is how every call site in
 * this app names its resource.
 */
export const QUERY_CACHE_POLICY: Record<string, PolicyEntry> = {
  // ---- approved private surfaces (owner ruling) ----
  "chart-full": {
    policy: "private-persistable",
    maxAgeMs: D(30),
    reason: "the user's own chart summary — the screen most worth having on a plane; birth data does not change",
  },
  "dasha-timeline": {
    policy: "private-persistable",
    maxAgeMs: D(7),
    reason: "current dasha — derived from the same fixed birth data, read-mostly",
  },
  "daily-snapshot": {
    policy: "private-persistable",
    maxAgeMs: D(1),
    reason: "today's snapshot, short-lived on purpose — yesterday's is wrong, not merely stale",
  },

  // ---- account-independent reference data ----
  "panchangam-day": { policy: "public", maxAgeMs: D(7), reason: "almanac for a date and place; identical for every account" },
  "panchangam-month": { policy: "public", maxAgeMs: D(7), reason: "as panchangam-day, a month at a time" },
  "panchangam-tool": { policy: "public", maxAgeMs: D(7), reason: "as panchangam-day, via the tool surface" },
  natchathiram: { policy: "public", maxAgeMs: D(30), reason: "static reference text per nakshatra" },
  "muhurtham-naals-public": { policy: "public", maxAgeMs: D(30), reason: "published almanac dates; the key says public" },
};

/**
 * Keys that are account-independent AND private — the shape that caused A02.
 *
 * `["family-vaults"]` names no account, so A's response and B's response are
 * the same cache entry. These are listed so the key-scoping gate can require
 * each to be user-scoped, and so that adding another one is a deliberate act.
 */
export const ACCOUNT_INDEPENDENT_PRIVATE_KEYS = [
  "family-vaults",
  "notification-prefs",
  "notification-inbox",
  "my-subscription",
  "ask-vinaadi-status",
] as const;

export function policyFor(queryKey: readonly unknown[]): PolicyEntry {
  const head = queryKey[0];
  if (typeof head !== "string") {
    return { policy: "private-memory", reason: "non-string key head — unclassifiable, so not persisted" };
  }
  // A user-scoped key is `["user", <uuid>, <resource>, …]`; classify on the
  // resource, not on the namespace prefix.
  const resource = head === "user" && typeof queryKey[2] === "string" ? (queryKey[2] as string) : head;
  return (
    QUERY_CACHE_POLICY[resource] ?? {
      policy: "private-memory",
      reason: "not declared in QUERY_CACHE_POLICY — unlisted keys are never persisted",
    }
  );
}

export function mayPersist(queryKey: readonly unknown[]): boolean {
  const { policy } = policyFor(queryKey);
  return policy === "public" || policy === "private-persistable";
}

/** True when a persisted entry has outlived its own declared maximum age. */
export function isExpiredForPersistence(queryKey: readonly unknown[], writtenAtMs: number, nowMs: number): boolean {
  const { maxAgeMs } = policyFor(queryKey);
  if (maxAgeMs === undefined) return false;
  return nowMs - writtenAtMs > maxAgeMs;
}

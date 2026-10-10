import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

import { encryptedStorage, type EncryptedStorage } from "./encryptedStorage";
import { isExpiredForPersistence, mayPersist } from "./queryCachePolicy";

/**
 * The encrypted React Query cache on the device.
 *
 * A07. The previous version declared its own `Persister`-shaped interface with
 * `persistClient: (clientState: any) => …`, and the filter it called checked
 * `clientState?.queries`. The real argument is a `PersistedClient` envelope:
 *
 *     { timestamp, buster, clientState: { queries, mutations } }
 *
 * so `queries` was `undefined` one level up, the guard clause returned early,
 * and the filter handed back its input untouched. Every query it meant to
 * discard was written anyway — measured against the installed library's own
 * `dehydrate` output, the persisted keys were `["profile", "family-vaults"]`,
 * and `profile` is pattern #2 of the filter's own denylist. The `any` is what
 * let the wrong shape compile, so the types here now come from the installed
 * package instead of being restated.
 *
 * Three things changed beyond the shape:
 *
 *   - policy is an ALLOWLIST (see queryCachePolicy.ts). Unlisted keys are not
 *     persisted. The denylist was unsafe by default, and fixing only the
 *     envelope bug would have begun persisting a dozen private surfaces that
 *     matched none of its substrings.
 *   - storage is NAMESPACED PER ACCOUNT, so one device holding two accounts'
 *     caches cannot serve one to the other (A02 handles the live cache; this
 *     handles the bytes).
 *   - restore VALIDATES: schema version, envelope age, per-key age, and shape.
 *     It also re-applies the allowlist on the way in, because a build that
 *     persisted more than today's policy allows has already left those rows on
 *     the device.
 */

/**
 * Bumped whenever the persisted shape or the retention policy changes.
 *
 * A07's rollout requires discarding the existing cache rather than carrying it
 * forward: entries already on disk were written by the no-op filter, so they
 * include data this policy would refuse. `v3` is the version that first
 * filtered anything at all.
 */
export const CACHE_SCHEMA_VERSION = "v3-allowlist-2026-10-07";

/** Outer bound on the envelope, whatever the per-key ages say. */
const MAX_ENVELOPE_AGE_MS = 1000 * 60 * 60 * 24 * 30;

const KEY_PREFIX = "vinaadi_rq_cache";

/**
 * The storage key for one account's cache.
 *
 * The old single `vinaadi_rq_cache` key is deliberately not reused, so an
 * upgrade cannot read a pre-A07 envelope at all. Nothing deletes it here: a
 * query-cache migration has no business touching other device state, and
 * `removeClient` only ever owns the active namespace.
 */
export function persistedCacheKey(userId: string): string {
  return `${KEY_PREFIX}:u:${userId}`;
}

interface PersisterOptions {
  /**
   * The authenticated account, or null when signed out.
   *
   * A resolver is accepted because the app mounts ONE persister, at module
   * load, before any user is known — `PersistQueryClientProvider` takes a
   * single instance. Resolving per call rather than capturing at construction
   * is also what makes a late write harmless: the session coordinator sets the
   * identity to null before clearing the cache, so a persistence write that
   * arrives after the transition has no namespace to write into and becomes a
   * no-op instead of repopulating the previous account's data (A02 step 4).
   */
  userId: string | null | (() => string | null);
  storage?: Pick<EncryptedStorage, "getItem" | "setItem" | "removeItem">;
  now?: () => number;
}

/** A `PersistedClient` with the fields we actually read, checked at runtime. */
function isEnvelope(value: unknown): value is PersistedClient {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<PersistedClient>;
  if (typeof candidate.timestamp !== "number") return false;
  if (typeof candidate.buster !== "string") return false;
  const state = candidate.clientState as { queries?: unknown; mutations?: unknown } | undefined;
  if (typeof state !== "object" || state === null) return false;
  return Array.isArray(state.queries);
}

/**
 * Keep only what policy allows, and never any mutation.
 *
 * Mutations carry request *variables* — a profile edit's birth time, an
 * ask-vinaadi prompt — which is input rather than cached output, and nothing in
 * this app needs a pending mutation to survive a restart.
 */
function applyPolicy(envelope: PersistedClient, now: number, checkAge: boolean): PersistedClient {
  const queries = envelope.clientState.queries.filter((query) => {
    const key = query.queryKey as unknown[];
    if (!mayPersist(key)) return false;
    if (checkAge) {
      const dataUpdatedAt = query.state?.dataUpdatedAt ?? envelope.timestamp;
      if (isExpiredForPersistence(key, dataUpdatedAt, now)) return false;
    }
    return true;
  });

  return {
    ...envelope,
    clientState: { ...envelope.clientState, queries, mutations: [] },
  };
}

export function createEncryptedPersister(options: PersisterOptions): Persister {
  const { userId: userIdOption, storage = encryptedStorage, now = () => Date.now() } = options;
  const activeUserId = (): string | null =>
    typeof userIdOption === "function" ? userIdOption() : userIdOption;

  return {
    persistClient: async (envelope: PersistedClient) => {
      // No account, no namespace. A guest process writes nothing rather than
      // writing into a key whose owner is ambiguous.
      const userId = activeUserId();
      if (!userId) return;
      try {
        const filtered = applyPolicy(envelope, now(), false);
        filtered.buster = CACHE_SCHEMA_VERSION;
        await storage.setItem(persistedCacheKey(userId), JSON.stringify(filtered));
      } catch (error) {
        console.warn("Failed to persist React Query client state:", error);
      }
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      const userId = activeUserId();
      if (!userId) return undefined;
      try {
        const raw = await storage.getItem(persistedCacheKey(userId));
        if (!raw) return undefined;

        const parsed: unknown = JSON.parse(raw);
        if (!isEnvelope(parsed)) return undefined;
        // Written by a build with a different shape or retention policy.
        if (parsed.buster !== CACHE_SCHEMA_VERSION) return undefined;

        const timestamp = now();
        if (timestamp - parsed.timestamp > MAX_ENVELOPE_AGE_MS) return undefined;

        return applyPolicy(parsed, timestamp, true);
      } catch (error) {
        // Malformed, truncated, or undecryptable: an empty cache is a correct
        // outcome here, and a throw would take the app's startup with it.
        console.warn("Failed to restore React Query client state:", error);
        return undefined;
      }
    },

    removeClient: async () => {
      const userId = activeUserId();
      if (!userId) return;
      try {
        await storage.removeItem(persistedCacheKey(userId));
      } catch (error) {
        console.warn("Failed to remove React Query client state:", error);
      }
    },
  };
}

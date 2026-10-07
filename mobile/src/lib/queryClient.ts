import { QueryClient } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import {
  CACHE_SCHEMA_VERSION,
  createEncryptedPersister,
  persistedCacheKey,
} from "./encryptedQueryPersister";
import { encryptedStorage } from "./encryptedStorage";
import { currentUserId } from "./sessionIdentity";

const H = (n: number) => 1000 * 60 * 60 * n;
const D = (n: number) => H(24 * n);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: H(1),
      gcTime:    D(30), // keep persisted cache for up to 30 days (jadhagam TTL)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * The persisted cache, scoped to whoever is signed in right now.
 *
 * A02/A07. `PersistQueryClientProvider` takes ONE persister, mounted at module
 * load, long before any account is known — and it is mounted above
 * `SessionProvider`, so it outlives every session. Passing a resolver rather
 * than a captured id is what makes that safe: each call asks who is live, so
 * the moment the session coordinator advances the generation (setting the user
 * to null) a persistence write that was already in flight has no namespace to
 * land in and quietly does nothing, instead of writing the departing account's
 * data back to the device after it was cleared.
 */
export const sessionPersister: Persister & {
  /** Remove a NAMED account's cache, for the coordinator's teardown step. */
  removeClientFor: (userId: string) => Promise<void>;
} = (() => {
  const base = createEncryptedPersister({ userId: () => currentUserId() });
  return {
    persistClient: (client: PersistedClient) => base.persistClient(client),
    restoreClient: () => base.restoreClient(),
    removeClient: () => base.removeClient(),
    // The coordinator advances the generation BEFORE tearing down, so by the
    // time it removes the departing account's bytes, `currentUserId()` is
    // already null and `removeClient()` would be a no-op. It therefore has to
    // name the account whose namespace it is clearing.
    removeClientFor: async (userId: string) => {
      try {
        await encryptedStorage.removeItem(persistedCacheKey(userId));
      } catch (error) {
        console.warn("Failed to remove persisted cache for departing session:", error);
      }
    },
  };
})();

/**
 * Passed to `PersistQueryClientProvider` as `persistOptions.buster`, so the
 * library discards a cache written under a different policy before it hydrates
 * it. The persister validates this too; both ends check, because the library's
 * own restore path is what runs on a cold start.
 */
export const PERSIST_BUSTER = CACHE_SCHEMA_VERSION;

// Cache TTLs aligned to Section 9 of the mobile gap-closure architecture.
// staleTime = how long before React Query considers data stale and refetches.
// gcTime on the QueryClient (30d) covers the longest-lived entry (jadhagam).
export const STALE = {
  // Today tab — all cards show "last load" data until next day
  today:         D(1),
  guidance:      D(1),
  rasiPalan:     D(1),
  dailyScore:    D(1),

  // Panchangam
  panchangam:    D(1),   // daily timings
  calendar:      D(7),   // monthly calendar grid

  // Personal chart data
  dasha:         D(7),
  jadhagam:      D(30),
  varshaphala:   D(7),
  transits:      H(6),   // planet positions change intra-day

  // Misc
  profile:       D(1),
  notifications: 1000 * 60, // 1 minute
  tools:         0,          // always stale — user-triggered, result must be fresh
} as const;

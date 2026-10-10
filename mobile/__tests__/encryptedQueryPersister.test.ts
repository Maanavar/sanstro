/**
 * A07 — what the encrypted query cache is allowed to keep (P2).
 *
 * `sanitizeClientState` took the argument it was handed and checked
 * `clientState?.queries` on it. The argument is a `PersistedClient`:
 *
 *     { timestamp, buster, clientState: { queries, mutations } }
 *
 * so it was inspecting the envelope as if it were the envelope's own
 * `clientState`. `queries` was `undefined` one level up, the guard clause
 * returned early, and the filter returned its input unchanged. Every query the
 * denylist named was retained anyway. A hand-written `any` interface at the
 * boundary is what let the wrong shape compile.
 *
 * The denylist was the second problem. It matched ten substrings against the
 * first key segment, and most private surfaces in this app match none of them:
 * `family-vaults`, `synastry`, `relationship-synastry`, `porutham`, `dosham`,
 * `yogam`, `pariharam`, `friendship-compat`, `my-subscription`, `prasna`,
 * `retrospective`, `notification-inbox`. Repairing the envelope bug alone would
 * therefore have *started* persisting all of those — the bug was the only
 * reason it had not. So the policy is inverted: an allowlist, with unknown keys
 * not persisted.
 *
 * OWNER RULING (2026-10-07) — what may work offline: the user's own chart
 * summary, their current dasha, and a short-lived today snapshot. Explicitly
 * NOT family-vault data in V1. Everything else is memory-only.
 *
 * WHAT THIS SUITE CANNOT SEE:
 *  - that the bytes on the device are encrypted. That is
 *    __tests__/encryptedStorage.test.ts's job; here storage is a plain map, so
 *    the decoded payload can be inspected, which is the point.
 *  - account isolation inside a running app. A namespaced key proves the
 *    persister writes under the right name, not that the live QueryClient was
 *    cleared on a session change — that is A02, in
 *    __tests__/sessionTransition.test.ts.
 *  - anything about React. No provider is mounted.
 */
const store: Record<string, string> = {};

jest.mock("@/lib/encryptedStorage", () => ({
  encryptedStorage: {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  },
  EncryptedStorage: class {},
}));

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

import {
  CACHE_SCHEMA_VERSION,
  createEncryptedPersister,
  persistedCacheKey,
} from "@/lib/encryptedQueryPersister";

const USER_A = "aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb";

/**
 * A real dehydrated envelope, built by the installed library rather than by
 * hand. The original defect was a shape mismatch, so a hand-written fixture
 * would have reproduced the assumption instead of the behaviour.
 */
function envelopeWith(entries: Array<[unknown[], unknown]>): PersistedClient {
  const client = new QueryClient();
  for (const [key, data] of entries) {
    client.setQueryData(key, data);
  }
  return {
    timestamp: Date.now(),
    buster: CACHE_SCHEMA_VERSION,
    clientState: dehydrate(client),
  };
}

function persistedKeysFor(userId: string): unknown[][] {
  const raw = store[persistedCacheKey(userId)];
  if (!raw) return [];
  const parsed = JSON.parse(raw) as PersistedClient;
  return parsed.clientState.queries.map((q) => q.queryKey as unknown[]);
}

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
});

describe("A07: the envelope is filtered at the right level", () => {
  it("writes the allowlisted queries and drops the rest", async () => {
    const persister = createEncryptedPersister({ userId: USER_A });

    await persister.persistClient(
      envelopeWith([
        [["chart-full", "chart-1"], { rasi: 3 }],
        [["dasha-timeline", "chart-1"], { periods: [] }],
        [["panchangam-day", "2026-10-07", 13.08, 80.27], { tithi: 5 }],
        // Not on the allowlist. Several of these match none of the old
        // denylist's substrings, which is why it is an allowlist now.
        [["family-vaults"], { items: [{ familyVaultId: "v1" }] }],
        [["my-subscription"], { tier: "premium" }],
        [["notification-inbox"], { items: [] }],
        [["synastry", "m1", "v1"], { score: 71 }],
        [["porutham", 5, 9], { total: 7 }],
      ]),
    );

    const kept = persistedKeysFor(USER_A).map((k) => k[0]);
    expect(kept.sort()).toEqual(["chart-full", "dasha-timeline", "panchangam-day"]);
  });

  it("drops an unknown query key rather than keeping it", async () => {
    // The default for a key nobody has classified is "do not persist". A new
    // feature should have to opt in, in a diff a reviewer can see.
    const persister = createEncryptedPersister({ userId: USER_A });
    await persister.persistClient(envelopeWith([[["brand-new-private-thing", "x"], { secret: 1 }]]));
    expect(persistedKeysFor(USER_A)).toEqual([]);
  });

  it("never persists mutations", async () => {
    const persister = createEncryptedPersister({ userId: USER_A });
    const envelope = envelopeWith([[["chart-full", "chart-1"], { rasi: 3 }]]);
    // Dehydrate does not emit mutations for an idle client, so plant one.
    envelope.clientState.mutations = [
      { mutationKey: ["update-profile"], state: { variables: { birthTimeLocal: "06:30" } } } as never,
    ];

    await persister.persistClient(envelope);

    const parsed = JSON.parse(store[persistedCacheKey(USER_A)]) as PersistedClient;
    expect(parsed.clientState.mutations).toEqual([]);
  });

  it("writes nothing at all when there is no authenticated user", async () => {
    // A signed-out process has no namespace to write into, and a guest's cache
    // is not worth the ambiguity about whose it is.
    const persister = createEncryptedPersister({ userId: null });
    await persister.persistClient(envelopeWith([[["chart-full", "chart-1"], { rasi: 3 }]]));
    expect(Object.keys(store)).toEqual([]);
  });
});

describe("A07: the persisted cache is namespaced per account", () => {
  it("uses a different storage key per user", () => {
    expect(persistedCacheKey(USER_A)).not.toEqual(persistedCacheKey(USER_B));
    expect(persistedCacheKey(USER_A)).toContain(USER_A);
  });

  it("A's persisted cache is not visible to B", async () => {
    await createEncryptedPersister({ userId: USER_A }).persistClient(
      envelopeWith([[["chart-full", "chart-a"], { rasi: 3 }]]),
    );

    const restoredForB = await createEncryptedPersister({ userId: USER_B }).restoreClient();
    expect(restoredForB).toBeUndefined();
  });

  it("removeClient removes only the active user's namespace", async () => {
    await createEncryptedPersister({ userId: USER_A }).persistClient(
      envelopeWith([[["chart-full", "chart-a"], { rasi: 3 }]]),
    );
    await createEncryptedPersister({ userId: USER_B }).persistClient(
      envelopeWith([[["chart-full", "chart-b"], { rasi: 7 }]]),
    );

    await createEncryptedPersister({ userId: USER_A }).removeClient();

    expect(store[persistedCacheKey(USER_A)]).toBeUndefined();
    expect(store[persistedCacheKey(USER_B)]).toBeDefined();
  });
});

describe("A07: restore validates what it finds", () => {
  it("discards an envelope written under an older schema version", async () => {
    const stale = envelopeWith([[["chart-full", "chart-a"], { rasi: 3 }]]);
    stale.buster = "v0-something-else";
    store[persistedCacheKey(USER_A)] = JSON.stringify(stale);

    await expect(createEncryptedPersister({ userId: USER_A }).restoreClient()).resolves.toBeUndefined();
  });

  it("discards an envelope older than the maximum age", async () => {
    const old = envelopeWith([[["chart-full", "chart-a"], { rasi: 3 }]]);
    old.timestamp = Date.now() - 1000 * 60 * 60 * 24 * 365;
    store[persistedCacheKey(USER_A)] = JSON.stringify(old);

    await expect(createEncryptedPersister({ userId: USER_A }).restoreClient()).resolves.toBeUndefined();
  });

  it("discards a malformed envelope instead of throwing", async () => {
    store[persistedCacheKey(USER_A)] = '{"timestamp":';
    await expect(createEncryptedPersister({ userId: USER_A }).restoreClient()).resolves.toBeUndefined();

    store[persistedCacheKey(USER_A)] = JSON.stringify({ nope: true });
    await expect(createEncryptedPersister({ userId: USER_A }).restoreClient()).resolves.toBeUndefined();
  });

  it("re-filters on the way in, so a cache written by an older build is still policed", async () => {
    // Retention is not only a write-time decision: a build that persisted more
    // than today's policy allows has already left those rows on the device.
    const permissive = envelopeWith([
      [["chart-full", "chart-a"], { rasi: 3 }],
      [["family-vaults"], { items: [{ familyVaultId: "v1" }] }],
    ]);
    store[persistedCacheKey(USER_A)] = JSON.stringify(permissive);

    const restored = await createEncryptedPersister({ userId: USER_A }).restoreClient();
    expect(restored?.clientState.queries.map((q) => (q.queryKey as unknown[])[0])).toEqual(["chart-full"]);
  });

  it("round-trips an allowlisted query", async () => {
    const persister = createEncryptedPersister({ userId: USER_A });
    await persister.persistClient(envelopeWith([[["dasha-timeline", "chart-a"], { periods: [1, 2] }]]));

    const restored = await persister.restoreClient();
    expect(restored?.clientState.queries).toHaveLength(1);
    expect(restored?.clientState.queries[0].state.data).toEqual({ periods: [1, 2] });
  });
});

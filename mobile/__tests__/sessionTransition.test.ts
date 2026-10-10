/**
 * A02 — private state created under identity A must never be readable under
 * identity B (P1).
 *
 * The React Query client is a process singleton, and `PersistQueryClientProvider`
 * is mounted ABOVE `SessionProvider` in app/_layout.tsx, so it outlives every
 * session. "Sign out" was three unrelated actions — `clearTokens`,
 * `clearSession` (React state only) and a `router.replace` — and none of them
 * touched the cache or the persisted client. The family-vault screen keys its
 * query `["family-vaults"]`, with no account in the key and five minutes of
 * freshness, so after A signed out and B signed in, B was served A's household
 * from cache with zero requests issued.
 *
 * The audit reproduced exactly that against the real cache and the real session
 * functions. These tests drive the single coordinator that now owns the
 * transition, and assert the invariant from the outside: after a transition, a
 * query for the next account must actually execute its query function.
 *
 * WHAT THIS SUITE CANNOT SEE:
 *  - the native screen lifecycle. No component is rendered, so it cannot prove
 *    that `me.tsx`'s sign-out button reaches this coordinator — only that the
 *    coordinator does the right thing when called. The call sites are ordinary
 *    source, and a reviewer has to check them.
 *  - the server's authorization. A user id in a query key is isolation
 *    metadata, not an access check; the backend must still refuse A's chart to
 *    B. That is backend test territory.
 *  - the real persistence subscription's timing. The provider's own
 *    throttled writer is not mounted here; the ordering guarantee this relies
 *    on is tested directly ("a late persistence write cannot repopulate").
 */
const secureStore: { tokens: unknown } = { tokens: null };
const prefs: Record<string, string> = {};
const deviceStore: Record<string, string> = {};

jest.mock("@/lib/secureStore", () => ({
  getTokens: jest.fn(() => Promise.resolve(secureStore.tokens)),
  setTokens: jest.fn((t: unknown) => {
    secureStore.tokens = t;
    return Promise.resolve();
  }),
  clearTokens: jest.fn(() => {
    secureStore.tokens = null;
    return Promise.resolve();
  }),
}));

jest.mock("@/lib/userPrefs", () => ({
  clearUserPrefs: jest.fn(() => {
    for (const k of Object.keys(prefs)) delete prefs[k];
    return Promise.resolve();
  }),
}));

jest.mock("@/lib/analytics", () => ({ setUser: jest.fn() }));

jest.mock("@/lib/encryptedStorage", () => ({
  encryptedStorage: {
    getItem: jest.fn((k: string) => Promise.resolve(deviceStore[k] ?? null)),
    setItem: jest.fn((k: string, v: string) => {
      deviceStore[k] = v;
      return Promise.resolve();
    }),
    removeItem: jest.fn((k: string) => {
      delete deviceStore[k];
      return Promise.resolve();
    }),
  },
  EncryptedStorage: class {},
}));

const mockApiLogout = jest.fn(() => Promise.resolve());
jest.mock("@/api/auth", () => ({ logout: () => mockApiLogout() }));

import { setUser } from "@/lib/analytics";
import { clearTokens } from "@/lib/secureStore";
import { clearUserPrefs } from "@/lib/userPrefs";
import { persistedCacheKey } from "@/lib/encryptedQueryPersister";
import { queryClient, sessionPersister } from "@/lib/queryClient";
import {
  currentGeneration,
  currentUserId,
  resetSessionIdentityForTests,
} from "@/lib/sessionIdentity";
import { beginAuthenticatedSession, endSession } from "@/state/sessionTransition";

const USER_A = "aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb";

beforeEach(() => {
  resetSessionIdentityForTests();
  queryClient.clear();
  secureStore.tokens = null;
  for (const k of Object.keys(prefs)) delete prefs[k];
  for (const k of Object.keys(deviceStore)) delete deviceStore[k];
  mockApiLogout.mockClear();
  jest.mocked(setUser).mockClear();
});

describe("A02: a session transition empties the previous account's cache", () => {
  it("B's query executes instead of being served A's cached value", async () => {
    await beginAuthenticatedSession(USER_A);
    // The exact key and freshness from app/family-vault.tsx.
    queryClient.setQueryData(["family-vaults"], { items: [{ familyVaultId: "A-vault" }] });

    await endSession();
    await beginAuthenticatedSession(USER_B);

    const queryFn = jest.fn(() => Promise.resolve({ items: [{ familyVaultId: "B-vault" }] }));
    const result = await queryClient.fetchQuery({
      queryKey: ["family-vaults"],
      queryFn,
      staleTime: 1000 * 60 * 5,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ items: [{ familyVaultId: "B-vault" }] });
  });

  it("leaves nothing in the cache at all", async () => {
    await beginAuthenticatedSession(USER_A);
    queryClient.setQueryData(["family-vaults"], { items: [] });
    queryClient.setQueryData(["chart-full", "chart-a"], { rasi: 3 });
    queryClient.setQueryData(["my-subscription"], { tier: "premium" });

    await endSession();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("removes the previous account's persisted namespace", async () => {
    await beginAuthenticatedSession(USER_A);
    deviceStore[persistedCacheKey(USER_A)] = JSON.stringify({ timestamp: 1, buster: "x", clientState: { queries: [], mutations: [] } });

    await endSession();

    expect(deviceStore[persistedCacheKey(USER_A)]).toBeUndefined();
  });

  it("clears credentials, preferences and the analytics identity", async () => {
    await beginAuthenticatedSession(USER_A);
    secureStore.tokens = { accessToken: "a", refreshToken: "r" };

    await endSession();

    expect(clearTokens).toHaveBeenCalled();
    expect(clearUserPrefs).toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(null);
    expect(secureStore.tokens).toBeNull();
  });
});

describe("A02: the generation makes late work obsolete", () => {
  it("advances on every transition and never goes backwards", async () => {
    const start = currentGeneration();
    await beginAuthenticatedSession(USER_A);
    await endSession();
    const afterLogout = currentGeneration();
    await beginAuthenticatedSession(USER_B);

    expect(afterLogout).toBeGreaterThan(start);
    expect(currentGeneration()).toBeGreaterThanOrEqual(afterLogout);
    expect(currentUserId()).toBe(USER_B);
  });

  it("a late persistence write cannot repopulate the device after logout", async () => {
    // The real provider subscribes to cache changes and writes on a throttle,
    // so a write can be in flight when the transition starts. Clearing storage
    // once is not enough if that write still has a namespace to land in.
    await beginAuthenticatedSession(USER_A);
    const envelope = {
      timestamp: Date.now(),
      buster: "whatever",
      clientState: { queries: [{ queryKey: ["chart-full", "c"], queryHash: "h", state: { data: { rasi: 3 } } }], mutations: [] },
    };

    await endSession();
    // The straggler arrives now, after the transition.
    await sessionPersister.persistClient(envelope as never);

    expect(Object.keys(deviceStore)).toEqual([]);
  });

  it("a remote logout failure still clears local private state", async () => {
    // Revocation is the server's business; removing this device's copy of the
    // data is not conditional on it.
    mockApiLogout.mockImplementationOnce(() => Promise.reject(new Error("offline")));
    await beginAuthenticatedSession(USER_A);
    queryClient.setQueryData(["family-vaults"], { items: [{ familyVaultId: "A-vault" }] });

    await expect(endSession()).resolves.toBeUndefined();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(clearTokens).toHaveBeenCalled();
    expect(currentUserId()).toBeNull();
  });
});

describe("A02: the signed-in account's own cache is restored", () => {
  it("hydrates the persisted cache when the identity becomes known", async () => {
    // THE GAP THIS CATCHES, found by reading the library rather than by a
    // failing test: `PersistQueryClientProvider` restores exactly once, in a
    // mount effect that runs long before bootstrap knows who is signed in. The
    // persister resolves the account per call, so that restore finds no
    // namespace and returns nothing — and if the coordinator does not restore
    // explicitly afterwards, the persisted cache is written forever and never
    // read. Every cold start would be an empty cache, offline data included,
    // and every other test in this file would still pass.
    await beginAuthenticatedSession(USER_A);
    await sessionPersister.persistClient({
      timestamp: Date.now(),
      buster: "replaced-on-write",
      clientState: {
        queries: [
          {
            queryKey: ["dasha-timeline", "chart-a"],
            queryHash: '["dasha-timeline","chart-a"]',
            state: { data: { periods: ["mahadasha"] }, dataUpdatedAt: Date.now(), status: "success" },
          },
        ],
        mutations: [],
      },
    } as never);

    // A fresh process: nobody signed in, nothing in memory.
    resetSessionIdentityForTests();
    queryClient.clear();
    expect(queryClient.getQueryData(["dasha-timeline", "chart-a"])).toBeUndefined();

    await beginAuthenticatedSession(USER_A);

    expect(queryClient.getQueryData(["dasha-timeline", "chart-a"])).toEqual({
      periods: ["mahadasha"],
    });
  });

  it("does not hydrate another account's cache", async () => {
    await beginAuthenticatedSession(USER_A);
    await sessionPersister.persistClient({
      timestamp: Date.now(),
      buster: "replaced-on-write",
      clientState: {
        queries: [
          {
            queryKey: ["dasha-timeline", "chart-a"],
            queryHash: '["dasha-timeline","chart-a"]',
            state: { data: { periods: ["A"] }, dataUpdatedAt: Date.now(), status: "success" },
          },
        ],
        mutations: [],
      },
    } as never);

    resetSessionIdentityForTests();
    queryClient.clear();
    await beginAuthenticatedSession(USER_B);

    expect(queryClient.getQueryData(["dasha-timeline", "chart-a"])).toBeUndefined();
  });
});

describe("A02: a failed sign-in does not resurrect the previous account", () => {
  it("leaves no cache and no identity when the login never completes", async () => {
    await beginAuthenticatedSession(USER_A);
    queryClient.setQueryData(["family-vaults"], { items: [{ familyVaultId: "A-vault" }] });

    await endSession();
    // ...and the user's next sign-in attempt fails, so no
    // beginAuthenticatedSession call follows.

    expect(currentUserId()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

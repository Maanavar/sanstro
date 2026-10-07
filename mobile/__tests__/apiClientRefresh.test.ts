/**
 * A08 — one refresh and one replay per request, then stop (P2).
 *
 * `fetchWithAuth` ended with:
 *
 *     if (res.status !== 401) return res;
 *     try { await getRefreshPromise(); return fetchWithAuth(url, init); }
 *
 * — a tail call to itself with no marker saying this request had already used
 * its one refresh. A resource that keeps answering 401 for a reason other than
 * an expired access token (a revoked session, a permission change, a server
 * bug) therefore drove an unbounded loop, rotating the refresh token on every
 * pass. The audit's probe allowed four rotations and then failed the fifth
 * deliberately to stop it; the stopping condition came from the probe, never
 * from the client.
 *
 * Rotating repeatedly is worse than looping: each rotation revokes the previous
 * refresh token, so a loop burns the token family, and an interleaved genuine
 * request can then present a revoked token — which the backend correctly reads
 * as a theft signal and answers by revoking everything (see A03). A retry bug
 * could therefore sign the user out of every device.
 *
 * WHAT THIS SUITE CANNOT SEE:
 *  - real network timing. `fetch` is a mock that resolves immediately, so this
 *    proves the retry *structure*, not behaviour under a slow or flapping link.
 *    Deadlines and cancellation (A08 step 7) are not implemented here and are
 *    not claimed.
 *  - navigation. `expo-router` is mocked, so "the user is sent to login" is
 *    asserted as a call, not as a screen.
 *  - whether replaying a mutation is safe. These tests use GET. A POST whose
 *    outcome is uncertain needs an idempotency key rather than an automatic
 *    replay, which is a backend contract this change does not add.
 */
// The mock object is built INSIDE the factory and read back afterwards. Jest
// hoists `jest.mock` above the module body, so a factory that returns
// `{ router: someConst }` captures that const before its initialiser has run
// and hands the module under test `undefined`. Factories that dereference
// lazily inside a function (every other mock here) are unaffected.
jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

const mockTokenStore: { tokens: { accessToken: string; refreshToken: string } | null } = {
  tokens: { accessToken: "access-1", refreshToken: "refresh-1" },
};
jest.mock("@/lib/secureStore", () => ({
  getTokens: jest.fn(() => Promise.resolve(mockTokenStore.tokens)),
  setTokens: jest.fn((t: { accessToken: string; refreshToken: string }) => {
    mockTokenStore.tokens = t;
    return Promise.resolve();
  }),
  clearTokens: jest.fn(() => {
    mockTokenStore.tokens = null;
    return Promise.resolve();
  }),
}));

const mockEndSession = jest.fn(() => Promise.resolve());
jest.mock("@/state/sessionTransition", () => ({ endSession: () => mockEndSession() }));

jest.mock("@/lib/env", () => ({ ENV: { API_BASE_URL: "https://api.test" } }));

import { router } from "expo-router";

import { fetchWithAuth } from "@/api/client";
import {
  beginTransition,
  completeTransition,
  resetSessionIdentityForTests,
} from "@/lib/sessionIdentity";

const mockRouter = router as unknown as { replace: jest.Mock };

/** Count protected-resource calls and refresh calls separately. */
function installFetch(options: {
  resource: (callIndex: number) => { status: number };
  refresh?: (callIndex: number) => { status: number };
}) {
  const calls = { resource: 0, refresh: 0 };
  const fetchMock = jest.fn((url: string) => {
    if (url.includes("/auth/mobile/refresh")) {
      calls.refresh += 1;
      const outcome = options.refresh?.(calls.refresh) ?? { status: 200 };
      return Promise.resolve({
        ok: outcome.status >= 200 && outcome.status < 300,
        status: outcome.status,
        json: () =>
          Promise.resolve({
            accessToken: `access-${calls.refresh + 1}`,
            refreshToken: `refresh-${calls.refresh + 1}`,
            expiresIn: 1800,
          }),
      });
    }
    calls.resource += 1;
    const outcome = options.resource(calls.resource);
    return Promise.resolve({ ok: outcome.status >= 200 && outcome.status < 300, status: outcome.status });
  });
  (global as unknown as { fetch: unknown }).fetch = fetchMock;
  return calls;
}

beforeEach(() => {
  resetSessionIdentityForTests();
  completeTransition(1, "aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa");
  mockTokenStore.tokens = { accessToken: "access-1", refreshToken: "refresh-1" };
  mockRouter.replace.mockClear();
  mockEndSession.mockClear();
});

describe("A08: the retry is bounded", () => {
  it("a persistent 401 costs exactly one refresh and one replay", async () => {
    const calls = installFetch({ resource: () => ({ status: 401 }) });

    const response = await fetchWithAuth("/charts");

    expect(response.status).toBe(401);
    // Original + one replay. The pre-fix client recursed without limit.
    expect(calls.resource).toBe(2);
    expect(calls.refresh).toBe(1);
  });

  it("ends the session once the replay also fails", async () => {
    installFetch({ resource: () => ({ status: 401 }) });

    await fetchWithAuth("/charts");

    // A terminal auth outcome goes through the same complete teardown as an
    // explicit sign-out (A02), not a bare clearTokens + navigate.
    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("a 401 that the refresh fixes returns the replayed success", async () => {
    const calls = installFetch({
      resource: (n) => ({ status: n === 1 ? 401 : 200 }),
    });

    const response = await fetchWithAuth("/charts");

    expect(response.status).toBe(200);
    expect(calls.resource).toBe(2);
    expect(calls.refresh).toBe(1);
    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("a failed refresh does not retry the resource at all", async () => {
    const calls = installFetch({
      resource: () => ({ status: 401 }),
      refresh: () => ({ status: 401 }),
    });

    const response = await fetchWithAuth("/charts");

    expect(response.status).toBe(401);
    expect(calls.resource).toBe(1);
    expect(calls.refresh).toBe(1);
    expect(mockEndSession).toHaveBeenCalledTimes(1);
  });

  it("a non-401 error is returned untouched", async () => {
    const calls = installFetch({ resource: () => ({ status: 500 }) });

    const response = await fetchWithAuth("/charts");

    expect(response.status).toBe(500);
    expect(calls.resource).toBe(1);
    expect(calls.refresh).toBe(0);
    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("a 503 from the auth limiter does not sign the user out", async () => {
    // A06 step 4. When Redis is unavailable the backend now answers 503 on auth
    // endpoints rather than allowing unlimited attempts. That is an
    // infrastructure fault, not a rejected credential, so the client must not
    // treat it as one — a sign-out here would turn a brief Redis outage into
    // every signed-in user being logged out. The property held already; it was
    // untested, which is a different thing.
    const calls = installFetch({ resource: () => ({ status: 503 }) });

    const response = await fetchWithAuth("/auth/mobile/login");

    expect(response.status).toBe(503);
    expect(calls.refresh).toBe(0);
    expect(mockEndSession).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockTokenStore.tokens).not.toBeNull();
  });
});

describe("A08: concurrent 401s share one refresh", () => {
  it("three simultaneous 401s cause one rotation, not three", async () => {
    // The single-flight mechanism predates this change and must survive it:
    // three rotations would revoke two tokens that other in-flight requests are
    // still carrying.
    const calls = installFetch({
      resource: (n) => ({ status: n <= 3 ? 401 : 200 }),
    });

    const responses = await Promise.all([
      fetchWithAuth("/charts"),
      fetchWithAuth("/dasha"),
      fetchWithAuth("/transits"),
    ]);

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(calls.refresh).toBe(1);
    expect(calls.resource).toBe(6);
  });
});

describe("A08: work from a dead session cannot publish", () => {
  it("does not write refreshed credentials after the session ended", async () => {
    const calls = installFetch({ resource: () => ({ status: 401 }) });

    // The request starts in the live session, then a logout lands while it is
    // in flight. The refresh must not resurrect credentials for an account that
    // is no longer signed in.
    const inFlight = fetchWithAuth("/charts");
    beginTransition();
    mockTokenStore.tokens = null;
    await inFlight;

    expect(mockTokenStore.tokens).toBeNull();
    // Nothing is replayed for an obsolete generation.
    expect(calls.resource).toBe(1);
    // And the teardown is not run a second time by the straggler.
    expect(mockEndSession).not.toHaveBeenCalled();
  });
});

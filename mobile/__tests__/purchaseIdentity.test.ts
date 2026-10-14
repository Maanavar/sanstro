/**
 * A04 â€” a purchase must be made under the signed-in account's identity (P1).
 *
 * `app/_layout.tsx` called `purchases.logIn(me.userId)` inside the MOUNT-ONLY
 * bootstrap effect. Interactive login in `app/(auth)/login.tsx` updated the app
 * session and never bound the SDK; sign-out never unbound it. `app/premium.tsx`
 * then purchased using whatever identity the SDK happened to hold, and treated
 * `setSession(user, "premium")` â€” a local state write â€” as completion.
 *
 * Two failures follow, and the backend webhook is the thing that notices:
 *
 *   - launch signed out, then sign in and purchase without restarting. The SDK
 *     can still hold its anonymous id, so `app_user_id` is
 *     `$RCAnonymousID:â€¦`, which the backend cannot resolve to an account.
 *   - launch as A, switch to B, purchase. The session belongs to B and the SDK
 *     can still belong to A. A local premium flag hides the mismatch.
 *
 * OWNER DECISION (2026-10-07): purchase and restore are blocked until the
 * purchase adapter confirms it is bound to the signed-in UUID. Nothing is
 * transferred automatically; a mismatched historical receipt is reconciled
 * against provider evidence by hand.
 *
 * Verified against the installed SDK (react-native-purchases 8.12.0) rather
 * than assumed: `logIn(appUserID)`, `logOut()`, `isAnonymous()` and
 * `getAppUserID()` all exist, and `logOut()` is only safe when the SDK is not
 * already anonymous â€” which is why `clearPurchaseIdentity` checks first.
 *
 * WHAT THIS SUITE CANNOT SEE:
 *  - a real store transaction. No purchase, restore, sandbox account or
 *    receipt is involved; the SDK is a stub. Whether a purchase made under the
 *    right identity is *attributed* correctly is a RevenueCat dashboard
 *    question, and the project's alias/transfer settings were never inspected.
 *  - the premium screen. This covers the adapter; that the screen consults it
 *    is ordinary source a reviewer must check.
 *  - anything about entitlement correctness. "Ready for this user" is an
 *    identity claim, not proof the user is entitled to anything.
 */
/**
 * The SDK's identity, held outside the mock object.
 *
 * Not a field on `mockSdk`: a mock whose jest.fn() bodies reference the object
 * they are being assigned to is self-referential, and tsc rejects it with
 * TS7022 rather than inferring a type.
 */
const sdkIdentity = { appUserId: "$RCAnonymousID:initial" };

const mockSdk = {
  logIn: jest.fn((id: string) => {
    sdkIdentity.appUserId = id;
    return Promise.resolve({ customerInfo: {}, created: false });
  }),
  logOut: jest.fn(() => {
    sdkIdentity.appUserId = "$RCAnonymousID:after-logout";
    return Promise.resolve({});
  }),
  isAnonymous: jest.fn(() => Promise.resolve(sdkIdentity.appUserId.startsWith("$RCAnonymousID"))),
  getAppUserID: jest.fn(() => Promise.resolve(sdkIdentity.appUserId)),
};

import {
  __resetPurchaseIdentityForTests,
  __setPurchasesSdkForTests,
  assertPurchaseReady,
  clearPurchaseIdentity,
  purchaseIdentityState,
  syncPurchaseIdentity,
} from "@/lib/purchaseIdentity";
import {
  beginTransition,
  completeTransition,
  currentGeneration,
  resetSessionIdentityForTests,
} from "@/lib/sessionIdentity";

const USER_A = "aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb";

beforeEach(() => {
  resetSessionIdentityForTests();
  __resetPurchaseIdentityForTests();
  sdkIdentity.appUserId = "$RCAnonymousID:initial";
  mockSdk.logIn.mockClear();
  mockSdk.logOut.mockClear();
  mockSdk.isAnonymous.mockClear();
  mockSdk.getAppUserID.mockClear();
  __setPurchasesSdkForTests(mockSdk as never);
});

describe("A04: binding the SDK to the signed-in account", () => {
  it("becomes ready for the user it was asked to bind", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());

    expect(mockSdk.logIn).toHaveBeenCalledWith(USER_A);
    expect(purchaseIdentityState()).toEqual({ status: "ready", userId: USER_A });
  });

  it("does not call logIn again when already bound to that user", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());
    await syncPurchaseIdentity(USER_A, currentGeneration());

    expect(mockSdk.logIn).toHaveBeenCalledTimes(1);
  });

  it("two concurrent syncs for the same user share one logIn", async () => {
    // Both the session coordinator and app/_layout.tsx's bootstrap ask for the
    // same bind — the coordinator fire-and-forget, bootstrap awaiting it before
    // it reads getCustomerInfo(). Without coalescing the second caller sees
    // "syncing", not "ready", and issues a second logIn for the same account.
    completeTransition(currentGeneration(), USER_A);

    await Promise.all([
      syncPurchaseIdentity(USER_A, currentGeneration()),
      syncPurchaseIdentity(USER_A, currentGeneration()),
    ]);

    expect(mockSdk.logIn).toHaveBeenCalledTimes(1);
    expect(purchaseIdentityState()).toEqual({ status: "ready", userId: USER_A });
  });

  it("reports failed, not ready, when the SDK rejects the bind", async () => {
    mockSdk.logIn.mockImplementationOnce(() => Promise.reject(new Error("network")));
    completeTransition(currentGeneration(), USER_A);

    await syncPurchaseIdentity(USER_A, currentGeneration());

    expect(purchaseIdentityState().status).toBe("failed");
  });

  it("distinguishes an absent SDK from a failure", async () => {
    // Expo Go and CI have no native bridge, so the module is absent. That must
    // not read as a billing error â€” the original code swallowed both into one
    // silent catch.
    __setPurchasesSdkForTests(null);
    completeTransition(currentGeneration(), USER_A);

    await syncPurchaseIdentity(USER_A, currentGeneration());

    expect(purchaseIdentityState()).toEqual({ status: "unavailable" });
  });
});

describe("A04: a slow bind cannot overwrite a later one", () => {
  it("discards a sync for a superseded session generation", async () => {
    // The A->B switch, with A's logIn still in flight. Without the generation
    // guard the adapter would end up reporting "ready for A" while the app is
    // signed in as B â€” the exact mismatch that lets a purchase be attributed
    // to the wrong account.
    const generationA = currentGeneration();
    completeTransition(generationA, USER_A);

    let releaseA: () => void = () => undefined;
    mockSdk.logIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseA = () => {
            sdkIdentity.appUserId = USER_A;
            resolve({ customerInfo: {}, created: false } as never);
          };
        }),
    );

    const slowSync = syncPurchaseIdentity(USER_A, generationA);

    // B signs in while A's bind is still pending.
    const generationB = beginTransition();
    completeTransition(generationB, USER_B);

    releaseA();
    await slowSync;

    expect(purchaseIdentityState()).not.toEqual({ status: "ready", userId: USER_A });
  });
});

describe("A04: ending the session unbinds billing", () => {
  it("clears readiness and logs the SDK out", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());

    await clearPurchaseIdentity();

    expect(mockSdk.logOut).toHaveBeenCalledTimes(1);
    expect(purchaseIdentityState()).toEqual({ status: "signed-out" });
  });

  it("does not call logOut when the SDK is already anonymous", async () => {
    // Verified against react-native-purchases 8.12.0: logOut() on an already
    // anonymous user is an error, not a no-op. The guide said to check this
    // against the installed SDK rather than calling logout blindly.
    expect(await mockSdk.isAnonymous()).toBe(true);

    await clearPurchaseIdentity();

    expect(mockSdk.logOut).not.toHaveBeenCalled();
    expect(purchaseIdentityState()).toEqual({ status: "signed-out" });
  });

  it("clears local readiness even when the SDK logOut fails", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());
    mockSdk.logOut.mockImplementationOnce(() => Promise.reject(new Error("offline")));

    await clearPurchaseIdentity();

    // Remote unbinding is the provider's business; refusing to drop local
    // billing readiness because the network is down would leave the next
    // account able to purchase under this one's identity.
    expect(purchaseIdentityState()).toEqual({ status: "signed-out" });
  });
});

describe("A04: the purchase gate", () => {
  it("permits a purchase when the SDK agrees with the session", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());

    await expect(assertPurchaseReady(USER_A)).resolves.toBeUndefined();
  });

  it("refuses when the adapter has not bound anybody", async () => {
    completeTransition(currentGeneration(), USER_A);
    await expect(assertPurchaseReady(USER_A)).rejects.toThrow();
  });

  it("refuses when the adapter is bound to a different account", async () => {
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());

    await expect(assertPurchaseReady(USER_B)).rejects.toThrow();
  });

  it("refuses when the SDK's own id disagrees with the adapter's record", async () => {
    // The authority is the SDK, not this module's bookkeeping. If something
    // outside the adapter re-identified the SDK, "ready" is stale and a
    // purchase would be attributed elsewhere.
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());
    sdkIdentity.appUserId = "$RCAnonymousID:someone-else";

    await expect(assertPurchaseReady(USER_A)).rejects.toThrow();
  });

  it("is actually applied before every store transaction", () => {
    /**
     * A source ratchet, because the adapter being correct is not the claim
     * that matters — the claim is that the screen consults it. The original
     * defect was precisely that the purchase path did not ask anyone whose
     * identity it was transacting under.
     *
     * BLIND SPOT: a source match. It proves the call appears before the
     * transaction in the file, not that it is on every reachable path through
     * the function. A screen test rendering the real component would, and does
     * not exist.
     */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");

    const source = readFileSync(path.join(__dirname, "..", "app", "premium.tsx"), "utf-8");

    for (const transaction of ["purchasePackage", "restorePurchases"]) {
      const callIndex = source.indexOf(`Purchases.${transaction}`);
      expect(callIndex).toBeGreaterThan(-1);

      const gateIndex = source.lastIndexOf("assertPurchaseReady", callIndex);
      expect(gateIndex).toBeGreaterThan(-1);
      // And the gate has to be close enough to be guarding this call rather
      // than sitting in an unrelated earlier branch.
      expect(callIndex - gateIndex).toBeLessThan(600);
    }
  });

  it("refuses when the SDK is unavailable", async () => {
    // Not a silent success. The old screen showed a "coming soon" toast and
    // returned, which is fine as UX and was also the only thing standing
    // between an unbound SDK and a purchase.
    __setPurchasesSdkForTests(null);
    completeTransition(currentGeneration(), USER_A);
    await syncPurchaseIdentity(USER_A, currentGeneration());

    await expect(assertPurchaseReady(USER_A)).rejects.toThrow();
  });
});

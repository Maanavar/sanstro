import { isCurrentGeneration } from "./sessionIdentity";

/**
 * Who the purchase SDK is acting for.
 *
 * A04. `app/_layout.tsx` bound RevenueCat inside the MOUNT-ONLY bootstrap
 * effect, so the binding happened once per app launch and never again.
 * Interactive login updated the app session without it; sign-out never
 * unbound it; and `app/premium.tsx` purchased using whatever identity the SDK
 * happened to hold, treating a local `setSession(user, "premium")` as proof of
 * completion.
 *
 * Three concepts were collapsed into one, and this module exists to keep the
 * middle one honest:
 *
 *   who is signed in            → application authentication (sessionIdentity)
 *   who the SDK is acting for   → HERE
 *   what the account may do     → the backend entitlement projection
 *
 * The consequence of collapsing them is not cosmetic. The backend webhook
 * resolves `app_user_id` to a UUID; an anonymous `$RCAnonymousID:…` resolves to
 * nobody, so a purchase made before the SDK was bound cannot be attributed at
 * all.
 *
 * Verified against the installed SDK (react-native-purchases 8.12.0) rather
 * than assumed: `logIn(appUserID)`, `logOut()`, `isAnonymous()` and
 * `getAppUserID()` all exist. `logOut()` on an already-anonymous user is an
 * error rather than a no-op, which is why `clearPurchaseIdentity` asks first —
 * the guide specifically said to check that against the installed SDK instead
 * of calling logout blindly.
 */

/** The parts of the SDK this adapter uses. Narrow on purpose: it is the whole
 *  contract a test has to stand in for, and the whole surface a version bump
 *  could break. */
interface PurchasesSdk {
  logIn: (appUserId: string) => Promise<unknown>;
  logOut: () => Promise<unknown>;
  isAnonymous: () => Promise<boolean>;
  getAppUserID: () => Promise<string>;
}

export type PurchaseIdentityState =
  /** No native bridge or no configured key — Expo Go, CI, web. Not an error. */
  | { status: "unavailable" }
  /** The SDK holds no account of ours. */
  | { status: "signed-out" }
  | { status: "syncing"; userId: string }
  | { status: "ready"; userId: string }
  | { status: "failed"; userId: string; error: string };

let sdkOverride: PurchasesSdk | null | undefined;
let state: PurchaseIdentityState = { status: "signed-out" };

/**
 * The bind currently in flight, so two callers share one `logIn`.
 *
 * Two places legitimately ask for the same bind: the session coordinator on
 * every transition, and `app/_layout.tsx`'s bootstrap, which then needs the
 * binding to have happened before it reads `getCustomerInfo()`. Without
 * coalescing, the second caller sees `status: "syncing"` — not yet `ready` —
 * and issues a second `logIn` for the same user.
 */
let pending: { userId: string; promise: Promise<void> } | null = null;

/**
 * The SDK, or null where there is no native bridge.
 *
 * A static import would run at module load and crash Expo Go, where the JSI
 * modules this needs do not exist. The require has to stay a require — that is
 * the point, not an oversight, and `app/_layout.tsx` carries the same note.
 */
function resolveSdk(): PurchasesSdk | null {
  if (sdkOverride !== undefined) return sdkOverride;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("react-native-purchases") as { default?: PurchasesSdk };
    return module.default ?? null;
  } catch {
    return null;
  }
}

export function purchaseIdentityState(): PurchaseIdentityState {
  return state;
}

/**
 * Bind the SDK to `userId`, if it is not already.
 *
 * `generation` is the session generation the caller began with. A bind for A
 * that completes after the app has moved to B must not publish "ready for A" —
 * the window is small and the consequence is a purchase attributed to the
 * wrong account, which is not a window worth leaving open.
 *
 * Does not throw. Login must not fail because billing is unreachable; the
 * purchase gate is what refuses, at the point where it matters.
 */
export function syncPurchaseIdentity(userId: string, generation: number): Promise<void> {
  const sdk = resolveSdk();
  if (!sdk) {
    state = { status: "unavailable" };
    return Promise.resolve();
  }

  if (state.status === "ready" && state.userId === userId) return Promise.resolve();
  if (pending && pending.userId === userId) return pending.promise;

  const promise = (async () => {
    state = { status: "syncing", userId };
    try {
      await sdk.logIn(userId);
      if (!isCurrentGeneration(generation)) {
        // A later transition owns the session now. Saying nothing is correct:
        // that transition runs its own sync.
        return;
      }
      state = { status: "ready", userId };
    } catch (error) {
      if (!isCurrentGeneration(generation)) return;
      state = {
        status: "failed",
        userId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })().finally(() => {
    if (pending?.userId === userId) pending = null;
  });

  pending = { userId, promise };
  return promise;
}

/**
 * Drop billing readiness and unbind the SDK.
 *
 * Local readiness is cleared FIRST and unconditionally. Remote unbinding is the
 * provider's business; refusing to drop the local flag because the network is
 * down would leave the next account able to purchase under this one's identity,
 * which is the failure this whole module exists to prevent.
 */
export async function clearPurchaseIdentity(): Promise<void> {
  state = { status: "signed-out" };
  // A bind still in flight belongs to the session being ended. Dropping the
  // handle stops a later caller joining it and inheriting its result; the
  // generation guard inside it already prevents it publishing readiness.
  pending = null;

  const sdk = resolveSdk();
  if (!sdk) {
    state = { status: "unavailable" };
    return;
  }

  try {
    // logOut() on an already-anonymous user throws in this SDK version, and
    // there is nothing to unbind in that case anyway.
    if (await sdk.isAnonymous()) return;
    await sdk.logOut();
  } catch {
    // Already anonymous, offline, or the SDK is unhappy. Local state is
    // already cleared, which is the part that protects the next account.
  }
}

export class PurchaseIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseIdentityError";
  }
}

/**
 * Throw unless a purchase or restore right now would be attributed to `userId`.
 *
 * Checks this module's record AND asks the SDK, because the SDK is the
 * authority and this module's record is only a cache of it. Provider identity
 * cannot be inferred from the current screen, and it cannot be inferred from
 * our own bookkeeping either.
 */
export async function assertPurchaseReady(userId: string): Promise<void> {
  if (state.status !== "ready") {
    throw new PurchaseIdentityError(`purchase identity is "${state.status}", not ready`);
  }
  if (state.userId !== userId) {
    throw new PurchaseIdentityError("purchase identity belongs to a different account");
  }

  const sdk = resolveSdk();
  if (!sdk) {
    throw new PurchaseIdentityError("purchase SDK is unavailable");
  }

  const sdkUserId = await sdk.getAppUserID();
  if (sdkUserId !== userId) {
    throw new PurchaseIdentityError("the purchase SDK is bound to a different account");
  }
}

/** Test seam: pass the stub SDK, or null to simulate Expo Go. */
export function __setPurchasesSdkForTests(sdk: PurchasesSdk | null): void {
  sdkOverride = sdk;
}

export function __resetPurchaseIdentityForTests(): void {
  sdkOverride = undefined;
  state = { status: "signed-out" };
  pending = null;
}

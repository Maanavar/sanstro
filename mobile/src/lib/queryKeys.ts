import { currentUserId } from "./sessionIdentity";

/**
 * Namespace a private query key by the account it belongs to.
 *
 * A02 step 8. A query key IS the identity of cached data: if A and B use the
 * same key, the cache treats their two responses as one resource unless
 * something resets or partitions it. Most keys in this app already carry a
 * chart or member id, which are UUIDs the other account never asks for, so
 * they are partitioned by accident of their arguments. A handful name no
 * account at all —
 *
 *     ["family-vaults"]  ["notification-prefs"]  ["notification-inbox"]
 *     ["my-subscription"]  ["ask-vinaadi-status"]
 *
 * — and those are the shape that produced the finding: A signed out, B signed
 * in, and `["family-vaults"]` returned A's household with no request issued.
 *
 * THIS IS DEFENCE IN DEPTH, NOT THE FIX. The fix is that a session transition
 * now clears the cache (src/state/sessionTransition.ts); that is what the
 * regression tests assert. This makes the collision impossible to express in
 * the first place, so a future path that forgets to clear — or clears late —
 * still cannot serve one account's row to another.
 *
 * It is NOT an authorization check. A user id in a client-side cache key is
 * isolation metadata; the server must still refuse A's data to B.
 */
export function accountKey(...rest: readonly unknown[]): unknown[] {
  // Reads the authoritative identity rather than a prop, so a screen cannot
  // scope a key to a stale user it captured on an earlier render. The session
  // coordinator advances this before any teardown, so a key built during a
  // transition belongs to nobody — which is correct, and cannot alias either
  // account.
  return ["user", currentUserId() ?? "anonymous", ...rest];
}

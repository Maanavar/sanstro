import { persistQueryClientRestore } from "@tanstack/react-query-persist-client";

import { logout as revokeRemoteSession } from "@/api/auth";
import { setUser } from "@/lib/analytics";
import { PERSIST_BUSTER, queryClient, sessionPersister } from "@/lib/queryClient";
import { clearTokens } from "@/lib/secureStore";
import {
  beginTransition,
  completeSignedOut,
  completeTransition,
  currentUserId,
  isCurrentGeneration,
} from "@/lib/sessionIdentity";
import { clearUserPrefs } from "@/lib/userPrefs";

/**
 * The one place a session starts or ends.
 *
 * A02. Before this, "sign out" was a handful of smaller actions spread across
 * `app/(tabs)/me.tsx`, `src/state/sessionContext.tsx` and the API client's 401
 * path: clear the tokens, set some React state, navigate. None of them touched
 * the React Query cache or the persisted client, and the query client is a
 * process singleton mounted above the session provider — so it survived all of
 * them. A signed out, B signed in during the same app lifetime, and a query
 * keyed `["family-vaults"]` served A's household to B without a request.
 *
 * The invariant this file owns:
 *
 *   Private state created under identity A must never be readable or writable
 *   under identity B, including by delayed asynchronous work.
 *
 * ORDER IS THE DESIGN, not a style choice:
 *
 *   1. advance the generation first, so everything already in flight is
 *      obsolete before anything is torn down. `currentUserId()` becomes null at
 *      the same instant, which is what turns a late persistence write into a
 *      no-op — the persister resolves the account per call and has no namespace
 *      to write into.
 *   2. cancel in-flight queries, so work that CAN be stopped is stopped.
 *   3. remove the departing account's persisted cache, by its own namespaced
 *      key, captured before step 1 cleared it.
 *   4. clear the in-memory cache.
 *   5. clear credentials and preferences.
 *   6. drop the analytics identity.
 *
 * Steps 3–6 are each independently best-effort: a failure in one must not leave
 * the others undone, because every one of them is a removal. In particular the
 * remote revocation is NOT a precondition — the server's view of the session is
 * the server's business, and refusing to clear this device's copy of the data
 * because the network is down would be exactly backwards.
 */

interface EndSessionOptions {
  /**
   * Ask the backend to revoke the refresh token. Skipped when the session is
   * already known to be dead — a terminal 401 has nothing left to revoke, and
   * trying would recurse through the same client that produced the 401.
   */
  revokeRemote?: boolean;
}

export async function endSession(options: EndSessionOptions = {}): Promise<void> {
  const { revokeRemote = true } = options;
  const departing = currentUserId();

  if (revokeRemote) {
    try {
      await revokeRemoteSession();
    } catch {
      // Offline, already-revoked, or a server error. Local teardown proceeds.
    }
  }

  // 1 — nothing started before this line may publish after it.
  const generation = beginTransition();

  // 2 — stop what can be stopped.
  try {
    await queryClient.cancelQueries();
  } catch {
    // Cancellation is best effort; the clear below is what guarantees the end
    // state, and the generation guard is what stops a straggler publishing.
  }

  // 3 — the departing account's bytes, under the key only it used.
  if (departing) {
    try {
      await sessionPersister.removeClientFor(departing);
    } catch {
      // Storage unavailable. The in-memory clear still happens.
    }
  }

  // 4 — the shared, process-wide cache.
  queryClient.clear();

  // 5 and 6.
  try {
    await clearTokens();
  } catch {
    // Keychain unavailable.
  }
  try {
    await clearUserPrefs();
  } catch {
    // Device storage unavailable.
  }
  setUser(null);

  completeSignedOut(generation);
}

/**
 * Establish `userId` as the live session.
 *
 * Called on interactive login, on bootstrap when stored credentials resolve to
 * an account, and on an account switch. It takes the same path every time,
 * which is the point: `app/(auth)/login.tsx` used to set React session state
 * without the rest of the app learning whose data it was now holding.
 *
 * Credentials and identity are established BEFORE the account's cache is
 * restored or its queries run (A02 step 7), so nothing can fetch or persist
 * against an account that is not yet live.
 */
export async function beginAuthenticatedSession(userId: string): Promise<void> {
  if (currentUserId() === userId) {
    // Already live — re-establishing would needlessly discard a warm cache.
    setUser(userId);
    return;
  }

  const generation = beginTransition();

  // A different account was live in this process: its cache must not be
  // readable under the new identity.
  queryClient.clear();

  if (!completeTransition(generation, userId)) {
    // A later transition superseded this one while we were clearing. It owns
    // the end state; do nothing further.
    return;
  }

  // NOW restore this account's persisted cache — after the identity is live,
  // never before (A02 step 7).
  //
  // This call is not optional plumbing. `PersistQueryClientProvider` restores
  // exactly once, in a mount effect, which runs long before bootstrap knows who
  // is signed in; and the persister resolves the account per call, so that
  // restore necessarily found no namespace and returned nothing. Without this,
  // the persisted cache would be written and never read, and every cold start
  // would be an empty cache with no offline data at all — a silent regression
  // in the behaviour A07's allowlist exists to permit.
  try {
    await persistQueryClientRestore({
      queryClient,
      persister: sessionPersister,
      buster: PERSIST_BUSTER,
    });
  } catch {
    // An unreadable cache is an empty cache. Queries refetch.
  }

  // A transition that landed while the restore was in flight owns the cache
  // now, and what was just hydrated belongs to the previous identity.
  if (!isCurrentGeneration(generation)) {
    queryClient.clear();
    return;
  }

  setUser(userId);
}

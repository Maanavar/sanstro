/**
 * Who this process is acting for, and which login lifecycle that is.
 *
 * A02. "Sign out" existed as several smaller actions in several places —
 * `clearTokens` here, `clearSession` (React state) there, a `router.replace`
 * after it — and nothing owned the end state. The React Query client is a
 * process singleton mounted ABOVE the session provider, so it survived every
 * one of them: A signed out, B signed in during the same app lifetime, and a
 * query keyed `["family-vaults"]` returned A's data to B without issuing a
 * single request.
 *
 * This module holds the two facts every other part of the transition needs:
 *
 *   userId      — whose private data may be read or written right now.
 *   generation  — which login lifecycle an asynchronous operation belongs to.
 *
 * The generation is the part that cannot be done with `userId` alone. A request
 * that is already in flight cannot always be physically cancelled, so it has to
 * be *prevented from publishing* when it comes back late. It captures the
 * generation at the start and compares before writing anything — credentials,
 * cache, or a response handed to a caller.
 *
 * Deliberately module state and not React state: the API client and the cache
 * persister both need it, neither is a component, and a React re-render is not
 * a safe boundary for "may this write land".
 */

export interface SessionIdentity {
  /** The authenticated account, or null when signed out or still unknown. */
  userId: string | null;
  /** Increments on every session boundary. Never reused within a process. */
  generation: number;
  /** True between ending one session and establishing the next. */
  transitioning: boolean;
}

let state: SessionIdentity = { userId: null, generation: 1, transitioning: false };

export function currentSession(): SessionIdentity {
  return state;
}

export function currentUserId(): string | null {
  return state.userId;
}

export function currentGeneration(): number {
  return state.generation;
}

/**
 * Begin ending or replacing the current session.
 *
 * Advances the generation FIRST, before any clearing happens, so that work
 * started under the old session is already obsolete by the time the cache and
 * credentials are torn down. Returns the new generation.
 */
export function beginTransition(): number {
  state = { userId: null, generation: state.generation + 1, transitioning: true };
  return state.generation;
}

/**
 * The transition finished and this account is now live.
 *
 * Takes the generation the caller began with, so a slow transition for A cannot
 * publish an identity on top of a later transition to B. Returns false when the
 * caller's generation has been superseded, in which case it did nothing.
 */
export function completeTransition(generation: number, userId: string): boolean {
  if (generation !== state.generation) return false;
  state = { userId, generation, transitioning: false };
  return true;
}

/** The transition finished with nobody signed in. */
export function completeSignedOut(generation: number): boolean {
  if (generation !== state.generation) return false;
  state = { userId: null, generation, transitioning: false };
  return true;
}

/** True when work started at `generation` may still publish its result. */
export function isCurrentGeneration(generation: number): boolean {
  return generation === state.generation;
}

/** Test-only: return to a pristine process state. */
export function resetSessionIdentityForTests(): void {
  state = { userId: null, generation: 1, transitioning: false };
}

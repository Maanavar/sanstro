import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConsentState, MeResponse, OptionalConsents } from "@vinaadi/shared/api/auth";
import { getMe, recordConsent, updateMyConsents } from "@/api/auth";
import { setAnalyticsConsent } from "@/lib/analytics";
import { saveGuestPrefs } from "@/features/guest/guestStore";
import { accountKey } from "@/lib/queryKeys";
import { useSession } from "@/hooks/useSession";

export const ME_QUERY_KEY = () => accountKey("me");

/**
 * The signed-in account's consent answers (admin spec L2), one cache entry for
 * every mobile surface that reads them: the consent sheet, Notification
 * settings, the inbox notice and the Me tab. A change made on one is seen by
 * the others without a refetch.
 *
 * `null` while signed out or loading. Callers treat null as "do not know", not
 * as "not granted": nothing here may show a paused-alerts notice to a user
 * whose answer simply has not arrived.
 */
export function useMyConsents() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ME_QUERY_KEY(),
    queryFn: getMe,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  function applyConsents(next: ConsentState) {
    qc.setQueryData<MeResponse>(ME_QUERY_KEY(), (prev) => (prev ? { ...prev, consents: next } : prev));
    // The analytics transport has its own gate, read before every event; keep
    // it in step with the account's answer wherever that answer changed.
    setAnalyticsConsent(next.analytics);
    void saveGuestPrefs({ analyticsOptedIn: next.analytics }).catch(() => undefined);
  }

  /** Grant or withdraw optional purposes. Throws on failure; the cache is unchanged then. */
  async function change(changes: Partial<OptionalConsents>, lang: "ta" | "en"): Promise<void> {
    applyConsents(await updateMyConsents({ ...changes, lang }));
  }

  /** Answer the consent sheet. Throws on failure. */
  async function answer(
    answers: { adultConfirmed?: boolean; consents: OptionalConsents },
    lang: "ta" | "en",
  ): Promise<void> {
    const updated = await recordConsent({ ...answers, lang });
    qc.setQueryData<MeResponse>(ME_QUERY_KEY(), updated);
    applyConsents(updated.consents);
  }

  return {
    me: user ? (me ?? null) : null,
    consents: user ? (me?.consents ?? null) : null,
    change,
    answer,
  };
}

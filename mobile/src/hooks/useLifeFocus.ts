import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLifeMode, updateLifeMode, type LifeMode, type LifeModeStatus } from "@/api/lifeMode";
import { useSession } from "@/hooks/useSession";

/**
 * The reader's life focus on mobile (docs/LIFE_FOCUS_PLAN_2026-09-22.md,
 * Phase 3). One query key, so the Today chip, the Me card and the Ask chips
 * all move together when the focus changes.
 *
 * Mobile shows and changes the focus; it does not reorder Today (that waits
 * for an equivalent Today layout). The daily tips and the push line lean on
 * the focus server-side, so they follow without anything here.
 */
export const LIFE_MODE_QUERY_KEY = ["life-mode"] as const;

export function useLifeFocus() {
  const { tier } = useSession();
  const queryClient = useQueryClient();
  const signedIn = tier !== "guest";

  const query = useQuery({
    queryKey: LIFE_MODE_QUERY_KEY,
    queryFn: getLifeMode,
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (mode: LifeMode) => updateLifeMode(mode),
    onSuccess: (status: LifeModeStatus) => {
      queryClient.setQueryData(LIFE_MODE_QUERY_KEY, status);
    },
  });

  return {
    signedIn,
    status: query.data ?? null,
    mode: (query.data?.mode ?? "BALANCED") as LifeMode,
    blockedModes: query.data?.blockedModes ?? [],
    setMode: (mode: LifeMode) => mutation.mutateAsync(mode),
    saving: mutation.isPending,
  };
}

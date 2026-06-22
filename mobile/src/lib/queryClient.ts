import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const H = (n: number) => 1000 * 60 * 60 * n;
const D = (n: number) => H(24 * n);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: H(1),
      gcTime:    D(30), // keep persisted cache for up to 30 days (jadhagam TTL)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vinaadi_rq_cache",
});

// Cache TTLs aligned to Section 9 of the mobile gap-closure architecture.
// staleTime = how long before React Query considers data stale and refetches.
// gcTime on the QueryClient (30d) covers the longest-lived entry (jadhagam).
export const STALE = {
  // Today tab — all cards show "last load" data until next day
  today:         D(1),
  guidance:      D(1),
  rasiPalan:     D(1),
  dailyScore:    D(1),

  // Panchangam
  panchangam:    D(1),   // daily timings
  calendar:      D(7),   // monthly calendar grid

  // Personal chart data
  dasha:         D(7),
  jadhagam:      D(30),
  varshaphala:   D(7),
  transits:      H(6),   // planet positions change intra-day

  // Misc
  profile:       D(1),
  notifications: 1000 * 60, // 1 minute
  tools:         0,          // always stale — user-triggered, result must be fresh
} as const;

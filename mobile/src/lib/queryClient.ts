import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vinaadi_rq_cache",
});

export const STALE = {
  guidance:     1000 * 60 * 60,
  panchangam:   1000 * 60 * 60 * 12,
  rasiPalan:    1000 * 60 * 60 * 12,
  profile:      1000 * 60 * 60 * 24,
  notifications: 1000 * 60,
  tools:        0,
} as const;

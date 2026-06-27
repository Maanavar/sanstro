import { QueryClient } from "@tanstack/react-query";

export const STALE = {
  today: 1000 * 60 * 60 * 24,
  session: 1000 * 60 * 30,
  static: Infinity,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.today,
      retry: 1,
    },
  },
});

import { encryptedStorage, EncryptedStorage } from "./encryptedStorage";

type Persister = {
  persistClient: (clientState: any) => Promise<void>;
  restoreClient: () => Promise<any>;
  removeClient: () => Promise<void>;
};

const SENSITIVE_QUERY_KEY_PATTERNS = [
  "jadhagam",
  "profile",
  "dasha",
  "guidance",
  "transits",
  "chart",
  "varshaphala",
  "panchangam",
  "predictions",
  "peyarchi",
] as const;

function isSensitiveQuery(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return false;
  const firstKey = queryKey[0];
  if (typeof firstKey !== "string") return false;

  return SENSITIVE_QUERY_KEY_PATTERNS.some((pattern) =>
    firstKey.toLowerCase().includes(pattern.toLowerCase())
  );
}

function sanitizeClientState(clientState: any): any {
  if (!clientState?.queries || !Array.isArray(clientState.queries)) {
    return clientState;
  }

  return {
    ...clientState,
    queries: clientState.queries.filter((query: any) => {
      if (!isSensitiveQuery(query.queryKey)) return true;
      return false;
    }),
  };
}

export function createEncryptedPersister(
  options: { key?: string; storage?: EncryptedStorage } = {}
): Persister {
  const { key = "vinaadi_rq_cache", storage = encryptedStorage } = options;

  return {
    persistClient: async (clientState: any) => {
      try {
        const sanitized = sanitizeClientState(clientState);
        const serialized = JSON.stringify(sanitized);
        await storage.setItem(key, serialized);
      } catch (error) {
        console.warn("Failed to persist React Query client state:", error);
      }
    },

    restoreClient: async () => {
      try {
        const cached = await storage.getItem(key);
        if (!cached) return undefined;
        return JSON.parse(cached);
      } catch (error) {
        console.warn("Failed to restore React Query client state:", error);
        return undefined;
      }
    },

    removeClient: async () => {
      try {
        await storage.removeItem(key);
      } catch (error) {
        console.warn("Failed to remove React Query client state:", error);
      }
    },
  };
}

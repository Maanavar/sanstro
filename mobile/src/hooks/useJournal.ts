import { useEffect, useState } from "react";
import {
  loadQuickJournalEntries,
  saveQuickJournalEntry,
  syncQuickJournalEntries,
  type QuickJournalEntry,
} from "@/features/journal/journalStore";

type UseJournalOptions = {
  chartId?: string | null;
  isAuthenticated?: boolean;
};

type SaveJournalEntryOptions = {
  chartId?: string | null;
  sync?: boolean;
};

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("journal_request_failed");
}

async function readJournalEntries(chartId: string | null, isAuthenticated: boolean) {
  if (chartId && isAuthenticated) {
    const result = await syncQuickJournalEntries(chartId);
    return result.entries;
  }
  return loadQuickJournalEntries();
}

export function useJournal({ chartId = null, isAuthenticated = false }: UseJournalOptions) {
  const [entries, setEntries] = useState<QuickJournalEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function refreshEntries(targetChartId: string | null = chartId) {
    setIsRefreshing(true);
    setError(null);
    try {
      const next = await readJournalEntries(targetChartId, isAuthenticated);
      setEntries(next);
      return next;
    } catch (err) {
      const fallback = await loadQuickJournalEntries();
      setEntries(fallback);
      setError(toError(err));
      return fallback;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function saveEntry(entry: QuickJournalEntry, options: SaveJournalEntryOptions = {}) {
    const next = await saveQuickJournalEntry(entry);
    setEntries(next);

    const shouldSync = options.sync ?? true;
    const syncChartId = options.chartId ?? entry.chartId ?? chartId;
    if (shouldSync && syncChartId && isAuthenticated) {
      void refreshEntries(syncChartId);
    }

    return next;
  }

  useEffect(() => {
    let active = true;

    async function hydrate() {
      setIsRefreshing(true);
      setError(null);
      try {
        const next = await readJournalEntries(chartId, isAuthenticated);
        if (active) {
          setEntries(next);
        }
      } catch (err) {
        const fallback = await loadQuickJournalEntries();
        if (active) {
          setEntries(fallback);
          setError(toError(err));
        }
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [chartId, isAuthenticated]);

  return {
    entries,
    error,
    isRefreshing,
    refreshEntries,
    saveEntry,
  };
}

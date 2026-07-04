"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import { STALE } from "@/lib/queryClient";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ContextData,
  JournalEntryData,
  JournalListData,
  JournalRetentionApplyData,
  JournalSettingsData,
  NotificationPreferenceData,
} from "@/lib/types";

type UseJournalDataOptions = {
  lang: Lang;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
};

const journalKeys = {
  settings: ["journal", "settings"] as const,
  notifications: ["journal", "notification-preferences"] as const,
  entries: (chartId: string) => ["journal", "entries", chartId] as const,
  context: (chartId: string) => ["journal", "context", chartId] as const,
};

export function useJournalData({ lang, onStatus, onError }: UseJournalDataOptions) {
  const queryClient = useQueryClient();
  const [entriesChartId, setEntriesChartId] = useState("");
  const [contextChartId, setContextChartId] = useState("");

  const journalSettingsQuery = useQuery({
    queryKey: journalKeys.settings,
    queryFn: async () => {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal");
      return response.data;
    },
    enabled: false,
    staleTime: STALE.session,
    retry: false,
  });

  const notificationPrefsQuery = useQuery({
    queryKey: journalKeys.notifications,
    queryFn: async () => {
      const response = await apiFetchJson<ApiEnvelope<NotificationPreferenceData>>("/api/v1/settings/notifications");
      return response.data;
    },
    enabled: false,
    staleTime: STALE.session,
    retry: false,
  });

  const journalEntriesQuery = useQuery({
    queryKey: journalKeys.entries(entriesChartId),
    queryFn: async () => {
      const response = await apiFetchJson<ApiEnvelope<JournalListData>>(
        `/api/v1/journal${toQuery({ chartId: entriesChartId, limit: 50 })}`,
      );
      return response.data;
    },
    enabled: !!entriesChartId,
    staleTime: STALE.today,
  });

  const contextQuery = useQuery({
    queryKey: journalKeys.context(contextChartId),
    queryFn: async () => {
      const response = await apiFetchJson<{ success: boolean; data: ContextData }>(
        `/api/v1/context${toQuery({ chartId: contextChartId })}`,
      );
      return response.data;
    },
    enabled: !!contextChartId,
    staleTime: STALE.today,
  });

  function reportStatus(message: string) {
    onStatus?.(message);
  }

  function reportError(message: string) {
    onError?.(message);
  }

  const loadJournalSettings = useCallback(async () => {
    await Promise.allSettled([
      journalSettingsQuery.refetch(),
      notificationPrefsQuery.refetch(),
    ]);
  }, [journalSettingsQuery, notificationPrefsQuery]);

  const loadJournalEntries = useCallback((chartId: string) => {
    if (!chartId) return;
    setEntriesChartId(chartId);
    if (chartId === entriesChartId) {
      void queryClient.invalidateQueries({ queryKey: journalKeys.entries(chartId) });
    }
  }, [entriesChartId, queryClient]);

  const loadContextData = useCallback((chartId: string) => {
    if (!chartId) return;
    setContextChartId(chartId);
    if (chartId === contextChartId) {
      void queryClient.invalidateQueries({ queryKey: journalKeys.context(chartId) });
    }
  }, [contextChartId, queryClient]);

  const settingsMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(journalKeys.settings, data);
    },
    onError: (error) => {
      const message = readErrorMessage(error);
      reportError(message);
      reportStatus(message);
    },
  });

  const retentionApplyMutation = useMutation({
    mutationFn: async ({ chartId, dryRun }: { chartId: string; dryRun: boolean }) => {
      const response = await apiFetchJson<ApiEnvelope<JournalRetentionApplyData>>("/api/v1/journal/retention/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, dryRun }),
      });
      return response.data;
    },
    onSuccess: (data) => {
      // A real (non-dry-run) apply archives entries — refresh the list.
      if (!data.dryRun) {
        void queryClient.invalidateQueries({ queryKey: journalKeys.entries(data.chartId) });
      }
    },
    onError: (error) => {
      const message = readErrorMessage(error);
      reportError(message);
      reportStatus(message);
    },
  });

  async function applyJournalRetention(chartId: string, dryRun: boolean): Promise<JournalRetentionApplyData | null> {
    try {
      return await retentionApplyMutation.mutateAsync({ chartId, dryRun });
    } catch {
      return null; // handled in mutation callbacks
    }
  }

  async function saveJournalRetentionDays(days: number) {
    try {
      await settingsMutation.mutateAsync({ journalRetentionDays: days });
      reportStatus(t("settings_retention_saved", lang));
    } catch {
      // handled in mutation callbacks
    }
  }

  async function acknowledgeJournalReminder() {
    const effectiveDays = journalSettingsQuery.data?.journalRetentionDays ?? 365;
    try {
      await settingsMutation.mutateAsync({ journalRetentionDays: effectiveDays, acknowledgeReminder: true });
      reportStatus(t("settings_retention_ack_saved", lang));
    } catch {
      // handled in mutation callbacks
    }
  }

  function setContextData(data: ContextData | null) {
    if (!contextChartId) return;
    queryClient.setQueryData(journalKeys.context(contextChartId), data);
  }

  function setNotificationPrefs(data: NotificationPreferenceData | null) {
    queryClient.setQueryData(journalKeys.notifications, data);
  }

  const journalList = journalEntriesQuery.data;

  return {
    journalSettings: journalSettingsQuery.data ?? null,
    notificationPrefs: notificationPrefsQuery.data ?? null,
    journalEntries: journalList?.items ?? ([] as JournalEntryData[]),
    journalTotal: journalList?.totalCount ?? 0,
    contextData: contextQuery.data ?? null,
    busyJournalSettings: settingsMutation.isPending,
    busyRetentionApply: retentionApplyMutation.isPending,
    applyJournalRetention,
    setContextData,
    setNotificationPrefs,
    loadJournalSettings,
    loadJournalEntries,
    loadContextData,
    saveJournalRetentionDays,
    acknowledgeJournalReminder,
  };
}

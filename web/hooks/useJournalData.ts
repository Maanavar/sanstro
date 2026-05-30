"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ContextData,
  JournalEntryData,
  JournalListData,
  JournalSettingsData,
  NotificationPreferenceData,
} from "@/lib/types";

type UseJournalDataOptions = {
  lang: Lang;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
};

export function useJournalData({ lang, onStatus, onError }: UseJournalDataOptions) {
  const [journalSettings, setJournalSettings] = useState<JournalSettingsData | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferenceData | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntryData[]>([]);
  const [journalTotal, setJournalTotal] = useState(0);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [busyJournalSettings, setBusyJournalSettings] = useState(false);

  function reportStatus(message: string) {
    if (onStatus) onStatus(message);
  }

  function reportError(message: string) {
    if (onError) onError(message);
  }

  async function loadJournalSettings() {
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal");
      setJournalSettings(response.data);
    } catch {
      // keep default if settings are not reachable in current session
    }

    apiFetchJson<ApiEnvelope<NotificationPreferenceData>>("/api/v1/settings/notifications")
      .then((response) => setNotificationPrefs(response.data))
      .catch(() => {});
  }

  function loadJournalEntries(chartId: string) {
    if (!chartId) return;
    apiFetchJson<ApiEnvelope<JournalListData>>(`/api/v1/journal${toQuery({ chartId, limit: 50 })}`)
      .then((response) => {
        setJournalEntries(response.data.items);
        setJournalTotal(response.data.totalCount);
      })
      .catch(() => {});
  }

  function loadContextData(chartId: string) {
    if (!chartId) return;
    apiFetchJson<{ success: boolean; data: ContextData }>(`/api/v1/context${toQuery({ chartId })}`)
      .then((response) => setContextData(response.data))
      .catch(() => {});
  }

  async function saveJournalRetentionDays(days: number) {
    setBusyJournalSettings(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalRetentionDays: days }),
      });
      setJournalSettings(response.data);
      reportStatus(t("settings_retention_saved", lang));
    } catch (error) {
      const message = readErrorMessage(error);
      reportError(message);
      reportStatus(message);
    } finally {
      setBusyJournalSettings(false);
    }
  }

  async function acknowledgeJournalReminder() {
    const effectiveDays = journalSettings?.journalRetentionDays ?? 365;
    setBusyJournalSettings(true);
    try {
      const response = await apiFetchJson<ApiEnvelope<JournalSettingsData>>("/api/v1/settings/journal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalRetentionDays: effectiveDays, acknowledgeReminder: true }),
      });
      setJournalSettings(response.data);
      reportStatus(t("settings_retention_ack_saved", lang));
    } catch (error) {
      const message = readErrorMessage(error);
      reportError(message);
      reportStatus(message);
    } finally {
      setBusyJournalSettings(false);
    }
  }

  return {
    journalSettings,
    notificationPrefs,
    journalEntries,
    journalTotal,
    contextData,
    busyJournalSettings,
    setContextData,
    setNotificationPrefs,
    loadJournalSettings,
    loadJournalEntries,
    loadContextData,
    saveJournalRetentionDays,
    acknowledgeJournalReminder,
  };
}


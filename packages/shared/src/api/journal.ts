import { getApiClient } from "./client";

export interface JournalAnchorData {
  activeDasha: string;
  moonHouseFromMoon: number;
  saturnHouseFromMoon: number;
  moonRasi: string;
  saturnRasi: string;
}

export interface JournalEntryData {
  journalId: string;
  chartId: string;
  entryDate: string;
  lifeArea: string;
  noteText: string;
  tags: string[];
  anchor: JournalAnchorData;
  createdAt: string;
}

export interface JournalCreatePayload {
  chartId: string;
  entryDate: string;
  lifeArea: string;
  noteText: string;
}

export interface JournalListData {
  chartId: string;
  totalCount: number;
  items: JournalEntryData[];
}

export function createJournalEntry(
  payload: JournalCreatePayload,
): Promise<{ success: boolean; data: JournalEntryData }> {
  return getApiClient().post("/journal", payload) as Promise<{
    success: boolean;
    data: JournalEntryData;
  }>;
}

export function listJournalEntries(
  chartId: string,
  limit = 100,
): Promise<{ success: boolean; data: JournalListData }> {
  const q = new URLSearchParams({ chartId, limit: String(limit) });
  return getApiClient().get(`/journal?${q}`) as Promise<{
    success: boolean;
    data: JournalListData;
  }>;
}

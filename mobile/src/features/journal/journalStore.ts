import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJournalEntry } from "@/api/journal";

export const JOURNAL_STORAGE_KEY = "vinaadi:quick-journal:v1";

const BACKEND_AREA: Record<string, string> = {
  love: "relationship",
  money: "finance",
};

const MOMENT_LABEL: Record<string, string> = {
  win: "big win",
  hard_day: "hard day",
  decision: "decision",
  milestone: "milestone",
  quiet: "quiet moment",
};

export interface QuickJournalEntry {
  id: string;
  createdAt: string;
  moment: string;
  area: string;
  note: string;
  chartId: string | null;
  dailyScore: number | null;
  dashaContext: { ta?: string; en?: string } | null;
  activeTransit: unknown | null;
  remoteJournalId?: string | null;
  syncedAt?: string | null;
  syncError?: string | null;
}

export interface JournalSyncResult {
  entries: QuickJournalEntry[];
  syncedCount: number;
  failedCount: number;
}

function isEntry(value: unknown): value is QuickJournalEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QuickJournalEntry>;
  return typeof item.id === "string" && typeof item.createdAt === "string";
}

export async function loadQuickJournalEntries(): Promise<QuickJournalEntry[]> {
  const raw = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

export async function saveQuickJournalEntry(entry: QuickJournalEntry): Promise<QuickJournalEntry[]> {
  const existing = await loadQuickJournalEntries();
  const next = [entry, ...existing].slice(0, 100);
  await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function backendLifeArea(area: string) {
  return BACKEND_AREA[area] ?? area;
}

function entryDate(entry: QuickJournalEntry) {
  const date = new Date(entry.createdAt);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function backendNote(entry: QuickJournalEntry) {
  const note = entry.note.trim();
  if (note.length >= 3) return note;
  const moment = MOMENT_LABEL[entry.moment] ?? entry.moment.replace(/_/g, " ");
  return `Logged ${moment} in ${backendLifeArea(entry.area)}.`;
}

export async function syncQuickJournalEntries(chartId?: string | null): Promise<JournalSyncResult> {
  const entries = await loadQuickJournalEntries();
  let syncedCount = 0;
  let failedCount = 0;

  const next: QuickJournalEntry[] = [];
  for (const entry of entries) {
    if (entry.remoteJournalId) {
      next.push(entry);
      continue;
    }

    const targetChartId = entry.chartId ?? chartId ?? null;
    if (!targetChartId) {
      next.push(entry);
      continue;
    }

    try {
      const response = await createJournalEntry({
        chartId: targetChartId,
        entryDate: entryDate(entry),
        lifeArea: backendLifeArea(entry.area),
        noteText: backendNote(entry),
      });
      syncedCount += 1;
      next.push({
        ...entry,
        chartId: targetChartId,
        remoteJournalId: response.data.journalId,
        syncedAt: new Date().toISOString(),
        syncError: null,
      });
    } catch (error) {
      failedCount += 1;
      next.push({
        ...entry,
        syncError: error instanceof Error ? error.message : "sync_failed",
      });
    }
  }

  await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
  return { entries: next, syncedCount, failedCount };
}

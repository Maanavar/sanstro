"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Which lens the chart reading opens in (FTR-07).
 *
 * `story` is the guided, five-chapter reading; `astrologer` is the complete
 * ledger. Both read the same payload — nothing is computed differently.
 *
 * The default follows the user's existing mode: TRADITIONAL readers asked for
 * the full vocabulary, so they land on the ledger; everyone else lands on the
 * story. A choice made on the toggle is remembered **per device** and never
 * written back to the account mode — the mode drives jargon across the whole
 * app, and flipping one panel's lens is not a request to change all of that.
 */
export type ReadingView = "story" | "astrologer";
export type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

export const READING_VIEW_STORAGE_KEY = "vinaadi.chartReading.view";

export function defaultReadingView(mode: UserMode | undefined): ReadingView {
  return mode === "TRADITIONAL" ? "astrologer" : "story";
}

function readStored(): ReadingView | null {
  try {
    const value = window.localStorage.getItem(READING_VIEW_STORAGE_KEY);
    return value === "story" || value === "astrologer" ? value : null;
  } catch {
    // Private windows, blocked site data, previews: the mode default stands.
    return null;
  }
}

function writeStored(view: ReadingView): void {
  try {
    window.localStorage.setItem(READING_VIEW_STORAGE_KEY, view);
  } catch {
    // Not remembered is fine; the toggle still works for this visit.
  }
}

/**
 * The stored choice is read after mount, not in the state initialiser, so the
 * server render and the first client render agree (the server has no storage)
 * and React never sees a hydration mismatch. A reader who chose the other lens
 * sees the default for one frame.
 */
export function useReadingView(mode: UserMode | undefined): [ReadingView, (view: ReadingView) => void] {
  const [view, setViewState] = useState<ReadingView>(() => defaultReadingView(mode));

  useEffect(() => {
    const stored = readStored();
    if (stored) setViewState(stored);
  }, []);

  const setView = useCallback((next: ReadingView) => {
    setViewState(next);
    writeStored(next);
  }, []);

  return [view, setView];
}

/**
 * Ask the consent sheet to open (admin spec L2).
 *
 * The API client calls this when the server answers `CONSENT_REQUIRED`, so a
 * user who chose "Not now" and then tries to save a birth profile is shown the
 * sheet again instead of a dead-end error: without it a mobile account with no
 * service consent could never save a chart (audit 2026-11-03, Part 3).
 *
 * No imports on purpose: the API client depends on this module, and anything
 * this pulled in would become a cycle through it.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function requestConsentSheet(): void {
  listeners.forEach((listener) => listener());
}

export function onConsentSheetRequested(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

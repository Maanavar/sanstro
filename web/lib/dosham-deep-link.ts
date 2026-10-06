"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * "See the full reckoning" for one dosham (plan 2026-10-06, item 4).
 *
 * The full card sits three layers deep: the collapsed chart reading, its
 * Astrologer view, and that view's Yogas & Doshams section. A link that only
 * scrolled to the section left the reader to find and open the card again.
 * So the request travels in the URL hash, `#dosham-SEVVAI_DOSHAM`, and each
 * layer reacts on its own: the reading opens and switches view, the
 * Astrologer view selects its section, and the matching card opens and
 * scrolls itself into view. No layer needs a handle on another, and a layer
 * that mounts late (the Astrologer view is a lazy chunk) still sees the hash.
 */
const PREFIX = "#dosham-";

function readRequest(): string | null {
  if (typeof window === "undefined") return null;
  const { hash } = window.location;
  return hash.startsWith(PREFIX) ? decodeURIComponent(hash.slice(PREFIX.length)) : null;
}

export function doshamAnchorId(name: string): string {
  return `dosham-${name.toUpperCase()}`;
}

/** Ask every listening layer to open this dosham's card. */
export function requestDoshamCard(name: string): void {
  if (typeof window === "undefined") return;
  const target = `${PREFIX}${encodeURIComponent(name.toUpperCase())}`;
  if (window.location.hash === target) {
    // Same hash twice fires no hashchange; re-announce it.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

/** The dosham currently requested by the hash, or null. Re-renders on change. */
export function useRequestedDosham(): string | null {
  const [requested, setRequested] = useState<string | null>(null);
  useEffect(() => {
    // A counter makes a repeated request for the same dosham still re-run
    // effects that depend on it.
    let tick = 0;
    const sync = () => {
      const name = readRequest();
      tick += 1;
      setRequested(name ? `${name}#${tick}` : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return requested;
}

/** The dosham name inside a value from `useRequestedDosham`. */
export function requestedName(requested: string | null): string | null {
  return requested ? requested.split("#")[0] : null;
}

/**
 * For a dosham card: when this dosham is requested, open the card, bring it
 * into view and move focus to its toggle — the focus ring is the highlight,
 * and a keyboard or screen-reader user lands where a sighted one does.
 */
export function useDoshamCardRequest(name: string, open: () => void, card: RefObject<HTMLElement | null>): void {
  const requested = useRequestedDosham();
  useEffect(() => {
    if (requestedName(requested) !== name.toUpperCase()) return;
    open();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const frame = window.requestAnimationFrame(() => {
      card.current?.scrollIntoView?.({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
      card.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
    // `open` and `card` are stable for a mounted card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, name]);
}

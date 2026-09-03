"use client";

/**
 * Privacy-first product analytics wrapper around PostHog.
 *
 * Design rules for a birth-data app:
 * - No-op unless NEXT_PUBLIC_POSTHOG_KEY is set (so dev/test never phone home).
 * - Autocapture and session recording are OFF — we only send the explicit,
 *   named events below. Birth details, names, and free-text are NEVER sent.
 * - We identify users by their opaque user UUID only — never email.
 * - Respects Do Not Track.
 *
 * All functions are safe to call before init and on the server (they no-op).
 */
import posthog from "posthog-js";

let initialized = false;

function enabled(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
    initialized
  );
}

export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // not configured — stay a no-op

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    autocapture: false, // never auto-scrape inputs/birth data
    capture_pageview: false, // we capture pageviews manually (App Router)
    disable_session_recording: true,
    respect_dnt: true,
    persistence: "localStorage", // first-party only, no tracking cookies
    mask_all_text: true,
    mask_all_element_attributes: true,
  });
  initialized = true;
}

/** Named product event. `props` must contain no PII or birth details. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!enabled()) return;
  posthog.capture(event, props);
}

/** Manual SPA pageview (App Router doesn't fire one on client navigation). */
export function trackPageview(url: string): void {
  if (!enabled()) return;
  posthog.capture("$pageview", { $current_url: url });
}

/** Associate events with an opaque user id. Never pass email or name here. */
export function identifyUser(userId: string): void {
  if (!enabled() || !userId) return;
  posthog.identify(userId);
}

/** Clear identity on sign-out. */
export function resetAnalytics(): void {
  if (!enabled()) return;
  posthog.reset();
}

/**
 * Read a PostHog feature flag synchronously from the local cache.
 * Returns null when PostHog is not initialised (server, no key, or not yet booted).
 * Always call after initAnalytics() has run (i.e. inside a useEffect).
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined | null {
  if (!enabled()) return null;
  return posthog.getFeatureFlag(flagKey) ?? null;
}

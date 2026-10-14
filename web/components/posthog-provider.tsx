"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { captureFirstTouch } from "@/lib/acquisition";
import { initAnalytics, trackPageview } from "@/lib/analytics";

/**
 * Boots PostHog once and records a pageview on every client-side navigation.
 * Renders nothing. No-ops entirely when NEXT_PUBLIC_POSTHOG_KEY is unset, so
 * it's safe to mount unconditionally in the root layout.
 *
 * Uses only usePathname (not useSearchParams) so it doesn't force the whole
 * tree into a Suspense boundary / dynamic rendering. The query string is read
 * from window.location at capture time.
 */
export function PostHogProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // First-party attribution runs whether or not PostHog is configured: it is
    // what the backend's admin acquisition report is built from (GRW-03).
    captureFirstTouch();
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const url =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : pathname;
    trackPageview(url);
  }, [pathname]);

  return null;
}

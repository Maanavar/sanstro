"use client";

/**
 * Sharing that brings people back (GRW-10, GRW-13).
 *
 * Every outgoing link carries the sharer's referral code, so the visitor it
 * brings is credited to them (web/lib/acquisition.ts records `?ref=` as the
 * first touch; the backend counts it). And every share surface offers WhatsApp
 * directly: `navigator.share` does not exist on most desktop browsers or in
 * several in-app webviews, which left those visitors with no way to send it to
 * the family group — the channel this product spreads through.
 */
import { useEffect, useState } from "react";
import { getMyReferral } from "@vinaadi/shared/api/auth";
import "@/lib/api"; // side effect: initialises the shared API client

/** `url` with `?ref=<code>` added (or replaced). Unchanged when there is no code. */
export function withRef(url: string, code: string | null | undefined): string {
  if (!code) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("ref", code);
    return u.toString();
  } catch {
    return url;
  }
}

/** A WhatsApp share link — opens the app on phones, WhatsApp Web on desktop. */
export function whatsappHref(text: string, url?: string): string {
  const body = url ? `${text}\n${url}` : text;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

let cached: Promise<string | null> | null = null;

/** The signed-in reader's referral code, fetched once per page load. */
export function useReferralCode(enabled = true): string | null {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    cached ??= getMyReferral()
      .then((r) => r.data.code)
      .catch(() => {
        cached = null; // retry on the next mount rather than caching a failure
        return null;
      });
    let live = true;
    void cached.then((c) => {
      if (live) setCode(c);
    });
    return () => {
      live = false;
    };
  }, [enabled]);
  return code;
}

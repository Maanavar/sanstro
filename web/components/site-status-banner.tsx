"use client";

import { useEffect, useState } from "react";

import { getSiteStatus, type SiteStatus } from "@vinaadi/shared/api";

import { useLang } from "@/components/lang-toggle";
// For its side effect: lib/api calls initApiClient(). This component can load
// before any other caller, and getSiteStatus() throws synchronously without it.
import "@/lib/api";
import "@/components/site-status-banner.css";

/**
 * The owner's maintenance notice (admin spec L10), on every page, signed in or
 * not. Set from the admin console (`maintenance_banner_en` / `_ta`); renders
 * nothing when neither is set, which is almost always.
 *
 * Not dismissible: it is used for "the site goes down at 10 pm", which a
 * visitor who closed it yesterday still needs to see today.
 *
 * A failed status fetch renders nothing. The banner is a courtesy; the
 * features it describes enforce their own pause server-side.
 */
export function SiteStatusBanner() {
  const [lang] = useLang();
  const [status, setStatus] = useState<SiteStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSiteStatus()
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch(() => {
        /* no banner rather than a broken one */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const banner = status?.banner;
  if (!banner) return null;
  return (
    <div className="site-status-banner" role="status">
      {lang === "ta" ? banner.ta : banner.en}
    </div>
  );
}

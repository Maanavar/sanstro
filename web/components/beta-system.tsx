"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useLang } from "@/components/lang-toggle";
import { BETA, mt } from "@/lib/marketing-i18n";
import "@/app/beta.css";

const BANNER_KEY = "vinaadi_beta_banner_dismissed";
const WELCOME_KEY = "vinaadi_beta_welcome_seen";

/**
 * Sitewide beta layer: a dismissible top banner plus a one-time welcome modal
 * on first visit. State persists in localStorage so we never nag a returning
 * user. Rendered once from the root layout so it covers both the public site
 * and the dashboard — except the dashboard itself, which suppresses this
 * entirely (both the banner and the welcome modal's CTA link to `/beta`, a
 * marketing page, and the dashboard must never link out to the marketing
 * site except sign-out).
 */
export function BetaSystem() {
  const pathname = usePathname();
  const [lang] = useLang();
  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const onDashboard = pathname?.startsWith("/dashboard") ?? false;

  useEffect(() => {
    setMounted(true);
    try {
      setBannerOpen(localStorage.getItem(BANNER_KEY) !== "1");
      setWelcomeOpen(localStorage.getItem(WELCOME_KEY) !== "1");
    } catch {
      // Private mode / storage blocked — show banner, skip the modal nag.
      setBannerOpen(true);
    }
  }, []);

  function dismissBanner() {
    setBannerOpen(false);
    try {
      localStorage.setItem(BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function closeWelcome() {
    setWelcomeOpen(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  // Avoid hydration mismatch: render nothing until we've read localStorage.
  if (!mounted) return null;
  if (onDashboard) return null;

  return (
    <>
      {bannerOpen && (
        <div className="beta-banner" role="region" aria-label="Beta notice">
          <span className="beta-banner__tag">{mt(BETA.badge, lang)}</span>
          <span className="beta-banner__text">{mt(BETA.banner_text, lang)}</span>
          <Link href="/beta" className="beta-banner__cta">
            {mt(BETA.banner_cta, lang)} →
          </Link>
          <button
            type="button"
            className="beta-banner__close"
            onClick={dismissBanner}
            aria-label={mt(BETA.banner_dismiss, lang)}
          >
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {welcomeOpen && (
        <div
          className="beta-modal__overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="beta-welcome-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWelcome();
          }}
        >
          <div className="beta-modal">
            <span className="beta-modal__eyebrow">{mt(BETA.welcome_eyebrow, lang)}</span>
            <h2 id="beta-welcome-title" className="beta-modal__title">
              {mt(BETA.welcome_title, lang)}
            </h2>
            <p className="beta-modal__body">{mt(BETA.welcome_body, lang)}</p>
            <ul className="beta-modal__list">
              {[BETA.welcome_p1, BETA.welcome_p2, BETA.welcome_p3].map((p, i) => (
                <li key={i}>
                  <svg className="beta-modal__check" viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                    <path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{mt(p, lang)}</span>
                </li>
              ))}
            </ul>
            <div className="beta-modal__actions">
              <button type="button" className="beta-modal__primary" onClick={closeWelcome}>
                {mt(BETA.welcome_cta, lang)}
              </button>
              <Link href="/beta" className="beta-modal__secondary" onClick={closeWelcome}>
                {mt(BETA.welcome_secondary, lang)} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

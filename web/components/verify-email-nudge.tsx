"use client";

import { useEffect, useState } from "react";

import { getMe, resendVerificationEmail, type MeResponse } from "@vinaadi/shared/api";

import { useLang } from "@/components/lang-toggle";
// For its side effect: lib/api calls initApiClient(); see site-status-banner.tsx.
import "@/lib/api";
import "@/components/site-status-banner.css";

const DISMISS_KEY = "vinaadi:verify-email-nudge-dismissed";

/**
 * "Confirm your email" bar for signed-in accounts whose address is unproven
 * (`MeResponse.emailVerified`). The Premium trial starts on verification
 * (D-07), and admin roles need it, so an unverified account is missing
 * something real, not a formality.
 *
 * Dismissible for the browser session only: an account that never verifies
 * should be reminded next time. A failed /auth/me renders nothing; the
 * dashboard's own session bootstrap handles a signed-out visitor.
 *
 * New Tamil, pending native review.
 */
export function VerifyEmailNudge() {
  const [lang] = useLang();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [sent, setSent] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    getMe()
      .then((value) => {
        if (!cancelled) setMe(value);
      })
      .catch(() => {
        /* nothing to nudge about without a session */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me || me.emailVerified || dismissed) return null;

  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);
  // No trial while the open beta runs (entitlement_service.start_trial_if_eligible),
  // so the bar promises one only after it.
  const why = me.openBeta
    ? L("Please confirm your email address.", "உங்கள் மின்னஞ்சல் முகவரியை உறுதிசெய்யுங்கள்.")
    : L(
        "Confirm your email address to start your free 7-day Premium trial.",
        "இலவச 7 நாள் பிரீமியம் சோதனையைத் தொடங்க உங்கள் மின்னஞ்சல் முகவரியை உறுதிசெய்யுங்கள்.",
      );

  async function resend() {
    setSent("sending");
    try {
      await resendVerificationEmail();
      setSent("sent");
    } catch {
      setSent("failed");
    }
  }

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: dismissal lasts until reload, which is fine */
    }
    setDismissed(true);
  }

  return (
    <div className="site-status-banner" role="status">
      {why}{" "}
      {sent === "sent" ? (
        L(`We sent a new link to ${me.email}.`, `${me.email} க்குப் புதிய இணைப்பை அனுப்பியுள்ளோம்.`)
      ) : (
        <button
          type="button"
          className="site-status-banner__action"
          onClick={() => void resend()}
          disabled={sent === "sending"}
        >
          {sent === "failed"
            ? L("Could not send. Try again", "அனுப்ப முடியவில்லை. மீண்டும் முயலுங்கள்")
            : L("Send the link again", "இணைப்பை மீண்டும் அனுப்பு")}
        </button>
      )}{" "}
      <button
        type="button"
        className="site-status-banner__action"
        onClick={dismiss}
        aria-label={L("Hide this reminder", "இந்த நினைவூட்டலை மறை")}
      >
        {L("Later", "பிறகு")}
      </button>
    </div>
  );
}

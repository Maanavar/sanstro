"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getMe, recordConsent, type MeResponse, type OptionalConsents } from "@vinaadi/shared/api";

import { useLang } from "@/components/lang-toggle";
import { CONSENTS_CHANGED_EVENT } from "@/lib/analytics";
import { ModalShell } from "@/components/modal-shell";
import { Button, Toggle } from "@/components/ui";
import { ADULT_DECLARATION, CHANGE_LATER, HELD_DATA_NOTICE, OPTIONAL_PURPOSES, SERVICE_PURPOSE } from "@/lib/consent-copy";
// For its side effect: lib/api calls initApiClient(); see site-status-banner.tsx.
import "@/lib/api";
import "./consent-panel.css";

const DISMISS_KEY = "vinaadi:consent-panel-dismissed";

/**
 * The consent panel (admin spec L2), shown when `MeResponse.consentRequired`:
 * the account never consented (a Google sign-up), consented to an older notice,
 * or has not made the 18+ declaration.
 *
 * Non-blocking by decision (app/api/auth.py::record_consent): "Not now" hides
 * it for the browser session. An account with no service consent at all cannot
 * save birth details until it answers (`CONSENT_REQUIRED`), and the panel says so.
 *
 * The optional purposes start at the account's current answers, which are off
 * unless it granted them.
 *
 * Layout (audit U1, 2026-11-03): header with ×, a short lead and the notice
 * link, the held-data notice in full, then labelled Required and
 * Optional groups. Styles in consent-panel.css, on Nova tokens.
 *
 * New Tamil, pending native review.
 */
export function ConsentPanel() {
  const [lang] = useLang();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [serviceAccepted, setServiceAccepted] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [optional, setOptional] = useState<OptionalConsents>({ updates: false, analytics: false, askImprove: false });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    getMe()
      .then((value) => {
        if (cancelled) return;
        setMe(value);
        const current = value.consents;
        if (current) {
          setOptional({ updates: current.updates, analytics: current.analytics, askImprove: current.askImprove });
        }
      })
      .catch(() => {
        /* signed out: the dashboard's own session bootstrap handles it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me || !me.consentRequired || dismissed) return null;

  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);
  const needsAdult = !me.adultDeclared;
  const ready = serviceAccepted && (!needsAdult || adultConfirmed);
  const neverConsented = !me.consents?.service;

  function hide() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: hidden until reload, which is fine */
    }
    setDismissed(true);
  }

  async function save() {
    setSaving(true);
    setFailed(false);
    try {
      const updated = await recordConsent({
        adultConfirmed: needsAdult ? adultConfirmed : undefined,
        consents: optional,
        lang,
      });
      setMe(updated);
      window.dispatchEvent(new CustomEvent(CONSENTS_CHANGED_EVENT, { detail: updated.consents }));
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const title = L("Your privacy choices", "உங்கள் தனியுரிமைத் தேர்வுகள்");

  return (
    <div className="cd-shell cp-host">
      <ModalShell label={title} onClose={hide} overlayClassName="cp-overlay" panelClassName="cp-panel">
        <div className="cp-header">
          <h2 className="cp-title">{title}</h2>
          <button type="button" className="cp-close" onClick={hide} aria-label={L("Close", "மூடு")}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="cp-lead">
          {L("Choose how Vinaadi may use your details.", "உங்கள் விவரங்களை Vinaadi எப்படிப் பயன்படுத்தலாம் என்பதைத் தேர்வு செய்யுங்கள்.")}{" "}
          <Link href="/privacy" target="_blank" rel="noreferrer" className="cp-link">
            {L("Read the privacy notice", "தனியுரிமை அறிவிப்பைப் படிக்கவும்")}
          </Link>
        </p>
        {/* In view, not behind a fold-out: the DPDP §5 notice (owner delegation
            2026-11-03, see HELD_DATA_NOTICE). */}
        <p className="cp-notice">{HELD_DATA_NOTICE[lang]}</p>
        {neverConsented && (
          <p role="note" className="cp-note">
            {L(
              "We cannot save birth details until you agree to the service purpose below.",
              "கீழே உள்ள சேவை நோக்கத்திற்கு நீங்கள் ஒப்புதல் தரும் வரை பிறப்பு விவரங்களைச் சேமிக்க இயலாது.",
            )}
          </p>
        )}

        <section className="cp-group" aria-labelledby="consent-panel-required">
          <h3 id="consent-panel-required" className="cp-group-label">{L("Required", "அவசியம்")}</h3>
          <div className="cp-rows">
            <label className="cp-row cp-row--check">
              <input
                type="checkbox"
                className="cp-check"
                checked={serviceAccepted}
                onChange={(e) => setServiceAccepted(e.target.checked)}
              />
              <span className="cp-row-text">
                <span className="cp-row-title">{SERVICE_PURPOSE.title[lang]}</span>
                <span className="cp-row-desc">{SERVICE_PURPOSE.desc[lang]}</span>
              </span>
            </label>
            {needsAdult && (
              <label className="cp-row cp-row--check">
                <input
                  type="checkbox"
                  className="cp-check"
                  checked={adultConfirmed}
                  onChange={(e) => setAdultConfirmed(e.target.checked)}
                />
                <span className="cp-row-text">
                  <span className="cp-row-title">{ADULT_DECLARATION[lang]}</span>
                </span>
              </label>
            )}
          </div>
        </section>

        <section className="cp-group" aria-labelledby="consent-panel-optional">
          <h3 id="consent-panel-optional" className="cp-group-label">{L("Optional", "விருப்பத்திற்குரியவை")}</h3>
          <div className="cp-rows">
            {OPTIONAL_PURPOSES.map((purpose) => (
              <div key={purpose.key} className="cp-row cp-row--toggle">
                <span className="cp-row-text" id={`consent-panel-${purpose.key}`}>
                  <span className="cp-row-title">{purpose.title[lang]}</span>
                  <span className="cp-row-desc">{purpose.desc[lang]}</span>
                </span>
                <Toggle
                  checked={optional[purpose.key]}
                  label={purpose.title[lang]}
                  onChange={(value) => setOptional((prev) => ({ ...prev, [purpose.key]: value }))}
                />
              </div>
            ))}
          </div>
          <p className="cp-hint">{CHANGE_LATER[lang]}</p>
        </section>

        {failed && (
          <p role="alert" className="cp-error">
            {L("Could not save. Please try again.", "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்.")}
          </p>
        )}
        <div className="cp-actions">
          {/* Says why "Agree" is disabled, which the old panel left to guesswork. */}
          {!ready && (
            <p className="cp-hint" aria-live="polite">
              {needsAdult
                ? L("Tick both required items to continue.", "தொடர, அவசியமான இரண்டையும் தேர்வு செய்யவும்.")
                : L("Tick the required item to continue.", "தொடர, அவசியமானதைத் தேர்வு செய்யவும்.")}
            </p>
          )}
          <Button variant="ghost" onClick={hide}>
            {L("Not now", "இப்போது வேண்டாம்")}
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={!ready || saving}>
            {saving ? L("Saving…", "சேமிக்கிறது…") : L("Agree and continue", "ஒப்புக்கொண்டு தொடரவும்")}
          </Button>
        </div>
      </ModalShell>
    </div>
  );
}

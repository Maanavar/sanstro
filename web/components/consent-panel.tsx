"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getMe, recordConsent, type MeResponse, type OptionalConsents } from "@vinaadi/shared/api";

import { useLang } from "@/components/lang-toggle";
import { CONSENTS_CHANGED_EVENT } from "@/lib/analytics";
import { ModalShell } from "@/components/modal-shell";
import { Button, Toggle } from "@/components/ui";
import { ADULT_DECLARATION, CHANGE_LATER, OPTIONAL_PURPOSES, SERVICE_PURPOSE } from "@/lib/consent-copy";
// For its side effect: lib/api calls initApiClient(); see site-status-banner.tsx.
import "@/lib/api";

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

  const ink = "var(--deepdive-ink, var(--panel-earth-dark))";
  const inkMid = "var(--deepdive-ink-mid, var(--panel-earth))";

  return (
    <ModalShell
      label={L("Your privacy choices", "உங்கள் தனியுரிமைத் தேர்வுகள்")}
      onClose={hide}
      panelStyle={{
        width: "min(520px, 100%)",
        maxHeight: "calc(100dvh - 32px)",
        overflowY: "auto",
        background: "var(--deepdive-surface, var(--panel-cream))",
        border: "1.5px solid var(--deepdive-border-light, var(--panel-tan-light))",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: ink }}>
        {L("Your privacy choices", "உங்கள் தனியுரிமைத் தேர்வுகள்")}
      </h2>
      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.55, color: inkMid }}>
        {L(
          "Vinaadi holds your email, the birth details you enter for yourself and your family, your questions to Ask Vinaadi, and your payment records. Our privacy notice lists each one, why we hold it, and how to withdraw consent, use your rights or complain.",
          "உங்கள் மின்னஞ்சல், உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் நீங்கள் உள்ளிடும் பிறப்பு விவரங்கள், Ask Vinaadi-இடம் கேட்கும் கேள்விகள், கட்டணப் பதிவுகள் ஆகியவற்றை Vinaadi வைத்திருக்கிறது. ஒவ்வொன்றையும், அதை ஏன் வைத்திருக்கிறோம், ஒப்புதலைத் திரும்பப் பெறுவது, உங்கள் உரிமைகளைப் பயன்படுத்துவது, புகார் அளிப்பது எப்படி என்பதையும் எங்கள் தனியுரிமை அறிவிப்பு பட்டியலிடுகிறது.",
        )}{" "}
        <Link href="/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--chart-d1-active)", textDecoration: "underline" }}>
          {L("Read the privacy notice", "தனியுரிமை அறிவிப்பைப் படிக்கவும்")}
        </Link>
      </p>
      {neverConsented && (
        <p role="note" style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: inkMid }}>
          {L(
            "We cannot save birth details until you agree to the service purpose below.",
            "கீழே உள்ள சேவை நோக்கத்திற்கு நீங்கள் ஒப்புதல் தரும் வரை பிறப்பு விவரங்களைச் சேமிக்க இயலாது.",
          )}
        </p>
      )}

      <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.85rem", color: ink, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={serviceAccepted}
          onChange={(e) => setServiceAccepted(e.target.checked)}
          style={{ marginTop: "3px", accentColor: "var(--chart-d1-active)" }}
        />
        <span>
          <strong>{SERVICE_PURPOSE.title[lang]}</strong>
          <span style={{ display: "block", fontSize: "0.78rem", color: inkMid }}>{SERVICE_PURPOSE.desc[lang]}</span>
        </span>
      </label>
      {needsAdult && (
        <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.85rem", color: ink, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={adultConfirmed}
            onChange={(e) => setAdultConfirmed(e.target.checked)}
            style={{ marginTop: "3px", accentColor: "var(--chart-d1-active)" }}
          />
          <span>{ADULT_DECLARATION[lang]}</span>
        </label>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {OPTIONAL_PURPOSES.map((purpose) => (
          <div key={purpose.key} style={{ display: "flex", gap: "12px", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div id={`consent-panel-${purpose.key}`} style={{ fontSize: "0.85rem", color: ink }}>
              {purpose.title[lang]}
              <span style={{ display: "block", fontSize: "0.78rem", color: inkMid }}>{purpose.desc[lang]}</span>
            </div>
            <Toggle
              checked={optional[purpose.key]}
              label={purpose.title[lang]}
              onChange={(value) => setOptional((prev) => ({ ...prev, [purpose.key]: value }))}
            />
          </div>
        ))}
        <p style={{ margin: 0, fontSize: "0.75rem", color: inkMid }}>{CHANGE_LATER[lang]}</p>
      </div>

      {failed && (
        <p role="alert" style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-low)" }}>
          {L("Could not save. Please try again.", "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்.")}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={hide}>
          {L("Not now", "இப்போது வேண்டாம்")}
        </Button>
        <Button variant="primary" onClick={() => void save()} disabled={!ready || saving}>
          {saving ? L("Saving…", "சேமிக்கிறது…") : L("Agree and continue", "ஒப்புக்கொண்டு தொடரவும்")}
        </Button>
      </div>
    </ModalShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getMe, updateMyConsents, type ConsentState, type OptionalConsents } from "@vinaadi/shared/api";

import { CONSENTS_CHANGED_EVENT } from "@/lib/analytics";
import { OPTIONAL_PURPOSES, SERVICE_PURPOSE } from "@/lib/consent-copy";
import type { Lang } from "@/lib/i18n";
import { StatusChip, Toggle } from "./ui";

/**
 * The account's consent answers, kept in step with the consent panel and the
 * other card on the page through `CONSENTS_CHANGED_EVENT`.
 */
function useConsentState(): [ConsentState | null, (next: ConsentState) => void] {
  const [state, setState] = useState<ConsentState | null>(null);
  useEffect(() => {
    let cancelled = false;
    // Through a resolved promise so a client that is not set up yet (a test,
    // a signed-out render) rejects into the catch instead of throwing here.
    Promise.resolve()
      .then(() => getMe())
      .then((me) => {
        if (!cancelled && me.consents) setState(me.consents);
      })
      .catch(() => undefined);
    function onChanged(event: Event) {
      const detail = (event as CustomEvent<ConsentState | undefined>).detail;
      if (detail) setState(detail);
    }
    window.addEventListener(CONSENTS_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(CONSENTS_CHANGED_EVENT, onChanged);
    };
  }, []);
  function publish(next: ConsentState) {
    setState(next);
    window.dispatchEvent(new CustomEvent(CONSENTS_CHANGED_EVENT, { detail: next }));
  }
  return [state, publish];
}

/**
 * Whether the "updates and astro alerts" purpose is granted: `null` while
 * unknown. Server alerts need it (`NEEDS_UPDATES_CONSENT`), so the alert
 * switches read this to stay disabled while it is off; switching them on then
 * would save and still deliver nothing (audit U2, 2026-11-03).
 */
export function useUpdatesConsent(): boolean | null {
  const [state] = useConsentState();
  return state ? state.updates : null;
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xl)",
  padding: "var(--space-6) var(--space-7)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
};
const titleStyle: React.CSSProperties = { fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" };
const descStyle: React.CSSProperties = { fontSize: "var(--text-sm)", color: "var(--color-faint)", marginTop: "3px", lineHeight: 1.5 };

/**
 * Settings → Privacy & Legal: one toggle per optional purpose (admin spec L2,
 * D-10). Withdrawing is one tap, like granting, and applies from the next
 * request. The service purpose is shown, not toggled: withdrawing it is
 * deleting the account, which the Danger zone does.
 *
 * New Tamil, pending native review.
 */
export function PrivacyChoicesCard({ lang }: { lang: Lang }) {
  const [state, publish] = useConsentState();
  const [busy, setBusy] = useState<keyof OptionalConsents | null>(null);
  const [failed, setFailed] = useState(false);
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);

  async function change(key: keyof OptionalConsents, value: boolean) {
    setBusy(key);
    setFailed(false);
    try {
      publish(await updateMyConsents({ [key]: value, lang }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{L("Your consent choices", "உங்கள் ஒப்புதல் தேர்வுகள்")}</div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ ...titleStyle, fontWeight: 500 }}>{SERVICE_PURPOSE.title[lang]}</div>
          {state && (
            <StatusChip
              done={state.service}
              label={state.service ? L("Given", "வழங்கப்பட்டது") : L("Not given", "வழங்கப்படவில்லை")}
            />
          )}
        </div>
        <div style={descStyle}>
          {state?.service
            ? L(
                "Given. To withdraw it, delete your account under Danger zone; everything we hold is then erased.",
                "வழங்கப்பட்டுள்ளது. இதைத் திரும்பப் பெற, ஆபத்துப் பகுதியில் உங்கள் கணக்கை நீக்கவும்; நாங்கள் வைத்திருக்கும் அனைத்தும் அழிக்கப்படும்.",
              )
            : L("Not given yet. Birth details cannot be saved until you agree.", "இன்னும் வழங்கப்படவில்லை. நீங்கள் ஒப்புக்கொள்ளும் வரை பிறப்பு விவரங்களைச் சேமிக்க இயலாது.")}
        </div>
      </div>
      {OPTIONAL_PURPOSES.map((purpose) => (
        <div
          key={purpose.key}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)" }}
        >
          <div style={{ maxWidth: "420px" }}>
            <div style={{ ...titleStyle, fontWeight: 500 }}>{purpose.title[lang]}</div>
            <div style={descStyle}>{purpose.desc[lang]}</div>
          </div>
          <Toggle
            checked={state?.[purpose.key] === true}
            label={purpose.title[lang]}
            disabled={state === null || busy !== null}
            onChange={(value) => void change(purpose.key, value)}
          />
        </div>
      ))}
      {failed && (
        <div role="alert" style={{ fontSize: "var(--text-base)", color: "var(--color-low)" }}>
          {L("Could not save that change. Please try again.", "அந்த மாற்றத்தைச் சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்.")}
        </div>
      )}
    </div>
  );
}

/**
 * Notifications panel: says plainly that alerts stay silent until the
 * "updates and astro alerts" purpose is on, since the server sends none without
 * it (`NEEDS_UPDATES_CONSENT`). Renders nothing once it is.
 */
export function UpdatesConsentNotice({ lang }: { lang: Lang }) {
  const [state, publish] = useConsentState();
  const [busy, setBusy] = useState(false);
  if (!state || state.updates) return null;
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);

  async function allow() {
    setBusy(true);
    try {
      publish(await updateMyConsents({ updates: true, lang }));
    } catch {
      /* the toggle stays off; Settings → Privacy offers it again */
    } finally {
      setBusy(false);
    }
  }

  const purpose = OPTIONAL_PURPOSES.find((p) => p.key === "updates");
  return (
    <div style={{ ...cardStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }} role="note">
      <div style={{ maxWidth: "420px" }}>
        <div style={titleStyle}>{L("Alerts are off until you allow them", "நீங்கள் அனுமதிக்கும் வரை அறிவிப்புகள் அணைந்திருக்கும்")}</div>
        <div style={descStyle}>{purpose?.desc[lang]}</div>
      </div>
      <Toggle checked={false} label={purpose?.title[lang]} disabled={busy} onChange={() => void allow()} />
    </div>
  );
}

/**
 * One line at the top of the bell popover while the "updates" purpose is off
 * (audit F3, 2026-11-03): since L2 the server writes no alert of any kind
 * without it, so an empty bell otherwise reads as "nothing happened today".
 * Mounted inside the popover, so it asks for the answer only when opened.
 */
export function AlertsPausedNote({ lang, onOpenSettings }: { lang: Lang; onOpenSettings?: () => void }) {
  const granted = useUpdatesConsent();
  if (granted !== false) return null;
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);
  const label = L("Allow alerts in Settings", "அமைப்புகளில் அனுமதிக்கவும்");
  return (
    <p className="cd-notif__note" role="note" style={{ color: "var(--color-text)", paddingTop: "12px" }}>
      {L("Alerts are off until you allow them.", "நீங்கள் அனுமதிக்கும் வரை அறிவிப்புகள் அணைந்திருக்கும்.")}{" "}
      {onOpenSettings ? (
        <button type="button" className="cd-notif__action" style={{ display: "inline", padding: 0 }} onClick={onOpenSettings}>
          {label}
        </button>
      ) : (
        <Link href="/dashboard/settings/notifications" className="cd-notif__action" style={{ display: "inline", padding: 0 }}>
          {label}
        </Link>
      )}
    </p>
  );
}

"use client";

import { useState } from "react";
import { createPoruthamShare, revokePoruthamShare } from "@vinaadi/shared/api/porutham-shares";
import { readErrorMessage } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

type CompatibilityContext = "GENERAL" | "MARRIAGE" | "FRIENDSHIP" | "BUSINESS" | "FAMILY";

interface ShareableBirthForm {
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
}

interface PoruthamShareLinkButtonProps {
  lang: Lang;
  formA: ShareableBirthForm;
  formB: ShareableBirthForm;
  compatibilityContext: CompatibilityContext;
  disabled?: boolean;
}

type Stage = "idle" | "creating" | "created" | "revoking" | "revoked";

export function PoruthamShareLinkButton({ lang, formA, formB, compatibilityContext, disabled }: PoruthamShareLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStage("idle");
    setShareId(null);
    setShareUrl(null);
    setCopied(false);
    setError("");
    setLabelA("");
    setLabelB("");
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleGenerate() {
    setStage("creating");
    setError("");
    try {
      const result = await createPoruthamShare({
        personA: {
          birthDateLocal: formA.birthDateLocal,
          birthTimeLocal: formA.birthTimeLocal || null,
          birthPlace: formA.birthPlace,
          birthLatitude: parseFloat(formA.birthLatitude),
          birthLongitude: parseFloat(formA.birthLongitude),
          birthTimezone: formA.birthTimezone,
        },
        personB: {
          birthDateLocal: formB.birthDateLocal,
          birthTimeLocal: formB.birthTimeLocal || null,
          birthPlace: formB.birthPlace,
          birthLatitude: parseFloat(formB.birthLatitude),
          birthLongitude: parseFloat(formB.birthLongitude),
          birthTimezone: formB.birthTimezone,
        },
        compatibilityContext,
        labelA: labelA.trim() || null,
        labelB: labelB.trim() || null,
      });
      setShareId(result.data.shareId);
      setShareUrl(result.data.url);
      setStage("created");
    } catch (err) {
      setError(readErrorMessage(err));
      setStage("idle");
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — user can still select/copy the URL text manually.
    }
  }

  async function handleNativeShare() {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: lang === "ta" ? "Vinaadi AI · பொருத்தம் முடிவு" : "Vinaadi AI · Porutham result",
        url: shareUrl,
      });
    } catch {
      // User cancelled the native share sheet — no-op.
    }
  }

  async function handleRevoke() {
    if (!shareId) return;
    setStage("revoking");
    setError("");
    try {
      await revokePoruthamShare(shareId);
      setStage("revoked");
    } catch (err) {
      setError(readErrorMessage(err));
      setStage("created");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          padding: "8px 20px",
          borderRadius: "10px",
          border: "1px solid var(--color-border-strong, var(--color-border))",
          background: "none",
          color: disabled ? "var(--color-faint)" : "var(--color-accent-strong, var(--color-accent))",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: "0.875rem",
          fontFamily: "inherit",
        }}
      >
        {lang === "ta" ? "இணைப்பைப் பகிரவும்" : "Share result"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "20px",
          }}
          onClick={close}
        >
          <div
            className="card"
            style={{
              width: "min(420px, 100%)", background: "var(--color-surface)",
              border: "1px solid var(--color-border)", borderRadius: "14px",
              padding: "22px", display: "flex", flexDirection: "column", gap: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-strong, var(--color-accent-strong))" }}>
              {lang === "ta" ? "பொருத்தத்தைப் பகிரவும்" : "Share this porutham result"}
            </p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-faint)", lineHeight: 1.5 }}>
              {lang === "ta"
                ? "இந்த இணைப்பு எவரும் கணக்கு இல்லாமல் இந்த முடிவைப் பார்க்க அனுமதிக்கும். 30 நாட்களுக்குப் பிறகு தானாக காலாவதியாகும்."
                : "Anyone with this link can view this result without an account. It expires automatically after 30 days."}
            </p>

            {(stage === "idle" || stage === "creating") && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem", color: "var(--color-faint)" }}>
                  {lang === "ta" ? "நபர் A சிட்டை (விருப்பம்)" : "Label for Person A (optional)"}
                  <input
                    value={labelA}
                    onChange={(e) => setLabelA(e.target.value)}
                    placeholder={lang === "ta" ? "எ.கா. மணமகள்" : "e.g. Bride"}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-strong, inherit)", fontSize: "0.875rem", fontFamily: "inherit" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem", color: "var(--color-faint)" }}>
                  {lang === "ta" ? "நபர் B சிட்டை (விருப்பம்)" : "Label for Person B (optional)"}
                  <input
                    value={labelB}
                    onChange={(e) => setLabelB(e.target.value)}
                    placeholder={lang === "ta" ? "எ.கா. மணமகன்" : "e.g. Groom"}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-strong, inherit)", fontSize: "0.875rem", fontFamily: "inherit" }}
                  />
                </label>
                {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-low)" }}>{error}</p>}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" onClick={close} style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid var(--color-border)", background: "none", color: "var(--color-faint)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {lang === "ta" ? "ரத்து" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={stage === "creating"}
                    style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: "var(--color-accent)", color: "var(--color-on-accent, #fff)", cursor: stage === "creating" ? "wait" : "pointer", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit" }}
                  >
                    {stage === "creating"
                      ? (lang === "ta" ? "உருவாக்குகிறது…" : "Generating…")
                      : (lang === "ta" ? "இணைப்பை உருவாக்கு" : "Generate link")}
                  </button>
                </div>
              </>
            )}

            {(stage === "created" || stage === "revoking") && shareUrl && (
              <>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 12px", borderRadius: "9px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft, var(--color-surface))" }}>
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    style={{ flex: 1, border: "none", background: "none", color: "var(--color-text-strong, inherit)", fontSize: "0.75rem", fontFamily: "inherit" }}
                  />
                  <button type="button" onClick={() => void handleCopy()} style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid var(--color-border)", background: "none", color: "var(--color-accent-strong, var(--color-accent))", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem", fontFamily: "inherit" }}>
                    {copied ? (lang === "ta" ? "நகலெடுக்கப்பட்டது ✓" : "Copied ✓") : (lang === "ta" ? "நகலெடு" : "Copy")}
                  </button>
                </div>
                {typeof navigator !== "undefined" && !!navigator.share && (
                  <button type="button" onClick={() => void handleNativeShare()} style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid var(--color-border)", background: "none", color: "var(--color-accent-strong, var(--color-accent))", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {lang === "ta" ? "பகிர்…" : "Share…"}
                  </button>
                )}
                {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-low)" }}>{error}</p>}
                <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => void handleRevoke()}
                    disabled={stage === "revoking"}
                    style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid var(--color-low)", background: "none", color: "var(--color-low)", cursor: stage === "revoking" ? "wait" : "pointer", fontWeight: 600, fontSize: "0.75rem", fontFamily: "inherit" }}
                  >
                    {stage === "revoking"
                      ? (lang === "ta" ? "நீக்குகிறது…" : "Revoking…")
                      : (lang === "ta" ? "இணைப்பை நீக்கு" : "Revoke link")}
                  </button>
                  <button type="button" onClick={close} style={{ padding: "8px 16px", borderRadius: "9px", border: "none", background: "none", color: "var(--color-faint)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {lang === "ta" ? "மூடு" : "Done"}
                  </button>
                </div>
              </>
            )}

            {stage === "revoked" && (
              <>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-strong, inherit)" }}>
                  {lang === "ta" ? "இணைப்பு நீக்கப்பட்டது. இது இனி வேலை செய்யாது." : "Link revoked. It no longer works."}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={close} style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: "var(--color-accent)", color: "var(--color-on-accent, #fff)", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {lang === "ta" ? "மூடு" : "Close"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

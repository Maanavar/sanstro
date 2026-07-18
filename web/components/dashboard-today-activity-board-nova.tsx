"use client";

/**
 * "What is today good for?" — the green / red light board.
 *
 * The Decide strip above already answers this for one activity the user picks.
 * This answers it for all of them at once, which is the form the question
 * usually arrives in ("what should I do today?") rather than
 * ("is today okay for a job change?").
 *
 * Doctrine notes that shape the presentation:
 * - Green and red are shown; the neutral majority is collapsed behind a toggle.
 *   Listing eleven "routine progress is fine" rows would bury the two lines
 *   that carry information.
 * - On a Chandrashtama day the engine returns no favourable rows at all. The
 *   board says so explicitly rather than rendering an empty green column, so it
 *   reads as a deliberate call and not as missing data.
 * - Amber, not red, and "worth a second look" rather than "do not" — the same
 *   non-fatalist framing the Chandrashtama pill uses. A caution here is a
 *   reason to slow down, not a prohibition.
 */

import React, { useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { DailyActivityBoard, DailyActivityVerdict } from "@/lib/types";

function tx(value: { ta: string; en: string }, lang: Lang): string {
  return lang === "ta" ? value.ta : value.en;
}

function VerdictRow({
  verdict,
  lang,
  tone,
}: {
  verdict: DailyActivityVerdict;
  lang: Lang;
  tone: "good" | "caution";
}) {
  const color = tone === "good" ? "var(--color-high)" : "var(--color-mid)";
  return (
    <li
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        padding: "5px 0",
        lineHeight: 1.45,
      }}
    >
      <span aria-hidden="true" style={{ color, fontWeight: 700, flex: "none" }}>
        {tone === "good" ? "✓" : "!"}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontSize: "13px", color: "var(--color-text)", fontWeight: 600 }}>
          {tx(verdict.label, lang)}
        </span>
        <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
          {" — "}
          {tx(verdict.reason, lang)}
        </span>
      </span>
    </li>
  );
}

export function DashboardTodayActivityBoardNova({
  board,
  lang,
}: {
  board: DailyActivityBoard | null | undefined;
  lang: Lang;
}) {
  const [showNeutral, setShowNeutral] = useState(false);

  // Older cached guidance rows predate this field.
  if (!board) return null;

  const { favourable, caution, neutral, isChandrashtama } = board;
  if (favourable.length === 0 && caution.length === 0 && neutral.length === 0) return null;

  return (
    <section
      aria-label={lang === "ta" ? "இன்று எதற்கு ஏற்றது" : "What today favours"}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        padding: "16px 18px",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--color-text)",
        }}
      >
        {lang === "ta" ? "இன்று எதற்கு ஏற்றது?" : "What is today good for?"}
      </h3>

      {favourable.length > 0 && (
        <>
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--color-high)",
              marginBottom: "2px",
            }}
          >
            {lang === "ta" ? "ஆதரவு உள்ளது" : "Favourable"}
          </div>
          <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0 }}>
            {favourable.map((v) => (
              <VerdictRow key={v.activity} verdict={v} lang={lang} tone="good" />
            ))}
          </ul>
        </>
      )}

      {/* An empty green column on a Chandrashtama day is a decision, not an
          absence — say so, or it reads as a loading failure. */}
      {favourable.length === 0 && isChandrashtama && (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "12.5px",
            lineHeight: 1.5,
            color: "var(--color-muted)",
          }}
        >
          {lang === "ta"
            ? "இன்று சந்திராஷ்டமம் என்பதால் புதிய தொடக்கங்கள் எதுவும் பரிந்துரைக்கப்படவில்லை. வழக்கமான வேலைகள் தொடரலாம்."
            : "Because today is your Chandrashtama, nothing is put forward as a good day to begin. Routine work carries on as normal."}
        </p>
      )}

      {caution.length > 0 && (
        <>
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--color-mid)",
              marginBottom: "2px",
            }}
          >
            {lang === "ta" ? "நிதானம் தேவை" : "Worth a second look"}
          </div>
          <ul style={{ listStyle: "none", margin: "0 0 8px", padding: 0 }}>
            {caution.map((v) => (
              <VerdictRow key={v.activity} verdict={v} lang={lang} tone="caution" />
            ))}
          </ul>
        </>
      )}

      {neutral.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowNeutral((prev) => !prev)}
            aria-expanded={showNeutral}
            style={{
              background: "none",
              border: "none",
              padding: "4px 0 0",
              cursor: "pointer",
              font: "inherit",
              fontSize: "12px",
              color: "var(--color-muted)",
              textDecoration: "underline",
            }}
          >
            {showNeutral
              ? lang === "ta"
                ? "மற்றவற்றை மறை"
                : "Hide the rest"
              : lang === "ta"
                ? `மற்ற ${neutral.length} செயல்கள் — வழக்கம் போல்`
                : `${neutral.length} others — business as usual`}
          </button>
          {showNeutral && (
            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
              {neutral.map((v) => (
                <li
                  key={v.activity}
                  style={{
                    padding: "3px 0",
                    fontSize: "12.5px",
                    color: "var(--color-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  {tx(v.label, lang)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

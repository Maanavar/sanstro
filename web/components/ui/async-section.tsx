"use client";

import type { ReactNode } from "react";

import type { AsyncState } from "@/hooks/useApiQuery";
import type { Lang } from "@/lib/i18n";

/**
 * `<AsyncSection>` — the loading / error / empty paragraphs a panel shows while
 * its data is in flight, in one place.
 *
 * Nineteen files retype these sentences. Measured before centralising them, and
 * the result is worth recording because it cuts against the usual finding: the
 * bare loading line has NOT drifted — all 16 occurrences are byte-identical
 * ("ஏற்றுகிறது…"). So this is consolidation before divergence, F3's case, not
 * F2's.
 *
 * What the sweep did turn up is a construction that must not be folded in here.
 * "ஜாதகம் ஏற்றப்படுகிறது…" / "முகூர்த்த நாட்கள் ஏற்றப்படுகிறது…" are not drifted
 * spellings of the bare line — they name what is loading, and Tamil inflects the
 * verb accordingly. Replacing them with the generic default would be a copy
 * regression, not a cleanup, so they are deliberately left alone and `loading`
 * is overridable for exactly that case.
 *
 * The error line likewise stays per-panel: "Could not load Shadbala." names the
 * thing that failed and a generic "Something went wrong" would be a downgrade.
 * Only the wrapper and the bare loading line are shared.
 *
 * WHERE THE SIX DID DIVERGE: the error *colour*, three ways for the same
 * failure — `--color-mid` (ashtottari, yogini, kalachakra, conditional),
 * `--color-low` (shadbala), and `--deepdive-accent` (propensities, which also
 * used `--text-sm` where the rest used `--text-base`). The fetch block was
 * identical; the presentation of its failure was not, which is the usual shape:
 * what gets copied stays in step, what gets hand-written drifts.
 *
 * `--color-mid` is the standard here. It is the majority, and it is the right
 * severity: every one of these is an optional secondary section inside a
 * collapsible, so failing to load is a caution about one panel, not an error
 * about the page. Shadbala's red and propensities' terracotta both change.
 */
export type BilingualText = { ta: string; en: string };

export function AsyncSection({
  state,
  lang,
  error,
  unavailable,
  loading,
  onRetry,
  children,
}: {
  state: AsyncState;
  lang: Lang;
  /** What failed, named. Shown when `state === "error"`. */
  error: BilingualText;
  /** Shown when `state === "unavailable"` — a feature this chart cannot use. */
  unavailable?: BilingualText;
  /** Overrides the shared "Loading…" line in the rare case a panel needs more. */
  loading?: BilingualText;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const isTamil = lang === "ta";
  const pick = (text: BilingualText) => (isTamil ? text.ta : text.en);

  if (state === "loading") {
    return (
      <p
        style={{ color: "var(--color-faint)", fontSize: "var(--text-base)", margin: 0 }}
        aria-live="polite"
      >
        {pick(loading ?? { ta: "ஏற்றுகிறது…", en: "Loading…" })}
      </p>
    );
  }

  if (state === "unavailable") {
    return (
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-base)", margin: 0 }}>
        {pick(unavailable ?? { ta: "இந்த ஜாதகத்திற்கு இது கிடைக்கவில்லை.", en: "Not available for this chart." })}
      </p>
    );
  }

  if (state === "error") {
    return (
      <p
        role="alert"
        style={{
          color: "var(--color-mid)",
          fontSize: "var(--text-base)",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        {pick(error)}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            style={{
              border: "1px solid var(--color-border-strong)",
              background: "transparent",
              color: "var(--color-accent-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "2px var(--space-3)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isTamil ? "மீண்டும் முயற்சி" : "Retry"}
          </button>
        ) : null}
      </p>
    );
  }

  return <>{children}</>;
}

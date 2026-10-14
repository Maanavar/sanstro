"use client";

import type { ShashtashtakaNote } from "@vinaadi/shared";
import type { Lang } from "@/lib/i18n";

/**
 * ஷஷ்டாஷ்டகம் (6/8) between the two Moon signs — F-POR-02, ruled 2026-10-13.
 *
 * **A disclosure, never a verdict.** The engine deliberately keeps this out of
 * `totalScore`, the band label and the Rajju/Vedha veto, because the ruling
 * asked for "a separately identified textual interpretation" beside the
 * retained Kalaprakasika directional result — not an overturn of it. This
 * component therefore:
 *
 * - renders nothing at all when the relation is absent, so a clean pairing
 *   gains no new row;
 * - uses the caution *tint*, never the rust/error colour the Rajju and Vedha
 *   vetoes use, so it cannot be mistaken for a gate that failed;
 * - carries no score, no percentage and no pass/fail word.
 *
 * It exists as one component rather than four hand-copies because the Tamil
 * label is the astrologer's own wording, pinned verbatim by a backend test
 * (`tests/test_shashtashtaka.py`). A second copy is how that wording drifts.
 *
 * The case it exists for: `present && directionalPass` — the couple is being
 * passed on Rasi while standing in a 6/8 relation. Measured over all 144 rasi
 * pairings, 24 are Shashtashtaka and 18 of those still pass.
 */
export function ShashtashtakaNoteCard({
  note,
  lang,
  compact = false,
}: {
  note: ShashtashtakaNote | null | undefined;
  lang: Lang;
  /** Inline one-liner for a dense list, rather than the boxed note. */
  compact?: boolean;
}) {
  // Absent and "payload predates F-POR-02" are the same thing to a reader.
  if (!note?.present) return null;

  const ta = lang === "ta";
  const label = ta ? note.label.ta : note.label.en;
  const body = ta ? note.note.ta : note.note.en;

  if (compact) {
    return (
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "var(--text-sm)",
          lineHeight: 1.55,
          color: "var(--color-muted)",
        }}
      >
        <strong style={{ color: "var(--color-text)" }}>{label}</strong> {body}
      </p>
    );
  }

  return (
    <div
      style={{
        marginTop: "var(--space-2)",
        padding: "10px 14px",
        borderRadius: "var(--radius-md, 10px)",
        // Caution tint, deliberately not the veto colour — see the docblock.
        background: "var(--cl-caution-soft, var(--color-surface-2))",
        border: "1px solid var(--cl-caution, var(--color-border))",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--color-text-strong)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "var(--text-sm)",
          lineHeight: 1.6,
          color: "var(--color-text)",
        }}
      >
        {body}
      </p>
    </div>
  );
}

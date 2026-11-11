"use client";

import type {
  ClassicalExceptionNote,
  EkaNakshatraNote,
  NadiDoshaResult,
  ShashtashtakaNote,
} from "@vinaadi/shared";
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
 *
 * The ஏக நட்சத்திரம் note (F-POR-03) is the same kind of thing (a disclosure
 * with a bilingual label and body, no score), so it renders through this card
 * too, as `EkaNakshatraNoteCard`, placed beside the Rajju row.
 */
export function ShashtashtakaNoteCard({
  note,
  lang,
  compact = false,
}: {
  note: ShashtashtakaNote | EkaNakshatraNote | ClassicalExceptionNote | null | undefined;
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

/** F-POR-03. Same card; the name says which note a call site renders. */
export const EkaNakshatraNoteCard = ShashtashtakaNoteCard;

/**
 * நாடி — a SECONDARY note (owner ruling 2026-11-11). Nadi comes from the
 * North Indian Ashtakoota system and is not one of the Tamil ten poruthams,
 * which is what Vinaadi's families and their jothidars count. So it is shown
 * below the Tamil findings as a muted line: no ⚠, no badge beside Rajju and
 * Vedhai, no caution tint, and it moves no score (the composite's Nadi
 * deduction was removed the same day).
 *
 * The body is the server's native-reviewed note; only the lead-in is written
 * here. Renders nothing when there is no shared Nadi.
 */
export const NADI_SECONDARY_LEAD = {
  en: "Nadi (additional note). Nadi is not one of the Tamil ten poruthams and does not change the score or the result above.",
  ta: "நாடி (கூடுதல் குறிப்பு). நாடி தமிழ்ப் பத்துப் பொருத்தங்களில் சேராது; மேலே உள்ள மதிப்பெண்ணையும் முடிவையும் இது மாற்றாது.",
} as const;

export function NadiSecondaryNote({
  nadi,
  lang,
}: {
  nadi: NadiDoshaResult | null | undefined;
  lang: Lang;
}) {
  if (!nadi?.hasNadiDosha) return null;
  const ta = lang === "ta";
  return (
    <p
      style={{
        margin: "var(--space-2) 0 0",
        fontSize: "var(--text-sm)",
        lineHeight: 1.55,
        color: "var(--color-muted)",
      }}
    >
      {ta ? NADI_SECONDARY_LEAD.ta : NADI_SECONDARY_LEAD.en} {ta ? nadi.noteTa : nadi.noteEn}
    </p>
  );
}

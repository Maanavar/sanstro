"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import { formatDateTimeLabel } from "@/lib/format";
import {
  deleteNumerologyNameSession,
  getNumerologyNameSessions,
  saveNumerologyNameSession,
  type NameSessionsResponse,
  type SavedNameSession,
} from "@vinaadi/shared/api/numerology";

import { NumerologyCorrectionSection } from "./dashboard-numerology-correction-nova";
import {
  CompoundLine,
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  TraditionNote,
  formatReductionChain,
  grahaLabel,
  housesPhrase,
  isNumerologyUnavailable,
  natureGlossFor,
  natureLabel,
  verdictLabel,
  verdictPlain,
  verdictTone,
} from "./dashboard-numerology-shared";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Field, Input } from "./ui/field";
import { Kicker } from "./ui/kicker";

/**
 * The Names view: name correction, and the shortlist it feeds.
 *
 * ## Why the two are one view
 *
 * They are two halves of one act. Correction proposes spellings; the shortlist
 * is where you keep the ones worth weighing. Before this they could not have
 * been joined — correction had no screen at all, because doctrine §9.4's legal
 * warning was gated with the interpretive corpus and so every alternative was
 * withheld (see `dashboard-numerology-correction-nova.tsx` for the split that
 * released them). With alternatives actually rendering, "Save to shortlist" is
 * a real action rather than a button that retypes a string for you.
 *
 * A saved suggestion is labelled with its provenance, because six weeks later
 * "Raajesh" in a shortlist gives no clue whether a person typed it or the
 * engine proposed it, and those two carry different weight.
 *
 * ## Saved name shortlist (NUM-58)
 *
 * What is stored is **the question, never the answer**: a spelling, an optional
 * user label, and the edit budget. `reading` and `alignment` are recomputed on
 * every read, so a shortlist saved last month follows the engine and the
 * doctrine flags forward instead of freezing a number that the doctrine has
 * since moved. `recalculatedSinceSaved` is how the server tells you it did.
 *
 * POST returns the whole list rather than the new row, so saving does not need a
 * follow-up GET recomputing every reading a second time.
 */

type Props = {
  lang: Lang;
  chartId: string;
};

export function NumerologyNamesSection({ lang, chartId }: Props) {
  const isTamil = lang === "ta";

  const [data, setData] = useState<NameSessionsResponse | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "unavailable">("loading");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFailure = useCallback((err: unknown) => {
    if (isNumerologyUnavailable(err)) {
      setPhase("unavailable");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setPhase("loading");
    getNumerologyNameSessions(chartId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (handleFailure(err)) return;
        setError(readErrorMessage(err));
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId, handleFailure]);

  /** The one write path, shared by the manual form and the correction list. */
  const saveSpelling = useCallback(
    (spelling: string, note: string | null) => {
      setSaving(true);
      setSaveError("");
      return saveNumerologyNameSession(chartId, { name: spelling, label: note })
        .then((res) => {
          setData(res);
          setPhase("ready");
          return true;
        })
        .catch((err: unknown) => {
          if (handleFailure(err)) return false;
          // A 409 here is the server refusing a shortlist that is already full,
          // and a 422 is the Latin-script rule (doctrine D3). Both are the
          // user's to act on, so the server's own message is shown rather than
          // replaced.
          setSaveError(readErrorMessage(err));
          return false;
        })
        .finally(() => setSaving(false));
    },
    [chartId, handleFailure],
  );

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    void saveSpelling(trimmed, label.trim() || null).then((ok) => {
      if (!ok) return;
      setName("");
      setLabel("");
    });
  };

  /** Provenance, not decoration: months later a shortlist gives no other clue
   *  whether a spelling was typed by a person or proposed by the engine. */
  const onSaveSuggested = useCallback(
    (spelling: string) => {
      void saveSpelling(spelling, isTamil ? "பெயர்த் திருத்தப் பரிந்துரை" : "Suggested by name correction");
    },
    [saveSpelling, isTamil],
  );

  const onDelete = (sessionId: string) => {
    setDeletingId(sessionId);
    deleteNumerologyNameSession(chartId, sessionId)
      .then(() => getNumerologyNameSessions(chartId))
      .then((res) => setData(res))
      .catch((err: unknown) => {
        if (handleFailure(err)) return;
        setSaveError(readErrorMessage(err));
      })
      .finally(() => setDeletingId(null));
  };

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <NumerologyCorrectionSection lang={lang} chartId={chartId} onSaveSpelling={onSaveSuggested} />

      <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "சேமித்த பெயர்கள்" : "Saved names"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "பரிசீலனையில் உள்ள எழுத்துக்கூட்டல்களைச் சேமியுங்கள். ஒவ்வொரு முறை திறக்கும்போதும் எண்களும் இணக்கமும் மீண்டும் கணக்கிடப்படுகின்றன — சேமிக்கப்படுவது பெயர் மட்டுமே."
            : "Keep the spellings you are weighing. The numbers and the alignment are recomputed every time you open this — only the spelling is stored, never a score."}
        </p>
      </div>

      {/* Add */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="nova-grid-2" style={{ gap: "var(--space-3)" }}>
          <Field
            label={isTamil ? "எழுத்துக்கூட்டல்" : "Spelling"}
            helper={isTamil ? "ஆங்கில எழுத்துக்கள் மட்டும்" : "Latin letters only"}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isTamil ? "பரிசீலிக்கும் பெயர்" : "The spelling under consideration"}
              autoComplete="off"
            />
          </Field>
          <Field label={isTamil ? "உங்கள் குறிப்பு (விருப்பம்)" : "Your note (optional)"}>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={isTamil ? "எ.கா. அலுவலகப் பயன்பாடு" : "e.g. for office use"}
              autoComplete="off"
            />
          </Field>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="primary" onClick={onSave} disabled={saving || !name.trim()}>
            {saving ? (isTamil ? "சேமிக்கிறது…" : "Saving…") : isTamil ? "சேமி" : "Save spelling"}
          </Button>
          {data ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {isTamil
                ? `மீதம் ${data.remainingSlots} இடங்கள்`
                : `${data.remainingSlots} slot${data.remainingSlots === 1 ? "" : "s"} left`}
            </span>
          ) : null}
        </div>
        {saveError ? <NumerologyError lang={lang} message={saveError} /> : null}
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? (
        <>
          {data.sessions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
              {isTamil ? "இன்னும் எந்தப் பெயரும் சேமிக்கப்படவில்லை." : "No spellings saved yet."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.sessions.map((session) => (
                <SavedNameRow
                  key={session.nameSessionId}
                  session={session}
                  lang={lang}
                  deleting={deletingId === session.nameSessionId}
                  onDelete={() => onDelete(session.nameSessionId)}
                />
              ))}
            </div>
          )}

          <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />
          <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            <TraditionNote lang={lang} traditionEn={data.traditionEn} traditionTa={data.traditionTa} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {isTamil ? "கணக்கீட்டுப் பதிப்பு" : "Calculation"} · {data.calculationVersion}
            </span>
          </div>
        </>
      ) : null}
      </Card>
    </div>
  );
}

function SavedNameRow({
  session,
  lang,
  deleting,
  onDelete,
}: {
  session: SavedNameSession;
  lang: Lang;
  deleting: boolean;
  onDelete: () => void;
}) {
  const isTamil = lang === "ta";
  return (
    <Card variant="soft" compact style={{ gap: "var(--space-2)" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: "1 1 200px", minWidth: 0 }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {session.name}
          </span>
          {session.label ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>{session.label}</span>
          ) : null}
        </div>
        <Chip tone={verdictTone(session.alignment.verdict)}>{verdictLabel(session.alignment.verdict, lang)}</Chip>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={isTamil ? `${session.name} நீக்கு` : `Remove ${session.name}`}
          style={{
            background: "none",
            border: "none",
            cursor: deleting ? "default" : "pointer",
            color: "var(--color-faint)",
            padding: "var(--space-1)",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--color-text-strong)",
          }}
        >
          {session.reading.root}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
          {grahaLabel(session.reading, lang)} · {natureLabel(session.alignment.functionalNature, lang)}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(session.alignment.score)}
        </span>
      </div>

      {/* A shortlist is a set of *comparisons*, so a naked chip is worse here
          than anywhere else on the feature: "Aligned 71" over one name and
          "Neutral 55" over another gives a parent no idea what separates them.
          One sentence and the houses behind it do. The full five-step chain
          stays on the Alignment view — this list is scanned, not studied. */}
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {verdictPlain(session.alignment.verdict, lang)}{" "}
        <span style={{ color: "var(--color-faint)" }}>
          {grahaLabel(session.reading, lang)}{" "}
          {natureGlossFor(
            session.alignment.functionalNature,
            session.alignment.basis?.ownedHouses,
            lang,
          )}
          {session.alignment.basis?.ownedHouses?.length &&
          session.alignment.functionalNature !== "NEUTRAL"
            ? ` (${housesPhrase(session.alignment.basis.ownedHouses, lang)})`
            : ""}
          .
        </span>
      </div>

      <CompoundLine reading={session.reading} lang={lang} />

      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {isTamil ? "சுருக்கம்" : "Reduction"} · {formatReductionChain(session.reading)} ·{" "}
        {isTamil ? "சேமித்தது" : "Saved"} {formatDateTimeLabel(session.savedAt)}
      </div>

      {/* Not a warning — a provenance note. The numbers below a saved spelling
          are today's, and this says they are not the ones that were on screen
          when it was saved. */}
      {session.recalculatedSinceSaved ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {isTamil
            ? "இது சேமிக்கப்பட்ட பிறகு கணக்கீட்டு எஞ்சின் மாறியுள்ளது — மேலே உள்ளவை தற்போதைய எண்கள்."
            : "The engine has moved since this was saved — the numbers above are today's, recomputed."}
        </div>
      ) : null}
    </Card>
  );
}

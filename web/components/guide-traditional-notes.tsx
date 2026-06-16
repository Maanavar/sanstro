import type { Lang } from "@/lib/i18n";

function text(value: { en: string; ta: string }, lang: Lang) {
  return lang === "ta" ? value.ta : value.en;
}

/**
 * A small, muted footnote that explains — in one line — how a Tamil astrologer
 * actually confirms the topic from a chart. Replaces the old full-width
 * "verification method / proof points" panel.
 */
export function GuideVerifyNote({
  note,
  lang,
}: {
  note: { en: string; ta: string };
  lang: Lang;
}) {
  return (
    <p className="cl-guide-verify">
      <span className="cl-guide-verify__badge">{lang === "en" ? "Note" : "குறிப்பு"}</span>
      {text(note, lang)}
    </p>
  );
}

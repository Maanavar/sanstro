import type { Lang } from "@/lib/i18n";

/**
 * <BilingualText> — the systemic cure for the bilingual scar tissue
 * (audit §8.2). ONE place decides active-language rendering, so the whole
 * class of "EN+TA co-render" and "title + faint-other-language echo" bugs
 * becomes impossible to *author*, not something to keep catching in review
 * (see the project's own [[feedback_bilingual_title_echo_rejected]] rule:
 * render in the active language only, never a title-echo).
 *
 * Give it both strings; it renders exactly one — the active language, with a
 * graceful fallback to the other only when the active side is genuinely empty
 * (a missing translation, never a design choice to show both). There is no
 * prop that makes it render both languages at once, by construction.
 */

type BilingualTextProps = {
  lang: Lang;
  en: string;
  ta: string;
  /** Render as a different element (e.g. "span", "h2"). Default "span". */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
};

/** Pick the active-language string, falling back to the other only when the
 *  active side is empty. Exported for callers that need the raw string (e.g.
 *  an `aria-label`, a `title`, a `<DrawerPanel title>`), not an element. */
export function pickLang(lang: Lang, en: string, ta: string): string {
  const active = lang === "ta" ? ta : en;
  if (active && active.trim()) return active;
  return lang === "ta" ? en : ta; // fallback: show what we have, never both
}

export function BilingualText({ lang, en, ta, as = "span", className, style }: BilingualTextProps) {
  const Tag = as as "span";
  return (
    <Tag className={className} style={style}>
      {pickLang(lang, en, ta)}
    </Tag>
  );
}

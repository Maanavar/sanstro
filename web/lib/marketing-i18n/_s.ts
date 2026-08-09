/** The bilingual string constructor every marketing-i18n domain module uses.
 *  Its own module so a domain file can reach it without importing the barrel,
 *  which would drag every other domain back in and undo the split. */
export type BiStr = { en: string; ta: string };

export function s(en: string, ta: string): BiStr {
  return { en, ta };
}

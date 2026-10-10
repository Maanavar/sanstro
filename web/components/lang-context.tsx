"use client";

import { createContext, useContext } from "react";
import type { Lang } from "@/lib/i18n";

/**
 * The language context and its hook, apart from `lang-toggle.tsx` so a
 * component that only needs to *read* the language (e.g. `LocalizedLink`) does
 * not import the toggle's API client. `lang-toggle` re-exports both.
 */
export type LangCtx = [Lang, (l: Lang) => void];
export const LangContext = createContext<LangCtx>(["en", () => {}]);

export function useLang(): LangCtx {
  return useContext(LangContext);
}

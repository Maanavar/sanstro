import { useLanguage } from "@/state/languageContext";
import { strings } from "@vinaadi/shared";
import type { Lang } from "@vinaadi/shared";

type DeepBiText = { ta: string; en: string };

function resolve(obj: DeepBiText, lang: Lang): string {
  return obj[lang];
}

export function useI18n() {
  const { lang, setLang } = useLanguage();

  function t(value: DeepBiText): string {
    return resolve(value, lang);
  }

  return { lang, setLang, t, strings };
}

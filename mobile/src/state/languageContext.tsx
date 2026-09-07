import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "@vinaadi/shared";
import { LANG_STORAGE_KEY } from "@vinaadi/shared";
import { apiPatch } from "@/api/client";
import { getTokens } from "@/lib/secureStore";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ta",
  setLang: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ta");

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then((stored) => {
      if (stored === "ta" || stored === "en") setLangState(stored);
    });
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    AsyncStorage.setItem(LANG_STORAGE_KEY, l);
    // Notifications are generated server-side, so the selected language must
    // travel with the account rather than remain only in AsyncStorage. Skip
    // guests: apiPatch would otherwise treat the expected 401 as a logout.
    void (async () => {
      if (!await getTokens()) return;
      await apiPatch("/api/v1/settings/ui", { lang: l });
    })().catch(() => undefined);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

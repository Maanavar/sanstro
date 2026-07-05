"use client";

import { useEffect, useState } from "react";

export type UiVariant = "classic" | "nova";

const STORAGE_KEY = "vinaadi-ui-variant";

function applyUiVariant(variant: UiVariant) {
  if (variant === "classic") {
    document.documentElement.removeAttribute("data-ui");
  } else {
    document.documentElement.setAttribute("data-ui", variant);
  }
}

export function useUiVariant() {
  const [variant, setVariantState] = useState<UiVariant>("classic");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "classic" || stored === "nova") {
      setVariantState(stored);
    }
  }, []);

  function setVariant(next: UiVariant) {
    setVariantState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyUiVariant(next);
  }

  return { variant, setVariant };
}

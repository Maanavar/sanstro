"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vinaadi-evening-preview";

/** Persists the Nova Today tab's "switch to tomorrow's preview after 8pm"
 *  toggle — same localStorage-hydration shape as useUiVariant. Defaults to
 *  on; users who don't want the evening switch can turn it off once and it
 *  sticks. */
export function useEveningPreview() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off") setEnabledState(false);
  }, []);

  function setEnabled(next: boolean) {
    setEnabledState(next);
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  }

  return { enabled, setEnabled };
}

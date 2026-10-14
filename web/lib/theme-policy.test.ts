import { describe, expect, it } from "vitest";

import {
  buildPrePaintThemeScript,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "./theme-policy";

describe("pre-paint theme policy", () => {
  it("keeps Light as fallback while preserving explicit and System choices", () => {
    const script = buildPrePaintThemeScript();

    expect(DEFAULT_THEME).toBe("light");
    expect(THEME_STORAGE_KEY).toBe("vinaadi-theme");
    expect(script).toContain('var r="light"');
    expect(script).toContain('t==="light"||t==="dark"');
    expect(script).toContain('t==="system"');
    expect(script.indexOf("document.documentElement.setAttribute")).toBeGreaterThan(
      script.indexOf("catch(e){}"),
    );
  });
});

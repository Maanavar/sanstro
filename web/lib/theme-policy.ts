export const THEME_STORAGE_KEY = "vinaadi-theme";
export const DEFAULT_THEME = "light" as const;

/**
 * Runs in <head> before first paint. A saved explicit choice always wins;
 * "system" remains an opt-in that follows the device. Missing, invalid, or
 * inaccessible storage keeps Vinaadi's Light default.
 */
export function buildPrePaintThemeScript(): string {
  return `(function(){var r="${DEFAULT_THEME}";try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){r=t;}else if(t==="system"){r=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark";}}catch(e){}document.documentElement.setAttribute("data-theme",r);})();`;
}

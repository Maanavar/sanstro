/**
 * Shared canvas helpers for client-rendered share-card PNGs.
 *
 * Canvas 2D cannot resolve CSS variables — every color passed to these
 * helpers (and to ctx.fillStyle / addColorStop at call sites) must be a
 * literal color (hex / rgba), never "var(--…)".
 */

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Draw word-wrapped text; returns the baseline y of the last drawn line. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines = 99,
): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineH;
      lines++;
      if (lines >= maxLines) {
        ctx.fillText("…", x, y);
        return y;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

export function drawBranding(ctx: CanvasRenderingContext2D, w: number, color = "rgba(255,255,255,0.30)"): void {
  ctx.fillStyle = color;
  ctx.font = `bold 22px ${getTamilFontStack()}`;
  ctx.textAlign = "right";
  ctx.fillText("vinaadi.com", w - 32, 46);
}

/** Append an alpha byte to a 6-digit hex color; safe fallback for anything else. */
export function withAlpha(color: string, alphaHex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alphaHex}` : "rgba(255,255,255,0.12)";
}

/**
 * Font stack for canvas text that may contain Tamil.
 *
 * next/font registers Noto Sans Tamil under a hashed family name exposed via
 * --font-tamil; the literal 'Noto Sans Tamil' only matches an OS-installed
 * copy, so both are listed, then Tamil-capable OS fonts.
 */
export function getTamilFontStack(): string {
  let appFamily = "";
  if (typeof document !== "undefined") {
    appFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-tamil").trim();
  }
  return [appFamily, "'Noto Sans Tamil'", "'Latha'", "'Nirmala UI'", "system-ui", "sans-serif"]
    .filter(Boolean)
    .join(", ");
}

/**
 * Ask the browser to load the given canvas font specs (e.g. "bold 96px …")
 * before drawing, using a Tamil sample string to force the Tamil subset.
 * Never throws — a missing font falls back to OS glyphs rather than blocking.
 */
export async function ensureFontsLoaded(fontSpecs: string[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all(fontSpecs.map((spec) => document.fonts.load(spec, "தமிழ் Aa")));
    await document.fonts.ready;
  } catch {
    // Font loading is best-effort; drawing proceeds with fallbacks.
  }
}

/**
 * Share the canvas as a PNG via the native share sheet when available,
 * otherwise trigger a download. Returns the data URL (for a preview modal)
 * and whether the native share path was used.
 */
export async function shareOrDownloadPng(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
): Promise<{ dataUrl: string; shared: boolean }> {
  const dataUrl = canvas.toDataURL("image/png");

  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return { dataUrl, shared: true };
    }
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return { dataUrl, shared: false };
}

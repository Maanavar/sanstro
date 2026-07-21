import type { CSSProperties } from "react";
import { zodiacImageSrc } from "@/lib/zodiac-images";

/**
 * Gold zodiac artwork badge (from web/public/zodiac-signs) rendered as a
 * rounded thumbnail. The artwork's own dark cosmic vignette reads as a premium
 * inset gem against the pale card surfaces it sits on. Decorative by default
 * (alt=""): every surface that uses this shows the rasi name in adjacent text,
 * so a non-empty alt would only make a screen reader double-announce it.
 *
 * Falls back to the classical Unicode glyph (if `glyph` is given) — or nothing —
 * when the rasi number has no artwork mapped, so a missing/out-of-range value is
 * never a broken image.
 *
 * The border colour resolves against `--cl-border` (marketing/tools surfaces),
 * then `--color-border` (dashboard shell), then a neutral literal, so the same
 * badge looks right on both design systems.
 */
export function ZodiacBadge({
  rasi,
  size = 40,
  glyph,
  style,
}: {
  /** Rasi number 1..12 (Mesham=1 … Meenam=12). */
  rasi: number;
  size?: number;
  /** Unicode fallback (e.g. "♈") shown if the artwork is unavailable. */
  glyph?: string;
  style?: CSSProperties;
}) {
  const src = zodiacImageSrc(rasi);
  if (!src) {
    return glyph ? <span style={{ fontSize: size * 0.5, lineHeight: 1, ...style }}>{glyph}</span> : null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- already-optimised static AVIF icon rendered at a small fixed size; the next/image optimizer round-trip adds cost, not value
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      // Eager, not lazy: these are tiny and the sign artwork is the whole point of
      // the surface, so a deferred/empty frame is never acceptable here.
      decoding="async"
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        objectFit: "cover",
        border: "1px solid var(--cl-border, var(--color-border, rgba(20, 16, 40, 0.14)))",
        background: "#0e0b1c",
        boxShadow: "0 1px 3px rgba(15, 12, 30, 0.22)",
        // The artwork is fine gold line-art on near-black; a small brightness/
        // saturation lift keeps the thin strokes reading once downscaled.
        filter: "brightness(1.1) saturate(1.08)",
        ...style,
      }}
    />
  );
}

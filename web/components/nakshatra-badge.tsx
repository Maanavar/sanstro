import type { CSSProperties } from "react";
import { nakshatraImageSrc } from "@/lib/nakshatra-images";

/**
 * Gold nakshatra artwork badge (from web/public/nakshatra-signs) rendered as a
 * rounded thumbnail — the birth-star counterpart to <ZodiacBadge>. The artwork
 * carries its own dark cosmic vignette so it reads as a premium inset gem
 * against the card surface, matching the rasi/lagnam badges exactly.
 *
 * Decorative by default (alt=""): every surface that uses this shows the
 * nakshatra name in adjacent text, so a non-empty alt would only make a screen
 * reader double-announce it. Returns null for an out-of-range number so a
 * missing value is never a broken image.
 *
 * The border colour resolves against `--cl-border` (marketing/tools surfaces),
 * then `--color-border` (dashboard shell), then a neutral literal, so the same
 * badge looks right on both design systems.
 */
export function NakshatraBadge({
  nakshatra,
  size = 40,
  style,
}: {
  /** Nakshatra number 1..27 (Aswini=1 … Revathi=27). */
  nakshatra: number;
  size?: number;
  style?: CSSProperties;
}) {
  const src = nakshatraImageSrc(nakshatra);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG icon rendered at a small fixed size; the next/image optimizer round-trip adds cost, not value
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      // Eager, not lazy: these are tiny and the sign artwork is the whole point
      // of the surface, so a deferred/empty frame is never acceptable here.
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
        ...style,
      }}
    />
  );
}

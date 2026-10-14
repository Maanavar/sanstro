import type { CSSProperties, ReactNode } from "react";
import type { ObservanceKind } from "@/lib/observance-kind";

/**
 * Vinaadi observance emblems: monoline on a 24-unit grid at the 1.75 stroke the
 * glyph brief fixes to match the app's Lucide icons
 * (docs/GLYPH_COMMISSION_BRIEF_2026-09-21.md §1), drawn in `currentColor` so the theme supplies the ink
 * and nothing here can be lighter than its own ground. Decorative — every use
 * sits next to the observance's name.
 *
 * Kept as one family on purpose: the month grid used to mix 40 px deity photos
 * (three with baked-in white boxes) and OS colour emoji in the same row.
 */
const PATHS: Record<ObservanceKind, ReactNode> = {
  // Kalasam: round-bellied pot, coconut in its mouth, mango leaves rising.
  muhurtham: (
    <>
      <circle cx="12" cy="6.4" r="2.3" />
      <path d="M10.2 9.4C7.4 9.2 5.4 7.2 4.8 4.4c2.8.4 4.8 2.2 5.4 5ZM13.8 9.4c2.8-.2 4.8-2.2 5.4-5-2.8.4-4.8 2.2-5.4 5Z" />
      <path d="M9 10h6M9.8 10.2c0 1-.9 1.3-1.9 2.1-1.5 1.2-2.1 2.7-2.1 4.3 0 2.6 2.6 4.5 6.2 4.5s6.2-1.9 6.2-4.5c0-1.6-.6-3.1-2.1-4.3-1-.8-1.9-1.1-1.9-2.1M7.2 14.6c3.2 1 6.4 1 9.6 0" />
    </>
  ),
  // Full moon: a lit disc.
  pournami: <circle cx="12" cy="12" r="7.5" fill="currentColor" />,
  // New moon: the same disc, unlit — a faint body inside its rim.
  amavasai: <circle cx="12" cy="12" r="7.5" fill="currentColor" fillOpacity=".18" />,
  // Modakam: pleated dumpling rising to a tip.
  chathurthi: (
    <>
      <path d="M12 3.5C10.2 7 5 10 5 15a7 5.5 0 0 0 14 0c0-5-5.2-8-7-11.5Z" />
      <path d="M12 3.5c-1.1 4.4-2.3 8.7-3.4 16.3M12 3.5c1.1 4.4 2.3 8.7 3.4 16.3" />
    </>
  ),
  // Vel: broad leaf blade with its ridge, collar, shaft.
  sashti: (
    <>
      <path d="M12 1.8c4.8 3.2 6.6 7.6 0 11.4-6.6-3.8-4.8-8.2 0-11.4Z" />
      <path d="M12 4.6v5.8M9.8 15.2h4.4M12 13.2V22" />
    </>
  ),
  // Tulasi sprig: stem, two leaf pairs, flower spike.
  ekadashi: (
    <>
      <path d="M12 21.5V7" />
      <path d="M12 17.5c-1.5-2.8-4-3.6-6.6-3 1 2.4 3.6 3.4 6.6 3ZM12 17.5c1.5-2.8 4-3.6 6.6-3-1 2.4-3.6 3.4-6.6 3Z" />
      <path d="M12 12.3c-1.2-2.2-3.2-2.8-5.2-2.4.8 1.9 2.9 2.7 5.2 2.4ZM12 12.3c1.2-2.2 3.2-2.8 5.2-2.4-.8 1.9-2.9 2.7-5.2 2.4Z" />
      <path d="M12 7c-1-1.4-1-2.9 0-4.4 1 1.5 1 3 0 4.4Z" />
    </>
  ),
  // Lingam with vibhuti lines, on its avudaiyar (spout) and pedestal.
  pradosham: (
    <>
      <path d="M9.3 15.2V10a2.7 2.7 0 0 1 5.4 0v5.2" />
      <path d="M10.6 11.8h2.8M10.6 13.4h2.8" />
      <path d="M3.8 15.2h12.6c2.6 0 4.6.6 4.6 1.6s-2 1.6-4.6 1.6H3.8c-.6 0-.9-.4-.9-.8v-1.6c0-.4.3-.8.9-.8ZM6 18.4v3h10v-3" />
    </>
  ),
  // Thoranam: a festoon of mango leaves.
  festival: (
    <>
      <path d="M3 5c6 3 12 3 18 0" />
      <path d="M12 7.3c-1.4 2.4-1.4 5.3 0 7.7 1.4-2.4 1.4-5.3 0-7.7ZM7.6 6.9c-1.2 2-1.2 4.3 0 6.3 1.2-2 1.2-4.3 0-6.3ZM16.4 6.9c-1.2 2-1.2 4.3 0 6.3 1.2-2 1.2-4.3 0-6.3ZM4 5.8c-.9 1.5-.9 3.2 0 4.7.9-1.5.9-3.2 0-4.7ZM20 5.8c-.9 1.5-.9 3.2 0 4.7.9-1.5.9-3.2 0-4.7Z" />
    </>
  ),
  // Karinaal: a day set aside — the universal "avoid" mark.
  karinaal: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.4 17.6 17.6 6.4" />
    </>
  ),
};

export function ObservanceGlyph({
  kind,
  size = 16,
  strokeWidth = 1.75,
  style,
  className,
}: {
  kind: ObservanceKind;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: "none", ...style }}
    >
      {PATHS[kind]}
    </svg>
  );
}

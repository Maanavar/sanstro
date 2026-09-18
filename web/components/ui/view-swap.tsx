"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { DUR, EASE_NOVA } from "@/lib/motion";

/**
 * `ViewSwap` — one view replaces another, without a hard cut.
 *
 * This is DXA-14's primitive, built here because DXA-37 needs it (the reading
 * length switch). DXA-14 itself — applying it to the Tools hub ⇄ tool swap,
 * every other `Segmented`-driven view, and the Understand hub ⇄ detail, plus
 * the `Segmented` sliding thumb — is still open; see the audit.
 *
 * NOT exported from `components/ui/index.ts` on purpose. That barrel stays free
 * of framer-motion: pulling the animation library into it once dragged framer
 * into every route that imported any kit primitive and produced a
 * ChunkLoadError. Import this file directly.
 *
 * Reduced motion is not handled here. The workspace wraps its whole render in
 * `<MotionConfig reducedMotion="user">` (DXA-11), which is the only guard that
 * reaches a framer animation — the CSS `prefers-reduced-motion` block cannot
 * see an inline transform framer writes.
 *
 * `mode="wait"` matters beyond taste: it unmounts the outgoing view before
 * mounting the incoming one, so a probe counting rendered sections never sees
 * two at once. DXA-37's gate is exactly that count.
 *
 * **There is deliberately no scroll anchor here, and that is a measurement, not
 * an oversight.** DXA-37 asked for one, on the reasoning that the four-minute
 * reading is ~2x the two-minute one. Measured on Family with the page scroll
 * settled, the swap moves the reading's own top by **0px in both directions**:
 * a view that changes height grows and shrinks BELOW its header, so the header
 * does not move. The one case that could jump — the browser clamping the scroll
 * when a shrink makes the page shorter than the current offset — needs the swap
 * within a viewport of the page bottom, and a reader cannot click a control
 * they cannot see. An anchor was built, measured at 0, and taken out rather than
 * left in looking load-bearing. If one of DXA-14's other swaps sits at the end
 * of a page, add it there WITH the measurement that shows it firing;
 * `CollapsibleSection` has the technique.
 */
export function ViewSwap({
  viewKey,
  children,
}: {
  /** Changing this swaps the view. */
  viewKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4, transition: { duration: DUR.fast, ease: EASE_NOVA } }}
        transition={{ duration: 0.18, ease: EASE_NOVA }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

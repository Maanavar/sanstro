"use client";

import { motion } from "framer-motion";

import { DUR, EASE_NOVA } from "@/lib/motion";

/** Loaded only by Segmented's animated indicator, never through ui/index. */
export function SegmentedThumb({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className="ui-segmented__thumb"
      layoutId={layoutId}
      transition={{ duration: DUR.base, ease: EASE_NOVA }}
    />
  );
}

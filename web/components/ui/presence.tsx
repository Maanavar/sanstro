"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

import { DUR, EASE_NOVA } from "@/lib/motion";

/**
 * A small, directly-imported presence boundary for dashboard overlays.  It is
 * deliberately outside ui/index.ts: importing Framer through that barrel makes
 * every kit consumer pay for it.
 */
export const Presence = forwardRef<HTMLDivElement, {
  open: boolean;
  children: ReactNode;
  /** Called after the retained child has finished its exit transition. */
  onExitComplete?: () => void;
} & Omit<HTMLMotionProps<"div">, "children">>(function Presence({
  open,
  children,
  onExitComplete,
  ...props
}, ref) {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: DUR.base, ease: EASE_NOVA }}
          {...props}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

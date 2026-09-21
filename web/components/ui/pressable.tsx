"use client";

import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

import { DUR, EASE_NOVA } from "@/lib/motion";

/** Direct-imported press primitive for the dashboard's interactive cards. */
export function Pressable({ children, className, ...props }: ComponentProps<typeof motion.button> & { children: ReactNode }) {
  return (
    <motion.button
      type="button"
      className={className}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DUR.fast, ease: EASE_NOVA }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

"use client";

import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

import { DUR, EASE_NOVA } from "@/lib/motion";

type ButtonPressableProps = Omit<ComponentProps<typeof motion.button>, "children" | "className"> & {
  as?: "button";
  children: ReactNode;
  className?: string;
  href?: never;
};

type AnchorPressableProps = Omit<ComponentProps<typeof motion.a>, "children" | "className"> & {
  as: "a";
  children: ReactNode;
  className?: string;
  href: string;
};

type PressableProps = ButtonPressableProps | AnchorPressableProps;

/** Direct-imported press primitive for dashboard surfaces that are neither a
 * Card nor a kit button. Links stay links so middle-click and copy-link work. */
export function Pressable({ as = "button", children, className, ...props }: PressableProps) {
  const classes = ["ui-pressable", className].filter(Boolean).join(" ");
  if (as === "a") {
    return (
      <motion.a
        className={classes}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: DUR.fast, ease: EASE_NOVA }}
        {...props as ComponentProps<typeof motion.a>}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      className={classes}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DUR.fast, ease: EASE_NOVA }}
      {...props as ComponentProps<typeof motion.button>}
    >
      {children}
    </motion.button>
  );
}

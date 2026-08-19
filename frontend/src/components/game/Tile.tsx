"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  state: "empty" | "tbd" | "absent" | "present" | "correct";
  position: number;
  rowRevealed: boolean;
}

const stateClasses: Record<TileProps["state"], string> = {
  empty: "border-[var(--color-border)] bg-transparent",
  tbd: "border-[var(--color-border-bright)] bg-transparent",
  absent: "tile-absent",
  present: "tile-present",
  correct: "tile-correct",
};

export function Tile({ letter, state, position, rowRevealed }: TileProps) {
  const isRevealing = rowRevealed && state !== "empty" && state !== "tbd";

  return (
    <motion.div
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-2xl font-bold uppercase rounded-lg select-none text-white",
        stateClasses[state]
      )}
      initial={
        isRevealing
          ? { rotateX: -90, opacity: 0.5 }
          : letter
            ? { scale: 1.1 }
            : undefined
      }
      animate={
        isRevealing
          ? { rotateX: 0, opacity: 1 }
          : { scale: 1 }
      }
      transition={
        isRevealing
          ? { delay: position * 0.15, duration: 0.4, ease: "easeOut" }
          : { duration: 0.1 }
      }
      role="cell"
      aria-label={
        letter
          ? `${letter}, ${state === "correct" ? "correct position" : state === "present" ? "wrong position" : state === "absent" ? "not in word" : "entered"}`
          : "empty"
      }
    >
      {letter}
    </motion.div>
  );
}

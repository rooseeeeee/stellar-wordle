"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  state: "empty" | "tbd" | "absent" | "present" | "correct";
  position: number;
  rowRevealed: boolean;
  isWinRow?: boolean;
}

const stateClasses: Record<TileProps["state"], string> = {
  empty: "border-[var(--color-border)] bg-transparent",
  tbd: "border-[var(--color-border-bright)] bg-[var(--color-surface)]/50",
  absent: "tile-absent",
  present: "tile-present",
  correct: "tile-correct",
};

export function Tile({ letter, state, position, rowRevealed, isWinRow }: TileProps) {
  const isRevealing = rowRevealed && state !== "empty" && state !== "tbd";
  const isTyping = state === "tbd" && letter;

  return (
    <motion.div
      className={cn(
        "w-[3.25rem] h-[3.25rem] sm:w-[3.75rem] sm:h-[3.75rem] border-2 flex items-center justify-center text-[1.6rem] sm:text-[1.8rem] font-bold uppercase rounded-xl select-none text-white",
        "transition-colors duration-200",
        stateClasses[state]
      )}
      style={{ perspective: "600px" }}
      initial={
        isRevealing
          ? { rotateX: -90, opacity: 0.5 }
          : isTyping
            ? { scale: 1.12 }
            : undefined
      }
      animate={
        isRevealing
          ? { rotateX: 0, opacity: 1 }
          : isWinRow
            ? {
                scale: 1,
                y: [0, -16, 0, -6, 0],
                transition: {
                  delay: position * 0.1,
                  duration: 0.6,
                  ease: "easeOut",
                },
              }
            : { scale: 1 }
      }
      transition={
        isRevealing
          ? { delay: position * 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }
          : { duration: 0.1, ease: "easeOut" }
      }
      role="cell"
      aria-label={
        letter
          ? `${letter}, ${state === "correct" ? "correct position" : state === "present" ? "wrong position" : state === "absent" ? "not in word" : "entered"}`
          : "empty"
      }
    >
      <span className={cn(
        "leading-none",
        isRevealing && "drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
      )}>
        {letter}
      </span>
    </motion.div>
  );
}

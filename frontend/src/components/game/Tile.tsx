"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  state: "empty" | "tbd" | "absent" | "present" | "correct";
  position: number;
  rowRevealed: boolean;
}

const stateColors: Record<TileProps["state"], string> = {
  empty: "border-gray-700 bg-transparent",
  tbd: "border-gray-500 bg-transparent",
  absent: "border-gray-700 bg-gray-700 text-white",
  present: "border-yellow-500 bg-yellow-500 text-white",
  correct: "border-green-500 bg-green-500 text-white",
};

export function Tile({ letter, state, position, rowRevealed }: TileProps) {
  const isRevealing = rowRevealed && state !== "empty" && state !== "tbd";

  return (
    <motion.div
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-2xl font-bold uppercase rounded-md select-none",
        stateColors[state]
      )}
      initial={
        isRevealing
          ? { rotateX: 0 }
          : letter
            ? { scale: 1.1 }
            : undefined
      }
      animate={
        isRevealing
          ? { rotateX: 360 }
          : { scale: 1 }
      }
      transition={
        isRevealing
          ? { delay: position * 0.15, duration: 0.5 }
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

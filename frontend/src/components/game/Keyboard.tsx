"use client";

import { cn } from "@/lib/utils";

type KeyState = "unused" | "absent" | "present" | "correct";

interface KeyboardProps {
  letterStates: Record<string, KeyState>;
  onKey: (key: string) => void;
  disabled?: boolean;
}

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
];

const stateClasses: Record<KeyState, string> = {
  unused: "bg-[var(--color-border-bright)] hover:bg-[var(--color-border-bright)]/80 text-white",
  absent: "bg-[var(--color-surface)] text-[var(--color-muted)] opacity-50",
  present: "bg-[var(--color-yellow)] hover:bg-[var(--color-yellow-glow)] text-white shadow-[0_0_8px_rgba(245,158,11,0.3)]",
  correct: "bg-[var(--color-green)] hover:bg-[var(--color-green-glow)] text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]",
};

export function Keyboard({ letterStates, onKey, disabled }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5 items-center" role="group" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((key) => {
            const isLetter = key.length === 1;
            const state = isLetter
              ? letterStates[key] || "unused"
              : "unused";
            const display =
              key === "Backspace" ? "⌫" : key === "Enter" ? "ENTER" : key;

            return (
              <button
                key={key}
                className={cn(
                  "h-14 rounded-lg font-bold text-sm uppercase flex items-center justify-center transition-all",
                  isLetter
                    ? "w-9 sm:w-10"
                    : "px-3 sm:px-4 bg-[var(--color-border-bright)] hover:bg-[var(--color-border-bright)]/80 text-white",
                  isLetter && stateClasses[state]
                )}
                onClick={() => onKey(key)}
                disabled={disabled}
                aria-label={key === "Backspace" ? "Delete" : key}
              >
                {display}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

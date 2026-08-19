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
  unused:
    "bg-[var(--color-border-bright)] hover:bg-[var(--color-surface-active)] text-white border-transparent",
  absent:
    "bg-[var(--color-surface)] text-[var(--color-muted)] opacity-40 border-transparent",
  present:
    "bg-[var(--color-yellow)] hover:bg-[var(--color-yellow-glow)] text-white border-[var(--color-yellow)]/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
  correct:
    "bg-[var(--color-green)] hover:bg-[var(--color-green-glow)] text-white border-[var(--color-green)]/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
};

export function Keyboard({ letterStates, onKey, disabled }: KeyboardProps) {
  return (
    <div
      className="flex flex-col gap-[6px] items-center w-full"
      role="group"
      aria-label="Keyboard"
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-[5px] justify-center w-full">
          {/* Add spacer for middle row to center it */}
          {i === 1 && <div className="w-[14px] sm:w-[18px] flex-shrink-0" />}
          {row.map((key) => {
            const isLetter = key.length === 1;
            const state = isLetter
              ? letterStates[key] || "unused"
              : "unused";
            const display =
              key === "Backspace" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : key === "Enter" ? (
                <span className="text-[11px] sm:text-xs font-bold tracking-wide">ENTER</span>
              ) : (
                <span className="text-[15px] sm:text-base">{key}</span>
              );

            return (
              <button
                key={key}
                className={cn(
                  "h-[52px] sm:h-14 rounded-lg font-bold uppercase flex items-center justify-center",
                  "transition-all duration-100 active:scale-[0.92] active:brightness-90",
                  "border border-transparent",
                  "disabled:pointer-events-none disabled:opacity-30",
                  isLetter
                    ? "w-[32px] sm:w-[38px] flex-shrink-0"
                    : "px-3 sm:px-5 bg-[var(--color-border-bright)] hover:bg-[var(--color-surface-active)] text-white flex-shrink-0",
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
          {i === 1 && <div className="w-[14px] sm:w-[18px] flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

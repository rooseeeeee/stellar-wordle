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

const stateColors: Record<KeyState, string> = {
  unused: "bg-gray-600 hover:bg-gray-500 text-white",
  absent: "bg-gray-800 text-gray-500",
  present: "bg-yellow-500 hover:bg-yellow-400 text-white",
  correct: "bg-green-500 hover:bg-green-400 text-white",
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
                  "h-14 rounded-md font-bold text-sm uppercase flex items-center justify-center transition-colors",
                  isLetter ? "w-9 sm:w-10" : "px-3 sm:px-4 bg-gray-600 hover:bg-gray-500 text-white",
                  isLetter && stateColors[state]
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

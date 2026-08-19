"use client";

import { Tile } from "./Tile";

// Feedback values from contract
const FEEDBACK_TO_STATE = {
  0: "absent",
  1: "present",
  2: "correct",
} as const;

interface BoardProps {
  guesses: string[];
  feedbacks: number[][];
  currentGuess: string;
  maxGuesses?: number;
  wordLength?: number;
}

export function Board({
  guesses,
  feedbacks,
  currentGuess,
  maxGuesses = 6,
  wordLength = 5,
}: BoardProps) {
  const rows: { letters: string[]; states: ("empty" | "tbd" | "absent" | "present" | "correct")[]; revealed: boolean }[] = [];

  // Submitted guesses
  for (let i = 0; i < guesses.length; i++) {
    const letters = guesses[i].split("");
    const feedback = feedbacks[i] || [];
    const states = letters.map(
      (_, j) => FEEDBACK_TO_STATE[feedback[j] as 0 | 1 | 2] || "absent"
    );
    rows.push({ letters, states, revealed: true });
  }

  // Current in-progress row
  if (guesses.length < maxGuesses) {
    const letters = currentGuess.split("").concat(Array(wordLength - currentGuess.length).fill(""));
    const states = letters.map((l) => (l ? "tbd" : "empty")) as ("empty" | "tbd")[];
    rows.push({ letters, states, revealed: false });
  }

  // Remaining empty rows
  while (rows.length < maxGuesses) {
    rows.push({
      letters: Array(wordLength).fill(""),
      states: Array(wordLength).fill("empty"),
      revealed: false,
    });
  }

  return (
    <div
      className="grid gap-1.5"
      role="grid"
      aria-label="Wordle game board"
    >
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center" role="row">
          {row.letters.map((letter, j) => (
            <Tile
              key={`${i}-${j}`}
              letter={letter}
              state={row.states[j]}
              position={j}
              rowRevealed={row.revealed}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

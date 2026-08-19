"use client";

import { motion } from "framer-motion";
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
  shakeRow?: number | null;
}

export function Board({
  guesses,
  feedbacks,
  currentGuess,
  maxGuesses = 6,
  wordLength = 5,
  shakeRow,
}: BoardProps) {
  const rows: {
    letters: string[];
    states: ("empty" | "tbd" | "absent" | "present" | "correct")[];
    revealed: boolean;
    isWinRow: boolean;
  }[] = [];

  // Check if last submitted row was a win
  const lastFeedback = feedbacks[feedbacks.length - 1];
  const lastRowWon = lastFeedback && lastFeedback.every((v) => v === 2);

  // Submitted guesses
  for (let i = 0; i < guesses.length; i++) {
    const letters = guesses[i].split("");
    const feedback = feedbacks[i] || [];
    const states = letters.map(
      (_, j) => FEEDBACK_TO_STATE[feedback[j] as 0 | 1 | 2] || "absent"
    );
    const isWinRow = lastRowWon && i === guesses.length - 1;
    rows.push({ letters, states, revealed: true, isWinRow });
  }

  // Current in-progress row
  if (guesses.length < maxGuesses) {
    const letters = currentGuess.split("").concat(Array(wordLength - currentGuess.length).fill(""));
    const states = letters.map((l) => (l ? "tbd" : "empty")) as ("empty" | "tbd")[];
    rows.push({ letters, states, revealed: false, isWinRow: false });
  }

  // Remaining empty rows
  while (rows.length < maxGuesses) {
    rows.push({
      letters: Array(wordLength).fill(""),
      states: Array(wordLength).fill("empty"),
      revealed: false,
      isWinRow: false,
    });
  }

  return (
    <div
      className="grid gap-[6px]"
      role="grid"
      aria-label="Wordle game board"
    >
      {rows.map((row, i) => (
        <motion.div
          key={i}
          className="flex gap-[6px] justify-center"
          role="row"
          animate={
            shakeRow === i
              ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : {}
          }
          transition={
            shakeRow === i
              ? { duration: 0.5, ease: "easeInOut" }
              : {}
          }
        >
          {row.letters.map((letter, j) => (
            <Tile
              key={`${i}-${j}`}
              letter={letter}
              state={row.states[j]}
              position={j}
              rowRevealed={row.revealed}
              isWinRow={row.isWinRow}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

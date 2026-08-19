"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/providers/wallet-provider";
import { useContract } from "./use-contract";
import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";

type KeyState = "unused" | "absent" | "present" | "correct";
type GameStatus = "idle" | "playing" | "won" | "lost";

export function useGame() {
  const { address } = useWallet();
  const { read, write } = useContract();

  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<number[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [letterStates, setLetterStates] = useState<Record<string, KeyState>>({});
  const [day, setDay] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update letter states from all feedbacks
  const updateLetterStates = useCallback(
    (allGuesses: string[], allFeedbacks: number[][]) => {
      const states: Record<string, KeyState> = {};
      for (let i = 0; i < allGuesses.length; i++) {
        const word = allGuesses[i];
        const fb = allFeedbacks[i];
        if (!fb) continue;
        for (let j = 0; j < word.length; j++) {
          const letter = word[j];
          const current = states[letter] || "unused";
          if (fb[j] === 2) {
            states[letter] = "correct";
          } else if (fb[j] === 1 && current !== "correct") {
            states[letter] = "present";
          } else if (fb[j] === 0 && current === "unused") {
            states[letter] = "absent";
          }
        }
      }
      setLetterStates(states);
    },
    []
  );

  // Start a new game
  const startGame = useCallback(async () => {
    if (!address) {
      toast.error("Connect your wallet to play");
      return;
    }
    try {
      const result = await write("start_game", [
        new Address(address).toScVal(),
      ]);
      setStatus("playing");
      toast.success("Game started!", {
        description: "Make your first guess.",
      });
    } catch (err: unknown) {
      // If already started for today, just move to playing
      if (err instanceof Error && err.message.includes("already")) {
        setStatus("playing");
      }
    }
  }, [address, write]);

  // Submit a guess
  const submitGuess = useCallback(async () => {
    if (currentGuess.length !== 5) {
      toast.warning("Word must be 5 letters");
      return;
    }
    if (!address) {
      toast.error("Connect your wallet to submit guesses");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const feedback = await write("submit_guess", [
        new Address(address).toScVal(),
        nativeToScVal(currentGuess, { type: "string" }),
      ]);

      // Parse feedback (array of u32)
      const fb = feedback as unknown as number[];
      const newGuesses = [...guesses, currentGuess];
      const newFeedbacks = [...feedbacks, fb];

      setGuesses(newGuesses);
      setFeedbacks(newFeedbacks);
      setCurrentGuess("");
      updateLetterStates(newGuesses, newFeedbacks);

      // Check win
      if (fb.every((v: number) => v === 2)) {
        setStatus("won");
        toast.success("🎉 You won!", {
          description: `Solved in ${newGuesses.length} guess${newGuesses.length > 1 ? "es" : ""}!`,
        });
      } else if (newGuesses.length >= 6) {
        setStatus("lost");
        toast.error("Game over", {
          description: "Better luck tomorrow!",
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("GuessInvalid")) {
          toast.error("Invalid guess", {
            description: "Must be a valid 5-letter word (a-z).",
          });
        } else if (err.message.includes("AlreadyGuessed")) {
          toast.warning("Already guessed", {
            description: "Try a different word.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentGuess, address, guesses, feedbacks, isSubmitting, write, updateLetterStates]);

  // Handle key input
  const handleKey = useCallback(
    (key: string) => {
      if (status !== "playing" || isSubmitting) return;

      if (key === "Enter") {
        submitGuess();
      } else if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[a-z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [status, isSubmitting, currentGuess, submitGuess]
  );

  // Physical keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "enter" || key === "backspace" || /^[a-z]$/.test(key)) {
        e.preventDefault();
        handleKey(key === "enter" ? "Enter" : key === "backspace" ? "Backspace" : key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  return {
    guesses,
    feedbacks,
    currentGuess,
    status,
    letterStates,
    day,
    isSubmitting,
    handleKey,
    startGame,
  };
}

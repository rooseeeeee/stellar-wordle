"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/providers/wallet-provider";
import {
  usePlayerGame,
  useStartGame,
  useSubmitGuess,
  evaluateGuess,
} from "./use-contract";
import type { GameMode, GameStatus, KeyState } from "@/types/game";

export function useGame(mode: GameMode = { type: "daily" }) {
  const { address } = useWallet();

  // React Query: fetches game state from chain, cached + auto-refetch
  const {
    data: onChainGame,
    isLoading: isQueryLoading,
    isFetched,
  } = usePlayerGame();

  // Mutations
  const startGameMutation = useStartGame();
  const submitGuessMutation = useSubmitGuess();

  // Local state for current typing + optimistic guesses not yet confirmed
  const [localGuesses, setLocalGuesses] = useState<string[]>([]);
  const [localFeedbacks, setLocalFeedbacks] = useState<number[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [localStatus, setLocalStatus] = useState<GameStatus | null>(null);
  const [feedbacksResolved, setFeedbacksResolved] = useState(false);
  const [resolvedFeedbacks, setResolvedFeedbacks] = useState<number[][]>([]);

  // Resolve feedbacks for on-chain guesses (evaluate each guess to get colors)
  useEffect(() => {
    if (!onChainGame || onChainGame.guesses.length === 0) {
      setResolvedFeedbacks([]);
      setFeedbacksResolved(true);
      return;
    }

    let cancelled = false;

    async function resolveFeedbacks() {
      const guesses = onChainGame!.guesses;
      const lastFb = onChainGame!.lastFeedback;
      const fbs: number[][] = [];

      for (let i = 0; i < guesses.length; i++) {
        if (cancelled) return;
        if (i === guesses.length - 1 && lastFb.length === 5) {
          fbs.push(lastFb);
        } else {
          try {
            const fb = await evaluateGuess(guesses[i]);
            fbs.push(fb);
          } catch {
            fbs.push([0, 0, 0, 0, 0]);
          }
        }
      }

      if (!cancelled) {
        setResolvedFeedbacks(fbs);
        setFeedbacksResolved(true);
      }
    }

    setFeedbacksResolved(false);
    resolveFeedbacks();

    return () => { cancelled = true; };
  }, [onChainGame]);

  // Derive the final state: merge on-chain data with local optimistic state
  const guesses = useMemo(() => {
    if (localGuesses.length > 0) return localGuesses;
    return onChainGame?.guesses || [];
  }, [onChainGame, localGuesses]);

  const feedbacks = useMemo(() => {
    if (localFeedbacks.length > 0) return localFeedbacks;
    return resolvedFeedbacks;
  }, [resolvedFeedbacks, localFeedbacks]);

  // Determine game status
  const status: GameStatus = useMemo(() => {
    // Local override (from mutations)
    if (localStatus) return localStatus;

    // Not connected or still loading
    if (!address) return "idle";
    if (isQueryLoading || !isFetched) return "loading";

    // No game on chain
    if (!onChainGame) return "idle";

    // Map contract status
    if (onChainGame.status === 1) return "won";
    if (onChainGame.status === 2) return "lost";
    if (onChainGame.guesses.length === 0 && onChainGame.status === 0) return "playing";

    return "playing";
  }, [localStatus, address, isQueryLoading, isFetched, onChainGame]);

  // Compute keyboard letter states from feedbacks
  const letterStates = useMemo(() => {
    const states: Record<string, KeyState> = {};
    for (let i = 0; i < guesses.length; i++) {
      const word = guesses[i];
      const fb = feedbacks[i];
      if (!fb) continue;
      for (let j = 0; j < word.length; j++) {
        const letter = word[j].toLowerCase();
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
    return states;
  }, [guesses, feedbacks]);

  const isSubmitting = submitGuessMutation.isPending;
  const isLoading = (isQueryLoading && !isFetched) || (!feedbacksResolved && (onChainGame?.guesses.length ?? 0) > 0);

  // Start game
  const startGame = useCallback(async () => {
    if (!address) {
      toast.error("Connect your wallet to play");
      return;
    }

    try {
      await startGameMutation.mutateAsync(
        mode.type === "campaign" && mode.level ? { level: mode.level } : undefined
      );
      setLocalStatus("playing");
      toast.success("Game started", { description: "Make your first guess." });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("already")) {
        setLocalStatus("playing");
      }
    }
  }, [address, startGameMutation, mode.type, mode.level]);

  // Submit guess
  const submitGuess = useCallback(async () => {
    if (currentGuess.length !== 5) {
      toast.warning("Word must be 5 letters");
      return;
    }
    if (!address || isSubmitting) return;

    const guess = currentGuess;

    // Optimistic: add the guess immediately with placeholder feedback
    const optimisticGuesses = [...guesses, guess];
    setLocalGuesses(optimisticGuesses);
    setCurrentGuess("");

    try {
      const fb = await submitGuessMutation.mutateAsync({
        guess,
        level: mode.type === "campaign" ? mode.level : undefined,
      });

      // Update with real feedback
      const newFeedbacks = [...feedbacks, fb];
      setLocalFeedbacks(newFeedbacks);

      // Check win/loss
      if (fb.every((v) => v === 2)) {
        setLocalStatus("won");
        toast.success("Solved", {
          description: `${optimisticGuesses.length} guess${optimisticGuesses.length > 1 ? "es" : ""} — on-chain proof secured.`,
        });
      } else if (optimisticGuesses.length >= 6) {
        setLocalStatus("lost");
        toast.error("Game over", {
          description: mode.type === "campaign" ? "Try this level again." : "Better luck tomorrow.",
        });
      }
    } catch (err: unknown) {
      // Rollback optimistic update
      setLocalGuesses(guesses);
      setLocalFeedbacks(feedbacks);

      if (err instanceof Error) {
        if (err.message.includes("User rejected")) return;
        if (err.message.includes("GuessInvalid")) {
          toast.error("Invalid guess", { description: "Must be a valid 5-letter word (a-z)." });
        } else if (err.message.includes("AlreadyGuessed")) {
          toast.warning("Already guessed", { description: "Try a different word." });
        } else if (!err.message.includes("signature")) {
          toast.error("Failed to submit guess");
        }
      }
    }
  }, [currentGuess, address, guesses, feedbacks, isSubmitting, submitGuessMutation, mode.type, mode.level]);

  // Sync local state when on-chain data updates (after invalidation)
  useEffect(() => {
    if (!onChainGame || !feedbacksResolved) return;

    // If on-chain has caught up with our local state, clear local overrides
    if (onChainGame.guesses.length >= localGuesses.length && localGuesses.length > 0) {
      setLocalGuesses([]);
      setLocalFeedbacks([]);
    }

    // Sync status from chain
    if (onChainGame.status === 1) setLocalStatus("won");
    else if (onChainGame.status === 2) setLocalStatus("lost");
  }, [onChainGame, feedbacksResolved, localGuesses.length]);

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
    day: onChainGame?.day || 0,
    isSubmitting,
    isLoading,
    handleKey,
    startGame,
  };
}

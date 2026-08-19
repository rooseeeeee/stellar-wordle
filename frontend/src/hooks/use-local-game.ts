"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameMode, GameStatus, KeyState } from "@/types/game";
import {
  evaluateGuessLocal,
  isValidGuess,
  getDailyGame,
  getCampaignGame,
  submitLocalGuess,
  markWordCompleted,
  getCurrentWordIndex,
  clearGameState,
  type LocalGameState,
} from "@/lib/engine";
import { CAMPAIGN_LEVELS } from "@/lib/words";

/**
 * Local game hook — fully offline Wordle engine.
 * No blockchain required. Game state persisted in localStorage.
 */
export function useLocalGame(mode: GameMode = { type: "daily" }) {
  const [gameState, setGameState] = useState<LocalGameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  // Track the mode key to detect changes
  const modeKey = mode.type === "campaign"
    ? `campaign-${mode.level}`
    : mode.type === "custom"
      ? `custom-${mode.word}`
      : "daily";

  const prevModeKey = useRef(modeKey);

  // Get campaign level number
  const campaignLevel = mode.type === "campaign" ? (mode.level || 1) : 0;

  // Mount
  useEffect(() => { setMounted(true); }, []);

  // Load/reload game when mode changes
  useEffect(() => {
    if (!mounted) return;

    // Reset state on mode change
    if (prevModeKey.current !== modeKey) {
      setCurrentGuess("");
      setShakeRow(null);
      prevModeKey.current = modeKey;
    }

    if (mode.type === "daily") {
      const state = getDailyGame();
      setGameState(state);
    } else if (mode.type === "campaign") {
      const idx = getCurrentWordIndex(campaignLevel);
      setWordIndex(idx);
      const config = CAMPAIGN_LEVELS.find((l) => l.level === campaignLevel);
      const totalWords = config?.wordCount || 3;

      if (idx >= totalWords) {
        const lastState = getCampaignGame(campaignLevel, totalWords - 1);
        setGameState(lastState);
      } else {
        const state = getCampaignGame(campaignLevel, idx);
        setGameState(state);
      }
    } else if (mode.type === "custom" && mode.word) {
      const state: LocalGameState = {
        word: mode.word.toLowerCase(),
        guesses: [],
        feedbacks: [],
        status: "playing",
        startedAt: Date.now(),
      };
      setGameState(state);
    }
  }, [mounted, modeKey, mode.type, mode.word, campaignLevel]);

  // Derived state
  const status: GameStatus = useMemo(() => {
    if (!mounted || !gameState) return "loading";

    if (mode.type === "campaign") {
      const config = CAMPAIGN_LEVELS.find((l) => l.level === campaignLevel);
      const totalWords = config?.wordCount || 3;
      if (wordIndex >= totalWords) return "won";
    }

    if (gameState.status === "won") return "won";
    if (gameState.status === "lost") return "lost";
    return "playing";
  }, [mounted, gameState, mode.type, campaignLevel, wordIndex]);

  const guesses = gameState?.guesses || [];
  const feedbacks = gameState?.feedbacks || [];

  // Keyboard letter states
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

  // Submit guess
  const submitGuess = useCallback(() => {
    if (!gameState || status !== "playing") return;
    if (currentGuess.length !== 5) {
      toast.warning("Word must be 5 letters");
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    const guess = currentGuess.toLowerCase();

    if (!isValidGuess(guess)) {
      toast.error("Invalid word");
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    if (guesses.includes(guess)) {
      toast.warning("Already guessed");
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    // For custom mode — no persistence
    if (mode.type === "custom") {
      const feedback = evaluateGuessLocal(gameState.word, guess);
      const newGuesses = [...gameState.guesses, guess];
      const newFeedbacks = [...gameState.feedbacks, feedback];
      let newStatus: LocalGameState["status"] = "playing";
      if (feedback.every((v) => v === 2)) newStatus = "won";
      else if (newGuesses.length >= 6) newStatus = "lost";

      setGameState({ ...gameState, guesses: newGuesses, feedbacks: newFeedbacks, status: newStatus });
      setCurrentGuess("");

      if (newStatus === "won") {
        toast.success("Solved!", { description: `${newGuesses.length} guess${newGuesses.length > 1 ? "es" : ""}` });
      } else if (newStatus === "lost") {
        toast.error("Game over", { description: `The word was ${gameState.word.toUpperCase()}` });
      }
      return;
    }

    // Daily or campaign — persist to localStorage
    let identifier: string;
    let persistMode: "daily" | "campaign";

    if (mode.type === "daily") {
      identifier = new Date().toISOString().split("T")[0];
      persistMode = "daily";
    } else {
      identifier = `L${campaignLevel}-W${wordIndex}`;
      persistMode = "campaign";
    }

    const newState = submitLocalGuess(persistMode, identifier, gameState, guess);
    setGameState(newState);
    setCurrentGuess("");

    if (newState.status === "won") {
      if (mode.type === "campaign") {
        markWordCompleted(campaignLevel, wordIndex);
        const config = CAMPAIGN_LEVELS.find((l) => l.level === campaignLevel);
        const totalWords = config?.wordCount || 3;
        const nextIdx = wordIndex + 1;

        if (nextIdx < totalWords) {
          toast.success("Word solved!", {
            description: `${newState.guesses.length} guess${newState.guesses.length > 1 ? "es" : ""} · Next word...`,
          });
          // Auto-advance to next word after delay
          setTimeout(() => {
            setWordIndex(nextIdx);
            const nextState = getCampaignGame(campaignLevel, nextIdx);
            setGameState(nextState);
            setCurrentGuess("");
          }, 1800);
        } else {
          toast.success("🎉 Level Complete!", { description: `All ${totalWords} words solved!` });
        }
      } else {
        toast.success("Solved!", {
          description: `${newState.guesses.length} guess${newState.guesses.length > 1 ? "es" : ""}`,
        });
      }
    } else if (newState.status === "lost") {
      toast.error("Game over", { description: `The word was ${newState.word.toUpperCase()}` });
    }
  }, [gameState, currentGuess, guesses, status, mode.type, campaignLevel, wordIndex]);

  // Handle key input
  const handleKey = useCallback(
    (key: string) => {
      if (status !== "playing") return;

      if (key === "Enter") {
        submitGuess();
      } else if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[a-z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [status, currentGuess, submitGuess]
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

  // Retry (campaign only)
  const retry = useCallback(() => {
    if (mode.type === "campaign") {
      clearGameState("campaign", `L${campaignLevel}-W${wordIndex}`);
      const newState = getCampaignGame(campaignLevel, wordIndex);
      setGameState(newState);
      setCurrentGuess("");
    }
  }, [mode.type, campaignLevel, wordIndex]);

  return {
    guesses,
    feedbacks,
    currentGuess,
    status,
    letterStates,
    isSubmitting: false,
    isLoading: !mounted || !gameState,
    shakeRow,
    word: gameState?.word || "",
    wordIndex,
    handleKey,
    startGame: () => {},
    retry,
  };
}

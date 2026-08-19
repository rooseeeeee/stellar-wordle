/**
 * Local Wordle Engine
 *
 * A fully client-side Wordle game engine that works without any blockchain
 * dependency. Handles guess evaluation, game state, and persistence via
 * localStorage. Used for:
 * - Campaign mode (each level has its own word)
 * - Daily play (calendar-based word without needing on-chain tx)
 * - Offline play
 */

import { getDailyWord, getWordForLevel } from "@/lib/words";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocalGameState {
  word: string;
  guesses: string[];
  feedbacks: number[][];
  status: "playing" | "won" | "lost";
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Core engine: evaluate a guess against a target word
// ---------------------------------------------------------------------------

/**
 * Evaluate a guess against the answer. Returns feedback array:
 * 0 = gray (not in word), 1 = yellow (wrong position), 2 = green (correct)
 *
 * Implements the same ADR-003 algorithm as the on-chain contract:
 * Green pass first, then yellow pass with count limiting.
 */
export function evaluateGuessLocal(answer: string, guess: string): number[] {
  const a = answer.toLowerCase().split("");
  const g = guess.toLowerCase().split("");
  const result = [0, 0, 0, 0, 0];
  const remaining = new Array(26).fill(0);

  // Green pass
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) {
      result[i] = 2; // GREEN
    } else {
      remaining[a[i].charCodeAt(0) - 97]++;
    }
  }

  // Yellow pass (count-limited)
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 2) {
      const idx = g[i].charCodeAt(0) - 97;
      if (remaining[idx] > 0) {
        result[i] = 1; // YELLOW
        remaining[idx]--;
      }
    }
  }

  return result;
}

/**
 * Validate a guess: must be exactly 5 lowercase letters.
 */
export function isValidGuess(guess: string): boolean {
  return /^[a-z]{5}$/.test(guess.toLowerCase());
}

// ---------------------------------------------------------------------------
// Persistence: save/load game state to localStorage
// ---------------------------------------------------------------------------

function getStorageKey(mode: "daily" | "campaign", identifier: string): string {
  return `stellar-wordle-${mode}-${identifier}`;
}

/**
 * Save game state to localStorage.
 */
export function saveGameState(
  mode: "daily" | "campaign",
  identifier: string,
  state: LocalGameState
): void {
  try {
    const key = getStorageKey(mode, identifier);
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Load game state from localStorage.
 */
export function loadGameState(
  mode: "daily" | "campaign",
  identifier: string
): LocalGameState | null {
  try {
    const key = getStorageKey(mode, identifier);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LocalGameState;
  } catch {
    return null;
  }
}

/**
 * Clear game state (for retry).
 */
export function clearGameState(mode: "daily" | "campaign", identifier: string): void {
  try {
    const key = getStorageKey(mode, identifier);
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Game factories
// ---------------------------------------------------------------------------

/**
 * Get or create a daily game for today.
 */
export function getDailyGame(): LocalGameState {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const existing = loadGameState("daily", today);
  if (existing) return existing;

  const word = getDailyWord(new Date());
  const state: LocalGameState = {
    word,
    guesses: [],
    feedbacks: [],
    status: "playing",
    startedAt: Date.now(),
  };
  saveGameState("daily", today, state);
  return state;
}

/**
 * Get or create a campaign level game.
 * Each level + word index combination has its own game.
 */
export function getCampaignGame(level: number, wordIndex: number): LocalGameState {
  const id = `L${level}-W${wordIndex}`;
  const existing = loadGameState("campaign", id);
  if (existing) return existing;

  const word = getWordForLevel(level, wordIndex);
  const state: LocalGameState = {
    word,
    guesses: [],
    feedbacks: [],
    status: "playing",
    startedAt: Date.now(),
  };
  saveGameState("campaign", id, state);
  return state;
}

/**
 * Submit a guess to a local game. Returns the updated state.
 */
export function submitLocalGuess(
  mode: "daily" | "campaign",
  identifier: string,
  state: LocalGameState,
  guess: string
): LocalGameState {
  const g = guess.toLowerCase();

  if (state.status !== "playing") return state;
  if (!isValidGuess(g)) return state;
  if (state.guesses.includes(g)) return state;

  const feedback = evaluateGuessLocal(state.word, g);
  const newGuesses = [...state.guesses, g];
  const newFeedbacks = [...state.feedbacks, feedback];

  let newStatus: LocalGameState["status"] = "playing";
  if (feedback.every((v) => v === 2)) {
    newStatus = "won";
  } else if (newGuesses.length >= 6) {
    newStatus = "lost";
  }

  const newState: LocalGameState = {
    ...state,
    guesses: newGuesses,
    feedbacks: newFeedbacks,
    status: newStatus,
  };

  saveGameState(mode, identifier, newState);
  return newState;
}

// ---------------------------------------------------------------------------
// Campaign progress tracking
// ---------------------------------------------------------------------------

export interface CampaignProgress {
  /** Level number → array of word indices completed */
  completed: Record<number, number[]>;
  /** Current word index for each level */
  current: Record<number, number>;
}

const CAMPAIGN_PROGRESS_KEY = "stellar-wordle-campaign-progress";

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_PROGRESS_KEY);
    if (raw) return JSON.parse(raw) as CampaignProgress;
  } catch {
    // Ignore
  }
  return { completed: {}, current: {} };
}

export function saveCampaignProgress(progress: CampaignProgress): void {
  try {
    localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore
  }
}

export function markWordCompleted(level: number, wordIndex: number): void {
  const progress = loadCampaignProgress();
  if (!progress.completed[level]) progress.completed[level] = [];
  if (!progress.completed[level].includes(wordIndex)) {
    progress.completed[level].push(wordIndex);
  }
  // Advance to next word
  progress.current[level] = (progress.current[level] || 0) + 1;
  saveCampaignProgress(progress);
}

export function getCurrentWordIndex(level: number): number {
  const progress = loadCampaignProgress();
  return progress.current[level] || 0;
}

export function getLevelProgress(level: number, totalWords: number): {
  completed: number;
  total: number;
  isComplete: boolean;
} {
  const progress = loadCampaignProgress();
  const completed = progress.completed[level]?.length || 0;
  return {
    completed,
    total: totalWords,
    isComplete: completed >= totalWords,
  };
}

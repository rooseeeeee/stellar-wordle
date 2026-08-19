/**
 * Stellar Wordle — Campaign Word List
 *
 * Words are organized by difficulty level.
 * Each campaign level draws from a specific difficulty tier.
 * The admin script uses this list to auto-set words via set_word().
 */

// Level 1-3: Common, everyday words (easy)
export const EASY_WORDS = [
  "crane", "house", "plant", "water", "light",
  "space", "heart", "stone", "flame", "ocean",
  "dream", "storm", "cloud", "earth", "music",
  "beach", "train", "candy", "paper", "happy",
  "green", "small", "large", "quick", "brave",
  "clean", "dance", "fresh", "smile", "shine",
];

// Level 4-6: Less common words (medium)
export const MEDIUM_WORDS = [
  "grain", "blaze", "frost", "dwarf", "glyph",
  "swirl", "prism", "crypt", "quirk", "plumb",
  "brine", "forge", "knelt", "haste", "denim",
  "vivid", "blunt", "crisp", "flint", "grout",
  "stark", "brisk", "plume", "spire", "vault",
  "gleam", "clasp", "drown", "plank", "ridge",
];

// Level 7-9: Tricky words (hard)
export const HARD_WORDS = [
  "nymph", "glyph", "fjord", "wryly", "lymph",
  "pygmy", "cynic", "caulk", "epoxy", "hyper",
  "knack", "whelk", "dough", "psalm", "wharf",
  "yacht", "joust", "usurp", "vapid", "wrung",
  "abyss", "expat", "guava", "itchy", "jazzy",
  "khaki", "llama", "naive", "plait", "quail",
];

// Level 10+: Championship words (expert)
export const EXPERT_WORDS = [
  "azure", "bayou", "crux", "foxed", "gauze",
  "helix", "ivory", "juicy", "kayak", "maxim",
  "nexus", "oxide", "pixel", "query", "rogue",
  "seize", "toxin", "ultra", "vixen", "waltz",
  "xenon", "yeast", "zesty", "abode", "bijou",
  "codec", "datum", "epoch", "fugal", "ghoul",
];

/** Campaign configuration */
export interface CampaignLevel {
  level: number;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  wordCount: number;
}

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  { level: 1, name: "First Light", description: "Common words to get started", difficulty: "easy", wordCount: 3 },
  { level: 2, name: "Nebula", description: "Warming up the engines", difficulty: "easy", wordCount: 3 },
  { level: 3, name: "Orbit", description: "Finding your rhythm", difficulty: "easy", wordCount: 4 },
  { level: 4, name: "Solar Flare", description: "Things get warmer", difficulty: "medium", wordCount: 3 },
  { level: 5, name: "Asteroid Belt", description: "Navigate carefully", difficulty: "medium", wordCount: 4 },
  { level: 6, name: "Deep Space", description: "Far from easy territory", difficulty: "medium", wordCount: 4 },
  { level: 7, name: "Black Hole", description: "Gravitational pull of hard words", difficulty: "hard", wordCount: 3 },
  { level: 8, name: "Quasar", description: "Blazing difficulty", difficulty: "hard", wordCount: 4 },
  { level: 9, name: "Supernova", description: "Explosive challenge", difficulty: "hard", wordCount: 5 },
  { level: 10, name: "Event Horizon", description: "Beyond the point of no return", difficulty: "expert", wordCount: 5 },
];

/**
 * Get a deterministic word for a given level and word index.
 * Uses a simple hash-based selection to ensure different words per level.
 */
export function getWordForLevel(level: number, wordIndex: number): string {
  const config = CAMPAIGN_LEVELS.find((l) => l.level === level);
  const difficulty = config?.difficulty || "easy";

  const pool =
    difficulty === "easy"
      ? EASY_WORDS
      : difficulty === "medium"
        ? MEDIUM_WORDS
        : difficulty === "hard"
          ? HARD_WORDS
          : EXPERT_WORDS;

  // Deterministic selection: combine level + wordIndex for uniqueness
  const index = ((level * 7 + wordIndex * 13) % pool.length + pool.length) % pool.length;
  return pool[index];
}

/**
 * Get all words for a campaign level.
 */
export function getWordsForLevel(level: number): string[] {
  const config = CAMPAIGN_LEVELS.find((l) => l.level === level) || CAMPAIGN_LEVELS[0];
  const words: string[] = [];
  for (let i = 0; i < config.wordCount; i++) {
    words.push(getWordForLevel(level, i));
  }
  return words;
}

/**
 * Daily word: rotates through all words based on the current date.
 * This ensures a different word every day without needing admin intervention.
 */
export function getDailyWord(): string {
  const allWords = [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS, ...EXPERT_WORDS];
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  return allWords[daysSinceEpoch % allWords.length];
}

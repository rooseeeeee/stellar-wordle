/**
 * Stellar Wordle — Word System
 *
 * Features:
 * - 500+ curated 5-letter words across 5 difficulty tiers
 * - 20 campaign levels with procedurally generated word sequences
 * - Calendar-based daily word generation (unique word every day for years)
 * - Deterministic seeded PRNG for reproducible word selection
 */

// ---------------------------------------------------------------------------
// Word pools by difficulty (curated, no obscure/offensive words)
// ---------------------------------------------------------------------------

// Tier 1: Beginner — very common English words
export const BEGINNER_WORDS = [
  "about", "above", "after", "again", "along", "avoid", "began", "being",
  "below", "black", "blank", "block", "board", "bonus", "bread", "break",
  "bring", "broad", "brown", "build", "candy", "carry", "catch", "cause",
  "chain", "chair", "cheap", "check", "chief", "child", "china", "claim",
  "class", "clean", "clear", "climb", "close", "cloud", "coach", "coast",
  "color", "comes", "could", "count", "court", "cover", "crane", "crash",
  "cream", "dance", "death", "depth", "doing", "doubt", "draft", "drain",
  "drama", "drawn", "dream", "dress", "drink", "drive", "early", "earth",
  "eight", "enjoy", "enter", "equal", "event", "every", "exact", "exist",
  "extra", "faith", "false", "fault", "fever", "field", "fight", "final",
  "flame", "flash", "flesh", "float", "flood", "floor", "force", "frame",
  "fresh", "front", "fruit", "given", "glass", "globe", "going", "grace",
  "grade", "grand", "grant", "grass", "grave", "great", "green", "gross",
  "group", "grown", "guard", "guess", "guide", "happy", "heart", "heavy",
  "honey", "horse", "hotel", "house", "human", "humor", "ideal", "image",
  "index", "inner", "input", "issue", "judge", "juice", "knock", "known",
  "labor", "large", "later", "laugh", "layer", "learn", "least", "leave",
  "legal", "level", "light", "limit", "links", "lives", "local", "logic",
  "loose", "lover", "lower", "lucky", "lunch", "magic", "major", "maker",
  "march", "match", "maybe", "mayor", "media", "metal", "might", "minor",
  "minus", "model", "money", "month", "moral", "motor", "mount", "mouse",
  "mouth", "music", "night", "noise", "north", "noted", "novel", "nurse",
  "ocean", "offer", "often", "opens", "order", "other", "outer", "owner",
  "paint", "panel", "paper", "party", "patch", "pause", "peace", "phone",
  "photo", "piano", "piece", "pilot", "pitch", "place", "plain", "plane",
  "plant", "plate", "plaza", "point", "pound", "power", "press", "price",
  "pride", "prime", "print", "prior", "prize", "proof", "proud", "prove",
  "queen", "quick", "quiet", "quote", "radio", "raise", "range", "rapid",
  "ratio", "reach", "ready", "realm", "reign", "relax", "reply", "right",
  "river", "robot", "rocky", "round", "route", "royal", "rural", "sadly",
  "saint", "salad", "scale", "scene", "score", "sense", "serve", "seven",
  "shall", "shape", "share", "sharp", "shelf", "shell", "shift", "shirt",
  "shock", "shoot", "shore", "short", "shout", "sight", "since", "skill",
  "sleep", "slide", "small", "smart", "smell", "smile", "smoke", "solar",
  "solid", "solve", "sorry", "sound", "south", "space", "spare", "speak",
  "speed", "spend", "split", "sport", "spray", "squad", "staff", "stage",
  "stake", "stand", "start", "state", "steal", "steam", "steel", "steep",
  "stick", "still", "stock", "stone", "store", "storm", "story", "stuck",
  "study", "style", "sugar", "super", "sweet", "swing", "table", "taken",
  "taste", "teach", "teeth", "thank", "theme", "there", "thick", "thing",
  "think", "third", "those", "three", "throw", "tight", "title", "today",
  "token", "total", "touch", "tough", "tower", "trace", "track", "trade",
  "trail", "train", "trait", "treat", "trend", "trial", "tribe", "trick",
  "truck", "truly", "trust", "truth", "twice", "twist", "uncle", "under",
  "union", "unite", "unity", "until", "upper", "upset", "urban", "usage",
  "usual", "valid", "value", "video", "virus", "visit", "vital", "vocal",
  "voice", "waste", "watch", "water", "wheel", "where", "which", "while",
  "white", "whole", "whose", "woman", "world", "worry", "worse", "worst",
  "worth", "would", "wound", "write", "wrong", "wrote", "young", "youth",
];

// Tier 2: Easy — common but slightly less frequent
export const EASY_WORDS = [
  "abide", "adapt", "adept", "adopt", "agile", "alien", "align", "alike",
  "alive", "alley", "angel", "anger", "ankle", "annex", "antic", "apple",
  "arena", "argue", "arise", "armor", "array", "arrow", "aside", "asset",
  "audio", "avail", "await", "awake", "award", "aware", "badge", "baker",
  "basin", "batch", "beach", "beast", "bench", "birth", "blade", "blame",
  "bland", "blast", "blaze", "bleed", "blend", "bless", "blind", "bliss",
  "bloom", "blown", "bluff", "blunt", "blush", "bonus", "booth", "bound",
  "brace", "brain", "brand", "brave", "breed", "bride", "brief", "brink",
  "brisk", "broke", "brook", "broth", "brush", "bunch", "burst", "buyer",
  "cabin", "cable", "camel", "cargo", "carve", "charm", "chase", "chest",
  "chill", "chunk", "civic", "civil", "clash", "clasp", "cling", "cloth",
  "clown", "comet", "comic", "coral", "couch", "craft", "crane", "crawl",
  "crazy", "creek", "creep", "crest", "crowd", "crown", "cruel", "crush",
  "cubic", "curve", "cycle", "dairy", "decay", "decor", "delay", "dense",
  "depot", "derby", "diner", "disco", "ditch", "dizzy", "dodge", "donor",
  "dozen", "drift", "drill", "drone", "drown", "dusty", "dwell", "eager",
  "easel", "eater", "elbow", "elder", "elect", "elite", "ember", "empty",
  "endow", "equip", "erode", "error", "ethic", "evade", "event", "exile",
  "expel", "faint", "fairy", "fancy", "feast", "ferry", "fiber", "fifty",
  "filth", "first", "fixed", "flair", "fleet", "fling", "flint", "flock",
  "flora", "floss", "flour", "flown", "fluid", "flush", "focus", "forge",
  "forth", "forum", "found", "frank", "fraud", "freak", "frost", "froze",
  "fungi", "ghost", "giant", "giddy", "gleam", "glide", "glint", "gloat",
  "globe", "gloom", "glory", "gloss", "gouge", "grain", "grasp", "greed",
  "grief", "grind", "gripe", "groan", "groom", "grope", "grove", "growl",
  "gruff", "guild", "guilt", "guise", "gully", "gusty", "habit", "harsh",
  "haste", "haven", "hazel", "hence", "hitch", "hoist", "holly", "honor",
  "hover", "humid", "hurry", "hyena", "icing", "imply", "incur", "ingot",
  "ivory", "kneel", "knife", "knobs", "label", "lance", "ledge", "lever",
  "linen", "liver", "lodge", "lofty", "lunar", "mango", "manor", "maple",
  "marsh", "medal", "mercy", "merit", "merry", "midst", "miner", "mimic",
  "moist", "motel", "mound", "mourn", "muddy", "mural", "naive", "naval",
];

// Tier 3: Medium — less common, requires broader vocabulary
export const MEDIUM_WORDS = [
  "abbot", "adorn", "affix", "aglow", "allot", "aloft", "amass", "ample",
  "annul", "anvil", "aorta", "aphid", "attic", "avian", "axiom", "azure",
  "balmy", "baron", "basic", "baton", "bayou", "beady", "belle", "berth",
  "bible", "bilge", "binge", "birch", "bland", "blare", "bleat", "bloat",
  "boast", "bogus", "bough", "brash", "brawl", "braze", "brine", "broad",
  "broil", "brood", "brook", "budge", "bulge", "burly", "bylaw", "cache",
  "cairn", "cameo", "carat", "carol", "cedar", "chafe", "chalk", "chant",
  "chasm", "cheek", "choir", "chord", "chore", "cinch", "circa", "clamp",
  "cleft", "clerk", "cliff", "clink", "cloak", "clone", "clout", "cobra",
  "cocoa", "colon", "covey", "cramp", "crank", "crass", "crave", "craze",
  "crepe", "crimp", "crook", "cross", "croup", "crude", "crumb", "crust",
  "cushy", "decal", "decoy", "delve", "denim", "depot", "digit", "dirge",
  "dodge", "dorky", "dowdy", "dread", "drool", "droop", "druid", "dunce",
  "dwarf", "easel", "edict", "eight", "elfin", "elude", "ember", "emcee",
  "envoy", "erect", "evict", "exalt", "expat", "exude", "facet", "faint",
  "farce", "fauna", "feign", "feint", "feral", "fetch", "fetid", "fiend",
  "filch", "finch", "fjord", "flail", "flake", "flank", "flare", "flask",
  "flaxy", "fleck", "fledge", "flesh", "flick", "fling", "flint", "flora",
  "floss", "flout", "fluke", "foggy", "foray", "forge", "forte", "frail",
  "frank", "fresh", "friar", "frond", "fugal", "fungi", "fusty", "gaffe",
  "gamut", "gauge", "gauze", "gavel", "gazer", "giddy", "glare", "gleam",
  "glean", "gloat", "gnash", "golem", "gorge", "gouge", "grace", "graft",
  "grain", "grasp", "graze", "greed", "greet", "grief", "grime", "gripe",
  "grits", "groan", "groin", "groom", "grope", "gross", "grout", "grove",
  "growl", "gruel", "gruff", "grunt", "guava", "gulch", "gully", "gusto",
  "gypsy", "haven", "havoc", "heath", "hedge", "heist", "helix", "heron",
  "hilly", "hitch", "hoard", "hoary", "holly", "homer", "hover", "hulky",
  "humus", "hyena", "idiom", "igloo", "imbue", "impel", "incur", "inept",
  "inert", "ingot", "inlet", "inter", "irate", "ivory", "jaunt", "jazzy",
  "jewel", "jiffy", "joust", "jumbo", "karma", "kayak", "kebab", "khaki",
  "knack", "knead", "kneel", "knelt", "knoll", "kudos", "lance", "larch",
  "larva", "latch", "ledge", "lemur", "lever", "lilac", "llama", "lodge",
];

// Tier 4: Hard — uncommon words, tricky letter patterns
export const HARD_WORDS = [
  "abash", "abbot", "abyss", "acrid", "adage", "addax", "aegis", "afoot",
  "allay", "alloy", "aloof", "amend", "amity", "angst", "annex", "antic",
  "aphid", "askew", "atoll", "avast", "azure", "balmy", "baulk", "bayou",
  "begat", "beget", "bijou", "blimp", "blitz", "bloke", "brawn", "brawl",
  "budge", "buggy", "bursa", "cabal", "cadre", "cairn", "calyx", "caulk",
  "cedar", "chasm", "chewy", "chive", "chord", "chunk", "cinch", "cirri",
  "clang", "clasp", "cleft", "cling", "cloak", "clump", "codec", "comet",
  "condo", "copse", "coral", "coven", "covet", "coyly", "cramp", "crank",
  "crass", "crave", "crawl", "creed", "crepe", "crick", "crone", "cross",
  "croup", "cubic", "cumin", "cynic", "datum", "delve", "demur", "denim",
  "depot", "dirge", "dizzy", "dodge", "dough", "dowdy", "dread", "drily",
  "droit", "drool", "dunce", "duvet", "dwarf", "dying", "edify", "eerie",
  "elfin", "elite", "elude", "emcee", "enact", "endow", "ensue", "envoy",
  "epoch", "epoxy", "erode", "ethos", "evoke", "exalt", "exert", "exile",
  "expat", "expel", "extra", "exude", "facet", "feign", "feint", "feral",
  "fetch", "fetid", "fiend", "filch", "fjord", "flail", "flank", "flask",
  "fleck", "fling", "flint", "flock", "flora", "floss", "flout", "fluke",
  "flush", "foamy", "foggy", "foray", "forte", "frail", "friar", "frond",
  "froth", "fugue", "fungi", "gaffe", "gamut", "gauge", "gauze", "gavel",
  "ghoul", "giddy", "girth", "glade", "gland", "glaze", "gleam", "glean",
  "glyph", "gnarly", "gnash", "golem", "gouge", "graft", "grasp", "graze",
  "greed", "grime", "gripe", "grits", "groan", "groin", "grope", "grout",
  "grove", "growl", "gruel", "gruff", "grunt", "guava", "guild", "guise",
  "gulch", "gully", "gusto", "heath", "hedge", "heist", "helix", "heron",
  "hitch", "hoard", "hoary", "hover", "humid", "humus", "hyena", "hyper",
  "idiom", "imbue", "impel", "incur", "inept", "inert", "ingot", "inlet",
  "irate", "irony", "ivory", "jaunt", "jazzy", "jewel", "jiffy", "joust",
  "karma", "kayak", "kebab", "khaki", "knack", "knead", "knelt", "knoll",
  "kudos", "lance", "larch", "larva", "latch", "lemur", "llama", "lofty",
  "lymph", "lyric", "magma", "maxim", "melee", "merge", "mimic", "mocha",
  "moist", "morph", "mulch", "mural", "musty", "myrrh", "nadir", "nexus",
  "niche", "nimby", "nymph", "oaken", "oasis", "occur", "onset", "optic",
];

// Tier 5: Expert — rare words, double letters, unusual patterns
export const EXPERT_WORDS = [
  "abhor", "acrid", "adept", "aegis", "afoot", "agape", "agate", "agave",
  "allay", "alloy", "aloof", "amass", "amity", "angst", "annul", "anvil",
  "aphid", "askew", "atoll", "augur", "avast", "axiom", "bayou", "begat",
  "beget", "bijou", "blimp", "blitz", "brawn", "budge", "bursa", "cabal",
  "cadre", "cairn", "calyx", "caulk", "chasm", "chewy", "chirp", "chord",
  "cinch", "cirri", "cleft", "cling", "clump", "codec", "copse", "coven",
  "covet", "coyly", "crass", "crick", "crone", "croup", "cubic", "cumin",
  "cynic", "datum", "demur", "dirge", "droit", "duvet", "dying", "edify",
  "eerie", "elfin", "elude", "emcee", "ensue", "envoy", "epoch", "epoxy",
  "erode", "ethos", "evoke", "exalt", "exert", "exile", "expel", "exude",
  "facet", "feign", "feint", "feral", "fetid", "fiend", "filch", "fjord",
  "flail", "flask", "fleck", "flung", "fluke", "foggy", "foray", "forte",
  "friar", "frond", "froth", "fugue", "fungi", "gaffe", "gamut", "gauge",
  "gauze", "gavel", "ghoul", "girth", "gland", "glaze", "glyph", "gnash",
  "golem", "gouge", "graft", "gripe", "groin", "grope", "grout", "gruel",
  "gruff", "guise", "gulch", "gusto", "heath", "heist", "helix", "heron",
  "hoard", "hoary", "humus", "hyena", "hyper", "idiom", "imbue", "impel",
  "incur", "inept", "inert", "inlet", "irate", "irony", "ivory", "jaunt",
  "jazzy", "jewel", "jiffy", "joust", "karma", "kayak", "kebab", "khaki",
  "knack", "knead", "knelt", "knoll", "kudos", "larch", "larva", "latch",
  "lemur", "llama", "lymph", "lyric", "magma", "maxim", "melee", "mimic",
  "mocha", "morph", "mulch", "musty", "myrrh", "nadir", "nexus", "niche",
  "nymph", "oaken", "oasis", "occur", "onset", "optic", "oxide", "ozone",
  "parch", "parse", "payee", "penal", "piety", "pixel", "plait", "plead",
  "plumb", "plume", "poach", "polyp", "poppy", "posit", "pouch", "prank",
  "prawn", "preen", "privy", "prone", "prowl", "prude", "prune", "psalm",
  "pygmy", "qualm", "quaff", "query", "queue", "quirk", "quota", "rabbi",
  "rebut", "redux", "renal", "repel", "rogue", "roost", "rover", "rupee",
  "savor", "scald", "scant", "scoff", "scout", "scowl", "seize", "shard",
  "shawl", "sheik", "shrew", "siege", "sixth", "skein", "slain", "slang",
  "sleek", "slept", "slick", "slung", "slunk", "smelt", "snare", "sneer",
  "snide", "snowy", "solar", "spasm", "spawn", "spelt", "spire", "spout",
  "squat", "squab", "staid", "stalk", "stave", "stead", "stern", "stilt",
  "stoic", "stole", "stork", "stout", "stove", "strew", "strut", "stunt",
  "suave", "swamp", "swear", "sweep", "swift", "swine", "swirl", "swoon",
  "tacit", "talon", "tardy", "taunt", "terse", "thief", "thorn", "thump",
  "tiara", "toxin", "tramp", "triad", "truce", "tuber", "tulip", "twang",
  "tweed", "ulcer", "ultra", "usher", "usurp", "utile", "vapid", "vault",
  "verge", "vigor", "vinyl", "viper", "vivid", "vixen", "vouch", "vowel",
  "waltz", "whelk", "whiff", "whirl", "wield", "wince", "witch", "wrath",
  "wring", "wrung", "wryly", "xenon", "yacht", "yearn", "yeast", "yield",
  "zesty", "zloty",
];

// ---------------------------------------------------------------------------
// Campaign Configuration — 20 levels with progressive difficulty
// ---------------------------------------------------------------------------

export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

export interface CampaignLevel {
  level: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  wordCount: number;
}

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  // Beginner tier (1-3)
  { level: 1, name: "First Light", description: "Common everyday words", difficulty: "beginner", wordCount: 3 },
  { level: 2, name: "Nebula", description: "Warming up the engines", difficulty: "beginner", wordCount: 3 },
  { level: 3, name: "Orbit", description: "Finding your rhythm", difficulty: "beginner", wordCount: 4 },

  // Easy tier (4-6)
  { level: 4, name: "Solar Wind", description: "Slightly trickier vocabulary", difficulty: "easy", wordCount: 3 },
  { level: 5, name: "Asteroid Belt", description: "Navigate with care", difficulty: "easy", wordCount: 4 },
  { level: 6, name: "Comet Trail", description: "Picking up speed", difficulty: "easy", wordCount: 4 },

  // Medium tier (7-10)
  { level: 7, name: "Solar Flare", description: "Things heat up", difficulty: "medium", wordCount: 3 },
  { level: 8, name: "Deep Space", description: "Far from easy territory", difficulty: "medium", wordCount: 4 },
  { level: 9, name: "Pulsar", description: "Rapid-fire vocabulary", difficulty: "medium", wordCount: 4 },
  { level: 10, name: "Gravity Well", description: "Hard to escape", difficulty: "medium", wordCount: 5 },

  // Hard tier (11-15)
  { level: 11, name: "Black Hole", description: "Gravitational pull of hard words", difficulty: "hard", wordCount: 3 },
  { level: 12, name: "Quasar", description: "Blazing difficulty", difficulty: "hard", wordCount: 4 },
  { level: 13, name: "Neutron Star", description: "Dense and unforgiving", difficulty: "hard", wordCount: 4 },
  { level: 14, name: "Supernova", description: "Explosive challenge", difficulty: "hard", wordCount: 5 },
  { level: 15, name: "Dark Matter", description: "Hidden and elusive", difficulty: "hard", wordCount: 5 },

  // Expert tier (16-20)
  { level: 16, name: "Event Horizon", description: "Beyond the point of no return", difficulty: "expert", wordCount: 4 },
  { level: 17, name: "Singularity", description: "Where logic breaks down", difficulty: "expert", wordCount: 5 },
  { level: 18, name: "Antimatter", description: "Everything you know is reversed", difficulty: "expert", wordCount: 5 },
  { level: 19, name: "Multiverse", description: "Infinite possibilities, one answer", difficulty: "expert", wordCount: 6 },
  { level: 20, name: "Big Bang", description: "The ultimate challenge", difficulty: "expert", wordCount: 7 },
];

// ---------------------------------------------------------------------------
// Seeded PRNG — Deterministic random for reproducible word selection
// ---------------------------------------------------------------------------

/**
 * Simple mulberry32 PRNG. Given the same seed, produces the same sequence.
 * Used for deterministic word selection across all clients.
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple string hash for seeding (djb2 algorithm).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned
}

// ---------------------------------------------------------------------------
// Word pool access by difficulty
// ---------------------------------------------------------------------------

function getPoolForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case "beginner":
      return BEGINNER_WORDS;
    case "easy":
      return EASY_WORDS;
    case "medium":
      return MEDIUM_WORDS;
    case "hard":
      return HARD_WORDS;
    case "expert":
      return EXPERT_WORDS;
  }
}

// ---------------------------------------------------------------------------
// Campaign word generation (procedural, deterministic)
// ---------------------------------------------------------------------------

/**
 * Get a deterministic word for a given level and word index.
 * Uses seeded PRNG so the same level always produces the same words.
 */
export function getWordForLevel(level: number, wordIndex: number): string {
  const config = CAMPAIGN_LEVELS.find((l) => l.level === level);
  const difficulty = config?.difficulty || "beginner";
  const pool = getPoolForDifficulty(difficulty);

  // Seed based on level + wordIndex for unique, deterministic selection
  const seed = hashString(`stellar-wordle-campaign-L${level}-W${wordIndex}`);
  const rng = mulberry32(seed);

  // Use the PRNG to pick an index, ensuring no duplicates within a level
  const usedIndices = new Set<number>();
  // Generate prior words to track used indices
  for (let i = 0; i < wordIndex; i++) {
    const priorSeed = hashString(`stellar-wordle-campaign-L${level}-W${i}`);
    const priorRng = mulberry32(priorSeed);
    let idx = Math.floor(priorRng() * pool.length);
    while (usedIndices.has(idx)) {
      idx = (idx + 1) % pool.length;
    }
    usedIndices.add(idx);
  }

  // Now pick this word's index
  let idx = Math.floor(rng() * pool.length);
  while (usedIndices.has(idx)) {
    idx = (idx + 1) % pool.length;
  }

  return pool[idx];
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

// ---------------------------------------------------------------------------
// Calendar-based daily word generation
// ---------------------------------------------------------------------------

/**
 * All words combined into a master pool for daily rotation.
 * This gives us 500+ words = over 1.5 years of unique daily words.
 */
const DAILY_POOL = [
  ...BEGINNER_WORDS,
  ...EASY_WORDS,
  ...MEDIUM_WORDS,
  ...HARD_WORDS,
  ...EXPERT_WORDS,
];

// Remove duplicates (some words appear in multiple tiers)
const UNIQUE_DAILY_POOL = [...new Set(DAILY_POOL)];

/**
 * Epoch date for the game — the "day 0" for word rotation.
 * Using 2026-01-01 as the anchor date.
 */
const EPOCH_DATE = new Date("2026-01-01T00:00:00Z");

/**
 * Get the game day number for a given date.
 * Day 0 = 2026-01-01, Day 1 = 2026-01-02, etc.
 */
export function getGameDay(date: Date = new Date()): number {
  const epochMs = EPOCH_DATE.getTime();
  const nowMs = date.getTime();
  return Math.floor((nowMs - epochMs) / (1000 * 60 * 60 * 24));
}

/**
 * Get the daily word for a given date (calendar-based).
 *
 * Uses a seeded PRNG keyed on year + day-of-year to ensure:
 * - Same word for everyone on the same day
 * - Different word every day
 * - No repeats within a ~1.5 year cycle
 * - Words cycle through all difficulty levels across the week
 */
export function getDailyWord(date: Date = new Date()): string {
  const gameDay = getGameDay(date);

  // Seed the PRNG with the game day + a salt
  const seed = hashString(`stellar-wordle-daily-${gameDay}-v2`);
  const rng = mulberry32(seed);

  // Vary difficulty by day of week:
  // Mon-Tue: beginner/easy, Wed-Thu: medium, Fri: hard, Sat-Sun: expert
  const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  let pool: string[];

  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday, Tuesday — easier
    pool = [...BEGINNER_WORDS, ...EASY_WORDS];
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    // Wednesday, Thursday — medium
    pool = [...EASY_WORDS, ...MEDIUM_WORDS];
  } else if (dayOfWeek === 5) {
    // Friday — hard
    pool = [...MEDIUM_WORDS, ...HARD_WORDS];
  } else {
    // Saturday, Sunday — expert (weekend warriors)
    pool = [...HARD_WORDS, ...EXPERT_WORDS];
  }

  const uniquePool = [...new Set(pool)];
  const index = Math.floor(rng() * uniquePool.length);
  return uniquePool[index];
}

/**
 * Get daily word info for display purposes.
 */
export function getDailyWordInfo(date: Date = new Date()): {
  word: string;
  gameDay: number;
  difficulty: string;
  dayOfWeek: string;
} {
  const gameDay = getGameDay(date);
  const dayOfWeek = date.getUTCDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let difficulty: string;
  if (dayOfWeek === 1 || dayOfWeek === 2) difficulty = "easy";
  else if (dayOfWeek === 3 || dayOfWeek === 4) difficulty = "medium";
  else if (dayOfWeek === 5) difficulty = "hard";
  else difficulty = "expert";

  return {
    word: getDailyWord(date),
    gameDay,
    difficulty,
    dayOfWeek: dayNames[dayOfWeek],
  };
}

/**
 * Get the next N daily words (for admin scheduling).
 */
export function getUpcomingWords(count: number = 7, startDate: Date = new Date()): Array<{
  date: string;
  word: string;
  difficulty: string;
}> {
  const results: Array<{ date: string; word: string; difficulty: string }> = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + i);
    const info = getDailyWordInfo(date);
    results.push({
      date: date.toISOString().split("T")[0],
      word: info.word,
      difficulty: info.difficulty,
    });
  }
  return results;
}

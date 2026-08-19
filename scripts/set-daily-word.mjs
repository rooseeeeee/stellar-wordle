#!/usr/bin/env node
/**
 * Stellar Wordle — Calendar-based Daily Word Setter
 *
 * Automatically sets the daily word on the Wordle contract based on the current date.
 * The word is procedurally generated using a seeded PRNG, ensuring:
 * - Same word for all players on the same day
 * - Different word every day
 * - Difficulty varies by day of week (Mon/Tue=easy, Wed/Thu=medium, Fri=hard, Sat/Sun=expert)
 *
 * Usage:
 *   node scripts/set-daily-word.mjs [--source deployer] [--date 2026-08-20] [--preview 7]
 *
 * Options:
 *   --source <identity>  Stellar identity to sign with (default: deployer)
 *   --date <YYYY-MM-DD>  Override today's date (useful for testing)
 *   --preview <N>        Preview the next N days without setting (dry run)
 */

import { execSync } from "child_process";

const CONTRACT = "CDXMKHTOJ74TPJS2XKL25V7R3MDQ5N766STNXH67SUSHK7DOLP2KMHSW";
const NETWORK = "testnet";
const SOURCE = process.argv.includes("--source")
  ? process.argv[process.argv.indexOf("--source") + 1]
  : "wordle-deployer";

// ---------------------------------------------------------------------------
// Word pools (same as frontend/src/lib/words.ts)
// ---------------------------------------------------------------------------

const BEGINNER_WORDS = [
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

const EASY_WORDS = [
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
  "elbow", "elder", "elect", "elite", "ember", "empty", "equip", "erode",
  "error", "ethic", "evade", "exile", "expel", "faint", "fairy", "fancy",
  "feast", "ferry", "fiber", "fifty", "filth", "first", "fixed", "flair",
  "fleet", "fling", "flint", "flock", "flora", "floss", "flour", "flown",
  "fluid", "flush", "focus", "forge", "forth", "forum", "found", "frank",
  "fraud", "freak", "frost", "froze", "fungi", "ghost", "giant", "giddy",
  "gleam", "glide", "glint", "gloat", "globe", "gloom", "glory", "gloss",
  "grain", "grasp", "greed", "grief", "grind", "gripe", "groan", "groom",
  "grove", "growl", "gruff", "guild", "guilt", "guise", "gully", "gusty",
  "habit", "harsh", "haste", "haven", "hazel", "hence", "hitch", "hoist",
  "holly", "honor", "hover", "humid", "hurry", "hyena", "icing", "imply",
  "incur", "ingot", "ivory", "kneel", "knife", "label", "lance", "ledge",
  "lever", "linen", "liver", "lodge", "lofty", "lunar", "mango", "manor",
  "maple", "marsh", "medal", "mercy", "merit", "merry", "midst", "miner",
  "mimic", "moist", "motel", "mound", "mourn", "muddy", "mural", "naive",
];

const MEDIUM_WORDS = [
  "abbot", "adorn", "affix", "aglow", "allot", "aloft", "amass", "ample",
  "annul", "anvil", "aorta", "aphid", "attic", "avian", "axiom", "azure",
  "balmy", "baron", "baton", "bayou", "beady", "belle", "berth", "bilge",
  "binge", "birch", "blare", "bleat", "bloat", "boast", "bogus", "bough",
  "brash", "brawl", "brine", "broil", "brood", "budge", "bulge", "burly",
  "bylaw", "cache", "cairn", "cameo", "carat", "carol", "cedar", "chafe",
  "chalk", "chant", "chasm", "cheek", "choir", "chord", "chore", "cinch",
  "circa", "clamp", "cleft", "clerk", "cliff", "clink", "cloak", "clone",
  "clout", "cobra", "cocoa", "colon", "covey", "cramp", "crank", "crass",
  "crave", "craze", "crepe", "crimp", "crook", "croup", "crude", "crumb",
  "crust", "cushy", "decal", "decoy", "delve", "denim", "digit", "dirge",
  "dorky", "dowdy", "dread", "drool", "droop", "druid", "dunce", "dwarf",
  "edict", "elfin", "elude", "emcee", "envoy", "erect", "evict", "exalt",
  "expat", "exude", "facet", "farce", "fauna", "feign", "feint", "feral",
  "fetch", "fetid", "fiend", "filch", "finch", "fjord", "flail", "flake",
  "flank", "flare", "flask", "fleck", "flint", "floss", "flout", "fluke",
  "foggy", "foray", "forge", "forte", "frail", "frank", "friar", "frond",
  "fugal", "fungi", "fusty", "gaffe", "gamut", "gauge", "gauze", "gavel",
  "giddy", "glare", "gleam", "glean", "gloat", "gnash", "golem", "gorge",
  "gouge", "graft", "grasp", "graze", "greet", "grime", "grits", "groin",
  "groom", "grope", "grout", "grove", "gruel", "grunt", "guava", "gulch",
  "gully", "gusto", "haven", "havoc", "heath", "hedge", "heist", "helix",
  "heron", "hilly", "hitch", "hoard", "hoary", "holly", "hover", "humus",
  "hyena", "idiom", "igloo", "imbue", "impel", "incur", "inept", "inert",
  "ingot", "inlet", "inter", "irate", "ivory", "jaunt", "jazzy", "jewel",
  "jiffy", "joust", "jumbo", "karma", "kayak", "kebab", "khaki", "knack",
  "knead", "kneel", "knelt", "knoll", "kudos", "lance", "larch", "larva",
  "latch", "ledge", "lemur", "lever", "lilac", "llama", "lodge",
];

const HARD_WORDS = [
  "abash", "abyss", "acrid", "adage", "aegis", "afoot", "allay", "alloy",
  "aloof", "amend", "amity", "angst", "antic", "aphid", "askew", "atoll",
  "avast", "azure", "balmy", "baulk", "bayou", "begat", "beget", "bijou",
  "blimp", "blitz", "bloke", "brawn", "brawl", "budge", "bursa", "cabal",
  "cadre", "cairn", "calyx", "caulk", "cedar", "chasm", "chewy", "chive",
  "chord", "cinch", "cirri", "clang", "clasp", "cleft", "cling", "cloak",
  "clump", "codec", "comet", "condo", "copse", "coral", "coven", "covet",
  "coyly", "cramp", "crank", "crass", "crave", "creed", "crepe", "crick",
  "crone", "croup", "cubic", "cumin", "cynic", "datum", "delve", "demur",
  "denim", "dirge", "dizzy", "dough", "dowdy", "dread", "drily", "droit",
  "drool", "dunce", "duvet", "dwarf", "dying", "edify", "eerie", "elfin",
  "elite", "elude", "emcee", "enact", "ensue", "envoy", "epoch", "epoxy",
  "erode", "ethos", "evoke", "exalt", "exert", "exile", "expat", "expel",
  "exude", "facet", "feign", "feint", "feral", "fetch", "fetid", "fiend",
  "filch", "fjord", "flail", "flank", "flask", "fleck", "fling", "flint",
  "flock", "flora", "floss", "flout", "fluke", "flush", "foamy", "foggy",
  "foray", "forte", "frail", "friar", "frond", "froth", "fugue", "fungi",
  "gaffe", "gamut", "gauge", "gauze", "gavel", "ghoul", "girth", "glade",
  "gland", "glaze", "gleam", "glean", "glyph", "gnash", "golem", "gouge",
  "graft", "grasp", "graze", "grime", "gripe", "grits", "groan", "groin",
  "grope", "grout", "grove", "growl", "gruel", "gruff", "grunt", "guava",
  "guild", "guise", "gulch", "gully", "gusto", "heath", "hedge", "heist",
  "helix", "heron", "hitch", "hoard", "hoary", "hover", "humid", "humus",
  "hyena", "hyper", "idiom", "imbue", "impel", "incur", "inept", "inert",
  "ingot", "inlet", "irate", "irony", "ivory", "jaunt", "jazzy", "jewel",
  "jiffy", "joust", "karma", "kayak", "kebab", "khaki", "knack", "knead",
  "knelt", "knoll", "kudos", "lance", "larch", "larva", "latch", "lemur",
  "llama", "lofty", "lymph", "lyric", "magma", "maxim", "melee", "mimic",
  "mocha", "morph", "mulch", "mural", "musty", "myrrh", "nadir", "nexus",
  "niche", "nymph", "oaken", "oasis", "occur", "onset", "optic",
];

const EXPERT_WORDS = [
  "abhor", "acrid", "aegis", "afoot", "agape", "agate", "agave", "allay",
  "alloy", "aloof", "amass", "amity", "angst", "annul", "anvil", "aphid",
  "askew", "atoll", "augur", "avast", "axiom", "bayou", "begat", "beget",
  "bijou", "blimp", "blitz", "brawn", "budge", "bursa", "cabal", "cadre",
  "cairn", "calyx", "caulk", "chasm", "chewy", "chirp", "chord", "cinch",
  "cirri", "cleft", "cling", "clump", "codec", "copse", "coven", "covet",
  "coyly", "crass", "crick", "crone", "croup", "cubic", "cumin", "cynic",
  "datum", "demur", "dirge", "droit", "duvet", "dying", "edify", "eerie",
  "elfin", "elude", "emcee", "ensue", "envoy", "epoch", "epoxy", "erode",
  "ethos", "evoke", "exalt", "exert", "exile", "expel", "exude", "facet",
  "feign", "feint", "feral", "fetid", "fiend", "filch", "fjord", "flail",
  "flask", "fleck", "flung", "fluke", "foggy", "foray", "forte", "friar",
  "frond", "froth", "fugue", "fungi", "gaffe", "gamut", "gauge", "gauze",
  "gavel", "ghoul", "girth", "gland", "glaze", "glyph", "gnash", "golem",
  "gouge", "graft", "gripe", "groin", "grope", "grout", "gruel", "gruff",
  "guise", "gulch", "gusto", "heath", "heist", "helix", "heron", "hoard",
  "hoary", "humus", "hyena", "hyper", "idiom", "imbue", "impel", "incur",
  "inept", "inert", "inlet", "irate", "irony", "ivory", "jaunt", "jazzy",
  "jewel", "jiffy", "joust", "karma", "kayak", "kebab", "khaki", "knack",
  "knead", "knelt", "knoll", "kudos", "larch", "larva", "latch", "lemur",
  "llama", "lymph", "lyric", "magma", "maxim", "melee", "mimic", "mocha",
  "morph", "mulch", "musty", "myrrh", "nadir", "nexus", "niche", "nymph",
  "oaken", "oasis", "occur", "onset", "optic", "oxide", "ozone", "parch",
  "parse", "penal", "piety", "pixel", "plait", "plead", "plumb", "plume",
  "poach", "polyp", "poppy", "posit", "pouch", "prank", "prawn", "preen",
  "privy", "prone", "prowl", "prude", "prune", "psalm", "pygmy", "qualm",
  "quaff", "query", "quirk", "quota", "rabbi", "rebut", "redux", "renal",
  "repel", "rogue", "roost", "rover", "rupee", "savor", "scald", "scant",
  "scoff", "scout", "scowl", "seize", "shard", "shawl", "sheik", "shrew",
  "siege", "sixth", "skein", "slain", "slang", "sleek", "slept", "slick",
  "slung", "slunk", "smelt", "snare", "sneer", "snide", "snowy", "spasm",
  "spawn", "spelt", "spire", "spout", "squat", "staid", "stalk", "stave",
  "stead", "stern", "stilt", "stoic", "stole", "stork", "stout", "stove",
  "strew", "strut", "stunt", "suave", "swamp", "swear", "sweep", "swift",
  "swine", "swirl", "swoon", "tacit", "talon", "tardy", "taunt", "terse",
  "thief", "thorn", "thump", "tiara", "toxin", "tramp", "triad", "truce",
  "tuber", "tulip", "twang", "tweed", "ulcer", "ultra", "usher", "usurp",
  "vapid", "vault", "verge", "vigor", "vinyl", "viper", "vivid", "vixen",
  "vouch", "vowel", "waltz", "whelk", "whiff", "whirl", "wield", "wince",
  "witch", "wrath", "wring", "wrung", "wryly", "xenon", "yacht", "yearn",
  "yeast", "yield", "zesty", "zloty",
];

// ---------------------------------------------------------------------------
// Seeded PRNG (same as frontend)
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Calendar-based daily word generation
// ---------------------------------------------------------------------------

function getDailyWord(date = new Date()) {
  const epochDate = new Date("2026-01-01T00:00:00Z");
  const gameDay = Math.floor((date.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const seed = hashString(`stellar-wordle-daily-${gameDay}-v2`);
  const rng = mulberry32(seed);

  const dayOfWeek = date.getUTCDay();
  let pool;

  if (dayOfWeek === 1 || dayOfWeek === 2) {
    pool = [...BEGINNER_WORDS, ...EASY_WORDS];
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    pool = [...EASY_WORDS, ...MEDIUM_WORDS];
  } else if (dayOfWeek === 5) {
    pool = [...MEDIUM_WORDS, ...HARD_WORDS];
  } else {
    pool = [...HARD_WORDS, ...EXPERT_WORDS];
  }

  const uniquePool = [...new Set(pool)];
  const index = Math.floor(rng() * uniquePool.length);
  return uniquePool[index];
}

function getDailyWordInfo(date = new Date()) {
  const epochDate = new Date("2026-01-01T00:00:00Z");
  const gameDay = Math.floor((date.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayOfWeek = date.getUTCDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let difficulty;
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

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

// Parse --date option
const dateIdx = process.argv.indexOf("--date");
const targetDate = dateIdx !== -1 && process.argv[dateIdx + 1]
  ? new Date(process.argv[dateIdx + 1] + "T00:00:00Z")
  : new Date();

// Parse --preview option
const previewIdx = process.argv.indexOf("--preview");
const previewCount = previewIdx !== -1 && process.argv[previewIdx + 1]
  ? parseInt(process.argv[previewIdx + 1], 10)
  : 0;

if (previewCount > 0) {
  console.log(`\n📅 Upcoming ${previewCount} daily words:\n`);
  console.log("  Date        Day  Difficulty  Word");
  console.log("  ────────────────────────────────────────");
  for (let i = 0; i < previewCount; i++) {
    const d = new Date(targetDate);
    d.setUTCDate(d.getUTCDate() + i);
    const info = getDailyWordInfo(d);
    const dateStr = d.toISOString().split("T")[0];
    const pad = (s, n) => s.padEnd(n);
    console.log(`  ${dateStr}  ${String(info.gameDay).padStart(3)}  ${pad(info.difficulty, 10)}  ${info.word}  (${info.dayOfWeek})`);
  }
  console.log("");
  process.exit(0);
}

const info = getDailyWordInfo(targetDate);
const word = info.word;

console.log(`\n🌟 Stellar Wordle — Daily Word Setter\n`);
console.log(`  Date:       ${targetDate.toISOString().split("T")[0]} (${info.dayOfWeek})`);
console.log(`  Game Day:   ${info.gameDay}`);
console.log(`  Difficulty: ${info.difficulty}`);
console.log(`  Word:       ${word}`);
console.log(`  Contract:   ${CONTRACT}`);
console.log(`  Network:    ${NETWORK}`);
console.log(`  Source:     ${SOURCE}`);
console.log("");

try {
  const result = execSync(
    `stellar contract invoke --id ${CONTRACT} --source ${SOURCE} --network ${NETWORK} -- set_word --word "${word}"`,
    { encoding: "utf-8", timeout: 60000 }
  ).trim();
  console.log(`  ✅ Day set to: ${result}`);
  console.log("  Done.\n");
} catch (err) {
  console.error(`  ❌ Failed to set word: ${err.message}`);
  process.exit(1);
}

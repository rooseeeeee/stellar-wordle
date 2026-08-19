#!/usr/bin/env node
/**
 * Auto-set a random daily word on the Wordle contract.
 * Run this daily via cron or manually:
 *   node scripts/set-daily-word.mjs [--source deployer]
 *
 * The word is selected deterministically from the word list based on the date,
 * ensuring the same word for all players on the same day, but different each day.
 */

import { execSync } from "child_process";

const CONTRACT = "CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB";
const NETWORK = "testnet";
const SOURCE = process.argv.includes("--source")
  ? process.argv[process.argv.indexOf("--source") + 1]
  : "deployer";

// Full word pool — 120 curated 5-letter words
const WORDS = [
  "crane", "house", "plant", "water", "light",
  "space", "heart", "stone", "flame", "ocean",
  "dream", "storm", "cloud", "earth", "music",
  "beach", "train", "candy", "paper", "happy",
  "green", "small", "large", "quick", "brave",
  "clean", "dance", "fresh", "smile", "shine",
  "grain", "blaze", "frost", "dwarf", "glyph",
  "swirl", "prism", "crypt", "quirk", "plumb",
  "brine", "forge", "knelt", "haste", "denim",
  "vivid", "blunt", "crisp", "flint", "grout",
  "stark", "brisk", "plume", "spire", "vault",
  "gleam", "clasp", "drown", "plank", "ridge",
  "nymph", "fjord", "wryly", "lymph", "pygmy",
  "cynic", "caulk", "epoxy", "hyper", "knack",
  "whelk", "dough", "psalm", "wharf", "yacht",
  "joust", "usurp", "vapid", "wrung", "abyss",
  "expat", "guava", "itchy", "jazzy", "khaki",
  "llama", "naive", "plait", "quail", "azure",
  "bayou", "foxed", "gauze", "helix", "ivory",
  "juicy", "kayak", "maxim", "nexus", "oxide",
  "pixel", "query", "rogue", "seize", "toxin",
  "ultra", "vixen", "waltz", "xenon", "yeast",
  "zesty", "abode", "bijou", "codec", "datum",
  "epoch", "fugal", "ghoul", "hoist", "ingot",
];

// Deterministic daily word based on date
function getDailyWord() {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  // Use a prime multiplier for better distribution
  const index = (daysSinceEpoch * 31) % WORDS.length;
  return WORDS[index];
}

const word = getDailyWord();
console.log(`Setting daily word: ${word}`);
console.log(`Contract: ${CONTRACT}`);
console.log(`Network: ${NETWORK}`);
console.log(`Source: ${SOURCE}`);
console.log("");

try {
  const result = execSync(
    `stellar contract invoke --id ${CONTRACT} --source ${SOURCE} --network ${NETWORK} -- set_word --word "${word}"`,
    { encoding: "utf-8", timeout: 60000 }
  ).trim();
  console.log(`Day set to: ${result}`);
  console.log("Done.");
} catch (err) {
  console.error("Failed to set word:", err.message);
  process.exit(1);
}

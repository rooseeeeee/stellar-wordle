import { NextResponse } from "next/server";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Keypair,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";

/**
 * API Route: /api/set-daily-word
 *
 * Auto-sets today's word on-chain if not already set.
 * Called on frontend first load. Uses the deployer key server-side.
 * This ensures the daily word is always available without a cron job.
 */

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;
const DEPLOYER_SECRET = process.env.DEPLOYER_SECRET_KEY!;

const server = new rpc.Server(RPC_URL);

// ---------------------------------------------------------------------------
// Word generation (same logic as frontend/src/lib/words.ts)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// Subset of words for daily generation (common 5-letter words)
const WORD_POOL = [
  "crane", "house", "plant", "water", "light", "space", "heart", "stone",
  "flame", "ocean", "dream", "storm", "cloud", "earth", "music", "beach",
  "train", "candy", "paper", "happy", "green", "small", "large", "quick",
  "brave", "clean", "dance", "fresh", "smile", "shine", "grain", "blaze",
  "frost", "dwarf", "swirl", "prism", "quirk", "brine", "forge", "haste",
  "denim", "vivid", "blunt", "crisp", "flint", "grout", "stark", "brisk",
  "plume", "spire", "vault", "gleam", "clasp", "drown", "plank", "ridge",
  "nymph", "glyph", "fjord", "wryly", "lymph", "pygmy", "cynic", "caulk",
  "epoxy", "hyper", "knack", "whelk", "dough", "psalm", "wharf", "yacht",
  "joust", "usurp", "vapid", "wrung", "abyss", "expat", "guava", "jazzy",
  "khaki", "llama", "naive", "plait", "quail", "azure", "bayou", "gauze",
  "helix", "ivory", "juicy", "kayak", "maxim", "nexus", "oxide", "pixel",
  "query", "rogue", "seize", "toxin", "ultra", "vixen", "waltz", "xenon",
  "yeast", "zesty", "abode", "bijou", "codec", "datum", "epoch", "ghoul",
  "about", "above", "after", "again", "along", "began", "being", "below",
  "black", "board", "bring", "broad", "brown", "build", "carry", "catch",
  "cause", "chain", "chair", "cheap", "check", "chief", "child", "claim",
  "class", "clear", "climb", "close", "coach", "coast", "color", "count",
  "court", "cover", "crash", "cream", "crowd", "death", "depth", "doubt",
  "draft", "drain", "drama", "drawn", "dress", "drink", "drive", "early",
];

function getDailyWord(date: Date = new Date()): string {
  const epochDate = new Date("2026-01-01T00:00:00Z");
  const gameDay = Math.floor((date.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const seed = hashString(`stellar-wordle-daily-${gameDay}-v2`);
  const rng = mulberry32(seed);
  const index = Math.floor(rng() * WORD_POOL.length);
  return WORD_POOL[index];
}

// ---------------------------------------------------------------------------
// Track last set day to avoid redundant calls
// ---------------------------------------------------------------------------

let lastSetDay: string | null = null;

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // Already set today (in-memory cache)
  if (lastSetDay === today) {
    return NextResponse.json({ status: "already_set", day: today });
  }

  if (!DEPLOYER_SECRET || !CONTRACT_ID) {
    return NextResponse.json({ status: "error", message: "Missing env config" }, { status: 500 });
  }

  try {
    const word = getDailyWord(new Date());
    const keypair = Keypair.fromSecret(DEPLOYER_SECRET);
    const contract = new Contract(CONTRACT_ID);

    // Get the deployer's account
    const account = await server.getAccount(keypair.publicKey());

    // Build the set_word transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("set_word", nativeToScVal(word, { type: "string" })))
      .setTimeout(30)
      .build();

    // Simulate
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      // Might already be set — check if it's a "same word" error or similar
      lastSetDay = today;
      return NextResponse.json({ status: "already_set", day: today, word });
    }

    // Assemble and sign
    const assembled = rpc.assembleTransaction(tx, sim).build();
    assembled.sign(keypair);

    // Submit
    const response = await server.sendTransaction(assembled);
    if (response.status === "ERROR") {
      return NextResponse.json({ status: "error", message: "Tx rejected" }, { status: 500 });
    }

    // Poll for confirmation
    for (let i = 0; i < 10; i++) {
      const result = await server.getTransaction(response.hash);
      if (result.status === "SUCCESS") {
        lastSetDay = today;
        const dayNumber = result.returnValue ? Number(scValToNative(result.returnValue)) : 0;
        return NextResponse.json({ status: "set", day: today, word, dayNumber, hash: response.hash });
      }
      if (result.status === "FAILED") {
        // Likely already set for today
        lastSetDay = today;
        return NextResponse.json({ status: "already_set", day: today, word });
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Timeout but probably went through
    lastSetDay = today;
    return NextResponse.json({ status: "pending", day: today, word, hash: response.hash });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // If it fails, mark as set anyway to avoid retry loops
    lastSetDay = today;
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

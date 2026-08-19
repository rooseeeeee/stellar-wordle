"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { toast } from "sonner";
import { useWallet } from "@/providers/wallet-provider";
import { STELLAR_CONFIG } from "@/lib/stellar-config";

const server = new rpc.Server(STELLAR_CONFIG.rpcUrl);
const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL = 2000;

// ---------------------------------------------------------------------------
// Low-level contract helpers
// ---------------------------------------------------------------------------

async function simulateRead(
  method: string,
  args: xdr.ScVal[] = [],
  callerAddress?: string
): Promise<xdr.ScVal | null> {
  const contract = new Contract(STELLAR_CONFIG.contractId);
  const account = await server.getAccount(
    callerAddress || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(
      `Simulation failed: ${(sim as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  const result = (sim as rpc.Api.SimulateTransactionSuccessResponse).result;
  return result?.retval ?? null;
}

async function submitWrite(
  method: string,
  args: xdr.ScVal[],
  address: string
): Promise<xdr.ScVal | undefined> {
  const contract = new Contract(STELLAR_CONFIG.contractId);

  const account = await server.getAccount(address);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate
  toast.loading("Preparing transaction...", { id: "tx-progress" });
  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    const errMsg = (sim as rpc.Api.SimulateTransactionErrorResponse).error;
    toast.error("Transaction failed", { id: "tx-progress", description: errMsg });
    throw new Error(`Simulation failed: ${errMsg}`);
  }

  // Assemble & sign
  const assembled = rpc.assembleTransaction(tx, sim).build();
  toast.loading("Waiting for signature...", { id: "tx-progress" });

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(
    assembled.toXDR(),
    { networkPassphrase: STELLAR_CONFIG.networkPassphrase, address }
  );

  // Submit
  toast.loading("Submitting to network...", { id: "tx-progress" });
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_CONFIG.networkPassphrase);
  const response = await server.sendTransaction(signedTx);

  if (response.status === "ERROR") {
    toast.error("Transaction rejected", { id: "tx-progress" });
    throw new Error("Transaction submission failed");
  }

  // Poll
  toast.loading("Confirming on chain...", { id: "tx-progress" });
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const getResponse = await server.getTransaction(response.hash);

    if (getResponse.status === "SUCCESS") {
      toast.success("Confirmed", {
        id: "tx-progress",
        description: `Hash: ${response.hash.slice(0, 8)}...`,
      });
      return getResponse.returnValue;
    }

    if (getResponse.status === "FAILED") {
      toast.error("Transaction failed on-chain", { id: "tx-progress" });
      throw new Error("Transaction failed");
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  toast.warning("Confirmation pending", {
    id: "tx-progress",
    description: "Check explorer for status.",
  });
  throw new Error("Transaction confirmation timeout");
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  playerGame: (address: string | null) => ["playerGame", address] as const,
  playerStats: (address: string | null) => ["playerStats", address] as const,
  leaderboard: () => ["leaderboard"] as const,
  day: () => ["day"] as const,
};

// ---------------------------------------------------------------------------
// Parsed types
// ---------------------------------------------------------------------------

export interface PlayerGameData {
  day: number;
  guesses: string[];
  status: number; // 0=active, 1=won, 2=lost
  lastFeedback: number[];
}

export interface PlayerStatsData {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

export interface LeaderboardEntryData {
  player: string;
  wins: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// React Query Hooks — Reads
// ---------------------------------------------------------------------------

/**
 * Fetch current player game state. Auto-refetches when invalidated.
 */
export function usePlayerGame() {
  const { address } = useWallet();

  return useQuery({
    queryKey: queryKeys.playerGame(address),
    queryFn: async (): Promise<PlayerGameData | null> => {
      if (!address) return null;

      const result = await simulateRead(
        "get_player_game",
        [new Address(address).toScVal()],
        address
      );

      if (!result) return null;

      const raw = scValToNative(result) as Record<string, unknown> | null;
      if (!raw) return null;

      return {
        day: Number(raw.day ?? 0),
        guesses: ((raw.guesses || []) as string[]).map((g) => g.toLowerCase()),
        status: Number(raw.status ?? 0),
        lastFeedback: ((raw.last_feedback || []) as unknown[]).map((v) => Number(v)),
      };
    },
    enabled: !!address,
    staleTime: 5_000,
    refetchInterval: 30_000, // Poll every 30s for updates
  });
}

/**
 * Fetch player stats.
 */
export function usePlayerStats() {
  const { address } = useWallet();

  return useQuery({
    queryKey: queryKeys.playerStats(address),
    queryFn: async (): Promise<PlayerStatsData | null> => {
      if (!address) return null;

      const result = await simulateRead(
        "get_player_stats",
        [new Address(address).toScVal()],
        address
      );

      if (!result) return null;

      const raw = scValToNative(result) as Record<string, unknown>;
      return {
        gamesPlayed: Number(raw.games_played ?? 0),
        gamesWon: Number(raw.games_won ?? 0),
        currentStreak: Number(raw.current_streak ?? 0),
        maxStreak: Number(raw.max_streak ?? 0),
        guessDistribution: ((raw.guess_distribution || []) as unknown[]).map((v) => Number(v)),
      };
    },
    enabled: !!address,
    staleTime: 10_000,
  });
}

/**
 * Fetch global leaderboard.
 */
export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard(),
    queryFn: async (): Promise<LeaderboardEntryData[]> => {
      const result = await simulateRead("get_leaderboard", []);
      if (!result) return [];

      const raw = scValToNative(result) as Array<Record<string, unknown>>;
      return (raw || []).map((entry) => ({
        player: String(entry.player),
        wins: Number(entry.wins),
        streak: Number(entry.streak),
      }));
    },
    staleTime: 15_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  });
}

/**
 * Fetch current day number.
 */
export function useCurrentDay() {
  return useQuery({
    queryKey: queryKeys.day(),
    queryFn: async (): Promise<number> => {
      const result = await simulateRead("get_day", []);
      if (!result) return 0;
      return Number(scValToNative(result));
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// React Query Hooks — Mutations (writes)
// ---------------------------------------------------------------------------

/**
 * Start a new game. Invalidates playerGame query on success.
 */
export function useStartGame() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts?: { level?: number }) => {
      if (!address) throw new Error("Wallet not connected");

      const args: xdr.ScVal[] = [new Address(address).toScVal()];
      if (opts?.level) {
        args.push(nativeToScVal(opts.level, { type: "u32" }));
      }

      await submitWrite("start_game", args, address);
    },
    onSuccess: () => {
      // Invalidate game state — triggers re-fetch
      queryClient.invalidateQueries({ queryKey: queryKeys.playerGame(address) });
    },
    onError: (err: Error) => {
      if (err.message.includes("User rejected")) return; // Don't toast on user cancel
      // If already started, that's fine
      if (!err.message.includes("already")) {
        toast.error("Failed to start game");
      }
    },
  });
}

/**
 * Submit a guess. Returns feedback. Invalidates playerGame, stats, leaderboard.
 */
export function useSubmitGuess() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { guess: string; level?: number }): Promise<number[]> => {
      if (!address) throw new Error("Wallet not connected");

      const args: xdr.ScVal[] = [
        new Address(address).toScVal(),
        nativeToScVal(opts.guess, { type: "string" }),
      ];
      if (opts.level) {
        args.push(nativeToScVal(opts.level, { type: "u32" }));
      }

      const returnValue = await submitWrite("submit_guess", args, address);

      // Parse feedback Vec<u32>
      if (!returnValue) return [0, 0, 0, 0, 0];
      const raw = scValToNative(returnValue);
      return (Array.isArray(raw) ? raw : []).map((v: unknown) => Number(v));
    },
    onSuccess: () => {
      // Invalidate all related queries — they'll auto-refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.playerGame(address) });
      queryClient.invalidateQueries({ queryKey: queryKeys.playerStats(address) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard() });
    },
  });
}

// ---------------------------------------------------------------------------
// Evaluate (read-only, for restoring feedback on previous guesses)
// ---------------------------------------------------------------------------

export async function evaluateGuess(guess: string): Promise<number[]> {
  const result = await simulateRead("evaluate", [
    nativeToScVal(guess, { type: "string" }),
  ]);
  if (!result) return [0, 0, 0, 0, 0];
  const raw = scValToNative(result);
  return (Array.isArray(raw) ? raw : []).map((v: unknown) => Number(v));
}

// ---------------------------------------------------------------------------
// Legacy hook (kept for backward compat, delegates to new functions)
// ---------------------------------------------------------------------------

export function useContract(contractId?: string) {
  const { address } = useWallet();
  const id = contractId || STELLAR_CONFIG.contractId;

  const read = useCallback(
    async <T = unknown>(method: string, args: xdr.ScVal[] = []): Promise<T> => {
      const result = await simulateRead(method, args, address || undefined);
      return result as unknown as T;
    },
    [address, id]
  );

  const write = useCallback(
    async <T = unknown>(method: string, args: xdr.ScVal[] = []): Promise<T> => {
      if (!address) throw new Error("Wallet not connected");
      const result = await submitWrite(method, args, address);
      return result as unknown as T;
    },
    [address, id]
  );

  return { read, write };
}

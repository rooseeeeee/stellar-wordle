"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Board } from "@/components/game/Board";
import { Keyboard } from "@/components/game/Keyboard";
import { useLocalGame } from "@/hooks/use-local-game";
import { useGame } from "@/hooks/use-game";
import { useWallet } from "@/providers/wallet-provider";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { GameMode } from "@/types/game";
import { CAMPAIGN_LEVELS } from "@/lib/words";

function PlayContent() {
  const searchParams = useSearchParams();
  const { address } = useWallet();

  const modeParam = searchParams.get("mode");
  const levelParam = searchParams.get("level");
  const customWordParam = searchParams.get("word");
  const chainParam = searchParams.get("chain");

  // Decode base64-encoded custom word
  let customWord: string | null = null;
  if (modeParam === "custom" && customWordParam) {
    try {
      customWord = atob(customWordParam);
    } catch {
      customWord = customWordParam;
    }
  }

  const gameMode: GameMode = customWord
    ? { type: "custom", word: customWord }
    : modeParam === "campaign" && levelParam
      ? { type: "campaign", level: parseInt(levelParam, 10) }
      : { type: "daily" };

  // On-chain toggle: only for daily mode when wallet is connected
  const canPlayOnChain = gameMode.type === "daily" && !!address;
  const [playOnChain, setPlayOnChain] = useState(chainParam === "true");

  const campaignLevel = gameMode.type === "campaign"
    ? CAMPAIGN_LEVELS.find((l) => l.level === gameMode.level)
    : null;

  // Use the appropriate hook based on mode
  const localGame = useLocalGame(gameMode);
  const onChainGame = useGame(gameMode);

  // Select which game state to use
  const isOnChain = playOnChain && canPlayOnChain;
  const game = isOnChain ? onChainGame : localGame;

  const {
    guesses,
    feedbacks,
    currentGuess,
    status,
    letterStates,
    isSubmitting,
    isLoading,
    handleKey,
    startGame,
  } = game;

  const shakeRow = "shakeRow" in game ? (game as typeof localGame).shakeRow : null;
  const word = "word" in game ? (game as typeof localGame).word : "";
  const wordIndex = "wordIndex" in game ? (game as typeof localGame).wordIndex : 0;
  const retry = "retry" in game ? (game as typeof localGame).retry : undefined;
  const totalWords = campaignLevel?.wordCount || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-between py-4 px-4 max-w-lg mx-auto w-full">
        {/* Mode header */}
        <div className="w-full mb-2">
          {gameMode.type === "campaign" && campaignLevel && (
            <>
              <Link
                href="/campaign"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1 mb-2"
              >
                ← Campaign
              </Link>
              <div className="text-center">
                <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Level {campaignLevel.level}: {campaignLevel.name}
                </h2>
                <p className="text-xs text-[var(--color-muted)] font-light">
                  Word {wordIndex + 1} of {totalWords} · {campaignLevel.difficulty}
                </p>
              </div>
            </>
          )}
          {gameMode.type === "daily" && (
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Daily Wordle
              </h2>
              <p className="text-xs text-[var(--color-muted)] font-light">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>

              {/* On-chain / Off-chain toggle */}
              {address && gameMode.type === "daily" && (
                <div className="mt-2 inline-flex items-center gap-1 p-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <button
                    onClick={() => setPlayOnChain(false)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                      !playOnChain
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    Off-chain
                  </button>
                  <button
                    onClick={() => setPlayOnChain(true)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                      playOnChain
                        ? "bg-[var(--color-green)] text-white shadow-sm"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    On-chain ⛓️
                  </button>
                </div>
              )}

              {/* On-chain indicator */}
              {isOnChain && (
                <p className="text-[10px] text-[var(--color-green)] mt-1 font-light">
                  Guesses recorded on Stellar • Stats & leaderboard
                </p>
              )}
              {!isOnChain && gameMode.type === "daily" && (
                <p className="text-[10px] text-[var(--color-muted)] mt-1 font-light">
                  {address ? "Playing locally • Switch to on-chain for leaderboard" : "Playing locally • Connect wallet for on-chain mode"}
                </p>
              )}
            </div>
          )}
          {gameMode.type === "custom" && (
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Custom Wordle
              </h2>
              <p className="text-xs text-[var(--color-muted)] font-light">
                Challenge from a friend
              </p>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 spinner" />
              <p className="text-sm text-[var(--color-muted)] font-light">
                {isOnChain ? "Loading from chain..." : "Loading..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Idle state for on-chain (needs start_game tx) */}
            {isOnChain && status === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Board guesses={[]} feedbacks={[]} currentGuess="" />
                <div className="mt-6">
                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-lg transition-all glow-pulse"
                  >
                    Start On-Chain Game
                  </button>
                  <p className="text-[10px] text-[var(--color-muted)] mt-2 text-center">
                    Requires a signed transaction
                  </p>
                </div>
              </div>
            )}

            {/* Playing / Won / Lost states */}
            {(!isOnChain || status !== "idle") && (
              <>
                {/* Game Board */}
                <div className="flex-1 flex items-center">
                  <Board
                    guesses={guesses}
                    feedbacks={feedbacks}
                    currentGuess={currentGuess}
                    shakeRow={shakeRow}
                  />
                </div>

                {/* Status Messages */}
                <AnimatePresence mode="wait">
                  {status === "won" && (
                    <motion.div
                      key="won"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="glass-bright rounded-2xl p-5">
                        <p className="text-lg font-bold text-[var(--color-green-glow)] mb-1">
                          {gameMode.type === "campaign" && wordIndex + 1 >= totalWords
                            ? "🎉 Level Complete!"
                            : "✨ Solved!"}
                        </p>
                        <p className="text-sm text-[var(--color-muted)] font-light">
                          {guesses.length} guess{guesses.length > 1 ? "es" : ""}
                          {isOnChain && " · On-chain proof secured"}
                        </p>
                        <div className="flex gap-3 justify-center mt-3">
                          {gameMode.type === "campaign" && (
                            <Link
                              href="/campaign"
                              className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors"
                            >
                              Back to Campaign
                            </Link>
                          )}
                          {gameMode.type === "daily" && (
                            <Link
                              href="/calendar"
                              className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors"
                            >
                              View Calendar
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {status === "lost" && (
                    <motion.div
                      key="lost"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="glass-bright rounded-2xl p-5">
                        <p className="text-lg font-bold text-red-400 mb-1">Game Over</p>
                        <p className="text-sm text-[var(--color-muted)] font-light">
                          The word was <span className="text-[var(--color-foreground)] font-semibold uppercase">{word}</span>
                        </p>
                        <div className="flex gap-3 justify-center mt-3">
                          {gameMode.type === "campaign" && retry && (
                            <button
                              onClick={retry}
                              className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium transition-colors"
                            >
                              Try Again
                            </button>
                          )}
                          {gameMode.type === "campaign" && (
                            <Link
                              href="/campaign"
                              className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] text-xs font-medium transition-colors"
                            >
                              Back
                            </Link>
                          )}
                          {gameMode.type === "daily" && (
                            <p className="text-xs text-[var(--color-muted)] mt-1">
                              Come back tomorrow!
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Keyboard */}
                <div className="w-full pb-2">
                  <Keyboard
                    letterStates={letterStates}
                    onKey={handleKey}
                    disabled={status !== "playing" || isSubmitting}
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <div className="starfield" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 spinner" />
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}

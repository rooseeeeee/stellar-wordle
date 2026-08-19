"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Board } from "@/components/game/Board";
import { Keyboard } from "@/components/game/Keyboard";
import { useGame } from "@/hooks/use-game";
import { useWallet } from "@/providers/wallet-provider";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { GameMode } from "@/types/game";
import { CAMPAIGN_LEVELS } from "@/lib/words";

function PlayContent() {
  const searchParams = useSearchParams();
  const { address, connect } = useWallet();

  const modeParam = searchParams.get("mode");
  const levelParam = searchParams.get("level");

  const gameMode: GameMode = modeParam === "campaign" && levelParam
    ? { type: "campaign", level: parseInt(levelParam, 10) }
    : { type: "daily" };

  const campaignLevel = gameMode.type === "campaign"
    ? CAMPAIGN_LEVELS.find((l) => l.level === gameMode.level)
    : null;

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
  } = useGame(gameMode);

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
                  {campaignLevel.difficulty} · {campaignLevel.wordCount} words
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
                {" · "}On-chain ⛓️
              </p>
            </div>
          )}
        </div>

        {/* Not connected state */}
        {!address ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Board guesses={[]} feedbacks={[]} currentGuess="" />
            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--color-muted)] font-light mb-4">
                Connect your wallet to play on-chain
              </p>
              <button
                onClick={connect}
                className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-lg transition-all glow-pulse"
              >
                Connect Wallet
              </button>
              <p className="text-[10px] text-[var(--color-muted)] mt-3">
                Every guess is a signed transaction on Stellar
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 spinner" />
              <p className="text-sm text-[var(--color-muted)] font-light">Loading from chain...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Idle: need to start game */}
            {status === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Board guesses={[]} feedbacks={[]} currentGuess="" />
                <div className="mt-6 text-center">
                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-lg transition-all glow-pulse"
                  >
                    {gameMode.type === "campaign"
                      ? `Start Level ${gameMode.level}`
                      : "Start Today's Game"}
                  </button>
                  <p className="text-[10px] text-[var(--color-muted)] mt-2">
                    Requires a signed transaction to begin
                  </p>
                </div>
              </div>
            )}

            {/* Playing / Won / Lost */}
            {status !== "idle" && (
              <>
                {/* Game Board */}
                <div className="flex-1 flex items-center">
                  <Board
                    guesses={guesses}
                    feedbacks={feedbacks}
                    currentGuess={currentGuess}
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
                          ✨ Solved!
                        </p>
                        <p className="text-sm text-[var(--color-muted)] font-light">
                          {guesses.length} guess{guesses.length > 1 ? "es" : ""} · On-chain proof secured ⛓️
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
                          <Link
                            href="/leaderboard"
                            className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors"
                          >
                            Leaderboard
                          </Link>
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
                          Better luck {gameMode.type === "campaign" ? "next time" : "tomorrow"}
                        </p>
                        <div className="flex gap-3 justify-center mt-3">
                          {gameMode.type === "campaign" && (
                            <Link
                              href="/campaign"
                              className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] text-xs font-medium transition-colors"
                            >
                              Back to Campaign
                            </Link>
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

                {/* Submitting indicator */}
                {isSubmitting && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] text-[var(--color-muted)]">
                      <div className="w-3 h-3 spinner" />
                      Submitting on-chain...
                    </div>
                  </div>
                )}
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

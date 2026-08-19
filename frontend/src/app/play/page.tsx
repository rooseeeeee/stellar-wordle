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
  const { address } = useWallet();

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

      <main className="flex-1 flex flex-col items-center justify-between py-6 px-4 max-w-lg mx-auto w-full">
        {/* Campaign level header */}
        {campaignLevel && (
          <div className="w-full mb-4">
            <Link
              href="/campaign"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1 mb-2"
            >
              ← Back to Campaign
            </Link>
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Level {campaignLevel.level}: {campaignLevel.name}
              </h2>
              <p className="text-xs text-[var(--color-muted)] font-light">
                {campaignLevel.description}
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--color-muted)] font-light">
                Loading game state...
              </p>
            </div>
          </div>
        ) : (
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
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mb-6"
                >
                  {address ? (
                    <button
                      onClick={startGame}
                      className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-lg transition-all glow-pulse"
                    >
                      {gameMode.type === "campaign"
                        ? `Start Level ${gameMode.level}`
                        : "Start Today's Game"}
                    </button>
                  ) : (
                    <div className="glass rounded-xl p-5">
                      <p className="text-[var(--color-muted)] text-sm font-light">
                        Connect your wallet to play
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {status === "won" && (
                <motion.div
                  key="won"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-6"
                >
                  <div className="glass-bright rounded-2xl p-6">
                    <p className="text-xl font-bold text-[var(--color-green-glow)] mb-1">
                      Solved
                    </p>
                    <p className="text-sm text-[var(--color-muted)] font-light">
                      {guesses.length} guess{guesses.length > 1 ? "es" : ""} — on-chain proof secured
                    </p>
                    {gameMode.type === "campaign" && (
                      <Link
                        href="/campaign"
                        className="inline-block mt-4 px-6 py-2 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-sm font-medium transition-colors"
                      >
                        Back to Campaign
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}

              {status === "lost" && (
                <motion.div
                  key="lost"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-6"
                >
                  <div className="glass-bright rounded-2xl p-6">
                    <p className="text-xl font-bold text-red-400 mb-1">
                      Game Over
                    </p>
                    <p className="text-sm text-[var(--color-muted)] font-light">
                      {gameMode.type === "campaign" ? "Try this level again" : "Better luck tomorrow"}
                    </p>
                    {gameMode.type === "campaign" && (
                      <Link
                        href="/campaign"
                        className="inline-block mt-4 px-6 py-2 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] text-sm font-medium transition-colors"
                      >
                        Back to Campaign
                      </Link>
                    )}
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
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}

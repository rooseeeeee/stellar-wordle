"use client";

import { Header } from "@/components/ui/Header";
import { Board } from "@/components/game/Board";
import { Keyboard } from "@/components/game/Keyboard";
import { useGame } from "@/hooks/use-game";
import { useWallet } from "@/providers/wallet-provider";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayPage() {
  const { address } = useWallet();
  const {
    guesses,
    feedbacks,
    currentGuess,
    status,
    letterStates,
    isSubmitting,
    handleKey,
    startGame,
  } = useGame();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-between py-6 px-4 max-w-lg mx-auto w-full">
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
                  Start Today&apos;s Game
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
                  Better luck tomorrow
                </p>
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
      </main>
    </div>
  );
}

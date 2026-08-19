"use client";

import { Header } from "@/components/ui/Header";
import { Board } from "@/components/game/Board";
import { Keyboard } from "@/components/game/Keyboard";
import { useGame } from "@/hooks/use-game";
import { useWallet } from "@/providers/wallet-provider";
import { motion } from "framer-motion";

export default function Home() {
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
    <div className="flex flex-col h-screen">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-between py-4 px-4 max-w-lg mx-auto w-full">
        {/* Game Board */}
        <div className="flex-1 flex items-center">
          <Board
            guesses={guesses}
            feedbacks={feedbacks}
            currentGuess={currentGuess}
          />
        </div>

        {/* Start / Status */}
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            {address ? (
              <button
                onClick={startGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-lg transition-colors"
              >
                Start Today&apos;s Game
              </button>
            ) : (
              <p className="text-gray-400">
                Connect your wallet to play
              </p>
            )}
          </motion.div>
        )}

        {status === "won" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-4"
          >
            <p className="text-2xl font-bold text-green-400">
              🎉 You won in {guesses.length} guess{guesses.length > 1 ? "es" : ""}!
            </p>
          </motion.div>
        )}

        {status === "lost" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-4"
          >
            <p className="text-2xl font-bold text-red-400">
              Game over — better luck tomorrow!
            </p>
          </motion.div>
        )}

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

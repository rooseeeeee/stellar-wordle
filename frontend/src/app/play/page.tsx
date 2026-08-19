"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Board } from "@/components/game/Board";
import { Keyboard } from "@/components/game/Keyboard";
import { useGame } from "@/hooks/use-game";
import { useLocalGame } from "@/hooks/use-local-game";
import { useWallet } from "@/providers/wallet-provider";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { GameMode } from "@/types/game";
import { CAMPAIGN_LEVELS } from "@/lib/words";

// ---------------------------------------------------------------------------
// On-Chain Daily Play
// ---------------------------------------------------------------------------

function DailyPlay() {
  const { address, connect } = useWallet();
  const { guesses, feedbacks, currentGuess, status, letterStates, isSubmitting, isLoading, handleKey, startGame } = useGame({ type: "daily" });

  if (!address) {
    return (
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
            Every guess is a signed transaction on Stellar ⛓️
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 spinner" />
          <p className="text-sm text-[var(--color-muted)] font-light">Loading from chain...</p>
        </div>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Board guesses={[]} feedbacks={[]} currentGuess="" />
        <div className="mt-6 text-center">
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-lg transition-all glow-pulse"
          >
            Start Today&apos;s Game
          </button>
          <p className="text-[10px] text-[var(--color-muted)] mt-2">
            Requires a signed transaction to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex items-center">
        <Board guesses={guesses} feedbacks={feedbacks} currentGuess={currentGuess} />
      </div>

      <AnimatePresence mode="wait">
        {status === "won" && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-[var(--color-green-glow)] mb-1">✨ Solved!</p>
              <p className="text-sm text-[var(--color-muted)] font-light">
                {guesses.length} guess{guesses.length > 1 ? "es" : ""} · On-chain proof ⛓️
              </p>
              <Link href="/leaderboard" className="inline-block mt-3 px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors">
                Leaderboard
              </Link>
            </div>
          </motion.div>
        )}
        {status === "lost" && (
          <motion.div key="lost" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-red-400 mb-1">Game Over</p>
              <p className="text-sm text-[var(--color-muted)] font-light">Better luck tomorrow</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full pb-2">
        <Keyboard letterStates={letterStates} onKey={handleKey} disabled={status !== "playing" || isSubmitting} />
      </div>

      {isSubmitting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] text-[var(--color-muted)]">
            <div className="w-3 h-3 spinner" />
            Submitting on-chain...
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Campaign Play (local engine — contract only supports one game per player)
// ---------------------------------------------------------------------------

function CampaignPlay({ level }: { level: number }) {
  const campaignLevel = CAMPAIGN_LEVELS.find((l) => l.level === level);
  const { guesses, feedbacks, currentGuess, status, letterStates, isLoading, shakeRow, word, wordIndex, handleKey, retry } = useLocalGame({ type: "campaign", level });
  const totalWords = campaignLevel?.wordCount || 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex items-center">
        <Board guesses={guesses} feedbacks={feedbacks} currentGuess={currentGuess} shakeRow={shakeRow} />
      </div>

      <AnimatePresence mode="wait">
        {status === "won" && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-[var(--color-green-glow)] mb-1">
                {wordIndex + 1 >= totalWords ? "🎉 Level Complete!" : "✨ Solved!"}
              </p>
              <p className="text-sm text-[var(--color-muted)] font-light">
                {guesses.length} guess{guesses.length > 1 ? "es" : ""}
                {wordIndex + 1 < totalWords && " · Next word loading..."}
              </p>
              {wordIndex + 1 >= totalWords && (
                <Link href="/campaign" className="inline-block mt-3 px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors">
                  Back to Campaign
                </Link>
              )}
            </div>
          </motion.div>
        )}
        {status === "lost" && (
          <motion.div key="lost" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-red-400 mb-1">Game Over</p>
              <p className="text-sm text-[var(--color-muted)] font-light">
                The word was <span className="text-[var(--color-foreground)] font-semibold uppercase">{word}</span>
              </p>
              <div className="flex gap-3 justify-center mt-3">
                {retry && (
                  <button onClick={retry} className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-medium transition-colors">
                    Try Again
                  </button>
                )}
                <Link href="/campaign" className="px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-muted)] text-xs font-medium transition-colors">
                  Back
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full pb-2">
        <Keyboard letterStates={letterStates} onKey={handleKey} disabled={status !== "playing"} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Custom Play (local engine)
// ---------------------------------------------------------------------------

function CustomPlay({ word }: { word: string }) {
  const { guesses, feedbacks, currentGuess, status, letterStates, isLoading, shakeRow, word: gameWord, handleKey } = useLocalGame({ type: "custom", word });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex items-center">
        <Board guesses={guesses} feedbacks={feedbacks} currentGuess={currentGuess} shakeRow={shakeRow} />
      </div>

      <AnimatePresence mode="wait">
        {status === "won" && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-[var(--color-green-glow)] mb-1">✨ Solved!</p>
              <p className="text-sm text-[var(--color-muted)] font-light">{guesses.length} guess{guesses.length > 1 ? "es" : ""}</p>
              <Link href="/custom" className="inline-block mt-3 px-4 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] text-xs font-medium transition-colors">
                Create Your Own
              </Link>
            </div>
          </motion.div>
        )}
        {status === "lost" && (
          <motion.div key="lost" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4">
            <div className="glass-bright rounded-2xl p-5">
              <p className="text-lg font-bold text-red-400 mb-1">Game Over</p>
              <p className="text-sm text-[var(--color-muted)] font-light">
                The word was <span className="text-[var(--color-foreground)] font-semibold uppercase">{gameWord}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full pb-2">
        <Keyboard letterStates={letterStates} onKey={handleKey} disabled={status !== "playing"} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function PlayContent() {
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("mode");
  const levelParam = searchParams.get("level");
  const customWordParam = searchParams.get("word");

  // Decode custom word
  let customWord: string | null = null;
  if (modeParam === "custom" && customWordParam) {
    try { customWord = atob(customWordParam); } catch { customWord = customWordParam; }
  }

  const isDaily = !modeParam || modeParam === "daily";
  const isCampaign = modeParam === "campaign" && levelParam;
  const isCustom = modeParam === "custom" && customWord;

  const campaignLevel = isCampaign ? CAMPAIGN_LEVELS.find((l) => l.level === parseInt(levelParam!, 10)) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-between py-4 px-4 max-w-lg mx-auto w-full">
        {/* Header info */}
        <div className="w-full mb-2">
          {isCampaign && campaignLevel && (
            <>
              <Link href="/campaign" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors inline-flex items-center gap-1 mb-2">
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
          {isDaily && (
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Daily Wordle</h2>
              <p className="text-xs text-[var(--color-muted)] font-light">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · On-chain ⛓️
              </p>
            </div>
          )}
          {isCustom && (
            <div className="text-center">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Custom Wordle</h2>
              <p className="text-xs text-[var(--color-muted)] font-light">Challenge from a friend</p>
            </div>
          )}
        </div>

        {/* Game content */}
        {isDaily && <DailyPlay />}
        {isCampaign && <CampaignPlay level={parseInt(levelParam!, 10)} />}
        {isCustom && <CustomPlay word={customWord!} />}
      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><div className="starfield" /><div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 spinner" /></div></div>}>
      <PlayContent />
    </Suspense>
  );
}

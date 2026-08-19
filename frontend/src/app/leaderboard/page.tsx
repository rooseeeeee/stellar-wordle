"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { useLeaderboard } from "@/hooks/use-contract";

export default function LeaderboardPage() {
  const { data: entries = [], isLoading, isError } = useLeaderboard();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3 tracking-tight">
            Leaderboard
          </h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto font-light text-sm">
            Top players ranked by wins. All stats verified on-chain.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-muted)] font-light mt-4">
              Loading leaderboard...
            </p>
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-sm text-red-400">Failed to load leaderboard. Please try again.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass-bright rounded-2xl p-8 inline-block">
              <p className="text-4xl mb-4">🏆</p>
              <p className="text-[var(--color-muted)] font-light text-sm">
                No players on the leaderboard yet.
              </p>
              <p className="text-[var(--color-muted)] font-light text-xs mt-1">
                Win a game to claim your spot!
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[3rem_1fr_6rem_6rem] gap-2 px-4 py-2 text-xs text-[var(--color-muted)] uppercase tracking-wider font-medium border-b border-[var(--color-border)]">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Wins</span>
              <span className="text-right">Streak</span>
            </div>

            {/* Entries */}
            <div className="divide-y divide-[var(--color-border)]">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.player}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[3rem_1fr_6rem_6rem] gap-2 px-4 py-3 items-center hover:bg-[var(--color-surface)] rounded-lg transition-colors ${
                    i < 3 ? "bg-[var(--color-surface)]/50" : ""
                  }`}
                >
                  {/* Rank */}
                  <span className="text-sm font-bold tabular-nums">
                    {i === 0 ? (
                      <span className="text-[var(--color-yellow)]">🥇</span>
                    ) : i === 1 ? (
                      <span className="text-[var(--color-muted)]">🥈</span>
                    ) : i === 2 ? (
                      <span className="text-[var(--color-accent)]">🥉</span>
                    ) : (
                      <span className="text-[var(--color-muted)]">{i + 1}</span>
                    )}
                  </span>

                  {/* Player address */}
                  <span className="font-mono text-xs sm:text-sm text-[var(--color-foreground)] truncate">
                    {entry.player.slice(0, 4)}...{entry.player.slice(-4)}
                  </span>

                  {/* Wins */}
                  <span className="text-right text-sm font-semibold text-[var(--color-green)] tabular-nums">
                    {entry.wins}
                  </span>

                  {/* Streak */}
                  <span className="text-right text-sm text-[var(--color-muted)] tabular-nums">
                    {entry.streak > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-[var(--color-yellow)]">🔥</span>
                        {entry.streak}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Info */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[var(--color-muted)] font-light">
                Top 100 players • Auto-refreshes every minute • Verified on-chain
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CAMPAIGN_LEVELS } from "@/lib/words";

const difficultyColors = {
  easy: "text-[var(--color-green)] border-[var(--color-green)]/30",
  medium: "text-[var(--color-yellow)] border-[var(--color-yellow)]/30",
  hard: "text-[var(--color-primary)] border-[var(--color-primary)]/30",
  expert: "text-red-400 border-red-400/30",
};

const difficultyBg = {
  easy: "bg-[var(--color-green)]/10",
  medium: "bg-[var(--color-yellow)]/10",
  hard: "bg-[var(--color-primary)]/10",
  expert: "bg-red-400/10",
};

export default function CampaignPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">
            Campaign Mode
          </h1>
          <p className="text-[var(--color-muted)] max-w-lg mx-auto">
            Progress through 10 levels of increasing difficulty. Each level has unique
            auto-generated words. Complete all words in a level to unlock the next.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPAIGN_LEVELS.map((level, i) => (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/play?mode=campaign&level=${level.level}`}
                className={`block glass rounded-xl p-5 hover:border-[var(--color-border-bright)] transition-all group ${difficultyColors[level.difficulty]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold opacity-30">
                      {String(level.level).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-white transition-colors">
                        {level.name}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)]">
                        {level.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyColors[level.difficulty]} ${difficultyBg[level.difficulty]}`}
                    >
                      {level.difficulty}
                    </span>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {level.wordCount} words
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CAMPAIGN_LEVELS, type Difficulty } from "@/lib/words";

const difficultyColors: Record<Difficulty, string> = {
  beginner: "text-[var(--color-accent)] border-[var(--color-accent)]/30",
  easy: "text-[var(--color-green)] border-[var(--color-green)]/30",
  medium: "text-[var(--color-yellow)] border-[var(--color-yellow)]/30",
  hard: "text-[var(--color-primary)] border-[var(--color-primary)]/30",
  expert: "text-red-400 border-red-400/30",
};

const difficultyBg: Record<Difficulty, string> = {
  beginner: "bg-[var(--color-accent)]/10",
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

      <main className="flex-1 px-4 py-12 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 tracking-tight">
            Campaign Mode
          </h1>
          <p className="text-[var(--color-muted)] max-w-lg mx-auto font-light">
            Progress through 20 levels of increasing difficulty. Each level has unique
            procedurally generated words. Complete all words in a level to advance.
          </p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            {(["beginner", "easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
              <span
                key={d}
                className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColors[d]} ${difficultyBg[d]}`}
              >
                {d}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPAIGN_LEVELS.map((level, i) => (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/play?mode=campaign&level=${level.level}`}
                className="block glass rounded-xl p-6 hover:border-[var(--color-border-bright)] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-[var(--color-border-bright)] group-hover:text-[var(--color-muted)] transition-colors tabular-nums">
                      {String(level.level).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-white transition-colors text-sm">
                        {level.name}
                      </h3>
                      <p className="text-xs text-[var(--color-muted)] font-light mt-0.5">
                        {level.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColors[level.difficulty]} ${difficultyBg[level.difficulty]}`}
                    >
                      {level.difficulty}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)] tabular-nums">
                      {level.wordCount} words
                    </span>
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

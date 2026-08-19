"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CAMPAIGN_LEVELS, type Difficulty } from "@/lib/words";
import { getLevelProgress } from "@/lib/engine";

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
  const [progress, setProgress] = useState<Record<number, { completed: number; total: number; isComplete: boolean }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p: Record<number, { completed: number; total: number; isComplete: boolean }> = {};
    for (const level of CAMPAIGN_LEVELS) {
      p[level.level] = getLevelProgress(level.level, level.wordCount);
    }
    setProgress(p);
  }, []);

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
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3 tracking-tight">
            Campaign
          </h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto font-light text-sm">
            20 levels. Each has multiple words to solve. Complete them all.
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {(["beginner", "easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
              <span
                key={d}
                className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColors[d]} ${difficultyBg[d]}`}
              >
                {d}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAMPAIGN_LEVELS.map((level, i) => {
            const p = progress[level.level];
            const isComplete = p?.isComplete || false;
            const completedCount = p?.completed || 0;

            return (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
              >
                <Link
                  href={`/play?mode=campaign&level=${level.level}`}
                  className={`block glass rounded-xl p-5 hover:border-[var(--color-border-bright)] transition-all group ${
                    isComplete ? "border-[var(--color-green)]/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold tabular-nums transition-colors ${
                        isComplete
                          ? "text-[var(--color-green)]"
                          : "text-[var(--color-border-bright)] group-hover:text-[var(--color-muted)]"
                      }`}>
                        {isComplete ? "✓" : String(level.level).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-white transition-colors text-sm">
                          {level.name}
                        </h3>
                        <p className="text-[11px] text-[var(--color-muted)] font-light mt-0.5">
                          {level.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColors[level.difficulty]} ${difficultyBg[level.difficulty]}`}
                      >
                        {level.difficulty}
                      </span>
                      {/* Progress bar */}
                      {mounted && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-green)] rounded-full transition-all duration-500"
                              style={{ width: `${(completedCount / level.wordCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[var(--color-muted)] tabular-nums">
                            {completedCount}/{level.wordCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { getDailyWordInfo, getGameDay } from "@/lib/words";
import { loadGameState } from "@/lib/engine";

interface DayInfo {
  date: Date;
  dateStr: string;
  word: string;
  difficulty: string;
  gameDay: number;
  isToday: boolean;
  isFuture: boolean;
  played: boolean;
  won: boolean;
  guesses: number;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun

    const days: (DayInfo | null)[] = [];

    // Padding before month starts
    for (let i = 0; i < startPad; i++) {
      days.push(null);
    }

    // Each day in the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split("T")[0];
      const isToday = dateStr === today;
      const isFuture = date > new Date();

      let word = "";
      let difficulty = "";
      let gameDay = 0;

      if (!isFuture) {
        const info = getDailyWordInfo(date);
        word = info.word;
        difficulty = info.difficulty;
        gameDay = info.gameDay;
      }

      // Check if played (from localStorage)
      let played = false;
      let won = false;
      let guesses = 0;
      if (mounted && !isFuture) {
        const state = loadGameState("daily", dateStr);
        if (state && state.guesses.length > 0) {
          played = true;
          won = state.status === "won";
          guesses = state.guesses.length;
        }
      }

      days.push({ date, dateStr, word, difficulty, gameDay, isToday, isFuture, played, won, guesses });
    }

    return days;
  }, [currentMonth, today, mounted]);

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month + 1;
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
    });
  };

  const todayInfo = useMemo(() => getDailyWordInfo(new Date()), []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Today's puzzle CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/play"
            className="block glass-card p-6 text-center group"
          >
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">
              Today&apos;s Puzzle
            </p>
            <p className="text-2xl font-bold gradient-text mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Difficulty: <span className={`font-medium ${
                todayInfo.difficulty === "easy" ? "text-[var(--color-green)]" :
                todayInfo.difficulty === "medium" ? "text-[var(--color-yellow)]" :
                todayInfo.difficulty === "hard" ? "text-[var(--color-primary)]" :
                "text-red-400"
              }`}>{todayInfo.difficulty}</span> · Day #{todayInfo.gameDay}
            </p>
            <div className="mt-4">
              <span className="px-5 py-2 rounded-lg bg-[var(--color-primary)] group-hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium transition-all inline-block">
                Play Now
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-2xl p-5"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg glass hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              ←
            </button>
            <h2 className="text-sm font-semibold">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg glass hover:bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              →
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] text-[var(--color-muted)] font-medium uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`pad-${i}`} className="aspect-square" />;
              }

              const isPlayable = day.isToday && !day.played;

              return (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${
                    day.isToday
                      ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-surface)]"
                      : day.isFuture
                        ? "opacity-30"
                        : day.played
                          ? "bg-[var(--color-surface)]/50"
                          : "hover:bg-[var(--color-surface)]/30"
                  }`}
                >
                  <span className={`text-[11px] tabular-nums ${day.isToday ? "font-bold text-[var(--color-foreground)]" : "text-[var(--color-muted)]"}`}>
                    {day.date.getDate()}
                  </span>

                  {/* Status indicator */}
                  {day.played && day.won && (
                    <span className="text-[8px] mt-0.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-green)] shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                    </span>
                  )}
                  {day.played && !day.won && (
                    <span className="text-[8px] mt-0.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    </span>
                  )}
                  {!day.isFuture && !day.played && !day.isToday && (
                    <span className="text-[8px] mt-0.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full border border-[var(--color-border-bright)]" />
                    </span>
                  )}

                  {/* Playable today link */}
                  {isPlayable && (
                    <Link href="/play" className="absolute inset-0 rounded-lg" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-green)]" />
              <span className="text-[10px] text-[var(--color-muted)]">Won</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <span className="text-[10px] text-[var(--color-muted)]">Lost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-[var(--color-border-bright)]" />
              <span className="text-[10px] text-[var(--color-muted)]">Missed</span>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

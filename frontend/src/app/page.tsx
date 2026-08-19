"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-28 text-center">
          {/* Animated word tiles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex gap-[6px] mb-8"
          >
            {[
              { letter: "S", state: "correct" },
              { letter: "T", state: "absent" },
              { letter: "A", state: "present" },
              { letter: "R", state: "absent" },
              { letter: "S", state: "correct" },
            ].map((tile, i) => (
              <motion.div
                key={i}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl text-xl sm:text-2xl font-bold uppercase text-white ${
                  tile.state === "correct"
                    ? "tile-correct"
                    : tile.state === "present"
                      ? "tile-present"
                      : "tile-absent"
                }`}
              >
                {tile.letter}
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
          >
            <span className="gradient-text">Stellar Wordle</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--color-muted)] max-w-xl mb-10 font-light leading-relaxed"
          >
            A new word every day. 6 guesses. Every guess is a signed transaction on the Stellar blockchain.
            Connect your wallet, solve the word, climb the leaderboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.6 }}
            className="flex gap-3 flex-wrap justify-center"
          >
            <Link
              href="/play"
              className="px-7 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-base transition-all glow-pulse"
            >
              Play Today&apos;s Word
            </Link>
            <Link
              href="/campaign"
              className="px-7 py-3 rounded-xl glass hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)] font-semibold text-base transition-all"
            >
              Campaign
            </Link>
            <Link
              href="/custom"
              className="px-7 py-3 rounded-xl glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] font-semibold text-base transition-all"
            >
              Create Your Own
            </Link>
          </motion.div>
        </section>

        {/* Stats bar */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "500+", label: "Words" },
              { value: "20", label: "Campaign Levels" },
              { value: "∞", label: "Custom Puzzles" },
              { value: "5", label: "Difficulty Tiers" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-xl sm:text-2xl font-bold gradient-text-static">{stat.value}</div>
                <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Game modes */}
        <section className="px-4 pb-24 max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-bold text-center mb-10 tracking-tight"
          >
            Choose Your Challenge
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/play",
                icon: "☀️",
                title: "Daily",
                desc: "A new word every day. Difficulty changes with the week.",
                accent: "var(--color-green)",
              },
              {
                href: "/campaign",
                icon: "🚀",
                title: "Campaign",
                desc: "20 levels. Beginner to expert. Beat them all.",
                accent: "var(--color-primary)",
              },
              {
                href: "/custom",
                icon: "✏️",
                title: "Create",
                desc: "Pick any word. Share a link. Challenge anyone.",
                accent: "var(--color-accent)",
              },
              {
                href: "/calendar",
                icon: "📅",
                title: "Calendar",
                desc: "Track your daily streak. See your history.",
                accent: "var(--color-yellow)",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Link href={card.href} className="block glass-card p-6 h-full group">
                  <div className="text-2xl mb-3">{card.icon}</div>
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)] group-hover:text-white transition-colors mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed font-light">
                    {card.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 pb-24 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-bold text-center mb-10 tracking-tight"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Guess a word",
                desc: "Type any 5-letter word and press Enter",
                tiles: ["🟩", "⬛", "🟨", "⬛", "⬛"],
              },
              {
                step: "02",
                title: "Read the clues",
                desc: "Green = right spot, Yellow = wrong spot, Gray = not in word",
                tiles: ["🟩", "🟩", "⬛", "🟨", "⬛"],
              },
              {
                step: "03",
                title: "Solve in 6 tries",
                desc: "Use the feedback to narrow it down",
                tiles: ["🟩", "🟩", "🟩", "🟩", "🟩"],
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-3xl font-bold gradient-text-static mb-3 tracking-tighter">
                  {item.step}
                </div>
                <div className="flex justify-center gap-1 mb-3 text-lg">
                  {item.tiles.map((t, j) => (
                    <span key={j}>{t}</span>
                  ))}
                </div>
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--color-muted)] font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* On-chain section */}
        <section className="px-4 pb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-bright rounded-2xl p-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-success text-[10px] font-medium uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />
              Testnet Live
            </div>
            <h3 className="text-lg font-bold mb-2">
              Powered by Stellar Soroban
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-5 max-w-md mx-auto font-light">
              Connect your wallet to record guesses on-chain, track stats immutably, 
              and compete on the global leaderboard. Playing locally? No wallet needed.
            </p>
            <div className="font-mono text-[10px] sm:text-xs text-[var(--color-accent)] break-all bg-[var(--color-surface)] rounded-lg p-3 mb-4">
              CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB
            </div>
            <div className="flex justify-center gap-4">
              <a
                href="https://stellar.expert/explorer/testnet/contract/CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                Explorer ↗
              </a>
              <a
                href="https://github.com/rooseeeeee/stellar-wordle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                Source ↗
              </a>
              <Link
                href="/leaderboard"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                Leaderboard ↗
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

const features = [
  {
    icon: "🔗",
    title: "On-Chain Truth",
    description:
      "Every guess is a signed transaction. Every win is provable. No server, no database — just the blockchain.",
  },
  {
    icon: "🆓",
    title: "Free to Read",
    description:
      "All contract reads use simulation — zero fees. You only sign when you start a game or submit a guess.",
  },
  {
    icon: "🏆",
    title: "Immutable Leaderboard",
    description:
      "Your streak and rank live on-chain. Top 100 players by wins, verified by anyone, owned by no one.",
  },
  {
    icon: "🌌",
    title: "Stellar Powered",
    description:
      "Built on Soroban smart contracts. Fast finality, low cost, and the security of the Stellar network.",
  },
  {
    icon: "🎯",
    title: "Classic Wordle Rules",
    description:
      "5 letters, 6 guesses, daily word. Green, yellow, gray feedback — the game you know and love.",
  },
  {
    icon: "🔐",
    title: "Wallet Native",
    description:
      "Connect with Freighter, Albedo, or any Stellar wallet. Your identity is your wallet address.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center">
          {/* Decorative tiles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex gap-2 mb-8"
          >
            {["S", "T", "A", "R", "S"].map((letter, i) => (
              <motion.div
                key={i}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg text-2xl font-bold uppercase text-white ${
                  i === 0 || i === 4
                    ? "tile-correct"
                    : i === 2
                      ? "tile-present"
                      : "tile-absent"
                }`}
              >
                {letter}
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
          >
            <span className="gradient-text">Stellar Wordle</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg sm:text-xl text-[var(--color-muted)] max-w-2xl mb-4"
          >
            Every guess is a signed transaction. Every win is an on-chain claim.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.6 }}
            className="text-sm text-[var(--color-muted)] mb-10 max-w-lg opacity-70"
          >
            The daily word game where the answer lives on the Stellar blockchain.
            Prove your streak. Own your stats. Trust the chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex gap-4 flex-wrap justify-center"
          >
            <Link
              href="/play"
              className="px-8 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-lg transition-all glow-pulse"
            >
              Play Now
            </Link>
            <a
              href="https://stellar.expert/explorer/testnet/contract/CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl glass hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)] font-semibold text-lg transition-all"
            >
              View Contract ↗
            </a>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-4 pb-24 max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-12"
          >
            Why Play On-Chain?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass rounded-2xl p-6 hover:border-[var(--color-border-bright)] transition-colors"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 pb-24 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect Wallet", desc: "Link your Freighter or Stellar wallet" },
              { step: "02", title: "Start Game", desc: "One signed transaction begins your daily game" },
              { step: "03", title: "Guess & Win", desc: "Each guess is on-chain. Win to grow your streak" },
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
                <div className="text-4xl font-bold gradient-text mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-muted)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contract Info */}
        <section className="px-4 pb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-bright rounded-2xl p-8 text-center"
          >
            <h3 className="text-lg font-semibold mb-4">Deployed on Stellar Testnet</h3>
            <div className="font-mono text-xs sm:text-sm text-[var(--color-accent)] break-all bg-[var(--color-surface)] rounded-lg p-3">
              CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-3">
              WASM SHA256: 532716b4501c7ea11a0a73ac62dadee8166f5edba7c5cbe29867086eebf77b6f
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/providers/wallet-provider";

export function Header() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/play", label: "Daily" },
    { href: "/campaign", label: "Campaign" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Stellar Wordle</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {address ? (
            <button
              onClick={disconnect}
              className="text-sm px-3 py-1.5 rounded-lg glass hover:bg-[var(--color-surface-hover)] text-[var(--color-accent)] font-mono transition-colors"
            >
              {address.slice(0, 4)}...{address.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium transition-all disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex flex-col items-center justify-center w-9 h-9 rounded-lg glass hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`block w-5 h-0.5 bg-[var(--color-foreground)] transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[var(--color-foreground)] transition-all duration-200 mt-1 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[var(--color-foreground)] transition-all duration-200 mt-1 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-[var(--color-border)] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                    pathname === link.href
                      ? "text-[var(--color-foreground)] bg-[var(--color-surface)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

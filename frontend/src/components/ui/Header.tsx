"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/providers/wallet-provider";

export function Header() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Stellar Wordle</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link
              href="/play"
              className={`transition-colors ${
                pathname === "/play"
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Daily
            </Link>
            <Link
              href="/campaign"
              className={`transition-colors ${
                pathname === "/campaign"
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Campaign
            </Link>
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
        </div>
      </div>
    </header>
  );
}

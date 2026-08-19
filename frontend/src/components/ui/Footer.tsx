"use client";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[var(--color-muted)] flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />
          <span>
            Built on{" "}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-glow)] transition-colors"
            >
              Stellar Soroban
            </a>
          </span>
          <span className="text-[var(--color-border-bright)]">·</span>
          <span>Testnet Live</span>
        </div>
        <div className="flex gap-4 text-xs text-[var(--color-muted)]">
          <a
            href="https://github.com/rooseeeeee/stellar-wordle"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://stellar.expert/explorer/testnet/contract/CDXMKHTOJ74TPJS2XKL25V7R3MDQ5N766STNXH67SUSHK7DOLP2KMHSW"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            Explorer
          </a>
        </div>
      </div>
    </footer>
  );
}

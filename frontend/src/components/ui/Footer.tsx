export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[var(--color-muted)]">
          Built on{" "}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            Stellar Soroban
          </a>
          {" "}— Every guess is a signed transaction.
        </div>
        <div className="flex gap-4 text-sm text-[var(--color-muted)]">
          <a
            href="https://github.com/rooseeeeee/wordle"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://stellar.expert/explorer/testnet/contract/CDZ2GAIMY43JBGJMY2H6ZZUD6F4M35VZ3N7I2C3CH4DRUWW6O6RQ7KCB"
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

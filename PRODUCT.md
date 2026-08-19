# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Greenfield; user brief binds the stack to the dMessage format and the stellar-agentic-framework templates: Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Stellar Wallet Kit 2, TanStack Query 5, Framer Motion. Deploy target: Vercel (dMessage pattern).

## Users

- Daily word-game players who want a provable, wallet-native version of the genre.
- Stellar ecosystem users (Freighter / Albedo / Wallet Kit) already comfortable signing transactions.

## Product Purpose

Stellar Wordle is a daily 5-letter word game where the answer lives on the Stellar Soroban blockchain: every guess is a signed transaction, every win is a provable on-chain claim, and stats and the leaderboard are immutable chain state — not a server database.

## Positioning

The answer, the guesses, the feedback, the streak, and the leaderboard all live on-chain in one Soroban contract. A win is not a claim — it is a transaction receipt anyone can verify. Free-to-play: reads are simulations (zero fees), a full daily game costs two signatures (start + up to six guesses).

## Operating Context

- Daily word set by the game admin via `set_word`; one active game per player per day.
- Testnet only (user decision, 2026-08-19): no mainnet deployment, no mainnet claims anywhere in docs or config.
- Wallet required for writes; contract reads work without a wallet (simulation).
- Repo mirrors the dMessage format: README, deployment.json, Makefile, .env.example, contracts/, frontend/, images/, scripts/, tests/.

## Capabilities and Constraints

- Contract: set word (admin), start game, submit guess with full Wordle feedback (green/yellow/gray, green-first count-limited), player stats (games, wins, streak, guess distribution), top-100 leaderboard, events.
- Frontend: landing/hero, 6x5 board, keyboard with letter states, stats modal, leaderboard, all chain reads via simulation.
- Constraint (ADR-001): daily word stored plaintext on-chain — storage is readable; secrecy is a game-master trust assumption, documented.
- Constraint: guesses are fee-paying writes; 6 guesses max per game; one game per day per player.
- Undecided: XLM wagers (explicitly out of scope; ADR-005 candidate), word-list source for the admin (operator picks English words), mainnet (never, per user).

## Brand Commitments

- Name: **Stellar Wordle**. Tagline territory: "Every guess is a signed transaction."
- Visual direction (user-pinned, 2026-08-19): "Stellar night observatory" — deep-space dark theme, glowing constellation feel, neon tile feedback colors; the guess-as-signature as a celestial event.
- Repo format bound to dMessage (README structure, directory layout, deployment.json).
- Free-to-play only (user decision).

## Evidence on Hand

- No deployment, no users, no screenshots yet — README must not fabricate addresses, user counts, or analytics.
- Contract behavior verified by `cargo test` only.
- `.env.example`, `deployment.json`, `Makefile` ship with placeholders until testnet deploy.

## Product Principles

1. On-chain truth: every claim a player can make (win, streak, rank) is a chain value.
2. Zero-fee reads: all views are simulations; users sign only the game moves.
3. Trust the chain, state the trust: document exactly what is provable and what is a trust assumption (ADR-001).
4. Testnet-first: nothing ships for mainnet without an explicit decision record.
5. Playable like Wordle: the chain is an invisible engine, never a UI tax.

## Accessibility & Inclusion

- Full keyboard play (typing letters, enter, backspace) — the game is playable without a mouse.
- Feedback colors are not the only signal: tile text remains readable, states are also described via ARIA live regions after each guess.
- Contrast targets: feedback tiles carry ≥ 4.5:1 text contrast in the dark theme.
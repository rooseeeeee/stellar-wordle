# ADR-001 — On-Chain Plaintext Daily Word (Trust Model)

Date: 2026-08-19
Status: Accepted

## Context

A Wordle answer is a 5-letter word. If the contract stores only `keccak256(word)`, any
client can brute-force the preimage (26^5 ≈ 12M candidates — seconds on a laptop), so
hashing alone provides no secrecy. Keeping the word off-chain (oracle) introduces a
centralized dependency the project explicitly avoids.

## Decision

Store the daily word in plaintext in contract instance storage. The contract is the
single source of truth for game state: guesses, feedback, stats, leaderboard, and win
claims are all provable on-chain. Word secrecy is a game-master trust assumption,
documented in the README security section.

## Consequences

- + Full feedback (green/yellow/gray) computable on-chain
- + No oracle, no off-chain infra; contract fully self-contained
- − A player who reads storage can see the answer (cheat possible, same as most chain word games)
- − Mitigation path (ADR-005 candidate): reveal-at-end commit scheme or Chainlink-style oracle
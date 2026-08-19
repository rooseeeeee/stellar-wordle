# ADR-002 — Simulation Reads, Signed Writes

Date: 2026-08-19
Status: Accepted

## Context

Soroban reads via simulation are free; writes cost fees and need signatures. The
frontend must not hammer the network with fee-paying transactions for pure reads.

## Decision

- All `get_*` views called through `useContract().read()` (simulation only)
- All state-changing calls (`start_game`, `submit_guess`) through `useContract().write()`
  (sim → assemble → sign → submit)
- Local feedback computation in the frontend is optimistic-only; authoritative result
  comes from the `submit_guess` transaction result

## Consequences

- + Zero-fee UX for everything except guesses (2 transactions per daily game: start + guesses)
- + Single signing surface via Wallet Kit
- − Frontend must handle tx latency (pending guess states)
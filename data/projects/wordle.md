# Stellar Wordle — Project State

Updated: 2026-08-19

## Status

- [x] Agentic OS kernel (CLAUDE.md, agents, commands)
- [x] Soroban wordle contract + tests
- [x] Frontend scaffold + game UI
- [ ] Testnet deployment (pending admin key)
- [ ] Mainnet deployment (needs ADR)

## Decisions

- ADR-001: on-chain plaintext daily word (trust model documented)
- ADR-002: simulation reads, signed writes
- ADR-003: wordle feedback algorithm (green-first, count-limited)
- ADR-004: leaderboard cap 100 entries

## Contract

- Crate: `contracts/wordle`
- Network: testnet
- Address: see deployment.json

## Agents involved

- @contracts: wordle lib.rs + tests
- @frontend: game UI
- @ops: Makefile, scripts, CI
- @docs: README, ADRs

## Next actions

- [ ] fund admin account + deploy testnet
- [ ] set first daily word
- [ ] live deployment on Vercel
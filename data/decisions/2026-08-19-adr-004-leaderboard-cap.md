# ADR-004 — Leaderboard Cap of 100 Entries

Date: 2026-08-19
Status: Accepted

## Context

Soroban storage iteration is limited; an unbounded sorted leaderboard would grow
storage cost per win and blow past iteration limits.

## Decision

Maintain a `Vec<LeaderboardEntry>` capped at 100. On win, insert the player in sorted
order (wins desc, streak desc, wins-to-1 ratio); if the player is not in the top 100,
the insert is skipped. Ties resolved by earliest first-win timestamp.

## Consequences

- + Bounded storage cost per win (O(1) insert into ≤100 entries)
- + Leaderboard read is a single storage load
- − Players below rank 100 are not ranked (acceptable for a daily game)
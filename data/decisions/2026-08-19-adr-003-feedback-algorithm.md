# ADR-003 — Wordle Feedback Algorithm (Green-First, Count-Limited)

Date: 2026-08-19
Status: Accepted

## Context

Wordle's canonical feedback rules must be deterministic and match player expectations:
greens are exact-position matches; yellows are letters present but misplaced; a letter
that appears twice in a guess must not be marked yellow twice if the answer contains it
once.

## Decision

Two-pass algorithm in the contract:

1. Pass 1: mark exact matches (guess[i] == answer[i]) as green, count remaining answer letters.
2. Pass 2: for non-green positions, if guess[i] is in the remaining-letter count, mark yellow and decrement the count; otherwise gray.

## Consequences

- + Contract feedback == NYT Wordle semantics (verified by unit tests incl. double-letter cases)
- + Frontend can compute identical feedback locally for instant UX
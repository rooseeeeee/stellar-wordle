# ADR-001: Hashed Word Storage (Updated)

**Status:** Superseded (previously: Accepted plaintext storage)  
**Date:** 2026-08-20  

## Context

Previously, the daily word was stored as plaintext in the contract's instance storage. This meant anyone could query the contract storage and reveal the word trivially.

## Decision

The contract now stores the daily word using a **two-layer approach**:

1. **SHA-256 hash** (`WordHash` key) — stored in instance storage, publicly verifiable. Players and observers can verify the word after reveal but cannot derive it from the hash.

2. **Word secret** (`WordSecret` key) — stored in **temporary storage** with a limited TTL (~1-2 days). This is used internally by the contract to compute feedback on guesses. It is NOT exposed through any public contract function.

### Key changes:
- `get_word()` has been **removed** — no public function returns the plaintext word
- `get_word_hash()` returns the SHA-256 hash of the current word
- `verify_word(word)` allows anyone to verify a word matches the stored hash (for post-game verification)
- The word in temporary storage is only accessible internally by `submit_guess` and `evaluate`

## Consequences

- **Security improvement:** The word is not trivially readable through the contract API
- **Limitation:** Temporary storage entries are still visible to ledger explorers who know the storage key structure. For true zero-knowledge hiding, a commit-reveal scheme with player-side hashing would be needed (future enhancement).
- **TTL management:** The word in temporary storage has a ~1-2 day TTL. Each guess extends the TTL to ensure it remains available during active gameplay.
- **Verification:** After the daily word rotates, the admin can reveal the previous word and anyone can verify it against the stored hash.

## Trade-offs

This is a practical middle ground between plaintext (original) and a full commit-reveal scheme (future). It prevents casual cheating through the contract API while maintaining the simple game UX.

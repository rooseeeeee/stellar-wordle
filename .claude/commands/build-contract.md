# /build-contract

Build and test the Soroban wordle contract:

1. `cd contracts/wordle && cargo build --target wasm32v1-none --release`
2. `cargo test`
3. Record WASM sha256 in `deployment.json`
4. Report build + test summary

Log to `data/logs/<date>-@ops.md`.
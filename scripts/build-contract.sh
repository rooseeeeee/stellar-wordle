#!/usr/bin/env bash
# Build the wordle contract and record its WASM hash.
set -euo pipefail
cd "$(dirname "$0")/../contracts/wordle"

echo "==> cargo test"
cargo test

echo "==> cargo build --target wasm32v1-none --release"
cargo build --target wasm32v1-none --release

WASM=target/wasm32v1-none/release/wordle.wasm
echo "==> sha256 of $WASM"
sha256sum "$WASM"

echo "==> done"
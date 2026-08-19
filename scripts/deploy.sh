#!/usr/bin/env bash
# Deploy the wordle contract to Stellar Testnet and record the manifest.
# Usage: scripts/deploy.sh <admin-secret>
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "usage: $0 <admin-secret>" >&2
  exit 1
fi
ADMIN="$1"
ROOT="$(dirname "$0")/.."
WASM="$ROOT/contracts/wordle/target/wasm32v1-none/release/wordle.wasm"

[ -f "$WASM" ] || { echo "missing $WASM — run make build-contract first" >&2; exit 1; }

echo "==> deploying wordle.wasm to testnet"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$ADMIN" \
  --network testnet)

echo "==> __constructor($CONTRACT_ID)"
stellar contract invoke \
  --id "$CONTRACT_ID" --source "$ADMIN" --network testnet \
  -- __constructor "$ADMIN"

HASH=$(sha256sum "$WASM" | cut -d' ' -f1)
echo "CONTRACT_ID=$CONTRACT_ID"
echo "WASM_HASH=$HASH"

node "$ROOT/scripts/record-deployment.mjs" "$CONTRACT_ID" "$HASH"

echo "==> copy frontend/.env.example to frontend/.env.local and set NEXT_PUBLIC_CONTRACT_WORDLE=$CONTRACT_ID"
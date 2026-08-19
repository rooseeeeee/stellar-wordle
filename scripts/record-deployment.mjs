#!/usr/bin/env node
// Record a deployment in deployment.json. Usage: record-deployment.mjs <contract-id> <wasm-hash>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [contractId, wasmHash] = process.argv.slice(2);
if (!contractId || !wasmHash) {
  console.error("usage: record-deployment.mjs <contract-id> <wasm-hash>");
  process.exit(1);
}

const path = join(process.cwd(), "deployment.json");
const manifest = JSON.parse(readFileSync(path, "utf8"));
manifest.contracts.wordle.address = contractId;
manifest.contracts.wordle.wasm_hash = wasmHash;
manifest.contracts.wordle.deployed_at = new Date().toISOString();
writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
console.log(`recorded ${contractId} in deployment.json`);
import { Networks } from "@stellar/stellar-sdk";

export const STELLAR_CONFIG = {
  network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as string) || "testnet",
  rpcUrl:
    (process.env.NEXT_PUBLIC_SOROBAN_RPC as string) ||
    "https://soroban-testnet.stellar.org",
  networkPassphrase:
    (process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE as string) ||
    Networks.TESTNET,
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID as string,
} as const;

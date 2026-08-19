"use client";

import { useCallback } from "react";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { toast } from "sonner";
import { useWallet } from "@/providers/wallet-provider";
import { STELLAR_CONFIG } from "@/lib/stellar-config";

const server = new rpc.Server(STELLAR_CONFIG.rpcUrl);

const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL = 2000;

export function useContract(contractId?: string) {
  const { address } = useWallet();
  const id = contractId || STELLAR_CONFIG.contractId;

  /**
   * Read-only call via simulation (zero fees, no signature).
   */
  const read = useCallback(
    async <T = unknown>(method: string, args: xdr.ScVal[] = []): Promise<T> => {
      const contract = new Contract(id);
      const account = await server.getAccount(
        address || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
      );

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(
          `Simulation failed: ${(sim as rpc.Api.SimulateTransactionErrorResponse).error}`
        );
      }

      const result = (sim as rpc.Api.SimulateTransactionSuccessResponse).result;
      return result?.retval as unknown as T;
    },
    [address, id]
  );

  /**
   * State-changing call: simulate, assemble, sign, submit.
   * Toast notifications for each step. Timeout protection so UI never gets stuck.
   */
  const write = useCallback(
    async <T = unknown>(method: string, args: xdr.ScVal[] = []): Promise<T> => {
      if (!address) {
        toast.error("Wallet not connected", {
          description: "Please connect your wallet to sign transactions.",
        });
        throw new Error("Wallet not connected");
      }

      const contract = new Contract(id);

      let account;
      try {
        account = await server.getAccount(address);
      } catch {
        toast.error("Network error", {
          description: "Could not reach Stellar testnet. Try again.",
        });
        throw new Error("Failed to fetch account");
      }

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      // Simulate
      toast.loading("Preparing transaction...", { id: "tx-progress" });

      let sim;
      try {
        sim = await server.simulateTransaction(tx);
      } catch {
        toast.error("Network timeout", {
          id: "tx-progress",
          description: "Stellar RPC is not responding. Try again in a moment.",
        });
        throw new Error("Simulation timeout");
      }

      if (rpc.Api.isSimulationError(sim)) {
        const errMsg = (sim as rpc.Api.SimulateTransactionErrorResponse).error;
        toast.error("Transaction simulation failed", {
          id: "tx-progress",
          description: errMsg,
        });
        throw new Error(`Simulation failed: ${errMsg}`);
      }

      // Assemble
      const assembled = rpc.assembleTransaction(tx, sim).build();

      // Sign
      toast.loading("Waiting for signature...", { id: "tx-progress" });

      let signedTxXdr: string;
      try {
        const result = await StellarWalletsKit.signTransaction(
          assembled.toXDR(),
          {
            networkPassphrase: STELLAR_CONFIG.networkPassphrase,
            address,
          }
        );
        signedTxXdr = result.signedTxXdr;
      } catch {
        toast.error("Signature rejected", {
          id: "tx-progress",
          description: "Transaction was not signed.",
        });
        throw new Error("User rejected signature");
      }

      // Submit
      toast.loading("Submitting to network...", { id: "tx-progress" });

      let response;
      try {
        const signedTx = TransactionBuilder.fromXDR(
          signedTxXdr,
          STELLAR_CONFIG.networkPassphrase
        );
        response = await server.sendTransaction(signedTx);
      } catch {
        toast.error("Submission failed", {
          id: "tx-progress",
          description: "Could not submit to network. Try again.",
        });
        throw new Error("Transaction submission failed");
      }

      if (response.status === "ERROR") {
        toast.error("Transaction rejected", {
          id: "tx-progress",
          description: "The network rejected the transaction.",
        });
        throw new Error("Transaction submission failed");
      }

      // Poll for completion (with timeout)
      toast.loading("Confirming on chain...", { id: "tx-progress" });

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        try {
          const getResponse = await server.getTransaction(response.hash);

          if (getResponse.status === "SUCCESS") {
            toast.success("Transaction confirmed", {
              id: "tx-progress",
              description: `Hash: ${response.hash.slice(0, 8)}...`,
            });
            return getResponse.returnValue as unknown as T;
          }

          if (getResponse.status === "FAILED") {
            toast.error("Transaction failed on-chain", {
              id: "tx-progress",
              description: "The transaction did not complete successfully.",
            });
            throw new Error("Transaction failed");
          }
        } catch (err) {
          // If it's our own thrown error, re-throw
          if (err instanceof Error && err.message === "Transaction failed") {
            throw err;
          }
          // Otherwise it's a network error during polling, continue
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }

      // If we exhausted attempts, the tx might still confirm eventually
      toast.warning("Confirmation pending", {
        id: "tx-progress",
        description: "Transaction submitted but confirmation is slow. Check explorer.",
      });
      throw new Error("Transaction confirmation timeout");
    },
    [address, id]
  );

  return { read, write };
}

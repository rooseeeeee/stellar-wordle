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
   * State-changing call: simulate → assemble → sign → submit.
   * Shows toast notifications for blockchain interaction feedback.
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
      const account = await server.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      // Simulate
      toast.loading("Preparing transaction...", { id: "tx-progress" });

      const sim = await server.simulateTransaction(tx);
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

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        assembled.toXDR(),
        {
          networkPassphrase: STELLAR_CONFIG.networkPassphrase,
          address,
        }
      );

      // Submit
      toast.loading("Submitting to network...", { id: "tx-progress" });

      const signedTx = TransactionBuilder.fromXDR(
        signedTxXdr,
        STELLAR_CONFIG.networkPassphrase
      );
      const response = await server.sendTransaction(signedTx);

      if (response.status === "ERROR") {
        toast.error("Transaction failed to submit", {
          id: "tx-progress",
          description: "The network rejected the transaction.",
        });
        throw new Error("Transaction submission failed");
      }

      // Poll for completion
      toast.loading("Confirming on chain...", { id: "tx-progress" });

      let getResponse = await server.getTransaction(response.hash);
      while (getResponse.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await server.getTransaction(response.hash);
      }

      if (getResponse.status === "SUCCESS") {
        toast.success("Transaction confirmed", {
          id: "tx-progress",
          description: `Hash: ${response.hash.slice(0, 8)}...`,
        });
        return getResponse.returnValue as unknown as T;
      } else {
        toast.error("Transaction failed on-chain", {
          id: "tx-progress",
          description: "The transaction did not complete successfully.",
        });
        throw new Error("Transaction failed");
      }
    },
    [address, id]
  );

  return { read, write };
}

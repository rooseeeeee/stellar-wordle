"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { STELLAR_CONFIG } from "@/lib/stellar-config";

interface WalletContextValue {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize the kit once on mount
  useEffect(() => {
    if (!initialized) {
      StellarWalletsKit.init({
        modules: [new FreighterModule()],
        network:
          STELLAR_CONFIG.network === "testnet"
            ? Networks.TESTNET
            : Networks.PUBLIC,
      });
      setInitialized(true);
    }
  }, [initialized]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { address: addr } = await StellarWalletsKit.authModal();
      setAddress(addr);
    } catch {
      // User cancelled
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch {
      // Ignore
    }
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, connect, disconnect, isConnecting }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

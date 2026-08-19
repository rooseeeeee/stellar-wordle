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
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { STELLAR_CONFIG } from "@/lib/stellar-config";

const WALLET_STORAGE_KEY = "stellar-wordle-wallet";

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
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Wait for mount before initializing to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize the wallet kit after mount
  useEffect(() => {
    if (!mounted || initialized) return;
    StellarWalletsKit.init({
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new LobstrModule(),
        new HanaModule(),
      ],
      network:
        STELLAR_CONFIG.network === "testnet"
          ? Networks.TESTNET
          : Networks.PUBLIC,
    });
    setInitialized(true);

    // Restore saved address from localStorage
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        setAddress(saved);
      }
    } catch {
      // localStorage unavailable
    }
  }, [mounted, initialized]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { address: addr } = await StellarWalletsKit.authModal();
      setAddress(addr);
      // Persist to localStorage
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, addr);
      } catch {
        // Ignore storage errors
      }
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
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {
      // Ignore
    }
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

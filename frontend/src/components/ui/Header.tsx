"use client";

import { useWallet } from "@/providers/wallet-provider";

export function Header() {
  const { address, connect, disconnect, isConnecting } = useWallet();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
      <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Stellar Wordle
      </h1>
      <div className="flex items-center gap-3">
        {address ? (
          <button
            onClick={disconnect}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono transition-colors"
          >
            {address.slice(0, 4)}...{address.slice(-4)}
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

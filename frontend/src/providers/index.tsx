"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "./wallet-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000, // Data considered fresh for 5s
            refetchOnWindowFocus: true, // Refetch when tab gains focus
            refetchOnReconnect: true, // Refetch on network reconnect
            retry: 2, // Retry failed queries twice
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
        />
      </WalletProvider>
    </QueryClientProvider>
  );
}

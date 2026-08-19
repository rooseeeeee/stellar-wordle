"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "./wallet-provider";
import { DailyWordSync } from "@/components/DailyWordSync";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <DailyWordSync />
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

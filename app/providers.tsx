"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { TransactionProvider } from "ethereum-identity-kit";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a new QueryClient instance
// const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    // <QueryClientProvider client={queryClient}>
      <MiniKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
            theme: "mini-app-theme",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            logo: process.env.NEXT_PUBLIC_ICON_URL,
          },
        }}
      >
        <TransactionProvider>
          {props.children}
        </TransactionProvider>
      </MiniKitProvider>
    // </QueryClientProvider>
  );
}

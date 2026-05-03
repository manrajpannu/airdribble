"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a stable QueryClient per session (not shared across requests)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 30 seconds before a background refetch
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Don't hammer the API on every window focus
            refetchOnWindowFocus: false,
            // Retry 3 times with exponential backoff, but skip 4xx client errors
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
                return false; // Don't retry client errors
              }
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
          mutations: {
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
                return false;
              }
              return failureCount < 2; // Mutations retry up to 2 times
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only appear in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

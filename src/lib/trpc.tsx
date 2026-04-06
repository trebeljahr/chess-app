import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import {
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "../server/router";

export const trpc = createTRPCReact<AppRouter>();

function getHttpUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/trpc`;
  }

  return "http://localhost:3000/trpc";
}

function getWsUrl(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/trpc`;
  }

  return "ws://localhost:3000/trpc";
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const [trpcClient] = useState(() => {
    const wsClient = createWSClient({
      url: getWsUrl()
    });

    return trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({
            client: wsClient,
            transformer: superjson
          }),
          false: httpBatchLink({
            url: getHttpUrl(),
            transformer: superjson,
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include"
              });
            }
          })
        })
      ]
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

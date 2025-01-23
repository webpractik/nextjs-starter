'use client';

import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';

// 30 sec
export const DEFAULT_STALE_TIME = 30_000;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: DEFAULT_STALE_TIME,
            throwOnError: true,
        },
    },
});

type ReactQueryProviderProps = Readonly<{
    children: ReactNode;
    showDevtools?: boolean;
}>;

export function ReactQueryProvider({ children, showDevtools = true }: ReactQueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>

            {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
    );
}

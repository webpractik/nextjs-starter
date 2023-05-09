'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { ReactNode, useState } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        useErrorBoundary: true,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </QueryClientProvider>
    );
}

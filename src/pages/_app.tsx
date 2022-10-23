import '@/assets/styles/index.sass';

import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProps } from 'next/app';
import { NextSeo } from 'next-seo';
import SEO from 'next-seo.config';
import React, { useState } from 'react';

import { StoreProvider } from '@/hooks/useStore';

type PageProps = { dehydratedState: unknown };

function MyApp({ Component, pageProps }: AppProps<PageProps>) {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
                <StoreProvider>
                    <NextSeo {...SEO} />
                    <Component {...pageProps} />
                </StoreProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </Hydrate>
        </QueryClientProvider>
    );
}

// Раскомментируйте этот метод только в том случае, если у вас есть необходимость
// передавать данные для каждой страницы приложения.
// Это отключает возможность выполнять автоматическую статическую оптимизацию,
// в результате чего каждая страница в вашем приложении обрабатывается на стороне сервера.

// MyApp.getInitialProps = async (appContext: AppContext) => {
//     const appProps = await App.getInitialProps(appContext);
//     return { ...appProps };
// };

export default MyApp;

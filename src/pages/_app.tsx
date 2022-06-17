import 'normalize.css';

import { AppProps } from 'next/app';
import React from 'react';

import { StoreProvider } from '@/hooks/useStore';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <StoreProvider {...pageProps}>
            <Component {...pageProps} />
        </StoreProvider>
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

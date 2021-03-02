import 'normalize.css';

import React from 'react';

import { StoreProvider } from '@/hooks/useStore';

const App = ({ Component, pageProps }) => (
    <StoreProvider {...pageProps}>
        <Component {...pageProps} />
    </StoreProvider>
);

export const reportWebVitals = (metrics: { label: string; name: string; value: number }) => {
    if (metrics.label === 'web-vital') {
        console.log({ name: metrics.name, value: Math.trunc(metrics.value) });
    }
};

export default App;

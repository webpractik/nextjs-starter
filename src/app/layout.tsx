import '@/styles/index.sass';

// eslint-disable-next-line camelcase
import { Vina_Sans } from 'next/font/google';
import React, { ReactNode } from 'react';

import ReactQueryProvider from '@/providers/react-query';
import StoreProvider from '@/providers/store';

export const metadata = {
    title: 'Nextjs Starter',
    description: 'Default starter for projects',
};

const vinaSans = Vina_Sans({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
    style: 'normal',
    fallback: [
        'system-ui',
        'Segoe UI',
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
    ],
    variable: '--font-vina-sans',
});

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ru" className={`${vinaSans.variable}`}>
            <body>
                <main>
                    <ReactQueryProvider>
                        <StoreProvider>{children}</StoreProvider>
                    </ReactQueryProvider>
                </main>
            </body>
        </html>
    );
}
